import get from "lodash/get";
import set from "lodash/set";
import mergeAllOf from "json-schema-merge-allof";

import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  DEPENDENCIES_KEY,
  REF_KEY,
} from "../constants";
import findSchemaDefinition, {
  splitKeyElementFromObject,
} from "../findSchemaDefinition";
import guessType from "../guessType";
import isObject from "../isObject";
import mergeSchemas from "../mergeSchemas";
import {
  GenericObjectType,
  RJSFSchema,
  RJSFSchemaDefinition,
  ValidatorType,
} from "../types";
import getMatchingOption from "./getMatchingOption";

/** Resolves a conditional block (if/else/then) by removing the condition and merging the appropriate conditional branch
 * with the rest of the schema
 *
 * @param validator - An implementation of the `ValidatorType` interface that is used to detect valid schema conditions
 * @param schema - The schema for which resolving a condition is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param formData - The current formData to assist retrieving a schema
 * @returns - A schema with the appropriate condition resolved
 */
export function resolveCondition<T = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  rootSchema: RJSFSchema,
  formData: T
) {
  const {
    if: expression,
    then,
    else: otherwise,
    ...resolvedSchemaLessConditional
  } = schema;

  const conditionalSchema = validator.isValid(
    expression as RJSFSchema,
    formData,
    rootSchema
  )
    ? then
    : otherwise;

  if (conditionalSchema && typeof conditionalSchema !== "boolean") {
    return retrieveSchema<T>(
      validator,
      mergeSchemas(
        resolvedSchemaLessConditional,
        retrieveSchema(validator, conditionalSchema, rootSchema, formData)
      ),
      rootSchema,
      formData
    );
  }
  return retrieveSchema<T>(
    validator,
    resolvedSchemaLessConditional,
    rootSchema,
    formData
  );
}

/** Resolves references and dependencies within a schema and its 'allOf' children.
 * Called internally by retrieveSchema.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a schema is desired
 * @param [rootSchema={}] - The root schema that will be forwarded to all the APIs
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @returns - The schema having its references and dependencies resolved
 */
export function resolveSchema<T = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  rootSchema: RJSFSchema = {},
  formData?: T
): RJSFSchema {
  if (REF_KEY in schema) {
    return resolveReference<T>(validator, schema, rootSchema, formData);
  }
  if (DEPENDENCIES_KEY in schema) {
    const resolvedSchema = resolveDependencies<T>(
      validator,
      schema,
      rootSchema,
      formData
    );
    return retrieveSchema<T>(validator, resolvedSchema, rootSchema, formData);
  }
  if (ALL_OF_KEY in schema) {
    return {
      ...schema,
      allOf: schema.allOf!.map((allOfSubschema) =>
        retrieveSchema<T>(
          validator,
          allOfSubschema as RJSFSchema,
          rootSchema,
          formData
        )
      ),
    };
  }
  // No $ref or dependencies attribute found, returning the original schema.
  return schema;
}

/** Resolves references within a schema and its 'allOf' children.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a reference is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @returns - The schema having its references resolved
 */
export function resolveReference<T = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  rootSchema: RJSFSchema,
  formData?: T
): RJSFSchema {
  // Retrieve the referenced schema definition.
  const $refSchema = findSchemaDefinition(schema.$ref, rootSchema);
  // Drop the $ref property of the source schema.
  const { $ref, ...localSchema } = schema;
  // Update referenced schema definition with local schema properties.
  return retrieveSchema<T>(
    validator,
    { ...$refSchema, ...localSchema },
    rootSchema,
    formData
  );
}

/** Creates new 'properties' items for each key in the `formData`
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param theSchema - The schema for which the existing additional properties is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s * @param validator
 * @param [aFormData] - The current formData, if any, to assist retrieving a schema
 * @returns - The updated schema with additional properties stubbed
 */
export function stubExistingAdditionalProperties<T = any>(
  validator: ValidatorType,
  theSchema: RJSFSchema,
  rootSchema?: RJSFSchema,
  aFormData?: T
): RJSFSchema {
  // Clone the schema so we don't ruin the consumer's original
  const schema = {
    ...theSchema,
    properties: { ...theSchema.properties },
  };

  // make sure formData is an object
  const formData: GenericObjectType =
    aFormData && isObject(aFormData) ? aFormData : {};
  Object.keys(formData).forEach((key) => {
    if (key in schema.properties) {
      // No need to stub, our schema already has the property
      return;
    }

    let additionalProperties: RJSFSchema = {};
    if (typeof schema.additionalProperties !== "boolean") {
      if (REF_KEY in schema.additionalProperties!) {
        additionalProperties = retrieveSchema<T>(
          validator,
          { $ref: get(schema.additionalProperties, [REF_KEY]) },
          rootSchema,
          formData as T
        );
      } else if ("type" in schema.additionalProperties!) {
        additionalProperties = { ...schema.additionalProperties };
      } else {
        additionalProperties = { type: guessType(get(formData, [key])) };
      }
    } else {
      additionalProperties = { type: guessType(get(formData, [key])) };
    }

    // The type of our new key should match the additionalProperties value;
    schema.properties[key] = additionalProperties;
    // Set our additional property flag so we know it was dynamically added
    set(schema.properties, [key, ADDITIONAL_PROPERTY_FLAG], true);
  });

  return schema;
}

/** Retrieves an expanded schema that has had all of its conditions, additional properties, references and dependencies
 * resolved and merged into the `schema` given a `validator`, `rootSchema` and `rawFormData` that is used to do the
 * potentially recursive resolution.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which retrieving a schema is desired
 * @param [rootSchema={}] - The root schema that will be forwarded to all the APIs
 * @param [rawFormData] - The current formData, if any, to assist retrieving a schema
 * @returns - The schema having its conditions, additional properties, references and dependencies resolved
 */
export default function retrieveSchema<T = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  rootSchema: RJSFSchema = {},
  rawFormData?: T
): RJSFSchema {
  if (!isObject(schema)) {
    return {};
  }
  let resolvedSchema = resolveSchema<T>(
    validator,
    schema,
    rootSchema,
    rawFormData
  );

  if ("if" in schema) {
    return resolveCondition<T>(validator, schema, rootSchema, rawFormData as T);
  }

  const formData: GenericObjectType = rawFormData || {};
  // For each level of the dependency, we need to recursively determine the appropriate resolved schema given the current state of formData.
  // Otherwise, nested allOf subschemas will not be correctly displayed.
  if (resolvedSchema.properties) {
    const properties: GenericObjectType = {};

    Object.entries(resolvedSchema.properties).forEach((entries) => {
      const propName = entries[0];
      const propSchema = entries[1] as RJSFSchema;
      const rawPropData = formData[propName];
      const propData = isObject(rawPropData) ? rawPropData : {};
      const resolvedPropSchema = retrieveSchema<T>(
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

  if (ALL_OF_KEY in schema) {
    try {
      resolvedSchema = mergeAllOf({
        ...resolvedSchema,
        allOf: resolvedSchema.allOf,
      });
    } catch (e) {
      console.warn("could not merge subschemas in allOf:\n" + e);
      const { allOf, ...resolvedSchemaWithoutAllOf } = resolvedSchema;
      return resolvedSchemaWithoutAllOf;
    }
  }
  const hasAdditionalProperties =
    ADDITIONAL_PROPERTIES_KEY in resolvedSchema &&
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

/** Resolves dependencies within a schema and its 'allOf' children.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a dependency is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @returns - The schema with its dependencies resolved
 */
export function resolveDependencies<T = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  rootSchema: RJSFSchema,
  formData?: T
): RJSFSchema {
  // Drop the dependencies from the source schema.
  const { dependencies, ...remainingSchema } = schema;
  let resolvedSchema = remainingSchema;
  if (Array.isArray(resolvedSchema.oneOf)) {
    resolvedSchema = resolvedSchema.oneOf[
      getMatchingOption<T>(
        validator,
        formData,
        resolvedSchema.oneOf as RJSFSchema[],
        rootSchema
      )
    ] as RJSFSchema;
  } else if (Array.isArray(resolvedSchema.anyOf)) {
    resolvedSchema = resolvedSchema.anyOf[
      getMatchingOption<T>(
        validator,
        formData,
        resolvedSchema.anyOf as RJSFSchema[],
        rootSchema
      )
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

/** Processes all the `dependencies` recursively into the `resolvedSchema` as needed
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param dependencies - The set of dependencies that needs to be processed
 * @param resolvedSchema - The schema for which processing dependencies is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @returns - The schema with the `dependencies` resolved into it
 */
export function processDependencies<T = any>(
  validator: ValidatorType,
  dependencies: RJSFSchema["dependencies"],
  resolvedSchema: RJSFSchema,
  rootSchema: RJSFSchema,
  formData?: T
): RJSFSchema {
  let schema = resolvedSchema;
  // Process dependencies updating the local schema properties as appropriate.
  for (const dependencyKey in dependencies) {
    // Skip this dependency if its trigger property is not present.
    if (get(formData, [dependencyKey]) === undefined) {
      continue;
    }
    // Skip this dependency if it is not included in the schema (such as when dependencyKey is itself a hidden dependency.)
    if (schema.properties && !(dependencyKey in schema.properties)) {
      continue;
    }
    const [remainingDependencies, dependencyValue] = splitKeyElementFromObject(
      dependencyKey,
      dependencies as GenericObjectType
    );
    if (Array.isArray(dependencyValue)) {
      schema = withDependentProperties(schema, dependencyValue);
    } else if (isObject(dependencyValue)) {
      schema = withDependentSchema<T>(
        validator,
        schema,
        rootSchema,
        dependencyKey,
        dependencyValue as RJSFSchema,
        formData
      );
    }
    return processDependencies<T>(
      validator,
      remainingDependencies,
      schema,
      rootSchema,
      formData
    );
  }
  return schema;
}

/** Updates a schema with additionally required properties added
 *
 * @param schema - The schema for which resolving a dependent properties is desired
 * @param [additionallyRequired] - An optional array of additionally required names
 * @returns - The schema with the additional required values merged in
 */
export function withDependentProperties(
  schema: RJSFSchema,
  additionallyRequired?: string[]
) {
  if (!additionallyRequired) {
    return schema;
  }
  const required = Array.isArray(schema.required)
    ? Array.from(new Set([...schema.required, ...additionallyRequired]))
    : additionallyRequired;
  return { ...schema, required: required };
}

/** Merges a dependent schema into the `schema` dealing with oneOfs and references
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a dependent schema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param dependencyKey - The key name of the dependency
 * @param dependencyValue - The potentially dependent schema
 * @param formData- The current formData to assist retrieving a schema
 * @returns - The schema with the dependent schema resolved into it
 */
export function withDependentSchema<T>(
  validator: ValidatorType,
  schema: RJSFSchema,
  rootSchema: RJSFSchema,
  dependencyKey: string,
  dependencyValue: RJSFSchema,
  formData?: T
) {
  const { oneOf, ...dependentSchema } = retrieveSchema<T>(
    validator,
    dependencyValue,
    rootSchema,
    formData
  );
  schema = mergeSchemas(schema, dependentSchema);
  // Since it does not contain oneOf, we return the original schema.
  if (oneOf === undefined) {
    return schema;
  }
  // Resolve $refs inside oneOf.
  const resolvedOneOf = oneOf.map((subschema) => {
    if (typeof subschema === "boolean" || !(REF_KEY in subschema)) {
      return subschema;
    }
    return resolveReference<T>(
      validator,
      subschema as RJSFSchema,
      rootSchema,
      formData
    );
  });
  return withExactlyOneSubschema<T>(
    validator,
    schema,
    rootSchema,
    dependencyKey,
    resolvedOneOf,
    formData
  );
}

/** Returns a `schema` with the best choice from the `oneOf` options merged into it
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used to validate oneOf options
 * @param schema - The schema for which resolving a oneOf subschema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param dependencyKey - The key name of the oneOf dependency
 * @param oneOf - The list of schemas representing the oneOf options
 * @param [formData] - The current formData to assist retrieving a schema
 * @returns  The schema with best choice of oneOf schemas merged into
 */
export function withExactlyOneSubschema<T = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  rootSchema: RJSFSchema,
  dependencyKey: string,
  oneOf: RJSFSchemaDefinition[],
  formData?: T
) {
  const validSubschemas = oneOf.filter((subschema) => {
    if (typeof subschema === "boolean" || !subschema.properties) {
      return false;
    }
    const { [dependencyKey]: conditionPropertySchema } = subschema.properties;
    if (conditionPropertySchema) {
      const conditionSchema: RJSFSchema = {
        type: "object",
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
  const [dependentSubschema] = splitKeyElementFromObject(
    dependencyKey,
    subschema.properties as GenericObjectType
  );
  const dependentSchema = { ...subschema, properties: dependentSubschema };
  return mergeSchemas(
    schema,
    retrieveSchema<T>(validator, dependentSchema, rootSchema, formData)
  );
}
