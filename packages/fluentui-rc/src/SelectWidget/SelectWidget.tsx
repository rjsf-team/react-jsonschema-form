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

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  let selectedIndexesAsArray: string[] = [];

  if (typeof selectedIndexes === 'string') {
    selectedIndexesAsArray = [selectedIndexes];
  } else if (Array.isArray(selectedIndexes)) {
    selectedIndexesAsArray = selectedIndexes.map((index) => String(index));
  }

  const dropdownValue = selectedIndexesAsArray
    .map((index) => (enumOptions ? enumOptions[Number(index)].label : undefined))
    .join(', ');

  const _onBlur = () => onBlur(id, selectedIndexes);
  const _onFocus = () => onFocus(id, selectedIndexes);
  const _onChange = (_: any, data: OptionOnSelectData) => {
    const newValue = getValue(data, multiple);
    return onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
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
        name={id}
        multiselect={multiple}
        className='form-control'
        value={dropdownValue}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onBlur={_onBlur}
        onFocus={_onFocus}
        onOptionSelect={_onChange}
        selectedOptions={selectedIndexesAsArray}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        {showPlaceholderOption && <Option value=''>{placeholder || ''}</Option>}
        {Array.isArray(enumOptions) &&
          enumOptions.map(({ value, label }, i) => {
            const disabled = enumDisabled && enumDisabled.indexOf(value) !== -1;
            return (
              <Option key={i} value={String(i)} disabled={disabled}>
                {label}
              </Option>
            );
          })}
      </Dropdown>
    </Field>
  );
}

export default SelectWidget;
