import { RJSFValidationError, ValidationData } from "../../src";
import { TestValidatorParams, TestValidatorType } from "../schema/types";

export default function getTestValidator<T = any>({
  isValid = [],
  data = [],
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
      toErrorList: jest.fn().mockImplementation(() => {
        // console.warn('isValid',  JSON.stringify(args));
        if (
          Array.isArray(testValidator._errorList) &&
          testValidator._errorList.length > 0
        ) {
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
