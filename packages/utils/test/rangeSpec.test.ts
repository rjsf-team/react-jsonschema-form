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
  it('sets no step or bound from NaN', () => {
    expect(rangeSpec({ multipleOf: Number.NaN, minimum: Number.NaN, maximum: Number.NaN })).toEqual({});
  });

  it('returns an partial range spec when the schema contains zero range info', () => {
    expect(rangeSpec({ multipleOf: 0, minimum: 0, maximum: 0 })).toEqual({
      min: 0,
      max: 0,
    });
  });
});
