import { isConstantSelect } from '../src/index.ts';

describe('isConstantSelect()', () => {
  it('accepts a non-empty enum, whatever the type', () => {
    expect(isConstantSelect({ type: 'object', enum: [{ a: 1 }] })).toBe(true);
  });
  it('rejects an empty enum', () => {
    expect(isConstantSelect({ type: 'array', enum: [] })).toBe(false);
  });
  it('leaves an empty enum to the oneOf beside it', () => {
    expect(isConstantSelect({ type: 'object', enum: [], oneOf: [{ const: { a: 1 } }] })).toBe(true);
    expect(isConstantSelect({ type: 'object', enum: [], oneOf: [{ type: 'string' }] })).toBe(false);
  });
  it('accepts an empty enum or list when allowEmpty is set, as isSelect() does', () => {
    expect(isConstantSelect({ type: 'string', enum: [], oneOf: [{ type: 'string' }] }, true)).toBe(true);
    expect(isConstantSelect({ type: 'object', oneOf: [] }, true)).toBe(true);
    expect(isConstantSelect({ anyOf: [{ type: 'string' }] }, true)).toBe(false);
  });
  it('accepts a non-empty oneOf or anyOf of constants', () => {
    expect(isConstantSelect({ type: 'array', oneOf: [{ const: [1] }] })).toBe(true);
    expect(isConstantSelect({ anyOf: [{ const: 'a' }] })).toBe(true);
  });
  it('rejects an empty oneOf', () => {
    expect(isConstantSelect({ type: 'object', oneOf: [] })).toBe(false);
  });
  it('reads the anyOf when a schema has both keywords', () => {
    expect(isConstantSelect({ anyOf: [{ type: 'string' }], oneOf: [{ const: 'a' }] })).toBe(false);
  });
  it('rejects a schema with no list of options', () => {
    expect(isConstantSelect({ type: 'string' })).toBe(false);
  });
});
