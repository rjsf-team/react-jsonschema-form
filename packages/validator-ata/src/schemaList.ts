/** The `$id` ata registers a schema under: a non-empty string that is not just a fragment. */
export function declaredId(schema: object) {
  const id = (schema as { $id?: unknown }).$id;
  return typeof id === 'string' && id !== '' && !id.startsWith('#') ? id : undefined;
}

/** ata's `schemas` option as a list, in the order ata registers it. ata registers a record entry
 * under its key and under its own `$id`, so a record entry becomes one document under the key and,
 * when its own `$id` differs, the document itself after it. */
export function schemaList(schemas: object | object[] | undefined): object[] {
  if (schemas === undefined) {
    return [];
  }
  if (Array.isArray(schemas)) {
    return schemas;
  }
  return Object.entries(schemas).flatMap(([id, extra]: [string, object]) => {
    const ownId = declaredId(extra);
    return ownId && ownId !== id ? [{ ...extra, $id: id }, extra] : [{ ...extra, $id: id }];
  });
}
