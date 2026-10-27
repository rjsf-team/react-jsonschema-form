import { ADDITIONAL_PROPERTY_FLAG, hasSchemaMarker, RJSF_REF_CYCLE_KEY } from '../src/index.ts';

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
});
