import type { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';
import { clsx } from 'clsx';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], id: fieldId, registry } = props;
  const { classMap } = registry;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId(fieldId);

  return (
    <div>
      <ul id={id} className={clsx('rjsf-error-detail', classMap.fieldErrors)}>
        {errors
          .filter((elem) => !!elem)
          .map((error, index: number) => (
            // oxlint-disable-next-line react/no-array-index-key
            <li className={clsx('rjsf-error', classMap.fieldError)} key={index}>
              {error}
            </li>
          ))}
      </ul>
    </div>
  );
}
