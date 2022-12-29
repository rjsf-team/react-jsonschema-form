import React from "react";
import IconButton, {
  IconButtonProps as MuiIconButtonProps,
} from "@mui/material/IconButton";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

export default function MuiIconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  const { icon, color, uiSchema, registry, ...otherProps } = props;
  return (
    <IconButton
      {...otherProps}
      size="small"
      color={color as MuiIconButtonProps["color"]}
    >
      {icon}
    </IconButton>
  );
}

export function MoveDownButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return (
    <MuiIconButton
      title="Move down"
      {...props}
      icon={<ArrowDownwardIcon fontSize="small" />}
    />
  );
}

export function MoveUpButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return (
    <MuiIconButton
      title="Move up"
      {...props}
      icon={<ArrowUpwardIcon fontSize="small" />}
    />
  );
}

export function RemoveButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  const { iconType, ...otherProps } = props;
  return (
    <MuiIconButton
      title="Remove"
      {...otherProps}
      color="error"
      icon={
        <RemoveIcon fontSize={iconType === "default" ? undefined : "small"} />
      }
    />
  );
}
