import type { FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions, joinClassNames } from '@rjsf/utils';

/** The `SubmitButton` renders a button that represent the `Submit` action on a form
 */
export default function SubmitButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema, registry }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions<T, S, F>(uiSchema);
  const { classMap } = registry;
  if (norender) {
    return null;
  }
  return (
    <div>
      <button
        type='submit'
        {...submitButtonProps}
        className={joinClassNames(classMap.submitButton, submitButtonProps.className)}
      >
        {submitText}
      </button>
    </div>
  );
}
