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
      const resolved = useRealValues
        ? multiple
          ? newValue
          : newValue || optEmptyVal
        : enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal);
      return onFocus(id, resolved);
    },
    [onFocus, id, multiple, enumOptions, optEmptyVal, useRealValues],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      const resolved = useRealValues
        ? multiple
          ? newValue
          : newValue || optEmptyVal
        : enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal);
      return onBlur(id, resolved);
    },
    [onBlur, id, multiple, enumOptions, optEmptyVal, useRealValues],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      const resolved = useRealValues
        ? multiple
          ? newValue
          : newValue || optEmptyVal
        : enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal);
      return onChange(resolved);
    },
    [onChange, multiple, enumOptions, optEmptyVal, useRealValues],
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);
  const showPlaceholderOption = !multiple && schema.default === undefined;

  let selectValue;
  if (useRealValues) {
    selectValue = isEmpty ? emptyValue : multiple ? value.map(String) : String(value);
  } else {
    selectValue = typeof selectedIndexes === 'undefined' ? emptyValue : selectedIndexes;
  }

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
