import { ChangeEvent, FocusEvent, useMemo } from 'react';
import {
  ariaDescribedByIds,
  EnumOptionsType,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { OptionsOrGroups } from 'chakra-react-select';
import { createListCollection, NativeSelect as ChakraSelect } from '@chakra-ui/react';

import { Field } from '../components/ui/field';

/**
 * NativeSelectWidget is a React component that renders a native select input.
 *
 * @param {T} T - The type of the value.
 * @param {S} S - The type of the schema.
 * @param {F} F - The type of the form context.
 * @param {WidgetProps<T, S, F>} props - The props for the component.
 *
 * @returns {JSX.Element} - The rendered component.
 */
export default function NativeSelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
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
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
    return onChange(enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));
  };

  const _onBlur = ({ target }: FocusEvent<HTMLSelectElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));

  const _onFocus = ({ target }: FocusEvent<HTMLSelectElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));

  const showPlaceholderOption = !multiple && schema.default === undefined;
  const { valueLabelMap, displayEnumOptions } = useMemo((): {
    valueLabelMap: Record<string | number, string>;
    displayEnumOptions: OptionsOrGroups<any, any>;
  } => {
    const valueLabelMap: Record<string | number, string> = {};
    let displayEnumOptions: OptionsOrGroups<any, any> = [];
    if (Array.isArray(enumOptions)) {
      displayEnumOptions = enumOptions.map((option: EnumOptionsType<S>, index: number) => {
        const { value, label } = option;
        valueLabelMap[index] = label || String(value);
        return {
          label,
          value: String(index),
          disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
        };
      });
      if (showPlaceholderOption) {
        (displayEnumOptions as any[]).unshift({ value: '', label: placeholder || '' });
      }
    }
    return { valueLabelMap: valueLabelMap, displayEnumOptions: displayEnumOptions };
  }, [enumDisabled, enumOptions, placeholder, showPlaceholderOption]);

  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions, false);

  const getSingleValue = () =>
    typeof selectedIndex !== 'undefined'
      ? [
          {
            label: valueLabelMap[selectedIndex as string] || '',
            value: selectedIndex.toString(),
          },
        ]
      : [];

  const formValue = getSingleValue()[0]?.value || '';

  const selectOptions = createListCollection({
    items: displayEnumOptions.filter((item) => item.value),
  });

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={rawErrors && rawErrors.length > 0}
      label={labelValue(label, hideLabel || !label)}
    >
      <ChakraSelect.Root>
        <ChakraSelect.Field
          id={id}
          onBlur={_onBlur}
          onChange={_onChange}
          onFocus={_onFocus}
          autoFocus={autofocus}
          value={formValue}
          aria-describedby={ariaDescribedByIds<T>(id)}
        >
          {selectOptions.items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </ChakraSelect.Field>
        <ChakraSelect.Indicator />
      </ChakraSelect.Root>
    </Field>
  );
}
