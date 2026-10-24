import { memo } from 'react';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { clsx } from 'clsx';

/** The strokes of each named icon, in a 16 by 16 box */
const ICON_PATHS: Record<string, string> = {
  plus: 'M8 3v10M3 8h10',
  copy: 'M6 6h7v7H6zM3 10V3h7',
  'arrow-up': 'M8 13V3m-4 4 4-4 4 4',
  'arrow-down': 'M8 3v10m-4-4 4 4 4-4',
  remove: 'M4 4l8 8M12 4l-8 8',
};

/** A `<button>` carrying an inline SVG icon, named by `icon`, or the element `icon` is */
function IconButtonFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: IconButtonProps<T, S, F>) {
  const { iconType = 'default', icon, className, uiSchema, registry, ...otherProps } = props;
  const { classMap } = registry;
  const path = typeof icon === 'string' ? ICON_PATHS[icon] : undefined;
  return (
    // The icon is hidden from assistive technology, so the title names the button, as a label, unless the caller
    // names it otherwise
    <button
      type='button'
      className={clsx('rjsf-button', `rjsf-button-${iconType}`, classMap.iconButton, className)}
      aria-label={otherProps.title}
      {...otherProps}
    >
      {typeof icon === 'object'
        ? icon
        : path && (
            <svg
              className={clsx('rjsf-button-icon', classMap.buttonIcon)}
              viewBox='0 0 16 16'
              width='1em'
              height='1em'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <path d={path} />
            </svg>
          )}
    </button>
  );
}
const IconButton = memo(IconButtonFn) as typeof IconButtonFn;
export default IconButton;

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
      className={clsx('rjsf-btn-clear', className)}
      title={translateString(TranslatableString.ClearButton)}
      onClick={onClick}
      disabled={disabled}
      registry={registry}
      {...props}
    />
  );
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
