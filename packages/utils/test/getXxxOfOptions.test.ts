import { getXxxOfOptions } from '../src/index.ts';
import type { RJSFSchema } from '../src/index.ts';

describe('getXxxOfOptions()', () => {
  const anyOf: RJSFSchema[] = [{ const: 'a' }];
  const oneOf: RJSFSchema[] = [{ const: 'b' }];
  it('returns the anyOf options when the schema carries both keywords', () => {
    expect(getXxxOfOptions({ anyOf, oneOf })).toEqual({ key: 'anyOf', options: anyOf });
  });
  it('returns the oneOf options when the anyOf is empty and the oneOf is not', () => {
    expect(getXxxOfOptions({ anyOf: [], oneOf })).toEqual({ key: 'oneOf', options: oneOf });
  });
  it.each(['anyOf', 'oneOf'])('returns undefined for an empty %s', (keyword) => {
    expect(getXxxOfOptions({ type: 'array', [keyword]: [] })).toBeUndefined();
  });
  it('returns undefined without either keyword', () => {
    expect(getXxxOfOptions({ type: 'string' })).toBeUndefined();
  });
});
