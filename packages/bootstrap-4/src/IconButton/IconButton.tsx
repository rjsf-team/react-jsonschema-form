import React from "react";
import Button, { ButtonProps } from "react-bootstrap/Button";
import { IoIosRemove } from "@react-icons/all-files/io/IoIosRemove.esm";
import { GrAdd } from "@react-icons/all-files/gr/GrAdd.esm";
import { AiOutlineArrowUp } from "@react-icons/all-files/ai/AiOutlineArrowUp.esm";
import { AiOutlineArrowDown } from "@react-icons/all-files/ai/AiOutlineArrowDown.esm";

const mappings: any = {
  remove: <IoIosRemove />,
  plus: <GrAdd />,
  "arrow-up": <AiOutlineArrowUp />,
  "arrow-down": <AiOutlineArrowDown />,
};

type IconButtonProps = ButtonProps & {
  icon: string;
  variant?: ButtonProps['variant'];
  className?: string;
  tabIndex?: number;
  style?: any;
  disabled?: any;
  onClick?: any;
};

const IconButton = (props: IconButtonProps) => {
  const { icon, className, ...otherProps } = props;
  return (
    <Button {...otherProps} variant={props.variant || "light"} size="sm">
      {mappings[icon]}
    </Button>
  );
};

export default IconButton;
