import { RJSFValidationError, ValidationData, ValidatorType } from '../../src';

export interface TestValidatorParams<T = any> {
  isValid?: boolean[];
  data?: ValidationData<T>[];
  errorList?: RJSFValidationError[][];
}

export interface TestValidatorType extends ValidatorType {
  // eslint-disable-next-line no-unused-vars
  setReturnValues(params?: TestValidatorParams): void;
}
