import getFieldTitle from './getFieldTitle.ts';
import { propertyToPath } from './pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema, UiSchema } from './types.ts';

/** What the validator packages name an error's fields from: the form the data was validated in */
export interface ValidatorErrorFieldSource<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The `SchemaContext` of the form */
  context: SchemaContext<S, F>;
  /** The form's root schema */
  schema: S;
  /** The form data that was validated */
  formData?: T;
  /** The form's uiSchema */
  uiSchema?: UiSchema<T, S, F>;
}

/** What `applyValidatorErrorTitles()` reads of an error a validator package reports */
export interface ValidatorErrorTitleSource<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends ValidatorErrorFieldSource<T, S, F> {
  /** The engine's message, which names each of the `names` between a pair of `quote`s */
  message: string;
  /** The names of the properties the message names */
  names: string[];
  /** The quote the engine puts around a property name */
  quote: "'" | '"';
  /** The error's property path, as `pathToProperty()` writes it, `''` for the root */
  property: string;
}

/** Used by the validator packages to name the properties an error's message names by the title the form labels their
 * fields with (see `getFieldTitle()`), each read at the error's `property` followed by the name. Each name with a title
 * is replaced, in one pass so a title that matches another name isn't replaced again, by its title in single quotes.
 * The title is written as it is, `$` patterns included.
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
  context,
  schema,
  formData,
  uiSchema,
}: ValidatorErrorTitleSource<T, S, F>): { message: string; titles: Map<string, string> } {
  const titles = new Map<string, string>();
  for (const name of names) {
    const title = getFieldTitle<T, S, F>(context, schema, [...propertyToPath(property), name], formData, uiSchema);
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
