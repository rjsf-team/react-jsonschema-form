import type { RJSFValidationError, ValidationData, ValidatorType } from '../../src/index.ts';

export interface TestValidatorParams<T = unknown> {
  isValid?: boolean[];
  data?: ValidationData<T>[];
  errorList?: RJSFValidationError[][];
}

export interface TestValidatorType<T = unknown> extends ValidatorType<T> {
  // oxlint-disable-next-line no-unused-vars
  setReturnValues(params?: TestValidatorParams<T>): void;
}
