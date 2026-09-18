import type { FocusEvent } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import type { SelectValueChangeDetails } from '@chakra-ui/react';
import { createListCollection, Select as ChakraSelect } from '@chakra-ui/react';
import type {
  FormContextType,
  GroupedEnumOptionsType,
  IndexedEnumOptionType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  flattenGroupedOptions,
  getOptionValueFormat,
  groupEnumOptions,
  isEnumOptionsGroup,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { SelectRoot, SelectTrigger, SelectValueText } from '../components/ui/select.tsx';
import { getChakra } from '../utils.ts';

export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const {
    id,
    htmlName,
    options,
    label,
    hideLabel,
    placeholder,
    multiple,
    required,
    disabled,
    readonly,
    value,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
    schema,
    uiSchema,
  } = props;
  const { enumOptions, enumDisabled, emptyValue, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const handleMultiChange = ({ value: newValue }: SelectValueChangeDetails) =>
    onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, emptyValue));

  const handleSingleChange = ({ value: newValue }: SelectValueChangeDetails) => {
    const selected = enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, emptyValue);
    return onChange(Array.isArray(selected) && selected.length === 1 ? selected[0] : selected);
  };

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const toItem = useCallback(
    (option: IndexedEnumOptionType<S>) => ({
      label: option.label,
      value: enumOptionValueEncoder(option.value, option.index, optionValueFormat),
      disabled: option.disabled,
    }),
    [optionValueFormat],
  );

  const groupedOptions = useMemo(() => {
    // `realValue` encodes '' and null as '', which `enumOptionValueDecoder` reads as "no selection", so an option
    // encoded that way can never be picked.
    const isSelectable = (option: IndexedEnumOptionType<S>) =>
      enumOptionValueEncoder(option.value, option.index, optionValueFormat) !== '';
    return groupEnumOptions<S>(enumOptions, optgroups, enumDisabled).flatMap((item): GroupedEnumOptionsType<S>[] => {
      if (!isEnumOptionsGroup<S>(item)) {
        return isSelectable(item) ? [item] : [];
      }
      const selectableOptions = item.options.filter(isSelectable);
      return selectableOptions.length > 0 ? [{ ...item, options: selectableOptions }] : [];
    });
  }, [enumDisabled, enumOptions, optgroups, optionValueFormat]);

  const isMultiple = typeof multiple !== 'undefined' && multiple && Boolean(enumOptions);

  // Chakra's SelectRoot always expects a string array, so flatten the helper's
  // single/multiple return shape and strip the empty-single case.
  const formValue = [
    enumOptionSelectedValue<S>(value, enumOptions, isMultiple, optionValueFormat, isMultiple ? [] : ''),
  ]
    .flat()
    .filter((v) => v !== '') as string[];

  const selectOptions = useMemo(
    () => createListCollection({ items: flattenGroupedOptions<S>(groupedOptions).map(toItem) }),
    [groupedOptions, toItem],
  );

  const containerRef = useRef(null);
  const chakraProps = getChakra({ uiSchema });

  function renderItem(option: IndexedEnumOptionType<S>) {
    const item = toItem(option);
    return (
      <ChakraSelect.Item item={item} key={item.value}>
        {item.label}
        <ChakraSelect.ItemIndicator />
      </ChakraSelect.Item>
    );
  }

  return (
    <Field
      ref={containerRef}
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={rawErrors && rawErrors.length > 0}
      label={labelValue(label, hideLabel || !label)}
      position='relative'
      {...chakraProps}
    >
      <SelectedOptionDescription {...props} />
      <SelectRoot
        collection={selectOptions}
        id={id}
        name={htmlName || id}
        multiple={isMultiple}
        closeOnSelect={!isMultiple}
        onBlur={handleBlur}
        onValueChange={isMultiple ? handleMultiChange : handleSingleChange}
        onFocus={handleFocus}
        autoFocus={autofocus}
        value={formValue}
        aria-describedby={ariaDescribedByIds(id)}
        positioning={{ placement: 'bottom' }}
      >
        <ChakraSelect.Control>
          <SelectTrigger>
            <SelectValueText placeholder={placeholder} />
          </SelectTrigger>
        </ChakraSelect.Control>
        <ChakraSelect.Positioner minWidth='100% !important' zIndex='2 !important' top='calc(100% + 5px) !important'>
          <ChakraSelect.Content>
            {groupedOptions.map((option) =>
              isEnumOptionsGroup<S>(option) ? (
                <ChakraSelect.ItemGroup key={option.label}>
                  <ChakraSelect.ItemGroupLabel>{option.label}</ChakraSelect.ItemGroupLabel>
                  {option.options.map(renderItem)}
                </ChakraSelect.ItemGroup>
              ) : (
                renderItem(option)
              ),
            )}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </SelectRoot>
    </Field>
  );
}
