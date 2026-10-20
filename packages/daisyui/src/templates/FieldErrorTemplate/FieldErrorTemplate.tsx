import type { FieldErrorProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';

/** The `FieldErrorTemplate` component renders validation errors for a specific field
 * with DaisyUI styling. It displays field-level errors as a bulleted list in red text.
 *
 * Unlike ErrorList which shows form-level errors, this component displays errors
 * specific to a particular field in the form.
 *
 * @param props - The `FieldErrorProps` for the component
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldErrorProps<T, S, F>) {
  const { errors, id } = props;
  // Counted before the empty messages are left out, as the plan counts them when it points a control at this id, so
  // the element is there whenever a control is described by it
  if (!errors?.length) {
    return null;
  }
  const messages = errors.filter(Boolean);
  return (
    // The id every widget's `aria-describedby` points at, as in `@rjsf/core`, so the errors are announced
    <div id={errorId(id)} className='rjsf-field-error-template text-red-600'>
      <ul className='list-disc list-inside'>
        {messages.map((error, index) => (
          // oxlint-disable-next-line react/no-array-index-key
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
