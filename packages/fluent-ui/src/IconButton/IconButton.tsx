import React from "react";

import { IconButton, IIconProps } from "@fluentui/react";
import { AddButtonProps as FuiIconButtonProps } from "@rjsf/core";

const mappings: {[x: string]: string} = {
  remove: "Delete",
  "arrow-up": "Up",
  "arrow-down": "Down",
};

type IconButtonProps = FuiIconButtonProps & {
  icon: string;
};

export default (props: IconButtonProps) => {
  const iconProps: IIconProps = {
    iconName: mappings[props.icon]
  }
  
 return <IconButton
    disabled={props.disabled}
    onClick={e => props.onClick(e as any)}
    iconProps={iconProps}
    color="secondary" />
}
