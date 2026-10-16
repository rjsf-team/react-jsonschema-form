import type { RJSFSchema, StrictRJSFSchema } from '../../types.ts';
import { seedsKey } from './mergePlan.ts';
import type { Seed } from './mergePlan.ts';
import type { SchemaGraph } from './parseSchemaGraph.ts';

/** Where a copy `retrieveSchema()` hands out came from. A `WeakMap` keyed by the copy would lose it on the spreads
 * consumers make of their schema, so it rides on the copy under a symbol a spread keeps. The symbol stays private:
 * only `stamp()` writes it and only `readProvenance()` reads it.
 */
const PROVENANCE = Symbol('__rjsf_provenance');

/** The plan sets of a field's ancestors since its chain last restarted, which the set-equality guard checks a field's
 * own plan set against. Interned per graph: one parent chain extended by one set is one chain.
 */
export interface GuardChain {
  readonly id: number;
  readonly parent?: GuardChain;
  /** The `setKey` of the plan this link adds */
  readonly setKey: string;
  /** Whether a plan with the set `setKey` is on the chain */
  has(setKey: string): boolean;
}

/** What a field's provenance records beyond its graph and its parent: its seeds and the guard chain of its ancestors */
export interface ProvenanceFields {
  readonly seeds: readonly Seed[];
  readonly chain?: GuardChain;
  /** For an `anyOf`/`oneOf` option, the `setKey` of the plan of the field offering it: an option whose own plan adds
   * nothing to that set renders nothing beside the selector
   */
  readonly optionOf?: string;
}

/** A copy's provenance: the field it is the schema of, by the graph it was planned in and the seeds and chain the
 * recursion rule reads. Interned per graph, so an equal provenance is the same object.
 */
export interface Provenance<S extends StrictRJSFSchema = RJSFSchema> extends ProvenanceFields {
  readonly id: number;
  readonly graph: SchemaGraph<S>;
  readonly parent?: Provenance<S>;
}

/** The interned values of one graph: equal values are one object, which `replaceEqualDeep()` needs, since it compares
 * symbol-keyed values by identity
 */
interface InternTable {
  readonly takeId: () => number;
  readonly chains: Map<string, GuardChain>;
  readonly provenances: Map<string, object>;
}

const tables = new WeakMap<object, InternTable>();

/** The graph each interned provenance was planned in, which is how a value read back is known to be one */
const provenanceGraphs = new WeakMap<object, SchemaGraph<StrictRJSFSchema>>();

function tableOf(graph: object): InternTable {
  let table = tables.get(graph);
  if (table === undefined) {
    let nextId = 0;
    const takeId = () => {
      nextId += 1;
      return nextId;
    };
    table = { takeId, chains: new Map(), provenances: new Map() };
    tables.set(graph, table);
  }
  return table;
}

/** Returns `chain` extended by the plan set `setKey`, or a chain of that set alone when there is no `chain`
 *
 * @param graph - The graph the plans are of
 * @param chain - The chain to extend, if there is one
 * @param setKey - The `setKey` of the plan to add
 * @returns - The interned chain
 */
export function extendChain(graph: object, chain: GuardChain | undefined, setKey: string): GuardChain {
  const table = tableOf(graph);
  const key = `${chain?.id ?? ''}>${setKey}`;
  const interned = table.chains.get(key);
  if (interned !== undefined) {
    return interned;
  }
  const keys = new Set<string>([setKey]);
  for (let link = chain; link !== undefined; link = link.parent) {
    keys.add(link.setKey);
  }
  const extended: GuardChain = Object.freeze({
    id: table.takeId(),
    parent: chain,
    setKey,
    has: (candidate: string) => keys.has(candidate),
  });
  table.chains.set(key, extended);
  return extended;
}

/** Whether `value` is a provenance planned in `graph` or in a graph extending it with a schema from outside the root */
function isProvenanceOf<S extends StrictRJSFSchema>(value: unknown, graph: SchemaGraph<S>): value is Provenance<S> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  for (let owner = provenanceGraphs.get(value); owner !== undefined; owner = owner.base) {
    if (owner === graph) {
      return true;
    }
  }
  return false;
}

function intern<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  fields: ProvenanceFields,
  parent?: Provenance<S>,
): Provenance<S> {
  const table = tableOf(graph);
  const key = [parent?.id, seedsKey(fields.seeds), fields.chain?.id, fields.optionOf].join('|');
  const interned = table.provenances.get(key);
  if (isProvenanceOf(interned, graph)) {
    return interned;
  }
  const provenance: Provenance<S> = {
    id: table.takeId(),
    graph,
    parent,
    seeds: Object.freeze(
      fields.seeds.map(({ node, refPath }) => Object.freeze({ node, refPath: Object.freeze([...refPath]) })),
    ),
    chain: fields.chain,
    optionOf: fields.optionOf,
  };
  // A printed schema shows its stamp through this rather than the whole graph the stamp points into, as the diff of a
  // failed comparison prints it
  Object.defineProperty(provenance, 'toJSON', { value: () => `provenance ${provenance.id}` });
  Object.freeze(provenance);
  provenanceGraphs.set(provenance, graph);
  table.provenances.set(key, provenance);
  return provenance;
}

/** Returns the provenance of a call root: a field with no parent, no chain and the given seeds
 *
 * @param graph - The graph the field is planned in
 * @param seeds - The field's seeds
 * @returns - The interned provenance
 */
export function rootProvenance<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  seeds: readonly Seed[],
): Provenance<S> {
  return intern(graph, { seeds });
}

/** Returns the provenance of a child of the field `parent` is the provenance of
 *
 * @param parent - The parent field's provenance
 * @param fields - The child's seeds, chain and flags
 * @param [graph=parent.graph] - The graph the child is planned in, when it is not the parent's
 * @returns - The interned provenance
 */
export function childProvenance<S extends StrictRJSFSchema = RJSFSchema>(
  parent: Provenance<S>,
  fields: ProvenanceFields,
  graph: SchemaGraph<S> = parent.graph,
): Provenance<S> {
  return intern(graph, fields, parent);
}

/** Returns a copy of `schema` carrying `provenance`, which a spread of the copy keeps
 *
 * @param schema - The schema to copy
 * @param provenance - The provenance to stamp it with
 * @returns - The stamped copy
 */
export function stamp<S extends StrictRJSFSchema = RJSFSchema>(schema: S, provenance: Provenance<S>): S {
  return { ...schema, [PROVENANCE]: provenance };
}

/** Returns the provenance `schema` was stamped with, when it was planned in `graph` or in a graph extending it. A
 * stamp from another graph is one from an earlier root, so the schema is a call root of this one.
 *
 * @param schema - The schema to read the stamp off
 * @param graph - The graph of the current root
 * @returns - The provenance, or undefined for an unstamped schema or one stamped in another graph
 */
export function readProvenance<S extends StrictRJSFSchema = RJSFSchema>(
  schema: unknown,
  graph: SchemaGraph<S>,
): Provenance<S> | undefined {
  const provenance: unknown =
    typeof schema === 'object' && schema !== null ? Reflect.get(schema, PROVENANCE) : undefined;
  return isProvenanceOf(provenance, graph) ? provenance : undefined;
}
