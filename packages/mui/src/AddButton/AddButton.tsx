import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
import { AddButtonProps } from "@rjsf/core";

const AddButton: React.ComponentType<AddButtonProps> = (props) => {
  return (
    <Button {...props} color="secondary">
      <AddIcon /> Add Item
    </Button>
  );
};

export default AddButton;
