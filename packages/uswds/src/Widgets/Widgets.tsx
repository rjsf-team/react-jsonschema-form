import React, { ChangeEvent, FocusEvent } from 'react';
import {
  WidgetProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  ariaDescribedByIds,
  enumOptionsValueForIndex,
  enumOptionsIndexForValue,
  getTemplate,
  getUiOptions,
  optionId,
  labelValue,
  rangeSpec,
  TranslatableString,
  Widget,
} from '@rjsf/utils';
import {
  Checkbox,
  Fieldset,
  FileInput,
  Radio,
  RangeSlider,
  ComboBox,
  Select,
  Textarea,
} from '@trussworks/react-uswds';

// BaseInputTemplate usage
function BaseInputWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { registry } = props;
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>(
    'BaseInputTemplate',
    registry,
    getUiOptions(props.uiSchema),
  );
  return <BaseInputTemplate {...props} registry={registry} />;
}

// CheckboxWidget (Boolean) - Simplified
function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
  label,
  autofocus,
  disabled,
  readonly,
  required,
  value,
  id,
  onChange,
  onBlur,
  onFocus,
  options,
}: WidgetProps<T, S, F>) {
  const _onChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => onChange(checked);
  const _onBlur = ({ target: { checked } }: FocusEvent<HTMLInputElement>) => onBlur(id, checked);
  const _onFocus = ({ target: { checked } }: FocusEvent<HTMLInputElement>) => onFocus(id, checked);

  const description = schema.description || options?.help;
  const ariaDescribedById = ariaDescribedByIds<T>(id, !!description);

  return (
    <Checkbox
      id={id}
      name={id}
      label={label || schema.title}
      checked={typeof value === 'undefined' ? false : value}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      required={required}
      onChange={!readonly ? _onChange : undefined}
      onBlur={!readonly ? _onBlur : undefined}
      onFocus={!readonly ? _onFocus : undefined}
      aria-describedby={ariaDescribedById}
    />
  );
}

// CheckboxesWidget - Simplified, remove FormGroup/Label
function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  disabled,
  options,
  value,
  autofocus,
  readonly,
  required,
  label,
  schema,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, inline, emptyValue } = options;

  const _onChange = (index: number) => ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
    const all = (enumOptions || []).map((option) => option.value);
    if (checked) {
      onChange(Array.isArray(value) ? value.concat(all[index]) : [all[index]]);
    } else {
      onChange((value as any[]).filter((v) => v !== all[index]));
    }
  };

  const _onBlur = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(eventValue, enumOptions, emptyValue));
  const _onFocus = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(eventValue, enumOptions, emptyValue));

  const description = schema.description || options.help;
  const ariaDescribedById = ariaDescribedByIds<T>(id, !!description);

  return (
    <div className={`checkboxes ${inline ? 'display-flex flex-wrap' : ''}`} id={id}>
      {(enumOptions || []).map((option, index) => {
        const checked = Array.isArray(value) && value.includes(option.value);
        const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
        const checkboxId = `${id}_${index}`;

        const checkbox = (
          <Checkbox
            key={index}
            id={checkboxId}
            name={id}
            label={option.label}
            checked={checked}
            required={required}
            disabled={disabled || itemDisabled || readonly}
            autoFocus={autofocus && index === 0}
            onChange={!readonly ? _onChange(index) : undefined}
            onBlur={!readonly ? _onBlur : undefined}
            onFocus={!readonly ? _onFocus : undefined}
            aria-describedby={ariaDescribedById}
          />
        );

        return inline ? (
          <div key={index} className="margin-right-2 margin-bottom-1">
            {checkbox}
          </div>
        ) : (
          checkbox
        );
      })}
    </div>
  );
}

// RadioWidget - Simplified, remove FormGroup/Label
function RadioWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  autofocus = false,
  onChange,
  onBlur,
  onFocus,
  label,
  schema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, inline } = options;
  const readOnly = readonly;

  const _onChange = ({ target: { value: eventValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(schema.type == 'boolean' ? eventValue !== 'false' : eventValue);
  const _onBlur = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, eventValue);
  const _onFocus = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, eventValue);

  const description = schema.description || options.help;
  const ariaDescribedById = ariaDescribedByIds<T>(id, !!description);

  return (
    <div className={`radio ${inline ? 'display-flex flex-wrap' : ''}`} id={id}>
      {(enumOptions || []).map((option, i) => {
        const checked = option.value === value;
        const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
        const radioId = `${id}_${i}`;

        const radio = (
          <Radio
            key={i}
            id={radioId}
            name={id}
            label={option.label}
            value={String(option.value)}
            checked={checked}
            required={required}
            disabled={disabled || itemDisabled || readOnly}
            autoFocus={autofocus && i === 0}
            onChange={!readOnly ? _onChange : undefined}
            onBlur={!readOnly ? _onBlur : undefined}
            onFocus={!readOnly ? _onFocus : undefined}
            aria-describedby={ariaDescribedById}
          />
        );

        return inline ? (
          <div key={i} className="margin-right-2 margin-bottom-1">
            {radio}
          </div>
        ) : (
          radio
        );
      })}
    </div>
  );
}

// RangeWidget - Use USWDS RangeSlider directly
function RangeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { value, label, hideLabel, id, schema, disabled, readonly, required, onChange, onBlur, onFocus, options, rawErrors = [] } = props;
  const { min, max, step } = rangeSpec(schema);
  const hasErrors = rawErrors.length > 0;
  const description = schema.description || options.help;
  const ariaDescribedById = ariaDescribedByIds<T>(id, !!description);

  const _onChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(evt.target.value);
    onChange(newValue === null || isNaN(newValue) ? options.emptyValue : newValue);
  };

  return (
    <div>
      {labelValue(<label htmlFor={id} error={hasErrors}>{label || schema.title}{required && <span className="usa-label--required">*</span>}</label>, hideLabel)}
      <RangeSlider
        id={id}
        name={id}
        min={min ?? 0}
        max={max ?? 100}
        step={step ?? 1}
        defaultValue={value ?? ''}
        disabled={disabled || readonly}
        required={required}
        onChange={!readonly ? _onChange : undefined}
        aria-describedby={ariaDescribedById}
      />
    </div>
  );
}

// Define thresholds
const COMBOBOX_THRESHOLD = 15;
const RADIO_THRESHOLD = 4; // Threshold for using Radio buttons

// Keep the original SelectWidget implementation (which handles Select/ComboBox split)
// Rename it internally to avoid conflict
function _SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
  id,
  options,
  label,
  hideLabel,
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
  registry,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;
  const { translateString } = registry;

  const hasErrors = rawErrors.length > 0;
  const description = schema.description || options.help;
  const ariaDescribedById = ariaDescribedByIds<T>(id, !!description);

  if (multiple) {
    console.warn('SelectWidget received multiple=true, CheckboxesWidget is used instead.');
    return null;
  }

  const useComboBox = enumOptions && enumOptions.length > COMBOBOX_THRESHOLD;

  // Common props for label
  const labelComponent = labelValue(
    <label htmlFor={id} error={hasErrors}>
      {label || schema.title}
      {required && <span className="usa-label--required">*</span>}
    </label>,
    hideLabel,
  );

  if (useComboBox) {
    // Render ComboBox
    const _onChangeComboBox = (selectedValue: string | undefined) => {
      onChange(selectedValue ?? emptyValue);
    };
    const selectedOption = enumOptions?.find((o) => o.value === value);
    const comboBoxOptions =
      enumOptions?.filter(
        (option) => !(Array.isArray(enumDisabled) && enumDisabled.includes(option.value)),
      ) ?? [];

    return (
      <div>
        {labelComponent}
        <ComboBox
          id={id}
          name={id}
          options={comboBoxOptions}
          defaultValue={selectedOption}
          onChange={!readonly ? _onChangeComboBox : undefined}
          disabled={disabled || readonly}
          required={required}
          inputProps={{
            'aria-describedby': ariaDescribedById,
            autoFocus: autofocus,
            placeholder: placeholder || translateString(TranslatableString.SelectLabel),
          }}
        />
      </div>
    );
  } else {
    // Render standard Select
    const _onChangeSelect = ({ target: { value: eventValue } }: ChangeEvent<HTMLSelectElement>) => {
      onChange(enumOptionsValueForIndex<S>(eventValue, enumOptions, emptyValue));
    };
    const _onBlurSelect = ({ target: { value: eventValue } }: FocusEvent<HTMLSelectElement>) =>
      onBlur(id, enumOptionsValueForIndex<S>(eventValue, enumOptions, emptyValue));
    const _onFocusSelect = ({ target: { value: eventValue } }: FocusEvent<HTMLSelectElement>) =>
      onFocus(id, enumOptionsValueForIndex<S>(eventValue, enumOptions, emptyValue));

    return (
      <div>
        {labelComponent}
        <Select
          id={id}
          name={id}
          value={value ?? ''}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          required={required}
          multiple={false}
          onChange={!readonly ? _onChangeSelect : undefined}
          onBlur={!readonly ? _onBlurSelect : undefined}
          onFocus={!readonly ? _onFocusSelect : undefined}
          aria-describedby={ariaDescribedById}
        >
          {(!required || placeholder) && (
            <option value="">
              {placeholder || translateString(TranslatableString.SelectLabel)}
            </option>
          )}
          {(enumOptions || []).map(({ value: optionValue, label: optionLabel }, i) => {
            const disabled = Array.isArray(enumDisabled) && enumDisabled.includes(optionValue);
            // For standard select, the option value should be the actual value, not index
            return (
              <option key={i} value={optionValue} disabled={disabled}>
                {optionLabel}
              </option>
            );
          })}
        </Select>
      </div>
    );
  }
}

// Create a new wrapper component to choose between Radio and Select/ComboBox
function EnumSelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { options, multiple } = props;
  const { enumOptions } = options;

  // Don't use Radio for multi-select or if options are missing
  if (multiple || !enumOptions) {
    return <_SelectWidget {...props} />; // Fallback to Select/ComboBox
  }

  // Use RadioWidget if the number of options is below or equal to the threshold
  if (enumOptions.length <= RADIO_THRESHOLD) {
    return <RadioWidget {...props} />;
  }

  // Otherwise, use the original SelectWidget (which handles Select/ComboBox)
  return <_SelectWidget {...props} />;
}

// TextareaWidget
function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  options,
  placeholder,
  value,
  required,
  disabled,
  readonly,
  autofocus = false,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const readOnly = readonly;
  const _onChange = ({ target: { value: eventValue } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(eventValue === '' ? options.emptyValue : eventValue);
  const _onBlur = ({ target: { value: eventValue } }: FocusEvent<HTMLTextAreaElement>) =>
    onBlur(id, eventValue);
  const _onFocus = ({ target: { value: eventValue } }: FocusEvent<HTMLTextAreaElement>) =>
    onFocus(id, eventValue);

  const description = options.help;
  const descId = ariaDescribedByIds(id, !!description);

  return (
    <div>
      <Textarea
        id={id}
        name={id}
        value={value ?? ''}
        placeholder={placeholder}
        required={required}
        disabled={disabled || readOnly}
        autoFocus={autofocus}
        rows={options.rows || 5}
        onChange={!readOnly ? _onChange : undefined}
        onBlur={!readOnly ? _onBlur : undefined}
        onFocus={!readOnly ? _onFocus : undefined}
        aria-describedby={descId}
      />
    </div>
  );
}

// UpDownWidget
function UpDownWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { registry, readonly, ...rest } = props;
  const readOnly = readonly;
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>(
    'BaseInputTemplate',
    registry,
    getUiOptions(props.uiSchema),
  );
  return <BaseInputTemplate {...rest} registry={registry} readonly={readOnly} type="number" />;
}

// FileWidget
function FileWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { id, readonly, disabled, onChange, multiple = false, autofocus = false, required } = props;
  const readOnly = readonly;

  const _onChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    if (!target.files) {
      return;
    }
    onChange(multiple ? target.files : target.files[0]);
  };
  const _onBlur = (event: FocusEvent<HTMLInputElement>) => props.onBlur(id, event.target?.value);
  const _onFocus = (event: FocusEvent<HTMLInputElement>) => props.onFocus(id, event.target?.value);

  const fileInputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    id: id,
    name: id,
    multiple: multiple,
    required: required,
    disabled: disabled || readOnly,
    onChange: !readOnly ? _onChange : undefined,
    onBlur: !readOnly ? _onBlur : undefined,
    onFocus: !readOnly ? _onFocus : undefined,
    autoFocus: autofocus,
    'aria-describedby': ariaDescribedByIds(id),
  };

  return <FileInput {...fileInputProps} />;
}

// HiddenWidget
function HiddenWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, value }: WidgetProps<T, S, F>) {
  return (
    <input type="hidden" id={id} name={id} value={typeof value === 'undefined' ? '' : value} />
  );
}

// Define the object containing all widgets
const widgets = {
  PasswordWidget: BaseInputWidget,
  RadioWidget,
  UpDownWidget,
  RangeWidget,
  SelectWidget: EnumSelectWidget, // Export the wrapper as SelectWidget
  TextWidget: BaseInputWidget,
  DateWidget: BaseInputWidget,
  DateTimeWidget: BaseInputWidget,
  AltDateWidget: BaseInputWidget,
  AltDateTimeWidget: BaseInputWidget,
  EmailWidget: BaseInputWidget,
  URLWidget: BaseInputWidget,
  TextareaWidget,
  HiddenWidget,
  ColorWidget: BaseInputWidget,
  FileWidget,
  CheckboxWidget,
  CheckboxesWidget,
};

// Export the generateWidgets function
export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): { [name: string]: Widget<T, S, F> } {
  return widgets;
}

// Export the widgets object as the default
export default widgets;
