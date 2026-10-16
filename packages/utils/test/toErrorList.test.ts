import type { ErrorSchema } from '../src/index.ts';
import { ERRORS_KEY, toErrorList } from '../src/index.ts';
import { TEST_ERROR_LIST_OUTPUT, TEST_ERROR_SCHEMA } from './testUtils/testData.ts';

describe('toErrorList()', () => {
  it('returns empty array when nothing is passed', () => {
    expect(toErrorList()).toEqual([]);
  });
  it('Returns an empty array when an empty object is provided', () => {
    expect(toErrorList({})).toEqual([]);
  });
  it('Returns an empty array when an object with a non-plain child object is provided', () => {
    expect(toErrorList({ nonObject: new Error('non-object') })).toEqual([]);
  });
  it('Returns the expected list of errors when given an ErrorSchema', () => {
    expect(toErrorList(TEST_ERROR_SCHEMA)).toEqual(TEST_ERROR_LIST_OUTPUT);
  });
  it('Lists the errors an ErrorSchema holds in arrays for the items of an array, as if keyed by index', () => {
    const errorSchema: ErrorSchema = { list: [{ sub: [{ [ERRORS_KEY]: ['bad'] }] }] };
    expect(toErrorList(errorSchema)).toEqual([
      { property: '.list.0.sub.0', message: 'bad', stack: '.list.0.sub.0 bad' },
    ]);
  });
});
