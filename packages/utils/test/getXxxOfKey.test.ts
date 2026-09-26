import { getXxxOfKey } from '../src/index.ts';
import type { RJSFSchema } from '../src/index.ts';

describe('getXxxOfKey()', () => {
  it('returns anyOf when the schema carries both keywords', () => {
    expect(getXxxOfKey({ anyOf: [{ const: 'a' }], oneOf: [{ const: 'b' }] })).toBe('anyOf');
  });
  it('returns oneOf when there is no anyOf', () => {
    expect(getXxxOfKey({ oneOf: [{ const: 'b' }] })).toBe('oneOf');
  });
  it('ignores a keyword that does not hold an array', () => {
    expect(getXxxOfKey({ anyOf: 'bad', oneOf: [{ const: 'b' }] } as unknown as RJSFSchema)).toBe('oneOf');
  });
  it('returns undefined without either keyword', () => {
    expect(getXxxOfKey({ type: 'string' })).toBeUndefined();
  });
});
