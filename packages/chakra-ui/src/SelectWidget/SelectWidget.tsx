import { useCallback, useMemo, useRef } from 'react';
import type { SelectValueChangeDetails } from '@chakra-ui/react';
import { createListCollection, Select as ChakraSelect } from '@chakra-ui/react';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  fieldLabelId,
  flattenGroupedOptions,
  getOptionValueFormat,
  groupEnumOptions,
  hasWidgetErrors,
  isEnumOptionsGroup,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
  useSelectFocusHandlers,
  widgetAriaProps,
  widgetDrawsLabel,
} from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { SelectRoot, SelectTrigger, SelectValueText } from '../components/ui/select.tsx';
import { getChakra, labelledByOrNone } from '../utils.ts';

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
    placeholder,
    multiple,
    required,
    disabled,
    readonly,
    value,
    autofocus,
    onChange,
    schema,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const labelId = fieldLabelId(id);
  const drawsLabel = !hideLabel && !!label;
  const ariaProps = widgetAriaProps(props);
  const labelledBy = labelledByOrNone(ariaProps['aria-labelledby'], drawsLabel);
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
  const formValue = [enumOptionSelectedValue(value, enumOptions, isMultiple, optionValueFormat, isMultiple ? [] : '')]
    .flat()
    .filter((v) => v !== '');

  const selectOptions = useMemo(
    () => createListCollection({ items: flattenGroupedOptions<S>(groupedOptions).map(toItem) }),
    [groupedOptions, toItem],
  );

  const containerRef = useRef(null);
  const chakraProps = getChakra(options);

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
      invalid={hasWidgetErrors<T, S, F>(props)}
      label={labelValue(label, !drawsLabel)}
      id={id}
      ids={{ label: labelId }}
      position='relative'
      {...chakraProps}
    >
      <SelectedOptionDescription {...props} />
      <SelectRoot
        collection={selectOptions}
        id={id}
        // The trigger, which a user focuses, carries the field's id, so the label's `for` names it. Ark's own ids replace
        // the field's, so the label's is restated
        ids={{ trigger: id, label: labelId }}
        name={htmlName || id}
        multiple={isMultiple}
        closeOnSelect={!isMultiple}
        onBlur={handleBlur}
        onValueChange={isMultiple ? handleMultiChange : handleSingleChange}
        onFocus={handleFocus}
        autoFocus={autofocus}
        value={formValue}
        positioning={{ placement: 'bottom' }}
      >
        <SelectTrigger {...ariaProps} aria-labelledby={labelledBy}>
          <SelectValueText placeholder={placeholder} />
        </SelectTrigger>
        <ChakraSelect.Positioner minWidth='100% !important' zIndex='2 !important' top='calc(100% + 5px) !important'>
          <ChakraSelect.Content aria-labelledby={labelledBy}>
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
