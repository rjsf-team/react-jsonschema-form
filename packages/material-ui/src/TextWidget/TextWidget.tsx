import React from "react";

import TextField, {
  StandardTextFieldProps as TextFieldProps,
} from "@material-ui/core/TextField";

import { WidgetProps, utils } from "@visma/rjsf-core";
import Typography from "@material-ui/core/Typography";

const { getDisplayLabel } = utils;

export type TextWidgetProps = WidgetProps & Pick<TextFieldProps, Exclude<keyof TextFieldProps, 'onBlur' | 'onFocus'>>;

const TextWidget = ({
  id,
  placeholder,
  required,
  readonly,
  disabled,
  type,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  uiSchema,
  rawErrors = [],
  formContext,
  ...textFieldProps
}: TextWidgetProps) => {
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = (value === "" ? options.emptyValue : value);
    onChange(rawValue ?
      schema.maxLength ? String(rawValue).substring(0, Number(schema.maxLength)) : rawValue
        : "")
  };
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  );
  const inputType = (type || schema.type) === 'string' ?  'text' : `${type || schema.type}`

  return (
    <>
      <TextField
        id={id}
        placeholder={placeholder}
        label={displayLabel ? label || schema.title : false}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        type={inputType as string}
        value={value || value === 0 ? value : ""}
        error={rawErrors.length > 0}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        InputProps={{ "aria-describedby": utils.ariaDescribedBy(id) }}
        {...(textFieldProps as TextFieldProps)}
      />
      {options.showCharacterCounter &&
      <div>
        <Typography variant="subtitle2" style={{float: "right"}}>{(value ? value.length : 0) + " / " + schema.maxLength}</Typography>
      </div>
      }
    </>
  );
};

export default TextWidget;
