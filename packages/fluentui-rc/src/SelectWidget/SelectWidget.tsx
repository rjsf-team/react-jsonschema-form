import type { OptionOnSelectData } from '@fluentui/react-combobox';
import { Dropdown, Field, Option, OptionGroup } from '@fluentui/react-components';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsDomValues,
  enumOptionsIndexForValue,
  enumOptionValueDecoder,
  getOptionValueFormat,
  groupEnumOptions,
  hasVisibleErrors,
  isEnumOptionsGroup,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
  useSelectFocusHandlers,
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
function SelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  htmlName,
  className,
  options,
  label,
  hideLabel,
  value,
  required,
  disabled,
  readonly,
  multiple = false,
  autofocus = false,
  rawErrors,
  hideError,
  onChange,
  onBlur,
  onFocus,
  schema,
  placeholder,
  registry,
  uiSchema,
  'aria-label': ariaLabel,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  // One scan of the options finds the selection, which both the displayed labels and the selected options come from.
  // The options' own values are encoded in the `optionValueFormat`, so the selection is encoded in that format too
  const matchedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const selectedOptionsWithIndex =
    matchedIndexes === undefined || !enumOptions
      ? []
      : ([] as string[])
          .concat(matchedIndexes)
          .map((index) => ({ index: Number(index), ...enumOptions[Number(index)] }));
  const dropdownValue = selectedOptionsWithIndex.map((option) => option.label).join(', ');
  const selectedOptions = selectedOptionsWithIndex.map((option) => domValues[option.index]);

  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>({ id, value, options, onFocus, onBlur });
  const handleChange = (_: any, data: OptionOnSelectData) => {
    const newValue = getValue(data, multiple);
    onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
  };
  const showPlaceholderOption = !multiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  function renderOption(option: IndexedEnumOptionType<S>) {
    return (
      <Option key={option.index} value={domValues[option.index]} disabled={option.disabled}>
        {option.label}
      </Option>
    );
  }

  return (
    <Field
      // A label element, even an empty one, names the control over its `aria-label`
      label={ariaLabel ? undefined : labelValue(label, hideLabel)}
      validationState={hasVisibleErrors({ rawErrors, hideError }) ? 'error' : undefined}
      required={required}
    >
      <Dropdown
        id={id}
        name={htmlName || id}
        multiselect={multiple}
        className={className ? `form-control ${className}` : 'form-control'}
        value={dropdownValue}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onOptionSelect={handleChange}
        selectedOptions={selectedOptions}
        aria-label={ariaLabel}
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
