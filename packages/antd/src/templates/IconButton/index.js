import React from "react";

import Button from "antd/lib/button";
import ArrowDownOutlined from "@ant-design/icons/ArrowDownOutlined";
import ArrowUpOutlined from "@ant-design/icons/ArrowUpOutlined";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import PlusCircleOutlined from "@ant-design/icons/PlusCircleOutlined";

export default function IconButton(props) {
  const { iconType = "default", icon, uiSchema, ...otherProps } = props;
  return <Button type={iconType} icon={icon} {...otherProps} />;
}

export function AddButton(props) {
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

export function MoveDownButton(props) {
  return (
    <IconButton title="Move down" {...props} icon={<ArrowDownOutlined />} />
  );
}

export function MoveUpButton(props) {
  return <IconButton title="Move up" {...props} icon={<ArrowUpOutlined />} />;
}

export function RemoveButton(props) {
  return (
    <IconButton
      title="Remove"
      {...props}
      danger
      iconType="primary"
      icon={<DeleteOutlined />}
    />
  );
}
