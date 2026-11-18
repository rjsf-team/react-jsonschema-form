import { orderProperties } from '../src/index.ts';

describe('orderProperties()', () => {
  it('returns properties when order array is not specified', () => {
    const properties = ['foo', 'baz'];
    expect(orderProperties(properties)).toBe(properties);
  });

  it('should remove from order elements that are not in properties', () => {
    const properties = ['foo', 'baz'];
    const order = ['foo', 'bar', 'baz', 'qux'];
    expect(orderProperties(properties, order)).toEqual(['foo', 'baz']);
  });

  it('should order properties according to the order', () => {
    const properties = ['bar', 'foo'];
    const order = ['foo', 'bar'];
    expect(orderProperties(properties, order)).toEqual(['foo', 'bar']);
  });

  it('should replace * with properties that are absent in order', () => {
    const properties = ['foo', 'bar', 'baz'];
    const order = ['*', 'foo'];
    expect(orderProperties(properties, order)).toEqual(['bar', 'baz', 'foo']);
  });

  it('should handle more complex ordering case correctly', () => {
    const properties = ['foo', 'baz', 'qux', 'bar'];
    const order = ['quux', 'foo', '*', 'corge', 'baz'];
    expect(orderProperties(properties, order)).toEqual(['foo', 'qux', 'bar', 'baz']);
  });
  it('places the properties the order does not list at the end when it has no *', () => {
    expect(orderProperties(['foo', 'bar', 'baz'], ['baz'])).toEqual(['baz', 'foo', 'bar']);
  });
  it('places a property named __proto__ at the wildcard', () => {
    expect(orderProperties(['foo', '__proto__'], ['foo', '*'])).toEqual(['foo', '__proto__']);
  });
  it('places a property named __proto__ at the end when the order has no * and does not list it', () => {
    expect(orderProperties(['__proto__', 'foo'], ['foo'])).toEqual(['foo', '__proto__']);
  });
  it('should remove from order an Object.prototype member that is not in properties', () => {
    expect(orderProperties(['foo'], ['toString', '*'])).toEqual(['foo']);
  });
  it('places the properties the order does not list at the first * and ignores the others', () => {
    expect(orderProperties(['foo', 'bar', 'baz'], ['bar', '*', 'foo', '*'])).toEqual(['bar', 'baz', 'foo']);
  });
  it('places a property listed more than once at its first entry', () => {
    expect(orderProperties(['foo', 'bar', 'baz'], ['foo', 'bar', 'foo', '*', 'bar'])).toEqual(['foo', 'bar', 'baz']);
  });
  it('places a property named * among the ones the order does not list', () => {
    expect(orderProperties(['foo', '*'], ['foo', '*'])).toEqual(['foo', '*']);
    expect(orderProperties(['*', 'foo'], ['foo'])).toEqual(['foo', '*']);
  });
});
