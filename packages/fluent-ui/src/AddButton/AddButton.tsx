import React from "react";
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { IIconProps, CommandBarButton } from "@fluentui/react";

const addIcon: IIconProps = { iconName: "Add" };

export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  return (
    <CommandBarButton
      style={{ height: "32px" }}
      iconProps={addIcon}
      text="Add item"
      className={props.className}
      onClick={props.onClick}
      disabled={props.disabled}
    />
  );
}
