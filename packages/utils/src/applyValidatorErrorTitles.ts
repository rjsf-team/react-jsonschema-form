import { PROPERTIES_KEY } from './constants.ts';
import getUiOptions from './getUiOptions.ts';
import { getByPath } from './pathUtils.ts';
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
  /** The form's uiSchema */
  uiSchema?: UiSchema<T, S, F>;
  /** The schema object that holds the keyword that failed, when the engine hands it over */
  parentSchema?: unknown;
  /** The form's root schema */
  schema?: S;
}

/** Used by the validator packages to name the properties an error's message names by their `ui:title` or `title`.
 * A name's title is its `ui:title` at the error's `property`, then at the `schemaPath`, then the `title` the uiSchema
 * holds at the `property`, then the `title` of its schema in the `parentSchema`, then in the root `schema`. Each name
 * with a title is replaced, in one pass so a title that matches another name isn't replaced again, by its title in
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
  uiSchema,
  parentSchema,
  schema,
}: ValidatorErrorTitleSource<T, S, F>): { message: string; titles: Map<string, string> } {
  const propParts = property.replace(/^\./, '').split('.').filter(Boolean);
  // `#/properties/A/properties/B/required` points into the uiSchema at `['A', 'B']`
  const schemaPathParts = schemaPath
    .replace(/\/properties\//g, '/')
    .split('/')
    .slice(1, -1)
    .map(decodeSchemaPathKey);
  const titles = new Map<string, string>();
  for (const name of names) {
    // A sub-field named `title` sits at the same path as a raw `title`
    const rawUiTitle = getByPath(uiSchema, [...propParts, name, 'title']);
    const title =
      (getUiOptions<T, S, F>(getByPath(uiSchema, [...propParts, name])).title ??
        getUiOptions<T, S, F>(getByPath(uiSchema, [...schemaPathParts, name])).title ??
        (typeof rawUiTitle === 'string' ? rawUiTitle : undefined)) ||
      getByPath<string | undefined>(parentSchema, [PROPERTIES_KEY, name, 'title']) ||
      getByPath<string | undefined>(schema, [
        ...propParts.flatMap((part) => [PROPERTIES_KEY, part]),
        PROPERTIES_KEY,
        name,
        'title',
      ]);
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
