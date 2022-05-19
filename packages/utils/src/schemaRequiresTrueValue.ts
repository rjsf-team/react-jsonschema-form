import { JSONSchema7, JSONSchema7Definition } from 'json-schema';

// Check to see if a schema specifies that a value must be true
export default function schemaRequiresTrueValue(schema: JSONSchema7): boolean {
  // Check if const is a truthy value
  if (schema.const) {
    return true;
  }

  // Check if an enum has a single value of true
  if (schema.enum && schema.enum.length === 1 && schema.enum[0] === true) {
    return true;
  }

  // If anyOf has a single value, evaluate the subschema
  if (schema.anyOf && schema.anyOf.length === 1) {
    return schemaRequiresTrueValue(schema.anyOf[0] as JSONSchema7);
  }

  // If oneOf has a single value, evaluate the subschema
  if (schema.oneOf && schema.oneOf.length === 1) {
    return schemaRequiresTrueValue(schema.oneOf[0] as JSONSchema7);
  }

  // Evaluate each subschema in allOf, to see if one of them requires a true value
  if (schema.allOf) {
    const schemaSome = (subSchema: JSONSchema7Definition) => schemaRequiresTrueValue(subSchema as JSONSchema7);
    return schema.allOf.some(schemaSome);
  }

  return false;
}
