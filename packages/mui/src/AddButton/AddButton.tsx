import React from "react";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
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
>({ uiSchema, registry, ...props }: IconButtonProps<T, S, F>) {
  return (
    <IconButton title="Add Item" {...props} color="primary">
      <AddIcon />
    </IconButton>
  );
}
