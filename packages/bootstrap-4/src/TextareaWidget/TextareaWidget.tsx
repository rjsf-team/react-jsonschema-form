import React from "react";

import { getUiOptions, WidgetProps } from "@rjsf/utils";
import FormControl from "react-bootstrap/FormControl";
import InputGroup from "react-bootstrap/InputGroup";

type CustomWidgetProps = WidgetProps & {
  options: any;
};

const TextareaWidget = ({
  id,
  placeholder,
  value,
  required,
  disabled,
  autofocus,
  label,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
  schema,
  rawErrors = [],
  uiSchema,
}: CustomWidgetProps) => {
  const uiOptions = getUiOptions(uiSchema);
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLTextAreaElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLTextAreaElement>) => onFocus(id, value);

  return (
    <>
      <label htmlFor={id}>
        {uiOptions.title || schema.title || label}
        {required && (
          <span
            aria-hidden
            className={rawErrors.length > 0 ? "text-danger ml-1" : "ml-1"}
          >
            &thinsp;{"*"}
          </span>
        )}
      </label>
      <InputGroup>
        <FormControl
          id={id}
          as="textarea"
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          value={value}
          required={required}
          autoFocus={autofocus}
          rows={options.rows || 5}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
        />
      </InputGroup>
    </>
  );
};

export default TextareaWidget;
