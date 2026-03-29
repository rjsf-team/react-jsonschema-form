import { ChangeEvent, FocusEvent } from 'react';
import FormSelect from 'react-bootstrap/FormSelect';
import {
  ariaDescribedByIds,
  FormContextType,
  enumOptionsValueForIndex,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

/** Reads the data-index attribute from selected options to resolve typed enum values
 *  via enumOptionsValueForIndex, while keeping real values in the standard value attribute
 *  for native form submission.
 */
function getSelectedIndex(event: FocusEvent | ChangeEvent | any, multiple?: boolean) {
  const select = event.target as HTMLSelectElement;
  if (multiple) {
    return [].slice
      .call(select.options as any)
      .filter((o: any) => o.selected)
      .map((o: any) => o.dataset.index ?? o.value);
  }
  const selectedOption = select.options[select.selectedIndex];
  return selectedOption?.dataset.index ?? select.value;
}

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
  id,
  htmlName,
  options,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  rawErrors = [],
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue } = options;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);
  const showPlaceholderOption = !multiple && schema.default === undefined;
  let selectValue = emptyValue;
  if (!isEmpty) {
    selectValue = multiple ? value.map(String) : String(value);
  }

  return (
    <FormSelect
      id={id}
      name={htmlName || id}
      value={selectValue}
      required={required}
      multiple={multiple}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      className={rawErrors.length > 0 ? 'is-invalid' : ''}
      onBlur={
        onBlur &&
        ((event: FocusEvent) => {
          const newValue = getSelectedIndex(event, multiple);
          onBlur(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue));
        })
      }
      onFocus={
        onFocus &&
        ((event: FocusEvent) => {
          const newValue = getSelectedIndex(event, multiple);
          onFocus(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue));
        })
      }
      onChange={(event: ChangeEvent) => {
        const newValue = getSelectedIndex(event, multiple);
        onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue));
      }}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {showPlaceholderOption && <option value=''>{placeholder}</option>}
      {(enumOptions as any).map(({ value, label }: any, i: number) => {
        const disabled: any = Array.isArray(enumDisabled) && (enumDisabled as any).indexOf(value) != -1;
        return (
          <option key={i} id={label} value={String(value)} data-index={String(i)} disabled={disabled}>
            {label}
          </option>
        );
      })}
    </FormSelect>
  );
}
