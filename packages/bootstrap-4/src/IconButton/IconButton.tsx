import React from "react";
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import Button, { ButtonProps } from "react-bootstrap/Button";
import { IoIosRemove } from "@react-icons/all-files/io/IoIosRemove";
import { AiOutlineArrowUp } from "@react-icons/all-files/ai/AiOutlineArrowUp";
import { AiOutlineArrowDown } from "@react-icons/all-files/ai/AiOutlineArrowDown";

export default function IconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F> & ButtonProps) {
  const { icon, iconType, className, uiSchema, registry, ...otherProps } =
    props;
  return (
    <Button
      block={iconType === "block"}
      {...otherProps}
      variant={props.variant || "light"}
      size="sm"
    >
      {icon}
    </Button>
  );
}

export function MoveDownButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return (
    <IconButton title="Move down" {...props} icon={<AiOutlineArrowDown />} />
  );
}

export function MoveUpButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return <IconButton title="Move up" {...props} icon={<AiOutlineArrowUp />} />;
}

export function RemoveButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return (
    <IconButton
      title="Remove"
      {...props}
      variant="danger"
      icon={<IoIosRemove />}
    />
  );
}
