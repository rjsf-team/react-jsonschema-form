import React from "react";

import { AddButtonProps } from "@rjsf/core";
import Button from "react-bootstrap/Button";
import { BsPlus } from "react-icons/bs";

const AddButton: React.FC<AddButtonProps> = props => (
  <Button {...props} style={{width: "100%"}} className={`${props.className} ml-1`}>
    <BsPlus/>
  </Button>
);

export default AddButton;
