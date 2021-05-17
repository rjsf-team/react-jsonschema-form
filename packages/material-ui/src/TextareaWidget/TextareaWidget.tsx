import React from "react";

import { WidgetProps } from "@visma/rjsf-core";

import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

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
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = (value === "" ? options.emptyValue : value);
    onChange(rawValue ?
        options.maxLength ? rawValue.substring(0, options.maxLength) : rawValue
        : "")
  };
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <>
      <TextField
        id={id}
        label={label || schema.title}
        placeholder={placeholder}
        disabled={disabled || readonly}
        value={value}
        required={required}
        autoFocus={autofocus}
        multiline={true}
        rows={options.rows || 5}
        error={rawErrors.length > 0}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      {options.showCharacterCounter &&
      <div>
        <Typography variant="subtitle2" style={{float: "right"}}>{(value ? value.length : 0) + " / " + options.maxLength}</Typography>
      </div>
      }
    </>
  );
};

export default TextareaWidget;
