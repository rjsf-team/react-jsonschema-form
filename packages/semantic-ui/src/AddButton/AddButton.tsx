import React from "react";
import { Button, Icon, ButtonProps } from "semantic-ui-react";
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ uiSchema, registry, color, ...props }: IconButtonProps<T, S, F>) {
  return (
    <Button
      title="Add Item"
      color={color as ButtonProps["color"]}
      {...props}
      icon
      size="tiny"
    >
      <Icon name="plus" />
    </Button>
  );
}
