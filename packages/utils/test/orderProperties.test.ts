import type { MockInstance } from 'vitest';

import { noop, orderProperties } from '../src/index.ts';

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
  it('places a property named __proto__ at the wildcard', () => {
    expect(orderProperties(['foo', '__proto__'], ['foo', '*'])).toEqual(['foo', '__proto__']);
  });

  it('should remove from order an Object.prototype member that is not in properties', () => {
    expect(orderProperties(['foo'], ['toString', '*'])).toEqual(['foo']);
  });

  describe('an order that leaves properties out or repeats the wildcard', () => {
    let consoleWarnSpy: MockInstance;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('places a property the order does not list at the end and warns, naming it', () => {
      const properties = ['foo', 'bar', 'baz'];
      const order = ['foo', 'baz'];
      expect(orderProperties(properties, order)).toEqual(['foo', 'baz', 'bar']);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "A ui:order does not list property 'bar', so it is placed at the end",
      );
    });

    it('places the properties the order does not list at the end, in their own order, and warns, naming them', () => {
      const properties = ['foo', 'bar', 'baz'];
      const order = ['foo'];
      expect(orderProperties(properties, order)).toEqual(['foo', 'bar', 'baz']);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "A ui:order does not list properties 'bar', 'baz', so they are placed at the end",
      );
    });

    it('names the field in the warning when given its label', () => {
      expect(orderProperties(['foo', 'bar'], ['bar'], '"root_address" (address)')).toEqual(['bar', 'foo']);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'The ui:order of "root_address" (address) does not list property \'foo\', so it is placed at the end',
      );
    });

    it('places a property named __proto__ that the order does not list at the end', () => {
      expect(orderProperties(['foo', '__proto__'], ['foo'])).toEqual(['foo', '__proto__']);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "A ui:order does not list property '__proto__', so it is placed at the end",
      );
    });

    it('does not warn when every property is listed', () => {
      expect(orderProperties(['foo', 'bar'], ['bar', 'foo'])).toEqual(['bar', 'foo']);
      expect(orderProperties(['foo', 'bar'], ['bar', '*'])).toEqual(['bar', 'foo']);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('lets the first * place the unlisted properties when there are several, dropping the others, and warns', () => {
      const properties = ['foo', 'bar', 'baz'];
      const order = ['*', 'foo', '*'];
      expect(orderProperties(properties, order)).toEqual(['bar', 'baz', 'foo']);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "A ui:order has more than one '*', so only the first one places the properties it does not list",
      );
    });

    it('names the field in the wildcard warning when given its label', () => {
      expect(orderProperties(['foo', 'bar'], ['foo', '*', 'bar', '*'], '"root"')).toEqual(['foo', 'bar']);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'The ui:order of "root" has more than one \'*\', so only the first one places the properties it does not list',
      );
    });
  });
});
