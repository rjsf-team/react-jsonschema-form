import type { ErrorSchema, ValidationData } from '../src/index.ts';
import { ERRORS_KEY, validationDataMerge } from '../src/index.ts';

describe('validationDataMerge()', () => {
  it('Returns validationData when no additionalErrorSchema is passed', () => {
    const validationData: ValidationData<any> = {
      errorSchema: {},
      errors: [],
    };
    expect(validationDataMerge(validationData)).toBe(validationData);
  });
  it('Returns only additionalErrorSchema when additionalErrorSchema is passed and no validationData', () => {
    const validationData: ValidationData<any> = {
      errorSchema: {},
      errors: [],
    };
    const errors = ['custom errors'];
    const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors };
    const expected = {
      errorSchema,
      errors: customErrors,
    };
    expect(validationDataMerge(validationData, errorSchema)).toEqual(expected);
  });
  it('Returns merged data when additionalErrorSchema is passed', () => {
    const oldError = 'ajv error';
    const validationData: ValidationData<any> = {
      errorSchema: { [ERRORS_KEY]: [oldError] },
      errors: [{ stack: oldError, name: 'foo', schemaPath: '.foo' }],
    };
    const errors = ['custom errors'];
    const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors };
    const expected = {
      errorSchema: { [ERRORS_KEY]: [oldError, ...errors] },
      errors: [...validationData.errors, ...customErrors],
    };
    expect(validationDataMerge(validationData, errorSchema)).toEqual(expected);
  });
  it('Returns merged data when additionalErrorSchema is passed, prevent duplicates', () => {
    const oldError = 'ajv error';
    const validationData: ValidationData<any> = {
      errorSchema: { [ERRORS_KEY]: [oldError] },
      errors: [{ stack: oldError, name: 'foo', schemaPath: '.foo' }],
    };
    const errors = ['custom errors'];
    const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors };
    const expected = {
      errorSchema: { [ERRORS_KEY]: [oldError, ...errors] },
      errors: [...validationData.errors, ...customErrors],
    };
    expect(validationDataMerge(validationData, errorSchema, true)).toEqual(expected);
  });
  it('Skips additional errors already in the errors list when preventing duplicates', () => {
    const message = 'must be at least 3 characters';
    const existing = { property: '.street', message, stack: `.street ${message}` };
    const validationData: ValidationData<any> = {
      errorSchema: { street: { [ERRORS_KEY]: [message] } },
      errors: [existing],
    };
    const errorSchema: ErrorSchema = { street: { [ERRORS_KEY]: [message] }, city: { [ERRORS_KEY]: [message] } };
    const expected = {
      errorSchema: { street: { [ERRORS_KEY]: [message] }, city: { [ERRORS_KEY]: [message] } },
      errors: [existing, { property: '.city', message, stack: `.city ${message}` }],
    };
    expect(validationDataMerge(validationData, errorSchema, true)).toEqual(expected);
    expect(validationDataMerge(validationData, errorSchema).errors).toHaveLength(3);
  });
});
