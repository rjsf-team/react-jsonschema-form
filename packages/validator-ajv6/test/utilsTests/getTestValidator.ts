import {
  CustomValidator,
  ErrorSchema,
  ErrorTransformer,
  RJSFSchema,
  RJSFValidationError,
  ValidationData
} from '@rjsf/utils';
import { customizeValidator, CustomValidatorOptionsType } from '../../src';
// YES, this is ugly and breaks the "lerna wall" but it works
import { TestValidatorType } from '../../../utils/test/schema';

export default function getTestValidator<T = any>(options: CustomValidatorOptionsType): TestValidatorType {
  const validator = customizeValidator<T>(options);
  return {
    validateFormData (
      formData: T, schema: RJSFSchema, customValidate?: CustomValidator<T>, transformErrors?: ErrorTransformer
    ): ValidationData<T> {
      return validator.validateFormData(formData, schema, customValidate, transformErrors);
    },
    toErrorList (errorSchema?: ErrorSchema<T>, fieldName?: string): RJSFValidationError[] {
      return validator.toErrorList(errorSchema, fieldName);
    },
    isValid (schema: RJSFSchema, formData: T, rootSchema: RJSFSchema): boolean {
      return validator.isValid(schema, formData, rootSchema);
    },
    setReturnValues() {
    }
  };
}
