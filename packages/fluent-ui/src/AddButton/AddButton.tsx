import React from "react";
import { IconButtonProps } from "@rjsf/utils";
import { IIconProps, CommandBarButton } from "@fluentui/react";

const addIcon: IIconProps = { iconName: "Add" };

const AddButton = (props: IconButtonProps) => (
  <CommandBarButton
    style={{ height: "32px" }}
    iconProps={addIcon}
    text="Add item"
    className={props.className}
    onClick={props.onClick}
    disabled={props.disabled}
  />
);

export default AddButton;
