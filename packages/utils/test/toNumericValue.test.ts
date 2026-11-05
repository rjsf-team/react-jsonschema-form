import type { RJSFSchema } from '../src/index.ts';
import { numericWidgetStoresString, ratingStarValues, toNumericValue } from '../src/index.ts';

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

describe('ratingStarValues()', () => {
  it.each<{ schema: RJSFSchema; stars: unknown; expected: number }>([
    { schema: {}, stars: 3, expected: 3 },
    { schema: {}, stars: '3', expected: 3 },
    { schema: {}, stars: 2.5, expected: 2 },
    { schema: {}, stars: 9, expected: 5 },
    { schema: {}, stars: 0, expected: 1 },
    { schema: {}, stars: undefined, expected: 5 },
    { schema: {}, stars: true, expected: 5 },
    { schema: { maximum: 3 }, stars: 5, expected: 4 },
    { schema: { maximum: 9 }, stars: 2, expected: 2 },
    { schema: { maximum: 9 }, stars: 7, expected: 5 },
    { schema: { maximum: 0.5 }, stars: 2, expected: 1 },
    { schema: { maximum: 0 }, stars: 3, expected: 1 },
    { schema: { maximum: -2 }, stars: 2, expected: 1 },
    { schema: { maximum: 3.7 }, stars: 5, expected: 4 },
    { schema: { minimum: 1, maximum: 3 }, stars: 5, expected: 3 },
    { schema: { minimum: 1.3, maximum: 2.3 }, stars: 5, expected: 2 },
    { schema: { minimum: 2 }, stars: 4, expected: 4 },
  ])('$schema with stars $stars', ({ schema, stars, expected }) => {
    expect(ratingStarValues(schema, stars)).toHaveLength(expected);
  });
  it.each<{ maximum: string; stars: unknown; expected: number }>([
    { maximum: '3', stars: 5, expected: 4 },
    { maximum: '0', stars: 3, expected: 1 },
    { maximum: '0.5', stars: 2, expected: 1 },
    { maximum: 'three', stars: 2, expected: 2 },
  ])('a string maximum of $maximum with stars $stars', ({ maximum, stars, expected }) => {
    // @ts-expect-error `maximum` is a number, but a schema that skips Ajv's meta-schema can hold a string
    expect(ratingStarCount({ maximum }, stars)).toBe(expected);
  });

  it.each([
    ['a string that is not a number', '{"maximum": "abc"}'],
    ['a `$data` reference', '{"maximum": {"$data": "1/max"}}'],
    ['null', '{"maximum": null}'],
  ])('falls back to the `stars` option for a JSON schema `maximum` of %s', (_, json) => {
    const schema: RJSFSchema = JSON.parse(json);
    expect(ratingStarCount(schema, 3)).toBe(3);
  });
  it('reads a numeric string `minimum` and `maximum` from a JSON schema as their numbers', () => {
    const schema: RJSFSchema = JSON.parse('{"minimum": "1", "maximum": "3"}');
    expect(ratingStarCount(schema, 5)).toBe(3);
  });
});
