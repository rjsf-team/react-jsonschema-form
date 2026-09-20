import type { OptionOnSelectData } from '@fluentui/react-combobox';
import { Dropdown, Field, Option, OptionGroup } from '@fluentui/react-components';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIndexForValue,
  getOptionValueFormat,
  groupEnumOptions,
  isEnumOptionsGroup,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';

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
  registry,
  uiSchema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);

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

  const handleBlur = () => onBlur(id, selectedIndexes);
  const handleFocus = () => onFocus(id, selectedIndexes);
  const handleChange = (_: any, data: OptionOnSelectData) => {
    const newValue = getValue(data, multiple);
    return onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
  };
  const showPlaceholderOption = !multiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  function renderOption(option: IndexedEnumOptionType<S>) {
    return (
      <Option
        key={option.index}
        value={enumOptionValueEncoder(option.value, option.index, optionValueFormat)}
        disabled={option.disabled}
      >
        {option.label}
      </Option>
    );
  }

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
        onBlur={handleBlur}
        onFocus={handleFocus}
        onOptionSelect={handleChange}
        selectedOptions={selectedIndexesAsArray}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {showPlaceholderOption && <Option value=''>{placeholder || ''}</Option>}
        {groupEnumOptions<S>(enumOptions, optgroups, enumDisabled).map((item) =>
          isEnumOptionsGroup<S>(item) ? (
            <OptionGroup key={`optgroup-${item.label}`} label={item.label}>
              {item.options.map(renderOption)}
            </OptionGroup>
          ) : (
            renderOption(item)
          ),
        )}
      </Dropdown>
      <SelectedOptionDescription
        id={id}
        multiple={multiple}
        options={options}
        registry={registry}
        uiSchema={uiSchema}
        value={value}
      />
    </Field>
  );
}

export default SelectWidget;
