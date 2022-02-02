import React from "react";

import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";

import { utils, WidgetProps } from "@visma/rjsf-core";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  inputLabelRoot: {
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1
  },
  inputFormControl: {
    "label + &": {
      marginTop: 0
    }
  }
});

const { asNumber, guessType } = utils;

const nums = new Set(["number", "integer"]);

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema: any, value: any) => {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema;
  if (value === "") {
    return undefined;
  } else if (type === "array" && items && nums.has(items.type)) {
    return value.map(asNumber);
  } else if (type === "boolean") {
    return value === "true";
  } else if (type === "number") {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every((x: any) => guessType(x) === "number")) {
      return asNumber(value);
    } else if (schema.enum.every((x: any) => guessType(x) === "boolean")) {
      return value === "true";
    }
  }

  return value;
};

const SelectWidget = ({
  schema,
  id,
  options,
  label,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
}: WidgetProps) => {
  const { enumOptions, enumDisabled } = options;

  const emptyValue = multiple ? [] : "";

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
    onChange(processValue(schema, value));
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, processValue(schema, value));
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, processValue(schema, value));

  const classes = useStyles();
  let ariaLabel = label;

  if (!ariaLabel) {
    const element = options!.element as {label: string, title: string, useLabel: boolean};
    ariaLabel = element.useLabel ? element.label : element.title;
  }

  return (
    <TextField
      id={id}
      select
      value={typeof value === "undefined" ? emptyValue : value}
      required={required}
      label={ariaLabel}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      InputProps={{classes: {formControl: classes.inputFormControl }}}
      InputLabelProps={{
        shrink: false,
        className: classes.inputLabelRoot
      }}
      SelectProps={{
        multiple: typeof multiple === "undefined" ? false : multiple,
        "aria-describedby": utils.ariaDescribedBy(id),
      }}>
      {(enumOptions as any).map(({ value, label }: any, i: number) => {
        const disabled: any =
          enumDisabled && (enumDisabled as any).indexOf(value) != -1;
        return (
          <MenuItem key={i} value={value} disabled={disabled}>
            {label}
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default SelectWidget;
