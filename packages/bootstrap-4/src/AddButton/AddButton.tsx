import React from "react";

import { AddButtonProps } from "@rjsf/core";
import Button from "react-bootstrap/Button";
import { AiOutlinePlus } from "react-icons/ai";

const AddButton: React.FC<AddButtonProps> = props => (
  <Button {...props} color="primary">
    <AiOutlinePlus style={{ fontSize: "2rem" }} />
  </Button>
);

export default AddButton;
