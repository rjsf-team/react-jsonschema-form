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
  describe('when useRealValues is false (index mode)', () => {
    it('returns index for a single value', () => {
      expect(enumOptionSelectedValue('bar', stringOptions, false, false, '')).toBe('1');
    });
    it('returns indexes for multiple values', () => {
      expect(enumOptionSelectedValue(['foo', 'baz'], stringOptions, true, false, [])).toEqual(['0', '2']);
    });
    it('returns emptyValue when value is undefined', () => {
      expect(enumOptionSelectedValue(undefined, stringOptions, false, false, '')).toBe('');
    });
    it('returns emptyValue when value equals emptyValue (single)', () => {
      expect(enumOptionSelectedValue('', stringOptions, false, false, '')).toBe('');
    });
    it('returns emptyValue when value is empty array (multiple)', () => {
      expect(enumOptionSelectedValue([], stringOptions, true, false, [])).toEqual([]);
    });
    it('returns emptyValue when index not found', () => {
      expect(enumOptionSelectedValue('nonexistent', stringOptions, false, false, '')).toBe('');
    });
  });

  describe('when useRealValues is true', () => {
    it('returns String(value) for a single string value', () => {
      expect(enumOptionSelectedValue('bar', stringOptions, false, true, '')).toBe('bar');
    });
    it('returns String(value) for a single numeric value', () => {
      expect(enumOptionSelectedValue(10, numericOptions, false, true, '')).toBe('10');
    });
    it('returns value.map(String) for multiple values', () => {
      expect(enumOptionSelectedValue(['foo', 'baz'], stringOptions, true, true, [])).toEqual(['foo', 'baz']);
    });
    it('returns emptyValue when value is undefined', () => {
      expect(enumOptionSelectedValue(undefined, stringOptions, false, true, '')).toBe('');
    });
    it('returns emptyValue when value is empty array (multiple)', () => {
      expect(enumOptionSelectedValue([], stringOptions, true, true, [])).toEqual([]);
    });
    it('returns emptyValue when value equals emptyValue (single)', () => {
      expect(enumOptionSelectedValue('', stringOptions, false, true, '')).toBe('');
    });
  });
});
