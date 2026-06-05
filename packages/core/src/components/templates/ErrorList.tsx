import type { ErrorListProps, FormContextType, RJSFValidationError, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <div className='panel panel-danger errors'>
      <div className='panel-heading'>
        <h3 className='panel-title'>{translateString(TranslatableString.ErrorsLabel)}</h3>
      </div>
      <ul className='list-group'>
        {errors.map((error: RJSFValidationError, i: number) => (
          // oxlint-disable-next-line react/no-array-index-key
          <li key={i} className='list-group-item text-danger'>
            {error.stack}
          </li>
        ))}
      </ul>
    </div>
  );
}
