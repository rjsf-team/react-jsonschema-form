import * as React from "react";
import AddIcon from "@material-ui/icons/Add";
import Button from "@material-ui/core/Button";
import { AddButtonProps } from "@rjsf/core";

const AddButton: React.ComponentType<AddButtonProps> = (props) => {
  return (
    <Button {...props} color="secondary">
      <AddIcon /> Add Item
    </Button>
  );
};

export default AddButton;
