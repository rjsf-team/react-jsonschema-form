import { JSONSchema7 } from 'json-schema';

import guessType from './guessType';

/* Gets the type of a given schema. */
export default function getSchemaType(schema: JSONSchema7): string | string[] {
  let { type } = schema;

  if (!type && schema.const) {
    return guessType(schema.const);
  }

  if (!type && schema.enum) {
    return 'string';
  }

  if (!type && (schema.properties || schema.additionalProperties)) {
    return 'object';
  }

  if (type instanceof Array && type.length === 2 && type.includes('null')) {
    type =  type.find(type => type !== 'null');
  }

  return type || 'string';
}
