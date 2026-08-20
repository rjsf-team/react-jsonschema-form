import type { ErrorSchema, ValidationData } from '../src';
import { ERRORS_KEY, validationDataMerge } from '../src';

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
  it('Returns merged data when additionalErrorSchema is passed, prevent duplicates', () => {
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
    expect(validationDataMerge(validationData, errorSchema, true)).toEqual(expected);
  });
  it('Normalizes real arrays in additionalErrorSchema to indexed objects so they merge instead of clobbering', () => {
    // Simulates `ArrayField`'s optimistic `newErrorSchema`, which lodash's `set()` builds as a real array for
    // numeric path segments, while RJSF's own AJV-derived `errorSchema` always uses numeric-keyed objects.
    const validationData: ValidationData<any> = {
      errorSchema: {
        arrayLevel1: {
          0: { field1: { [ERRORS_KEY]: ['must NOT have fewer than 1 characters'] } },
        },
      } as ErrorSchema,
      errors: [
        { stack: '.arrayLevel1.0.field1 must NOT have fewer than 1 characters', name: 'foo', schemaPath: '.foo' },
      ],
    };
    // A real array, as produced by lodash `set({}, ['arrayLevel1', 0], {})`. Also include a non-object,
    // non-array leaf value at a sibling key to exercise the normalizer's pass-through for arbitrary leaves.
    const additionalErrorSchema = { arrayLevel1: [{}], someLeaf: 'unchanged' } as unknown as ErrorSchema;
    const result = validationDataMerge(validationData, additionalErrorSchema, true);
    // The pre-existing field1 error must survive the merge instead of being overwritten by the empty stub.
    expect(result.errorSchema).toEqual({
      arrayLevel1: {
        0: { field1: { [ERRORS_KEY]: ['must NOT have fewer than 1 characters'] } },
      },
      someLeaf: 'unchanged',
    });
    expect(result.errors).toEqual(validationData.errors);
  });
});
