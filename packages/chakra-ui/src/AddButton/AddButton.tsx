import React from "react";
import { IconButtonProps } from "@rjsf/utils";
import { Button } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

const AddButton: React.ComponentType<IconButtonProps> = (props) => (
  <Button leftIcon={<AddIcon />} {...props}>
    Add Item
  </Button>
);

export default AddButton;
