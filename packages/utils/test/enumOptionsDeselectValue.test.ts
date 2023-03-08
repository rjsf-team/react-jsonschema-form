import { enumOptionsDeselectValue, EnumOptionsType } from '../src';
import { ALL_OPTIONS } from './testUtils/testData';

const ALL_VALUES = ALL_OPTIONS.map((opt) => opt.value);

describe('enumOptionsDeselectValue()', () => {
  let selected: EnumOptionsType['value'][];
  it('returns same selection when no options', () => {
    selected = enumOptionsDeselectValue('0', ALL_VALUES);
    expect(selected).toEqual(ALL_VALUES);
  });
  it('returns same selection when index is negative', () => {
    selected = enumOptionsDeselectValue('-1', ALL_VALUES, ALL_OPTIONS);
    expect(selected).toEqual(ALL_VALUES);
  });
  it('returns same selection when index > length', () => {
    selected = enumOptionsDeselectValue(ALL_OPTIONS.length, ALL_VALUES, ALL_OPTIONS);
    expect(selected).toEqual(ALL_VALUES);
  });
  it('removes a value from a selected list', () => {
    selected = enumOptionsDeselectValue(1, ALL_VALUES, ALL_OPTIONS);
    expect(selected).toEqual([ALL_VALUES[0], ALL_VALUES[2], ALL_VALUES[3]]);
  });
  it('removes a second value from a selected list', () => {
    selected = enumOptionsDeselectValue(0, selected, ALL_OPTIONS);
    expect(selected).toEqual([ALL_VALUES[2], ALL_VALUES[3]]);
  });
  it('removes a third value from a selected list', () => {
    expect(enumOptionsDeselectValue(2, selected, ALL_OPTIONS)).toEqual([ALL_VALUES[3]]);
  });
  it('returns the selected value when index does not match value', () => {
    expect(enumOptionsDeselectValue(1, ALL_VALUES[0], ALL_OPTIONS)).toBe(ALL_VALUES[0]);
  });
  it('returns undefined when index does not matches value', () => {
    expect(enumOptionsDeselectValue('0', ALL_VALUES[0], ALL_OPTIONS)).toBeUndefined();
  });
  it('returns undefined when index does not matches value', () => {
    expect(enumOptionsDeselectValue('0', undefined)).toBeUndefined();
  });
});
