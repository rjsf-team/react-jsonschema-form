import type { RJSFSchema, StrictRJSFSchema } from '../../types.ts';
import type { MergePlan, Seed } from './mergePlan.ts';
import type { NodeId, SchemaGraph } from './parseSchemaGraph.ts';
import { extendChain } from './provenance.ts';
import type { GuardChain } from './provenance.ts';

/** How a field is reached from its parent */
export type ContainmentEdge = 'root' | 'property' | 'item' | 'tupleItem' | 'additionalKey' | 'patternKey';

/** Which view the rule decides for: the rendered form, or the defaults `getDefaultFormState()` fills in */
export type RuleView = 'render' | 'defaults';

/** Where a field sits, which decides which checks apply to it */
export interface FieldPosition {
  readonly edge: ContainmentEdge;
  readonly view: RuleView;
  /** Whether, in render, the field exists because the data has it: an array row, or an additional or pattern key the
   * data holds. The data bounds those, so the guard leaves them alone.
   */
  readonly dataDriven?: boolean;
  /** The plan sets of the field's ancestors since the chain last restarted */
  readonly chain?: GuardChain;
}

/** Returns the `$ref` targets a containment node enters directly: its own `$ref`'s, and on through each target that is
 * itself a pure `$ref` alias
 *
 * @param graph - The graph the node is in
 * @param node - The containment node
 * @returns - The targets, in the order they are entered
 */
export function ownRefTargets<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>, node: NodeId): NodeId[] {
  const targets: NodeId[] = [];
  // A chain of aliases that loops resolves to an `InvalidNode`, which ends the walk
  for (let current = graph.node(node); current.kind === 'schema' && current.ref !== undefined;) {
    targets.push(current.ref);
    const target = graph.node(current.ref);
    if (target.kind !== 'schema' || !target.pureRef) {
      break;
    }
    current = target;
  }
  return targets;
}

/** The first-entered check: the field's first-entered `$ref` is its containment nodes' own (each seed against its own
 * ref path, every alias target checked), or, when no seed has one, the first `$ref` its plan enters through any edge.
 * It fires when that target is already on the ref path in effect where it is entered. A selected option is entered
 * the way a seed is: its own `$ref` is checked against the ref path it was offered under, so a recursion through an
 * option stops at the same depth whether the option list is written in place or behind a `$ref` of the field's own.
 *
 * @param graph - The graph the plan is of
 * @param plan - The field's plan
 * @returns - Whether the check fires
 */
export function firstEnteredRefHit<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  plan: MergePlan<S>,
): boolean {
  const optionReenters = plan.entries.some(
    ({ node, edge, refPath }) =>
      edge === 'option' && ownRefTargets(graph, node).some((target) => refPath.includes(target)),
  );
  if (optionReenters) {
    return true;
  }
  const own = plan.seeds.map((seed) => ({ seed, targets: ownRefTargets(graph, seed.node) }));
  if (own.some(({ seed, targets }) => targets.some((target) => seed.refPath.includes(target)))) {
    return true;
  }
  if (own.some(({ targets }) => targets.length > 0)) {
    return false;
  }
  return plan.entries
    .filter(({ edge }) => edge === 'ref')
    .slice(0, 1)
    .some(({ node, refPath }) => refPath.slice(0, -1).includes(node));
}

/** The count-2 check: some `$ref` the plan enters, through any edge, enters a target that already occurs twice or more
 * on the ref path in effect where it is entered. It bounds how deep a chain of fields can get, since a ref path holds
 * finitely many targets and no target can reach a third occurrence.
 *
 * @param plan - The field's plan
 * @returns - Whether the check fires
 */
export function count2Hit<S extends StrictRJSFSchema = RJSFSchema>(plan: MergePlan<S>): boolean {
  return plan.entries.some(
    ({ node, edge, refPath }) => edge === 'ref' && refPath.slice(0, -1).filter((target) => target === node).length >= 2,
  );
}

/** Returns whether a field collapses. The call root never does. The ref-path checks apply to every edge in the defaults
 * view, where `computeDefaults()` stops at any `$ref` already followed, and only to object properties in render, the
 * one render edge the data does not bound. The set-equality guard applies where a chain is given, which only render
 * gives, and never to a field the data drives there; it is a safety net, not what makes the rule terminate.
 *
 * @param graph - The graph the plan is of
 * @param plan - The field's plan
 * @param position - Where the field sits
 * @returns - Whether one of the checks collapses the field
 */
export function collapses<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  plan: MergePlan<S>,
  position: FieldPosition,
): boolean {
  const { edge, view, dataDriven = false, chain } = position;
  if (edge === 'root') {
    return false;
  }
  if ((view === 'defaults' || edge === 'property') && (firstEnteredRefHit(graph, plan) || count2Hit(plan))) {
    return true;
  }
  return !dataDriven && chain?.has(plan.setKey) === true;
}

/** Returns `seeds` with their ref paths restarted, so that entering a seed's own `$ref` gives `[target]`: for the
 * expansion of a collapsed field, and in render for a row or key the data holds
 *
 * @param seeds - The seeds to restart
 * @returns - The restarted seeds
 */
export function restartSeeds(seeds: readonly Seed[]): Seed[] {
  return seeds.map(({ node }) => ({ node, refPath: [] }));
}

/** A child as its parent hands it on: its seeds and the guard chain it is checked against */
export interface ChildField {
  readonly seeds: readonly Seed[];
  readonly chain?: GuardChain;
  readonly dataDriven: boolean;
}

/** Returns a child of the field `parent` plans in render: a child the data drives, an array row or a key the data
 * holds, restarts both the guard chain and its ref path. The data bounds those, and a row keeping its ref path would
 * collapse a property that re-enters a list or wrapper definition the row's own array came through, hiding the rows the
 * data has there. Every other child extends the chain with the parent's set.
 *
 * @param graph - The graph the plans are of
 * @param parent - The parent's plan and chain
 * @param child - The child's seeds and edge, and whether the data holds it
 * @returns - The child's seeds and chain, and whether the data drives it
 */
export function childField<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  parent: { readonly plan: MergePlan<S>; readonly chain?: GuardChain },
  child: { readonly seeds: readonly Seed[]; readonly edge: ContainmentEdge; readonly inData: boolean },
): ChildField {
  const dataDriven = child.edge !== 'property' && child.inData;
  if (!dataDriven) {
    return { seeds: child.seeds, chain: extendChain(graph, parent.chain, parent.plan.setKey), dataDriven };
  }
  return { seeds: restartSeeds(child.seeds), dataDriven };
}
