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
  return (
    <div className='rjsf-field-error-template text-red-600'>
      {/* The id every widget's `aria-describedby` points at, as in `@rjsf/core`, so the errors are announced. Left off
          an empty list, which would otherwise add a stray space to every description */}
      <ul id={errors?.length ? errorId(id) : undefined} className='list-disc list-inside'>
        {/* oxlint-disable-next-line react/no-array-index-key */}
        {errors?.map((error, index) => <li key={index}>{error}</li>) ?? []}
      </ul>
    </div>
  );
}
