import get from 'lodash/get';
import mergeAllOf from 'json-schema-merge-allof';

import { ALL_OF_NAME, DEPENDENCIES_NAME, REF_NAME } from '../constants';
import findSchemaDefinition from '../findSchemaDefinition';
import isObject from '../isObject';
import mergeSchemas from '../mergeSchemas';
import { GenericObjectType, RJSFSchema, RJSFSchemaDefinition, ValidatorType } from '../types';
import getMatchingOption from './getMatchingOption';
import stubExistingAdditionalProperties from './stubExistingAdditionalProperties';

/**
 * Resolves a conditional block (if/else/then) by removing the condition and merging the appropriate conditional branch with the rest of the schema
 */
function resolveCondition<T = any>(validator: ValidatorType, schema: RJSFSchema, rootSchema: RJSFSchema, formData: T) {
  let {
    if: expression,
    then,
    else: otherwise,
    ...resolvedSchemaLessConditional
  } = schema;

  const conditionalSchema = validator.isValid(expression, formData, rootSchema)
    ? then
    : otherwise;

  if (conditionalSchema) {
    return retrieveSchema<T>(
      validator,
      mergeSchemas(
        resolvedSchemaLessConditional,
        retrieveSchema(validator, conditionalSchema, rootSchema, formData)
      ),
      rootSchema,
      formData
    );
  } else {
    return retrieveSchema(validator, resolvedSchemaLessConditional, rootSchema, formData);
  }
}

/**
 * Resolves references and dependencies within a schema and its 'allOf' children.
 *
 * Called internally by retrieveSchema.
 */
function resolveSchema<T = any>(
  validator: ValidatorType, schema: RJSFSchema, rootSchema: RJSFSchema = {}, formData?: T
): RJSFSchema {
  if (schema.hasOwnProperty(REF_NAME)) {
    return resolveReference(validator, schema, rootSchema, formData);
  }
  if (schema.hasOwnProperty(DEPENDENCIES_NAME)) {
    const resolvedSchema = resolveDependencies(validator, schema, rootSchema, formData);
    return retrieveSchema(validator, resolvedSchema, rootSchema, formData);
  }
  if (schema.hasOwnProperty(ALL_OF_NAME)) {
    return {
      ...schema,
      allOf: schema.allOf!.map(allOfSubschema =>
        retrieveSchema(validator, allOfSubschema, rootSchema, formData)
      )
    };
  }
  // No $ref or dependencies attribute found, returning the original schema.
  return schema;
}

function resolveReference<T = any>(
  validator: ValidatorType, schema: RJSFSchema, rootSchema: RJSFSchema, formData: T
): RJSFSchema {
  // Retrieve the referenced schema definition.
  const $refSchema = findSchemaDefinition(schema.$ref, rootSchema);
  // Drop the $ref property of the source schema.
  const { $ref, ...localSchema } = schema;
  // Update referenced schema definition with local schema properties.
  return retrieveSchema(
    validator,
    { ...$refSchema, ...localSchema },
    rootSchema,
    formData
  );
}

export function retrieveSchema<T = any>(
  validator: ValidatorType, schema: RJSFSchema, rootSchema: RJSFSchema = {}, rawFormData?: T
): RJSFSchema {
  if (!isObject(schema)) {
    return {};
  }
  let resolvedSchema = resolveSchema(validator, schema, rootSchema, rawFormData);

  if (schema.hasOwnProperty('if')) {
    return resolveCondition(validator, schema, rootSchema, rawFormData);
  }

  const formData: GenericObjectType = rawFormData || {};
  // For each level of the dependency, we need to recursively determine the appropriate resolved schema given the current state of formData.
  // Otherwise, nested allOf subschemas will not be correctly displayed.
  if (resolvedSchema.properties) {
    const properties: GenericObjectType = {};

    Object.entries(resolvedSchema.properties).forEach(entries => {
      const propName = entries[0];
      const propSchema = entries[1] as RJSFSchema;
      const rawPropData = formData[propName];
      const propData = isObject(rawPropData) ? rawPropData : {};
      const resolvedPropSchema = retrieveSchema(
        validator,
        propSchema,
        rootSchema,
        propData
      );

      properties[propName] = resolvedPropSchema;

      if (
        propSchema !== resolvedPropSchema &&
        resolvedSchema.properties !== properties
      ) {
        resolvedSchema = { ...resolvedSchema, properties };
      }
    });
  }

  if ('allOf' in schema) {
    try {
      resolvedSchema = mergeAllOf({
        ...resolvedSchema,
        allOf: resolvedSchema.allOf,
      });
    } catch (e) {
      console.warn('could not merge subschemas in allOf:\n' + e);
      const { allOf, ...resolvedSchemaWithoutAllOf } = resolvedSchema;
      return resolvedSchemaWithoutAllOf;
    }
  }
  const hasAdditionalProperties =
    resolvedSchema.hasOwnProperty('additionalProperties') &&
    resolvedSchema.additionalProperties !== false;
  if (hasAdditionalProperties) {
    return stubExistingAdditionalProperties<T>(
      validator,
      resolvedSchema,
      rootSchema,
      formData as T
    );
  }
  return resolvedSchema;
}

export function resolveDependencies<T = any>(
  validator: ValidatorType, schema: RJSFSchema, rootSchema: RJSFSchema, formData: T
): RJSFSchema {
  // Drop the dependencies from the source schema.
  const { dependencies = {}, ...remainingSchema } = schema;
  let resolvedSchema =  remainingSchema;
  if (Array.isArray(resolvedSchema.oneOf)) {
    resolvedSchema =
      resolvedSchema.oneOf[
        getMatchingOption<T>(validator, formData, resolvedSchema.oneOf as RJSFSchema[], rootSchema)
      ] as RJSFSchema;
  } else if (Array.isArray(resolvedSchema.anyOf)) {
    resolvedSchema =
      resolvedSchema.anyOf[
        getMatchingOption<T>(validator, formData, resolvedSchema.anyOf as RJSFSchema[], rootSchema)
      ] as RJSFSchema;
  }
  return processDependencies<T>(
    validator,
    dependencies,
    resolvedSchema,
    rootSchema,
    formData
  );
}

function processDependencies<T = any>(
  validator: ValidatorType,
  dependencies: RJSFSchema['dependencies'],
  resolvedSchema: RJSFSchema,
  rootSchema: RJSFSchema,
  formData: T
): RJSFSchema {
  // Process dependencies updating the local schema properties as appropriate.
  for (const dependencyKey in dependencies) {
    // Skip this dependency if its trigger property is not present.
    if (get(formData, [dependencyKey]) === undefined) {
      continue;
    }
    // Skip this dependency if it is not included in the schema (such as when dependencyKey is itself a hidden dependency.)
    if (
      resolvedSchema.properties &&
      !(dependencyKey in resolvedSchema.properties)
    ) {
      continue;
    }
    const {
      [dependencyKey]: dependencyValue,
      ...remainingDependencies
    } = dependencies;
    if (Array.isArray(dependencyValue)) {
      resolvedSchema = withDependentProperties(resolvedSchema, dependencyValue);
    } else if (isObject(dependencyValue)) {
      resolvedSchema = withDependentSchema<T>(
        validator,
        resolvedSchema,
        rootSchema,
        formData,
        dependencyKey,
        dependencyValue as RJSFSchema
      );
    }
    return processDependencies<T>(
      validator,
      remainingDependencies,
      resolvedSchema,
      rootSchema,
      formData
    );
  }
  return resolvedSchema;
}

function withDependentProperties(schema: RJSFSchema, additionallyRequired: string[]) {
  if (!additionallyRequired) {
    return schema;
  }
  const required = Array.isArray(schema.required)
    ? Array.from(new Set([...schema.required, ...additionallyRequired]))
    : additionallyRequired;
  return { ...schema, required: required };
}

function withDependentSchema<T>(
  validator: ValidatorType,
  schema: RJSFSchema,
  rootSchema: RJSFSchema,
  formData: T,
  dependencyKey: string,
  dependencyValue: RJSFSchema
) {
  const { oneOf, ...dependentSchema } = retrieveSchema<T>(validator, dependencyValue, rootSchema, formData);
  schema = mergeSchemas(schema, dependentSchema);
  // Since it does not contain oneOf, we return the original schema.
  if (oneOf === undefined) {
    return schema;
  } else if (!Array.isArray(oneOf)) {
    throw new Error(`invalid: it is some ${typeof oneOf} instead of an array`);
  }
  // Resolve $refs inside oneOf.
  const resolvedOneOf = oneOf.map((subschema) => {
    if (typeof subschema !== 'boolean' || !subschema.hasOwnProperty(REF_NAME)) {
      return subschema;
    }
    return resolveReference<T>(validator, subschema as RJSFSchema, rootSchema, formData);
  });
  return withExactlyOneSubschema<T>(
    validator,
    schema,
    rootSchema,
    formData,
    dependencyKey,
    resolvedOneOf
  );
}

function withExactlyOneSubschema<T = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  rootSchema: RJSFSchema,
  formData: T,
  dependencyKey: string,
  oneOf: RJSFSchemaDefinition[]
) {
  const validSubschemas = oneOf.filter((subschema) => {
    if (typeof subschema === 'boolean' || !subschema.properties) {
      return false;
    }
    const { [dependencyKey]: conditionPropertySchema } = subschema.properties;
    if (conditionPropertySchema) {
      const conditionSchema: RJSFSchema = {
        type: 'object',
        properties: {
          [dependencyKey]: conditionPropertySchema,
        },
      };
      const { errors } = validator.validateFormData(formData, conditionSchema);
      return errors.length === 0;
    }
    return false;
  });

  if (validSubschemas.length !== 1) {
    console.warn(
      "ignoring oneOf in dependencies because there isn't exactly one subschema that is valid"
    );
    return schema;
  }
  const subschema: RJSFSchema = validSubschemas[0] as RJSFSchema;
  const {
    [dependencyKey]: conditionPropertySchema,
    ...dependentSubschema
  } = subschema.properties!;
  const dependentSchema = { ...subschema, properties: dependentSubschema };
  return mergeSchemas(
    schema,
    retrieveSchema<T>(validator, dependentSchema, rootSchema, formData)
  );
}
