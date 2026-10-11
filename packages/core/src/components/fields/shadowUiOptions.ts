import type { FormContextType, RJSFSchema, StrictRJSFSchema, UIOptionsType, UiSchema } from '@rjsf/utils';
import { UI_OPTIONS_KEY } from '@rjsf/utils';

/** Returns a copy of `uiSchema` with each of the `names` options removed wherever a caller can write it: the
 * `ui:<name>` key deleted and `ui:options.<name>` set to `undefined`. Set rather than deleted, since `getUiOptions()`
 * layers the local options over `ui:globalOptions`, so only a local `undefined` keeps a global one from showing
 * through.
 *
 * @param uiSchema - The uiSchema to remove the options from
 * @param names - The names of the options to remove, without the `ui:` prefix
 * @returns - A copy of `uiSchema` with those options shadowed
 */
export default function shadowUiOptions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F> | undefined, names: readonly string[]): UiSchema<T, S, F> {
  const noUiSchema: UiSchema<T, S, F> = {};
  const shadowed = { ...(uiSchema ?? noUiSchema) };
  const options = { ...shadowed[UI_OPTIONS_KEY] } as UIOptionsType<T, S, F>;
  for (const name of names) {
    delete shadowed[`ui:${name}`];
    options[name] = undefined;
  }
  shadowed[UI_OPTIONS_KEY] = options;
  return shadowed;
}
