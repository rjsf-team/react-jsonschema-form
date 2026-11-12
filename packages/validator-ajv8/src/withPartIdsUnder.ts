import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { DEFINITIONS_KEY, getByPath, ID_KEY, isObject, SHARED_COPY_ID } from '@rjsf/utils';

/** Returns `schema` with the `$id` of each part an option's scoring target holds once, see `SHARED_COPY_ID`, written
 * under `schemaId`, the keyword the Ajv instance reads an identifier from: one built by `ajv-draft-04`, or with
 * `schemaId: 'id'`, reads only `id`, so a `$ref` to such a part would name nothing. A scoring target holds the parts in
 * the `definitions` or `$defs` of its top alone, so nothing else is read.
 *
 * @param schema - The schema Ajv is to compile
 * @param schemaId - The `schemaId` option of the Ajv instance
 * @returns - The schema, with the parts it holds once identified under `schemaId`
 */
export default function withPartIdsUnder<S extends StrictRJSFSchema = RJSFSchema>(schema: S, schemaId: string): S {
  if (schemaId === ID_KEY) {
    return schema;
  }
  const renamed = (part: unknown) => {
    const id = isObject(part) ? part[ID_KEY] : undefined;
    if (!isObject(part) || typeof id !== 'string' || !id.startsWith(SHARED_COPY_ID)) {
      return part;
    }
    const { [ID_KEY]: _id, ...rest } = part;
    return { ...rest, [schemaId]: id };
  };
  let written = schema;
  for (const container of [DEFINITIONS_KEY, '$defs']) {
    const held: unknown = getByPath(schema, [container]);
    if (isObject(held)) {
      written = {
        ...written,
        [container]: Object.fromEntries(Object.entries(held).map(([name, part]) => [name, renamed(part)])),
      };
    }
  }
  return written;
}
