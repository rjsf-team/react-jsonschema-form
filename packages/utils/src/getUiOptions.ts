import { UI_OPTIONS_KEY, UI_WIDGET_KEY } from "./constants";
import isObject from "./isObject";
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  UiSchema,
} from "./types";

/** Get all passed options from ui:options, and ui:<optionName>, returning them in an object with the `ui:`
 * stripped off.
 *
 * @param [uiSchema={}] - The UI Schema from which to get any `ui:xxx` options
 * @returns - An object containing all the `ui:xxx` options with the stripped off
 */
export default function getUiOptions<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(uiSchema: UiSchema<T, S, F> = {}): UIOptionsType<T, S, F> {
  return Object.keys(uiSchema)
    .filter((key) => key.indexOf("ui:") === 0)
    .reduce((options, key) => {
      const value = uiSchema[key];
      if (key === UI_WIDGET_KEY && isObject(value)) {
        console.error(
          "Setting options via ui:widget object is no longer supported, use ui:options instead"
        );
        return options;
      }
      if (key === UI_OPTIONS_KEY && isObject(value)) {
        return { ...options, ...value };
      }
      return { ...options, [key.substring(3)]: value };
    }, {});
}
