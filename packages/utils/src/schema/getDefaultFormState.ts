import get from 'lodash/get';
import fill from 'lodash/fill';

import {
  ANY_OF_NAME,
  DEFAULT_NAME,
  DEPENDENCIES_NAME,
  PROPERTIES_NAME,
  ONE_OF_NAME,
  REF_NAME,
} from '../constants';
import findSchemaDefinition from '../findSchemaDefinition';
import getMatchingOption from './getMatchingOption';
import getSchemaType from '../getSchemaType';
import isObject from '../isObject';
import isFixedItems from '../isFixedItems';
import mergeDefaultsWithFormData from '../mergeDefaultsWithFormData';
import mergeObjects from '../mergeObjects';
import { GenericObjectType, RJSFSchema, ValidatorType } from '../types';
import isMultiSelect from './isMultiSelect';
import retrieveSchema, { resolveDependencies } from './retrieveSchema';

export function getSchemaItem(schema: RJSFSchema, idx = -1) {
  if (Array.isArray(schema.items) && idx >= 0 && idx < schema.items.length) {
    return schema.items[idx] as RJSFSchema;
  }
  if (schema.items && !Array.isArray(schema.items)) {
    return schema.items as RJSFSchema;
  }
  if (isObject(schema.additionalItems)) {
    return schema.additionalItems as RJSFSchema;
  }
  return {};
}

export function computeDefaults<T = any>(
  validator: ValidatorType,
  _schema: RJSFSchema,
  parentDefaults?: T,
  rootSchema: RJSFSchema = {},
  rawFormData?: T,
  includeUndefinedValues = false
): T | T[] | undefined {
  let schema = isObject(_schema) ? _schema : {};
  const formData = isObject(rawFormData) ? rawFormData : {};
  // Compute the defaults recursively: give highest priority to deepest nodes.
  let defaults: T | T[] | undefined = parentDefaults;
  if (isObject(defaults) && isObject(schema.default)) {
    // For object defaults, only override parent defaults that are defined in
    // schema.default.
    defaults = mergeObjects(defaults!, schema.default as GenericObjectType) as T;
  } else if (DEFAULT_NAME in schema) {
    defaults = schema.default as unknown as T;
  } else if (REF_NAME in schema) {
    // Use referenced schema defaults for this node.
    const refSchema = findSchemaDefinition(schema[REF_NAME]!, rootSchema);
    return computeDefaults<T>(
      validator,
      refSchema,
      defaults,
      rootSchema,
      formData as T,
      includeUndefinedValues
    );
  } else if (DEPENDENCIES_NAME in schema) {
    const resolvedSchema = resolveDependencies(validator, schema, rootSchema, formData);
    return computeDefaults<T>(
      validator,
      resolvedSchema,
      defaults,
      rootSchema,
      formData as T,
      includeUndefinedValues
    );
  } else if (isFixedItems(schema)) {
    defaults = (schema.items! as RJSFSchema[]).map((itemSchema: RJSFSchema, idx: number) =>
      computeDefaults<T>(
        validator,
        itemSchema,
        Array.isArray(parentDefaults) ? parentDefaults[idx] : undefined,
        rootSchema,
        formData as T,
        includeUndefinedValues
      )
    ) as T[];
  } else if (ONE_OF_NAME in schema) {
    schema = schema.oneOf![
      getMatchingOption(validator,undefined, schema.oneOf as RJSFSchema[], rootSchema)
    ] as RJSFSchema;
  } else if (ANY_OF_NAME in schema) {
    schema = schema.anyOf![
      getMatchingOption(validator,undefined, schema.anyOf as RJSFSchema[], rootSchema)
    ] as RJSFSchema;
  }

  // Not defaults defined for this node, fallback to generic typed ones.
  if (typeof defaults === 'undefined') {
    defaults = schema.default as unknown as T;
  }

  switch (getSchemaType(schema)) {
    // We need to recur for object schema inner default values.
    case 'object':
      return Object.keys(schema.properties || {}).reduce((acc: GenericObjectType, key: string) => {
        // Compute the defaults for this node, with the parent defaults we might
        // have from a previous run: defaults[key].
        const computedDefault = computeDefaults<T>(
          validator,
          get(schema, [PROPERTIES_NAME, key]),
          get(defaults, [key]),
          rootSchema,
          get(formData, [key]),
          includeUndefinedValues
        );
        if (includeUndefinedValues || computedDefault !== undefined) {
          acc[key] = computedDefault;
        }
        return acc;
      }, {}) as T;

    case 'array':
      // Inject defaults into existing array defaults
      if (Array.isArray(defaults)) {
        defaults = defaults.map((item, idx) => {
          const schemaItem = getSchemaItem(schema, idx);
          return computeDefaults<T>(
            validator,
            schemaItem,
            item,
            rootSchema
          );
        }) as T[];
      }

      // Deeply inject defaults into already existing form data
      if (Array.isArray(rawFormData)) {
        defaults = rawFormData.map((item: T, idx: number) => {
          return computeDefaults<T>(
            validator,
            getSchemaItem(schema, idx),
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
            const fillerSchema: RJSFSchema = getSchemaItem(schema);
            const fillerDefault = fillerSchema.default;
            const fillerEntries: T[] = fill(
              new Array(schema.minItems - defaultsLength),
              computeDefaults<any>(validator, fillerSchema, fillerDefault, rootSchema)
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

export default function getDefaultFormState<T = any>(
  validator: ValidatorType,
  _schema: RJSFSchema,
  formData?: T,
  rootSchema: RJSFSchema = {},
  includeUndefinedValues = false
) {
  if (!isObject(_schema)) {
    throw new Error('Invalid schema: ' + _schema);
  }
  const schema = retrieveSchema<T>(validator, _schema, rootSchema, formData);
  const defaults = computeDefaults<T>(
    validator,
    schema,
    undefined,
    rootSchema,
    formData,
    includeUndefinedValues
  );
  if (typeof formData === 'undefined' || formData === null || (typeof formData === 'number' && isNaN(formData))) {
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
