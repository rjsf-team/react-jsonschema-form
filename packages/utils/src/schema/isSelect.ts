import { JSONSchema7, JSONSchema7Definition } from 'json-schema';

import isConstant from '../isConstant';

export default function isSelect(_schema: JSONSchema7 | JSONSchema7Definition[], rootSchema: JSONSchema7 = {}) {
  const schema = retrieveSchema(_schema, rootSchema);
  const altSchemas = schema.oneOf || schema.anyOf;
  if (Array.isArray(schema.enum)) {
    return true;
  } else if (Array.isArray(altSchemas)) {
    return altSchemas.every(altSchemas => isConstant(altSchemas));
  }
  return false;
}
