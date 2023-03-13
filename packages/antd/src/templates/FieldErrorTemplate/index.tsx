import { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema, errorId } from '@rjsf/utils';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], idSchema } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId<T>(idSchema);

  return (
    <div id={id}>
      {errors.map((error) => (
        <div key={`field-${id}-error-${error}`}>{error}</div>
      ))}
    </div>
  );
}
