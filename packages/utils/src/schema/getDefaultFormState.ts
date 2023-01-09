import get from "lodash/get";
import isEmpty from "lodash/isEmpty";

import {
  ANY_OF_KEY,
  DEFAULT_KEY,
  DEPENDENCIES_KEY,
  PROPERTIES_KEY,
  ONE_OF_KEY,
  REF_KEY,
} from "../constants";
import findSchemaDefinition from "../findSchemaDefinition";
import getMatchingOption from "./getMatchingOption";
import getSchemaType from "../getSchemaType";
import isObject from "../isObject";
import isFixedItems from "../isFixedItems";
import mergeDefaultsWithFormData from "../mergeDefaultsWithFormData";
import mergeObjects from "../mergeObjects";
import {
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  ValidatorType,
} from "../types";
import isMultiSelect from "./isMultiSelect";
import retrieveSchema, { resolveDependencies } from "./retrieveSchema";

/** Enum that indicates how `schema.additionalItems` should be handled by the `getInnerSchemaForArrayItem()` function.
 */
export enum AdditionalItemsHandling {
  Ignore,
  Invert,
  Fallback,
}

/** Given a `schema` will return an inner schema that for an array item. This is computed differently based on the
 * `additionalItems` enum and the value of `idx`. There are four possible returns:
 * 1. If `idx` is >= 0, then if `schema.items` is an array the `idx`th element of the array is returned if it is a valid
 *    index and not a boolean, otherwise it falls through to 3.
 * 2. If `schema.items` is not an array AND truthy and not a boolean, then `schema.items` is returned since it actually
 *    is a schema, otherwise it falls through to 3.
 * 3. If `additionalItems` is not `AdditionalItemsHandling.Ignore` and `schema.additionalItems` is an object, then
 *    `schema.additionalItems` is returned since it actually is a schema, otherwise it falls through to 4.
 * 4. {} is returned representing an empty schema
 *
 * @param schema - The schema from which to get the particular item
 * @param [additionalItems=AdditionalItemsHandling.Ignore] - How do we want to handle additional items?
 * @param [idx=-1] - Index, if non-negative, will be used to return the idx-th element in a `schema.items` array
 * @returns - The best fit schema object from the `schema` given the `additionalItems` and `idx` modifiers
 */
export function getInnerSchemaForArrayItem<
  S extends StrictRJSFSchema = RJSFSchema
>(
  schema: S,
  additionalItems: AdditionalItemsHandling = AdditionalItemsHandling.Ignore,
  idx = -1
): S {
  if (idx >= 0) {
    if (Array.isArray(schema.items) && idx < schema.items.length) {
      const item = schema.items[idx];
      if (typeof item !== "boolean") {
        return item as S;
      }
    }
  } else if (
    schema.items &&
    !Array.isArray(schema.items) &&
    typeof schema.items !== "boolean"
  ) {
    return schema.items as S;
  }
  if (
    additionalItems !== AdditionalItemsHandling.Ignore &&
    isObject(schema.additionalItems)
  ) {
    return schema.additionalItems as S;
  }
  return {} as S;
}

/** Computes the defaults for the current `schema` given the `rawFormData` and `parentDefaults` if any. This drills into
 * each level of the schema, recursively, to fill out every level of defaults provided by the schema.
 *
 * @param validator - an implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the default state is desired
 * @param [parentDefaults] - Any defaults provided by the parent field in the schema
 * @param [rootSchema] - The options root schema, used to primarily to look up `$ref`s
 * @param [rawFormData] - The current formData, if any, onto which to provide any missing defaults
 * @param [includeUndefinedValues=false] - Optional flag, if true, cause undefined values to be added as defaults.
 *          If "excludeObjectChildren", pass `includeUndefinedValues` as false when computing defaults for any nested
 *          object properties.
 * @returns - The resulting `formData` with all the defaults provided
 */
export function computeDefaults<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema
>(
  validator: ValidatorType<T, S>,
  rawSchema: S,
  parentDefaults?: T,
  rootSchema: S = {} as S,
  rawFormData?: T,
  includeUndefinedValues: boolean | "excludeObjectChildren" = false
): T | T[] | undefined {
  const formData = isObject(rawFormData) ? rawFormData : {};
  let schema: S = isObject(rawSchema) ? rawSchema : ({} as S);
  // Compute the defaults recursively: give highest priority to deepest nodes.
  let defaults: T | T[] | undefined = parentDefaults;
  if (isObject(defaults) && isObject(schema.default)) {
    // For object defaults, only override parent defaults that are defined in
    // schema.default.
    defaults = mergeObjects(
      defaults!,
      schema.default as GenericObjectType
    ) as T;
  } else if (DEFAULT_KEY in schema) {
    defaults = schema.default as unknown as T;
  } else if (REF_KEY in schema) {
    // Use referenced schema defaults for this node.
    const refSchema = findSchemaDefinition<S>(schema[REF_KEY]!, rootSchema);
    return computeDefaults<T, S>(
      validator,
      refSchema,
      defaults,
      rootSchema,
      formData as T,
      includeUndefinedValues
    );
  } else if (DEPENDENCIES_KEY in schema) {
    const resolvedSchema = resolveDependencies(
      validator,
      schema,
      rootSchema,
      formData
    );
    return computeDefaults<T, S>(
      validator,
      resolvedSchema,
      defaults,
      rootSchema,
      formData as T,
      includeUndefinedValues
    );
  } else if (isFixedItems(schema)) {
    defaults = (schema.items! as S[]).map((itemSchema: S, idx: number) =>
      computeDefaults<T, S>(
        validator,
        itemSchema,
        Array.isArray(parentDefaults) ? parentDefaults[idx] : undefined,
        rootSchema,
        formData as T,
        includeUndefinedValues
      )
    ) as T[];
  } else if (ONE_OF_KEY in schema) {
    schema = schema.oneOf![
      getMatchingOption(
        validator,
        isEmpty(formData) ? undefined : formData,
        schema.oneOf as S[],
        rootSchema
      )
    ] as S;
  } else if (ANY_OF_KEY in schema) {
    schema = schema.anyOf![
      getMatchingOption(
        validator,
        isEmpty(formData) ? undefined : formData,
        schema.anyOf as S[],
        rootSchema
      )
    ] as S;
  }

  // Not defaults defined for this node, fallback to generic typed ones.
  if (typeof defaults === "undefined") {
    defaults = schema.default as unknown as T;
  }

  switch (getSchemaType(schema)) {
    // We need to recur for object schema inner default values.
    case "object":
      return Object.keys(schema.properties || {}).reduce(
        (acc: GenericObjectType, key: string) => {
          // Compute the defaults for this node, with the parent defaults we might
          // have from a previous run: defaults[key].
          const computedDefault = computeDefaults<T, S>(
            validator,
            get(schema, [PROPERTIES_KEY, key]),
            get(defaults, [key]),
            rootSchema,
            get(formData, [key]),
            includeUndefinedValues === "excludeObjectChildren"
              ? false
              : includeUndefinedValues
          );
          if (includeUndefinedValues) {
            acc[key] = computedDefault;
          } else if (isObject(computedDefault)) {
            // Store computedDefault if it's a non-empty object (e.g. not {})
            if (!isEmpty(computedDefault)) {
              acc[key] = computedDefault;
            }
          } else if (computedDefault !== undefined) {
            // Store computedDefault if it's a defined primitive (e.g. true)
            acc[key] = computedDefault;
          }
          return acc;
        },
        {}
      ) as T;

    case "array":
      // Inject defaults into existing array defaults
      if (Array.isArray(defaults)) {
        defaults = defaults.map((item, idx) => {
          const schemaItem: S = getInnerSchemaForArrayItem<S>(
            schema,
            AdditionalItemsHandling.Fallback,
            idx
          );
          return computeDefaults<T, S>(validator, schemaItem, item, rootSchema);
        }) as T[];
      }

      // Deeply inject defaults into already existing form data
      if (Array.isArray(rawFormData)) {
        const schemaItem: S = getInnerSchemaForArrayItem<S>(schema);
        defaults = rawFormData.map((item: T, idx: number) => {
          return computeDefaults<T, S>(
            validator,
            schemaItem,
            get(defaults, [idx]),
            rootSchema,
            item
          );
        }) as T[];
      }
      if (schema.minItems) {
        if (!isMultiSelect<T>(validator, schema, rootSchema)) {
          const defaultsLength = Array.isArray(defaults) ? defaults.length : 0;
          if (schema.minItems > defaultsLength) {
            const defaultEntries: T[] = (defaults || []) as T[];
            // populate the array with the defaults
            const fillerSchema: S = getInnerSchemaForArrayItem<S>(
              schema,
              AdditionalItemsHandling.Invert
            );
            const fillerDefault = fillerSchema.default;
            const fillerEntries: T[] = new Array(
              schema.minItems - defaultsLength
            ).fill(
              computeDefaults<any>(
                validator,
                fillerSchema,
                fillerDefault,
                rootSchema
              )
            ) as T[];
            // then fill up the rest with either the item default or empty, up to minItems
            return defaultEntries.concat(fillerEntries);
          }
        }
        return defaults ? defaults : [];
      }
  }
  return defaults;
}

/** Returns the superset of `formData` that includes the given set updated to include any missing fields that have
 * computed to have defaults provided in the `schema`.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param theSchema - The schema for which the default state is desired
 * @param [formData] - The current formData, if any, onto which to provide any missing defaults
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [includeUndefinedValues=false] - Optional flag, if true, cause undefined values to be added as defaults.
 *          If "excludeObjectChildren", pass `includeUndefinedValues` as false when computing defaults for any nested
 *          object properties.
 * @returns - The resulting `formData` with all the defaults provided
 */
export default function getDefaultFormState<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema
>(
  validator: ValidatorType<T, S>,
  theSchema: S,
  formData?: T,
  rootSchema?: S,
  includeUndefinedValues: boolean | "excludeObjectChildren" = false
) {
  if (!isObject(theSchema)) {
    throw new Error("Invalid schema: " + theSchema);
  }
  const schema = retrieveSchema<T, S>(
    validator,
    theSchema,
    rootSchema,
    formData
  );
  const defaults = computeDefaults<T, S>(
    validator,
    schema,
    undefined,
    rootSchema,
    formData,
    includeUndefinedValues
  );
  if (
    typeof formData === "undefined" ||
    formData === null ||
    (typeof formData === "number" && isNaN(formData))
  ) {
    // No form data? Use schema defaults.
    return defaults;
  }
  if (isObject(formData)) {
    return mergeDefaultsWithFormData<T>(defaults as T, formData);
  }
  if (Array.isArray(formData)) {
    return mergeDefaultsWithFormData<T[]>(defaults as T[], formData);
  }
  return formData;
}
