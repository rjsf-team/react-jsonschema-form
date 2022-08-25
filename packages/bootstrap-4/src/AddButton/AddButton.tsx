import React from "react";

import { AddButtonProps } from "@rjsf/core";
import Button from "react-bootstrap/Button";
import { BsPlus } from "@react-icons/all-files/bs/BsPlus";

const AddButton: React.FC<AddButtonProps> = props => (
  <Button {...props} style={{width: "100%"}} className={`ml-1 ${props.className}`}>
    <BsPlus/>
  </Button>
);

export default AddButton;
