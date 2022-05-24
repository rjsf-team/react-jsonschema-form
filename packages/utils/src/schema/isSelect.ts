import isConstant from '../isConstant';
import { RJSFSchema, ValidatorType } from '../types';
import retrieveSchema from './retrieveSchema';

export default function isSelect<T = any>(validator: ValidatorType, _schema: RJSFSchema, rootSchema: RJSFSchema = {}) {
  const schema = retrieveSchema<T>(validator, _schema, rootSchema, undefined);
  const altSchemas = schema.oneOf || schema.anyOf;
  if (Array.isArray(schema.enum)) {
    return true;
  } else if (Array.isArray(altSchemas)) {
    return altSchemas.every(altSchemas => typeof altSchemas !== 'boolean' && isConstant(altSchemas));
  }
  return false;
}
