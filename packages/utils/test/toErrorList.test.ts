import { toErrorList } from '../src';
import { TEST_ERROR_LIST_OUTPUT, TEST_ERROR_SCHEMA } from './testUtils/testData';

describe('toErrorList()', () => {
  it('returns empty array when nothing is passed', () => {
    expect(toErrorList()).toEqual([]);
  });
  it('Returns an empty array when an empty object is provided', () => {
    expect(toErrorList({})).toEqual([]);
  });
  it('Returns an empty array when an object with a non-plain child object is provided', () => {
    // @ts-expect-error testing unexpected argument handling
    expect(toErrorList({ nonObject: new Error('non-object') })).toEqual([]);
  });
  it('Returns the expected list of errors when given an ErrorSchema', () => {
    expect(toErrorList(TEST_ERROR_SCHEMA)).toEqual(TEST_ERROR_LIST_OUTPUT);
  });
});
