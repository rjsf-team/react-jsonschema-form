import get from 'lodash/get';
import reduce from 'lodash/reduce';

import { createErrorHandler, unwrapErrorHandler, ERRORS_KEY, FormValidation } from '../src';
import { TEST_FORM_DATA, ERROR_MAPPER, TEST_ERROR_SCHEMA } from './testUtils/testData';

const EMPTY_WRAPPER = createErrorHandler(null);
const POPULATED_WRAPPER: FormValidation = reduce(
  ERROR_MAPPER,
  (validation: FormValidation, value, key) => {
    const propValidation: FormValidation | undefined = key ? get(validation, key) : validation;
    propValidation?.addError(value);
    return validation;
  },
  createErrorHandler(TEST_FORM_DATA) as FormValidation
);

describe('unwrapErrorHandler()', () => {
  it('an empty FormValidation returns an empty ErrorSchema', () => {
    expect(unwrapErrorHandler(EMPTY_WRAPPER)).toEqual({ [ERRORS_KEY]: [] });
  });
  it('A fully loaded FormValidation returns the associated ErrorSchema', () => {
    expect(unwrapErrorHandler(POPULATED_WRAPPER)).toEqual(TEST_ERROR_SCHEMA);
  });
});
