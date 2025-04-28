import React, { ChangeEvent, FocusEvent } from 'react';
import {
  WidgetProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  ariaDescribedByIds,
  enumOptionsValueForIndex,
  getTemplate,
  getUiOptions,
  optionId,
} from '@rjsf/utils';
import {
  Checkbox,
  Fieldset,
  FileInput,
  FileInputProps,
  Label,
  Radio,
  RangeInput,
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
  return <BaseInputTemplate {...props} />;
}

// CheckboxWidget
function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    value,
    disabled,
    readonly,
    label,
    schema,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
    registry,
    uiSchema,
  } = props;
  const readOnly = readonly;
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    getUiOptions(uiSchema),
  );
  const description = schema.description;
  const descId = ariaDescribedByIds(id);

  const _onChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => onChange(checked);
  const _onBlur = ({ target: { checked } }: FocusEvent<HTMLInputElement>) => onBlur(id, checked);
  const _onFocus = ({ target: { checked } }: FocusEvent<HTMLInputElement>) => onFocus(id, checked);

  return (
    <>
      <Checkbox
        id={id}
        name={id}
        label={label || ''}
        checked={typeof value === 'undefined' ? false : value}
        required={props.required}
        disabled={disabled || readOnly}
        autoFocus={autofocus}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={descId}
      />
      {description && (
        <DescriptionFieldTemplate id={descId} description={description} registry={registry} />
      )}
    </>
  );
}

// CheckboxesWidget
function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  disabled,
  options,
  value,
  autofocus = false,
  readonly,
  onChange,
  onBlur,
  onFocus,
  required,
  label,
  rawErrors,
  schema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, inline } = options;
  const readOnly = readonly;
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const _onChange =
    (index: number) =>
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
      const all = (enumOptions as any).map(({ value: val }: { value: any }) => val);
      if (checked) {
        onChange(enumOptionsValueForIndex<S>([...checkboxesValues, all[index]], all, options));
      } else {
        onChange(
          enumOptionsValueForIndex<S>(
            checkboxesValues.filter((v) => v !== all[index]),
            all,
            options,
          ),
        );
      }
    };

  const _onBlur = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, eventValue);
  const _onFocus = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, eventValue);

  return (
    <Fieldset className="usa-fieldset">
      <legend className="usa-legend">
        {label || schema.title}
        {required && <span className="usa-label--required"> *</span>}
      </legend>
      {schema.description && <span className="usa-hint">{schema.description}</span>}
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index: number) => {
          const checked = checkboxesValues.includes(option.value);
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
          const checkbox = (
            <Checkbox
              id={optionId(id, index)}
              name={id}
              label={option.label}
              checked={checked}
              required={required}
              disabled={disabled || itemDisabled || readOnly}
              autoFocus={autofocus && index === 0}
              onChange={_onChange(index)}
              onBlur={_onBlur}
              onFocus={_onFocus}
            />
          );
          return inline ? (
            <span key={index} style={{ marginRight: '1em' }}>
              {checkbox}
            </span>
          ) : (
            <div key={index}>{checkbox}</div>
          );
        })}
    </Fieldset>
  );
}

// RadioWidget
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
  rawErrors,
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

  return (
    <Fieldset className="usa-fieldset">
      <legend className="usa-legend">
        {label || schema.title}
        {required && <span className="usa-label--required"> *</span>}
      </legend>
      {schema.description && <span className="usa-hint">{schema.description}</span>}
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index: number) => {
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
          const radio = (
            <Radio
              id={optionId(id, index)}
              name={id}
              label={option.label}
              value={String(option.value)}
              checked={String(value) === String(option.value)}
              required={required}
              disabled={disabled || itemDisabled || readOnly}
              autoFocus={autofocus && index === 0}
              onChange={_onChange}
              onBlur={_onBlur}
              onFocus={_onFocus}
            />
          );
          return inline ? (
            <span key={index} style={{ marginRight: '1em' }}>
              {radio}
            </span>
          ) : (
            <div key={index}>{radio}</div>
          );
        })}
    </Fieldset>
  );
}

// RangeWidget
function RangeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { value, readonly, disabled, options, schema, onChange, label, id } = props;
  const readOnly = readonly;

  const _onChange = ({ target: { value: eventValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(eventValue === '' ? options.emptyValue : eventValue);

  return (
    <>
      <Label htmlFor={id}>{label || schema.title}</Label>
      <RangeInput
        id={id}
        name={id}
        min={schema.minimum}
        max={schema.maximum}
        step={schema.multipleOf}
        value={value ?? ''}
        disabled={disabled || readOnly}
        onChange={_onChange}
      />
    </>
  );
}

// SelectWidget
function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
  id,
  options,
  label,
  required,
  disabled,
  readonly,
  value,
  multiple = false,
  autofocus = false,
  onChange,
  onBlur,
  onFocus,
  rawErrors,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled } = options;
  const readOnly = readonly;
  const emptyValue = multiple ? [] : '';

  function getValue(event: ChangeEvent<HTMLSelectElement> | FocusEvent<HTMLSelectElement>) {
    if (multiple) {
      return [].slice
        .call(event.target.options)
        .filter((o) => o.selected)
        .map((o) => o.value);
    } else {
      return event.target.value;
    }
  }

  const _onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newValue = getValue(event);
    onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, options));
  };
  const _onBlur = (event: FocusEvent<HTMLSelectElement>) => {
    const newValue = getValue(event);
    onBlur(id, enumOptionsValueForIndex<S>(newValue, enumOptions, options));
  };
  const _onFocus = (event: FocusEvent<HTMLSelectElement>) => {
    const newValue = getValue(event);
    onFocus(id, enumOptionsValueForIndex<S>(newValue, enumOptions, options));
  };

  return (
    <>
      <Label htmlFor={id}>
        {label || schema.title}
        {required && <span className="usa-label--required">*</span>}
      </Label>
      <Select
        id={id}
        name={id}
        multiple={multiple}
        value={typeof value === 'undefined' ? emptyValue : value}
        required={required}
        disabled={disabled || readOnly}
        autoFocus={autofocus}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {!multiple && schema.default === undefined && <option value="">{'- Select -'}</option>}
        {Array.isArray(enumOptions) &&
          enumOptions.map(({ value: optionValue, label: optionLabel }, i) => {
            const disabled = Array.isArray(enumDisabled) && enumDisabled.includes(optionValue);
            return (
              <option key={i} value={optionValue} disabled={disabled}>
                {optionLabel}
              </option>
            );
          })}
      </Select>
    </>
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
  rawErrors,
}: WidgetProps<T, S, F>) {
  const readOnly = readonly;
  const _onChange = ({ target: { value: eventValue } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(eventValue === '' ? options.emptyValue : eventValue);
  const _onBlur = ({ target: { value: eventValue } }: FocusEvent<HTMLTextAreaElement>) =>
    onBlur(id, eventValue);
  const _onFocus = ({ target: { value: eventValue } }: FocusEvent<HTMLTextAreaElement>) =>
    onFocus(id, eventValue);

  return (
    <Textarea
      id={id}
      name={id}
      value={value ?? ''}
      placeholder={placeholder}
      required={required}
      disabled={disabled || readOnly}
      autoFocus={autofocus}
      rows={options.rows || 5}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds(id)}
    />
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
  return <BaseInputTemplate {...rest} readonly={readOnly} type="number" />;
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

  const fileInputProps: FileInputProps & React.InputHTMLAttributes<HTMLInputElement> = {
    id: id,
    name: id,
    multiple: multiple,
    required: required,
    disabled: disabled || readOnly,
    onChange: _onChange,
    onBlur: _onBlur,
    onFocus: _onFocus,
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

export default {
  PasswordWidget: BaseInputWidget,
  RadioWidget,
  UpDownWidget,
  RangeWidget,
  SelectWidget,
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
