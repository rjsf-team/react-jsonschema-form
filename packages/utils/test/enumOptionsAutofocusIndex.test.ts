import { enumOptionsAutofocusIndex } from '../src/index.ts';

const options = [
  { label: 'Red', value: 'r' },
  { label: 'Green', value: 'g' },
  { label: 'Blue', value: 'b' },
];

describe('enumOptionsAutofocusIndex()', () => {
  it('focuses nothing without autofocus', () => {
    expect(enumOptionsAutofocusIndex(options)).toBe(-1);
    expect(enumOptionsAutofocusIndex(options, undefined, false)).toBe(-1);
  });
  it('focuses the first option ui:enumDisabled leaves enabled', () => {
    expect(enumOptionsAutofocusIndex(options, undefined, true)).toBe(0);
    expect(enumOptionsAutofocusIndex(options, ['r'], true)).toBe(1);
    expect(enumOptionsAutofocusIndex(options, ['r', 'g'], true)).toBe(2);
  });
  it("focuses a radio group's checked option where it is enabled, as Tab into the group does", () => {
    expect(enumOptionsAutofocusIndex(options, undefined, true, 'b')).toBe(2);
    expect(enumOptionsAutofocusIndex(options, ['r'], true, 'g')).toBe(1);
    expect(enumOptionsAutofocusIndex(options, undefined, false, 'b')).toBe(-1);
  });
  it('focuses the first enabled option where the checked one is disabled or none is checked', () => {
    expect(enumOptionsAutofocusIndex(options, ['b'], true, 'b')).toBe(0);
    expect(enumOptionsAutofocusIndex(options, ['r'], true, 'x')).toBe(1);
    expect(enumOptionsAutofocusIndex(options, ['r'], true, undefined)).toBe(1);
  });
  it('compares an array value whole, as a radio group does', () => {
    const arrayOptions = [
      { label: 'One', value: [1] },
      { label: 'Two', value: [2] },
    ];
    expect(enumOptionsAutofocusIndex(arrayOptions, undefined, true, [2])).toBe(1);
  });
  it('focuses nothing where every option is disabled, or there are none', () => {
    expect(enumOptionsAutofocusIndex(options, ['r', 'g', 'b'], true)).toBe(-1);
    expect(enumOptionsAutofocusIndex(undefined, undefined, true)).toBe(-1);
  });
});
