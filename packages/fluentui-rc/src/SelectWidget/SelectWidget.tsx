import type { OptionOnSelectData } from '@fluentui/react-combobox';
import type { DropdownProps } from '@fluentui/react-components';
import { Dropdown, Field, Option, OptionGroup } from '@fluentui/react-components';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionsDomValues,
  enumOptionsIndexForValue,
  enumOptionValueDecoder,
  getControlAriaLabel,
  getLabelId,
  getOptionValueFormat,
  groupEnumOptions,
  hasWidgetErrors,
  isEnumOptionsGroup,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
  useSelectFocusHandlers,
  widgetAriaProps,
  widgetDrawsLabel,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { fieldLabelSlot } from '../utils.ts';

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
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    className,
    options,
    label,
    value,
    required,
    disabled,
    readonly,
    multiple = false,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
    schema,
    placeholder,
    registry,
    uiSchema,
    presentation,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  // An empty label element would still name the dropdown, by nothing, over an `aria-label` it is given, and one holding
  // only a required field's `*` would name it "star", so a label is drawn only with text. Where none names it, the
  // dropdown, whose contents are its value, is named by the field's label, its placeholder or the translated prompt
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
  const labelId = getLabelId<T, S, F>(props);
  const ariaProps = widgetAriaProps(props);
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  // One scan of the options finds the selection, which both the displayed labels and the selected options come from.
  // The options' own values are encoded in the `optionValueFormat`, so the selection is encoded in that format too
  const matchedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const selectedOptionsWithIndex =
    matchedIndexes === undefined || !enumOptions
      ? []
      : [matchedIndexes].flat().map((index) => ({ index: Number(index), ...enumOptions[Number(index)] }));
  const dropdownValue = selectedOptionsWithIndex.map((option) => option.label).join(', ');
  const selectedOptions = selectedOptionsWithIndex.map((option) => domValues[option.index]);

  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>({ id, value, options, onFocus, onBlur });
  const handleChange: NonNullable<DropdownProps['onOptionSelect']> = (_, data) => {
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
      label={drawsLabel ? fieldLabelSlot(label, id, labelId) : undefined}
      validationState={hasWidgetErrors<T, S, F>(props) ? 'error' : undefined}
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
        // Fluent names the dropdown only through its label's `for` where that `for` matches its id, an id a nested
        // `anyOf`'s option selector shares with the selector above it, so the dropdown points at its own label's id too
        aria-labelledby={drawsLabel ? labelId : undefined}
        {...ariaProps}
        aria-label={getControlAriaLabel<T, S, F>(props, ariaProps['aria-label'], drawsLabel)}
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
        hideLabel={hideLabel}
        presentation={presentation}
      />
    </Field>
  );
}

export default SelectWidget;
