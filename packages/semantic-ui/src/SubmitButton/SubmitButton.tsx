import { Button } from 'semantic-ui-react';
import { getSubmitButtonOptions, FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';

/** The `SubmitButton` renders a button that represent the `Submit` action on a form
 */
export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions<T, S, F>(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <Button type='submit' primary {...submitButtonProps}>
      {submitText}
    </Button>
  );
}
