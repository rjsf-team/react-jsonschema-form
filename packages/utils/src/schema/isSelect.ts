import { RJSFSchema, ValidatorType } from '../types';

import isConstant from '../isConstant';
import { retrieveSchema } from './retrieveSchema';

export default function isSelect(validator: ValidatorType, _schema: RJSFSchema, rootSchema: RJSFSchema = {}) {
  const schema = retrieveSchema(validator, _schema, rootSchema, undefined);
  const altSchemas = schema.oneOf || schema.anyOf;
  if (Array.isArray(schema.enum)) {
    return true;
  } else if (Array.isArray(altSchemas)) {
    return altSchemas.every(altSchemas => isConstant(altSchemas));
  }
  return false;
}
