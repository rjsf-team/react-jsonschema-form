import { memo } from 'react';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { clsx } from 'clsx';

/** Renders a Bootstrap 3 `btn` with a glyphicon
 *
 * @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme
 */
function IconButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: IconButtonProps<T, S, F>) {
  const { iconType = 'default', icon, className, uiSchema, registry, ...otherProps } = props;
  return (
    <button type='button' className={clsx('btn', `btn-${iconType}`, className)} {...otherProps}>
      {typeof icon === 'object' ? icon : <i className={`glyphicon glyphicon-${icon}`} />}
    </button>
  );
}
const IconButton = memo(IconButtonFn) as typeof IconButtonFn;
export default IconButton;

/** The `copy` icon button
 *
 * @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme
 */
function CopyButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon='copy' />;
}
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

/** The `arrow-down` icon button
 *
 * @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme
 */
function MoveDownButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon='arrow-down' />;
}
export const MoveDownButton = memo(MoveDownButtonFn) as typeof MoveDownButtonFn;

/** The `arrow-up` icon button
 *
 * @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme
 */
function MoveUpButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon='arrow-up' />;
}
export const MoveUpButton = memo(MoveUpButtonFn) as typeof MoveUpButtonFn;

/** The `remove` icon button, as `btn-danger`
 *
 * @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme
 */
function RemoveButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.RemoveButton)} {...props} iconType='danger' icon='remove' />
  );
}
export const RemoveButton = memo(RemoveButtonFn) as typeof RemoveButtonFn;

/** The `remove` icon button that clears a field
 *
 * @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme
 */
function ClearButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, className, onClick, disabled, registry, ...props }: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <IconButton
      id={id}
      iconType='default'
      icon='remove'
      className='btn-clear col-xs-12'
      title={translateString(TranslatableString.ClearButton)}
      onClick={onClick}
      disabled={disabled}
      registry={registry}
      {...props}
    />
  );
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
