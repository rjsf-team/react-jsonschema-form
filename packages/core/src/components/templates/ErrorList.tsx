import type { ErrorListProps, FormContextType, RJSFValidationError, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { clsx } from 'clsx';

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ errors, registry }: ErrorListProps<T, S, F>) {
  const { translateString, classMap } = registry;
  return (
    <div className={clsx('rjsf-errors', classMap.errorList)}>
      <div className={classMap.errorListHeading}>
        <h3 className={classMap.errorListTitle}>{translateString(TranslatableString.ErrorsLabel)}</h3>
      </div>
      <ul className={classMap.errorListItems}>
        {errors.map((error: RJSFValidationError, i: number) => (
          // oxlint-disable-next-line react/no-array-index-key
          <li key={i} className={classMap.errorListItem}>
            {error.stack}
          </li>
        ))}
      </ul>
    </div>
  );
}
