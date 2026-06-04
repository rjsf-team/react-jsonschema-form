import type { ChangeEvent, FocusEvent, SyntheticEvent } from 'react';
import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
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
  const optionValueFormat = getOptionValueFormat(options);

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onFocus(id, enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
    },
    [onFocus, id, multiple, enumOptions, optEmptyVal, optionValueFormat],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onBlur(id, enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
    },
    [onBlur, id, multiple, enumOptions, optEmptyVal, optionValueFormat],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
    },
    [onChange, multiple, enumOptions, optEmptyVal, optionValueFormat],
  );

  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, multiple, optionValueFormat, emptyValue);
  const showPlaceholderOption = !multiple && schema.default === undefined;

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
        enumOptions.map(({ value: enumValue, label: enumLabel }, i) => {
          const isDisabled = enumDisabled && enumDisabled.includes(enumValue);
          return (
            <option
              key={String(enumValue)}
              value={enumOptionValueEncoder(enumValue, i, optionValueFormat)}
              disabled={isDisabled}
            >
              {enumLabel}
            </option>
          );
        })}
    </select>
  );
}

export default SelectWidget;
