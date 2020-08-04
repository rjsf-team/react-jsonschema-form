import React from "react";
import Button from "react-bootstrap/Button";
import { IoIosRemove } from "react-icons/io";
import { GrAdd } from "react-icons/gr";
import { AiOutlineArrowUp, AiOutlineArrowDown } from "react-icons/ai";

const mappings: any = {
  remove: <IoIosRemove />,
  plus: <GrAdd />,
  "arrow-up": <AiOutlineArrowUp />,
  "arrow-down": <AiOutlineArrowDown />,
};

type IconButtonProps = {
  icon: string;
  className?: string;
  tabIndex?: number;
  style?: any;
  disabled?: any;
  onClick?: any;
};

const IconButton = (props: IconButtonProps) => {
  const { icon, className, ...otherProps } = props;
  return (
    <Button {...otherProps} variant="light" size="sm">
      {mappings[icon]}
    </Button>
  );
};

export default IconButton;
