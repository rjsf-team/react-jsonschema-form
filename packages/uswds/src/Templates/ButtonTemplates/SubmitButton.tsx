import React from 'react';
import { Button } from '@trussworks/react-uswds';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  SubmitButtonProps,
  TranslatableString,
  getSubmitButtonOptions,
} from '@rjsf/utils';

/** The `SubmitButton` renders a button that submits the form when clicked
 */
export default function SubmitButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  { uiSchema, registry }: SubmitButtonProps<T, S, F>
) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions<T, S, F>(uiSchema);
  const { translateString } = registry;
  if (norender) {
    return null;
  }
  return (
    <Button type="submit" {...submitButtonProps} className={`usa-button ${submitButtonProps.className || ''}`}>
      {submitText || translateString(TranslatableString.SubmitButtonLabel)}
    </Button>
  );
}
