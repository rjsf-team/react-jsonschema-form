import {
  CustomValidator,
  ErrorSchema,
  ErrorTransformer,
  RJSFSchema,
  RJSFValidationError,
  ValidationData,
} from '@rjsf/utils';
// With Lerna active, the test world has access to the test suite via the symlink
import { TestValidatorType } from '@rjsf/utils/test/schema';
import { customizeValidator, CustomValidatorOptionsType } from '../../src';

/** In this environment, a test validator merely creates an internal `AJV8` validator with the custom `options` and
 * then forwards all calls into it. It is provided to mirror the test validator in the `utils` directory, except that
 * the `setReturnValues()` function does nothing.
 *
 * @param options
 */
export default function getTestValidator<T = any>(options: CustomValidatorOptionsType): TestValidatorType {
  const validator = customizeValidator<T>(options);
  return {
    validateFormData(
      formData: T | undefined,
      schema: RJSFSchema,
      customValidate?: CustomValidator<T>,
      transformErrors?: ErrorTransformer
    ): ValidationData<T> {
      return validator.validateFormData(formData, schema, customValidate, transformErrors);
    },
    toErrorList(errorSchema?: ErrorSchema<T>, fieldPath?: string[]): RJSFValidationError[] {
      return validator.toErrorList(errorSchema, fieldPath);
    },
    isValid(schema: RJSFSchema, formData: T | undefined, rootSchema: RJSFSchema): boolean {
      return validator.isValid(schema, formData, rootSchema);
    },
    rawValidation<Result = any>(schema: RJSFSchema, formData?: T): { errors?: Result[]; validationError?: Error } {
      return validator.rawValidation(schema, formData);
    },
    // This is intentionally a no-op as we are using the real validator here
    setReturnValues() {},
  };
}
