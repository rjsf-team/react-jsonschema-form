import { isConstantOptionList } from '../src/index.ts';

describe('isConstantOptionList()', () => {
  it('accepts a list of const and single-value enum schemas', () => {
    expect(isConstantOptionList([{ const: 'a' }, { enum: ['b'] }])).toBe(true);
  });
  it('accepts an empty list', () => {
    expect(isConstantOptionList([])).toBe(true);
  });
  it('rejects a list with a non-constant option', () => {
    expect(isConstantOptionList([{ const: 'a' }, { type: 'string' }])).toBe(false);
  });
  it('rejects a list with a boolean schema', () => {
    expect(isConstantOptionList([{ const: 'a' }, true])).toBe(false);
  });
  it('rejects anything that is not an array', () => {
    expect(isConstantOptionList(undefined)).toBe(false);
    expect(isConstantOptionList({ const: 'a' })).toBe(false);
  });
});
