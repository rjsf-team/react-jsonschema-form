import { REF_KEY, RJSF_REF_KEY } from './constants.ts';
import type { RJSFMarkedSchema, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the `$ref` the given `schema` still holds, which is one that has yet to be resolved.
 *
 * @param schema - The schema to read the reference off, if there is one to read it off at all
 * @returns - The `$ref` the schema holds, or undefined when it holds none
 */
export function declaredRef<S extends StrictRJSFSchema = RJSFSchema>(schema: S | undefined): string | undefined {
  return schema?.[REF_KEY];
}

/** Returns the `$ref` that the given `schema` was resolved from, which `resolveAllReferences()` marks it with. A
 * resolved schema no longer holds the reference as a key, so the marker is what names where it came from.
 *
 * @param schema - The schema to read the marker off, if there is one to read it off at all
 * @returns - The `$ref` the schema was resolved from, or undefined when it was not resolved from one
 */
export function resolvedFromRef<S extends StrictRJSFSchema = RJSFSchema>(schema: S | undefined): string | undefined {
  return (schema as RJSFMarkedSchema | undefined)?.[RJSF_REF_KEY] as string | undefined;
}
