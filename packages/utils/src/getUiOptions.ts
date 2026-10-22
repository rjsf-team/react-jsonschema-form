import { isValidElement } from 'react';

import { UI_DEFINITIONS_KEY, UI_GLOBAL_OPTIONS_KEY, UI_OPTIONS_KEY, UI_WIDGET_KEY } from './constants.ts';
import describeElementGivenAsComponent from './describeElementGivenAsComponent.ts';
import isComponentType from './isComponentType.ts';
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

/** The root uiSchema's own keys, which configure the form rather than any one field */
const FORM_KEYS: readonly string[] = [UI_DEFINITIONS_KEY, UI_GLOBAL_OPTIONS_KEY];

/** Narrows a uiSchema key to a field's own `ui:` key, so indexing resolves against that index signature */
function isOptionKey(key: string): key is `ui:${string}` {
  return key.startsWith('ui:') && !FORM_KEYS.includes(key);
}

/** Get all passed options from ui:options, and ui:<optionName>, returning them in an object with the `ui:`
 * stripped off. Any `globalOptions` will always be returned, unless they are overridden by options in the `uiSchema`.
 * A global `required` is left out: `ui:required` is a field's own, since validation reads it from the field's own
 * uiSchema alone, so a form-wide one would mark fields required that validation doesn't require. `ui:definitions` and
 * `ui:globalOptions` aren't options either.
 * Pass the registry's `globalUiOptions`, which hold only the options RJSF reads there and the extension keys the theme
 * and the `Form` declare, as `pickGlobalUiOptions()` leaves them. A root uiSchema's `ui:globalOptions` read some other
 * way goes through `pickGlobalUiOptions()` with those keys first, or it keeps only RJSF's own.
 *
 * @param [uiSchema={}] - The UI Schema from which to get any `ui:xxx` options
 * @param [globalOptions={}] - The optional Global UI Schema from which to get any fallback `xxx` options
 * @returns - An object containing all the `ui:xxx` options with the `ui:` stripped off along with the `globalOptions`
 *            other than `required`
 */
export default function getUiOptions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F> = {}, globalOptions: GlobalUISchemaOptions = {}): UIOptionsType<T, S, F> {
  const options: UIOptionsType<T, S, F> = { ...globalOptions };
  delete options.required;
  // Handle null or undefined uiSchema
  if (!uiSchema) {
    return options;
  }
  for (const key of Object.keys(uiSchema).filter(isOptionKey)) {
    const value = uiSchema[key];
    // `memo()`, `forwardRef()` and `lazy()` return objects too, so only an object that isn't a component is taken for the
    // removed `{ component, options }` form
    if (key === UI_WIDGET_KEY && isObject(value) && !isComponentType(value)) {
      logOnce(
        isValidElement(value)
          ? `ui:widget ${describeElementGivenAsComponent('MyWidget')}, so it is ignored.`
          : 'Setting options via ui:widget object is no longer supported, use ui:options instead',
        'error',
      );
    } else if (key === UI_OPTIONS_KEY && isObject(value)) {
      Object.assign(options, value);
    } else {
      Object.assign(options, { [key.substring(3)]: value });
    }
  }
  return options;
}
