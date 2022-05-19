import { orderProperties } from '../src';

describe('orderProperties()', () => {
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
    expect(orderProperties(properties, order)).toEqual([
      'foo',
      'qux',
      'bar',
      'baz',
    ]);
  });
});
