import isObject from './isObject.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the names `schema.propertyNames.enum` allows that nothing has taken yet, in the order the `enum` lists
 * them. A name `schema.properties` declares is taken however empty its value is, since adding under it would write
 * into that declared property rather than create an additional one, and a name `formData` holds is taken whether or
 * not `retrieveSchema()` has stubbed it in among the properties. An entry that is not a string names nothing a
 * property key could equal, so it is dropped rather than offered as a name no validator would accept.
 *
 * An `undefined` return means the schema enumerates nothing at all, which is what tells "any name goes" apart from
 * "no name is left to take" — the empty array. An `enum` that is empty, or that lists only non-strings, allows no key
 * whatsoever and so reads as the latter. A `propertyNames` written as a `$ref` reads as the former, since resolving
 * one needs a `schemaUtils` this has no access to; resolve it before calling if that matters.
 *
 * @param schema - The schema whose `propertyNames.enum` names the property may take
 * @param [formData] - The form data whose keys count as taken alongside the schema's own properties
 * @param [keepName] - A name to count as free even when taken, the current key of a property being renamed
 * @returns - The allowed names nothing has taken, or undefined when the schema enumerates none
 */
export default function getFreePropertyNames<T = any, S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  formData?: T,
  keepName?: string,
): string[] | undefined {
  const { propertyNames } = schema;
  if (!isObject(propertyNames) || !Array.isArray(propertyNames.enum)) {
    return undefined;
  }
  const properties = schema.properties ?? {};
  const takenNames = isObject(formData) ? formData : {};
  return propertyNames.enum.filter(
    (allowedName): allowedName is string =>
      typeof allowedName === 'string' &&
      (allowedName === keepName ||
        (!Object.hasOwn(properties, allowedName) && !Object.hasOwn(takenNames, allowedName))),
  );
}
