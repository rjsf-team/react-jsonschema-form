import { PROPERTIES_KEY, REF_KEY } from './constants.ts';
import { isSchemaObject } from './isObject.ts';
import { getByPath } from './pathUtils.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the schema of the selector property of an `anyOf`/`oneOf` option, the one the options are told apart by, as
 * it is read for the value, title and type that tell them apart. An option hands its properties out as written, so a
 * selector written as a `$ref` is retrieved by `retrieve`, for the data the selector holds; one written in place is read
 * as it stands, so it keeps its identity across changes of the data. `findSelectedOptionInXxxOf()` and
 * `LayoutMultiSchemaField` both read a selector this way, so the option one selects is the one the other lists.
 *
 * @param option - The option, retrieved for the field's data
 * @param selectorField - The name of the selector property
 * @param retrieve - Retrieves a selector written as a `$ref`
 * @returns - The selector's schema, or undefined where the option declares no schema for it
 */
export default function getOptionSelectorSchema<S extends StrictRJSFSchema = RJSFSchema>(
  option: S,
  selectorField: string,
  retrieve: (selector: S) => S,
): S | undefined {
  // By own key, so an undeclared `__proto__` selector isn't read as `Object.prototype`, which passes as a schema
  const selector: unknown = getByPath(option[PROPERTIES_KEY], selectorField);
  if (!isSchemaObject<S>(selector)) {
    return undefined;
  }
  return typeof selector[REF_KEY] === 'string' ? retrieve(selector) : selector;
}
