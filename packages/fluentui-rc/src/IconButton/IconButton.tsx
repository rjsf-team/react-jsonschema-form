import { Button, ButtonProps } from '@fluentui/react-components';
import { ArrowSortUpRegular, ArrowSortDownRegular, CopyRegular, SubtractRegular } from '@fluentui/react-icons';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

export type FluentIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = IconButtonProps<T, S, F> & Omit<ButtonProps, 'onChange' | 'as'>;

export default function FluentIconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FluentIconButtonProps<T, S, F>) {
  const { color, uiSchema, registry, ...otherProps } = props;

  return <Button {...otherProps} color='secondary' />;
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FluentIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <FluentIconButton<T, S, F>
      title={translateString(TranslatableString.CopyButton)}
      {...props}
      icon={<CopyRegular />}
    />
  );
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FluentIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <FluentIconButton<T, S, F>
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      icon={<ArrowSortDownRegular />}
    />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FluentIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <FluentIconButton<T, S, F>
      title={translateString(TranslatableString.MoveUpButton)}
      {...props}
      icon={<ArrowSortUpRegular />}
    />
  );
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FluentIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <FluentIconButton<T, S, F>
      title={translateString(TranslatableString.RemoveButton)}
      {...props}
      icon={<SubtractRegular />}
    />
  );
}
