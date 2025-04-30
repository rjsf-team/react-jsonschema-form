import { Button } from '@trussworks/react-uswds';
import {
  SubmitButtonProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  getSubmitButtonOptions,
} from '@rjsf/utils';

/** The `SubmitButton` renders a button that submits the form.
 *
 * @param props - The `SubmitButtonProps` for the component
 */
export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ uiSchema, registry }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions<T, S, F>(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <Button
      type="submit"
      {...submitButtonProps}
      className={`usa-button ${submitButtonProps.className || ''} margin-top-4`.trim()}
      data-testid="submit-button"
    >
      {submitText || translateString(TranslatableString.SubmitButton)}
    </Button>
  );
}
