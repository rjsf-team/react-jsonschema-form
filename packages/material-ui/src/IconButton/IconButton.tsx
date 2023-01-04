import React from "react";
import IconButton, {
  IconButtonProps as MuiIconButtonProps,
} from "@material-ui/core/IconButton";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import RemoveIcon from "@material-ui/icons/Remove";
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
      color="secondary"
      icon={
        <RemoveIcon fontSize={iconType === "default" ? "medium" : "small"} />
      }
    />
  );
}
