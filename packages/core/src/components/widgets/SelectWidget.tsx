import { ChangeEvent, FocusEvent, SyntheticEvent, useCallback } from 'react';
import {
  ariaDescribedByIds,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

/** Reads the data-index attribute from selected options to resolve typed enum values
 *  via enumOptionsValueForIndex, while keeping real values in the standard value attribute
 *  for native form submission.
 */
function getSelectedIndex(event: SyntheticEvent<HTMLSelectElement>, multiple: boolean) {
  const select = event.target as HTMLSelectElement;
  if (multiple) {
    return Array.from(select.options)
      .slice()
      .filter((o) => o.selected)
      .map((o) => o.dataset.index ?? o.value);
  }
  const selectedOption = select.options[select.selectedIndex];
  return selectedOption?.dataset.index ?? select.value;
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

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getSelectedIndex(event, multiple);
      return onFocus(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onFocus, id, multiple, enumOptions, optEmptyVal],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getSelectedIndex(event, multiple);
      return onBlur(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onBlur, id, multiple, enumOptions, optEmptyVal],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = getSelectedIndex(event, multiple);
      return onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onChange, multiple, enumOptions, optEmptyVal],
  );

  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);
  const showPlaceholderOption = !multiple && schema.default === undefined;
  let selectValue = emptyValue;
  if (!isEmpty) {
    selectValue = multiple ? value.map(String) : String(value);
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
            <option key={i} value={String(value)} data-index={String(i)} disabled={disabled}>
              {label}
            </option>
          );
        })}
    </select>
  );
}

export default SelectWidget;
