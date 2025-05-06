import { Alert } from '@trussworks/react-uswds';
import {
  UnsupportedFieldProps, // Changed from FieldProps
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';

/** The `UnsupportedField` component is used to render a field in the schema is one that is not supported by
 * react-jsonschema-form.
 *
 * @param props - The `UnsupportedFieldProps` for this component
 */
export default function UnsupportedFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ schema, idSchema, reason, registry }: UnsupportedFieldProps<T, S, F>) {
  const { translateString } = registry;
  const translateEnum = TranslatableString.UnsupportedField;
  const message = translateString(translateEnum, [String(idSchema?.$id), reason]);

  return (
    <Alert type="error" heading={message} headingLevel="h4" slim>
      <pre>{JSON.stringify(schema, null, 2)}</pre>
    </Alert>
  );
}
