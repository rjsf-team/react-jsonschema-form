import {
  additionalPropertiesKeyword,
  allowsAdditionalProperties,
  getAdditionalPropertySchema,
  getMatchingPatternProperties,
} from '../src/additionalPropertiesUtils.ts';
import type { RJSFSchema } from '../src/index.ts';

describe('getMatchingPatternProperties()', () => {
  it('returns an empty object when the schema has no patternProperties', () => {
    expect(getMatchingPatternProperties({ type: 'object' }, 'key')).toEqual({});
  });
});
describe('additionalPropertiesKeyword()', () => {
  it('reads the keyword that describes the names the properties and patterns leave over', () => {
    expect(additionalPropertiesKeyword({ additionalProperties: { type: 'string' } })).toEqual({ type: 'string' });
    expect(additionalPropertiesKeyword({ additionalProperties: true })).toBe(true);
    // A `false` either keyword spells is the answer it gives, rather than a miss the other one answers
    expect(additionalPropertiesKeyword({ additionalProperties: false })).toBe(false);
    const forbiddenSchema: RJSFSchema = { unevaluatedProperties: false };
    expect(additionalPropertiesKeyword(forbiddenSchema)).toBe(false);
  });
  it('gives any additionalProperties precedence over an unevaluatedProperties', () => {
    // Any `additionalProperties` evaluates the leftover keys itself, which leaves `unevaluatedProperties` nothing to
    // say about them
    const schema: RJSFSchema = { additionalProperties: false, unevaluatedProperties: { type: 'string' } };
    expect(additionalPropertiesKeyword(schema)).toBe(false);
  });
  it('returns undefined for a schema naming neither keyword, either spelling', () => {
    expect(additionalPropertiesKeyword({ type: 'object' })).toBeUndefined();
    // A schema built by spreading spells an absent keyword as `undefined`, which a validator reads as absent too
    const spreadSchema: RJSFSchema = { additionalProperties: undefined, unevaluatedProperties: undefined };
    expect(additionalPropertiesKeyword(spreadSchema)).toBeUndefined();
  });
});
describe('allowsAdditionalProperties()', () => {
  it('returns true for a patternProperties naming a pattern, whatever an additionalProperties beside it forbids', () => {
    expect(allowsAdditionalProperties({ patternProperties: { '^a': { type: 'string' } } })).toBe(true);
    expect(
      allowsAdditionalProperties({ patternProperties: { '^a': { type: 'string' } }, additionalProperties: false }),
    ).toBe(true);
    // An empty `patternProperties` names no pattern, so it matches no name and describes no key to take
    expect(allowsAdditionalProperties({ patternProperties: {} })).toBe(false);
  });
  it('returns what the keyword describing the unmatched names says', () => {
    expect(allowsAdditionalProperties({ additionalProperties: true })).toBe(true);
    expect(allowsAdditionalProperties({ additionalProperties: { type: 'string' } })).toBe(true);
    expect(allowsAdditionalProperties({ additionalProperties: false })).toBe(false);
    const describedSchema: RJSFSchema = { unevaluatedProperties: { type: 'string' } };
    const forbiddenSchema: RJSFSchema = { unevaluatedProperties: false };
    expect(allowsAdditionalProperties(describedSchema)).toBe(true);
    expect(allowsAdditionalProperties(forbiddenSchema)).toBe(false);
    // The same precedence `getAdditionalPropertySchema()` reads the two keywords with
    const evaluatedSchema: RJSFSchema = { additionalProperties: false, unevaluatedProperties: { type: 'string' } };
    expect(allowsAdditionalProperties(evaluatedSchema)).toBe(false);
  });
  it('returns false for an object that names none of the keywords', () => {
    // A validator takes any key for such an object, but the form has no schema to render one with and no name to
    // add one under, so it offers none
    expect(allowsAdditionalProperties({ type: 'object', properties: { a: { type: 'string' } } })).toBe(false);
    const spreadSchema: RJSFSchema = { patternProperties: undefined, additionalProperties: undefined };
    expect(allowsAdditionalProperties(spreadSchema)).toBe(false);
  });
});
describe('getAdditionalPropertySchema()', () => {
  it('returns an allOf of every matching pattern subschema', () => {
    const schema: RJSFSchema = {
      type: 'object',
      patternProperties: { '^a': { type: 'string' }, c$: { minLength: 2 } },
    };
    expect(getAdditionalPropertySchema(schema, 'abc')).toEqual({
      allOf: [{ type: 'string' }, { minLength: 2 }],
    });
  });
  it('returns false for a key a matching pattern forbids, whatever the other matching patterns allow', () => {
    const schema: RJSFSchema = { type: 'object', patternProperties: { '^a': { type: 'string' }, c$: false } };
    expect(getAdditionalPropertySchema(schema, 'abc')).toBe(false);
    expect(getAdditionalPropertySchema(schema, 'ab')).toEqual({ allOf: [{ type: 'string' }] });
  });
  it('returns the additionalProperties for a key no pattern matches', () => {
    const schema: RJSFSchema = {
      type: 'object',
      patternProperties: { '^a': { type: 'string' } },
      additionalProperties: { type: 'number' },
    };
    expect(getAdditionalPropertySchema(schema, 'xyz')).toEqual({ type: 'number' });
    expect(getAdditionalPropertySchema({ additionalProperties: false }, 'xyz')).toBe(false);
    expect(getAdditionalPropertySchema({ additionalProperties: true }, 'xyz')).toBe(true);
  });
  it('returns true for a schema that describes the key with neither keyword', () => {
    expect(getAdditionalPropertySchema({ type: 'object' }, 'xyz')).toBe(true);
  });
  it('reads the unevaluatedProperties of a schema that names no additionalProperties', () => {
    const describedSchema: RJSFSchema = { unevaluatedProperties: { type: 'number' } };
    const forbiddenSchema: RJSFSchema = { unevaluatedProperties: false };
    expect(getAdditionalPropertySchema(describedSchema, 'xyz')).toEqual({ type: 'number' });
    expect(getAdditionalPropertySchema(forbiddenSchema, 'xyz')).toBe(false);
  });
  it('reads an additionalProperties or unevaluatedProperties of undefined as the keyword being absent', () => {
    // A schema built by spreading spells an absent keyword this way, and reading it as present would hide what the
    // other keyword says about the key
    expect(getAdditionalPropertySchema({ additionalProperties: undefined, unevaluatedProperties: false }, 'x')).toBe(
      false,
    );
    expect(
      getAdditionalPropertySchema({ additionalProperties: undefined, unevaluatedProperties: undefined }, 'x'),
    ).toBe(true);
  });
  it('lets any additionalProperties leave the unevaluatedProperties nothing to say', () => {
    expect(getAdditionalPropertySchema({ additionalProperties: true, unevaluatedProperties: false }, 'x')).toBe(true);
  });
});
