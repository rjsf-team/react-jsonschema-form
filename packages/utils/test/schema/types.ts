import { RJSFSchema, RJSFValidationError, ValidationData, ValidatorType } from '../../src';

export interface TestValidatorParams<T = any> {
  isValid?: boolean[];
  data?: ValidationData<T>[];
  errorList?: RJSFValidationError[][];
}

export interface IExpectType {
  // eslint-disable-next-line no-unused-vars
  expectedCB: (schema: RJSFSchema, options?: any) => unknown;
  toEqual: any;
}

export interface TestValidatorType<T = any> extends ValidatorType<T> {
  // eslint-disable-next-line no-unused-vars
  setReturnValues(params?: TestValidatorParams<T>): void;
}
