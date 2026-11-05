import {
  ADDITIONAL_PROPERTY_FLAG,
  EXTRA_KEYS_ELSEWHERE_FLAG,
  GUESSED_TYPE_FLAG,
  hasSchemaMarker,
  RJSF_PROVENANCE_KEY,
  RJSF_REF_CYCLE_KEY,
  RJSF_REF_KEY,
} from '../src/index.ts';

describe('hasSchemaMarker', () => {
  it('reads a marker set on a schema', () => {
    expect(hasSchemaMarker({ type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true }, ADDITIONAL_PROPERTY_FLAG)).toBe(true);
  });
  it('is false for a marker the schema does not carry, or carries unset', () => {
    expect(hasSchemaMarker({ type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true }, RJSF_REF_CYCLE_KEY)).toBe(false);
    expect(hasSchemaMarker({ [RJSF_REF_CYCLE_KEY]: false }, RJSF_REF_CYCLE_KEY)).toBe(false);
  });
  it('is false for a boolean subschema, and for anything that is not a schema', () => {
    expect(hasSchemaMarker(true, ADDITIONAL_PROPERTY_FLAG)).toBe(false);
    expect(hasSchemaMarker(false, ADDITIONAL_PROPERTY_FLAG)).toBe(false);
    expect(hasSchemaMarker(null, ADDITIONAL_PROPERTY_FLAG)).toBe(false);
    expect(hasSchemaMarker(undefined, ADDITIONAL_PROPERTY_FLAG)).toBe(false);
  });
  it('takes only the markers that hold a flag', () => {
    const marked = { [GUESSED_TYPE_FLAG]: true, [EXTRA_KEYS_ELSEWHERE_FLAG]: true, [RJSF_REF_KEY]: '' };

    expect(hasSchemaMarker(marked, GUESSED_TYPE_FLAG)).toBe(true);
    expect(hasSchemaMarker(marked, EXTRA_KEYS_ELSEWHERE_FLAG)).toBe(true);
    // @ts-expect-error TS2345, RJSF_REF_KEY holds a `$ref`, which an empty one would read as unset
    expect(hasSchemaMarker(marked, RJSF_REF_KEY)).toBe(false);
    // @ts-expect-error TS2345, RJSF_PROVENANCE_KEY holds a value, not a flag
    expect(hasSchemaMarker(marked, RJSF_PROVENANCE_KEY)).toBe(false);
  });
});
