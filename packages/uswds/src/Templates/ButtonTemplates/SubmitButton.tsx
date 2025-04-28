import React from 'react';
import { Button } from '@trussworks/react-uswds';
import { 
  SubmitButtonProps, 
  FormContextType, 
  RJSFSchema, 
  StrictRJSFSchema, 
  getSubmitButtonOptions 
} from '@rjsf/utils';

export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ submitText, props = {}, uiSchema }: SubmitButtonProps<T, S, F>) {
  const { norender, submitButtonProps = {}, submitButtonOptions } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  
  // Fix the className concatenation by ensuring both are defined
  const buttonClassName = [
    'usa-button',
    submitButtonProps.className || '',
    props.className || ''
  ].filter(Boolean).join(' ');

  return (
    <Button
      type="submit"
      {...submitButtonProps}
      {...props}
      className={buttonClassName}
    >
      {submitText || submitButtonOptions?.submitText || 'Submit'}
    </Button>
  );
}
