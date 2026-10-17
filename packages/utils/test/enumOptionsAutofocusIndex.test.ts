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
  it('focuses nothing where every option is disabled, or there are none', () => {
    expect(enumOptionsAutofocusIndex(options, ['r', 'g', 'b'], true)).toBe(-1);
    expect(enumOptionsAutofocusIndex(undefined, undefined, true)).toBe(-1);
  });
});
