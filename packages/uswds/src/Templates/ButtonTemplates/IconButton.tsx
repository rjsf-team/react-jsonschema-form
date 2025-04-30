import React, { ComponentType, MouseEvent, ReactElement } from 'react';
import { Button, ButtonProps } from '@trussworks/react-uswds';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  Registry,
} from '@rjsf/utils';

// Pick properties from RjsfIconButtonProps, potentially omitting conflicting ones like 'type' if necessary
type PickedButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = Pick<RjsfIconButtonProps<T, S, F>, 'icon' | 'iconType' | 'uiSchema' | 'registry'>;

// Resolve the conflict by explicitly defining the 'type' prop or omitting it from PickedButtonProps
export interface IconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> extends Omit<ButtonProps, 'icon' | 'iconType' | 'type'> { // Omit type here
  iconType?: string;
  icon?: string | ReactElement;
  uiSchema?: UiSchema<T, S, F>;
  registry: Registry<T, S, F>;
  type?: 'button' | 'submit' | 'reset'; // Make type optional here but Button requires it
}

/** The `IconButton` component is used internally to render an icon button.
 *
 * @param props - The `IconButtonProps` for the component
 */
export default function IconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const { iconType, icon, className, uiSchema, registry, type = 'button', ...otherProps } = props; // Default type to 'button'
  return (
    <Button type={type} className={`btn-${iconType} ${className}`} {...otherProps}>
      {icon}
    </Button>
  );
}
