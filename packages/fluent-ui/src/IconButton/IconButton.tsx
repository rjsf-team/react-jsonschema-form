import React from "react";
import { IconButton, IIconProps } from "@fluentui/react";
import { IconButtonProps } from "@rjsf/utils";

export default function FluentIconButton(props: IconButtonProps) {
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

export function MoveDownButton(props: IconButtonProps) {
  return <FluentIconButton title="Move down" {...props} icon="Down" />;
}

export function MoveUpButton(props: IconButtonProps) {
  return <FluentIconButton title="Move up" {...props} icon="Up" />;
}

export function RemoveButton(props: IconButtonProps) {
  return <FluentIconButton title="Remove" {...props} icon="Delete" />;
}
