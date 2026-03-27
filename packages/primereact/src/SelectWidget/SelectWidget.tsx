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
  props: WidgetProps<T, S, F>,
) {
  const { multiple = false } = props;

  return multiple ? <MultiSelectWidget {...props} /> : <SingleSelectWidget {...props} />;
}

function SingleSelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  schema,
  id,
  htmlName,
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
  ...dropdownProps
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const primeProps = (options.prime || {}) as object;
  const useRealValues = !!htmlName;

  multiple = typeof multiple === 'undefined' ? false : multiple;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);

  const _onChange = (e: { value: any }) => {
    const newValue = useRealValues
      ? multiple
        ? e.value
        : e.value || optEmptyVal
      : enumOptionsValueForIndex<S>(e.value, enumOptions, optEmptyVal);
    onChange(newValue);
  };
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
    const newValue = useRealValues
      ? target && target.value
      : enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal);
    onBlur(id, newValue);
  };
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => {
    const newValue = useRealValues
      ? target && target.value
      : enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal);
    onFocus(id, newValue);
  };
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const { ...dropdownRemainingProps } = dropdownProps;

  let selectValue;
  if (useRealValues) {
    selectValue = isEmpty ? emptyValue : multiple ? value.map(String) : String(value);
  } else {
    selectValue = !isEmpty && typeof selectedIndexes !== 'undefined' ? selectedIndexes : emptyValue;
  }

  return (
    <Dropdown
      id={id}
      name={htmlName || id}
      {...primeProps}
      value={selectValue}
      options={(enumOptions ?? []).map(({ value, label }, i: number) => ({
        label,
        value: useRealValues ? String(value) : String(i),
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
      }))}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      aria-describedby={ariaDescribedByIds(id)}
      {...dropdownRemainingProps}
    />
  );
}

function MultiSelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  htmlName,
  options,
  disabled,
  placeholder,
  readonly,
  value,
  multiple = false,
  autofocus,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const primeProps = (options.prime || {}) as object;
  const useRealValues = !!htmlName;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);

  const _onChange = (e: { value: any }) => {
    const newValue = useRealValues
      ? multiple
        ? e.value
        : e.value || optEmptyVal
      : enumOptionsValueForIndex<S>(e.value, enumOptions, optEmptyVal);
    onChange(newValue);
  };
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
    const newValue = useRealValues
      ? target && target.value
      : enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal);
    onBlur(id, newValue);
  };
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => {
    const newValue = useRealValues
      ? target && target.value
      : enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal);
    onFocus(id, newValue);
  };
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  let selectValue;
  if (useRealValues) {
    selectValue = isEmpty ? emptyValue : multiple ? value.map(String) : String(value);
  } else {
    selectValue = !isEmpty && typeof selectedIndexes !== 'undefined' ? selectedIndexes : emptyValue;
  }

  return (
    <MultiSelect
      id={id}
      name={htmlName || id}
      {...primeProps}
      value={selectValue}
      options={(enumOptions ?? []).map(({ value, label }, i: number) => ({
        label,
        value: useRealValues ? String(value) : String(i),
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
      }))}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      display={options.display === 'chip' ? 'chip' : 'comma'}
      aria-describedby={ariaDescribedByIds(id)}
      pt={{ root: { style: { position: 'relative' } } }}
    />
  );
}
