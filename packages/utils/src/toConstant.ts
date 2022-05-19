import { JSONSchema7 } from 'json-schema';

import { CONST_NAME } from './constants';

export default function toConstant(schema: JSONSchema7) {
  if (Array.isArray(schema.enum) && schema.enum.length === 1) {
    return schema.enum[0];
  } else if (schema.hasOwnProperty(CONST_NAME)) {
    return schema.const;
  } else {
    throw new Error('schema cannot be inferred as a constant');
  }
}
