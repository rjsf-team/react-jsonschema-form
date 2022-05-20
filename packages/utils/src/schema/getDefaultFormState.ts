import { JSONSchema7 } from 'json-schema';
import fill from 'lodash/fill';

import findSchemaDefinition from './findSchemaDefinition';
import getMatchingOption from './getMatchingOption';
import getSchemaType from './getSchemaType';
import isObject from './isObject';
import isFixedItems from './isFixedItems';
import isMultiSelect from './isMultiSelect';
import mergeDefaultsWithFormData from './mergeDefaultsWithFormData';
import mergeObjects from './mergeObjects';
import { GenericObjectType } from 'types';

export function computeDefaults<T = any>(
  _schema: JSONSchema7,
  parentDefaults: T,
  rootSchema: JSONSchema7,
  rawFormData: T,
  includeUndefinedValues = false
): T | T[] {
  let schema = isObject(_schema) ? _schema : {};
  const formData = isObject(rawFormData) ? rawFormData : {};
  // Compute the defaults recursively: give highest priority to deepest nodes.
  let defaults: T = parentDefaults;
  if (isObject(defaults) && isObject(schema.default)) {
    // For object defaults, only override parent defaults that are defined in
    // schema.default.
    defaults = mergeObjects(defaults, schema.default as GenericObjectType) as T;
  } else if ('default' in schema) {
    // Use schema defaults for this node.
    defaults = schema.default as T;
  } else if ('$ref' in schema) {
    // Use referenced schema defaults for this node.
    const refSchema = findSchemaDefinition(schema.$ref!, rootSchema);
    return computeDefaults<T>(
      refSchema,
      defaults,
      rootSchema,
      formData,
      includeUndefinedValues
    );
  } else if ('dependencies' in schema) {
    const resolvedSchema = resolveDependencies(schema, rootSchema, formData);
    return computeDefaults<T>(
      resolvedSchema,
      defaults,
      rootSchema,
      formData,
      includeUndefinedValues
    );
  } else if (isFixedItems(schema)) {
    defaults = schema.items.map((itemSchema, idx) =>
      computeDefaults<T>(
        itemSchema,
        Array.isArray(parentDefaults) ? parentDefaults[idx] : undefined,
        rootSchema,
        formData,
        includeUndefinedValues
      )
    );
  } else if ('oneOf' in schema) {
    schema =
      schema.oneOf[getMatchingOption(undefined, schema.oneOf, rootSchema)];
  } else if ('anyOf' in schema) {
    schema =
      schema.anyOf[getMatchingOption(undefined, schema.anyOf, rootSchema)];
  }

  // Not defaults defined for this node, fallback to generic typed ones.
  if (typeof defaults === 'undefined') {
    defaults = schema.default;
  }

  switch (getSchemaType(schema)) {
    // We need to recur for object schema inner default values.
    case 'object':
      return Object.keys(schema.properties || {}).reduce((acc, key) => {
        // Compute the defaults for this node, with the parent defaults we might
        // have from a previous run: defaults[key].
        let computedDefault = computeDefaults<T>(
          schema.properties[key],
          (defaults || {})[key],
          rootSchema,
          (formData || {})[key],
          includeUndefinedValues
        );
        if (includeUndefinedValues || computedDefault !== undefined) {
          acc[key] = computedDefault;
        }
        return acc;
      }, {});

    case 'array':
      // Inject defaults into existing array defaults
      if (Array.isArray(defaults)) {
        defaults = defaults.map((item, idx) => {
          return computeDefaults<T>(
            schema.items[idx] || schema.additionalItems || {},
            item,
            rootSchema
          );
        });
      }

      // Deeply inject defaults into already existing form data
      if (Array.isArray(rawFormData)) {
        defaults = rawFormData.map((item, idx) => {
          return computeDefaults<T>(
            schema.items,
            (defaults || {})[idx],
            rootSchema,
            item
          );
        });
      }
      if (schema.minItems) {
        if (!isMultiSelect(schema, rootSchema)) {
          const defaultsLength = defaults ? defaults.length : 0;
          if (schema.minItems > defaultsLength) {
            const defaultEntries = defaults || [];
            // populate the array with the defaults
            const fillerSchema = Array.isArray(schema.items)
              ? schema.additionalItems
              : schema.items;
            const fillerEntries = fill(
              new Array(schema.minItems - defaultsLength),
              computeDefaults<T[]>(fillerSchema, fillerSchema.defaults, rootSchema)
            );
            // then fill up the rest with either the item default or empty, up to minItems

            return defaultEntries.concat(fillerEntries);
          }
        } else {
          return defaults ? defaults : [];
        }
      }
  }
  return defaults;
}

export default function getDefaultFormState<T = any>(
  _schema: JSONSchema7,
  formData: T,
  rootSchema: JSONSchema7 = {},
  includeUndefinedValues = false
) {
  if (!isObject(_schema)) {
    throw new Error('Invalid schema: ' + _schema);
  }
  const schema = retrieveSchema(_schema, rootSchema, formData);
  const defaults = computeDefaults(
    schema,
    _schema.default,
    rootSchema,
    formData,
    includeUndefinedValues
  );
  if (typeof formData === 'undefined' || formData === null) {
    // No form data? Use schema defaults.
    return defaults;
  }
  if (isObject(formData) || Array.isArray(formData)) {
    return mergeDefaultsWithFormData<T>(defaults, formData);
  }
  return formData;
}
