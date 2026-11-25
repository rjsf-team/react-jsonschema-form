import { PROPERTIES_KEY, REF_KEY } from './constants.ts';
import getFieldSchemaPath from './getFieldSchemaPath.ts';
import getKeywordParentSchema from './getKeywordParentSchema.ts';
import getUiOptions from './getUiOptions.ts';
import { getByPath } from './pathUtils.ts';
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
  /** The error's property path, dot-separated as RJSF writes it, `''` for the root */
  property: string;
  /** The URI fragment of the JSON Pointer to the schema keyword that failed, such as `#/properties/a/required` */
  schemaPath: string;
  /** Decodes a key of the `schemaPath`, for an engine that escapes them; they are read as written without it */
  decodeSchemaPathKey?: (key: string) => string;
  /** The engine leaves every `$ref` out of the `schemaPath`, as `getKeywordParentSchema()`'s `skipsRefs` reads it */
  skipsRefs?: boolean;
  /** The form's uiSchema */
  uiSchema?: UiSchema<T, S, F>;
  /** The schema object that holds the keyword that failed, when the engine hands it over */
  parentSchema?: unknown;
  /** The form's root schema */
  schema?: S;
}

/** Used by the validator packages to name the properties an error's message names by their `ui:title` or `title`.
 * A name's title is its `ui:title` at the error's `property`, then at the `schemaPath`, then at it with the branches the
 * keyword sits in removed (see `getFieldSchemaPath()`), then the `title` the uiSchema holds at the `property`, then the
 * `title` of its schema in the `parentSchema`, then in the schema of the field holding the branch the keyword sits in,
 * then in the root `schema`. A schema that is a `$ref` is read resolved, its own `title` kept over its target's. Each
 * name with a title is replaced, in one pass so a title that matches another name isn't replaced again, by its title in
 * single quotes. The title is written as it is, `$` patterns included.
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
  skipsRefs = false,
  uiSchema,
  parentSchema,
  schema,
}: ValidatorErrorTitleSource<T, S, F>): { message: string; titles: Map<string, string> } {
  const propParts = property.replace(/^\./, '').split('.').filter(Boolean);
  // `#/properties/A/properties/B/required` points into the uiSchema at `['A', 'B']`
  const uiSchemaPathParts = (path: string) =>
    path
      .replace(/\/properties\//g, '/')
      .split('/')
      .slice(1, -1)
      .map(decodeSchemaPathKey);
  const schemaPathParts = uiSchemaPathParts(schemaPath);
  // Ajv starts the path of a keyword in a `$ref` target it compiles on its own at that target, so a path the root
  // doesn't lead along to the keyword names no field of the root. One `skipsRefs` reads as `null` does lead along it,
  // to a branch of a field it names either way
  const fieldSchemaPath =
    !schema || getKeywordParentSchema<S>(schema, schemaPath, decodeSchemaPathKey, skipsRefs) !== undefined
      ? getFieldSchemaPath(schemaPath)
      : schemaPath;
  const fieldSchemaPathParts = uiSchemaPathParts(fieldSchemaPath);
  const fieldSchema =
    schema && fieldSchemaPath !== schemaPath
      ? getKeywordParentSchema<S>(schema, fieldSchemaPath, decodeSchemaPathKey, skipsRefs)
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
    const rawUiTitle = getByPath(uiSchema, [...propParts, name, 'title']);
    const title =
      (getUiOptions<T, S, F>(getByPath(uiSchema, [...propParts, name])).title ??
        getUiOptions<T, S, F>(getByPath(uiSchema, [...schemaPathParts, name])).title ??
        getUiOptions<T, S, F>(getByPath(uiSchema, [...fieldSchemaPathParts, name])).title ??
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
