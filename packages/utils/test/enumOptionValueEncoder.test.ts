import { ENUM_OPTION_INDEX_PREFIX, enumOptionValueEncoder } from '../src/index.ts';
import type { EnumOptionsType } from '../src/index.ts';

describe('enumOptionValueEncoder', () => {
  describe("when format is 'indexed'", () => {
    it('returns the index as a string', () => {
      expect(enumOptionValueEncoder('hello', 2, undefined, 'indexed')).toBe('2');
    });
    it('returns the index for numeric values', () => {
      expect(enumOptionValueEncoder(123, 0, undefined, 'indexed')).toBe('0');
    });
    it('returns the index for object values', () => {
      expect(enumOptionValueEncoder({ name: 'test' }, 1, undefined, 'indexed')).toBe('1');
    });
    it('defaults to indexed when format is omitted', () => {
      expect(enumOptionValueEncoder('hello', 2, undefined)).toBe('2');
    });
  });

  describe("when format is 'realValue'", () => {
    it('returns String(value) for string values', () => {
      expect(enumOptionValueEncoder('hello', 2, undefined, 'realValue')).toBe('hello');
    });
    it('returns String(value) for numeric values', () => {
      expect(enumOptionValueEncoder(123, 0, undefined, 'realValue')).toBe('123');
    });
    it('returns String(value) for boolean values', () => {
      expect(enumOptionValueEncoder(true, 0, undefined, 'realValue')).toBe('true');
    });
    it('falls back to index for object values', () => {
      expect(enumOptionValueEncoder({ name: 'test' }, 1, undefined, 'realValue')).toBe(`${ENUM_OPTION_INDEX_PREFIX}1`);
    });
    it('falls back to index for array values', () => {
      expect(enumOptionValueEncoder([1, 2], 0, undefined, 'realValue')).toBe(`${ENUM_OPTION_INDEX_PREFIX}0`);
    });
    it('returns empty string for undefined', () => {
      expect(enumOptionValueEncoder(undefined, 0, undefined, 'realValue')).toBe('');
    });
    it('falls back to index for null, keeping it distinct from the empty placeholder', () => {
      expect(enumOptionValueEncoder(null, 2, undefined, 'realValue')).toBe(`${ENUM_OPTION_INDEX_PREFIX}2`);
    });
    it('falls back to index for the empty string, keeping it distinct from the empty placeholder', () => {
      expect(enumOptionValueEncoder('', 3, undefined, 'realValue')).toBe(`${ENUM_OPTION_INDEX_PREFIX}3`);
    });
    it('falls back to index for a string spelled with the index prefix', () => {
      expect(enumOptionValueEncoder(`${ENUM_OPTION_INDEX_PREFIX}1`, 0, undefined, 'realValue')).toBe(
        `${ENUM_OPTION_INDEX_PREFIX}0`,
      );
    });
    describe('when given the enum options', () => {
      const options: EnumOptionsType[] = [
        { value: 1, label: 'Number' },
        { value: '1', label: 'String' },
        { value: true, label: 'True' },
        { value: 'true', label: 'String true' },
        { value: null, label: 'Null' },
        { value: 'null', label: 'String null' },
        { value: 'other', label: 'Other' },
      ];
      it('encodes each option whose String() another option shares as its index', () => {
        expect(options.map((opt, index) => enumOptionValueEncoder(opt.value, index, options, 'realValue'))).toEqual([
          `${ENUM_OPTION_INDEX_PREFIX}0`,
          `${ENUM_OPTION_INDEX_PREFIX}1`,
          `${ENUM_OPTION_INDEX_PREFIX}2`,
          `${ENUM_OPTION_INDEX_PREFIX}3`,
          `${ENUM_OPTION_INDEX_PREFIX}4`,
          'null',
          'other',
        ]);
      });
      it('does not count an undefined option as sharing the String() of an undefined string option', () => {
        const undefinedOptions: EnumOptionsType[] = [
          { value: undefined, label: 'None' },
          { value: 'undefined', label: 'String' },
        ];
        expect(enumOptionValueEncoder('undefined', 1, undefinedOptions, 'realValue')).toBe('undefined');
      });
      it('ignores the options in the indexed format', () => {
        expect(enumOptionValueEncoder('1', 1, options, 'indexed')).toBe('1');
      });
    });
  });
});
