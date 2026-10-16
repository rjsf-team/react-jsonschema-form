import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, rootSchemaIdOf, withRootIdRefPrefix } from '@rjsf/utils';
import type { Ajv } from 'ajv';

/** Returns the id Ajv registers `rootSchema` under and the pointers into it are prefixed with: `rootSchemaIdOf()` as
 * the `uriResolver` normalizes the URI of a `$ref` before looking up the schema it names, so `http://example.com/a b.json`
 * becomes `http://example.com/a%20b.json`, which Ajv would otherwise find nothing registered under
 *
 * @param rootSchema - The root schema
 * @param uriResolver - The `uriResolver` of the Ajv instance the root is registered with
 * @returns - The id the root is registered under
 */
export default function ajvRootSchemaId<S extends StrictRJSFSchema = RJSFSchema>(
  rootSchema: S,
  uriResolver: Ajv['opts']['uriResolver'],
): string {
  return uriResolver.resolve('', rootSchemaIdOf(rootSchema));
}

/** Returns a copy of `schema` in which every `$ref` local to the root names it by `rootId`, the id
 * `ajvRootSchemaId()` gives, through `withRootIdRefPrefix()` handed the root as it is registered under that id
 *
 * @param schema - The schema whose local `$ref`s are prefixed
 * @param rootSchema - The root schema the local `$ref`s name
 * @param rootId - The id `ajvRootSchemaId()` gives for `rootSchema`
 * @returns - A copy of `schema` with updated `$ref`s
 */
export function withAjvRootIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  rootSchema: S,
  rootId: string,
): S {
  return withRootIdRefPrefix<S>(schema, { ...rootSchema, [ID_KEY]: rootId });
}
