import React from "react";

import { AddButtonProps } from "@rjsf/core";
import Button from "react-bootstrap/Button";
import { AiOutlinePlus } from "react-icons/ai";

const AddButton: React.FC<AddButtonProps> = props => (
  <Button {...props} color="primary" style={{width: "100%"}} className="ml-1">
    <AiOutlinePlus/>
  </Button>
);

export default AddButton;
