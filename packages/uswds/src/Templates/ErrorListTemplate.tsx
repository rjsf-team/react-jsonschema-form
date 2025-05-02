import { Alert } from '@trussworks/react-uswds';
import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorListTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ errors, registry }: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <div className="panel panel-danger errors">
      <Alert type="error" heading={translateString(TranslatableString.ErrorsLabel)} headingLevel="h4" slim>
        <ul className="error-detail">
          {errors.map((error, index) => {
            return (
              <li key={index} className="text-danger">
                {error.stack}
              </li>
            );
          })}
        </ul>
      </Alert>
    </div>
  );
}
