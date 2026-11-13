import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { rootSchemaIdOf } from '@rjsf/utils';
import type { Ajv } from 'ajv';

/** Returns the id Ajv registers `rootSchema` under and the pointers into it are prefixed with: `rootSchemaIdOf()` as
 * Ajv normalizes the URI of a `$ref` before looking up the schema it names, resolving it and then serializing it as the
 * `uriResolver` parses it, so `http://example.com/a b.json` becomes `http://example.com/a%20b.json` and
 * `http://example.com:80/a.json` becomes `http://example.com/a.json`, which Ajv would otherwise find nothing registered
 * under
 *
 * @param rootSchema - The root schema
 * @param uriResolver - The `uriResolver` of the Ajv instance the root is registered with
 * @returns - The id the root is registered under
 */
export default function ajvRootSchemaId<S extends StrictRJSFSchema = RJSFSchema>(
  rootSchema: S,
  uriResolver: Ajv['opts']['uriResolver'],
): string {
  return uriResolver.serialize(uriResolver.parse(uriResolver.resolve('', rootSchemaIdOf(rootSchema))));
}
