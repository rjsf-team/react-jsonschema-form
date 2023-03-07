import { FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString, UnsupportedFieldProps } from '@rjsf/utils';
import Markdown from 'markdown-to-jsx';

/** The `UnsupportedField` component is used to render a field in the schema is one that is not supported by
 * react-jsonschema-form.
 *
 * @param props - The `FieldProps` for this template
 */
function UnsupportedField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: UnsupportedFieldProps<T, S, F>
) {
  const { schema, idSchema, reason, registry } = props;
  const { translateString } = registry;
  let translateEnum: TranslatableString = TranslatableString.UnsupportedField;
  const translateParams: string[] = [];
  if (idSchema && idSchema.$id) {
    translateEnum = TranslatableString.UnsupportedFieldWithId;
    translateParams.push(idSchema.$id);
  }
  if (reason) {
    translateEnum =
      translateEnum === TranslatableString.UnsupportedField
        ? TranslatableString.UnsupportedFieldWithReason
        : TranslatableString.UnsupportedFieldWithIdAndReason;
    translateParams.push(reason);
  }
  return (
    <div className='unsupported-field'>
      <p>
        <Markdown>{translateString(translateEnum, translateParams)}</Markdown>
      </p>
      {schema && <pre>{JSON.stringify(schema, null, 2)}</pre>}
    </div>
  );
}

export default UnsupportedField;
