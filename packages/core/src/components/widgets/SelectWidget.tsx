import { ChangeEvent, FocusEvent, SyntheticEvent, useCallback } from 'react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

function getValue(event: SyntheticEvent<HTMLSelectElement>, multiple: boolean) {
  if (multiple) {
    return Array.from((event.target as HTMLSelectElement).options)
      .slice()
      .filter((o) => o.selected)
      .map((o) => o.value);
  }
  return (event.target as HTMLSelectElement).value;
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  schema,
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  multiple = false,
  autofocus = false,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  htmlName,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const emptyValue = multiple ? [] : '';
  const useRealValues = !!htmlName;

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      if (useRealValues) {
        return onFocus(id, multiple ? newValue : newValue || optEmptyVal);
      }
      return onFocus(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onFocus, id, multiple, enumOptions, optEmptyVal, useRealValues],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      if (useRealValues) {
        return onBlur(id, multiple ? newValue : newValue || optEmptyVal);
      }
      return onBlur(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onBlur, id, multiple, enumOptions, optEmptyVal, useRealValues],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      if (useRealValues) {
        return onChange(multiple ? newValue : newValue || optEmptyVal);
      }
      return onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onChange, multiple, enumOptions, optEmptyVal, useRealValues],
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);
  const showPlaceholderOption = !multiple && schema.default === undefined;

  const selectValue = useRealValues
    ? isEmpty
      ? emptyValue
      : multiple
        ? value.map(String)
        : String(value)
    : typeof selectedIndexes === 'undefined'
      ? emptyValue
      : selectedIndexes;

  return (
    <select
      id={id}
      name={htmlName || id}
      multiple={multiple}
      role='combobox'
      className='form-control'
      value={selectValue}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onChange={handleChange}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {showPlaceholderOption && <option value=''>{placeholder}</option>}
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value, label }, i) => {
          const disabled = enumDisabled && enumDisabled.indexOf(value) !== -1;
          return (
            <option key={i} value={useRealValues ? String(value) : String(i)} disabled={disabled}>
              {label}
            </option>
          );
        })}
    </select>
  );
}

export default SelectWidget;
