import { RJSFSchema, ValidatorType } from '../types';
import { retrieveSchema } from './retrieveSchema';

class SchemaUtils<T = any> {
  rootSchema: RJSFSchema;
  validator: ValidatorType;

  constructor(validator: ValidatorType, rootSchema: RJSFSchema) {
    this.rootSchema = rootSchema;
    this.validator = validator;
  }

  retrieveSchema(schema: RJSFSchema, rawFormData: T) {
    return retrieveSchema<T>(this.validator, schema, this.rootSchema, rawFormData);
  }
}
