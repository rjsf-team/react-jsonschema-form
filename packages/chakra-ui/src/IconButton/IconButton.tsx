import React from "react";
import { IconButton } from "@chakra-ui/core";
import { MdAdd, MdRemove, MdArrowUpward, MdArrowDownward } from 'react-icons/md'

const mappings = {
  "remove": < MdRemove />,
  "plus": <MdAdd />,
  "arrow-up": <MdArrowUpward />,
  "arrow-down": <MdArrowDownward />,
};

// type TIconButtonProps = IconButtonProps & {
//   iconMap: string | number | unknown
// }

const MyIconButton = (props: { [x: string]: any; iconMap: any; }) => {
  const { iconMap, ...otherProps } = props;
  //@ts-ignore
  return <IconButton {...otherProps} size="sm" icon={mappings[iconMap] ?? <MdAdd />} />;
};

export default MyIconButton;
