import type { RJSFSchema } from '../src/index.ts';
import { ratingStoresString, toNumericValue } from '../src/index.ts';

describe('toNumericValue()', () => {
  it.each([
    [3, 3],
    [0, 0],
    ['7', 7],
    [' 2.5 ', 2.5],
  ])('reads %j as a number', (value, expected) => {
    expect(toNumericValue(value)).toBe(expected);
  });

  it.each([[undefined], [null], [''], ['  '], ['abc'], [false], [[]], [{}], [NaN], [Infinity]])(
    'reads %j as no number',
    (value) => {
      expect(toNumericValue(value)).toBeUndefined();
    },
  );
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
