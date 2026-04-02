import { enumOptionValueDecoder } from '../src';
import { EnumOptionsType, RJSFSchema } from '../src';

describe('enumOptionValueDecoder', () => {
  const stringOptions: EnumOptionsType<RJSFSchema>[] = [
    { value: 'foo', label: 'Foo' },
    { value: 'bar', label: 'Bar' },
  ];
  const numericOptions: EnumOptionsType<RJSFSchema>[] = [
    { value: 123, label: '123' },
    { value: 456, label: '456' },
  ];
  const booleanOptions: EnumOptionsType<RJSFSchema>[] = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ];
  const objectOptions: EnumOptionsType<RJSFSchema>[] = [
    { value: { name: 'NY' } as unknown as RJSFSchema, label: 'New York' },
    { value: { name: 'LA' } as unknown as RJSFSchema, label: 'Los Angeles' },
  ];

  describe('when useRealValues is false (index mode)', () => {
    it('resolves index to value', () => {
      expect(enumOptionValueDecoder('0', stringOptions, false)).toBe('foo');
    });
    it('resolves second index', () => {
      expect(enumOptionValueDecoder('1', stringOptions, false)).toBe('bar');
    });
    it('returns emptyValue for empty string', () => {
      expect(enumOptionValueDecoder('', stringOptions, false, '')).toBe('');
    });
    it('handles array of indices', () => {
      expect(enumOptionValueDecoder(['0', '1'], stringOptions, false)).toEqual(['foo', 'bar']);
    });
  });

  describe('when useRealValues is true', () => {
    it('finds string value by matching', () => {
      expect(enumOptionValueDecoder('bar', stringOptions, true)).toBe('bar');
    });
    it('finds numeric value from string', () => {
      expect(enumOptionValueDecoder('123', numericOptions, true)).toBe(123);
    });
    it('finds boolean true from string', () => {
      expect(enumOptionValueDecoder('true', booleanOptions, true)).toBe(true);
    });
    it('finds boolean false from string', () => {
      expect(enumOptionValueDecoder('false', booleanOptions, true)).toBe(false);
    });
    it('finds object value by index fallback', () => {
      expect(enumOptionValueDecoder('0', objectOptions, true)).toEqual({ name: 'NY' });
    });
    it('returns emptyValue for empty string', () => {
      expect(enumOptionValueDecoder('', stringOptions, true, '')).toBe('');
    });
    it('handles array of real values', () => {
      expect(enumOptionValueDecoder(['foo', 'bar'], stringOptions, true)).toEqual(['foo', 'bar']);
    });
    it('returns emptyValue for unmatched value', () => {
      expect(enumOptionValueDecoder('nonexistent', stringOptions, true, 'empty')).toBe('empty');
    });
  });
});
