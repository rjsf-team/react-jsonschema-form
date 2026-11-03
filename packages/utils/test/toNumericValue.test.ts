import type { RJSFSchema } from '../src/index.ts';
import { ratingStoresString, toNumericValue } from '../src/index.ts';

describe('toNumericValue()', () => {
  it.each([
    [3, 3],
    [0, 0],
    ['7', 7],
    [' 2.5 ', 2.5],
    ['-3', -3],
    ['+4', 4],
    ['.5', 0.5],
    ['5.', 5],
  ])('reads %j as a number', (value, expected) => {
    expect(toNumericValue(value)).toBe(expected);
  });

  it.each([
    [undefined],
    [null],
    [''],
    ['  '],
    ['abc'],
    ['0x3'],
    ['0b11'],
    ['0o7'],
    ['1e1'],
    ['Infinity'],
    ['-Infinity'],
    ['.'],
    ['1.2.3'],
    [false],
    [[]],
    [{}],
    [NaN],
    [Infinity],
  ])('reads %j as no number', (value) => {
    expect(toNumericValue(value)).toBeUndefined();
  });
});

describe('ratingStoresString()', () => {
  it.each<{ schema: RJSFSchema; value: unknown; expected: boolean }>([
    { schema: { type: 'string' }, value: 3, expected: true },
    { schema: { type: ['string', 'null'] }, value: null, expected: true },
    { schema: { type: 'integer' }, value: '3', expected: false },
    { schema: { type: ['integer', 'string'] }, value: 3, expected: false },
    { schema: { type: ['number', 'string'] }, value: '3', expected: false },
    { schema: {}, value: '3', expected: true },
    { schema: {}, value: 3, expected: false },
  ])('$schema holding $value', ({ schema, value, expected }) => {
    expect(ratingStoresString(schema, value)).toBe(expected);
  });
});
