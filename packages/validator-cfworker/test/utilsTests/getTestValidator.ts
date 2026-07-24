import type { CustomValidator, ErrorTransformer, RJSFSchema, ValidationData } from '@rjsf/utils';

import type { TestValidatorType } from '../../../utils/test/schema';
import type { CustomValidatorOptionsType } from '../../src';
import { customizeValidator } from '../../src';

export default function getTestValidator<T = any>(options: CustomValidatorOptionsType): TestValidatorType<T> {
  const validator = customizeValidator<T>(options);
  return {
    validateFormData(
      formData: T | undefined,
      schema: RJSFSchema,
      customValidate?: CustomValidator<T>,
      transformErrors?: ErrorTransformer<T>,
    ): ValidationData<T> {
      return validator.validateFormData(formData, schema, customValidate, transformErrors);
    },
    isValid(schema: RJSFSchema, formData: T | undefined, rootSchema: RJSFSchema): boolean {
      return validator.isValid(schema, formData, rootSchema);
    },
    rawValidation<Result = any>(schema: RJSFSchema, formData?: T): { errors?: Result[]; validationError?: Error } {
      return validator.rawValidation(schema, formData);
    },
    setReturnValues() {
      /* The real validator does not use injected return values. */
    },
    reset() {
      validator.reset?.();
    },
  };
}
