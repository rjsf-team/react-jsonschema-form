import { JSONSchema7 } from 'json-schema';
import mergeAllOf from 'json-schema-merge-allof';
/**
 * Resolves a conditional block (if/else/then) by removing the condition and merging the appropriate conditional branch with the rest of the schema
 */
function resolveCondition<T>(schema: JSONSchema7, rootSchema: JSONSchema7, formData: T) {
  let {
    if: expression,
    then,
    else: otherwise,
    ...resolvedSchemaLessConditional
  } = schema;

  const conditionalSchema = isValid(expression, formData, rootSchema)
    ? then
    : otherwise;

  if (conditionalSchema) {
    return retrieveSchema(
      mergeSchemas(
        resolvedSchemaLessConditional,
        retrieveSchema(conditionalSchema, rootSchema, formData)
      ),
      rootSchema,
      formData
    );
  } else {
    return retrieveSchema(resolvedSchemaLessConditional, rootSchema, formData);
  }
}
import { ALL_OF_NAME, DEPENDENCIES_NAME, REF_NAME } from '../constants';

/**
 * Resolves references and dependencies within a schema and its 'allOf' children.
 *
 * Called internally by retrieveSchema.
 */
function resolveSchema<T = any>(schema: JSONSchema7, rootSchema: JSONSchema7 = {}, formData: T = {}) {
  if (schema.hasOwnProperty(REF_NAME)) {
    return resolveReference(schema, rootSchema, formData);
  } else if (schema.hasOwnProperty(DEPENDENCIES_NAME)) {
    const resolvedSchema = resolveDependencies(schema, rootSchema, formData);
    return retrieveSchema(resolvedSchema, rootSchema, formData);
  } else if (schema.hasOwnProperty(ALL_OF_NAME)) {
    return {
      ...schema,
      allOf: schema.allOf!.map(allOfSubschema =>
      retrieveSchema(allOfSubschema, rootSchema, formData)
    ),
  };
  } else {
    // No $ref or dependencies attribute found, returning the original schema.
    return schema;
  }
}

function resolveReference(schema, rootSchema, formData) {
  // Retrieve the referenced schema definition.
  const $refSchema = findSchemaDefinition(schema.$ref, rootSchema);
  // Drop the $ref property of the source schema.
  const { $ref, ...localSchema } = schema;
  // Update referenced schema definition with local schema properties.
  return retrieveSchema(
    { ...$refSchema, ...localSchema },
    rootSchema,
    formData
  );
}

export function retrieveSchema(schema, rootSchema = {}, formData = {}) {
  if (!isObject(schema)) {
    return {};
  }
  let resolvedSchema = resolveSchema(schema, rootSchema, formData);

  if (schema.hasOwnProperty('if')) {
    return resolveCondition(schema, rootSchema, formData);
  }

  // For each level of the dependency, we need to recursively determine the appropriate resolved schema given the current state of formData.
  // Otherwise, nested allOf subschemas will not be correctly displayed.
  if (resolvedSchema.properties) {
    const properties = {};

    Object.entries(resolvedSchema.properties).forEach(entries => {
      const propName = entries[0];
      const propSchema = entries[1];
      const rawPropData = formData && formData[propName];
      const propData = isObject(rawPropData) ? rawPropData : {};
      const resolvedPropSchema = retrieveSchema(
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
    return stubExistingAdditionalProperties(
      resolvedSchema,
      rootSchema,
      formData
    );
  }
  return resolvedSchema;
}

function resolveDependencies(schema, rootSchema, formData) {
  // Drop the dependencies from the source schema.
  let { dependencies = {}, ...resolvedSchema } = schema;
  if ('oneOf' in resolvedSchema) {
    resolvedSchema =
      resolvedSchema.oneOf[
        getMatchingOption(formData, resolvedSchema.oneOf, rootSchema)
      ];
  } else if ('anyOf' in resolvedSchema) {
    resolvedSchema =
      resolvedSchema.anyOf[
        getMatchingOption(formData, resolvedSchema.anyOf, rootSchema)
      ];
  }
  return processDependencies(
    dependencies,
    resolvedSchema,
    rootSchema,
    formData
  );
}

function processDependencies(
  dependencies,
  resolvedSchema,
  rootSchema,
  formData
) {
  // Process dependencies updating the local schema properties as appropriate.
  for (const dependencyKey in dependencies) {
    // Skip this dependency if its trigger property is not present.
    if (formData[dependencyKey] === undefined) {
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
      resolvedSchema = withDependentSchema(
        resolvedSchema,
        rootSchema,
        formData,
        dependencyKey,
        dependencyValue
      );
    }
    return processDependencies(
      remainingDependencies,
      resolvedSchema,
      rootSchema,
      formData
    );
  }
  return resolvedSchema;
}

function withDependentProperties(schema, additionallyRequired) {
  if (!additionallyRequired) {
    return schema;
  }
  const required = Array.isArray(schema.required)
    ? Array.from(new Set([...schema.required, ...additionallyRequired]))
    : additionallyRequired;
  return { ...schema, required: required };
}

function withDependentSchema(
  schema,
  rootSchema,
  formData,
  dependencyKey,
  dependencyValue
) {
  let { oneOf, ...dependentSchema } = retrieveSchema(
    dependencyValue,
    rootSchema,
    formData
  );
  schema = mergeSchemas(schema, dependentSchema);
  // Since it does not contain oneOf, we return the original schema.
  if (oneOf === undefined) {
    return schema;
  } else if (!Array.isArray(oneOf)) {
    throw new Error(`invalid: it is some ${typeof oneOf} instead of an array`);
  }
  // Resolve $refs inside oneOf.
  const resolvedOneOf = oneOf.map(subschema =>
    subschema.hasOwnProperty('$ref')
      ? resolveReference(subschema, rootSchema, formData)
      : subschema
  );
  return withExactlyOneSubschema(
    schema,
    rootSchema,
    formData,
    dependencyKey,
    resolvedOneOf
  );
}

function withExactlyOneSubschema(
  schema,
  rootSchema,
  formData,
  dependencyKey,
  oneOf
) {
  const validSubschemas = oneOf.filter(subschema => {
    if (!subschema.properties) {
      return false;
    }
    const { [dependencyKey]: conditionPropertySchema } = subschema.properties;
    if (conditionPropertySchema) {
      const conditionSchema = {
        type: 'object',
        properties: {
          [dependencyKey]: conditionPropertySchema,
        },
      };
      const { errors } = validateFormData(formData, conditionSchema);
      return errors.length === 0;
    }
  });
  if (validSubschemas.length !== 1) {
    console.warn(
      "ignoring oneOf in dependencies because there isn't exactly one subschema that is valid"
    );
    return schema;
  }
  const subschema = validSubschemas[0];
  const {
    [dependencyKey]: conditionPropertySchema,
    ...dependentSubschema
  } = subschema.properties;
  const dependentSchema = { ...subschema, properties: dependentSubschema };
  return mergeSchemas(
    schema,
    retrieveSchema(dependentSchema, rootSchema, formData)
  );
}
