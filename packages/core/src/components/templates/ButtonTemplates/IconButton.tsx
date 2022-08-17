import React from "react";
import { IconButtonProps } from "@rjsf/utils";

export default function IconButton(props: IconButtonProps) {
  const { iconType = "default", icon, className, ...otherProps } = props;
  return (
    <button
      type="button"
      className={`btn btn-${iconType} ${className}`}
      {...otherProps}
    >
      <i className={`glyphicon glyphicon-${icon}`} />
    </button>
  );
}

export function MoveDownButton(props: IconButtonProps) {
  return (
    <IconButton
      title="Move down"
      className="array-item-move-down"
      {...props}
      icon="arrow-down"
    />
  );
}

export function MoveUpButton(props: IconButtonProps) {
  return (
    <IconButton
      title="Move up"
      className="array-item-move-up"
      {...props}
      icon="arrow-up"
    />
  );
}

export function RemoveButton(props: IconButtonProps) {
  return (
    <IconButton
      title="Remove"
      className="array-item-remove"
      {...props}
      iconType="danger"
      icon="remove"
    />
  );
}
