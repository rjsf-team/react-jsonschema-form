import { ALL_OF_KEY, REF_KEY } from '../constants.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import guessType from '../guessType.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import { optionMatches, optionNodeOf, simpleDiscriminatorMatch } from './getFirstMatchingOption.ts';
import { resolveOwnRef } from './retrieveSchema.ts';

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
    const discriminator = getDiscriminatorFieldFromSchema<S>(value);
    return getClosestMatchingOption<unknown, S, F>(
      context,
      rootSchema,
      formValue,
      getByPath<S[]>(value, xxxOfKey),
      -1,
      discriminator,
    );
  }
  if (value.type === 'object') {
    // If the structure is matching then give it a little boost in score
    const structureBoost = typeof formValue === 'object' && formValue !== null ? 1 : 0;
    return structureBoost + calculateIndexScore<T, S, F>(context, rootSchema, value, formValue);
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
 * entry that is a `$ref` scores 0 where the `formData` is `undefined` or `null`, as a property's `$ref` does.
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
  return scopeScore<T, S, F>(context, rootSchema, schema, formData, []);
}

/** Returns the score `calculateIndexScore()` describes, passing over an `allOf` entry already being scored further out,
 * which a definition whose `allOf` leads back to itself would otherwise score without end
 */
function scopeScore<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  schema: S | undefined,
  formData: unknown,
  scoring: readonly S[],
): number {
  if (!schema || scoring.includes(schema)) {
    return 0;
  }
  const own = isObject(schema.properties)
    ? Object.entries(schema.properties).reduce(
        // An own-property read, so a schema property legally named `toString`, `constructor` or `valueOf` reads the
        // data's own value rather than the one every object inherits, which would never look like missing data
        (score, [key, value]) =>
          isSchemaObject<S>(value)
            ? score + propertyScore<T, S, F>(context, rootSchema, value, getByPath<T>(formData, key))
            : score,
        0,
      )
    : Number(typeof schema.type === 'string' && schema.type === guessType(formData));
  const entries: unknown = schema[ALL_OF_KEY];
  return (Array.isArray(entries) ? entries : []).reduce<number>((score, entry) => {
    // An entry's `$ref` is followed only for data to score, as a property's own `$ref` is: a property typed `object`
    // is scored from a fresh `calculateIndexScore()` for its value, so for a recursive definition reached through the
    // entry, only the data, consumed a key at a time, bounds the descent
    if (!isSchemaObject<S>(entry) || (typeof entry[REF_KEY] === 'string' && formData == null)) {
      return score;
    }
    return (
      score +
      scopeScore<T, S, F>(context, rootSchema, resolveOwnRef<S>(entry, rootSchema), formData, [...scoring, schema])
    );
  }, own);
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
  const resolvedOptions = options.map((option) =>
    isSchemaObject<S>(option) ? resolveOwnRef<S>(option, rootSchema) : undefined,
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
      const score = calculateIndexScore(context, rootSchema, option, formData);
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
