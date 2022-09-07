import React from "react";
import { IconButtonProps } from "@rjsf/utils";
import Button, { ButtonProps } from "react-bootstrap/Button";
import { IoIosRemove } from "@react-icons/all-files/io/IoIosRemove";
import { AiOutlineArrowUp } from "@react-icons/all-files/ai/AiOutlineArrowUp";
import { AiOutlineArrowDown } from "@react-icons/all-files/ai/AiOutlineArrowDown";

const IconButton = (props: IconButtonProps & ButtonProps) => {
  const { icon, iconType, className, ...otherProps } = props;
  return (
    <Button
      block={iconType === "block"}
      {...otherProps}
      variant={props.variant || "light"}
      size="sm"
    >
      {icon}
    </Button>
  );
};

export default IconButton;

export function MoveDownButton(props: IconButtonProps) {
  return (
    <IconButton title="Move down" {...props} icon={<AiOutlineArrowDown />} />
  );
}

export function MoveUpButton(props: IconButtonProps) {
  return <IconButton title="Move up" {...props} icon={<AiOutlineArrowUp />} />;
}

export function RemoveButton(props: IconButtonProps) {
  return (
    <IconButton
      title="Remove"
      {...props}
      variant="danger"
      icon={<IoIosRemove />}
    />
  );
}
