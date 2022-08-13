import * as React from "react";

import IconButton from "./IconButton";

/** The properties that are passed to the `AddButton` */
export interface AddButtonProps {
  /** The class name for the add button */
  className?: string;
  /** The click event handler for the button */
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  /** A boolean value stating if the button is disabled */
  disabled?: boolean;
}

/** The `AddButton` renders a button that represent the `Add` action on a form */
export default function AddButton({
  className,
  onClick,
  disabled,
}: AddButtonProps) {
  return (
    <div className="row">
      <p className={`col-xs-3 col-xs-offset-9 text-right ${className}`}>
        <IconButton
          type="info"
          icon="plus"
          className="btn-add col-xs-12"
          aria-label="Add"
          tabIndex="0"
          onClick={onClick}
          disabled={disabled}
        />
      </p>
    </div>
  );
}
