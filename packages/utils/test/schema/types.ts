import type { RJSFSchema, RJSFValidationError, ValidationData, ValidatorType } from '../../src/index.ts';

/** Answers an `isValid()` call of the mock validator for the schema and data it was made with */
export type IsValidAnswer = (schema: RJSFSchema, formData: unknown, rootSchema: RJSFSchema) => boolean;

export interface TestValidatorParams<T = unknown> {
  /** What `isValid()` returns: one answer per call, in the order of the calls, or a function answering each call for
   * its schema and data, which holds whatever order and number of calls the code under test makes
   */
  isValid?: boolean[] | IsValidAnswer;
  data?: ValidationData<T>[];
  errorList?: RJSFValidationError[][];
}

export interface TestValidatorType extends ValidatorType {
  setReturnValues(params?: TestValidatorParams): void;
}
