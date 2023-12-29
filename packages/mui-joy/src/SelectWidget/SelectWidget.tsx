import {
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  schema,
  id,
  name, // remove this from textFieldProps
  options,
  label,
  hideLabel,
  required,
  disabled,
  placeholder,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
  registry,
  uiSchema,
  hideError,
  formContext,
  ...textFieldProps
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;

  multiple = typeof multiple === 'undefined' ? false : !!multiple;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);

  const _onChange = (
    _event:
      | React.MouseEvent<Element, MouseEvent>
      | React.KeyboardEvent<Element>
      | React.FocusEvent<Element, Element>
      | null,
    newValue: any
  ) => onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
  const _onBlur = (event: any) => onBlur(id, enumOptionsValueForIndex<S>(event.target.value, enumOptions, optEmptyVal));
  const _onFocus: React.FocusEventHandler<HTMLButtonElement> = (event) =>
    onFocus(id, enumOptionsValueForIndex<S>(event.target.value, enumOptions, optEmptyVal));
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  return (
    <>
      <Select
        id={id}
        name={id}
        multiple={multiple}
        value={!isEmpty && typeof selectedIndexes !== 'undefined' ? selectedIndexes : emptyValue}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        placeholder={placeholder}
        color={rawErrors.length > 0 ? 'danger' : 'primary'}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map(({ value, label }, i: number) => {
            const disabled: boolean = Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1;
            return (
              <Option key={i} value={String(i)} disabled={disabled}>
                {label}
              </Option>
            );
          })}
      </Select>
    </>
  );
}
