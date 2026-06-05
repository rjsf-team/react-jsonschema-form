import noop from 'lodash/noop';

import type { RJSFValidationError, ValidationData } from '../../src';
import type { TestValidatorParams, TestValidatorType } from '../schema/types';

/** A test validator implements the `ValidatorType` interface needed by all the `schema` based tests. Inside the `utils`
 * directory, there is no actual validator implementation, so it can be necessary to mock the expected return values
 * of the `validateFormData()`, `isValid()` and `errorList()` APIs to imitate what is expected from the real validator
 * implementations. The `setReturnValue()` function is used to set up this mocked data. It may take a some investigation
 * of the actual `validator` implementations to understand how to set the mocks when writing or updating tests. Feel
 * free to run the validator tests first if you aren't sure whether your mocks are correct.
 *
 * All tests that use the `TestValidator` are contained within the `@rjsf/utils/test/schema` directory and are run via
 * the `schema.test.ts` file.
 */
export default function getTestValidator<T = any>({
  data = [],
  isValid = [],
  errorList = [],
}: TestValidatorParams): TestValidatorType {
  const testValidator: {
    validatorData: ValidationData<T>[];
    isValidResult: boolean[];
    errorList: RJSFValidationError[][];
    validator: TestValidatorType;
  } = {
    validatorData: data,
    isValidResult: isValid,
    errorList,
    validator: {
      validateFormData: vi.fn().mockImplementation(() => {
        if (Array.isArray(testValidator.validatorData) && testValidator.validatorData.length > 0) {
          return testValidator.validatorData.shift();
        }
        return { errors: [], errorSchema: {} };
      }),
      isValid: vi.fn().mockImplementation(() => {
        // console.warn('isValid',  JSON.stringify(args));
        if (Array.isArray(testValidator.isValidResult) && testValidator.isValidResult.length > 0) {
          return testValidator.isValidResult.shift();
        }
        return true;
      }),
      rawValidation: vi.fn().mockImplementation(noop),
      setReturnValues({ isValid, data, errorList }: TestValidatorParams) {
        if (isValid !== undefined) {
          testValidator.isValidResult = isValid;
        }
        if (data !== undefined) {
          testValidator.validatorData = data;
        }
        if (errorList !== undefined) {
          testValidator.errorList = errorList;
        }
      },
      reset() {
        testValidator.validatorData = [];
        testValidator.isValidResult = [];
        testValidator.errorList = [];
      },
    },
  };
  return testValidator.validator;
}
