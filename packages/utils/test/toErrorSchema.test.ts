import { toErrorSchema } from '../src/index.ts';
import { TEST_ERROR_LIST, TEST_ERROR_SCHEMA } from './testUtils/testData.ts';

describe('toErrorSchema()', () => {
  it('returns an empty error schema when passed an empty list', () => {
    expect(toErrorSchema([])).toEqual({});
  });
  it('returns the expected ErrorSchema when given a list of errors', () => {
    expect(toErrorSchema(TEST_ERROR_LIST)).toEqual(TEST_ERROR_SCHEMA);
  });
  it('puts an error without a property at the root of the ErrorSchema', () => {
    expect(toErrorSchema([{ message: 'err', stack: 'err' }])).toEqual({ __errors: ['err'] });
  });
  it('files an error at a __proto__ path under that key without changing the prototype', () => {
    const errorSchema = toErrorSchema([{ property: '.obj.__proto__', message: 'err', stack: '.obj.__proto__ err' }]);
    const { obj } = errorSchema as Record<string, object>;
    expect(Object.getPrototypeOf(obj)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(obj, '__proto__')?.value).toEqual({ __errors: ['err'] });
  });
});
