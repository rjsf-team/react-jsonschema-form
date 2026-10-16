import type { RJSFSchema, StrictRJSFSchema } from '../src/index.ts';
import { ROOT_SCHEMA_PREFIX, rootSchemaIdOf, withIdRefPrefix } from '../src/index.ts';

describe('withIdRefPrefix()', () => {
  it('should recursively add id prefix to all refs', () => {
    const schema: RJSFSchema = {
      anyOf: [{ $ref: '#/defs/foo' }],
    };
    const expected = {
      anyOf: [{ $ref: '__rjsf_rootSchema#/defs/foo' }],
    };

    expect(withIdRefPrefix(schema)).toEqual(expected);
  });
  it('prefixes a local $ref with the root id it is given, leaving any other $ref as it stands', () => {
    const schema: RJSFSchema = {
      properties: { local: { $ref: '#/definitions/a' }, absolute: { $ref: 'https://example.com/other.json#/x' } },
      allOf: [{ $ref: '#' }, true],
    };
    expect(withIdRefPrefix(schema, 'root')).toEqual({
      properties: { local: { $ref: 'root#/definitions/a' }, absolute: { $ref: 'https://example.com/other.json#/x' } },
      allOf: [{ $ref: 'root#' }, true],
    });
  });
  it('shouldn`t mutate the schema', () => {
    const schema: RJSFSchema = {
      anyOf: [{ $ref: '#/defs/foo' }],
    };

    withIdRefPrefix(schema);

    expect(schema).toEqual({
      anyOf: [{ $ref: '#/defs/foo' }],
    });
  });
  it('should not change a property named `$ref`', () => {
    const schema: RJSFSchema = {
      title: 'A registration form',
      description: 'A simple form example.',
      type: 'object',
      properties: {
        $ref: { type: 'string', title: 'First name', default: 'Chuck' },
      },
    };

    expect(withIdRefPrefix(schema)).toEqual(schema);
  });
  it('should take the union of its input shapes from a generic caller', () => {
    function prefixed<S extends StrictRJSFSchema>(schemaNode: S | S[]) {
      return withIdRefPrefix<S>(schemaNode);
    }

    expectTypeOf(prefixed<StrictRJSFSchema>).returns.toEqualTypeOf<
      StrictRJSFSchema | StrictRJSFSchema[] | StrictRJSFSchema[keyof StrictRJSFSchema]
    >();
    expect(prefixed<StrictRJSFSchema>([{ $ref: '#/defs/foo' }])).toEqual([{ $ref: '__rjsf_rootSchema#/defs/foo' }]);
  });
  it('should leave the empty fragment an id ends in out of the prefix', () => {
    expect(withIdRefPrefix({ $ref: '#/if' }, 'http://example.com/root.json#')).toEqual({
      $ref: 'http://example.com/root.json#/if',
    });
  });
  it('should handle null schemaNode', () => {
    const schemaNode = null;
    expect(withIdRefPrefix(schemaNode)).toEqual(schemaNode);
  });
});

describe('rootSchemaIdOf()', () => {
  it("returns the root schema's own $id", () => {
    expect(rootSchemaIdOf({ $id: 'http://example.com/root.json#' })).toBe('http://example.com/root.json#');
  });
  it('returns ROOT_SCHEMA_PREFIX for a root without an $id or with an empty one', () => {
    expect(rootSchemaIdOf({})).toBe(ROOT_SCHEMA_PREFIX);
    expect(rootSchemaIdOf({ $id: '' })).toBe(ROOT_SCHEMA_PREFIX);
  });
});
