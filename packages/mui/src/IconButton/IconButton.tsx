import React from "react";
import IconButton, {
  IconButtonProps as MuiIconButtonProps,
} from "@mui/material/IconButton";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import RemoveIcon from "@mui/icons-material/Remove";
import { IconButtonProps } from "@rjsf/utils";

export default function MuiIconButton(props: IconButtonProps) {
  const { icon, color, ...otherProps } = props;
  return (
    <IconButton
      {...otherProps}
      size="small"
      color={color as MuiIconButtonProps["color"]}
    >
      {icon}
    </IconButton>
  );
}

export function MoveDownButton(props: IconButtonProps) {
  return (
    <MuiIconButton
      title="Move down"
      {...props}
      icon={<ArrowDownwardIcon fontSize="small" />}
    />
  );
}

export function MoveUpButton(props: IconButtonProps) {
  return (
    <MuiIconButton
      title="Move up"
      {...props}
      icon={<ArrowUpwardIcon fontSize="small" />}
    />
  );
}

export function RemoveButton(props: IconButtonProps) {
  const { iconType, ...otherProps } = props;
  return (
    <MuiIconButton
      title="Remove"
      {...otherProps}
      color="error"
      icon={
        <RemoveIcon fontSize={iconType === "default" ? undefined : "small"} />
      }
    />
  );
}
