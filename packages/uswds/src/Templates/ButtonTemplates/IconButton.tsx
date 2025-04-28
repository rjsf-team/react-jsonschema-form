import React from 'react';
import { Button } from '@trussworks/react-uswds';
import {
  FormContextType,
  IconButtonProps as RjsfIconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
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
> extends Omit<React.ComponentProps<typeof Button>, 'icon' | 'iconType'>, // Omit conflicting props if necessary
    PickedButtonProps<T, S, F> {
  type?: 'submit' | 'button' | 'reset'; // Explicitly define type or ensure compatibility
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
  const { icon, iconType, className, uiSchema, registry, ...otherProps } = props;
  // Assuming 'icon' is now a ReactNode or similar, adjust usage
  let iconElement: React.ReactNode = null;
  if (typeof icon === 'string') {
    // If icon is a string (like a class name for FontAwesome), handle accordingly
    iconElement = icon;
  } else {
    // If icon is a ReactElement or component
    iconElement = icon;
  }

  return (
    <Button type="button" className={className} {...otherProps} unstyled>
      {iconElement}
    </Button>
  );
}
