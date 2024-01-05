import {
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';

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
  id,
  options,
  required,
  disabled,
  placeholder,
  label,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
  hideLabel,
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

  const theLabel = labelValue(label, hideLabel);

  return (
    <FormControl error={rawErrors.length > 0} disabled={disabled || readonly} required={required}>
      <FormLabel id={`select-${id}-label`} htmlFor={`select-${id}-button`}>
        {theLabel}
      </FormLabel>
      <Select
        id={id}
        name={id}
        multiple={multiple}
        value={!isEmpty && typeof selectedIndexes !== 'undefined' ? selectedIndexes : emptyValue}
        autoFocus={autofocus}
        placeholder={placeholder}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        slotProps={{
          button: {
            id: `select-${id}-button`,
            // TODO: Material UI set aria-labelledby correctly & automatically
            // but Base UI and Joy UI don't yet.
            'aria-labelledby': `select-${id}-label select-${id}-button`,
          },
        }}
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
    </FormControl>
  );
}
