import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

const NO_SUGGESTIONS: readonly string[] = Object.freeze([]);

// Per schema object, so a template that reads the suggestions on every render hands `SchemaExamples` the same array
const suggestionsBySchema = new WeakMap<StrictRJSFSchema, readonly string[]>();

/** Returns the suggestions a text input offers for `schema`: its `examples` and `default`, as the strings a user could
 * pick from a `<datalist>`. Examples and a default that share a `String()` are one suggestion, e.g. `["5432", 5432]`
 * with a default of `5432` is the single suggestion `'5432'`. A schema without `examples` has no suggestions, and
 * neither has one whose examples and default are all `null`, `undefined`, objects or arrays.
 *
 * The same schema object gets the same array back each time, which is frozen since every caller shares it. The
 * suggestions are read once per schema object, so `examples` or a `default` edited in place afterwards is not seen:
 * pass a new schema object to change them.
 *
 * @param schema - The schema whose `examples` and `default` are suggested
 * @returns - The distinct suggestions, in the order of `examples` followed by the `default`
 */
export default function getExampleSuggestions<S extends StrictRJSFSchema = RJSFSchema>(schema: S): readonly string[] {
  // Ahead of the cache, so that most schemas, which have no examples, take no entry in it, and neither does a boolean
  // schema a cast got here, which is no key a `WeakMap` takes
  if (!Array.isArray(schema.examples)) {
    return NO_SUGGESTIONS;
  }
  let suggestions = suggestionsBySchema.get(schema);
  if (!suggestions) {
    // `String()` spells `null` and `undefined` as a `'null'` or `'undefined'` a user could pick, and an object or array
    // as nothing a user could type
    suggestions = Object.freeze([
      ...new Set(
        [...schema.examples, schema.default]
          .filter((example) => example !== undefined && typeof example !== 'object')
          .map(String),
      ),
    ]);
    suggestionsBySchema.set(schema, suggestions);
  }
  return suggestions;
}
