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
  describe('a $ref the root holds below an $id of its own', () => {
    const kind: RJSFSchema = { $ref: '#/$defs/kind' };
    const relative: RJSFSchema = { $ref: 'kinds.json#/$defs/cat' };
    const dangling: RJSFSchema = { $ref: '#/$defs/missing' };
    const anchored: RJSFSchema = { $id: '#here', $ref: '#/$defs/kind' };
    const own: RJSFSchema = { $ref: '#/$defs/kind' };
    const pet: RJSFSchema = {
      $id: 'pet.json',
      $defs: { kind: { const: 'cat' } },
      properties: { kind, relative, dangling, anchored },
    };
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      $defs: {
        kind: { const: 'dog' },
        pet,
        kinds: { $id: 'kinds.json', $defs: { 'a cat#': { const: 'cat' }, cat: { const: 'cat' } } },
      },
      properties: { own },
    };
    it('names the target its resource resolves it to by the pointer to it in the root', () => {
      expect(withRootIdRefPrefix(pet, rootSchema)).toEqual({
        ...pet,
        properties: {
          kind: { $ref: 'https://example.com/root.json#/$defs/pet/$defs/kind' },
          relative: { $ref: 'https://example.com/root.json#/$defs/kinds/$defs/cat' },
          // One that resolves to nothing is prefixed as before, for the validator to report
          dangling: { $ref: 'https://example.com/root.json#/$defs/missing' },
          // An `$id` that is only a fragment names a place in the resource rather than a resource of its own
          anchored: { $id: '#here', $ref: 'https://example.com/root.json#/$defs/pet/$defs/kind' },
        },
      });
    });
    it('names the root by the id it is given, escaping what a fragment cannot hold', () => {
      const name: RJSFSchema = { $ref: 'kinds.json#/$defs/a%20cat%23' };
      const root: RJSFSchema = { ...rootSchema, $defs: { ...rootSchema.$defs, pet: { ...pet, properties: { name } } } };
      expect(withRootIdRefPrefix(name, root, 'compiled#')).toEqual({
        $ref: 'compiled#/$defs/kinds/$defs/a%20cat%23',
      });
    });
    it("leaves one in the root's own resource as it would be written", () => {
      expect(withRootIdRefPrefix(own, rootSchema)).toEqual({
        $ref: 'https://example.com/root.json#/$defs/kind',
      });
    });
    it('leaves one as written below an $id the schema handed over holds, where a relative root id would move', () => {
      const { $id: _id, ...root } = rootSchema;
      expect(withRootIdRefPrefix({ $id: 'https://example.com/variant.json', properties: { relative } }, root)).toEqual({
        $id: 'https://example.com/variant.json',
        properties: { relative: { $ref: 'kinds.json#/$defs/cat' } },
      });
      expect(withRootIdRefPrefix({ properties: { relative } }, root)).toEqual({
        properties: { relative: { $ref: `${ROOT_SCHEMA_PREFIX}#/$defs/kinds/$defs/cat` } },
      });
    });
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
