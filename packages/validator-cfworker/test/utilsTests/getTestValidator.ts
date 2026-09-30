import type { CustomValidator, ErrorTransformer, RJSFSchema, SchemaContext, ValidationData } from '@rjsf/utils';

import type { TestValidatorType } from '../../../utils/test/schema/index.ts';
import type { CustomValidatorOptionsType } from '../../src/index.ts';
import { customizeValidator } from '../../src/index.ts';

export default function getTestValidator(options: CustomValidatorOptionsType): TestValidatorType {
  const validator = customizeValidator(options);
  return {
    validateFormData<T = unknown>(
      context: SchemaContext,
      formData: T | undefined,
      schema: RJSFSchema,
      customValidate?: CustomValidator<T>,
      transformErrors?: ErrorTransformer<T>,
    ): ValidationData<T> {
      return validator.validateFormData(context, formData, schema, customValidate, transformErrors);
    },
    isValid(context: SchemaContext, schema: RJSFSchema, formData: unknown, rootSchema: RJSFSchema): boolean {
      return validator.isValid(context, schema, formData, rootSchema);
    },
    rawValidation<Result = any>(
      schema: RJSFSchema,
      formData?: unknown,
      context?: SchemaContext,
    ): { errors?: Result[]; validationError?: Error } {
      return validator.rawValidation(schema, formData, context);
    },
    setReturnValues() {
      /* The real validator does not use injected return values. */
    },
    reset() {
      validator.reset?.();
    },
  };
}
