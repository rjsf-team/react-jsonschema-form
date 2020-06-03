import React from "react";

import { AddButtonProps } from "@rjsf/core";

import { IconButton, IIconProps } from "@fluentui/react";

const addIcon: IIconProps = { iconName: "BoxAdditionSolid" };

const AddButton: React.FC<AddButtonProps> = props => (
  <IconButton
    onClick={e => props.onClick(e as any)}
    iconProps={addIcon}
    color="secondary"></IconButton>
);

export default AddButton;
