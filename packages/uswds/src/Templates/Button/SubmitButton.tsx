import { Button } from '@trussworks/react-uswds';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  SubmitButtonProps,
  getSubmitButtonOptions,
} from '@rjsf/utils';

export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  // Get button options from the uiSchema
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions(uiSchema);

  if (norender) {
    return null;
  }

  return (
    <Button
      type="submit"
      {...submitButtonProps}
      className={`usa-button ${submitButtonProps.className || ''}`}
    >
      {/* Use submitText directly without translation - this aligns with other themes */}
      {submitText || 'Submit'}
    </Button>
  );
}
