import React from "react";

import { IconButton as IconButton_, IIconProps } from "@fluentui/react";
import { AddButtonProps as FuiIconButtonProps } from "@rjsf/core";

const RemoveIcon: IIconProps = { iconName: "Remove" };
const UpIcon: IIconProps = { iconName: "Up" };
const DownIcon: IIconProps = { iconName: "Down" };

const mappings: any = {
  remove: RemoveIcon,
  "arrow-up": UpIcon,
  "arrow-down": DownIcon,
};

type AddButtonProps = FuiIconButtonProps & {
  icon: string;
};

const IconButton: React.FC<AddButtonProps> = props => (
  <>
    <IconButton_
      onClick={e => props.onClick(e as any)}
      iconProps={mappings[props.icon]}
      color="secondary"></IconButton_>
  </>
);

export default IconButton;
