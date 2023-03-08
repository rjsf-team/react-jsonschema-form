import { isConstant } from '../src';

describe('isConstant', () => {
  it('should return false when neither enum nor const is defined', () => {
    const schema = {};
    expect(isConstant(schema)).toBe(false);
  });

  it('should return true when schema enum is an array of one item', () => {
    const schema = { enum: ['foo'] };
    expect(isConstant(schema)).toBe(true);
  });

  it('should return false when schema enum contains several items', () => {
    const schema = { enum: ['foo', 'bar', 'baz'] };
    expect(isConstant(schema)).toBe(false);
  });

  it('should return true when schema const is defined', () => {
    const schema = { const: 'foo' };
    expect(isConstant(schema)).toBe(true);
  });
});
