import React from "react";
import { IconButtonProps, getUiOptions } from "@rjsf/utils";
import Button, { ButtonProps, ButtonType } from "antd/lib/button";
import ArrowDownOutlined from "@ant-design/icons/ArrowDownOutlined";
import ArrowUpOutlined from "@ant-design/icons/ArrowUpOutlined";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import PlusCircleOutlined from "@ant-design/icons/PlusCircleOutlined";

// The `type` for IconButtonProps collides with the `type` for `ButtonProps` so omit it to avoid Typescript issue
export type AntdIconButtonProps = Omit<IconButtonProps, "type">;

export default function IconButton(props: AntdIconButtonProps & ButtonProps) {
  const {
    iconType = "default",
    icon,
    uiSchema,
    registry,
    ...otherProps
  } = props;
  return <Button type={iconType as ButtonType} icon={icon} {...otherProps} />;
}

export function AddButton(props: AntdIconButtonProps) {
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

export function MoveDownButton(props: AntdIconButtonProps) {
  return (
    <IconButton title="Move down" {...props} icon={<ArrowDownOutlined />} />
  );
}

export function MoveUpButton(props: AntdIconButtonProps) {
  return <IconButton title="Move up" {...props} icon={<ArrowUpOutlined />} />;
}

export function RemoveButton(props: AntdIconButtonProps) {
  // The `block` prop is not part of the `IconButtonProps` defined in the template, so get it from the uiSchema instead
  const options = getUiOptions(props.uiSchema);
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
