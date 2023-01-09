import React from "react";
import { Button, ButtonProps } from "semantic-ui-react";
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

function IconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  const {
    icon,
    iconType,
    color,
    className,
    uiSchema,
    registry,
    ...otherProps
  } = props;
  return (
    <Button
      icon={icon}
      size={iconType as ButtonProps["size"]}
      color={color as ButtonProps["color"]}
      className={className}
      {...otherProps}
    />
  );
}

export default IconButton;

export function MoveDownButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return <IconButton title="Move down" {...props} icon="angle down" />;
}

export function MoveUpButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return <IconButton title="Move up" {...props} icon="angle up" />;
}

export function RemoveButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return <IconButton title="Remove" {...props} icon="trash" />;
}
