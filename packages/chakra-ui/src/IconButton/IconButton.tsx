import React from "react";

import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import { ArrowUpIcon, ArrowDownIcon, DeleteIcon } from "@chakra-ui/icons";
import ChakraIconButton from "./ChakraIconButton";

export function MoveDownButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return (
    <ChakraIconButton<T, S, F>
      title="Move down"
      {...props}
      icon={<ArrowDownIcon />}
    />
  );
}

export function MoveUpButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return (
    <ChakraIconButton<T, S, F>
      title="Move up"
      {...props}
      icon={<ArrowUpIcon />}
    />
  );
}

export function RemoveButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return (
    <ChakraIconButton<T, S, F>
      title="Remove"
      {...props}
      icon={<DeleteIcon />}
    />
  );
}
