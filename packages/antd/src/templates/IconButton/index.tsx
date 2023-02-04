import React from "react";
import Button, { ButtonProps, ButtonType } from "antd/lib/button";
import ArrowDownOutlined from "@ant-design/icons/ArrowDownOutlined";
import ArrowUpOutlined from "@ant-design/icons/ArrowUpOutlined";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import PlusCircleOutlined from "@ant-design/icons/PlusCircleOutlined";
import {
  getUiOptions,
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

// The `type` for IconButtonProps collides with the `type` for `ButtonProps` so omit it to avoid Typescript issue
export type AntdIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = Omit<IconButtonProps<T, S, F>, "type">;

export default function IconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: AntdIconButtonProps<T, S, F> & ButtonProps) {
  const {
    iconType = "default",
    icon,
    uiSchema,
    registry,
    ...otherProps
  } = props;
  return <Button type={iconType as ButtonType} icon={icon} {...otherProps} />;
}

export function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: AntdIconButtonProps<T, S, F>) {
  return (
    <IconButton
      title="Add Item"
      {...props}
      block
      iconType="primary"
      icon={<PlusCircleOutlined />}
    />
  );
}

export function MoveDownButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: AntdIconButtonProps<T, S, F>) {
  return (
    <IconButton title="Move down" {...props} icon={<ArrowDownOutlined />} />
  );
}

export function MoveUpButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: AntdIconButtonProps<T, S, F>) {
  return <IconButton title="Move up" {...props} icon={<ArrowUpOutlined />} />;
}

export function RemoveButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: AntdIconButtonProps<T, S, F>) {
  // The `block` prop is not part of the `IconButtonProps` defined in the template, so get it from the uiSchema instead
  const options = getUiOptions<T, S, F>(props.uiSchema);
  return (
    <IconButton
      title="Remove"
      {...props}
      danger
      block={!!options.block}
      iconType="primary"
      icon={<DeleteOutlined />}
    />
  );
}
