import { Alert } from '@trussworks/react-uswds'; // Import Alert
import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils'; // Import TranslatableString

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorListTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ errors, registry }: ErrorListProps<T, S, F>) {
  // Destructure registry
  const { translateString } = registry; // Get translateString from registry

  if (errors.length === 0) {
    return null;
  }

  // Use the implementation from ErrorList.tsx
  return (
    <div className="panel panel-danger errors">
      {' '}
      {/* Keep or remove outer div as needed */}
      <Alert
        type="error"
        heading={translateString(TranslatableString.ErrorsLabel)}
        headingLevel="h4"
        slim
      >
        <ul className="error-detail">
          {' '}
          {/* Use USWDS recommended class or keep error-detail */}
          {errors.map((error, index) => {
            return (
              // Use USWDS recommended class or keep text-danger
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
