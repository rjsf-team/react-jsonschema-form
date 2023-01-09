import get from "lodash/get";

import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
} from "./types";
import asNumber from "./asNumber";
import guessType from "./guessType";

const nums = new Set<any>(["number", "integer"]);

/** Returns the real value for a select widget due to a silly limitation in the DOM which causes option change event
 * values to always be retrieved as strings. Uses the `schema` to help determine the value's true type. If the value is
 * an empty string, then the `emptyValue` from the `options` is returned, falling back to undefined.
 *
 * @param schema - The schema to used to determine the value's true type
 * @param [value] - The value to convert
 * @param [options] - The UIOptionsType from which to potentially extract the emptyValue
 * @returns - The `value` converted to the proper type
 */
export default function processSelectValue<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(schema: S, value?: any, options?: UIOptionsType<T, S, F>) {
  const { enum: schemaEnum, type, items } = schema;
  if (value === "") {
    return options && options.emptyValue !== undefined
      ? options.emptyValue
      : undefined;
  }
  if (type === "array" && items && nums.has(get(items, "type"))) {
    return value.map(asNumber);
  }
  if (type === "boolean") {
    return value === "true";
  }
  if (nums.has(type)) {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (Array.isArray(schemaEnum)) {
    if (schemaEnum.every((x: any) => nums.has(guessType(x)))) {
      return asNumber(value);
    }
    if (schemaEnum.every((x: any) => guessType(x) === "boolean")) {
      return value === "true";
    }
  }

  return value;
}
