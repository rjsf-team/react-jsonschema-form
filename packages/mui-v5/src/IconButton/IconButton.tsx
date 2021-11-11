import React from "react";

import Button from "@mui/material/Button";
import Add from "@mui/icons-material/Add";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import Remove from "@mui/icons-material/Remove";
import { IconButtonProps as MuiIconButtonProps } from "@mui/material/IconButton";

const mappings: any = {
  remove: Remove,
  plus: Add,
  "arrow-up": ArrowUpward,
  "arrow-down": ArrowDownward,
};

type IconButtonProps = MuiIconButtonProps & {
  icon: string;
  iconProps?: object;
};

const IconButton = (props: IconButtonProps) => {
  const { icon, className, iconProps, ...otherProps } = props;
  const IconComp = mappings[icon];
  return (
    <Button {...otherProps} size="small">
      <IconComp {...iconProps} />
    </Button>
  );
};

export default IconButton;
