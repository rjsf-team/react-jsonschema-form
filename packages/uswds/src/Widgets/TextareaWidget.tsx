import React from "react";
import { WidgetProps, ariaDescribedByIds, labelValue } from "@rjsf/utils";
import { Textarea, FormGroup, Label } from "@trussworks/react-uswds";

const TextareaWidget = ({
  id,
  value,
  required,
  disabled,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options = {}, // Default options to {}
  schema,
  label,
  hideLabel,
  rawErrors = [], // Default rawErrors to []
  placeholder,
  autofocus,
}: WidgetProps) => {
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

  const inputProps = {
    placeholder: placeholder,
    autoFocus: autofocus,
  };
  const rows = typeof options.rows === 'number' ? options.rows : 5;
  const hasErrors = rawErrors.length > 0;
  const help = schema.description || options.help;

  return (
    <FormGroup error={hasErrors}>
      {labelValue(
        <Label htmlFor={id} error={hasErrors}>
          {label || schema.title}
          {required && <span className="usa-label--required">*</span>}
        </Label>,
        hideLabel
      )}
      {help && <span id={`${id}__help`} className="usa-hint">{help}</span>}
      <Textarea
        id={id}
        name={id}
        value={value ? value : ""}
        disabled={disabled || readonly}
        rows={rows}
        onBlur={_onBlur}
        onFocus={_onFocus}
        onChange={_onChange}
        aria-describedby={ariaDescribedByIds<any>(id, !!help)}
        required={required}
        {...inputProps}
      />
    </FormGroup>
  );
};

export default TextareaWidget;