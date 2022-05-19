import { JSONSchema7 } from 'json-schema';

import { CONST_NAME } from './constants';

/**
 * This function checks if the given schema matches a single
 * constant value.
 */
export default function isConstant(schema: JSONSchema7) {
  return (Array.isArray(schema.enum) && schema.enum.length === 1) || schema.hasOwnProperty(CONST_NAME);
}
