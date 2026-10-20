import type { RJSFSchema, StrictRJSFSchema } from '../src/index.ts';
import { ROOT_SCHEMA_PREFIX, rootSchemaIdOf, withIdRefPrefix, withRootIdRefPrefix } from '../src/index.ts';

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
  it('takes the schema alone, so it can be handed to map()', () => {
    expect([{ $ref: '#/a' }].map(withIdRefPrefix)).toEqual([{ $ref: '__rjsf_rootSchema#/a' }]);
  });
  it('should handle null schemaNode', () => {
    const schemaNode = null;
    expect(withIdRefPrefix(schemaNode)).toEqual(schemaNode);
  });
});

describe('withRootIdRefPrefix()', () => {
  it("prefixes a local $ref with the root's $id, leaving any other $ref as it stands", () => {
    const schema: RJSFSchema = {
      properties: { local: { $ref: '#/definitions/a' }, absolute: { $ref: 'https://example.com/other.json#/x' } },
      allOf: [{ $ref: '#' }, true],
    };
    expect(withRootIdRefPrefix(schema, { $id: 'root' })).toEqual({
      properties: { local: { $ref: 'root#/definitions/a' }, absolute: { $ref: 'https://example.com/other.json#/x' } },
      allOf: [{ $ref: 'root#' }, true],
    });
  });
  it("resolves a relative $ref against the root's $id, and leaves it as written for a root without one", () => {
    const schema: RJSFSchema = { properties: { kind: { $ref: 'kinds.json#/definitions/cat' } } };
    expect(withRootIdRefPrefix(schema, { $id: 'https://example.com/schemas/root.json' })).toEqual({
      properties: { kind: { $ref: 'https://example.com/schemas/kinds.json#/definitions/cat' } },
    });
    expect(withRootIdRefPrefix(schema, {})).toEqual(schema);
  });
  it('prefixes a local $ref with ROOT_SCHEMA_PREFIX for a root without an $id', () => {
    expect(withRootIdRefPrefix({ $ref: '#/a' }, {})).toEqual({ $ref: `${ROOT_SCHEMA_PREFIX}#/a` });
  });
  it('should leave the empty fragment an id ends in out of the prefix', () => {
    expect(withRootIdRefPrefix({ $ref: '#/if' }, { $id: 'http://example.com/root.json#' })).toEqual({
      $ref: 'http://example.com/root.json#/if',
    });
  });
  it('prefixes a local $ref with ROOT_SCHEMA_PREFIX for a root that is no schema object, which an untyped caller may hand over', () => {
    const notASchema: RJSFSchema = JSON.parse('"root"');
    expect(withRootIdRefPrefix({ $ref: '#/a' }, notASchema)).toEqual({ $ref: `${ROOT_SCHEMA_PREFIX}#/a` });
  });
});

describe('rootSchemaIdOf()', () => {
  it("returns the root schema's own $id less any fragment, which names a place in the document", () => {
    expect(rootSchemaIdOf({ $id: 'http://example.com/root.json' })).toBe('http://example.com/root.json');
    expect(rootSchemaIdOf({ $id: 'http://example.com/root.json#' })).toBe('http://example.com/root.json');
    expect(rootSchemaIdOf({ $id: 'http://example.com/root.json#foo' })).toBe('http://example.com/root.json');
  });
  it('returns ROOT_SCHEMA_PREFIX for a root without an $id, with an empty one or with one that is only a fragment', () => {
    expect(rootSchemaIdOf({})).toBe(ROOT_SCHEMA_PREFIX);
    expect(rootSchemaIdOf({ $id: '' })).toBe(ROOT_SCHEMA_PREFIX);
    expect(rootSchemaIdOf({ $id: '#' })).toBe(ROOT_SCHEMA_PREFIX);
    expect(rootSchemaIdOf({ $id: '#root' })).toBe(ROOT_SCHEMA_PREFIX);
  });
  it.each([
    ['5', 5],
    ['true', true],
    ['{}', {}],
  ])('returns ROOT_SCHEMA_PREFIX for a root whose $id is %s, as an untyped caller may hand over', (_written, id) => {
    const rootSchema: RJSFSchema = {};
    Reflect.set(rootSchema, '$id', id);
    expect(rootSchemaIdOf(rootSchema)).toBe(ROOT_SCHEMA_PREFIX);
    expect(withRootIdRefPrefix({ $ref: '#/a' }, rootSchema)).toEqual({ $ref: `${ROOT_SCHEMA_PREFIX}#/a` });
  });
});
