import React from "react";

import { AddButtonProps } from "@rjsf/core";
import Button, {ButtonProps} from "react-bootstrap/Button";
import { BsPlus } from "react-icons/bs";
import { useCallback } from "react";

const AddButton: React.FC<AddButtonProps>  = props => {
  const onClick: ButtonProps['onClick'] = useCallback((e) => {
    props?.onClick(e)

  }, [props.onClick])

  return (
  <Button {...props} color="primary" onClick={onClick} style={{width: "100%"}} className="ml-1">
    <BsPlus/>
  </Button>
)
  };

export default AddButton;
