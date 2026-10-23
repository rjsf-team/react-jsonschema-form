// The spellings ata reads as draft-04 (`DRAFT4_SCHEMAS` in its lib/dialect.js): http only.
const DRAFT_04 = /^http:\/\/json-schema\.org\/draft-04\/schema#?$/;

/** Whether a schema is read as draft-04: by its own `$schema`, or, without one, by `inherited`. */
export function isDraft04(schema: unknown, inherited: boolean) {
  const declared = (schema as { $schema?: unknown } | null)?.$schema;
  return typeof declared === 'string' ? DRAFT_04.test(declared) : inherited;
}

/** A schema's own `$id`, the one a `$ref` can reach it by: non-empty and not just a fragment.
 * ata also keeps a document under a fragment `$id` such as `#frag`, but a `$ref: '#frag'` is read
 * as a fragment of the document it is in, as JSON Schema defines it, and never reaches it. */
export function ownId(schema: object) {
  const id = (schema as { $id?: unknown }).$id;
  return typeof id === 'string' && id !== '' && !id.startsWith('#') ? id : undefined;
}

/** The object schema that means the same as a boolean schema: `{}` for true, `{ not: {} }` for false. */
function asObjectSchema(schema: boolean): object {
  return schema ? {} : { not: {} };
}

/** ata's `schemas` option as a list, in the order ata registers it, each document carrying the
 * `$id` it is registered under, so that every validator registers it the same way whatever its own
 * dialect:
 * - a record entry becomes one document under its key and, when its own `$id` differs, the document
 *   itself after it, since ata registers it under both;
 * - a boolean record entry becomes the object schema that means the same (`{}` for true,
 *   `{ not: {} }` for false), since an `$id` cannot be put on a boolean, and one that is not a
 *   schema at all (`null`) is left out;
 * - a document read as draft-04 (`draft04` is whether the root it is read under is) without an
 *   `$id` gets its `id` as `$id`, as ata does for draft-04.
 */
export function schemaList(schemas: object | object[] | undefined, draft04 = false): object[] {
  if (schemas === undefined) {
    return [];
  }
  // As ata's draft-04 reading does (lib/draft7.js): `id` becomes `$id` when there is no `$id`, and no
  // `$ref`, next to which a draft-04 keyword does not count.
  const withDraft04Id = (doc: object) => {
    const { id, $id, $ref } = doc as { id?: unknown; $id?: unknown; $ref?: unknown };
    return $id === undefined &&
      typeof id === 'string' &&
      id !== '' &&
      typeof $ref !== 'string' &&
      isDraft04(doc, draft04)
      ? { ...doc, $id: id }
      : doc;
  };
  if (Array.isArray(schemas)) {
    return schemas.map((doc) => (doc !== null && typeof doc === 'object' ? withDraft04Id(doc) : doc));
  }
  return Object.entries(schemas).flatMap(([key, entry]: [string, unknown]) => {
    if (entry === null || (typeof entry !== 'object' && typeof entry !== 'boolean')) {
      return [];
    }
    const doc = typeof entry === 'boolean' ? asObjectSchema(entry) : withDraft04Id(entry);
    const own = ownId(doc);
    return own && own !== key ? [{ ...doc, $id: key }, doc] : [{ ...doc, $id: key }];
  });
}
