import { IconButton, IIconProps } from '@fluentui/react';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

export default function FluentIconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  const iconProps: IIconProps = {
    iconName: props.icon as string,
  };

  return <IconButton disabled={props.disabled} onClick={props.onClick} iconProps={iconProps} color='secondary' />;
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <FluentIconButton<T, S, F> title={translateString(TranslatableString.CopyButton)} {...props} icon='Copy' />;
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <FluentIconButton<T, S, F> title={translateString(TranslatableString.MoveDownButton)} {...props} icon='Down' />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <FluentIconButton<T, S, F> title={translateString(TranslatableString.MoveUpButton)} {...props} icon='Up' />;
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <FluentIconButton<T, S, F> title={translateString(TranslatableString.RemoveButton)} {...props} icon='Delete' />
  );
}
