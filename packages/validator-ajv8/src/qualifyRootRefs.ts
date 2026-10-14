import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { isObject, REF_KEY } from '@rjsf/utils';

function qualified(value: unknown, rootId: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => qualified(item, rootId));
  }
  if (!isObject(value)) {
    return value;
  }
  return qualifiedEntries({ ...value }, rootId);
}

function qualifiedEntries<T extends GenericObjectType>(copy: T, rootId: string): T {
  const entries: GenericObjectType = copy;
  for (const [key, entry] of Object.entries(entries)) {
    entries[key] =
      key === REF_KEY && typeof entry === 'string' && entry.startsWith('#')
        ? `${rootId}${entry}`
        : qualified(entry, rootId);
  }
  return copy;
}

/** Returns a copy of `schema` in which every `$ref` local to the root document, one starting with `#`, names the root
 * by `rootId`, as `withIdRefPrefix()` names it for the runtime validator. `retrieveSchema()` leaves a `$ref` below the
 * schema it resolves as it stands, so a sub-schema the form validates against can hold one, and compiled under an
 * `$id` of its own it would resolve that `$ref` against itself, where the definition it names is not.
 *
 * @param schema - The sub-schema to qualify the references of
 * @param rootId - The `$id` the root schema is compiled under
 * @returns - The qualified copy
 */
export default function qualifyRootRefs<S extends StrictRJSFSchema = RJSFSchema>(schema: S, rootId: string): S {
  const copy: S = { ...schema };
  const entries: GenericObjectType = copy;
  qualifiedEntries(entries, rootId);
  return copy;
}
