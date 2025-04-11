import React from 'react';
import { ActionIcon, ActionIconProps } from '@mantine/core';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { Copy, ChevronDown, ChevronUp, X } from '../icons';

export type MantineIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = IconButtonProps<T, S, F> & Omit<ActionIconProps, 'onClick'>;

export default function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>
) {
  const { icon, iconType = 'sm', color, onClick, uiSchema, registry, ...otherProps } = props;
  return (
    <ActionIcon
      size={iconType as ActionIconProps['size']}
      color={color as ActionIconProps['color']}
      onClick={onClick as React.MouseEventHandler<HTMLAnchorElement> & React.MouseEventHandler<HTMLButtonElement>}
      {...otherProps}
    >
      {icon}
    </ActionIcon>
  );
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.CopyButton)} variant='subtle' {...props} icon={<Copy />} />
  );
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>
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

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>
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

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: MantineIconButtonProps<T, S, F>
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
