import { CONST_NAME } from './constants';
import { RJSFSchema } from './types';

export default function toConstant(schema: RJSFSchema) {
  if (Array.isArray(schema.enum) && schema.enum.length === 1) {
    return schema.enum[0];
  }
  if (schema.hasOwnProperty(CONST_NAME)) {
    return schema.const;
  }
  throw new Error('schema cannot be inferred as a constant');
}
