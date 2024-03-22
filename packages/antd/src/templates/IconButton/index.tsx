import { Button, ButtonProps } from 'antd';
import ArrowDownOutlined from '@ant-design/icons/ArrowDownOutlined';
import ArrowUpOutlined from '@ant-design/icons/ArrowUpOutlined';
import CopyOutlined from '@ant-design/icons/CopyOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import PlusCircleOutlined from '@ant-design/icons/PlusCircleOutlined';
import {
  getUiOptions,
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';
import { MouseEventHandler } from 'react';

// The `type` for IconButtonProps collides with the `type` for `ButtonProps` so omit it to avoid Typescript issue
export type AntdIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = Omit<IconButtonProps<T, S, F>, 'type'>;

export default function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F> & Omit<ButtonProps, 'onClick'>
) {
  const { iconType = 'default', icon, onClick, uiSchema, registry, ...otherProps } = props;
  return (
    <Button
      onClick={onClick as MouseEventHandler<HTMLAnchorElement> & MouseEventHandler<HTMLButtonElement>}
      type={iconType as ButtonProps['type']}
      icon={icon}
      {...otherProps}
    />
  );
}

export function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.AddItemButton)}
      {...props}
      block
      iconType='primary'
      icon={<PlusCircleOutlined />}
    />
  );
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon={<CopyOutlined />} />;
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon={<ArrowDownOutlined />} />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon={<ArrowUpOutlined />} />;
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>
) {
  // The `block` prop is not part of the `IconButtonProps` defined in the template, so get it from the uiSchema instead
  const options = getUiOptions<T, S, F>(props.uiSchema);
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.RemoveButton)}
      {...props}
      danger
      block={!!options.block}
      iconType='primary'
      icon={<DeleteOutlined />}
    />
  );
}
