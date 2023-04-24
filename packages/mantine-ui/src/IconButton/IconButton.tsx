import { ActionIcon, ButtonProps } from '@mantine/core';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { ChevronDown, ChevronUp, Copy, Trash } from 'tabler-icons-react';

function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const { icon, iconType, color, className, uiSchema, registry, ...otherProps } = props;
  return (
    <ActionIcon
      size={iconType as ButtonProps['size']}
      color={color as ButtonProps['color']}
      className={className}
      {...otherProps}
    >
      {icon}
    </ActionIcon>
  );
}

export default IconButton;

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon={<Copy />} />;
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon={<ChevronDown />} />;
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon={<ChevronUp />} />;
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.RemoveButton)} {...props} icon={<Trash />} />;
}
