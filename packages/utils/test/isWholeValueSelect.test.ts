import { isWholeValueSelect } from '../src/index.ts';

describe('isWholeValueSelect()', () => {
  it('accepts an object or array select over constants', () => {
    expect(isWholeValueSelect({ type: 'object', enum: [{ a: 1 }] })).toBe(true);
    expect(isWholeValueSelect({ type: 'array', oneOf: [{ const: [1] }] })).toBe(true);
    expect(isWholeValueSelect({ type: ['array', 'null'], anyOf: [{ const: [1] }, { const: null }] })).toBe(true);
  });
  it('accepts a typeless select offering an object or array constant', () => {
    expect(isWholeValueSelect({ oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] })).toBe(true);
    expect(isWholeValueSelect({ anyOf: [{ const: 'a' }, { const: [1] }] })).toBe(true);
    expect(isWholeValueSelect({ enum: [null, { a: 1 }] })).toBe(true);
  });
  it('rejects a typeless select offering only primitive constants', () => {
    expect(isWholeValueSelect({ oneOf: [{ const: 'a' }, { const: null }] })).toBe(false);
  });
  it('rejects a select declaring a primitive type', () => {
    expect(isWholeValueSelect({ type: 'string', oneOf: [{ const: { a: 1 } }] })).toBe(false);
  });
  it('rejects an object or array schema that is not a non-empty select', () => {
    expect(isWholeValueSelect({ type: 'object', properties: { a: { type: 'string' } } })).toBe(false);
    expect(isWholeValueSelect({ type: 'array', oneOf: [] })).toBe(false);
    expect(isWholeValueSelect({ type: 'object', oneOf: [{ required: ['a'] }] })).toBe(false);
  });
});
