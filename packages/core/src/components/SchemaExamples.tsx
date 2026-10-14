import { memo } from 'react';
import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { examplesId, getExampleSuggestions } from '@rjsf/utils';

export interface SchemaExamplesProps<S extends StrictRJSFSchema = RJSFSchema> {
  /** The id of the input element this datalist is for */
  id: string;
  /** The JSON schema object containing examples and default value */
  schema: S;
  /** The suggestions to render, when the caller already has them from `getExampleSuggestions(schema)` */
  suggestions?: readonly string[];
}

/** Renders a `<datalist>` element containing options from schema examples and default value, as
 * `getExampleSuggestions()` returns them, or nothing when there are none.
 *
 * @param props - The `SchemaExamplesProps` for this component
 */
function SchemaExamples<S extends StrictRJSFSchema = RJSFSchema>(props: SchemaExamplesProps<S>) {
  const { id, schema, suggestions = getExampleSuggestions<S>(schema) } = props;
  if (suggestions.length === 0) {
    return null;
  }
  return (
    <datalist key={`datalist_${id}`} id={examplesId(id)}>
      {suggestions.map((example) => (
        // oxlint-disable-next-line jsx-a11y/control-has-associated-label
        <option key={example} value={example} />
      ))}
    </datalist>
  );
}

/** Memoized so a keystroke in the input the suggestions are for is not a render of them: `getExampleSuggestions()`
 * returns the same array for the same schema. `memo()` drops the type parameter, so the overload is the one trust point
 * that the memoized component takes the props `SchemaExamples` does.
 */
function memoizeSchemaExamples(component: typeof SchemaExamples): typeof SchemaExamples;
function memoizeSchemaExamples(component: typeof SchemaExamples): unknown {
  return memo(component);
}
export default memoizeSchemaExamples(SchemaExamples);
