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
  it('returns an empty schema when there is no schema', () => {
    expect(getPropertySchema(undefined, 'foo')).toEqual({});
  });
});
