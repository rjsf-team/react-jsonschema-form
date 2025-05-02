import React, { ChangeEvent, FocusEvent, useCallback, useRef } from 'react';
import {
  WidgetProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  ariaDescribedByIds,
  enumOptionsValueForIndex,
  getTemplate,
  getUiOptions,
  Widget,
} from '@rjsf/utils';
import {
  Checkbox,
  ComboBox,
  FileInput,
  Label,
  Radio,
  Select,
  Textarea,
  TextInput,
} from '@trussworks/react-uswds';

// CheckboxWidget (Boolean) - Simplified
function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
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
      label={schema.title}
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

// Define thresholds
const COMBOBOX_THRESHOLD = 15;
const RADIO_THRESHOLD = 4; // Threshold for using Radio buttons

// ComboBoxWidget
export function ComboBoxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { id, value, onChange, onBlur, onFocus, options, readonly } = props;

  const _onChangeComboBox = (val?: string) => {
    onChange(val ?? '');
  };

  const comboBoxOptions = (options.enumOptions || []).map((option) => ({
    value: String(option.value),
    label: String(option.label),
  }));

  return (
    <ComboBox
      id={id}
      name={id}
      defaultValue={value}
      onChange={readonly ? () => {} : _onChangeComboBox}
      disabled={readonly}
      options={comboBoxOptions}
    />
  );
}

// SelectWidget
function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  name,
  options,
  registry,
  value,
  emptyValue,
  readonly,
  disabled,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  schema,
  multiple,
}: WidgetProps<T, S, F>) {
  const { translateString } = registry;
  const { enumOptions, enumDisabled } = options;

  const _onChangeSelect = ({ target: { value: eventValue } }: ChangeEvent<HTMLSelectElement>) => {
    onChange(enumOptionsValueForIndex<S>(eventValue, enumOptions, emptyValue));
  };
  const _onBlurSelect = ({ target: { value: eventValue } }: FocusEvent<HTMLSelectElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(eventValue, enumOptions, emptyValue));
  const _onFocusSelect = ({ target: { value: eventValue } }: FocusEvent<HTMLSelectElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(eventValue, enumOptions, emptyValue));

  return (
    <Select
      id={id}
      name={name}
      value={typeof value === 'undefined' ? emptyValue : value}
      disabled={disabled || readonly}
      multiple={multiple}
      onChange={!readonly ? _onChangeSelect : undefined}
      onBlur={!readonly ? _onBlurSelect : undefined}
      onFocus={!readonly ? _onFocusSelect : undefined}
    >
      {!multiple && schema.default === undefined && (
        <option value="">{placeholder || translateString(TranslatableString.NewStringDefault)}</option>
      )}
      {(enumOptions || []).map(({ value: optionValue, label: optionLabel }, i) => {
        const disabled = Array.isArray(enumDisabled) && enumDisabled.includes(optionValue);
        return (
          <option key={i} value={optionValue} disabled={disabled}>
            {optionLabel}
          </option>
        );
      })}
    </Select>
  );
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

  return <FileInput {...(fileInputProps as any)} />;
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
  PasswordWidget: CheckboxWidget,
  RadioWidget,
  UpDownWidget,
  SelectWidget,
  TextWidget: CheckboxWidget,
  DateWidget: CheckboxWidget,
  DateTimeWidget: CheckboxWidget,
  AltDateWidget: CheckboxWidget,
  AltDateTimeWidget: CheckboxWidget,
  EmailWidget: CheckboxWidget,
  URLWidget: CheckboxWidget,
  TextareaWidget,
  HiddenWidget,
  ColorWidget: CheckboxWidget,
  FileWidget,
  CheckboxWidget,
  CheckboxesWidget,
  ComboBoxWidget,
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
export default generateWidgets();
