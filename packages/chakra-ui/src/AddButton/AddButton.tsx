import React from "react";
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { Button } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ uiSchema, registry, ...props }: IconButtonProps<T, S, F>) {
  return (
    <Button leftIcon={<AddIcon />} {...props}>
      Add Item
    </Button>
  );
}
