import type { FocusEvent } from 'react';
import { useMemo, useRef } from 'react';
import type { SelectValueChangeDetails } from '@chakra-ui/react';
import { createListCollection, Select as ChakraSelect } from '@chakra-ui/react';
import type { EnumOptionsType, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  labelValue,
} from '@rjsf/utils';
import type { OptionsOrGroups } from 'chakra-react-select';

import { Field } from '../components/ui/field';
import { SelectRoot, SelectTrigger, SelectValueText } from '../components/ui/select';
import { getChakra } from '../utils';

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
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const _onMultiChange = ({ value: newValue }: SelectValueChangeDetails) =>
    onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, emptyValue));

  const _onSingleChange = ({ value: newValue }: SelectValueChangeDetails) => {
    const selected = enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, emptyValue);
    return onChange(Array.isArray(selected) && selected.length === 1 ? selected[0] : selected);
  };

  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));

  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));

  const showPlaceholderOption = !multiple && schema.default === undefined;
  const displayEnumOptions = useMemo((): OptionsOrGroups<any, any> => {
    let computedOptions: OptionsOrGroups<any, any> = [];
    if (Array.isArray(enumOptions)) {
      computedOptions = enumOptions.map((option: EnumOptionsType<S>, index: number) => {
        const { value: enumValue, label: enumLabel } = option;
        return {
          label: enumLabel,
          value: enumOptionValueEncoder(enumValue, index, optionValueFormat),
          disabled: Array.isArray(enumDisabled) && enumDisabled.includes(enumValue),
        };
      });
      if (showPlaceholderOption) {
        (computedOptions as any[]).unshift({ value: '', label: placeholder || '' });
      }
    }
    return computedOptions;
  }, [enumDisabled, enumOptions, placeholder, showPlaceholderOption, optionValueFormat]);

  const isMultiple = typeof multiple !== 'undefined' && multiple && Boolean(enumOptions);

  // Chakra's SelectRoot always expects a string array, so flatten the helper's
  // single/multiple return shape and strip the empty-single case.
  const formValue = [
    enumOptionSelectedValue<S>(value, enumOptions, isMultiple, optionValueFormat, isMultiple ? [] : ''),
  ]
    .flat()
    .filter((v) => v !== '') as string[];

  const selectOptions = createListCollection({
    items: displayEnumOptions.filter((item) => item.value),
  });

  const containerRef = useRef(null);
  const chakraProps = getChakra({ uiSchema });

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
      <SelectRoot
        collection={selectOptions}
        id={id}
        name={htmlName || id}
        multiple={isMultiple}
        closeOnSelect={!isMultiple}
        onBlur={_onBlur}
        onValueChange={isMultiple ? _onMultiChange : _onSingleChange}
        onFocus={_onFocus}
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
            {selectOptions.items.map((item) => (
              <ChakraSelect.Item item={item} key={item.value}>
                {item.label}
                <ChakraSelect.ItemIndicator />
              </ChakraSelect.Item>
            ))}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </SelectRoot>
    </Field>
  );
}
