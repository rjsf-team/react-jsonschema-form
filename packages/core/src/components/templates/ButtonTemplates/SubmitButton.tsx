import type { FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';

/** The `SubmitButton` renders a button that represent the `Submit` action on a form, disabled while the form is pending
 */
export default function SubmitButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema, pending }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions<T, S, F>(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <div>
      <button
        type='submit'
        {...submitButtonProps}
        disabled={pending || submitButtonProps.disabled}
        className={`btn btn-info ${submitButtonProps.className || ''}`}
      >
        {submitText}
      </button>
    </div>
  );
}
