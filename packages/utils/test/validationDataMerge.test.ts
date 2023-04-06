import { ERRORS_KEY, ErrorSchema, validationDataMerge, ValidationData } from '../src';

describe('mergeValidationDataTest()', () => {
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
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors } as ErrorSchema;
    const expected = {
      errorSchema,
      errors: customErrors,
    };
    expect(validationDataMerge(validationData, errorSchema)).toEqual(expected);
  });
  it('Returns merged data when additionalErrorSchema is passed', () => {
    const oldError = 'ajv error';
    const validationData: ValidationData<any> = {
      errorSchema: { [ERRORS_KEY]: [oldError] } as ErrorSchema,
      errors: [{ stack: oldError, name: 'foo', schemaPath: '.foo' }],
    };
    const errors = ['custom errors'];
    const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors } as ErrorSchema;
    const expected = {
      errorSchema: { [ERRORS_KEY]: [oldError, ...errors] },
      errors: [...validationData.errors, ...customErrors],
    };
    expect(validationDataMerge(validationData, errorSchema)).toEqual(expected);
  });
});
