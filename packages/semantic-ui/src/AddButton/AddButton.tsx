import React from "react";
import { IconButtonProps } from "@rjsf/utils";
import { Button, Icon, ButtonProps } from "semantic-ui-react";

function AddButton({ uiSchema, registry, color, ...props }: IconButtonProps) {
  return (
    <Button
      title="Add Item"
      color={color as ButtonProps["color"]}
      {...props}
      icon
      size="tiny"
    >
      <Icon name="plus" />
    </Button>
  );
}

export default AddButton;
