import { REF_KEY } from '../constants.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import { isSchemaObject } from '../isObject.ts';
import type { RJSFSchema, StrictRJSFSchema } from '../types.ts';
import KeyedMemo from './graph/keyedMemo.ts';
import { resolveOwnRef } from './retrieveSchema.ts';

/** The schemas `resolveConstantOptions()` made, by root schema and the schema offering the options */
const resolvedSelects = new KeyedMemo<object>();

/** Returns `schema` with the own `$ref` of each of its `anyOf`/`oneOf` options resolved, read from the keyword
 * `getXxxOfOptions()` picks, when that makes every option a constant: the options of a select, which `retrieveSchema()`
 * hands out as written, for a field to retrieve, though a select renders no field for them. Otherwise `schema` itself
 * is returned, its options left for the field that renders each to retrieve. The result is made once per schema and
 * shared, so that a memo keyed on it hits across calls.
 *
 * @param schema - The retrieved schema that may offer options written as `$ref`s
 * @param rootSchema - The root schema the references name definitions of
 * @returns - The schema with its constant options resolved, or `schema` itself
 * @throws - An error for an option's reference that resolves to nothing, as retrieving that option does
 */
export default function resolveConstantOptions<S extends StrictRJSFSchema = RJSFSchema>(schema: S, rootSchema: S): S {
  const xxxOf = getXxxOfOptions<S>(schema);
  if (!xxxOf?.options.some((option) => isSchemaObject<S>(option) && typeof option[REF_KEY] === 'string')) {
    return schema;
  }
  const keys = [rootSchema, schema];
  const known = resolvedSelects.peek(keys);
  if (isSchemaObject<S>(known)) {
    return known;
  }
  const resolved = xxxOf.options.map((option) =>
    isSchemaObject<S>(option) ? resolveOwnRef<S>(option, rootSchema) : option,
  );
  const result: S = isConstantOptionList<S>(resolved, true) ? { ...schema, [xxxOf.key]: resolved } : schema;
  resolvedSelects.set(keys, result);
  return result;
}
