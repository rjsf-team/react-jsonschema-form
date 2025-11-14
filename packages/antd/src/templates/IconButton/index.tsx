import { Button, ButtonProps } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import {
  getUiOptions,
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';
import { MouseEventHandler } from 'react';

export type AntdIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = IconButtonProps<T, S, F> & Pick<ButtonProps, 'block' | 'danger' | 'size'>;

export default function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>,
) {
  const { iconType = 'default', icon, onClick, uiSchema, registry, color, ...otherProps } = props;
  return (
    <Button
      onClick={onClick as MouseEventHandler<HTMLAnchorElement> & MouseEventHandler<HTMLButtonElement>}
      // @ts-expect-error TS2322, Because even casting as `ButtonProps['type']` has issues
      type={iconType}
      icon={icon}
      color={color as ButtonProps['color']}
      style={{ paddingTop: '4px' /* Center the button */ }}
      {...otherProps}
    />
  );
}

export function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.AddItemButton)}
      iconType='primary'
      block
      {...props}
      icon={<PlusCircleOutlined />}
    />
  );
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon={<CopyOutlined />} />;
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon={<ArrowDownOutlined />} />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon={<ArrowUpOutlined />} />;
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AntdIconButtonProps<T, S, F>,
) {
  // The `block` prop is not part of the `IconButtonProps` defined in the template, so get it from the uiSchema instead
  const options = getUiOptions<T, S, F>(props.uiSchema);
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.RemoveButton)}
      danger
      block={!!options.block}
      iconType='primary'
      {...props}
      icon={<DeleteOutlined />}
    />
  );
}
