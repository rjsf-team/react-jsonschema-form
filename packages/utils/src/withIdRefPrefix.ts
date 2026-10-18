import { ID_KEY, REF_KEY, ROOT_SCHEMA_PREFIX } from './constants.ts';
import isObject from './isObject.ts';
import { resolveUri } from './schemaUri.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the `$ref` written as `ref` as a schema validated beside the root has to spell it: one local to the root
 * names the root by `base`, and a relative one names a resource beside the root, so it is resolved against the root's
 * URI, which a root without an `$id` does not have
 *
 * @param ref - The `$ref` as written
 * @param base - The id of the root schema, without an empty trailing fragment
 * @returns - The `$ref` as the validator is to resolve it
 */
function rootRef(ref: string, base: string): string {
  if (ref.startsWith('#')) {
    return base + ref;
  }
  return base === ROOT_SCHEMA_PREFIX ? ref : resolveUri(base, ref);
}

/** Takes a `node` object and transforms any contained `$ref` node variables with a prefix, recursively calling
 * `prefixRefs` for any other elements.
 *
 * @param node - The object node to which the `base` is added when a REF_KEY is part of it
 * @param base - The id of the root schema the local `$ref`s name, without an empty trailing fragment
 */
function withIdRefPrefixObject<S extends StrictRJSFSchema = RJSFSchema>(node: S, base: string): S {
  const realObj: GenericObjectType = node;
  for (const key in realObj) {
    /* v8 ignore next -- spread in caller guarantees only own properties reach this loop */
    if (Object.hasOwn(realObj, key)) {
      const value = realObj[key];
      if (key === REF_KEY && typeof value === 'string') {
        realObj[key] = rootRef(value, base);
      } else {
        realObj[key] = prefixRefs<S>(value, base);
      }
    }
  }
  return node;
}

/** Takes a `node` object list and transforms any contained `$ref` node variables with a prefix, recursively calling
 * `prefixRefs` for any other elements.
 *
 * @param node - The list of object nodes to which the `base` is added when a REF_KEY is part of it
 * @param base - The id of the root schema the local `$ref`s name, without an empty trailing fragment
 */
function withIdRefPrefixArray<S extends StrictRJSFSchema = RJSFSchema>(node: S[], base: string): S[] {
  return node.map((item) => prefixRefs<S>(item, base));
}

function prefixRefs<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S, base: string): S;
function prefixRefs<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S | S[] | S[keyof S],
  base: string,
): S | S[] | S[keyof S];
function prefixRefs<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S | S[] | S[keyof S],
  base: string,
): S | S[] | S[keyof S] {
  if (Array.isArray(schemaNode)) {
    return withIdRefPrefixArray<S>([...schemaNode], base);
  }
  if (isObject(schemaNode)) {
    return withIdRefPrefixObject<S>({ ...schemaNode }, base);
  }
  return schemaNode;
}

/** Returns the id a validator registers `rootSchema` under, and so the prefix `withRootIdRefPrefix()` gives the local
 * `$ref`s it rewrites: the root's own `$id`, or `ROOT_SCHEMA_PREFIX` where it has none, since an empty `$id` names
 * nothing a `$ref` could resolve against
 *
 * @param rootSchema - The root schema
 * @returns - The id the root is registered under
 */
export function rootSchemaIdOf<S extends StrictRJSFSchema = RJSFSchema>(rootSchema: S): string {
  return rootSchema[ID_KEY] || ROOT_SCHEMA_PREFIX;
}

/** Recursively prefixes every `$ref` local to the root document, one starting with `#`, with the id `rootSchema` is
 * registered under, as `rootSchemaIdOf()` returns it, and resolves every relative one against that id where the root
 * has an `$id`. An id ending in an empty fragment, as `http://example.com/root.json#` does, names the same document as
 * one without it, so that `#` is left out of the prefix rather than doubled. This is what a validator applies to a
 * schema it validates beside `rootSchema`, so that a `$ref` written in the root resolves against the root whatever the
 * schema holding it is registered as.
 *
 * @param schemaNode - The object node to which the prefix is added when a REF_KEY is part of it
 * @param rootSchema - The root schema the local `$ref`s name
 * @returns - A copy of the `schemaNode` with updated `$ref`s
 */
export function withRootIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S, rootSchema: S): S {
  return prefixRefs<S>(schemaNode, rootSchemaIdOf(rootSchema).replace(/#$/, ''));
}

/** Recursively prefixes all `$ref`s local to the root document, one starting with `#`, with the value of the
 * `ROOT_SCHEMA_PREFIX` constant. This is used in isValid to make references to the rootSchema
 *
 * @param schemaNode - The object node to which a ROOT_SCHEMA_PREFIX is added when a REF_KEY is part of it
 * @returns - A copy of the `schemaNode` with updated `$ref`s
 */
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S[]): S[];
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S): S;
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S[keyof S]): S[keyof S];
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S | S[] | S[keyof S],
): S | S[] | S[keyof S];
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S | S[] | S[keyof S],
): S | S[] | S[keyof S] {
  return prefixRefs<S>(schemaNode, ROOT_SCHEMA_PREFIX);
}
