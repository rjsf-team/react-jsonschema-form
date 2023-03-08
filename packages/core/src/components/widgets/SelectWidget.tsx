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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const emptyValue = multiple ? [] : '';

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onFocus(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onFocus, id, schema, multiple, options]
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onBlur(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onBlur, id, schema, multiple, options]
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onChange, schema, multiple, options]
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  return (
    <select
      id={id}
      name={id}
      multiple={multiple}
      className='form-control'
      value={typeof selectedIndexes === 'undefined' ? emptyValue : selectedIndexes}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onChange={handleChange}
      aria-describedby={ariaDescribedByIds<T>(id)}
    >
      {!multiple && schema.default === undefined && <option value=''>{placeholder}</option>}
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value, label }, i) => {
          const disabled = enumDisabled && enumDisabled.indexOf(value) !== -1;
          return (
            <option key={i} value={String(i)} disabled={disabled}>
              {label}
            </option>
          );
        })}
    </select>
  );
}

export default SelectWidget;
