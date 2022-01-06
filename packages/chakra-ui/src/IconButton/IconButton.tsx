import React from "react";
import {
  IconButton,
  IconButtonProps as ChakraIconButtonProps,
} from "@chakra-ui/react";

import {
  AddIcon,
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@chakra-ui/icons";

const mappings = {
  remove: <MinusIcon />,
  plus: <AddIcon />,
  "arrow-up": <ArrowUpIcon />,
  "arrow-down": <ArrowDownIcon />,
};

type IconButtonProps = Omit<ChakraIconButtonProps, "aria-label" | "icon"> & {
  icon: keyof typeof mappings;
};
const MyIconButton = (props: IconButtonProps) => {
  const { icon, ...otherProps } = props;
  /* prettier-ignore */
  return <IconButton {...otherProps} size="sm" icon={mappings[icon]} aria-label={icon}/>;
};

export default MyIconButton;
