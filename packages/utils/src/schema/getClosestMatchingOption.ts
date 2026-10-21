import { ALL_OF_KEY, PROPERTIES_KEY, REF_KEY } from '../constants.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import guessType from '../guessType.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import { optionMatches, optionNodeOf, simpleDiscriminatorMatch } from './getFirstMatchingOption.ts';
import { isHandedOut } from './graph/handedOut.ts';
import KeyedMemo from './graph/keyedMemo.ts';
import buildPlan, { seedsAt } from './graph/mergePlan.ts';
import type { MergePlan, Seed, Seeding } from './graph/mergePlan.ts';
import parseSchemaGraph from './graph/parseSchemaGraph.ts';
import type { NodeId, SchemaGraph } from './graph/parseSchemaGraph.ts';
import { readProvenance } from './graph/provenance.ts';
import { fieldOf, optionNode } from './retrieveSchema.ts';

/** Where a schema scoring reads is declared: the graph and the seeds of the field it is the schema of */
interface Where<S extends StrictRJSFSchema> {
  readonly graph: SchemaGraph<S>;
  readonly seeds: readonly Seed[];
}

/** A schema scoring reads, and the plan it is the merged schema of, whose chains say where each subschema it holds is
 * declared. A subschema merged from declarations in several resources is an object no graph holds, so reading it as a
 * call root would resolve its `$ref`s against the root's base rather than each against its own resource. A schema
 * `retrieveSchema()` handed out has no plan: each subschema it holds carries a stamp saying where it is declared.
 */
interface Scored<S extends StrictRJSFSchema> {
  readonly schema: S;
  readonly plan?: MergePlan<S>;
}

/** Returns where `schema` is declared, as `retrieveSchema()` reads it: a schema it handed out by its stamp, and any
 * other as a call root
 */
function whereOf<S extends StrictRJSFSchema>(schema: S, rootSchema: S): Where<S> {
  const { graph, seeds } = fieldOf<S>(parseSchemaGraph<S>(rootSchema), schema);
  return { graph, seeds };
}

/** Returns the plan scoring reads the field `where` names by: its `$ref`s followed and the keywords beside them
 * conjoined, as `resolveOwnRef()` reads them, but its `allOf`, `if` and options left as they stand, without data
 */
function planAt<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  where: Where<S>,
): MergePlan<S> {
  return buildPlan<S, F>({
    context,
    graph: where.graph,
    seeds: where.seeds,
    policy: { allOf: false, conditions: false },
  });
}

function scoredAt<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  where: Where<S>,
): Scored<S> {
  const plan = planAt<S, F>(context, where);
  return { schema: plan.schema, plan };
}

/** The seeds of each property of a scoring plan, by plan and key: a plan without data is made once per field, so the
 * seeds of its properties are kept with it, and a property's own plan is found again by the same seeds on every call
 */
const propertySeeds = new WeakMap<object, Map<string, readonly Seed[]>>();

/** Returns where the property `key` that a scored schema holds as `value` is declared: by its stamp, for a subschema
 * `retrieveSchema()` handed out, or else where the declarations of the parent's plan declare it
 */
function propertyWhere<S extends StrictRJSFSchema>(parent: Scored<S>, rootSchema: S, value: S, key: string): Where<S> {
  const { plan } = parent;
  if (plan !== undefined && readProvenance<S>(value, parseSchemaGraph<S>(rootSchema)) === undefined) {
    let byKey = propertySeeds.get(plan);
    if (byKey === undefined) {
      byKey = new Map();
      propertySeeds.set(plan, byKey);
    }
    let seeds = byKey.get(key);
    if (seeds === undefined) {
      seeds = seedsAt(plan, PROPERTIES_KEY, key);
      byKey.set(key, seeds);
    }
    if (seeds.length > 0) {
      return { graph: plan.graph, seeds };
    }
  }
  return whereOf<S>(value, rootSchema);
}

/** Returns where the option of `options`, the list `keyword` holds in the field `seeding` describes, at an index is
 * declared: where a declaration of the field holds it, or, for one a merge of lists rebuilt, where `optionNode()`
 * adopted it
 *
 * @param seeding - Returns the graph and chains of the field offering the options
 * @param keyword - The keyword holding the list
 * @param options - The options
 * @returns - Where the option at an index is declared
 */
export function listedAt<S extends StrictRJSFSchema>(
  seeding: () => Seeding<S>,
  keyword: string,
  options: readonly S[],
): (index: number) => Where<S> {
  return (index) => {
    const { graph, node } = optionNode<S>(seeding(), keyword, index, options[index]);
    return { graph, seeds: [{ node, refPath: [] }] };
  };
}

/** Returns the score of one property's `formValue` against the `value` schema describing it, as
 * `calculateIndexScore()` adds it up:
 * - If the `value` is a `$ref` and the formValue is neither `undefined` nor `null`, it is scored as the definition it
 *   names, with the keywords beside it, as though written in its place. A recursive `$ref` names a definition holding
 *   that same `$ref` one level down, so only the form data, consumed a key at a time, bounds the descent.
 * - If the `value` contains an `anyOf` or `oneOf` and the formValue is neither `undefined` nor `null`, then score based
 *   on the index returned from calling `getClosestMatchingOption()` of that `anyOf`/`oneOf`.
 * - If the type of the `value` is 'object', `calculateIndexScore()` is called recursively with the formValue and the
 *   `value` itself as the sub-schema, plus one when the formValue is an object too.
 * - If the type of the `value` matches the guessed-type of the `formValue`, the score is 1, UNLESS the value has a
 *   truthy `default` or a `const`. In those case, if the `default` or `const` and the `formValue` match, the score is
 *   incremented by another 1 otherwise it is decremented by 1. A missing formValue is not compared to a `const`.
 *
 * Each `$ref` is resolved, and each subschema of the `value` read, where the declaration holding it sits.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param scored - The schema of the property, and its plan where it has been read from one
 * @param where - Returns where the property is declared
 * @param formValue - The form data the property holds
 * @returns - The property's score
 */
function propertyScore<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, rootSchema: S, scored: Scored<S>, where: () => Where<S>, formValue: unknown): number {
  const value = scored.schema;
  if (typeof value[REF_KEY] === 'string') {
    if (formValue == null) {
      return 0;
    }
    return propertyScore<T, S, F>(context, rootSchema, scoredAt<S, F>(context, where()), where, formValue);
  }
  const xxxOfKey = getXxxOfKey<S>(value);
  if (xxxOfKey && formValue != null) {
    const discriminator = getDiscriminatorFieldFromSchema<S>(value);
    const options = getByPath<S[]>(value, xxxOfKey);
    return closestOption<S, F>(
      context,
      rootSchema,
      formValue,
      options,
      -1,
      false,
      discriminator,
      listedAt<S>(() => scored.plan ?? planAt<S, F>(context, where()), xxxOfKey, options),
    );
  }
  if (value.type === 'object') {
    // If the structure is matching then give it a little boost in score
    const structureBoost = typeof formValue === 'object' && formValue !== null ? 1 : 0;
    const planned = scored.plan ?? planAt<S, F>(context, where());
    return (
      structureBoost + scopeScore<T, S, F>(context, rootSchema, { schema: value, plan: planned }, formValue, new Set())
    );
  }
  if (value.type !== guessType(formValue)) {
    return 0;
  }
  if (value.default) {
    // Score a value that matches the default higher and any other value lower. Only a truthy default is
    // scored: the check doesn't require `readOnly`, so scoring `default: false` would penalize a user who ticks
    // the box, the same way a truthy default already penalizes one who clears it
    return formValue === value.default ? 2 : 0;
  }
  if (value.const !== undefined && formValue !== undefined) {
    // If the schema contains a const value score the value that matches the const higher and any non-matching
    // value lower. A missing value is skipped: `guessType(undefined)` is 'null', so it reaches here for a
    // `const: null` property and would otherwise be penalized for not being `null`
    return formValue === value.const ? 2 : 0;
  }
  // TODO eventually, deal with enums/arrays
  return 1;
}

/** Recursive function that calculates the score of a `formData` against the given `schema`. The computation is fairly
 * simple. Initially the total score is 0. When `schema.properties` object exists, then each property's form value,
 * read from `formData` with its `key`, is scored against the property's schema, as `propertyScore()` describes, and
 * the scores are added up. A schema without `properties` scores 1 when its `type` is the guessed-type of `formData`.
 * The score of each `allOf` entry, read through its `$ref`, is added to the schema's own, so options sharing a base
 * through a `$ref` beside their own keywords or through an `allOf` are told apart by the properties each adds. An
 * entry that is a `$ref` scores 0 where the `formData` is `undefined` or `null`, as a property's `$ref` does. Where an
 * entry reaches a reference that resolves to nothing or loops, through its `$ref`, its `allOf` entries or its
 * properties, the form has nothing to merge the `allOf` with, so none of its entries adds to the score.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param schema - The schema for which the score is being calculated
 * @param formData - The form data associated with the schema, used to calculate the score
 * @returns - The score a schema against the formData
 */
export function calculateIndexScore<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, rootSchema: S, schema?: S, formData?: unknown): number {
  if (!schema) {
    return 0;
  }
  return scopeScore<T, S, F>(context, rootSchema, scoredOption<S, F>(context, schema, rootSchema), formData, new Set());
}

/** Returns the `allOf` entries of a scored schema, each with where it is declared: those of the chains of its plan,
 * less the `allOf` a `$ref` with keywords beside it reads as, which the plan's schema holds merged, or those of a
 * schema `retrieveSchema()` handed out, each read where it sits
 */
function allOfEntries<S extends StrictRJSFSchema>(scored: Scored<S>, rootSchema: S): [S, Where<S>][] {
  const { plan, schema } = scored;
  if (plan === undefined) {
    const entries: unknown = schema[ALL_OF_KEY];
    return (Array.isArray(entries) ? entries : [])
      .filter(isSchemaObject<S>)
      .map((entry): [S, Where<S>] => [entry, whereOf<S>(entry, rootSchema)]);
  }
  const providers = new Set<NodeId>();
  return plan.chains.flatMap((chain): [S, Where<S>][] => {
    const provider = chain.get(ALL_OF_KEY);
    if (provider === undefined || provider.node.conjunctionOf !== undefined || providers.has(provider.node.id)) {
      return [];
    }
    providers.add(provider.node.id);
    return plan.graph.subschemas(provider.node.id, ALL_OF_KEY).flatMap(([, id]): [S, Where<S>][] => {
      const node = plan.graph.node(id);
      return node.kind === 'schema'
        ? [[node.raw, { graph: plan.graph, seeds: [{ node: id, refPath: provider.refPath }] }]]
        : [];
    });
  });
}

const brokenReach = new KeyedMemo<boolean>();

/** Returns whether the subschema at `node` reaches a `$ref` that resolves to nothing or loops where a merge of it would:
 * through its `$ref` and its `allOf` entries, at any depth, and through its properties, one level down from a subschema
 * it reaches that way, whose own `$ref` and `allOf` a merge resolves too. A property of a property is merged only once
 * the form renders it, so a broken `$ref` there leaves the option to be scored. Walked with an explicit stack, since a
 * chain of definitions can be deeper than the call stack allows
 *
 * @param graph - The graph the node is in
 * @param node - The subschema
 * @returns - Whether a reference a merge of it resolves names nothing
 */
function reachesBrokenRef<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, node: NodeId): boolean {
  return brokenReach.get([graph, node], () => {
    // A subschema reached as a property is walked again where it is reached otherwise, to enter its properties then
    const seen = [new Set<NodeId>(), new Set<NodeId>()];
    const pending: [NodeId, boolean][] = [[node, false]];
    for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
      const [id, isProperty] = next;
      const visited = seen[isProperty ? 1 : 0];
      const found = visited.has(id) ? undefined : graph.node(id);
      visited.add(id);
      if (found?.kind === 'invalid') {
        return true;
      }
      if (found?.kind === 'schema') {
        if (found.ref !== undefined) {
          pending.push([found.ref, isProperty]);
        }
        graph.subschemas(id, ALL_OF_KEY).forEach(([, child]) => pending.push([child, isProperty]));
        if (!isProperty) {
          graph.subschemas(id, PROPERTIES_KEY).forEach(([, child]) => pending.push([child, true]));
        }
      }
    }
    return false;
  });
}

/** Returns the score `calculateIndexScore()` describes, counting a definition at this level of the data once however
 * many `allOf` entries name it and whatever the plan of the scope merged already, as a field's plan merges `X AND X` as
 * `X`: a base two entries share adds its properties once, and a definition whose `allOf` leads back to itself is not
 * scored again. Each property and entry is read where it is declared.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param scored - The schema for which the score is being calculated, and its plan where it was read from one
 * @param formData - The form data associated with the schema
 * @param counted - The definitions already scored at this level of the data, which this adds to
 * @returns - The score
 */
function scopeScore<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  scored: Scored<S>,
  formData: unknown,
  counted: Set<object>,
): number {
  const { schema, plan } = scored;
  if (plan !== undefined) {
    for (const id of plan.set) {
      const node = plan.graph.node(id);
      if (node.kind === 'schema') {
        counted.add(node.raw);
      }
    }
  }
  const own = isObject(schema.properties)
    ? Object.entries(schema.properties).reduce(
        // An own-property read, so a schema property legally named `toString`, `constructor` or `valueOf` reads the
        // data's own value rather than the one every object inherits, which would never look like missing data
        (score, [key, value]) =>
          isSchemaObject<S>(value)
            ? score +
              propertyScore<T, S, F>(
                context,
                rootSchema,
                { schema: value },
                () => propertyWhere<S>(scored, rootSchema, value, key),
                getByPath<T>(formData, key),
              )
            : score,
        0,
      )
    : Number(typeof schema.type === 'string' && schema.type === guessType(formData));
  const entries = allOfEntries<S>(scored, rootSchema);
  // A reference naming nothing says nothing about the data: whatever resolves the option to render it reports the broken
  // reference on its own
  if (entries.some(([, where]) => reachesBrokenRef<S>(where.graph, where.seeds[0].node))) {
    return own;
  }
  return entries.reduce((total, [entry, where]) => {
    // An entry's `$ref` is followed only for data to score, as a property's own `$ref` is: a property typed `object` is
    // scored from a fresh plan for its value, so for a recursive definition reached through the entry, only the data,
    // consumed a key at a time, bounds the descent
    if (typeof entry[REF_KEY] === 'string' && formData == null) {
      return total;
    }
    const declaring = where.graph.node(where.seeds[0].node);
    const target =
      declaring.kind === 'schema' && declaring.ref !== undefined ? where.graph.node(declaring.ref) : undefined;
    if (target?.kind === 'schema') {
      if (counted.has(target.raw)) {
        return total;
      }
      counted.add(target.raw);
    }
    return total + scopeScore<T, S, F>(context, rootSchema, scoredAt<S, F>(context, where), formData, counted);
  }, own);
}

/** Returns an option as scoring reads it: a schema `retrieveSchema()` handed out as it stands, and any other through
 * the plan of the subschema it stands for, where `where` says or else where `retrieveSchema()` would read it
 */
function scoredOption<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  option: S,
  rootSchema: S,
  where?: Where<S>,
): Scored<S> {
  if (isHandedOut(option) && typeof option[REF_KEY] !== 'string') {
    return { schema: option };
  }
  return scoredAt<S, F>(context, where ?? whereOf<S>(option, rootSchema));
}

/** Returns the index of the option of `options` closest to `formData`, as `getClosestMatchingOption()` describes,
 * with each option matched as `optionMatches()` matches it under `relax`, and scored where `declaredAt` says it is
 * declared, such as where the merge rebuilding its list adopted it, or else where `retrieveSchema()` would read it
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param formData - The form data associated with the schema
 * @param options - The list of options that can be selected from, boolean ones included
 * @param selectedOption - The index of the currently selected option, -1 for none
 * @param relax - Whether an option's `additionalProperties: false` is relaxed for matching
 * @param [discriminatorField] - The name of the property the options are told apart by
 * @param [declaredAt] - Returns where the option at an index is declared
 * @returns - The index of the closest option, or the `selectedOption` if no option is closer
 */
export function closestOption<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  formData: unknown,
  options: readonly unknown[],
  selectedOption: number,
  relax: boolean,
  discriminatorField?: string,
  declaredAt?: (index: number) => Where<S>,
): number {
  const optionNodes = options.map((option) => optionNodeOf<S>(option, rootSchema));
  const simpleMatch = simpleDiscriminatorMatch(optionNodes, formData, discriminatorField);
  if (simpleMatch !== undefined) {
    return simpleMatch;
  }
  // Reduce the array of options down to a list of the indexes that are considered matching options
  const allValidIndexes =
    formData === undefined
      ? []
      : optionNodes.flatMap((option, index) =>
          optionMatches<S, F>(context, formData, option, relax, discriminatorField) ? [index] : [],
        );

  // There is only one valid index, so return it!
  if (allValidIndexes.length === 1) {
    return allValidIndexes[0];
  }
  if (!allValidIndexes.length) {
    // No indexes were valid, so we'll score all the options, add all the indexes
    allValidIndexes.push(...options.keys());
  }
  const resolvedOptions = options.map((option, index) =>
    isSchemaObject<S>(option) ? scoredOption<S, F>(context, option, rootSchema, declaredAt?.(index)) : undefined,
  );
  interface BestType {
    bestIndex: number;
    bestScore: number;
  }
  const scoreCount = new Set<number>();
  // Score all the options in the list of valid indexes and return the index with the best score
  const { bestIndex }: BestType = allValidIndexes.reduce(
    (scoreData: BestType, index: number) => {
      const { bestScore } = scoreData;
      const option = resolvedOptions[index];
      const score = option === undefined ? 0 : scopeScore(context, rootSchema, option, formData, new Set());
      scoreCount.add(score);
      if (score > bestScore) {
        return { bestIndex: index, bestScore: score };
      }
      return scoreData;
    },
    { bestIndex: selectedOption, bestScore: 0 },
  );
  // if all scores are the same go with selectedOption
  if (scoreCount.size === 1 && selectedOption >= 0) {
    return selectedOption;
  }

  return bestIndex;
}

/** Determines which of the given `options` provided most closely matches the `formData`. Returns the index of the one
 * option that matches the data, as `getFirstMatchingOption()` matches an option, when exactly one does.
 *
 * Otherwise the options that match, or all of them when none does, are scored by calling `calculateIndexScore()` on
 * each, and the index of the one with the best score is returned. The `selectedOption` is kept when no option scores
 * above it or every option scores the same.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param formData - The form data associated with the schema
 * @param options - The list of options that can be selected from
 * @param [selectedOption=-1] - The index of the currently selected option, defaulted to -1 if not specified
 * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
 *          determine which option is selected
 * @returns - The index of the option that is the closest match to the `formData` or the `selectedOption` if no match
 */
export default function getClosestMatchingOption<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  formData: T | undefined,
  options: S[],
  selectedOption = -1,
  discriminatorField?: string,
): number {
  return closestOption<S, F>(context, rootSchema, formData, options, selectedOption, false, discriminatorField);
}
