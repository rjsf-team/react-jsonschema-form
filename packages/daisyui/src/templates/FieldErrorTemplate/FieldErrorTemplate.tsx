import { FieldErrorProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

/** The `FieldErrorTemplate` component renders validation errors for a specific field
 * with DaisyUI styling. It displays field-level errors as a bulleted list in red text.
 *
 * Unlike ErrorList which shows form-level errors, this component displays errors
 * specific to a particular field in the form.
 *
 * @param props - The `FieldErrorProps` for the component
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldErrorProps<T, S, F>) {
  const { errors } = props;
  return (
    <div className='rjsf-field-error-template text-red-600'>
      <ul className='list-disc list-inside'>{errors?.map((error, index) => <li key={index}>{error}</li>) ?? []}</ul>
    </div>
  );
}
