import { Button, ButtonProps } from 'primereact/button';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

export type PrimeIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = IconButtonProps<T, S, F> & Omit<ButtonProps, 'onClick'>;

export default function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const { icon, iconType, uiSchema, registry, ...otherProps } = props;
  return <Button icon={`pi pi-${icon}`} rounded text severity='secondary' {...otherProps} />;
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon='copy' />;
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon='angle-down' />;
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon='angle-up' />;
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.RemoveButton)} {...props} icon='trash' />;
}

export function ClearButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.ClearButton)} {...props} icon='times' />;
}
