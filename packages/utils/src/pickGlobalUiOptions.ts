import { GLOBAL_UI_OPTIONS_KEYS, RESERVED_UI_OPTION_NAMES } from './globalUiOptionsKeys.ts';
import isObject from './isObject.ts';
import logOnce from './logOnce.ts';
import type { GenericObjectType, GlobalUISchemaOptions } from './types.ts';

const GLOBAL_NAMES: ReadonlySet<string> = new Set(GLOBAL_UI_OPTIONS_KEYS);
const RESERVED_NAMES: ReadonlySet<string> = new Set(RESERVED_UI_OPTION_NAMES);

/** Picks the options a form reads from its root uiSchema's `ui:globalOptions`: the ones RJSF reads, which
 * `GLOBAL_UI_OPTIONS_KEYS` lists, and the extension keys the form's theme and the `Form` itself declare. Every other key
 * is left out, so a global option RJSF reads only per field, such as `widget` or `placeholder`, reaches no field. An
 * extension key that is one of those per-field names, which `RESERVED_UI_OPTION_NAMES` lists, is left out too, with a
 * warning: every field would otherwise read it as its own option.
 *
 * @param [globalOptions] - The root uiSchema's `ui:globalOptions`
 * @param [extensionKeys=[]] - The extension keys the form's theme and the `Form` declare
 * @returns - The options picked, or undefined when `globalOptions` is not an object
 */
export default function pickGlobalUiOptions(
  globalOptions: GlobalUISchemaOptions | undefined,
  extensionKeys: readonly string[] = [],
): GlobalUISchemaOptions | undefined {
  if (!isObject(globalOptions)) {
    return undefined;
  }
  // Read as a plain record, since an extension's keys aren't declared on the type
  const globals: GenericObjectType = globalOptions;
  const picked: GenericObjectType = {};
  for (const key of GLOBAL_UI_OPTIONS_KEYS) {
    if (Object.hasOwn(globals, key)) {
      picked[key] = globals[key];
    }
  }
  // One of RJSF's own is picked above already
  for (const key of extensionKeys.filter((extensionKey) => !GLOBAL_NAMES.has(extensionKey))) {
    if (RESERVED_NAMES.has(key)) {
      logOnce(
        `globalUiOptionsKeys names ${key}, an option RJSF reads per field, so it is not read from ui:globalOptions.`,
      );
    } else if (Object.hasOwn(globals, key)) {
      picked[key] = globals[key];
    }
  }
  return picked;
}
