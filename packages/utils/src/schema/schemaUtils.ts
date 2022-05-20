import { JSONSchema7 } from 'json-schema';

import { ValidatorType } from '../types';
import { retrieveSchema } from './retrieveSchema';

class SchemaUtils<T = any> {
  rootSchema: JSONSchema7;
  validator: ValidatorType;

  constructor(validator: ValidatorType, rootSchema: JSONSchema7) {
    this.rootSchema = rootSchema;
    this.validator = validator;
  }

  retrieveSchema(schema: JSONSchema7, rawFormData: T) {
    return retrieveSchema<T>(this.validator, schema, this.rootSchema, rawFormData);
  }
}
