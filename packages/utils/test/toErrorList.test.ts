import { toErrorList } from '../src';
import { TEST_ERROR_LIST, TEST_ERROR_SCHEMA } from './testUtils/testData';

describe('toErrorList()', () => {
  it('returns empty array when nothing is passed', () => {
    expect(toErrorList()).toEqual([]);
  });
  it('Returns the expected list of errors when given an ErrorSchema', () => {
    expect(toErrorList(TEST_ERROR_SCHEMA)).toEqual(TEST_ERROR_LIST);
  });
});
