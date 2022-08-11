import { ValidationData } from "../../src";
import { TestValidatorParams, TestValidatorType } from "../schema/types";

export default function getTestValidator<T = any>({
  isValid = [],
  data = [],
}: TestValidatorParams): TestValidatorType {
  const testValidator: {
    _data: ValidationData<T>[];
    _isValid: boolean[];
    validator: TestValidatorType;
  } = {
    _data: data,
    _isValid: isValid,
    validator: {
      validateFormData: jest.fn().mockImplementation(() => {
        if (
          Array.isArray(testValidator._data) &&
          testValidator._data.length > 0
        ) {
          return testValidator._data.shift();
        }
        return { errors: [], errorSchema: {} };
      }),
      isValid: jest.fn().mockImplementation(() => {
        // console.warn('isValid',  JSON.stringify(args));
        if (
          Array.isArray(testValidator._isValid) &&
          testValidator._isValid.length > 0
        ) {
          return testValidator._isValid.shift();
        }
        return true;
      }),
      toErrorList: jest.fn().mockImplementation(() => []),
      setReturnValues({ isValid, data }: TestValidatorParams) {
        if (isValid !== undefined) {
          testValidator._isValid = isValid;
        }
        if (data !== undefined) {
          testValidator._data = data;
        }
      },
    },
  };
  return testValidator.validator;
}
