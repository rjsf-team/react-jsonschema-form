import { inputShowsValue } from '../src/index.ts';

describe('inputShowsValue()', () => {
  it.each([[5], [0], [-1.5], [1e21], [1e-7], ['7'], ['-.5'], ['1e5'], ['2E-3'], [[1]]])(
    'a number input shows %j',
    (value) => {
      expect(inputShowsValue(value, 'number')).toBe(true);
    },
  );

  it.each([
    [false],
    [true],
    [undefined],
    [null],
    [''],
    ['abc'],
    ['+5'],
    [' 5'],
    ['5.'],
    ['0x3'],
    [Number.NaN],
    [Number.POSITIVE_INFINITY],
    [{ a: 1 }],
    [[1, 2]],
  ])('a number input blanks %j', (value) => {
    expect(inputShowsValue(value, 'number')).toBe(false);
  });

  it.each([['text'], [undefined]])('a %s input shows anything but an empty string', (type) => {
    expect(inputShowsValue(false, type)).toBe(true);
    expect(inputShowsValue('abc', type)).toBe(true);
    expect(inputShowsValue(0, type)).toBe(true);
    expect(inputShowsValue('', type)).toBe(false);
    expect(inputShowsValue(undefined, type)).toBe(false);
    expect(inputShowsValue({ a: 1 }, type)).toBe(false);
  });
});
