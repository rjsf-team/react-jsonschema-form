import { enumOptionValueDecoder } from '../src';
import { EnumOptionsType, RJSFSchema } from '../src';

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

describe('enumOptionValueDecoder', () => {
  describe("when format is 'indexed' (default)", () => {
    it('resolves index to value', () => {
      expect(enumOptionValueDecoder('0', stringOptions, 'indexed')).toBe('foo');
    });
    it('resolves second index', () => {
      expect(enumOptionValueDecoder('1', stringOptions, 'indexed')).toBe('bar');
    });
    it('returns emptyValue for empty string', () => {
      expect(enumOptionValueDecoder('', stringOptions, 'indexed', '')).toBe('');
    });
    it('handles array of indices', () => {
      expect(enumOptionValueDecoder(['0', '1'], stringOptions, 'indexed')).toEqual(['foo', 'bar']);
    });
    it('defaults to indexed when format is omitted', () => {
      expect(enumOptionValueDecoder('0', stringOptions)).toBe('foo');
    });
  });

  describe("when format is 'realValue'", () => {
    it('finds string value by matching', () => {
      expect(enumOptionValueDecoder('bar', stringOptions, 'realValue')).toBe('bar');
    });
    it('finds numeric value from string', () => {
      expect(enumOptionValueDecoder('123', numericOptions, 'realValue')).toBe(123);
    });
    it('finds boolean true from string', () => {
      expect(enumOptionValueDecoder('true', booleanOptions, 'realValue')).toBe(true);
    });
    it('finds boolean false from string', () => {
      expect(enumOptionValueDecoder('false', booleanOptions, 'realValue')).toBe(false);
    });
    it('finds object value by index fallback', () => {
      expect(enumOptionValueDecoder('0', objectOptions, 'realValue')).toEqual({ name: 'NY' });
    });
    it('returns emptyValue for empty string', () => {
      expect(enumOptionValueDecoder('', stringOptions, 'realValue', '')).toBe('');
    });
    it('handles array of real values', () => {
      expect(enumOptionValueDecoder(['foo', 'bar'], stringOptions, 'realValue')).toEqual(['foo', 'bar']);
    });
    it('returns emptyValue for unmatched value', () => {
      expect(enumOptionValueDecoder('nonexistent', stringOptions, 'realValue', 'empty')).toBe('empty');
    });
    it('returns emptyValue when enumOptions is undefined', () => {
      expect(enumOptionValueDecoder('foo', undefined, 'realValue', 'empty')).toBe('empty');
    });
  });
});
