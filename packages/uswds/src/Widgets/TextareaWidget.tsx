import React from "react";
import { WidgetProps, schemaRequiresTrueValue } from "@rjsf/utils";
import { Textarea } from "@trussworks/react-uswds";

// Assuming BaseInputTemplate handles label, help, errors etc.
import BaseInputTemplate from "../Templates/BaseInputTemplate";

// Define the props for the TextareaWidget, potentially extending WidgetProps
interface TextareaWidgetProps extends WidgetProps {
  // Add any specific props if needed
}

const TextareaWidget = ({
  id,
  placeholder = "", // Use default parameter for placeholder
  value,
  required,
  disabled,
  autofocus = false, // Use default parameter for autofocus
  readonly,
  onBlur,
  onFocus,
  onChange,
  options = {}, // Use default parameter for options
  schema,
  label,
  hideLabel,
  rawErrors = [], // Use default parameter for rawErrors
  formContext,
  registry,
}: TextareaWidgetProps) => {
  const _onChange = ({
    target: { value: eventValue },
  }: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(eventValue === "" ? options.emptyValue : eventValue);
  };
  const _onBlur = ({
    target: { value: eventValue },
  }: React.FocusEvent<HTMLTextAreaElement>) =>
    onBlur(id, eventValue === "" ? options.emptyValue : eventValue);
  const _onFocus = ({
    target: { value: eventValue },
  }: React.FocusEvent<HTMLTextAreaElement>) =>
    onFocus(id, eventValue === "" ? options.emptyValue : eventValue);

  const rows = options.rows || 5; // Get rows from options or default to 5

  return (
    <BaseInputTemplate
      id={id}
      label={label}
      hideLabel={hideLabel}
      required={required}
      schema={schema}
      help={options.help} // Pass help from options if available
      rawErrors={rawErrors}
      registry={registry}
      formContext={formContext}
      disabled={disabled}
      readonly={readonly}
    >
      <Textarea
        id={id}
        name={id}
        className="usa-textarea" // USWDS class
        value={value ? value : ""}
        placeholder={placeholder}
        required={schemaRequiresTrueValue(schema)} // Use utility for required
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        rows={rows} // Use calculated rows
        onBlur={_onBlur}
        onFocus={_onFocus}
        onChange={_onChange}
        aria-describedby={options.help ? `${id}__help` : undefined} // Add aria-describedby if help exists
      />
    </BaseInputTemplate>
  );
};

// Remove the static defaultProps definition
/*
TextareaWidget.defaultProps = {
  autofocus: false,
  options: {},
};
*/

export default TextareaWidget;
