import { Button } from '@carbon/react';
import { FormContextType, getSubmitButtonOptions, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';

/** Implement `ButtonTemplates.SubmitButton`
 */
export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }

  return (
    <Button type='submit' {...submitButtonProps}>
      {submitText}
    </Button>
  );
}
