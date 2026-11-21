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
  it('Returns an empty array when a primitive is provided, as an untyped caller may pass', () => {
    // @ts-expect-error a string is not an ErrorSchema
    expect(toErrorList('bad')).toEqual([]);
  });
  it('Returns the expected list of errors when given an ErrorSchema', () => {
    expect(toErrorList(TEST_ERROR_SCHEMA)).toEqual(TEST_ERROR_LIST_OUTPUT);
  });
  it('Lists an error under a key holding a dot or a bracket as one key, and an error on the root under `.`', () => {
    const errorSchema: ErrorSchema = {
      [ERRORS_KEY]: ['root'],
      'a.b': { name: { [ERRORS_KEY]: ['bad'] } },
      'x[1]': { [ERRORS_KEY]: ['worse'] },
    };
    expect(toErrorList(errorSchema)).toEqual([
      { property: '.', message: 'root', stack: '. root' },
      { property: "['a.b'].name", message: 'bad', stack: "['a.b'].name bad" },
      { property: "['x[1]']", message: 'worse', stack: "['x[1]'] worse" },
    ]);
  });
  it('Lists the errors an ErrorSchema holds in arrays for the items of an array, as if keyed by index', () => {
    const errorSchema: ErrorSchema = { list: [{ sub: [{ [ERRORS_KEY]: ['bad'] }] }] };
    expect(toErrorList(errorSchema)).toEqual([
      { property: '.list.0.sub.0', message: 'bad', stack: '.list.0.sub.0 bad' },
    ]);
  });
});
