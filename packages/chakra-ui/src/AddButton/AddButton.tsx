import { ButtonProps, Button } from "@chakra-ui/core";
import { AddButtonProps } from "@rjsf/core";
import React from "react";
import { MdAdd } from "react-icons/md";

const AddButton: React.FC<AddButtonProps | ButtonProps> = (props) => (
  <Button
    variant="outline"
    fontWeight="500"
    size="sm"
    leftIcon={<MdAdd />}
    {...props}
  >
    {props.children}
  </Button>
);

export default AddButton;
