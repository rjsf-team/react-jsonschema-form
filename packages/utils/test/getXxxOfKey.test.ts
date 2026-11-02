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
  it('returns oneOf when the anyOf is empty and the oneOf is not', () => {
    expect(getXxxOfKey({ anyOf: [], oneOf: [{ const: 'b' }] })).toBe('oneOf');
  });
  // A key with nothing under it, or an empty list, offers nothing to choose between, so it reads as absent (#5365)
  it.each<[string, RJSFSchema]>([
    ['both lists are empty', { anyOf: [], oneOf: [] }],
    ['the anyOf is empty and there is no oneOf', { anyOf: [] }],
    ['the oneOf is empty', { oneOf: [] }],
    ['both keys are present but undefined', { anyOf: undefined, oneOf: undefined }],
  ])('returns undefined when %s', (_, schema) => {
    expect(getXxxOfKey(schema)).toBeUndefined();
  });
  it('returns undefined without either keyword', () => {
    expect(getXxxOfKey({ type: 'string' })).toBeUndefined();
  });
});
