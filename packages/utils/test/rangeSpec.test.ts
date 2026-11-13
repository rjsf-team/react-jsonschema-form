import { rangeSpec } from '../src/index.ts';

describe('rangeSpec()', () => {
  it('returns an empty object when the schema does not contain range info', () => {
    expect(rangeSpec({})).toEqual({});
  });
  it('returns an full range spec when the schema contains non-zero range info', () => {
    expect(rangeSpec({ multipleOf: 1, minimum: 1, maximum: 2 })).toEqual({
      step: 1,
      min: 1,
      max: 2,
    });
  });
  it("sets nothing from an Ajv `$data` reference, which names another value's bound", () => {
    const reference = { $data: '1/low' };
    // @ts-expect-error `minimum`, `maximum` and `multipleOf` are numbers, but Ajv with `$data` takes a reference too
    expect(rangeSpec({ minimum: reference, maximum: reference, multipleOf: reference })).toEqual({});
  });
  it('sets no step or bound from NaN or Infinity', () => {
    expect(rangeSpec({ multipleOf: Number.NaN, minimum: Number.NaN, maximum: Number.NaN })).toEqual({});
    expect(rangeSpec({ multipleOf: Infinity, minimum: -Infinity, maximum: Infinity })).toEqual({});
  });
  it('reads a numeric-string keyword as its number', () => {
    // @ts-expect-error these keywords are numbers, but a schema that skips Ajv's meta-schema can hold strings
    expect(rangeSpec({ multipleOf: '2', minimum: '5', maximum: '0' })).toEqual({ step: 2, min: 5, max: 0 });
  });
  it('sets no step or bound from a string that is no number, or a `multipleOf` that reads as 0', () => {
    // @ts-expect-error these keywords are numbers, but a schema that skips Ajv's meta-schema can hold strings
    expect(rangeSpec({ multipleOf: '0', minimum: 'low', maximum: '' })).toEqual({});
  });

  it('returns an partial range spec when the schema contains zero range info', () => {
    expect(rangeSpec({ multipleOf: 0, minimum: 0, maximum: 0 })).toEqual({
      min: 0,
      max: 0,
    });
  });
});
