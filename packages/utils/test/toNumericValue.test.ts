import type { RJSFSchema } from '../src/index.ts';
import { ratingStarCount, ratingStoresString, toNumericValue } from '../src/index.ts';

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

describe('numericWidgetStoresString()', () => {
  it.each<{ schema: RJSFSchema; value: unknown; expected: boolean }>([
    { schema: { type: 'string' }, value: 3, expected: true },
    { schema: { type: ['string', 'null'] }, value: null, expected: true },
    { schema: { type: 'integer' }, value: '3', expected: false },
    { schema: { type: ['integer', 'string'] }, value: 3, expected: false },
    { schema: { type: ['number', 'string'] }, value: '3', expected: false },
    { schema: {}, value: '3', expected: true },
    { schema: {}, value: 3, expected: false },
  ])('$schema holding $value', ({ schema, value, expected }) => {
    expect(numericWidgetStoresString(schema, value)).toBe(expected);
  });
});

describe('ratingStarCount()', () => {
  it.each<{ schema: RJSFSchema; stars: unknown; expected: number }>([
    { schema: {}, stars: 3, expected: 3 },
    { schema: {}, stars: '3', expected: 3 },
    { schema: {}, stars: 2.5, expected: 2 },
    { schema: {}, stars: 9, expected: 5 },
    { schema: {}, stars: 0, expected: 1 },
    { schema: {}, stars: undefined, expected: 5 },
    { schema: {}, stars: true, expected: 5 },
    { schema: { maximum: 3 }, stars: 5, expected: 3 },
    { schema: { maximum: 9 }, stars: 2, expected: 5 },
    { schema: { maximum: 0.5 }, stars: 2, expected: 1 },
    { schema: { maximum: 0 }, stars: 3, expected: 3 },
    { schema: { maximum: -2 }, stars: 2, expected: 1 },
    { schema: { maximum: 3.7 }, stars: 2, expected: 3 },
  ])('$schema with stars $stars', ({ schema, stars, expected }) => {
    expect(ratingStarCount(schema, stars)).toBe(expected);
  });
  it.each([
    ['a string that is not a number', '{"maximum": "abc"}'],
    ['a `$data` reference', '{"maximum": {"$data": "1/max"}}'],
    ['null', '{"maximum": null}'],
  ])('falls back to the `stars` option for a JSON schema `maximum` of %s', (_, json) => {
    const schema: RJSFSchema = JSON.parse(json);
    expect(ratingStarCount(schema, 3)).toBe(3);
  });
});
