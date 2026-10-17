import { REF_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import guessType from '../guessType.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import isPlainObject from '../isPlainObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import { optionMatches, optionNodeOf, simpleDiscriminatorMatch } from './getFirstMatchingOption.ts';
import type { OptionNode } from './getFirstMatchingOption.ts';
import KeyedMemo from './graph/keyedMemo.ts';
import { resolveOwnRef } from './retrieveSchema.ts';

/** Returns the score of one property's `formValue` against the `value` schema describing it, as
 * `calculateIndexScore()` adds it up:
 * - If the `value` is a `$ref` and the formValue is neither `undefined` nor `null`, it is scored as the definition it
 *   names, with the keywords beside it, as though written in its place. A recursive `$ref` names a definition holding
 *   that same `$ref` one level down, so only the form data, consumed a key at a time, bounds the descent.
 * - If the `value` contains an `anyOf` or `oneOf` and the formValue is neither `undefined` nor `null`, it scores what the
 *   option `getClosestMatchingOption()` picks among them scores.
 * - If the type of the `value` is 'object', `calculateIndexScore()` is called recursively with the formValue and the
 *   `value` itself as the sub-schema, plus one when the formValue is an object too.
 * - If the type of the `value` matches the guessed-type of the `formValue`, the score is 1, UNLESS the value has a
 *   truthy `default` or a `const`. In those case, if the `default` or `const` and the `formValue` match, the score is
 *   incremented by another 1 otherwise it is decremented by 1. A missing formValue is not compared to a `const`.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param value - The schema of the property
 * @param formValue - The form data the property holds
 * @returns - The property's score
 */
function propertyScore<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, rootSchema: S, value: S, formValue: unknown): number {
  if (typeof value[REF_KEY] === 'string') {
    return formValue == null
      ? 0
      : propertyScore<T, S, F>(context, rootSchema, resolveOwnRef<S>(value, rootSchema), formValue);
  }
  const xxxOfKey = getXxxOfKey<S>(value);
  if (xxxOfKey && formValue != null) {
    return bestOption<unknown, S, F>(
      context,
      rootSchema,
      formValue,
      getByPath<unknown[]>(value, xxxOfKey),
      -1,
      false,
      getDiscriminatorFieldFromSchema<S>(value),
    ).score();
  }
  if (value.type === 'object') {
    // If the structure is matching then give it a little boost in score
    const structureBoost = typeof formValue === 'object' && formValue !== null ? 1 : 0;
    return structureBoost + calculateIndexScore<T, S, F>(context, rootSchema, value, formValue);
  }
  if (value.type !== guessType(formValue)) {
    return 0;
  }
  // If the types match, then we bump the score by one
  if (value.default) {
    // Score a value that matches the default higher and any other value lower. Only a truthy default is
    // scored, as before: the check doesn't require `readOnly`, so scoring `default: false` would penalize a
    // user who ticks the box, the same way a truthy default already penalizes one who clears it
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
  if (isObject(schema.properties)) {
    return Object.entries(schema.properties).reduce(
      // An own-property read, so a schema property legally named `toString`, `constructor` or `valueOf` reads the
      // data's own value rather than the one every object inherits, which would never look like missing data
      (score, [key, value]) =>
        isSchemaObject<S>(value)
          ? score + propertyScore<T, S, F>(context, rootSchema, value, getByPath<T>(formData, key))
          : score,
      0,
    );
  }
  return typeof schema.type === 'string' && schema.type === guessType(formData) ? 1 : 0;
}

/** The option `bestOption()` picks, with the score it gets, computed once it is asked for */
interface BestOption {
  readonly index: number;
  readonly score: () => number;
}

/** The options picked for data held in an object or array, by validator, merge, root, flags, the option objects
 * themselves, since an option's view scores the data apart from the option it was retrieved from, and the data itself,
 * with a copy of what the data held. Scoring an option list reads the lists nested below it for each candidate, so
 * without this every level of a recursion through options multiplies the matching done below it by the number of
 * candidates (#4990). A pick is reused only while the data still equals the copy: a caller may mutate the data in place
 * between calls, at any depth. Other data scores no nested list and is not kept.
 */
const picked = new KeyedMemo<{ pick: BestOption; data: unknown }>();

/** Returns the index of the option of `options` closest to `formData`, as `getClosestMatchingOption()` describes,
 * with each option matched as `optionMatches()` matches it under `relax`, and that option's score
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param formData - The form data associated with the schema
 * @param options - The list of options that can be selected from, boolean ones included
 * @param selectedOption - The index of the currently selected option, -1 for none
 * @param relax - Whether an option's `additionalProperties: false` is relaxed for matching
 * @param [discriminatorField] - The name of the property the options are told apart by
 * @returns - The index of the closest option, and the score a list nested under a property contributes with it
 */
function bestOption<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  formData: T | undefined,
  options: readonly unknown[],
  selectedOption: number,
  relax: boolean,
  discriminatorField?: string,
): BestOption {
  const optionNodes = options.map((option) => optionNodeOf<S>(option, rootSchema));
  const compute = () =>
    scoreOptions<T, S, F>(
      context,
      rootSchema,
      formData,
      options,
      optionNodes,
      selectedOption,
      relax,
      discriminatorField,
    );
  if (typeof formData !== 'object' || formData === null) {
    return compute();
  }
  const keys = [
    context.validator,
    context.customMergeAllOf,
    rootSchema,
    relax,
    discriminatorField,
    selectedOption,
    ...options,
    formData,
  ];
  const stored = picked.peek(keys);
  if (stored && deepEquals(stored.data, formData)) {
    return stored.pick;
  }
  const pick = compute();
  picked.set(keys, { pick, data: copyOfData(formData) });
  return pick;
}

/** A copy of the arrays and plain objects in `data`, sharing every other value */
function copyOfData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(copyOfData);
  }
  if (isPlainObject(data)) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, copyOfData(value)]));
  }
  return data;
}

/** Picks the option for `bestOption()`, see `getClosestMatchingOption()` */
function scoreOptions<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  formData: T | undefined,
  options: readonly unknown[],
  optionNodes: readonly OptionNode<S>[],
  selectedOption: number,
  relax: boolean,
  discriminatorField: string | undefined,
): BestOption {
  const resolved = (index: number) => {
    const option = options[index];
    return isSchemaObject<S>(option) ? resolveOwnRef<S>(option, rootSchema) : undefined;
  };
  // The score a list of options nested under a property contributes: what the picked option scores, plus one where the
  // data matches it, as the option picked here without scoring does
  const scoreOfMatch = (index: number) => {
    let score: number | undefined;
    return () => {
      score ??= 1 + calculateIndexScore<T, S, F>(context, rootSchema, resolved(index), formData);
      return score;
    };
  };
  const simpleMatch = simpleDiscriminatorMatch(optionNodes, formData, discriminatorField);
  if (simpleMatch !== undefined) {
    return { index: simpleMatch, score: scoreOfMatch(simpleMatch) };
  }
  const validIndexes =
    formData === undefined
      ? []
      : optionNodes.flatMap((option, index) =>
          optionMatches<S, F>(context, formData, option, relax, discriminatorField) ? [index] : [],
        );
  if (validIndexes.length === 1) {
    return { index: validIndexes[0], score: scoreOfMatch(validIndexes[0]) };
  }
  // With no option matching, every option is a candidate, and the pick is always one of the candidates
  const candidates = validIndexes.length > 0 ? validIndexes : [...options.keys()];
  if (candidates.length === 0) {
    return { index: selectedOption, score: () => 0 };
  }
  // A tie keeps the selected option where it is a candidate, and the first candidate otherwise
  const first = candidates.includes(selectedOption) ? selectedOption : candidates[0];
  let best = { index: first, score: calculateIndexScore<T, S, F>(context, rootSchema, resolved(first), formData) };
  for (const index of candidates) {
    if (index !== first) {
      const score = calculateIndexScore<T, S, F>(context, rootSchema, resolved(index), formData);
      if (score > best.score) {
        best = { index, score };
      }
    }
  }
  const score = (validIndexes.includes(best.index) ? 1 : 0) + best.score;
  return { index: best.index, score: () => score };
}

/** Returns the index of the option of `options` closest to `formData`, as `getClosestMatchingOption()` describes,
 * with each option matched as `optionMatches()` matches it under `relax`
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param formData - The form data associated with the schema
 * @param options - The list of options that can be selected from, boolean ones included
 * @param selectedOption - The index of the currently selected option, -1 for none
 * @param relax - Whether an option's `additionalProperties: false` is relaxed for matching
 * @param [discriminatorField] - The name of the property the options are told apart by
 * @returns - The index of the closest option, or the `selectedOption` when there is none to pick
 */
export function closestOption<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  formData: T | undefined,
  options: readonly unknown[],
  selectedOption: number,
  relax: boolean,
  discriminatorField?: string,
): number {
  return bestOption<T, S, F>(context, rootSchema, formData, options, selectedOption, relax, discriminatorField).index;
}

/** Determines which of the given `options` provided most closely matches the `formData`. An option whose
 * discriminator property's `const` or `enum` holds the data's value wins outright. Otherwise the index of the one option
 * that matches the data, as `getFirstMatchingOption()` matches an option, is returned when exactly one does.
 *
 * Otherwise the options that match, or all of them when none does, are the candidates: each is scored by calling
 * `calculateIndexScore()` on it, and the candidate with the best score is returned. A tie goes to the `selectedOption`
 * when it is a candidate and to the first candidate otherwise, so an option that does not match the data is never
 * returned while one does.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param formData - The form data associated with the schema
 * @param options - The list of options that can be selected from
 * @param [selectedOption=-1] - The index of the currently selected option, defaulted to -1 if not specified
 * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
 *          determine which option is selected
 * @returns - The index of the option that is the closest match to the `formData`, or the `selectedOption` when there
 *          are no options
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
  return closestOption<T, S, F>(context, rootSchema, formData, options, selectedOption, false, discriminatorField);
}
