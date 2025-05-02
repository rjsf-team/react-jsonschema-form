import { ReactElement } from 'react'; // Keep ReactElement
import { Button } from '@trussworks/react-uswds'; // Remove ButtonProps import attempt
import { IconButtonProps as RjsfIconButtonProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils'; // Keep RjsfIconButtonProps alias if needed elsewhere, or rename here

export type IconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = RjsfIconButtonProps<T, S, F>; // Use the imported type directly or via alias

export default function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const { iconType = 'default', icon, className, uiSchema, registry, ...otherProps } = props;
  return (
    <Button type="button" className={`usa-button--outline ${className}`} {...otherProps}>
      {icon}
    </Button>
  );
}
