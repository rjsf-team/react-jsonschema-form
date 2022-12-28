import React, { memo } from "react";
import {
  IconButton,
  IconButtonProps as ChakraIconButtonProps,
} from "@chakra-ui/react";
import { IconButtonProps } from "@rjsf/utils";

import { ArrowUpIcon, ArrowDownIcon, DeleteIcon } from "@chakra-ui/icons";

/**
 * props used in Template:
 * icon, tabIndex, disabled, onClick
 */
const ChakraIconButton = memo((props: IconButtonProps) => {
  const { icon, iconType, uiSchema, registry, ...otherProps } = props;
  return (
    <IconButton
      aria-label={props.title!}
      {...otherProps}
      icon={icon as ChakraIconButtonProps["icon"]}
    />
  );
});

ChakraIconButton.displayName = "ChakraIconButton";

export default ChakraIconButton;

export function MoveDownButton(props: IconButtonProps) {
  return (
    <ChakraIconButton title="Move down" {...props} icon={<ArrowDownIcon />} />
  );
}

export function MoveUpButton(props: IconButtonProps) {
  return <ChakraIconButton title="Move up" {...props} icon={<ArrowUpIcon />} />;
}

export function RemoveButton(props: IconButtonProps) {
  return <ChakraIconButton title="Remove" {...props} icon={<DeleteIcon />} />;
}
