import type { ANY_OF_KEY, ONE_OF_KEY } from './constants.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the uiSchema for the `oneOf`/`anyOf` option at `index`, matching `AnyOfField`'s own
 * `optionsUiSchema`/`optionUiSchema` resolution: `uiSchema[keyword][index]` when that keyword's uiSchema is declared
 * as an array reaching `index`, falling back to `uiSchema` itself otherwise. Once a branch declares its own
 * array-form uiSchema for `keyword`, a plain per-key entry on the parent uiSchema (e.g. `uiSchema.thing.a`) is never
 * consulted for that branch's own fields — this mirrors that at every place a `oneOf`/`anyOf` option is resolved,
 * not just where it's rendered.
 *
 * @param [uiSchema] - The parent uiSchema, if any
 * @param keyword - Which of `oneOf`/`anyOf` `index` selects into
 * @param index - The index of the selected option within `schema[keyword]`
 * @returns - The uiSchema to use for the selected option's own fields
 */
export default function getOptionUiSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  uiSchema: UiSchema<T, S, F> | undefined,
  keyword: typeof ONE_OF_KEY | typeof ANY_OF_KEY,
  index: number,
): UiSchema<T, S, F> | undefined {
  const optionsUiSchema = uiSchema?.[keyword];
  return Array.isArray(optionsUiSchema) && optionsUiSchema.length > index ? optionsUiSchema[index] : uiSchema;
}
