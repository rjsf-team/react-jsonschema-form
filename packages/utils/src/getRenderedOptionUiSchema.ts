import { UI_OPTIONS_KEY } from './constants.ts';
import getUiOptions from './getUiOptions.ts';
import { takesParentExtraKeys } from './rendersOwnFieldBesideOption.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the uiSchema an `anyOf`/`oneOf` option of `parent` is rendered with, given the one `getOptionUiSchema()`
 * picked for it. An option whose field takes the extra keys of the parent's field in its place (see
 * `getRenderedOptionSchema()`) takes the parent's say over them too: the parent's `expandable` option and its
 * `additionalProperties` entry, beneath the option's own. Every reader of the option's uiSchema, the field rendering it,
 * the defaults `getDefaultFormState()` computes and `getUiRequiredErrorSchema()`'s walk, asks this, so that a key the
 * field renders with the parent's entry is seeded and required by it as well.
 *
 * @param parent - The schema holding the `anyOf`/`oneOf`
 * @param option - The option, with its own `$ref` resolved
 * @param uiSchema - The parent's uiSchema
 * @param optionUiSchema - The uiSchema `getOptionUiSchema()` picked for the option
 * @returns - `optionUiSchema`, with the parent's say over the extra keys beneath it where the option takes them
 */
export default function getRenderedOptionUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  parent: S,
  option: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  optionUiSchema: UiSchema<T, S, F> | undefined,
): UiSchema<T, S, F> | undefined {
  if (!uiSchema || !optionUiSchema || optionUiSchema === uiSchema || !takesParentExtraKeys<S>(parent, option)) {
    return optionUiSchema;
  }
  const { expandable } = getUiOptions<T, S, F>(uiSchema);
  const expands = expandable !== undefined && getUiOptions<T, S, F>(optionUiSchema).expandable === undefined;
  const describesKeys =
    uiSchema.additionalProperties !== undefined && optionUiSchema.additionalProperties === undefined;
  if (!expands && !describesKeys) {
    return optionUiSchema;
  }
  const rendered: UiSchema<T, S, F> = { ...optionUiSchema };
  if (expands) {
    rendered[UI_OPTIONS_KEY] = { ...optionUiSchema[UI_OPTIONS_KEY], expandable };
  }
  if (describesKeys) {
    rendered.additionalProperties = uiSchema.additionalProperties;
  }
  return rendered;
}
