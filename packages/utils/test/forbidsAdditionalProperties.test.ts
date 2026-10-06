import { forbidsAdditionalProperties } from '../src/index.ts';
import type { RJSFSchema } from '../src/types.ts';

describe('forbidsAdditionalProperties()', () => {
  it('returns false for a schema that says nothing about its additional properties', () => {
    const schema: RJSFSchema = { type: 'object', patternProperties: { '^a': { type: 'string' } } };
    expect(forbidsAdditionalProperties(schema)).toBe(false);
  });
  it('returns true for additionalProperties false', () => {
    const schema: RJSFSchema = { type: 'object', additionalProperties: false };
    expect(forbidsAdditionalProperties(schema)).toBe(true);
  });
  it('returns false for additionalProperties true', () => {
    const schema: RJSFSchema = { type: 'object', additionalProperties: true };
    expect(forbidsAdditionalProperties(schema)).toBe(false);
  });
  it('returns false for an additionalProperties schema', () => {
    const schema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
    expect(forbidsAdditionalProperties(schema)).toBe(false);
  });
  it('returns true for unevaluatedProperties false', () => {
    const schema: RJSFSchema = {
      type: 'object',
      patternProperties: { '^a': { type: 'string' } },
      unevaluatedProperties: false,
    };
    expect(forbidsAdditionalProperties(schema)).toBe(true);
  });
  it('returns false for unevaluatedProperties true', () => {
    const schema: RJSFSchema = { type: 'object', unevaluatedProperties: true };
    expect(forbidsAdditionalProperties(schema)).toBe(false);
  });
  it('returns false for an unevaluatedProperties schema, which describes such a key rather than forbidding it', () => {
    const schema: RJSFSchema = { type: 'object', unevaluatedProperties: { type: 'string' } };
    expect(forbidsAdditionalProperties(schema)).toBe(false);
  });
  it('returns false for unevaluatedProperties false beside an additionalProperties that evaluates every key', () => {
    // `additionalProperties` evaluates every key the `properties` and `patternProperties` leave over, so none is left
    // unevaluated for `unevaluatedProperties` to reject
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      unevaluatedProperties: false,
    };
    expect(forbidsAdditionalProperties(schema)).toBe(false);
  });
  it('returns false for unevaluatedProperties false beside additionalProperties true', () => {
    const schema: RJSFSchema = { type: 'object', additionalProperties: true, unevaluatedProperties: false };
    expect(forbidsAdditionalProperties(schema)).toBe(false);
  });
  it('returns true for additionalProperties false beside unevaluatedProperties true', () => {
    const schema: RJSFSchema = { type: 'object', additionalProperties: false, unevaluatedProperties: true };
    expect(forbidsAdditionalProperties(schema)).toBe(true);
  });
});
