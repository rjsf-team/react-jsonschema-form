import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `NullField` component is used to render a field in the schema that is null. It renders nothing: the form's
 * data derivation fills a missing `null` value in, see `computeDefaults()` in `@rjsf/utils`.
 *
 * @param _props - The `FieldProps` for this template
 */
function NullField<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  _props: FieldProps<T, S, F>,
) {
  return null;
}

export default NullField;
