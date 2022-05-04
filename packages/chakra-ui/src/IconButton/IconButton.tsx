import React, { memo } from "react";
import {
  IconButton,
  IconButtonProps as ChakraIconButtonProps,
} from "@chakra-ui/react";

import {
  AddIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DeleteIcon
} from "@chakra-ui/icons";

const mappings = {
  remove: <DeleteIcon />,
  plus: <AddIcon />,
  "arrow-up": <ArrowUpIcon />,
  "arrow-down": <ArrowDownIcon />,
};

type IconButtonProps = Omit<ChakraIconButtonProps, "aria-label" | "icon"> & {
  icon: keyof typeof mappings;
};

/**
 * props used in Template:
 * icon, tabIndex, disabled, onClick
 */
const ChakraIconButton = memo((props: IconButtonProps) => {
  const { icon, ...otherProps } = props;
  return <IconButton {...otherProps} icon={mappings[icon]} aria-label={icon} />;
});

ChakraIconButton.displayName = 'ChakraIconButton';

export default ChakraIconButton;
