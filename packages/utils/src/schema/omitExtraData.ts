import type { JSONSchema7Definition } from 'json-schema';

import {
  additionalPropertiesKeyword,
  getAdditionalPropertySchema,
  getMatchingPatternProperties,
} from '../additionalPropertiesUtils.ts';
import { fieldPathFromList } from '../fieldPath.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getSchemaType from '../getSchemaType.ts';
import getSchemaTypeForValue from '../getSchemaTypeForValue.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import type {
  FieldPathList,
  FormContextType,
  FormFieldState,
  GenericObjectType,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
} from '../types.ts';
import { closestOption } from './getClosestMatchingOption.ts';
import { mergeAllOf, schemaFrom, schemaOfBoolean } from './graph/mergePlan.ts';
import resolveConstantOptions from './resolveConstantOptions.ts';
import { conditionHolds, resolveOwnRef } from './retrieveSchema.ts';

/** Returns true when a form value is considered empty: null/undefined/'', an empty array, or a plain
 * object whose every own value is itself empty (recursive). Scalars like `0` and `false` are not empty.
 *
 * @param value - The value to check
 * @returns - True if the value is considered empty, false otherwise
 */
export function isValueEmpty(value: unknown): boolean {
  if (value == null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (isObject(value)) {
    return Object.values(value).every(isValueEmpty);
  }
  return false;
}

/** The filtered data, in the type of the data it was filtered from */
function dataOf<T>(value: unknown): T | undefined;
function dataOf(value: unknown): unknown {
  return value;
}

/** A recursive, schema-driven filter that walks `schema` and `formData` in lockstep, keeping only
 * values that are described by the schema. Handles `$ref`, `allOf`, `anyOf`, `oneOf`, `if/then/else`,
 * `patternProperties`, `additionalProperties`, `propertyNames`, and `dependencies`. Optional object
 * properties whose schema-filtered content is entirely empty (per `isValueEmpty`) are pruned; required
 * properties and scalar values are always kept when schema-defined.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which to filter the formData
 * @param [rootSchema] - The root schema, used primarily to look up `$ref`s
 * @param [formData] - The data for the `Form`
 * @param [fieldState] - The option each field shows, so a field offering `anyOf`/`oneOf` options keeps the data its
 *        shown option describes. Without it, the option the data matches best
 * @returns - The `formData` after omitting extra data, or `undefined` when `formData` is undefined
 */
export default function omitExtraData<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S = schemaFrom(schema, {}),
  formData?: T,
  fieldState?: FormFieldState<S>,
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

  /** Copies schema-defined properties from `source` into `target`, applying `omit` recursively for
   * each value. Handles `properties`, `patternProperties`, and `additionalProperties` — or the
   * `unevaluatedProperties` that answers for the leftover keys where no `additionalProperties` does.
   * Optional object-valued properties are pruned when every key in the filtered result is both
   * optional (per the inner schema's `required`) and empty (per `isValueEmpty`). This preserves
   * optional objects whose required children have empty values, while still dropping objects whose
   * schema-filtered content is entirely optional-and-empty. Required properties and scalar values
   * are always written when defined. Always returns `target` — pruning of the object itself is
   * the caller's responsibility.
   *
   * @param childSchema - The object schema describing which properties are allowed
   * @param source - The source form data object to read values from
   * @param target - The accumulator object to write filtered values into
   * @param path - The path of the object
   * @returns - `target` after all schema-defined properties have been processed
   */
  function handleObject(
    childSchema: S,
    source: GenericObjectType,
    target: GenericObjectType,
    path: FieldPathList,
  ): GenericObjectType {
    const { properties, patternProperties } = childSchema;
    // Read with the precedence `getAdditionalPropertySchema()` reads the two keywords with, so a key the form renders
    // a field for, and the add button seeds, through an `unevaluatedProperties` is one this keeps rather than prunes
    // out from under it
    const additionalProperties = additionalPropertiesKeyword<S>(childSchema);
    const requiredSet = new Set(childSchema.required ?? []);

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
      const v = omit(schemaDef, value, [...path, key], target[key]);
      if (!required && isObject(v)) {
        // Resolve $ref so we can inspect the effective required list for the inner schema.
        let sd = isSchemaObject<S>(schemaDef) ? schemaDef : ({} as S);
        if (sd.$ref !== undefined) {
          sd = resolveOwnRef<S>(sd, rootSchema);
        }
        // A key the `patternProperties` match is described by the `allOf` of every pattern matching it, which is where
        // the names it requires live: read off the wrapper around them it requires nothing, and a required child
        // holding an empty value would take the whole object down with it
        const innerRequired = new Set((sd.allOf ? mergeAllOfOnce(sd, sd.allOf) : sd)?.required);
        // Drop this optional object when every key in v is both optional in the inner schema
        // and has an empty value. Vacuously true for {} so empty objects are always dropped.
        const shouldDrop = Object.entries(v).every(([k, val]) => !innerRequired.has(k) && isValueEmpty(val));
        if (shouldDrop) {
          return;
        }
      }
      if (v !== undefined) {
        // oxlint-disable-next-line no-param-reassign
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
      const knownProperties = new Set(Object.keys(properties ?? {}));
      for (const [key, value] of Object.entries(source)) {
        if (!knownProperties.has(key)) {
          // The patterns are read through `getMatchingPatternProperties()` rather than compiled here, so the keys this
          // keeps are the keys the rest of the form describes and seeds through a pattern: one compiled a second way
          // matches a different set of keys, and a key kept by one rule and described by the other is either dropped
          // from under a field that edited it or kept with nothing to edit it
          if (Object.keys(getMatchingPatternProperties<S>(childSchema, key)).length === 0) {
            patternPropertiesRest.push(key);
          } else {
            // A key several patterns match is described by all of them together, which is the schema the form renders
            // it with, so `getAdditionalPropertySchema()` answers for it here too: filtered by the first matching
            // pattern alone, such a key loses whatever only another of them describes, out from under a field that
            // edited it
            setProperty(key, getAdditionalPropertySchema<S>(childSchema, key), value, requiredSet.has(key));
          }
        }
      }
    }

    // JSON Schema spec: absent additionalProperties defaults to true (allow all extra keys). Here
    // we treat it as false so omitExtraData never inadvertently passes through undescribed keys.
    if (additionalProperties !== undefined && additionalProperties !== false) {
      const addlSchema = additionalProperties as S | boolean;
      if (patternPropertiesRest !== undefined) {
        for (const key of patternPropertiesRest) {
          setProperty(key, addlSchema, source[key], requiredSet.has(key));
        }
      } else {
        const knownProperties = new Set(Object.keys(properties ?? {}));
        for (const [key, value] of Object.entries(source)) {
          if (!knownProperties.has(key)) {
            setProperty(key, addlSchema, value, requiredSet.has(key));
          }
        }
      }
    }

    return target;
  }

  /** Filters array elements from `source` into `target` according to `schema.items` and
   * `schema.additionalItems`. Only called when `items` is defined (guarded in `omit`). Uses index
   * assignment (not push) so a pre-populated `target` from a prior branch is overwritten rather than
   * appended to, preventing item duplication. For tuple schemas (`items` is an array) elements up to
   * `min(items.length, source.length)` are filtered by their per-index schema; elements beyond the
   * tuple are covered by `additionalItems` when present, or the target is truncated when absent.
   * For list schemas (`items` is a single schema) every source element is filtered and `target.length`
   * is set to `source.length`.
   *
   * @param childSchema - The array schema describing `items` and optionally `additionalItems`
   * @param source - The source array to read elements from
   * @param target - The accumulator array to write filtered elements into
   * @param path - The path of the array
   * @returns - `target` after all applicable source elements have been written
   */
  function handleArray(childSchema: S, source: unknown[], target: unknown[], path: FieldPathList): unknown[] {
    const { items, additionalItems } = childSchema;
    if (Array.isArray(items)) {
      const tupleLength = Math.min(items.length, source.length);
      let i = 0;
      for (; i < tupleLength; i += 1) {
        // oxlint-disable-next-line no-param-reassign
        target[i] = omit(items[i], source[i], [...path, i]);
      }
      // Without additionalItems, truncate at the tuple boundary to drop any pre-existing items.
      if (!additionalItems) {
        // oxlint-disable-next-line no-param-reassign
        target.length = tupleLength;
        return target;
      }
      for (; i < source.length; i += 1) {
        // oxlint-disable-next-line no-param-reassign
        target[i] = omit(additionalItems, source[i], [...path, i]);
      }
    } else {
      for (let i = 0; i < source.length; i += 1) {
        // oxlint-disable-next-line no-param-reassign
        target[i] = omit(items, source[i], [...path, i]);
      }
    }
    // Truncate any pre-existing items beyond the source length.
    // oxlint-disable-next-line no-param-reassign
    target.length = source.length;
    return target;
  }

  /** Applies the `if/then/else` conditional keywords from `schema` to `target`. When `schema.if` is
   * absent the original `target` is returned unchanged. Otherwise the condition is evaluated — using
   * `validator.isValid` for schema conditions or the boolean value directly — and the matching branch
   * (`then` or `else`) is applied via `omit`. When the selected branch is absent, `target` is returned
   * unchanged.
   *
   * @param childSchema - The schema potentially containing `if`, `then`, and `else` keywords
   * @param source - The current form data value, passed to `validator.isValid` and the branch `omit`
   * @param target - The already-filtered value to merge the branch result into
   * @param path - The path of the value
   * @returns - The result of applying the matched branch, or `target` when no branch applies
   */
  function handleConditions(childSchema: S, source: unknown, target: unknown, path: FieldPathList): unknown {
    const { if: condition, then, else: otherwise } = childSchema;
    if (condition === undefined) {
      return target;
    }
    const branch = conditionHolds<S, F>(context, condition, source, rootSchema) ? then : otherwise;
    return branch === undefined ? target : omit(branch, source, path, target, false);
  }

  /** Applies the `oneOf` option the field shows to `source`, the best-matching one without a `fieldState`, merging
   * the result into `target`. When
   * `oneOf` is not an array or the schema represents a select widget (enum-driven), `target` is
   * returned unchanged. `additionalProperties: false` is relaxed on each option before scoring so that
   * `getClosestMatchingOption` can validate freely, but the original option schema is used for the
   * actual `omit` call.
   *
   * @param oneOf - The `oneOf` array from the schema, or `undefined`
   * @param childSchema - The parent schema containing the `oneOf` keyword
   * @param source - The current form data value used to score each option
   * @param target - The already-filtered value to merge the winning option's result into
   * @param path - The path of the value
   * @returns - The result of applying the best-matching option, or `target` when no matching applies
   */
  function handleOneOf(
    oneOf: S['oneOf'],
    childSchema: S,
    source: unknown,
    target: unknown,
    path: FieldPathList,
  ): unknown {
    // An `enum` or a list of constants is a select, whose value has no branch to omit extra data by
    if (!Array.isArray(oneOf) || Array.isArray(childSchema.enum) || isConstantOptionList<S>(oneOf)) {
      return target;
    }
    const discriminator = getDiscriminatorFieldFromSchema<S>(childSchema);
    const options = oneOf.map((option) =>
      isSchemaObject<S>(option) ? option : schemaFrom(rootSchema, option ? {} : { not: {} }),
    );
    // `additionalProperties: false` is relaxed for matching only, so the data's extra keys don't rule out the option
    // that is then applied with it, to omit them
    const bestIndex = fieldState
      ? fieldState.selectedOption(fieldPathFromList(path), options, source, discriminator)
      : closestOption<unknown, S, F>(context, rootSchema, source, oneOf, 0, true, discriminator);
    const winning: unknown = oneOf[bestIndex];
    const resolved: S = isSchemaObject<S>(winning)
      ? resolveOwnRef<S>(winning, rootSchema)
      : schemaOfBoolean(Boolean(winning), rootSchema);
    return omit(resolved, source, path, target, false);
  }

  /** Applies `anyOf` branches from `schema` to `source`, merging results into `target`. When `anyOf`
   * is absent or not an array, `target` is returned unchanged. For undefined or empty sources (so that
   * defaults can flow through all branches) every branch is applied in sequence. For non-empty sources
   * the best-matching branch is selected via `handleOneOf`.
   *
   * @param childSchema - The schema potentially containing an `anyOf` keyword
   * @param source - The current form data value; empty or undefined triggers all-branch application
   * @param target - The already-filtered value to merge branch results into
   * @param path - The path of the value
   * @returns - The result after applying the relevant `anyOf` branch(es), or `target` when inapplicable
   */
  function handleAnyOf(childSchema: S, source: unknown, target: unknown, path: FieldPathList): unknown {
    const { anyOf } = childSchema;
    if (!Array.isArray(anyOf)) {
      return target;
    }
    // For undefined or empty collections, apply every branch so defaults flow through.
    if (
      source === undefined ||
      (Array.isArray(source) && source.length === 0) ||
      (isObject(source) && Object.keys(source).length === 0)
    ) {
      let result = target;
      for (const branch of anyOf as (S | boolean)[]) {
        result = omit(branch, source, path, result, false);
      }
      return result;
    }
    return handleOneOf(anyOf, childSchema, source, target, path);
  }

  /** Applies schema-based `dependencies` from `schema` to `source`, merging each active dependency's
   * schema into `target` via `omit`. Property dependencies (plain string arrays) are skipped — only
   * schema dependencies are processed. A dependency is considered active when its trigger key is
   * present on `source`.
   *
   * @param childSchema - The schema potentially containing a `dependencies` keyword
   * @param source - The current form data value; must be a plain object for dependencies to apply
   * @param target - The already-filtered value to merge dependency results into
   * @param path - The path of the value
   * @returns - The result after applying all active schema dependencies, or `target` when inapplicable
   */
  function handleDependencies(childSchema: S, source: unknown, target: unknown, path: FieldPathList): unknown {
    const { dependencies } = childSchema;
    if (dependencies === undefined || !isObjectValue(source)) {
      return target;
    }
    let result = target;
    for (const [key, deps] of Object.entries(dependencies)) {
      // Skip property dependencies (string arrays); only process schema dependencies.
      if (key in source && !Array.isArray(deps)) {
        result = omit(deps, source, path, result, false);
      }
    }
    return result;
  }

  /** Each `allOf` schema merged once per call rather than once per data node. The `allOf` and its entries belong to
   * the schema, so the merge yields the same result every time, while `omit()` recurses per array element and per
   * object property: a 200-row array merged the same schema once a row. Keyed on the schema, so it is only valid for
   * this call's `rootSchema`, which is why it lives here rather than at module scope
   */
  const mergedAllOfSchemas = new WeakMap<object, S | JSONSchema7Definition>();

  /** Resolves the reference of one `allOf` entry. Only its own `$ref` needs resolving: the merge would hoist it rather
   * than follow it, where the ones below are resolved as `omit()` reaches them
   *
   * @param entry - The `allOf` entry to resolve, which a boolean shorthand leaves alone
   * @returns - The entry with its own reference resolved
   */
  function resolveAllOfEntry(entry: JSONSchema7Definition): JSONSchema7Definition {
    return isSchemaObject<S>(entry) ? resolveOwnRef<S>(entry, rootSchema) : entry;
  }

  /** Returns the merge of a schema's `allOf`, made once per schema object and remembered for the rest of this call.
   *
   * Each entry's own reference is resolved before merging, as the merge plan follows an entry's `$ref` before it merges
   * the entry into the parent. The shallow merge hoists an entry's `$ref` onto the merged
   * schema rather than following it, so the referenced schema's properties would be taken for extra data, and a
   * `customMergeAllOf` would be handed a `$ref` the form's own merge never sees.
   *
   * @param schemaDef - The schema carrying the `allOf`, which is what the merge is remembered under
   * @param allOf - The `allOf` entries to merge into it
   * @returns - The merged schema, or `undefined` for an `allOf` merged to `false`
   */
  function mergeAllOfOnce(schemaDef: S, allOf: NonNullable<S['allOf']>): S | undefined {
    let merged = mergedAllOfSchemas.get(schemaDef);
    if (merged === undefined) {
      merged = mergeAllOf<S, F>(context, { ...schemaDef, allOf: allOf.map(resolveAllOfEntry) });
      mergedAllOfSchemas.set(schemaDef, merged);
    }
    return isSchemaObject<S>(merged) ? merged : undefined;
  }

  /** Core recursive filter. Resolves `$ref`s, merges `allOf`, then delegates to the type-specific
   * handlers (`handleObject`, `handleArray`) and keyword handlers (`handleAnyOf`, `handleOneOf`,
   * `handleConditions`, `handleDependencies`). Returns `undefined` when `source` is undefined or
   * `schemaDef` is `false`; when `schemaDef` is `true` or empty returns `target ?? source` (when
   * `useSourceAsFallback` is true) or `target` (when false) to avoid aliasing `source` as the
   * accumulator across multiple compositional branches.
   *
   * @param schemaDef - The schema (or boolean shorthand) to filter `source` against
   * @param source - The raw form data value to filter
   * @param path - The path of the value
   * @param [target] - An optional accumulator carrying results from prior oneOf/anyOf processing
   * @param [useSourceAsFallback=true] - When false a permissive schema (`true`/`{}`) returns `target`
   *   rather than `source`, preventing compositional branches from aliasing the accumulator to `source`
   * @returns - The filtered value, or `undefined` when the schema rejects the value
   */
  function omit(
    schemaDef: unknown,
    source: unknown,
    path: FieldPathList,
    target?: unknown,
    useSourceAsFallback = true,
  ): unknown {
    if (source === undefined || schemaDef === false) {
      return undefined;
    }
    if (!isSchemaObject<S>(schemaDef) || Object.keys(schemaDef).length === 0) {
      return target ?? (useSourceAsFallback ? source : undefined);
    }

    let localSchema = schemaDef;
    const { $ref: ref, allOf } = localSchema;

    if (ref !== undefined) {
      return omit(resolveOwnRef<S>(localSchema, rootSchema), source, path, target, useSourceAsFallback);
    }
    if (allOf) {
      const merged = mergeAllOfOnce(localSchema, allOf);
      // An `allOf` holding a `false` merges to that `false`, the one boolean a merge yields — a `true` entry merges to
      // `{}` — and no value satisfies it. The keyword handlers below read nothing off a boolean, so the value would
      // otherwise reach the fallback that returns `source`, keeping even the keys the entries beside the `false`
      // describe nothing about
      if (merged === undefined) {
        return undefined;
      }
      localSchema = merged;
      // Schemas whose allOf entries contain if/then/else keywords may not fully merge: the merger
      // can only hoist one if/then/else triple to the parent level, so additional entries stay in
      // allOf. Process any that remain so their conditional properties are not silently dropped.
      // See: https://github.com/rjsf-team/react-jsonschema-form/issues/5142
      const remainingAllOf = localSchema.allOf;
      if (remainingAllOf) {
        for (let i = 0; i < remainingAllOf.length; i++) {
          // oxlint-disable-next-line no-param-reassign
          target = omit(remainingAllOf[i], source, path, target, false);
        }
      }
    }

    // The options of a select are read as the constants they name, as the form renders them, `$ref`s included
    localSchema = resolveConstantOptions<S>(localSchema, rootSchema);
    let filtered = handleAnyOf(
      localSchema,
      source,
      handleOneOf(localSchema.oneOf, localSchema, source, target, path),
      path,
    );

    // A select holds one of its constants as a whole, so an `object` or `array` one has no contents to prune. A value of
    // another type a `type` list allows is kept as it is, rather than pruned or dropped as the type the list resolves to
    const schemaType = isWholeValueSelect<S>(localSchema) ? undefined : getSchemaType<S>(localSchema);
    const type =
      Array.isArray(localSchema.type) && getSchemaTypeForValue<S>(localSchema, source) !== schemaType
        ? undefined
        : schemaType;
    if (type === 'object') {
      if (!isObjectValue(source)) {
        return undefined;
      }
      filtered = handleObject(localSchema, source, isObjectValue(filtered) ? filtered : {}, path);
    } else if (type === 'array') {
      if (!Array.isArray(source)) {
        return undefined;
      }
      if (localSchema.items !== undefined) {
        filtered = handleArray(localSchema, source, Array.isArray(filtered) ? filtered : [], path);
      }
    }

    // Post-prune after conditions (oneOf/anyOf/if-then) but BEFORE dependencies: keys added by
    // dependency sub-schemas are legitimate extensions of the allowed property set and must not be
    // pruned. Keys added only by winning conditional branches are still removed here so the result
    // honours additionalProperties:false.
    const afterConditions = handleConditions(localSchema, source, filtered, path);
    if (localSchema.additionalProperties === false && isObjectValue(afterConditions)) {
      const knownKeys = new Set(Object.keys(localSchema.properties ?? {}));
      for (const key of Object.keys(afterConditions)) {
        if (!knownKeys.has(key) && Object.keys(getMatchingPatternProperties<S>(localSchema, key)).length === 0) {
          delete afterConditions[key];
        }
      }
    }

    const result = handleDependencies(localSchema, source, afterConditions, path);

    return result ?? (useSourceAsFallback ? source : undefined);
  }

  return dataOf<T>(omit(schema, formData, []));
}
