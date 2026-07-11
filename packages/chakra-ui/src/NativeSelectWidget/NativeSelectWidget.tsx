import type { ChangeEvent, FocusEvent } from 'react';
import { useMemo } from 'react';
import { createListCollection, NativeSelect } from '@chakra-ui/react';
import type { EnumOptionsType, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';
import type { OptionsOrGroups } from 'chakra-react-select';

import { Field } from '../components/ui/field';
import { getChakra } from '../utils';

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
    uiSchema,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;

  const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) =>
    onChange(enumOptionsValueForIndex<S>(target?.value, enumOptions, emptyValue));

  const handleBlur = ({ target }: FocusEvent<HTMLSelectElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target?.value, enumOptions, emptyValue));

  const handleFocus = ({ target }: FocusEvent<HTMLSelectElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target?.value, enumOptions, emptyValue));

  const showPlaceholderOption = !multiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);
  const { valueLabelMap, displayEnumOptions } = useMemo((): {
    valueLabelMap: Record<string | number, string>;
    displayEnumOptions: OptionsOrGroups<any, any>;
  } => {
    const computedValueLabelMap: Record<string | number, string> = {};
    let computedOptions: OptionsOrGroups<any, any> = [];
    if (Array.isArray(enumOptions)) {
      computedOptions = enumOptions.map((option: EnumOptionsType<S>, index: number) => {
        const { value: enumValue, label: enumLabel } = option;
        computedValueLabelMap[index] = enumLabel || String(enumValue);
        return {
          label: enumLabel,
          value: String(index),
          disabled: Array.isArray(enumDisabled) && enumDisabled.includes(enumValue),
        };
      });
    }
    return { valueLabelMap: computedValueLabelMap, displayEnumOptions: computedOptions };
  }, [enumDisabled, enumOptions]);

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

  const chakraProps = getChakra({ uiSchema });

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={rawErrors && rawErrors.length > 0}
      label={labelValue(label, hideLabel || !label)}
      {...chakraProps}
    >
      <SelectedOptionDescription {...props} />
      <NativeSelect.Root>
        <NativeSelect.Field
          id={id}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          autoFocus={autofocus}
          value={formValue}
          aria-describedby={ariaDescribedByIds(id)}
        >
          {showPlaceholderOption ? (
            <option value='' disabled hidden>
              {placeholder || ''}
            </option>
          ) : undefined}
          {selectOptions.items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field>
  );
}
