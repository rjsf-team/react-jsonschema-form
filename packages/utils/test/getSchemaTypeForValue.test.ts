import { getSchemaTypeForValue } from '../src/index.ts';

describe('getSchemaTypeForValue()', () => {
  test.each<[unknown, string]>([
    [null, 'null'],
    ['abc', 'string'],
    [[1], 'array'],
    [{ a: 1 }, 'object'],
  ])('returns the listed type of %j', (value, expected) => {
    expect(getSchemaTypeForValue({ type: ['null', 'object', 'string', 'array'] }, value)).toBe(expected);
  });
  test('returns integer for a number when the list names integer but not number', () => {
    expect(getSchemaTypeForValue({ type: ['null', 'string', 'integer'] }, 3)).toBe('integer');
  });
  test('returns the schema type for a value of a type the list does not name', () => {
    expect(getSchemaTypeForValue({ type: ['null', 'object', 'string'] }, true)).toBe('object');
  });
  test('returns the schema type for an undefined value rather than null', () => {
    expect(getSchemaTypeForValue({ type: ['null', 'object', 'string'] }, undefined)).toBe('object');
  });
  test('returns the schema type for a schema naming a single type', () => {
    expect(getSchemaTypeForValue({ type: 'object' }, 'abc')).toBe('object');
  });
});
