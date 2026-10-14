import type { RJSFSchema, StrictRJSFSchema } from '../../types.ts';
import type { MergePlan, Seed } from './mergePlan.ts';
import type { NodeId, SchemaGraph } from './parseSchemaGraph.ts';
import { extendChain } from './provenance.ts';
import type { GuardChain } from './provenance.ts';

/** How a field is reached from its parent */
export type ContainmentEdge = 'root' | 'property' | 'item' | 'tupleItem' | 'additionalKey' | 'patternKey';

/** Which view the rule decides for: the rendered form, or the defaults `getDefaultFormState()` fills in */
export type RuleView = 'render' | 'defaults';

/** Which check collapsed a field */
export type CollapseReason = 'firstEntered' | 'count2' | 'guard';

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
 * It fires when that target is already on the ref path in effect where it is entered.
 *
 * @param graph - The graph the plan is of
 * @param plan - The field's plan
 * @returns - Whether the check fires
 */
export function firstEnteredRefHit<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  plan: MergePlan<S>,
): boolean {
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

/** Returns why a field collapses, if it does. The call root never does. The ref-path checks apply to every edge in
 * the defaults view, where `computeDefaults()` stops at any `$ref` already followed, and only to object properties in
 * render, the one render edge the data does not bound. The set-equality guard applies everywhere except to a field
 * the data drives in render; it is a safety net, not what makes the rule terminate.
 *
 * @param graph - The graph the plan is of
 * @param plan - The field's plan
 * @param position - Where the field sits
 * @returns - The check that collapses the field, or undefined when none does
 */
export function collapseReason<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  plan: MergePlan<S>,
  position: FieldPosition,
): CollapseReason | undefined {
  const { edge, view, dataDriven = false, chain } = position;
  if (edge === 'root') {
    return undefined;
  }
  if (view === 'defaults' || edge === 'property') {
    if (firstEnteredRefHit(graph, plan)) {
      return 'firstEntered';
    }
    if (count2Hit(plan)) {
      return 'count2';
    }
  }
  if (view === 'render' && dataDriven) {
    return undefined;
  }
  return chain?.has(plan.setKey) ? 'guard' : undefined;
}

/** Returns `seeds` with their ref paths restarted, so that entering a seed's own `$ref` gives `[target]`: for the
 * expansion of a collapsed field (I2), for the option a field selects, and in render for a key the data holds
 *
 * @param seeds - The seeds to restart
 * @returns - The restarted seeds
 */
export function restartSeeds(seeds: readonly Seed[]): Seed[] {
  return seeds.map(({ node }) => ({ node, refPath: [] }));
}

/** Returns the seeds of the option a field selects: the field's own, then the option, whose ref path restarts since
 * `MultiSchemaField` renders the option as a schema of its own
 *
 * @param seeds - The field's seeds
 * @param option - The selected option's node
 * @returns - The seeds of the field with the option selected
 */
export function optionSeeds(seeds: readonly Seed[], option: NodeId): Seed[] {
  return [...seeds, { node: option, refPath: [] }];
}

/** A child as its parent hands it on: its seeds and the guard chain it is checked against */
export interface ChildField {
  readonly seeds: readonly Seed[];
  readonly chain?: GuardChain;
  readonly dataDriven: boolean;
}

/** Returns a child of the field `parent` plans: in render, a child the data drives restarts the guard chain, and a key
 * the data holds also restarts its ref path, as `stubExistingAdditionalProperties()` gives each such key a fresh
 * `$ref`; array rows keep their ref path. Every other child, and every child in the defaults view, extends the chain
 * with the parent's set.
 *
 * @param graph - The graph the plans are of
 * @param parent - The parent's plan and chain
 * @param child - The child's seeds and edge, and whether the data holds it
 * @param view - The view the rule decides for
 * @returns - The child's seeds and chain, and whether the data drives it
 */
export function childField<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  parent: { readonly plan: MergePlan<S>; readonly chain?: GuardChain },
  child: { readonly seeds: readonly Seed[]; readonly edge: ContainmentEdge; readonly inData: boolean },
  view: RuleView,
): ChildField {
  const dataDriven = view === 'render' && child.edge !== 'property' && child.inData;
  if (!dataDriven) {
    return { seeds: child.seeds, chain: extendChain(graph, parent.chain, parent.plan.setKey), dataDriven };
  }
  const keyed = child.edge === 'additionalKey' || child.edge === 'patternKey';
  return { seeds: keyed ? restartSeeds(child.seeds) : child.seeds, dataDriven };
}

/** What `settleField()` decided: the field's plan with the seeds and chain it was planned from, or the collapse */
export type SettledField<S extends StrictRJSFSchema = RJSFSchema> =
  | {
      readonly collapsed: false;
      readonly plan: MergePlan<S>;
      readonly seeds: readonly Seed[];
      readonly chain?: GuardChain;
      /** Whether the field is the expansion of a collapse */
      readonly expanded: boolean;
    }
  | { readonly collapsed: true; readonly plan: MergePlan<S>; readonly reason: CollapseReason };

/** Plans a field and applies the rule. A collapsed field that may expand is planned again from its seeds restarted,
 * with its guard chain restarted at it (I2): its descendants collapse again at their next recurrence, one level per
 * expansion. Only the recursive edge is cut: the collapsed plan still holds the field's own keywords.
 *
 * @param graph - The graph the field is in
 * @param field - The field's seeds and chain, and whether the data drives it
 * @param position - Where the field sits, less its chain
 * @param mayExpand - Whether a collapse expands: an Expand click in render, the fold's one expansion in defaults
 * @param plan - Plans the field from its seeds
 * @returns - The field's plan and chain, or its collapse
 */
export function settleField<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  field: ChildField,
  position: Omit<FieldPosition, 'chain' | 'dataDriven'>,
  mayExpand: boolean,
  plan: (seeds: readonly Seed[]) => MergePlan<S>,
): SettledField<S> {
  const planned = plan(field.seeds);
  const reason = collapseReason(graph, planned, { ...position, dataDriven: field.dataDriven, chain: field.chain });
  if (reason === undefined) {
    return { collapsed: false, plan: planned, seeds: field.seeds, chain: field.chain, expanded: false };
  }
  if (!mayExpand) {
    return { collapsed: true, plan: planned, reason };
  }
  const seeds = restartSeeds(field.seeds);
  return { collapsed: false, plan: plan(seeds), seeds, expanded: true };
}
