import { uiBooleanOption } from '../src/index.ts';

describe('uiBooleanOption()', () => {
  it('returns undefined for an unset option', () => {
    expect(uiBooleanOption(undefined)).toBeUndefined();
  });

  it.each([
    [true, true],
    [false, false],
    [1, true],
    [0, false],
    [null, false],
    ['', false],
    ['false', true],
  ])('reads %j as %j', (value, expected) => {
    expect(uiBooleanOption(value)).toBe(expected);
  });
});
