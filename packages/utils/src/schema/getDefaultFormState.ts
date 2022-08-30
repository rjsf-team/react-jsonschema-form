import get from "lodash/get";

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
import { GenericObjectType, RJSFSchema, ValidatorType } from "../types";
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
export function getInnerSchemaForArrayItem(
  schema: RJSFSchema,
  additionalItems: AdditionalItemsHandling = AdditionalItemsHandling.Ignore,
  idx = -1
): RJSFSchema {
  if (idx >= 0) {
    if (Array.isArray(schema.items) && idx < schema.items.length) {
      const item = schema.items[idx];
      if (typeof item !== "boolean") {
        return item;
      }
    }
  } else if (
    schema.items &&
    !Array.isArray(schema.items) &&
    typeof schema.items !== "boolean"
  ) {
    return schema.items;
  }
  if (
    additionalItems !== AdditionalItemsHandling.Ignore &&
    isObject(schema.additionalItems)
  ) {
    return schema.additionalItems as RJSFSchema;
  }
  return {};
}

/** Computes the defaults for the current `schema` given the `rawFormData` and `parentDefaults` if any. This drills into
 * the each level of the schema, recursively, to fill out every level of defaults provided by the schema.
 *
 * @param validator - an implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the default state is desired
 * @param [parentDefaults] - Any defaults provided by the parent field in the schema
 * @param [rootSchema] - The options root schema, used to primarily to look up `$ref`s
 * @param [rawFormData] - The current formData, if any, onto which to provide any missing defaults
 * @param [includeUndefinedValues=false] - Optional flag, if true, cause undefined values to be added as defaults
 * @returns - The resulting `formData` with all the defaults provided
 */
export function computeDefaults<T = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  parentDefaults?: T,
  rootSchema: RJSFSchema = {},
  rawFormData?: T,
  includeUndefinedValues = false
): T | T[] | undefined {
  const formData = isObject(rawFormData) ? rawFormData : {};
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
    const refSchema = findSchemaDefinition(schema[REF_KEY]!, rootSchema);
    return computeDefaults<T>(
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
    return computeDefaults<T>(
      validator,
      resolvedSchema,
      defaults,
      rootSchema,
      formData as T,
      includeUndefinedValues
    );
  } else if (isFixedItems(schema)) {
    defaults = (schema.items! as RJSFSchema[]).map(
      (itemSchema: RJSFSchema, idx: number) =>
        computeDefaults<T>(
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
        undefined,
        schema.oneOf as RJSFSchema[],
        rootSchema
      )
    ] as RJSFSchema;
  } else if (ANY_OF_KEY in schema) {
    schema = schema.anyOf![
      getMatchingOption(
        validator,
        undefined,
        schema.anyOf as RJSFSchema[],
        rootSchema
      )
    ] as RJSFSchema;
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
          const computedDefault = computeDefaults<T>(
            validator,
            get(schema, [PROPERTIES_KEY, key]),
            get(defaults, [key]),
            rootSchema,
            get(formData, [key]),
            includeUndefinedValues
          );
          if (includeUndefinedValues || computedDefault !== undefined) {
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
          const schemaItem: RJSFSchema = getInnerSchemaForArrayItem(
            schema,
            AdditionalItemsHandling.Fallback,
            idx
          );
          return computeDefaults<T>(validator, schemaItem, item, rootSchema);
        }) as T[];
      }

      // Deeply inject defaults into already existing form data
      if (Array.isArray(rawFormData)) {
        const schemaItem: RJSFSchema = getInnerSchemaForArrayItem(schema);
        defaults = rawFormData.map((item: T, idx: number) => {
          return computeDefaults<T>(
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
            const fillerSchema: RJSFSchema = getInnerSchemaForArrayItem(
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
 * @param [includeUndefinedValues=false] - Optional flag, if true, cause undefined values to be added as defaults
 * @returns - The resulting `formData` with all the defaults provided
 */
export default function getDefaultFormState<T = any>(
  validator: ValidatorType,
  theSchema: RJSFSchema,
  formData?: T,
  rootSchema?: RJSFSchema,
  includeUndefinedValues = false
) {
  if (!isObject(theSchema)) {
    throw new Error("Invalid schema: " + theSchema);
  }
  const schema = retrieveSchema<T>(validator, theSchema, rootSchema, formData);
  const defaults = computeDefaults<T>(
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
