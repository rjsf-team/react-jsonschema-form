import React from 'react';
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldTitleProps,
  BaseInputTemplateProps,
  DescriptionFieldProps,
  ErrorListProps,
  FieldErrorProps,
  FieldHelpProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  SubmitButtonProps,
  TitleFieldProps,
  WrapIfAdditionalTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
  IdSchema,
} from '@rjsf/utils';

// Define USWDS specific templates here, applying relevant CSS classes
// Example for FieldTemplate:
function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    children,
    classNames,
    style,
    disabled,
    displayLabel,
    hidden,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    required,
    rawErrors = [],
    errors,
    help,
    rawDescription,
    schema,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions
  );

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  // Determine if the field is a checkbox/radio type for different label handling
  const isCheckboxOrRadio = schema.type === 'boolean' || uiOptions.widget === 'radio';

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <div className={`usa-form-group ${rawErrors.length > 0 ? 'usa-form-group--error' : ''}`}>
        {displayLabel && !isCheckboxOrRadio && (
          <label htmlFor={id} className={`usa-label ${rawErrors.length > 0 ? 'usa-label--error' : ''}`}>
            {label}
            {required && <span className="usa-label--required"> *</span>}
          </label>
        )}
        {displayLabel && rawDescription && !isCheckboxOrRadio && (
           <span id={`${id}__description`} className="usa-hint">
             {rawDescription}
           </span>
        )}
        {errors}
        {help}
        {children}
      </div>
    </WrapIfAdditionalTemplate>
  );
}

// Add implementations for other templates (ArrayFieldTemplate, ObjectFieldTemplate, BaseInputTemplate, etc.)
// using USWDS classes like `usa-form-group`, `usa-label`, `usa-input`, `usa-button`, `usa-checkbox`, `usa-radio`, etc.

// Example BaseInputTemplate
function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    name, // remove this from ...rest
    value,
    readonly,
    disabled,
    autofocus,
    onBlur,
    onFocus,
    onChange,
    onChangeOverride,
    options,
    schema,
    uiSchema,
    formContext,
    registry,
    rawErrors,
    type,
    hideLabel, // remove this from ...rest
    hideError, // remove this from ...rest
    // Note: this is not part of the BaseInputTemplateProps declaration in @rjsf/utils, but is used in other themes
    required, // remove this from ...rest
    ...rest
  } = props;

  const inputProps = { ...rest, ...options.inputProps };
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const isCheckboxOrRadio = schema.type === 'boolean' || options.inputType === 'radio';
  const isTextarea = options.inputType === 'textarea';

  const inputClass = isTextarea ? 'usa-textarea' : 'usa-input';
  const errorClass = rawErrors && rawErrors.length > 0 ? `${inputClass}--error` : '';

  if (isCheckboxOrRadio) {
    // Handle checkbox/radio rendering separately if needed, often done in widgets
    // This BaseInput might primarily be for text-based inputs
    return (
      <input
        id={id}
        name={id} // Use id for name as well for standard form submission
        className={`${inputClass} ${errorClass}`} // Adjust classes as needed
        type={options.inputType || type}
        value={value ?? ''}
        readOnly={readonly}
        disabled={disabled}
        autoFocus={autofocus}
        required={required}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={options.ariaDescribedBy || `${id}__description`} // Assuming description exists
        {...inputProps}
      />
    );
  }

  if (isTextarea) {
     return (
      <textarea
        id={id}
        name={id}
        className={`${inputClass} ${errorClass}`}
        value={value ?? ''}
        readOnly={readonly}
        disabled={disabled}
        autoFocus={autofocus}
        required={required}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={options.ariaDescribedBy || `${id}__description`}
        {...inputProps}
      />
    );
  }

  return (
    <input
      id={id}
      name={id}
      className={`${inputClass} ${errorClass}`}
      type={options.inputType || type}
      value={value ?? ''}
      readOnly={readonly}
      disabled={disabled}
      autoFocus={autofocus}
      required={required}
      onChange={onChangeOverride || _onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={options.ariaDescribedBy || `${id}__description`}
      {...inputProps}
    />
  );
}

// Add other template implementations...
// ErrorListTemplate, TitleFieldTemplate, DescriptionFieldTemplate, etc.

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): Partial<TemplatesType<T, S, F>> {
  return {
    FieldTemplate,
    BaseInputTemplate,
    // Add other implemented templates here
  };
}

export default generateTemplates();

