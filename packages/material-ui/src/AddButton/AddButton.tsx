import React from "react";
import AddIcon from "@material-ui/icons/Add";
import IconButton from "@material-ui/core/IconButton";
import { IconButtonProps } from "@rjsf/utils";

const AddButton: React.ComponentType<IconButtonProps> = ({
  uiSchema,
  ...props
}) => {
  return (
    <IconButton title="Add Item" {...props} color="primary">
      <AddIcon />
    </IconButton>
  );
};

export default AddButton;
