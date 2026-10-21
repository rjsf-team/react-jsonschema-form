import { JUNK_OPTION_ID, PROPERTIES_KEY, REF_KEY } from '../constants.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getOptionMatchingSimpleDiscriminator from '../getOptionMatchingSimpleDiscriminator.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import guessType from '../guessType.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import getFirstMatchingOption from './getFirstMatchingOption.ts';
import buildPlan, { seedsAt } from './graph/mergePlan.ts';
import type { MergePlan, Seed, Seeding } from './graph/mergePlan.ts';
import parseSchemaGraph from './graph/parseSchemaGraph.ts';
import type { SchemaGraph } from './graph/parseSchemaGraph.ts';
import { readProvenance } from './graph/provenance.ts';
import { fieldOf, optionNode, resolveOwnRef } from './retrieveSchema.ts';

/** A junk option used to determine when the getFirstMatchingOption call really matches an option rather than returning
 * the first item
 */
export const JUNK_OPTION: StrictRJSFSchema = {
  type: 'object',
  $id: JUNK_OPTION_ID,
  properties: {
    __not_really_there__: {
      type: 'number',
    },
  },
};

/** Where a schema scoring reads is declared: the graph and the seeds of the field it is the schema of */
interface Where<S extends StrictRJSFSchema> {
  readonly graph: SchemaGraph<S>;
  readonly seeds: readonly Seed[];
}

/** A schema scoring reads, and the plan of the field it is read as, whose chains say where each subschema it holds is
 * declared. A subschema merged from declarations in several resources is an object no graph holds, so reading it as a
 * call root would resolve its `$ref`s against the root's base rather than each against its own resource.
 */
interface Scored<S extends StrictRJSFSchema> {
  readonly schema: S;
  readonly plan: () => MergePlan<S>;
}

/** Returns where `schema` is declared, as `retrieveSchema()` reads it: a schema it handed out by its stamp, and any
 * other as a call root
 */
function whereOf<S extends StrictRJSFSchema>(rootSchema: S, schema: S): Where<S> {
  return fieldOf<S>(parseSchemaGraph<S>(rootSchema), schema);
}

/** Returns the plan scoring reads the field `where` names by: its `$ref`s followed and the keywords beside each
 * conjoined with what it names, as `resolveOwnRef()` reads a `$ref`, but its `allOf`, `if` and options left as they
 * stand
 */
function scoringPlan<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  { graph, seeds }: Where<S>,
): MergePlan<S> {
  return buildPlan<S, F>({ context, graph, seeds, policy: { allOf: false, conditions: false } });
}

/** The seeds of each property of a scoring plan, by plan and key: a plan without data is made once per field, so the
 * seeds of its properties are kept with it, and a property's own plan is found again by the same seeds on every call
 */
const propertySeeds = new WeakMap<object, Map<string, readonly Seed[]>>();

/** Returns where the property `key`, which the field planned by `parentPlan` holds as `value`, is declared: by its
 * stamp, for a subschema `retrieveSchema()` handed out, or else where the field's declarations hold it
 */
function propertyWhere<S extends StrictRJSFSchema>(
  rootSchema: S,
  parentPlan: () => MergePlan<S>,
  key: string,
  value: S,
): Where<S> {
  if (readProvenance<S>(value, parseSchemaGraph<S>(rootSchema)) === undefined) {
    const plan = parentPlan();
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
  return whereOf<S>(rootSchema, value);
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
 * @param scored - The schema of the property, and where it is declared
 * @param formValue - The form data the property holds
 * @returns - The property's score
 */
function propertyScore<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, rootSchema: S, scored: Scored<S>, formValue: unknown): number {
  const { schema: value } = scored;
  if (typeof value[REF_KEY] === 'string') {
    if (formValue == null) {
      return 0;
    }
    const plan = scored.plan();
    return propertyScore<T, S, F>(context, rootSchema, { schema: plan.schema, plan: () => plan }, formValue);
  }
  const xxxOfKey = getXxxOfKey<S>(value);
  if (xxxOfKey && formValue != null) {
    const discriminator = getDiscriminatorFieldFromSchema<S>(value);
    const options = getByPath<S[]>(value, xxxOfKey);
    return closestOption<unknown, S, F>(
      context,
      rootSchema,
      formValue,
      options,
      listedAt<S>(scored.plan, xxxOfKey, options),
      -1,
      discriminator,
    );
  }
  if (value.type === 'object') {
    // If the structure is matching then give it a little boost in score
    const structureBoost = typeof formValue === 'object' && formValue !== null ? 1 : 0;
    return structureBoost + scopeScore<T, S, F>(context, rootSchema, scored, formValue);
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
  return scopeScore<T, S, F>(
    context,
    rootSchema,
    { schema, plan: () => scoringPlan<S, F>(context, whereOf<S>(rootSchema, schema)) },
    formData,
  );
}

/** Returns the score `calculateIndexScore()` describes of the scored schema, each of its properties read where the
 * field it is the schema of declares it
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param scored - The schema for which the score is being calculated, and where it is declared
 * @param formData - The form data associated with the schema
 * @returns - The score
 */
function scopeScore<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  scored: Scored<S>,
  formData: unknown,
): number {
  const { schema } = scored;
  if (isObject(schema.properties)) {
    let plan: MergePlan<S> | undefined;
    const parentPlan = () => {
      plan ??= scored.plan();
      return plan;
    };
    return Object.entries(schema.properties).reduce(
      // An own-property read, so a schema property legally named `toString`, `constructor` or `valueOf` reads the
      // data's own value rather than the one every object inherits, which would never look like missing data
      (score, [key, value]) =>
        isSchemaObject<S>(value)
          ? score +
            propertyScore<T, S, F>(
              context,
              rootSchema,
              {
                schema: value,
                plan: () => scoringPlan<S, F>(context, propertyWhere<S>(rootSchema, parentPlan, key, value)),
              },
              getByPath<T>(formData, key),
            )
          : score,
      0,
    );
  }
  return typeof schema.type === 'string' && schema.type === guessType(formData) ? 1 : 0;
}

/** Determines which of the given `options` provided most closely matches the `formData`. Using
 * `getFirstMatchingOption()` to match two schemas that differ only by the readOnly, default or const value of a field
 * based on the `formData` and returns 0 when there is no match. Rather than passing in all the `options` at once to
 * this utility, instead an array of valid option indexes is created by iterating over the list of options, call
 * `getFirstMatchingOptions` with a list of one junk option and one good option, seeing if the good option is considered
 * matched.
 *
 * Once the list of valid indexes is created, if there is only one valid index, just return it. Otherwise, if there are
 * no valid indexes, then fill the valid indexes array with the indexes of all the options. Next, the index of the
 * option with the highest score is determined by iterating over the list of valid options, calling
 * `calculateIndexScore()` on each, comparing it against the current best score, and returning the index of the one that
 * eventually has the best score.
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
  return closestOption<T, S, F>(
    context,
    rootSchema,
    formData,
    options,
    (index) => whereOf<S>(rootSchema, options[index]),
    selectedOption,
    discriminatorField,
  );
}

/** Returns the index of the option of `options` closest to `formData`, as `getClosestMatchingOption()` describes, each
 * option scored where `declaredAt` says it is declared: a caller that matches each option with a schema made from it,
 * such as `omitExtraData()` relaxing an option's `additionalProperties`, scores it where the option it was made from
 * sits, and one offered by a list a merge rebuilt, where the merge adopted it.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param formData - The form data associated with the schema
 * @param options - The list of options that can be selected from, as they are matched
 * @param declaredAt - Returns where the option at an index is declared
 * @param selectedOption - The index of the currently selected option, -1 for none
 * @param [discriminatorField] - The name of the property the options are told apart by
 * @returns - The index of the closest option, or the `selectedOption` if no option is closer
 */
export function closestOption<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  formData: T | undefined,
  options: S[],
  declaredAt: (index: number) => Where<S>,
  selectedOption: number,
  discriminatorField?: string,
): number {
  const resolvedOptions = options.map((option) => resolveOwnRef<S>(option, rootSchema, context.customMergeAllOf));

  const simpleDiscriminatorMatch = getOptionMatchingSimpleDiscriminator(formData, options, discriminatorField);
  if (typeof simpleDiscriminatorMatch === 'number') {
    return simpleDiscriminatorMatch;
  }

  const junk = [JUNK_OPTION].filter((entry): entry is S => isSchemaObject<S>(entry));
  // Reduce the array of options down to a list of the indexes that are considered matching options
  const allValidIndexes = resolvedOptions.reduce((validList: number[], option, index: number) => {
    const testOptions: S[] = [...junk, option];
    const match = getFirstMatchingOption<T, S, F>(context, formData, testOptions, rootSchema, discriminatorField);
    // The match is the real option, so add its index to list of valid indexes
    if (match === 1) {
      validList.push(index);
    }
    return validList;
  }, []);

  // There is only one valid index, so return it!
  if (allValidIndexes.length === 1) {
    return allValidIndexes[0];
  }
  if (!allValidIndexes.length) {
    // No indexes were valid, so we'll score all the options, add all the indexes
    allValidIndexes.push(...resolvedOptions.keys());
  }
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
      const score = isSchemaObject<S>(option)
        ? scopeScore<T, S, F>(
            context,
            rootSchema,
            { schema: option, plan: () => scoringPlan<S, F>(context, declaredAt(index)) },
            formData,
          )
        : 0;
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
