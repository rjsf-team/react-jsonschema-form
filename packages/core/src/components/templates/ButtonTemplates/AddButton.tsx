import React from "react";
import { IconButtonProps } from "@rjsf/utils";

import IconButton from "./IconButton";

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton({
  className,
  onClick,
  disabled,
}: IconButtonProps) {
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
