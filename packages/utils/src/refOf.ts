import { REF_KEY, RJSF_REF_KEY, RJSF_SOURCE_REF_KEY } from './constants.ts';
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

/** Returns the `$ref` spelling the document author wrote for the schema `schema` was resolved from, kept on a
 * separate marker when normalization rewrote the ref the resolution walk carried. `resolveUiSchema` keys its
 * `ui:definitions` by the author's spelling, so it reads this marker before the canonical `RJSF_REF_KEY`.
 *
 * @param schema - The schema to read the author-spelled reference off, if there is one to read
 * @returns - The author-spelled `$ref` the schema was resolved from, or undefined when it matches the canonical one
 */
export function sourceRefOf<S extends StrictRJSFSchema = RJSFSchema>(schema: S | undefined): string | undefined {
  return (schema as RJSFMarkedSchema | undefined)?.[RJSF_SOURCE_REF_KEY] as string | undefined;
}
