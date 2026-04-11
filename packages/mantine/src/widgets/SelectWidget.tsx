import { FocusEvent, useCallback, useMemo } from 'react';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { Select, MultiSelect } from '@mantine/core';

import { cleanupOptions } from '../utils';

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const {
    id,
    htmlName,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    multiple,
    rawErrors,
    options,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = options.optionValueFormat ?? 'indexed';
  const themeProps = cleanupOptions(options);

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!disabled && !readonly && onChange) {
        onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onChange, disabled, readonly, enumOptions, emptyValue, optionValueFormat],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue, optionValueFormat],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue, optionValueFormat],
  );

  const selectOptions = useMemo(() => {
    if (Array.isArray(enumOptions)) {
      return enumOptions.map((option, index) => ({
        key: String(index),
        value: enumOptionValueEncoder(option.value, index, optionValueFormat),
        label: option.label,
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1,
      }));
    }
    return [];
  }, [enumDisabled, enumOptions, optionValueFormat]);

  const Component = multiple ? MultiSelect : Select;

  return (
    <Component
      id={id}
      name={htmlName || id}
      label={labelValue(label || undefined, hideLabel, false)}
      data={selectOptions}
      value={enumOptionSelectedValue<S>(value, enumOptions, !!multiple, optionValueFormat, multiple ? [] : null) as any}
      onChange={!readonly ? handleChange : undefined}
      onBlur={!readonly ? handleBlur : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      autoFocus={autofocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      required={required}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      searchable
      {...themeProps}
      aria-describedby={ariaDescribedByIds(id)}
      comboboxProps={{ withinPortal: false }}
    />
  );
}
