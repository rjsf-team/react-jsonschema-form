import React from "react";
import { IconButton, IIconProps } from "@fluentui/react";
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

export default function FluentIconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  const iconProps: IIconProps = {
    iconName: props.icon as string,
  };

  return (
    <IconButton
      disabled={props.disabled}
      onClick={props.onClick}
      iconProps={iconProps}
      color="secondary"
    />
  );
}

export function MoveDownButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return <FluentIconButton<T, S, F> title="Move down" {...props} icon="Down" />;
}

export function MoveUpButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return <FluentIconButton<T, S, F> title="Move up" {...props} icon="Up" />;
}

export function RemoveButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return <FluentIconButton<T, S, F> title="Remove" {...props} icon="Delete" />;
}
