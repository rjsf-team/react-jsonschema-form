import React from 'react';
import { Button } from '@trussworks/react-uswds';
import { 
  CopyButtonProps, 
  FormContextType, 
  RJSFSchema, 
  StrictRJSFSchema, 
  TranslatableString 
} from '@rjsf/utils';

export default function CopyButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ className, onClick, disabled, registry }: CopyButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button 
      className={className}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {translateString(TranslatableString.CopyButton)}
    </Button>
  );
}
