import { ENUM_OPTION_INDEX_PREFIX, enumOptionSelectedValue, enumOptionValueEncoder } from '../src/index.ts';
import type { EnumOptionsType } from '../src/index.ts';

const stringOptions: EnumOptionsType[] = [
  { value: 'foo', label: 'Foo' },
  { value: 'bar', label: 'Bar' },
  { value: 'baz', label: 'Baz' },
];

const numericOptions: EnumOptionsType[] = [
  { value: 10, label: 'Ten' },
  { value: 20, label: 'Twenty' },
];

const arrayOptions: EnumOptionsType[] = [
  { value: [1], label: 'One' },
  { value: [2], label: 'Two' },
];

describe('enumOptionSelectedValue', () => {
  describe("when format is 'indexed' (default)", () => {
    it('returns index for a single value', () => {
      expect(enumOptionSelectedValue('bar', stringOptions, false, 'indexed', '')).toBe('1');
    });
    it('returns the index of an array option for a single selection', () => {
      expect(enumOptionSelectedValue([2], arrayOptions, false, 'indexed', '')).toBe('1');
    });
    it('returns indexes for multiple values', () => {
      expect(enumOptionSelectedValue(['foo', 'baz'], stringOptions, true, 'indexed', [])).toEqual(['0', '2']);
    });
    it('returns emptyValue when value is undefined', () => {
      expect(enumOptionSelectedValue(undefined, stringOptions, false, 'indexed', '')).toBe('');
    });
    it('returns emptyValue when value equals emptyValue (single)', () => {
      expect(enumOptionSelectedValue('', stringOptions, false, 'indexed', '')).toBe('');
    });
    it('returns emptyValue when value is empty array (multiple)', () => {
      expect(enumOptionSelectedValue([], stringOptions, true, 'indexed', [])).toEqual([]);
    });
    it('returns emptyValue when index not found', () => {
      expect(enumOptionSelectedValue('nonexistent', stringOptions, false, 'indexed', '')).toBe('');
    });
    it('selects the option carrying the emptyValue rather than treating it as no selection', () => {
      // Widgets pick sentinels like `null` (chakra's RadioWidget) or `''` (mui's RadioWidget, shadcn's SelectWidget)
      // that a `oneOf`/`anyOf` of constants can offer as an option of its own
      const nullOptions: EnumOptionsType[] = [
        { value: null, label: 'Unknown' },
        { value: true, label: 'Yes' },
      ];
      expect(enumOptionSelectedValue(null, nullOptions, false, 'indexed', null)).toBe('0');
      const emptyStringOptions: EnumOptionsType[] = [
        { value: '', label: 'Blank' },
        { value: 'a', label: 'A' },
      ];
      expect(enumOptionSelectedValue('', emptyStringOptions, false, 'indexed', '')).toBe('0');
    });
    it('defaults to indexed when format is omitted', () => {
      expect(enumOptionSelectedValue('bar', stringOptions, false)).toBe('1');
    });
  });

  describe("when format is 'realValue'", () => {
    const mixedOptions: EnumOptionsType[] = [
      { value: 'a', label: 'A' },
      { value: null, label: 'None' },
      { value: { id: 1 }, label: 'Object' },
    ];
    it('returns emptyValue for null when no option carries it', () => {
      expect(enumOptionSelectedValue(null, stringOptions, false, 'realValue', '')).toBe('');
    });
    it('encodes null the same way as the option value', () => {
      expect(enumOptionSelectedValue(null, mixedOptions, false, 'realValue', '')).toBe(
        enumOptionValueEncoder(null, 1, 'realValue'),
      );
    });
    it('encodes an object value as its option index', () => {
      expect(enumOptionSelectedValue({ id: 1 }, mixedOptions, false, 'realValue', '')).toBe(
        `${ENUM_OPTION_INDEX_PREFIX}2`,
      );
    });
    it('encodes an array value of a single selection as its option index', () => {
      expect(enumOptionSelectedValue([2], arrayOptions, false, 'realValue', '')).toBe(`${ENUM_OPTION_INDEX_PREFIX}1`);
    });
    it('returns emptyValue for an object value that matches no option', () => {
      expect(enumOptionSelectedValue({ id: 2 }, mixedOptions, false, 'realValue', '')).toBe('');
    });
    it('leaves out an unmatched object of multiple values, as the indexed format does', () => {
      expect(enumOptionSelectedValue([{ id: 1 }, { id: 2 }], mixedOptions, true, 'realValue', [])).toEqual([
        `${ENUM_OPTION_INDEX_PREFIX}2`,
      ]);
    });
    it('encodes multiple values the same way as the option values', () => {
      expect(enumOptionSelectedValue(['a', null], mixedOptions, true, 'realValue', [])).toEqual([
        'a',
        `${ENUM_OPTION_INDEX_PREFIX}1`,
      ]);
    });
    it('keeps an empty string option apart from the empty selection of a single select', () => {
      const options: EnumOptionsType[] = [
        { label: 'empty', value: '' },
        { label: 'object', value: { a: 1 } },
      ];
      expect(enumOptionSelectedValue({ a: 2 }, options, false, 'realValue', '')).toBe('');
      expect(enumOptionSelectedValue('', options, false, 'realValue', '')).toBe(`${ENUM_OPTION_INDEX_PREFIX}0`);
    });
    it('does not select an empty string option for an unmatched lone value of a multiple selection', () => {
      const options: EnumOptionsType[] = [
        { label: 'empty', value: '' },
        { label: 'a', value: 'a' },
      ];
      expect(enumOptionSelectedValue(null, options, true, 'realValue', [])).toEqual([]);
    });
    it('encodes a selected string spelled with the index prefix as its option does', () => {
      const options: EnumOptionsType[] = [
        { label: 'Object', value: { a: 1 } },
        { label: 'Prefixed string', value: `${ENUM_OPTION_INDEX_PREFIX}0` },
      ];
      expect(enumOptionSelectedValue(`${ENUM_OPTION_INDEX_PREFIX}0`, options, false, 'realValue')).toBe(
        `${ENUM_OPTION_INDEX_PREFIX}1`,
      );
    });
    it('matches a lone non-array value of a multiple selection as a one-item selection', () => {
      expect(enumOptionSelectedValue(null, mixedOptions, true, 'realValue', [])).toEqual([
        `${ENUM_OPTION_INDEX_PREFIX}1`,
      ]);
      expect(enumOptionSelectedValue(null, stringOptions, true, 'realValue', [])).toEqual([]);
      expect(enumOptionSelectedValue('bar', stringOptions, true, 'realValue', [])).toEqual(['bar']);
    });
    it('returns String(value) for a single string value', () => {
      expect(enumOptionSelectedValue('bar', stringOptions, false, 'realValue', '')).toBe('bar');
    });
    it('returns String(value) for a single numeric value', () => {
      expect(enumOptionSelectedValue(10, numericOptions, false, 'realValue', '')).toBe('10');
    });
    it('returns value.map(String) for multiple values', () => {
      expect(enumOptionSelectedValue(['foo', 'baz'], stringOptions, true, 'realValue', [])).toEqual(['foo', 'baz']);
    });
    it('returns emptyValue when value is undefined', () => {
      expect(enumOptionSelectedValue(undefined, stringOptions, false, 'realValue', '')).toBe('');
    });
    it('returns emptyValue when value is empty array (multiple)', () => {
      expect(enumOptionSelectedValue([], stringOptions, true, 'realValue', [])).toEqual([]);
    });
    it('returns emptyValue when value equals emptyValue (single)', () => {
      expect(enumOptionSelectedValue('', stringOptions, false, 'realValue', '')).toBe('');
    });
  });
});
