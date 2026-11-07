import { offersClearButton, toInputValue } from '../src/index.ts';

describe('offersClearButton()', () => {
  it.each([[5], [-1.5], [1e21], [1e-7], ['7'], ['0'], ['-.5'], ['1e5'], ['2E-3'], [[1]]])(
    'a number input showing %j offers it',
    (value) => {
      expect(offersClearButton(toInputValue(value), 'number')).toBe(true);
    },
  );

  it.each([
    [0],
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
  ])('a number input given %j offers none', (value) => {
    expect(offersClearButton(toInputValue(value), 'number')).toBe(false);
  });

  it.each([
    ['date', '2024-02-29'],
    ['date', '12024-12-31'],
    ['datetime-local', '2024-02-29T23:59'],
    ['datetime-local', '2024-02-29 00:00:59.999'],
    ['month', '2024-12'],
    ['time', '09:05'],
    ['time', '23:59:59.5'],
    ['week', '2024-W53'],
  ])('a %s input showing %j offers it', (type, value) => {
    expect(offersClearButton(value, type)).toBe(true);
  });

  it.each([
    ['date', 'not-a-date'],
    ['date', '2024-13-01'],
    ['date', '2024-1-01'],
    ['date', '2024-02-29T00:00'],
    ['datetime-local', '2024-02-29'],
    ['datetime-local', '2024-02-29T24:00'],
    ['month', '2024-00'],
    ['time', '9:05'],
    ['time', '12:60'],
    ['time', '12:00:00.1234'],
    ['week', '2024-W54'],
    ['week', '2024-W00'],
    ['date', 'false'],
  ])('a %s input given %j offers none', (type, value) => {
    expect(offersClearButton(value, type)).toBe(false);
  });

  it.each([[5], ['5'], ['abc']])('a range input given %j offers none', (value) => {
    expect(offersClearButton(value, 'range')).toBe(false);
  });

  it('a color input offers none', () => {
    expect(offersClearButton('#ff0000', 'color')).toBe(false);
  });

  it.each([['text'], ['constructor'], [undefined]])(
    'a %s input offers it for anything but an empty string or 0',
    (type) => {
      expect(offersClearButton(toInputValue(false), type)).toBe(true);
      expect(offersClearButton('abc', type)).toBe(true);
      expect(offersClearButton('0', type)).toBe(true);
      expect(offersClearButton(0, type)).toBe(false);
      expect(offersClearButton('', type)).toBe(false);
      expect(offersClearButton(toInputValue({ a: 1 }), type)).toBe(false);
    },
  );
});
