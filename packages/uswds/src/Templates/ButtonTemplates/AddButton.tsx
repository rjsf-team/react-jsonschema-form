import React from 'react';
import { Button } from '@trussworks/react-uswds';
import { AddButtonProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ className, onClick, disabled, registry }: AddButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button 
      className={className}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {translateString(TranslatableString.AddItemButton)}
    </Button>
  );
}
