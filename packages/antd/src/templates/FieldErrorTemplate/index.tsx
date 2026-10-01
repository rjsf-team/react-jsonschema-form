import { isValidElement } from 'react';
import type { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], id: fieldId } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId(fieldId);

  return (
    <div id={id}>
      {errors.map((error, index) => (
        <div key={`field-${id}-error-${isValidElement(error) && error.key !== null ? `k-${error.key}` : `i-${index}`}`}>
          {error}
        </div>
      ))}
    </div>
  );
}
