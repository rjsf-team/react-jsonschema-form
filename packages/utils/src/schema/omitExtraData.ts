import { createComparator, createMerger, createShallowAllOfMerge } from '@x0k/json-schema-merge';
import { createDeduplicator, createIntersector } from '@x0k/json-schema-merge/lib/array';
import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import get from 'lodash/get';

import { NAME_KEY, RJSF_ADDITIONAL_PROPERTIES_FLAG } from '../constants';
import findSchemaDefinition from '../findSchemaDefinition';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema';
import getSchemaType from '../getSchemaType';
import isObject from '../isObject';
import {
  Experimental_CustomMergeAllOf,
  FormContextType,
  GenericObjectType,
  PathSchema,
  RJSFSchema,
  StrictRJSFSchema,
  ValidatorType,
} from '../types';
import getClosestMatchingOption from './getClosestMatchingOption';
import isSelect from './isSelect';
import { relaxOptionsForScoring, resolveAllReferences } from './retrieveSchema';

/** Returns the `formData` with only the elements specified in the `fields` list
 *
 * @param formData - The data for the `Form`
 * @param fields - The fields to keep while filtering
 * @deprecated - To be removed as an exported `@rjsf/utils` function in a future release
 */
export function getUsedFormData<T = any>(formData: T | undefined, fields: string[]): T | undefined {
  // For the case of a single input form
  if (fields.length === 0 && typeof formData !== 'object') {
    return formData;
  }

  const data: GenericObjectType = pick(formData, fields);
  if (Array.isArray(formData)) {
    return Object.keys(data).map((key: string) => data[key]) as unknown as T;
  }

  return data as T;
}

/** Returns the list of field names from inspecting the `pathSchema` as well as using the `formData`
 *
 * @param pathSchema - The `PathSchema` object for the form
 * @param [formData] - The form data to use while checking for empty objects/arrays
 * @deprecated - To be removed as an exported `@rjsf/utils` function in a future release
 */
export function getFieldNames<T = any>(pathSchema: PathSchema<T>, formData?: T): string[][] {
  const formValueHasData = (value: T, isLeaf: boolean) =>
    typeof value !== 'object' || isEmpty(value) || (isLeaf && !isEmpty(value));
  const getAllPaths = (_obj: GenericObjectType, acc: string[][] = [], paths: string[][] = [[]]) => {
    const objKeys = Object.keys(_obj);
    objKeys.forEach((key: string) => {
      const data = _obj[key];
      if (typeof data === 'object') {
        const newPaths = paths.map((path) => [...path, key]);
        // If an object is marked with additionalProperties, all its keys are valid
        if (data[RJSF_ADDITIONAL_PROPERTIES_FLAG] && data[NAME_KEY] !== '') {
          acc.push(data[NAME_KEY]);
        } else {
          getAllPaths(data, acc, newPaths);
        }
      } else if (key === NAME_KEY && data !== '') {
        paths.forEach((path) => {
          const formValue = get(formData, path);
          const isLeaf = objKeys.length === 1;
          // adds path to fieldNames if it points to a value or an empty object/array which is not a leaf
          if (
            formValueHasData(formValue, isLeaf) ||
            (Array.isArray(formValue) && formValue.every((val) => formValueHasData(val, isLeaf)))
          ) {
            acc.push(path);
          }
        });
      }
    });
    return acc;
  };

  return getAllPaths(pathSchema);
}

// Mirror the same allOf merge setup used in retrieveSchema.ts
const { compareSchemaDefinitions, compareSchemaValues } = createComparator();
const { mergeArrayOfSchemaDefinitions } = createMerger({
  intersectJson: createIntersector(compareSchemaValues),
  deduplicateJsonSchemaDef: createDeduplicator(compareSchemaDefinitions),
});
const shallowAllOfMerge = createShallowAllOfMerge(mergeArrayOfSchemaDefinitions);

/** Returns true when a form value is considered empty: null/undefined/'', an empty array, or a plain
 * object whose every own value is itself empty (recursive). Scalars like `0` and `false` are not empty.
 *
 * @param value - The value to check
 * @returns - True if the value is considered empty, false otherwise
 */
export function isValueEmpty(value: unknown): boolean {
  if (isNil(value) || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (isObject(value)) {
    return Object.values(value as GenericObjectType).every(isValueEmpty);
  }
  return false;
}

/** Merges an `allOf` schema into a single flat schema, delegating to `experimental_customMergeAllOf`
 * when provided or falling back to the module-level `shallowAllOfMerge` otherwise.
 *
 * @param schema - A schema containing an `allOf` array to be merged
 * @param [experimental_customMergeAllOf] - Optional custom merge function; see `Form` documentation
 * @returns - The merged schema with `allOf` resolved into a single schema object
 */
function doMergeAllOf<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
): S {
  return experimental_customMergeAllOf ? experimental_customMergeAllOf(schema) : (shallowAllOfMerge(schema) as S);
}

/** A recursive, schema-driven filter that walks `schema` and `formData` in lockstep, keeping only
 * values that are described by the schema. Handles `$ref`, `allOf`, `anyOf`, `oneOf`, `if/then/else`,
 * `patternProperties`, `additionalProperties`, `propertyNames`, and `dependencies`. Optional object
 * properties whose schema-filtered content is entirely empty (per `isValueEmpty`) are pruned; required
 * properties and scalar values are always kept when schema-defined.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which to filter the formData
 * @param [rootSchema] - The root schema, used primarily to look up `$ref`s
 * @param [formData] - The data for the `Form`
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @returns - The `formData` after omitting extra data, or `undefined` when `formData` is undefined
 */
export default function omitExtraData<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  rootSchema: S = {} as S,
  formData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
): T | undefined {
  /** Type predicate that narrows `value` to `GenericObjectType` — true when `value` is a plain,
   * non-array object (i.e. a JSON object). Used to distinguish JSON objects from arrays and primitives.
   *
   * @param value - The value to check
   * @returns - True if `value` is a plain non-array object
   */
  function isObjectValue(value: unknown): value is GenericObjectType {
    return isObject(value);
  }

  /** Type predicate that narrows a `S | boolean` schema definition to `S` — true when `schemaDef` is
   * a schema object rather than a JSON Schema boolean shorthand (`true` meaning allow-all, `false`
   * meaning deny-all).
   *
   * @param schemaDef - The schema definition to check
   * @returns - True if `schemaDef` is a schema object
   */
  function isSchemaObj(schemaDef: S | boolean): schemaDef is S {
    return isObject(schemaDef);
  }

  /** Copies schema-defined properties from `source` into `target`, applying `omit` recursively for
   * each value. Handles `properties`, `patternProperties`, `additionalProperties`, and `propertyNames`.
   * Optional object-valued properties are pruned when every key in the filtered result is both
   * optional (per the inner schema's `required`) and empty (per `isValueEmpty`). This preserves
   * optional objects whose required children have empty values, while still dropping objects whose
   * schema-filtered content is entirely optional-and-empty. Required properties and scalar values
   * are always written when defined. Always returns `target` — pruning of the object itself is
   * the caller's responsibility.
   *
   * @param schema - The object schema describing which properties are allowed
   * @param source - The source form data object to read values from
   * @param target - The accumulator object to write filtered values into
   * @returns - `target` after all schema-defined properties have been processed
   */
  function handleObject(schema: S, source: GenericObjectType, target: GenericObjectType): GenericObjectType {
    const { properties, additionalProperties, patternProperties, propertyNames } = schema;
    const requiredSet = new Set((schema.required ?? []) as string[]);

    /** Recursively omits extra data from `value` via `omit`, then conditionally writes the result to
     * `target[key]`. Optional object-valued properties are dropped when every key in the filtered
     * result is both optional (within the inner schema's `required` list) and has an empty value per
     * `isValueEmpty`. This per-key approach prevents required-but-empty child properties — kept by
     * inner `setProperty` calls — from inadvertently causing the parent optional object to be dropped,
     * while still pruning optional objects whose schema-filtered content is entirely empty. Vacuously
     * true for `{}`, so empty results are always dropped. Scalar and array values are not pruned here.
     *
     * @param key - The property key to write on `target`
     * @param schemaDef - The schema (or boolean shorthand) that governs the value at `key`
     * @param value - The raw source value to filter
     * @param [required=false] - When true the property is never pruned regardless of its filtered value
     */
    function setProperty(key: string, schemaDef: S | boolean, value: unknown, required = false) {
      const v = omit(schemaDef, value, target[key]);
      if (!required && isObject(v)) {
        // Resolve $ref so we can inspect the effective required list for the inner schema.
        let sd = isSchemaObj(schemaDef as S | boolean) ? (schemaDef as S) : ({} as S);
        if (sd.$ref !== undefined) {
          sd = findSchemaDefinition(sd.$ref, rootSchema) as S;
        }
        const innerRequired = new Set((sd.required ?? []) as string[]);
        // Drop this optional object when every key in v is both optional in the inner schema
        // and has an empty value. Vacuously true for {} so empty objects are always dropped.
        const shouldDrop = Object.entries(v as GenericObjectType).every(
          ([k, val]) => !innerRequired.has(k) && isValueEmpty(val),
        );
        if (shouldDrop) {
          return;
        }
      }
      if (v !== undefined) {
        target[key] = v;
      }
    }

    if (properties !== undefined) {
      for (const [key, schemaDef] of Object.entries(properties)) {
        setProperty(key, schemaDef as S | boolean, source[key], requiredSet.has(key));
      }
    }

    // Track keys not handled by properties/patterns so additionalProperties can pick them up.
    let patternPropertiesRest: string[] | undefined;
    if (patternProperties !== undefined) {
      patternPropertiesRest = [];
      const patterns = Object.entries(patternProperties).map(([pattern, schemaDef]): [RegExp, S | boolean] => [
        new RegExp(pattern),
        schemaDef as S | boolean,
      ]);
      const knownProperties = new Set(Object.keys(properties ?? {}));
      for (const [key, value] of Object.entries(source)) {
        if (knownProperties.has(key)) {
          continue;
        }
        const matched = patterns.find(([re]) => re.test(key));
        if (matched === undefined) {
          patternPropertiesRest.push(key);
          continue;
        }
        setProperty(key, matched[1], value);
      }
    }

    // JSON Schema spec: absent additionalProperties defaults to true (allow all extra keys). Here
    // we treat it as false so omitExtraData never inadvertently passes through undescribed keys.
    if (additionalProperties !== undefined && additionalProperties !== false) {
      const addlSchema = additionalProperties as S | boolean;
      if (patternPropertiesRest !== undefined) {
        for (const key of patternPropertiesRest) {
          setProperty(key, addlSchema, source[key]);
        }
      } else {
        const knownProperties = new Set(Object.keys(properties ?? {}));
        for (const [key, value] of Object.entries(source)) {
          if (knownProperties.has(key)) {
            continue;
          }
          setProperty(key, addlSchema, value);
        }
      }
    }

    // When propertyNames is present, the schema only constrains key names — all source keys are valid.
    if (propertyNames !== undefined) {
      for (const [key, value] of Object.entries(source)) {
        target[key] = value;
      }
    }

    return target;
  }

  /** Filters array elements from `source` into `target` according to `schema.items` and
   * `schema.additionalItems`. For tuple schemas (`items` is an array) each element is filtered by its
   * per-index schema; elements beyond the tuple length are covered by `additionalItems` when present.
   * For list schemas (`items` is a single schema) every element is filtered by that schema.
   *
   * @param schema - The array schema describing `items` and optionally `additionalItems`
   * @param source - The source array to read elements from
   * @param target - The accumulator array to push filtered elements into
   * @returns - `target` after all applicable source elements have been pushed
   */
  function handleArray(schema: S, source: unknown[], target: unknown[]): unknown[] {
    const { items, additionalItems } = schema;
    if (items !== undefined) {
      if (Array.isArray(items)) {
        for (let i = 0; i < items.length; i++) {
          target.push(omit(items[i] as S | boolean, source[i]));
        }
      } else {
        for (let i = 0; i < source.length; i++) {
          target.push(omit(items as S | boolean, source[i]));
        }
      }
    }
    // additionalItems covers tuple items beyond the items array length.
    if (additionalItems) {
      for (let i = target.length; i < source.length; i++) {
        target.push(omit(additionalItems as S | boolean, source[i]));
      }
    }
    return target;
  }

  /** Applies the `if/then/else` conditional keywords from `schema` to `target`. When `schema.if` is
   * absent the original `target` is returned unchanged. Otherwise the condition is evaluated — using
   * `validator.isValid` for schema conditions or the boolean value directly — and the matching branch
   * (`then` or `else`) is applied via `omit`. When the selected branch is absent, `target` is returned
   * unchanged.
   *
   * @param schema - The schema potentially containing `if`, `then`, and `else` keywords
   * @param source - The current form data value, passed to `validator.isValid` and the branch `omit`
   * @param target - The already-filtered value to merge the branch result into
   * @returns - The result of applying the matched branch, or `target` when no branch applies
   */
  function handleConditions(schema: S, source: unknown, target: unknown): unknown {
    const { if: condition, then, else: otherwise } = schema;
    if (condition === undefined) {
      return target;
    }
    // validator.isValid signature: (schema, formData, rootSchema)
    const isThenBranch = isSchemaObj(condition as S | boolean)
      ? validator.isValid(condition as S, source as T, rootSchema)
      : condition;
    const branch = isThenBranch ? then : otherwise;
    return branch === undefined ? target : omit(branch as S | boolean, source, target);
  }

  /** Applies the best-matching `oneOf` option to `source`, merging the result into `target`. When
   * `oneOf` is not an array or the schema represents a select widget (enum-driven), `target` is
   * returned unchanged. `additionalProperties: false` is relaxed on each option before scoring so that
   * `getClosestMatchingOption` can validate freely, but the original option schema is used for the
   * actual `omit` call.
   *
   * @param oneOf - The `oneOf` array from the schema, or `undefined`
   * @param schema - The parent schema containing the `oneOf` keyword
   * @param source - The current form data value used to score each option
   * @param target - The already-filtered value to merge the winning option's result into
   * @returns - The result of applying the best-matching option, or `target` when no matching applies
   */
  function handleOneOf(oneOf: S['oneOf'], schema: S, source: unknown, target: unknown): unknown {
    if (!Array.isArray(oneOf) || isSelect(validator, schema, rootSchema, experimental_customMergeAllOf)) {
      return target;
    }
    // Resolve $refs first so that nested additionalProperties:false is visible before relaxation.
    // Boolean schemas are converted to their object equivalents.
    const resolved: S[] = (oneOf as Array<S | boolean>).map((d) =>
      isObject(d) ? resolveAllReferences(d as S, rootSchema, []) : ((d ? {} : { not: {} }) as S),
    );
    // Relax additionalProperties:false for scoring only so getClosestMatchingOption does not produce
    // false negatives. schemaParser captures these hashes via resolveAnyOrOneOfSchemas(expandAllBranches=true)
    // so precompiled validators can find them. The unrelaxed resolved schema is used for actual filtering.
    const scoringOptions = relaxOptionsForScoring<S>(resolved);
    const bestIndex = getClosestMatchingOption(
      validator,
      rootSchema,
      source as T,
      scoringOptions,
      0,
      getDiscriminatorFieldFromSchema(schema),
      experimental_customMergeAllOf,
    );
    return omit(resolved[bestIndex], source, target);
  }

  /** Applies `anyOf` branches from `schema` to `source`, merging results into `target`. When `anyOf`
   * is absent or not an array, `target` is returned unchanged. For undefined or empty sources (so that
   * defaults can flow through all branches) every branch is applied in sequence. For non-empty sources
   * the best-matching branch is selected via `handleOneOf`.
   *
   * @param schema - The schema potentially containing an `anyOf` keyword
   * @param source - The current form data value; empty or undefined triggers all-branch application
   * @param target - The already-filtered value to merge branch results into
   * @returns - The result after applying the relevant `anyOf` branch(es), or `target` when inapplicable
   */
  function handleAnyOf(schema: S, source: unknown, target: unknown): unknown {
    const { anyOf } = schema;
    if (!Array.isArray(anyOf)) {
      return target;
    }
    // For undefined or empty collections, apply every branch so defaults flow through.
    if (
      source === undefined ||
      (Array.isArray(source) && source.length === 0) ||
      (isObject(source) && Object.keys(source as object).length === 0)
    ) {
      for (const branch of anyOf as Array<S | boolean>) {
        target = omit(branch, source, target);
      }
      return target;
    }
    return handleOneOf(anyOf, schema, source, target);
  }

  /** Applies schema-based `dependencies` from `schema` to `source`, merging each active dependency's
   * schema into `target` via `omit`. Property dependencies (plain string arrays) are skipped — only
   * schema dependencies are processed. A dependency is considered active when its trigger key is
   * present on `source`.
   *
   * @param schema - The schema potentially containing a `dependencies` keyword
   * @param source - The current form data value; must be a plain object for dependencies to apply
   * @param target - The already-filtered value to merge dependency results into
   * @returns - The result after applying all active schema dependencies, or `target` when inapplicable
   */
  function handleDependencies(schema: S, source: unknown, target: unknown): unknown {
    const { dependencies } = schema;
    if (dependencies === undefined || !isObjectValue(source)) {
      return target;
    }
    for (const [key, deps] of Object.entries(dependencies)) {
      // Skip property dependencies (string arrays); only process schema dependencies.
      if (!(key in source) || Array.isArray(deps)) {
        continue;
      }
      target = omit(deps as S | boolean, source, target);
    }
    return target;
  }

  /** Core recursive filter. Resolves `$ref`s, merges `allOf`, then delegates to the type-specific
   * handlers (`handleObject`, `handleArray`) and keyword handlers (`handleAnyOf`, `handleOneOf`,
   * `handleConditions`, `handleDependencies`). Returns `undefined` when `source` is undefined or
   * `schemaDef` is `false`; returns `source` unchanged when `schemaDef` is `true` or empty.
   *
   * @param schemaDef - The schema (or boolean shorthand) to filter `source` against
   * @param source - The raw form data value to filter
   * @param [target] - An optional accumulator carrying results from prior oneOf/anyOf processing
   * @returns - The filtered value, or `undefined` when the schema rejects the value
   */
  function omit(schemaDef: S | boolean, source: unknown, target?: unknown): unknown {
    if (source === undefined || schemaDef === false) {
      return undefined;
    }
    if (schemaDef === true || isEmpty(schemaDef as object)) {
      return source;
    }

    let schema = schemaDef as S;
    const { $ref: ref, allOf } = schema;

    if (ref !== undefined) {
      return omit(findSchemaDefinition(ref, rootSchema), source, target);
    }
    if (allOf) {
      schema = doMergeAllOf(schema, experimental_customMergeAllOf);
    }

    target = handleAnyOf(schema, source, handleOneOf(schema.oneOf, schema, source, target));

    const type = getSchemaType(schema);
    if (type === 'object') {
      if (!isObjectValue(source)) {
        return undefined;
      }
      target = handleObject(schema, source, isObjectValue(target) ? target : {});
    } else if (type === 'array') {
      if (!Array.isArray(source)) {
        return undefined;
      }
      target = handleArray(schema, source, Array.isArray(target) ? target : []);
    } else if (target === undefined) {
      target = source;
    }

    return handleDependencies(schema, source, handleConditions(schema, source, target));
  }

  return omit(schema, formData) as T | undefined;
}
