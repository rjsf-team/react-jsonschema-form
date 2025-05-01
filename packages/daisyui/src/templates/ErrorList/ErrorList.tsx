import { ErrorListProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

/** The `ErrorList` component renders a list of form-level validation errors
 * with DaisyUI styling. It displays errors as a bulleted list in red text.
 *
 * @param props - The `ErrorListProps` for the component
 */
export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ErrorListProps<T, S, F>,
) {
  const { errors } = props;
  return (
    <div className='error-list'>
      <ul className='list-disc list-inside text-red-600'>
        {errors.map((error, index) => (
          <li key={index}>{error.stack}</li>
        ))}
      </ul>
    </div>
  );
}
