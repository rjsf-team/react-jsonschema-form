import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { Dropdown, Field, Option } from '@fluentui/react-components';
import { OptionOnSelectData } from '@fluentui/react-combobox';

function getValue(data: OptionOnSelectData, multiple: boolean) {
  if (multiple) {
    return data.selectedOptions;
  }
  return data.selectedOptions[0];
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  htmlName,
  options,
  label,
  hideLabel,
  value,
  required,
  disabled,
  readonly,
  multiple = false,
  autofocus = false,
  rawErrors = [],
  onChange,
  onBlur,
  onFocus,
  schema,
  placeholder,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const useRealValues = !!htmlName;

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  let selectedIndexesAsArray: string[] = [];

  if (typeof selectedIndexes === 'string') {
    selectedIndexesAsArray = [selectedIndexes];
  } else if (Array.isArray(selectedIndexes)) {
    selectedIndexesAsArray = selectedIndexes.map((index) => String(index));
  }

  let selectedOptionsValue: string[];
  if (useRealValues) {
    if (Array.isArray(value)) {
      selectedOptionsValue = value.map(String);
    } else if (typeof value !== 'undefined') {
      selectedOptionsValue = [String(value)];
    } else {
      selectedOptionsValue = [];
    }
  } else {
    selectedOptionsValue = selectedIndexesAsArray;
  }

  const dropdownValue = useRealValues
    ? selectedOptionsValue
        .map((val) => {
          const opt = enumOptions?.find((o) => String(o.value) === val);
          return opt?.label;
        })
        .join(', ')
    : selectedIndexesAsArray.map((index) => (enumOptions ? enumOptions[Number(index)].label : undefined)).join(', ');

  const _onBlur = () => onBlur(id, selectedIndexes);
  const _onFocus = () => onFocus(id, selectedIndexes);
  const _onChange = (_: any, data: OptionOnSelectData) => {
    const newValue = getValue(data, multiple);
    const resolved = useRealValues
      ? multiple
        ? newValue
        : newValue || optEmptyVal
      : enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal);
    return onChange(resolved);
  };
  const showPlaceholderOption = !multiple && schema.default === undefined;

  return (
    <Field
      label={labelValue(label, hideLabel)}
      validationState={rawErrors.length ? 'error' : undefined}
      required={required}
    >
      <Dropdown
        id={id}
        name={htmlName || id}
        multiselect={multiple}
        className='form-control'
        value={dropdownValue}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onBlur={_onBlur}
        onFocus={_onFocus}
        onOptionSelect={_onChange}
        selectedOptions={selectedOptionsValue}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {showPlaceholderOption && <Option value=''>{placeholder || ''}</Option>}
        {Array.isArray(enumOptions) &&
          enumOptions.map(({ value, label }, i) => {
            const disabled = enumDisabled && enumDisabled.indexOf(value) !== -1;
            return (
              <Option key={i} value={useRealValues ? String(value) : String(i)} disabled={disabled}>
                {label}
              </Option>
            );
          })}
      </Dropdown>
    </Field>
  );
}

export default SelectWidget;
