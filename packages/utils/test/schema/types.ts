import { RJSFValidationError, ValidationData, ValidatorType } from '../../src';

export interface TestValidatorParams<T = any> {
  isValid?: boolean[];
  data?: ValidationData<T>[];
  errorList?: RJSFValidationError[][];
}

export interface TestValidatorType<T = any> extends ValidatorType<T> {
  // eslint-disable-next-line no-unused-vars
  setReturnValues(params?: TestValidatorParams<T>): void;
}
