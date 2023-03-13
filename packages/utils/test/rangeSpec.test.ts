import { rangeSpec } from '../src';

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
  it('returns an partial range spec when the schema contains zero range info', () => {
    expect(rangeSpec({ multipleOf: 0, minimum: 0, maximum: 0 })).toEqual({
      min: 0,
      max: 0,
    });
  });
});
