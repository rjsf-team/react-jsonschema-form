import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';
import { Alert } from '@trussworks/react-uswds';

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
    <Alert type="error" heading={translateString(TranslatableString.Errors)} headingLevel="h4" slim>
      {errors.map((error, i: number) => {
        return <li key={i}>{error.stack}</li>;
      })}
    </Alert>
  );
}
