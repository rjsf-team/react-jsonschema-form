import { memo } from 'react';
import { Button, ButtonProps } from '@fluentui/react-components';
import {
  ArrowSortUpRegular,
  ArrowSortDownRegular,
  CopyRegular,
  SubtractRegular,
  DismissRegular,
} from '@fluentui/react-icons';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

export type FluentIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = IconButtonProps<T, S, F> & Omit<ButtonProps, 'onChange' | 'as'>;

function FluentIconButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FluentIconButtonProps<T, S, F>,
) {
  const { color, uiSchema, registry, ...otherProps } = props;

  return <Button {...otherProps} color='secondary' />;
}
const FluentIconButton = memo(FluentIconButtonFn) as typeof FluentIconButtonFn;
export default FluentIconButton;

function CopyButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

function MoveDownButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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
export const MoveDownButton = memo(MoveDownButtonFn) as typeof MoveDownButtonFn;

function MoveUpButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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
export const MoveUpButton = memo(MoveUpButtonFn) as typeof MoveUpButtonFn;

function RemoveButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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
export const RemoveButton = memo(RemoveButtonFn) as typeof RemoveButtonFn;

function ClearButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FluentIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <FluentIconButton<T, S, F>
      title={translateString(TranslatableString.ClearButton)}
      {...props}
      icon={<DismissRegular />}
    />
  );
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
