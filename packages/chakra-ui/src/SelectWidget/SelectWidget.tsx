import { useCallback, useMemo, useRef } from 'react';
import type { SelectValueChangeDetails } from '@chakra-ui/react';
import { createListCollection, Select as ChakraSelect } from '@chakra-ui/react';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  flattenGroupedOptions,
  getOptionValueFormat,
  groupEnumOptions,
  hasVisibleErrors,
  isEnumOptionsGroup,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
  useSelectFocusHandlers,
} from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { SelectRoot, SelectTrigger, SelectValueText } from '../components/ui/select.tsx';
import { getChakra } from '../utils.ts';

export default function SelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
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
    schema,
    uiSchema,
    'aria-label': ariaLabel,
  } = props;
  const { enumOptions, enumDisabled, emptyValue, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = useMemo(
    () => enumOptionsDomValues<S>(enumOptions, optionValueFormat),
    [enumOptions, optionValueFormat],
  );

  const handleMultiChange = ({ value: newValue }: SelectValueChangeDetails) =>
    onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, emptyValue));

  const handleSingleChange = ({ value: newValue }: SelectValueChangeDetails) => {
    const selected = enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, emptyValue);
    onChange(Array.isArray(selected) && selected.length === 1 ? selected[0] : selected);
  };

  // The focused element is the trigger button, which carries no option value
  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>(props);

  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const toItem = useCallback(
    (option: IndexedEnumOptionType<S>) => ({
      label: option.label,
      value: domValues[option.index],
      disabled: option.disabled,
    }),
    [domValues],
  );

  const groupedOptions = useMemo(
    () => groupEnumOptions<S>(enumOptions, optgroups, enumDisabled),
    [enumDisabled, enumOptions, optgroups],
  );

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
      invalid={hasVisibleErrors(props)}
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
          <SelectTrigger aria-label={ariaLabel}>
            <SelectValueText placeholder={placeholder} />
          </SelectTrigger>
        </ChakraSelect.Control>
        <ChakraSelect.Positioner minWidth='100% !important' zIndex='2 !important' top='calc(100% + 5px) !important'>
          <ChakraSelect.Content>
            {groupedOptions.map((option) =>
              isEnumOptionsGroup<S>(option) ? (
                <ChakraSelect.ItemGroup key={`optgroup-${option.label}`}>
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
