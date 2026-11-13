import getPropertySchema from '../src/getPropertySchema.ts';
import type { RJSFSchema } from '../src/index.ts';

const SCHEMA: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };

describe('getPropertySchema()', () => {
  it('returns the declared sub-schema', () => {
    expect(getPropertySchema(SCHEMA, 'foo')).toEqual({ type: 'string' });
  });
  it('returns an empty schema when the property is not declared', () => {
    expect(getPropertySchema(SCHEMA, 'bar')).toEqual({});
  });
  it('returns an empty schema when the schema has no properties', () => {
    expect(getPropertySchema({ type: 'string' }, 'foo')).toEqual({});
  });
  it('returns an empty schema for an undeclared property named like an Object.prototype member', () => {
    expect(getPropertySchema(SCHEMA, 'toString')).toEqual({});
    expect(getPropertySchema(SCHEMA, 'constructor')).toEqual({});
  });
  it('returns a declared property named like an Object.prototype member', () => {
    // `as const` keeps the type name a literal, which the value of a `toString` key loses otherwise
    const schema: RJSFSchema = { properties: { toString: { type: 'string' as const } } };
    expect(getPropertySchema(schema, 'toString')).toEqual({ type: 'string' });
  });
  it('returns an empty schema for a property declared as null, as YAML gives for one left empty', () => {
    const schema = JSON.parse('{"type": "object", "properties": {"a": null, "b": {"type": "string"}}}') as RJSFSchema;
    expect(getPropertySchema(schema, 'a')).toEqual({});
  });
  it('returns an empty schema when there is no schema', () => {
    expect(getPropertySchema(undefined, 'foo')).toEqual({});
  });
});
