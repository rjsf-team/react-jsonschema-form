import type { ANY_OF_KEY, ONE_OF_KEY } from './constants.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the uiSchema for the option at `index` given the already-resolved `optionsUiSchema` array (`uiSchema`'s
 * `oneOf`/`anyOf` entry when it's declared as an array, or `undefined` otherwise): `optionsUiSchema[index]` when that
 * array reaches `index`, falling back to `uiSchema` itself otherwise. Split out from `getOptionUiSchema()` so a
 * caller that already has (and memoizes) its own `optionsUiSchema` array — `AnyOfField`/`MultiSchemaField` warn once
 * if `uiSchema.oneOf`/`anyOf` isn't an array, then reuse the derived array across a render — doesn't need to
 * re-derive it from `uiSchema` on every lookup.
 *
 * @param optionsUiSchema - The already-resolved array of per-option uiSchemas, if any
 * @param [uiSchema] - The parent uiSchema, if any, used as the fallback
 * @param index - The index of the selected option within `optionsUiSchema`; a negative index (no option selected,
 *  e.g. `MultiSchemaField`'s cleared-selection state) always falls back to `uiSchema`
 * @returns - The uiSchema to use for the selected option's own fields
 */
export function selectOptionUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  optionsUiSchema: UiSchema<T, S, F>[] | undefined,
  uiSchema: UiSchema<T, S, F> | undefined,
  index: number,
): UiSchema<T, S, F> | undefined {
  return index >= 0 && Array.isArray(optionsUiSchema) && optionsUiSchema.length > index
    ? optionsUiSchema[index]
    : uiSchema;
}

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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  uiSchema: UiSchema<T, S, F> | undefined,
  keyword: typeof ONE_OF_KEY | typeof ANY_OF_KEY,
  index: number,
): UiSchema<T, S, F> | undefined {
  const optionsUiSchema = uiSchema?.[keyword];
  return selectOptionUiSchema<T, S, F>(optionsUiSchema, uiSchema, index);
}
