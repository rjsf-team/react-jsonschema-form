import { REF_KEY } from '../constants.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import { isSchemaObject } from '../isObject.ts';
import type { RJSFSchema, StrictRJSFSchema } from '../types.ts';
import KeyedMemo from './graph/keyedMemo.ts';
import type { Seeding } from './graph/mergePlan.ts';
import parseSchemaGraph from './graph/parseSchemaGraph.ts';
import { readProvenance } from './graph/provenance.ts';
import { optionNode, resolveMergedOwnRef, resolveOwnRef } from './retrieveSchema.ts';

/** The schemas `resolveConstantOptions()` made, by root schema and the schema offering the options, and those
 * `resolveDeclaredConstantOptions()` made, by the graph and chains declaring the options and that schema
 */
const resolvedSelects = new KeyedMemo<object>();

/** How the options of a schema are read: the keys their resolution depends on, and the resolution of an option */
interface OptionReader<S extends StrictRJSFSchema> {
  readonly keys: readonly unknown[];
  readonly resolve: (option: S, keyword: string, index: number) => S;
}

function constantOptions<S extends StrictRJSFSchema>(schema: S, reader: () => OptionReader<S>): S {
  const xxxOf = getXxxOfOptions<S>(schema);
  if (!xxxOf?.options.some((option) => isSchemaObject<S>(option) && typeof option[REF_KEY] === 'string')) {
    return schema;
  }
  const { keys, resolve } = reader();
  const memoKeys = [...keys, schema];
  const known = resolvedSelects.peek(memoKeys);
  if (isSchemaObject<S>(known)) {
    return known;
  }
  const resolved = xxxOf.options.map((option, index) =>
    isSchemaObject<S>(option) ? resolve(option, xxxOf.key, index) : option,
  );
  const result: S = isConstantOptionList<S>(resolved, true) ? { ...schema, [xxxOf.key]: resolved } : schema;
  resolvedSelects.set(memoKeys, result);
  return result;
}

/** Returns `schema` with the own `$ref` of each of its `anyOf`/`oneOf` options resolved, read from the keyword
 * `getXxxOfOptions()` picks, when that makes every option a constant: the options of a select, as `retrieveSchema()`
 * resolves them in the schemas it hands out, read here from a schema that did not come from it. Otherwise `schema`
 * itself is returned, its options left for the field that renders each to retrieve. The result is made once per schema
 * and shared, so that a memo keyed on it hits across calls.
 *
 * @param schema - The schema that may offer options written as `$ref`s
 * @param rootSchema - The root schema the references name definitions of
 * @returns - The schema with its constant options resolved, or `schema` itself
 * @throws - An error for an option's reference that resolves to nothing, as retrieving that option does
 */
export default function resolveConstantOptions<S extends StrictRJSFSchema = RJSFSchema>(schema: S, rootSchema: S): S {
  return constantOptions<S>(schema, () => ({
    keys: [rootSchema],
    resolve: (option) => resolveOwnRef<S>(option, rootSchema),
  }));
}

/** Returns `schema` as `resolveConstantOptions()` returns it, for a schema whose options the declarations `seeding`
 * describes hold: an option a merge of lists rebuilt is an object no graph holds, which resolving at the root would read
 * against the root's base, so each option is read where those declarations hold it, or where the merge adopted it. An
 * option `retrieveSchema()` handed out is read by its stamp, as `resolveConstantOptions()` reads it.
 *
 * @param schema - The schema that may offer options written as `$ref`s
 * @param seeding - Returns the graph and chains of the declarations holding the options
 * @returns - The schema with its constant options resolved, or `schema` itself
 * @throws - An error for an option's reference that resolves to nothing
 */
export function resolveDeclaredConstantOptions<S extends StrictRJSFSchema>(schema: S, seeding: () => Seeding<S>): S {
  return constantOptions<S>(schema, () => {
    const declaredIn = seeding();
    const rootSchema = declaredIn.graph.rawRoot;
    const rootGraph = parseSchemaGraph<S>(rootSchema);
    return {
      keys: [declaredIn.graph, declaredIn.chains],
      resolve: (option, keyword, index) => {
        if (readProvenance<S>(option, rootGraph) !== undefined) {
          return resolveOwnRef<S>(option, rootSchema);
        }
        const { graph, node } = optionNode<S>(declaredIn, keyword, index, option);
        return resolveMergedOwnRef<S>(graph, [{ node, refPath: [] }], option);
      },
    };
  });
}
