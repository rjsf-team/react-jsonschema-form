import { ChangeEvent, FocusEvent } from 'react';
import { FormGroup, Label, TextInput } from '@trussworks/react-uswds';
import {
  ariaDescribedByIds, // Ensure this is imported
  BaseInputTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  labelValue, // Ensure this is imported
} from '@rjsf/utils';

// ... (existing comments) ...

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    placeholder,
    required,
    readonly,
    disabled,
    label,
    hideLabel, // Added hideLabel
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    type, // Ensure type is passed correctly
    rawErrors = [],
    // formContext, // Keep if needed
    // registry, // Keep if needed
    // multiline, // Not directly used by TextInput, handled by TextareaWidget
    // hidden, // Not used here, handled by core
  } = props;
  const inputProps = {
    ...options.inputProps, // Allow passing custom props
    placeholder: placeholder,
    autoFocus: autofocus,
    required: required, // Pass required to TextInput
    type: type, // Pass type (text, number, email etc.)
    // Add other relevant props from options if needed
  };
  const _onChange = ({ target: { value: val } }: ChangeEvent<HTMLInputElement>) => {
    // Use the custom onChange method if available, otherwise use the default one from props
    const newVal = val === '' ? options.emptyValue : val;
    (onChangeOverride || onChange)(newVal);
  };
  const _onBlur = ({ target: { value: val } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, val === '' ? options.emptyValue : val);
  const _onFocus = ({ target: { value: val } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, val === '' ? options.emptyValue : val);

  const hasErrors = rawErrors.length > 0;
  // Compute aria-describedby based on help text (schema.description)
  const description = schema.description || options.help; // Keep track if description/help exists
  const ariaDescribedById = ariaDescribedByIds<T>(id, !!description); // Pass description presence

  return (
    <FormGroup error={hasErrors}>
      {labelValue( // Use labelValue helper
        <Label htmlFor={id} error={hasErrors}>
          {label || schema.title}
          {required && <span className="usa-label--required">*</span>}
        </Label>,
        hideLabel // Pass hideLabel
      )}
      {/* REMOVE manual description rendering */}
      <TextInput
        id={id}
        name={id}
        value={value || value === 0 ? value : ''}
        disabled={disabled || readonly} // Combine disabled and readonly
        onBlur={!readonly ? _onBlur : undefined} // Don't attach handlers if readonly
        onFocus={!readonly ? _onFocus : undefined}
        onChange={!readonly ? _onChange : undefined}
        aria-describedby={ariaDescribedById} // Pass computed aria-describedby
        {...inputProps} // Spread computed input props
      />
      {/* Error display is typically handled by FieldTemplate */}
    </FormGroup>
  );
}
