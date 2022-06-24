import isEmpty from 'lodash/isEmpty';

import { ValidationData, ValidatorType } from '../../src';

export interface TestValidatorParams<T = any> {
  isValid?: boolean[];
  data?: ValidationData<T>[];
}

export interface TestValidatorType extends ValidatorType {
  // eslint-disable-next-line no-unused-vars
  setReturnValues(params?: TestValidatorParams): void;
}

export default function createTestValidator<T = any>(
  { isValid = [], data = [] }: TestValidatorParams
): TestValidatorType  {
  const testValidator: { _data: ValidationData<T>[], _isValid: boolean[], validator: TestValidatorType } = {
    _data: data,
    _isValid: isValid,
    validator: {
      validateFormData: jest.fn().mockImplementation(() => {
        // console.warn('validateFormData', JSON.stringify(args));
        if (!isEmpty(testValidator._data)) {
          return testValidator._data.shift();
        }
        return { errors: [], errorSchema: {} };
      }),
      isValid: jest.fn().mockImplementation(() => {
        // console.warn('isValid',  JSON.stringify(args));
        if (!isEmpty(testValidator._isValid)) {
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
      }
    }
  };
  return testValidator.validator;
}
