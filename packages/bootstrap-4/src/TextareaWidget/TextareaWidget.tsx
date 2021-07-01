import React from "react";

import {utils, WidgetProps} from "@rjsf/core";
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
}: CustomWidgetProps) => {
  const {onEventChange} = utils.hooks.useEmptyValueOnChange({onChange, options, value});
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLTextAreaElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLTextAreaElement>) => onFocus(id, value);

  return (
    <>
      <label htmlFor={id}>
        {label || schema.title}
        {required && (
          <span
            aria-hidden
            className={rawErrors.length > 0 ? "text-danger ml-1" : "ml-1"}>
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
          onChange={onEventChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
        />
      </InputGroup>
    </>
  );
};

export default TextareaWidget;
