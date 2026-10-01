import type { ANY_OF_KEY, FormContextType, ONE_OF_KEY, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { getUiOptions, isObject } from '@rjsf/utils';

/** Whether any option of an `anyOf`/`oneOf` list is labelled by something other than its value: its own `title`, or the
 * `ui:title` of the matching `uiSchema.anyOf`/`uiSchema.oneOf` entry. `ui:enumNames` names only `enum` values, so it
 * doesn't label these options.
 *
 * Internal to `@rjsf/core`: `package.json` excludes `./lib/hasOptionLabels.js` from the `./lib/*.js` exports wildcard so
 * it can't be deep-imported, since a reachable subpath would have to keep working until the next major.
 *
 * @param options - The options of the keyword, which needn't be constants
 * @param keyword - The keyword the `options` came from
 * @param [uiSchema] - The `uiSchema` for the field
 * @returns - True when at least one option is labelled
 */
export default function hasOptionLabels<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(options: readonly unknown[], keyword: typeof ANY_OF_KEY | typeof ONE_OF_KEY, uiSchema?: UiSchema<T, S, F>): boolean {
  const optionUiSchemas = uiSchema?.[keyword];
  return options.some(
    (option, index) =>
      (isObject(option) && Boolean(option.title)) ||
      (Array.isArray(optionUiSchemas) && Boolean(getUiOptions<T, S, F>(optionUiSchemas[index]).title)),
  );
}
