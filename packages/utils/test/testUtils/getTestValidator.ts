import isEmpty from 'lodash/isEmpty';

import { ValidationData, ValidatorType } from '../../src';

export interface TestValidatorParams {
  isValid?: boolean[];
  data?: ValidationData[];
}

export interface TestValidatorType extends ValidatorType {
  // eslint-disable-next-line no-unused-vars
  setReturnValues(params?: TestValidatorParams): void;
}

export default function createTestValidator(
  { isValid = [], data = [] }: TestValidatorParams
): TestValidatorType  {
  const testValidator: { _data: ValidationData[], _isValid: boolean[], validator: TestValidatorType } = {
    _data: data,
    _isValid: isValid,
    validator: {
      validateFormData: jest.fn().mockImplementation(() => {
        if (!isEmpty(testValidator._data)) {
          return testValidator._data.shift();
        }
        return { errors: [], errorSchema: {} };
      }),
      isValid: jest.fn().mockImplementation(() => {
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
