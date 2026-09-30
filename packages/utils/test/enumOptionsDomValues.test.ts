import { ENUM_OPTION_INDEX_PREFIX, enumOptionsDomValues } from '../src/index.ts';
import type { EnumOptionsType } from '../src/index.ts';

const toOptions = (...values: unknown[]): EnumOptionsType[] => values.map((value) => ({ value, label: String(value) }));

describe('enumOptionsDomValues', () => {
  it('returns an empty list without options', () => {
    expect(enumOptionsDomValues(undefined, 'realValue')).toEqual([]);
  });

  describe("when format is 'indexed'", () => {
    it('returns each position, whatever the values are', () => {
      expect(enumOptionsDomValues(toOptions('hello', 123, { name: 'test' }, 1, '1'), 'indexed')).toEqual([
        '0',
        '1',
        '2',
        '3',
        '4',
      ]);
    });
    it('is the default format', () => {
      expect(enumOptionsDomValues(toOptions('hello', 'world'))).toEqual(['0', '1']);
    });
  });

  describe("when format is 'realValue'", () => {
    it('returns String(value) for string, number and boolean values', () => {
      expect(enumOptionsDomValues(toOptions('hello', 123, true), 'realValue')).toEqual(['hello', '123', 'true']);
    });
    it('falls back to the prefixed index for object and array values', () => {
      expect(enumOptionsDomValues(toOptions({ name: 'test' }, [1, 2]), 'realValue')).toEqual([
        `${ENUM_OPTION_INDEX_PREFIX}0`,
        `${ENUM_OPTION_INDEX_PREFIX}1`,
      ]);
    });
    it('returns the empty string for undefined', () => {
      expect(enumOptionsDomValues(toOptions(undefined), 'realValue')).toEqual(['']);
    });
    it('falls back to the prefixed index for null and the empty string, keeping them apart from the placeholder', () => {
      expect(enumOptionsDomValues(toOptions('a', null, ''), 'realValue')).toEqual([
        'a',
        `${ENUM_OPTION_INDEX_PREFIX}1`,
        `${ENUM_OPTION_INDEX_PREFIX}2`,
      ]);
    });
    it('falls back to the prefixed index for a string spelled with the index prefix', () => {
      expect(enumOptionsDomValues(toOptions(`${ENUM_OPTION_INDEX_PREFIX}1`, 'b'), 'realValue')).toEqual([
        `${ENUM_OPTION_INDEX_PREFIX}0`,
        'b',
      ]);
    });
    it('encodes each option whose String() another option shares as its prefixed index', () => {
      expect(enumOptionsDomValues(toOptions(1, '1', true, 'true', null, 'null', 'other'), 'realValue')).toEqual([
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
      expect(enumOptionsDomValues(toOptions(undefined, 'undefined'), 'realValue')).toEqual(['', 'undefined']);
    });
  });
});
