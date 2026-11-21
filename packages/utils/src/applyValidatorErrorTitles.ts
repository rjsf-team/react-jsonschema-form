import { PROPERTIES_KEY, REF_KEY } from './constants.ts';
import getKeywordParentSchema from './getKeywordParentSchema.ts';
import getValidatorErrorUiTitle, { getErrorFieldSchemaPath, uiSchemaAtDataPath } from './getValidatorErrorUiTitle.ts';
import { getByPath, propertyToPath } from './pathUtils.ts';
import { stringKeyword } from './schema/graph/parseSchemaGraph.ts';
import { resolveOwnRef } from './schema/retrieveSchema.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** What `applyValidatorErrorTitles()` reads of an error a validator package reports */
export interface ValidatorErrorTitleSource<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The engine's message, which names each of the `names` between a pair of `quote`s */
  message: string;
  /** The names of the properties the message names */
  names: string[];
  /** The quote the engine puts around a property name */
  quote: "'" | '"';
  /** The error's property path, as `pathToProperty()` writes it, `''` for the root */
  property: string;
  /** The URI fragment of the JSON Pointer to the schema keyword that failed, such as `#/properties/a/required` */
  schemaPath: string;
  /** Decodes a key of the `schemaPath`, for an engine that escapes them; they are read as written without it */
  decodeSchemaPathKey?: (key: string) => string;
  /** The form's uiSchema */
  uiSchema?: UiSchema<T, S, F>;
  /** The schema object that holds the keyword that failed, when the engine hands it over */
  parentSchema?: unknown;
  /** The form's root schema */
  schema?: S;
}

/** Used by the validator packages to name the properties an error's message names by their `ui:title` or `title`.
 * A name's title is its `ui:title` (see `getValidatorErrorUiTitle()`), then the `title` the uiSchema holds at the
 * `property`, then the `title` of its schema in the `parentSchema`, then in the schema of the field holding the branch
 * the keyword sits in, then in the root `schema`. A schema that is a `$ref` is read resolved, its own `title` kept over
 * its target's. Each name with a title is replaced, in one pass so a title that matches another name isn't replaced
 * again, by its title in single quotes. The title is written as it is, `$` patterns included.
 *
 * @param source - The error's message and what its names' titles are looked up in
 * @returns - The `message` with each name that has a title replaced by it, and the title of each such name
 */
export default function applyValidatorErrorTitles<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  message,
  names,
  quote,
  property,
  schemaPath,
  decodeSchemaPathKey = (key) => key,
  uiSchema,
  parentSchema,
  schema,
}: ValidatorErrorTitleSource<T, S, F>): { message: string; titles: Map<string, string> } {
  const propParts = propertyToPath(property);
  const fieldSchemaPath = getErrorFieldSchemaPath<S>(schemaPath, decodeSchemaPathKey, schema);
  const fieldSchema =
    schema && fieldSchemaPath !== schemaPath
      ? getKeywordParentSchema<S>(schema, fieldSchemaPath, decodeSchemaPathKey)
      : undefined;
  const titleOf = (propertySchema: unknown) => {
    let resolved = propertySchema;
    if (schema && stringKeyword(propertySchema, REF_KEY) !== undefined) {
      try {
        resolved = resolveOwnRef<S>(propertySchema as S, schema);
      } catch {
        // A `$ref` to an `$anchor` or to nothing leaves the `$ref` schema's own `title`
      }
    }
    return getByPath<string | undefined>(resolved, 'title');
  };
  const titles = new Map<string, string>();
  for (const name of names) {
    // A sub-field named `title` sits at the same path as a raw `title`
    const rawUiTitle = getByPath(uiSchemaAtDataPath<T, S, F>(uiSchema, [...propParts, name], schema), 'title');
    const title =
      (getValidatorErrorUiTitle<T, S, F>({ property, name, schemaPath, decodeSchemaPathKey, uiSchema, schema }) ??
        (typeof rawUiTitle === 'string' ? rawUiTitle : undefined)) ||
      titleOf(getByPath(parentSchema, [PROPERTIES_KEY, name])) ||
      titleOf(getByPath(fieldSchema, [PROPERTIES_KEY, name])) ||
      titleOf(getByPath(schema, [...propParts.flatMap((part) => [PROPERTIES_KEY, part]), PROPERTIES_KEY, name]));
    if (title) {
      titles.set(name, title);
    }
  }
  if (titles.size === 0) {
    return { message, titles };
  }
  // Every name, untitled ones too, longest first, so a titled `'it'` doesn't match the start of an untitled `'it's'`
  const quotedNames = [...names]
    .sort((a, b) => b.length - a.length)
    .map((name) => `${quote}${name}${quote}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const titled = message.replace(new RegExp(quotedNames.join('|'), 'g'), (quoted) => {
    const title = titles.get(quoted.slice(quote.length, -quote.length));
    return title ? `'${title}'` : quoted;
  });
  return { message: titled, titles };
}
