import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { examplesId } from '@rjsf/utils';

export interface SchemaExamplesProps<S extends StrictRJSFSchema = RJSFSchema> {
  /** The id of the input element this datalist is for */
  id: string;
  /** The JSON schema object containing examples and default value */
  schema: S;
}

/** Renders a `<datalist>` element containing options from schema examples and default value.
 * A datalist suggests strings, so examples and a default that share a `String()` are one option. For example, if
 * examples are `["5432", 5432]` and default is `5432`, a single `5432` option is rendered.
 *
 * @param props - The `SchemaExamplesProps` for this component
 */
export default function SchemaExamples<S extends StrictRJSFSchema = RJSFSchema>(props: SchemaExamplesProps<S>) {
  const { id, schema } = props;
  const { examples, default: schemaDefault } = schema;
  if (!Array.isArray(examples)) {
    return null;
  }
  // `String()` spells `null` as a `'null'` a user could pick, and an object or array as nothing a user could type
  const suggestions = new Set(
    (schemaDefault === undefined ? examples : [...examples, schemaDefault])
      .filter((example) => typeof example !== 'object')
      .map(String),
  );
  return (
    <datalist key={`datalist_${id}`} id={examplesId(id)}>
      {[...suggestions].map((example) => (
        // oxlint-disable-next-line jsx-a11y/control-has-associated-label
        <option key={example} value={example} />
      ))}
    </datalist>
  );
}
