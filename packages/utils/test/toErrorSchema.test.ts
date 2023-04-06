import { toErrorSchema } from '../src';
import { TEST_ERROR_LIST, TEST_ERROR_SCHEMA } from './testUtils/testData';

describe('toErrorSchema()', () => {
  it('returns an empty error schema when passed an empty list', () => {
    expect(toErrorSchema([])).toEqual({});
  });
  it('returns the expected ErrorSchema when given a list of errors', () => {
    expect(toErrorSchema(TEST_ERROR_LIST)).toEqual(TEST_ERROR_SCHEMA);
  });
});
