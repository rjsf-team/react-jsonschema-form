import React from "react";
import { IconButtonProps } from "@rjsf/utils";
import { Button, ButtonProps } from "semantic-ui-react";

function IconButton(props: IconButtonProps) {
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

export function MoveDownButton(props: IconButtonProps) {
  return <IconButton title="Move down" {...props} icon="angle down" />;
}

export function MoveUpButton(props: IconButtonProps) {
  return <IconButton title="Move up" {...props} icon="angle up" />;
}

export function RemoveButton(props: IconButtonProps) {
  return <IconButton title="Remove" {...props} icon="trash" />;
}
