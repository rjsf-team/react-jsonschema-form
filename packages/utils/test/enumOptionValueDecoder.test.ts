import { ENUM_OPTION_INDEX_PREFIX, enumOptionValueDecoder } from '../src/index.ts';
import type { EnumOptionsType } from '../src/index.ts';

const stringOptions: EnumOptionsType[] = [
  { value: 'foo', label: 'Foo' },
  { value: 'bar', label: 'Bar' },
];

const numericOptions: EnumOptionsType[] = [
  { value: 123, label: '123' },
  { value: 456, label: '456' },
];

const booleanOptions: EnumOptionsType[] = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
];

const nullableOptions: EnumOptionsType[] = [
  { value: null, label: 'Unknown' },
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
];

const objectOptions: EnumOptionsType[] = [
  { value: { name: 'NY' }, label: 'New York' },
  { value: { name: 'LA' }, label: 'Los Angeles' },
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
    it('returns emptyValue for empty string', () => {
      expect(enumOptionValueDecoder('', stringOptions, 'realValue', '')).toBe('');
    });
    it('finds null by its prefixed index', () => {
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}0`, nullableOptions, 'realValue', 'empty')).toBeNull();
    });
    it('finds object value by its prefixed index', () => {
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}1`, objectOptions, 'realValue')).toEqual({
        name: 'LA',
      });
    });
    it('keeps a null option apart from a primitive option spelled as its index', () => {
      const options: EnumOptionsType[] = [
        { value: null, label: 'None' },
        { value: 0, label: 'Zero' },
      ];
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}0`, options, 'realValue')).toBeNull();
      expect(enumOptionValueDecoder('0', options, 'realValue')).toBe(0);
    });
    it('keeps a null option apart from primitive options that share a String() and are spelled as its index', () => {
      const options: EnumOptionsType[] = [
        { value: null, label: 'None' },
        { value: 0, label: 'Zero' },
        { value: '0', label: 'Zero string' },
      ];
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}0`, options, 'realValue')).toBeNull();
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}1`, options, 'realValue')).toBe(0);
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}2`, options, 'realValue')).toBe('0');
      expect(enumOptionValueDecoder('0', options, 'realValue', 'empty')).toBe('empty');
    });
    it('finds an empty string option by its prefixed index, and reads the empty string as no selection', () => {
      const options: EnumOptionsType[] = [
        { value: 'a', label: 'A' },
        { value: '', label: 'Empty' },
      ];
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}1`, options, 'realValue', 'none')).toBe('');
      expect(enumOptionValueDecoder('', options, 'realValue', 'none')).toBe('none');
    });
    it('keeps an object option apart from a string option spelled as its prefixed index', () => {
      const options: EnumOptionsType[] = [
        { value: `${ENUM_OPTION_INDEX_PREFIX}1`, label: 'Prefixed string' },
        { value: { a: 1 }, label: 'Object' },
      ];
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}1`, options, 'realValue')).toEqual({ a: 1 });
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}0`, options, 'realValue')).toBe(
        `${ENUM_OPTION_INDEX_PREFIX}1`,
      );
    });
    it('tells apart options whose String() is the same', () => {
      const options: EnumOptionsType[] = [
        { value: 1, label: 'Number' },
        { value: '1', label: 'String' },
        { value: 2, label: 'Two' },
      ];
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}0`, options, 'realValue', 'empty')).toBe(1);
      expect(enumOptionValueDecoder(`${ENUM_OPTION_INDEX_PREFIX}1`, options, 'realValue', 'empty')).toBe('1');
      expect(enumOptionValueDecoder('1', options, 'realValue', 'empty')).toBe('empty');
      expect(enumOptionValueDecoder('2', options, 'realValue', 'empty')).toBe(2);
    });
    it('returns emptyValue for empty string when an option is null', () => {
      expect(enumOptionValueDecoder('', nullableOptions, 'realValue', 'empty')).toBe('empty');
    });
    it('does not resolve a bare index as the option at that position', () => {
      expect(enumOptionValueDecoder('1', stringOptions, 'realValue', 'empty')).toBe('empty');
      expect(enumOptionValueDecoder('1', numericOptions, 'realValue', 'empty')).toBe('empty');
      expect(enumOptionValueDecoder('0', objectOptions, 'realValue', 'empty')).toBe('empty');
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
