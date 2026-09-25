import type { MouseEventHandler } from 'react';
import { memo } from 'react';
import type { ActionIconProps } from '@mantine/core';
import { ActionIcon } from '@mantine/core';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

import { Copy, ChevronDown, ChevronUp, X } from '../icons.tsx';

export type MantineIconButtonProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = IconButtonProps<T, S, F> & Omit<ActionIconProps, 'onClick'>;

function IconButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MantineIconButtonProps<T, S, F>) {
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

function CopyButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MantineIconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.CopyButton)} variant='subtle' {...props} icon={<Copy />} />
  );
}
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

function MoveDownButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MantineIconButtonProps<T, S, F>) {
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

function MoveUpButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MantineIconButtonProps<T, S, F>) {
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

function RemoveButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MantineIconButtonProps<T, S, F>) {
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

function ClearButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MantineIconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.ClearButton)} variant='subtle' {...props} icon={<X />} />
  );
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
