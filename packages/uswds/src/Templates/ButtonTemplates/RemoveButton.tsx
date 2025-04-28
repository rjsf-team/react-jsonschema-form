import React from 'react';
import { Button } from '@trussworks/react-uswds';
import { 
  IconButtonProps, 
  FormContextType, 
  RJSFSchema, 
  StrictRJSFSchema, 
  TranslatableString 
} from '@rjsf/utils';

export default function RemoveButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ className, onClick, disabled, registry, children }: IconButtonProps<T, S, F>) {
  // Add null check for registry
  const translateString = registry?.translateString || ((str) => str);
  return (
    <Button 
      className={className}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children || translateString(TranslatableString.RemoveButton)}
    </Button>
  );
}
