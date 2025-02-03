import { FocusEvent } from 'react';
import { Dropdown } from 'primereact/dropdown';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { MultiSelect } from 'primereact/multiselect';

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const multiple = typeof props.multiple === 'undefined' ? false : props.multiple;

  return multiple ? <MultiSelectWidget {...props} /> : <SingleSelectWidget {...props} />;
}

function SingleSelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  schema,
  id,
  name, // remove this from dropdownProps
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
  errorSchema,
  rawErrors = [],
  registry,
  uiSchema,
  hideError,
  formContext,
  ...dropdownProps
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;

  multiple = typeof multiple === 'undefined' ? false : multiple;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);

  const _onChange = (e: { value: any }) => onChange(enumOptionsValueForIndex<S>(e.value, enumOptions, optEmptyVal));
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal));
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const { ...dropdownRemainingProps } = dropdownProps;

  return (
    <Dropdown
      id={id}
      name={id}
      value={!isEmpty && typeof selectedIndexes !== 'undefined' ? selectedIndexes : emptyValue}
      options={(enumOptions ?? []).map(({ value, label }, i: number) => ({
        label,
        value: String(i),
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
      }))}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      aria-describedby={ariaDescribedByIds<T>(id)}
      {...dropdownRemainingProps}
    />
  );
}

function MultiSelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  options,
  disabled,
  placeholder,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;

  multiple = typeof multiple === 'undefined' ? false : multiple;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);

  const _onChange = (e: { value: any }) => onChange(enumOptionsValueForIndex<S>(e.value, enumOptions, optEmptyVal));
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal));
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  return (
    <MultiSelect
      id={id}
      name={id}
      value={!isEmpty && typeof selectedIndexes !== 'undefined' ? selectedIndexes : emptyValue}
      options={(enumOptions ?? []).map(({ value, label }, i: number) => ({
        label,
        value: String(i),
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
      }))}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      display={options.display === 'chip' ? 'chip' : 'comma'}
      aria-describedby={ariaDescribedByIds<T>(id)}
      pt={{ root: { style: { position: 'relative' } } }}
    />
  );
}
