import React from "react";
import { IconButtonProps, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

import IconButton from "./IconButton";

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F = any
>({ className, onClick, disabled }: IconButtonProps<T, S, F>) {
  return (
    <div className="row">
      <p className={`col-xs-3 col-xs-offset-9 text-right ${className}`}>
        <IconButton
          iconType="info"
          icon="plus"
          className="btn-add col-xs-12"
          title="Add"
          onClick={onClick}
          disabled={disabled}
        />
      </p>
    </div>
  );
}
