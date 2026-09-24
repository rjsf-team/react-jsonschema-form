import { UI_OPTIONS_KEY, UI_WIDGET_KEY } from './constants.ts';
import isObject from './isObject.ts';
import logOnce from './logOnce.ts';
import type {
  FormContextType,
  GlobalUISchemaOptions,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  UiSchema,
} from './types.ts';

/** Narrows a uiSchema key to the `ui:` namespace, so indexing resolves against that index signature */
function isUiKey(key: string): key is `ui:${string}` {
  return key.startsWith('ui:');
}

/** Get all passed options from ui:options, and ui:<optionName>, returning them in an object with the `ui:`
 * stripped off. Any `globalOptions` will always be returned, unless they are overridden by options in the `uiSchema`.
 *
 * @param [uiSchema={}] - The UI Schema from which to get any `ui:xxx` options
 * @param [globalOptions={}] - The optional Global UI Schema from which to get any fallback `xxx` options
 * @returns - An object containing all the `ui:xxx` options with the `ui:` stripped off along with all `globalOptions`
 */
export default function getUiOptions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F> = {}, globalOptions: GlobalUISchemaOptions = {}): UIOptionsType<T, S, F> {
  // Handle null or undefined uiSchema
  if (!uiSchema) {
    return { ...globalOptions };
  }
  const options: UIOptionsType<T, S, F> = { ...globalOptions };
  for (const key of Object.keys(uiSchema).filter(isUiKey)) {
    const value = uiSchema[key];
    if (key === UI_WIDGET_KEY && isObject(value)) {
      logOnce('Setting options via ui:widget object is no longer supported, use ui:options instead', 'error');
    } else if (key === UI_OPTIONS_KEY && isObject(value)) {
      Object.assign(options, value);
    } else {
      Object.assign(options, { [key.substring(3)]: value });
    }
  }
  return options;
}
