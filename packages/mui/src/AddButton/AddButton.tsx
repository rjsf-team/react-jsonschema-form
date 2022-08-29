import React from "react";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import { IconButtonProps } from "@rjsf/utils";

const AddButton: React.ComponentType<IconButtonProps> = (props) => {
  return (
    <IconButton title="Add Item" {...props} color="primary">
      <AddIcon />
    </IconButton>
  );
};

export default AddButton;
