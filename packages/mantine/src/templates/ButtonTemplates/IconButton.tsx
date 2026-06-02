import { memo, MouseEventHandler } from 'react';
import { ActionIcon, ActionIconProps } from '@mantine/core';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

import { Copy, ChevronDown, ChevronUp, X } from '../icons';

export type MantineIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = IconButtonProps<T, S, F> & Omit<ActionIconProps, 'onClick'>;

function IconButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const { icon, iconType = 'sm', color, onClick, uiSchema, registry, ...otherProps } = props;
  return (
    <ActionIcon
      size={iconType as ActionIconProps['size']}
      color={color as ActionIconProps['color']}
      onClick={onClick as MouseEventHandler<HTMLAnchorElement> & MouseEventHandler<HTMLButtonElement>}
      {...otherProps}
    >
      {icon}
    </ActionIcon>
  );
}
const IconButton = memo(IconButtonFn) as typeof IconButtonFn;
export default IconButton;

function CopyButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.CopyButton)} variant='subtle' {...props} icon={<Copy />} />
  );
}
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

function MoveDownButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.MoveDownButton)}
      variant='subtle'
      {...props}
      icon={<ChevronDown />}
    />
  );
}
export const MoveDownButton = memo(MoveDownButtonFn) as typeof MoveDownButtonFn;

function MoveUpButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.MoveUpButton)}
      variant='subtle'
      {...props}
      icon={<ChevronUp />}
    />
  );
}
export const MoveUpButton = memo(MoveUpButtonFn) as typeof MoveUpButtonFn;

function RemoveButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.RemoveButton)}
      variant='subtle'
      color='red'
      {...props}
      icon={<X />}
    />
  );
}
export const RemoveButton = memo(RemoveButtonFn) as typeof RemoveButtonFn;

function ClearButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.ClearButton)} variant='subtle' {...props} icon={<X />} />
  );
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
