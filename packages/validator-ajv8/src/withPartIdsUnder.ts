import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, sharedCopyParts } from '@rjsf/utils';

/** Returns `schema` with the `$id` of each part an option's scoring target holds once, see `sharedCopyParts()`,
 * written under `schemaId`, the keyword the Ajv instance reads an identifier from: one built by `ajv-draft-04`, or with
 * `schemaId: 'id'`, reads only `id`, so a `$ref` to such a part would name nothing.
 *
 * @param schema - The schema Ajv is to compile
 * @param schemaId - The `schemaId` option of the Ajv instance
 * @returns - The schema, with the parts it holds once identified under `schemaId`
 */
export default function withPartIdsUnder<S extends StrictRJSFSchema = RJSFSchema>(schema: S, schemaId: string): S {
  if (schemaId === ID_KEY) {
    return schema;
  }
  const containers = new Map<string, object>();
  for (const { container, held, name, id, part } of sharedCopyParts(schema)) {
    const { [ID_KEY]: _id, ...rest } = part;
    containers.set(container, { ...(containers.get(container) ?? held), [name]: { ...rest, [schemaId]: id } });
  }
  return { ...schema, ...Object.fromEntries(containers) };
}
