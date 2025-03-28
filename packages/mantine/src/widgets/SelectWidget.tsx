import React, { useCallback, useMemo } from 'react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { Select, MultiSelect } from '@mantine/core';

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
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

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!disabled && !readonly && onChange) {
        onChange(enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
      }
    },
    [onChange, disabled, readonly, enumOptions, emptyValue]
  );

  const handleBlur = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue]
  );

  const handleFocus = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue]
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  const selectOptions = useMemo(() => {
    if (Array.isArray(enumOptions)) {
      return enumOptions.map((option, index) => ({
        key: String(index),
        value: String(index),
        label: option.label,
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1,
      }));
    }
    return [];
  }, [enumDisabled, enumOptions]);

  const Component = multiple ? MultiSelect : Select;

  return (
    <Component
      id={id}
      name={id}
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
      {...options}
      aria-describedby={ariaDescribedByIds<T>(id)}
      comboboxProps={{ withinPortal: false }}
      classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
    />
  );
}
