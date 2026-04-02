import { FocusEvent, useCallback, useMemo } from 'react';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIndexForValue,
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
  const useRealValues = !!options.useRealOptionValues;
  const themeProps = cleanupOptions(options);

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!disabled && !readonly && onChange) {
        onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, useRealValues, emptyValue));
      }
    },
    [onChange, disabled, readonly, enumOptions, emptyValue, useRealValues],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue, useRealValues],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue, useRealValues],
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  const selectOptions = useMemo(() => {
    if (Array.isArray(enumOptions)) {
      return enumOptions.map((option, index) => ({
        key: String(index),
        value: enumOptionValueEncoder(option.value, index, useRealValues),
        label: option.label,
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1,
      }));
    }
    return [];
  }, [enumDisabled, enumOptions, useRealValues]);

  const Component = multiple ? MultiSelect : Select;

  return (
    <Component
      id={id}
      name={htmlName || id}
      label={labelValue(label || undefined, hideLabel, false)}
      data={selectOptions}
      value={multiple ? (selectedIndexes as any) : (selectedIndexes as string)}
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
