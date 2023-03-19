import { RJSFValidationError, ValidationData } from '../../src';
import { TestValidatorParams, TestValidatorType } from '../schema/types';

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
    _data: ValidationData<T>[];
    _isValid: boolean[];
    _errorList: RJSFValidationError[][];
    validator: TestValidatorType;
  } = {
    _data: data,
    _isValid: isValid,
    _errorList: errorList,
    validator: {
      validateFormData: jest.fn().mockImplementation(() => {
        if (Array.isArray(testValidator._data) && testValidator._data.length > 0) {
          return testValidator._data.shift();
        }
        return { errors: [], errorSchema: {} };
      }),
      isValid: jest.fn().mockImplementation(() => {
        // console.warn('isValid',  JSON.stringify(args));
        if (Array.isArray(testValidator._isValid) && testValidator._isValid.length > 0) {
          return testValidator._isValid.shift();
        }
        return true;
      }),
      toErrorList: jest.fn().mockImplementation(() => {
        // console.warn('isValid',  JSON.stringify(args));
        if (Array.isArray(testValidator._errorList) && testValidator._errorList.length > 0) {
          return testValidator._errorList.shift();
        }
        return [];
      }),
      rawValidation: jest.fn().mockImplementation(() => {}),
      setReturnValues({ isValid, data, errorList }: TestValidatorParams) {
        if (isValid !== undefined) {
          testValidator._isValid = isValid;
        }
        if (data !== undefined) {
          testValidator._data = data;
        }
        if (errorList !== undefined) {
          testValidator._errorList = errorList;
        }
      },
    },
  };
  return testValidator.validator;
}
