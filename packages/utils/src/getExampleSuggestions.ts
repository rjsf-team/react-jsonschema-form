import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

// Per schema object, so a template that reads the suggestions on every render hands `SchemaExamples` the same array
const suggestionsBySchema = new WeakMap<StrictRJSFSchema, string[]>();

/** Returns the suggestions a text input offers for `schema`: its `examples` and `default`, as the strings a user could
 * pick from a `<datalist>`. Examples and a default that share a `String()` are one suggestion, e.g. `["5432", 5432]`
 * with a default of `5432` is the single suggestion `'5432'`. A schema without `examples` has no suggestions, and
 * neither has one whose examples and default are all `null`, `undefined`, objects or arrays. The same schema object
 * gets the same array back each time, which is to be treated as read-only.
 *
 * @param schema - The schema whose `examples` and `default` are suggested
 * @returns - The distinct suggestions, in the order of `examples` followed by the `default`
 */
export default function getExampleSuggestions<S extends StrictRJSFSchema = RJSFSchema>(schema: S): string[] {
  let suggestions = suggestionsBySchema.get(schema);
  if (!suggestions) {
    suggestions = readExampleSuggestions(schema);
    suggestionsBySchema.set(schema, suggestions);
  }
  return suggestions;
}

function readExampleSuggestions(schema: StrictRJSFSchema): string[] {
  const { examples, default: schemaDefault } = schema;
  if (!Array.isArray(examples)) {
    return [];
  }
  // `String()` spells `null` and `undefined` as a `'null'` or `'undefined'` a user could pick, and an object or array as
  // nothing a user could type
  return [
    ...new Set(
      [...examples, schemaDefault]
        .filter((example) => example !== undefined && typeof example !== 'object')
        .map(String),
    ),
  ];
}
