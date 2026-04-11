import { enumOptionSelectedValue } from '../src';
import { EnumOptionsType, RJSFSchema } from '../src';

const stringOptions: EnumOptionsType<RJSFSchema>[] = [
  { value: 'foo', label: 'Foo' },
  { value: 'bar', label: 'Bar' },
  { value: 'baz', label: 'Baz' },
];

const numericOptions: EnumOptionsType<RJSFSchema>[] = [
  { value: 10, label: 'Ten' },
  { value: 20, label: 'Twenty' },
];

describe('enumOptionSelectedValue', () => {
  describe("when format is 'indexed' (default)", () => {
    it('returns index for a single value', () => {
      expect(enumOptionSelectedValue('bar', stringOptions, false, 'indexed', '')).toBe('1');
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
    it('defaults to indexed when format is omitted', () => {
      expect(enumOptionSelectedValue('bar', stringOptions, false)).toBe('1');
    });
  });

  describe("when format is 'realValue'", () => {
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
