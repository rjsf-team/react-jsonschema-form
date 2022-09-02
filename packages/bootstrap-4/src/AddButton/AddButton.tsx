import React from "react";

import { IconButtonProps } from "@rjsf/utils";
import Button from "react-bootstrap/Button";
import { BsPlus } from "@react-icons/all-files/bs/BsPlus";

const AddButton: React.ComponentType<IconButtonProps> = (props) => (
  <Button
    {...props}
    style={{ width: "100%" }}
    className={`ml-1 ${props.className}`}
    title="Add Item"
  >
    <BsPlus />
  </Button>
);

export default AddButton;
