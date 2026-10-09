import { ADDITIONAL_PROPERTY_FLAG } from '../src/constants.ts';
import { findSchemaDefinitionRecursive, makeAllReferencesAbsolute } from '../src/findSchemaDefinition.ts';
import type { GenericObjectType, RJSFSchema } from '../src/index.ts';
import { createSchemaUtils, findSchemaDefinition, ID_KEY } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const schema: RJSFSchema = {
  type: 'object',
  definitions: {
    bundledSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/bundled.ref.json',
      type: 'object',
      properties: {
        num: {
          type: 'integer',
        },
      },
    },
    stringRef: {
      type: 'string',
    },
    nestedRef: {
      $ref: '#/definitions/stringRef',
    },
    extraNestedRef: {
      $ref: '#/definitions/stringRef',
      title: 'foo',
    },
    // Reference accidentally pointing to itself.
    badCircularNestedRef: {
      $ref: '#/definitions/badCircularNestedRef',
    },
    // Reference accidentally pointing to a chain of references which ultimately
    // point back to the original reference.
    badCircularDeepNestedRef: {
      $ref: '#/definitions/badCircularDeeperNestedRef',
    },
    badCircularDeeperNestedRef: {
      $ref: '#/definitions/badCircularDeepestNestedRef',
    },
    badCircularDeepestNestedRef: {
      $ref: '#/definitions/badCircularDeepNestedRef',
    },
    // Bundled references are supported only within JSON Schema Draft 2020-12
    bundledRef: {
      $ref: '/bundled.ref.json',
    },
  },
};

const internalSchema: RJSFSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/bundled.ref.json',
  type: 'object',
  $defs: {
    colors: {
      type: 'string',
      enum: ['red', 'green', 'blue'],
    },
    string: {
      type: 'string',
    },
    circularRef: {
      $ref: '/bundled.schema.json/#/$defs/circularRef',
    },
    undefinedRef: {
      $ref: '#/$defs/undefined',
    },
  },
  properties: {
    num: {
      type: 'integer',
    },
    string: {
      $ref: '#/$defs/string',
    },
    allOf: {
      allOf: [
        {
          $ref: '#/$defs/string',
        },
        {
          title: 'String',
        },
      ],
    },
  },
};

const bundledSchema: RJSFSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  $id: 'https://example.com/bundled.schema.json',
  $defs: {
    bundledSchema: internalSchema,
    bundledSchemaArray: {
      anyOf: [
        {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.array.1.json',
          type: 'object',
        },
        {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.array.2.json',
          type: 'object',
        },
      ],
    },
    bundledAbsoluteRef: {
      $ref: 'https://example.com/bundled.ref.json',
    },
    bundledAbsoluteRefWithAnchor: {
      $ref: 'https://example.com/bundled.ref.json/#/properties/num',
    },
    bundledAbsoluteRefWithinArray: {
      $ref: 'https://example.com/bundled.ref.array.1.json',
    },
    bundledRelativeRef: {
      $ref: '/bundled.ref.json',
    },
    bundledRelativeRefWithAnchor: {
      $ref: '/bundled.ref.json/#/properties/string',
    },
    circularRef: {
      $ref: '/bundled.ref.json/#/$defs/circularRef',
    },
    indirectRef: {
      $ref: '#/$defs/bundledAbsoluteRef',
    },
    undefinedRef: {
      $ref: '/undefined.ref.json',
    },
    undefinedRefWithAnchor: {
      $ref: '/bundled.ref.json#/$defs/undefinedRef',
    },
  },
  properties: {
    undefined: {
      type: 'null',
    },
  },
};

const EXTRA_EXPECTED = { type: 'string', title: 'foo' };

describe('findSchemaDefinition()', () => {
  it('throws error when ref is missing', () => {
    expect(() => findSchemaDefinition()).toThrow('Could not find a definition for undefined');
  });
  it('throws error when ref is malformed', () => {
    expect(() => findSchemaDefinition('definitions/missing')).toThrow(
      'Could not find a definition for definitions/missing',
    );
  });
  it('throws error when ref does not exist', () => {
    expect(() => findSchemaDefinition('#/definitions/missing', schema)).toThrow(
      'Could not find a definition for #/definitions/missing',
    );
  });
  it('returns the string ref from its definition', () => {
    expect(findSchemaDefinition('#/definitions/stringRef', schema)).toBe(schema.definitions!.stringRef);
  });
  it('returns the string ref from its nested definition', () => {
    expect(findSchemaDefinition('#/definitions/nestedRef', schema)).toBe(schema.definitions!.stringRef);
  });
  it('returns a combined schema made from its nested definition with the extra props', () => {
    expect(findSchemaDefinition('#/definitions/extraNestedRef', schema)).toEqual(EXTRA_EXPECTED);
  });
  it('throws error when ref is a circular reference', () => {
    expect(() => findSchemaDefinition('#/definitions/badCircularNestedRef', schema)).toThrow(
      'Definition for #/definitions/badCircularNestedRef is a circular reference',
    );
  });
  it('throws error when ref is a deep circular reference', () => {
    expect(() => findSchemaDefinition('#/definitions/badCircularDeepNestedRef', schema)).toThrow(
      'Definition for #/definitions/badCircularDeepNestedRef contains a circular reference through #/definitions/badCircularDeeperNestedRef -> #/definitions/badCircularDeepestNestedRef -> #/definitions/badCircularDeepNestedRef',
    );
  });
  it('throws error when bundled ref are not part of JSON Schema Draft 2020-12', () => {
    expect(() => findSchemaDefinition('#/definitions/bundledRef', schema)).toThrow(
      'Could not find a definition for /bundled.ref.json',
    );
  });
  it('throws error when bundled ref with explicit baseURI are not part of JSON Schema Draft 2020-12', () => {
    expect(() => findSchemaDefinition('#/properties/num', schema, 'https://example.com/bundled.ref.json')).toThrow(
      'Could not find a definition for #/properties/num',
    );
  });
  it('correctly resolves absolute bundled refs when JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledAbsoluteRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves absolute bundled refs with anchors within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledAbsoluteRefWithAnchor', bundledSchema)).toBe(
      internalSchema.properties!.num,
    );
  });
  it('correctly resolves absolute bundled refs in arrays within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledAbsoluteRefWithinArray', bundledSchema)).toBe(
      (bundledSchema.$defs!.bundledSchemaArray as RJSFSchema).anyOf![0],
    );
  });
  it('correctly resolves absolute bundled refs within a JSON Schema Draft 2020-12 without an `$id`', () => {
    const { $id: d, ...bundledSchemaWithoutId } = bundledSchema;
    expect(findSchemaDefinition('#/$defs/bundledAbsoluteRef', bundledSchemaWithoutId)).toStrictEqual(internalSchema);
  });
  it('correctly resolves relative bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledRelativeRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves relative bundled refs with anchors within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledRelativeRefWithAnchor', bundledSchema)).toBe(
      internalSchema.$defs!.string,
    );
  });
  it('correctly resolves indirect bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/indirectRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves refs with explicit base URI in a bundled JSON Schema', () => {
    expect(
      findSchemaDefinition('bundled.ref.json', bundledSchema, 'https://example.com/undefined.ref.json'),
    ).toStrictEqual(internalSchema);
  });
  it('correctly resolves local refs with explicit base URI in a bundled JSON Schema', () => {
    expect(findSchemaDefinition('#/properties/num', bundledSchema, 'https://example.com/bundled.ref.json')).toBe(
      internalSchema.properties!.num,
    );
  });
  it('throws error when relative ref is undefined in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinition('#/$defs/undefinedRef', bundledSchema)).toThrow(
      'Could not find a definition for /undefined.ref.json',
    );
  });
  it('throws error when relative ref with anchor is undefined in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinition('#/$defs/undefinedRefWithAnchor', bundledSchema)).toThrow(
      'Could not find a definition for #/$defs/undefined',
    );
  });
  it('throws error when local ref is undefined in a bundled JSON Schema with explicit base URI', () => {
    expect(() =>
      findSchemaDefinition('#/properties/undefined', bundledSchema, 'https://example.com/bundled.ref.json'),
    ).toThrow('Could not find a definition for #/properties/undefined');
  });
  it('throws error when explicit base URI is undefined in a bundled JSON Schema', () => {
    expect(() =>
      findSchemaDefinition('#/properties/undefined', bundledSchema, 'https://example.com/undefined.ref.json'),
    ).toThrow('Could not find a definition for #/properties/undefined');
  });
  it('throws error when ref is a deep circular reference in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinition('#/$defs/circularRef', bundledSchema)).toThrow(
      'Definition for #/$defs/circularRef contains a circular reference through /bundled.ref.json/#/$defs/circularRef -> /bundled.schema.json/#/$defs/circularRef -> #/$defs/circularRef',
    );
  });
  describe('JSON pointer fragments (RFC 6901)', () => {
    // The RFC 6901 section 5 example document, with `$id` so the bundled 2020-12 lookup paths resolve it too
    const rfc6901 = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/rfc6901.json',
      foo: ['bar', 'baz'],
      '': 0,
      'a/b': 1,
      'c%d': 2,
      'e^f': 3,
      'g|h': 4,
      'i\\j': 5,
      'k"l': 6,
      ' ': 7,
      'm~n': 8,
      '~1': 9,
      'a/~b': 10,
      nested: { '': { '/': 11 }, list: [{ deep: 12 }] },
      $defs: { embedded: { $id: 'https://example.com/embedded.json', '': 13, 'a/b': 14, foo: [15] } },
    } as unknown as RJSFSchema & { foo: string[]; $defs: { embedded: RJSFSchema } };
    const cases: [string, unknown][] = [
      ['#', rfc6901],
      ['#/foo', rfc6901.foo],
      ['#/foo/0', 'bar'],
      ['#/foo/1', 'baz'],
      ['#/', 0],
      ['#/a~1b', 1],
      // A raw `%` is not a legal fragment character (RFC 3986), so only its percent-encoded form is a valid ref
      ['#/c%25d', 2],
      ['#/e^f', 3],
      ['#/e%5Ef', 3],
      ['#/g|h', 4],
      ['#/g%7Ch', 4],
      ['#/i\\j', 5],
      ['#/i%5Cj', 5],
      ['#/k"l', 6],
      ['#/k%22l', 6],
      ['#/ ', 7],
      ['#/%20', 7],
      ['#/m~0n', 8],
      ['#/~01', 9],
      ['#/a~1~0b', 10],
      ['#/nested//~1', 11],
      ['#/nested/list/0/deep', 12],
    ];
    it.each(cases)('resolves %s against the root schema', (ref, expected) => {
      expect(findSchemaDefinition(ref, rfc6901)).toBe(expected);
    });
    it.each(cases)('resolves %s against an explicit base URI equal to the root `$id`', (ref, expected) => {
      expect(findSchemaDefinition(ref, rfc6901, rfc6901.$id)).toBe(expected);
    });
    it.each([
      ['#', rfc6901.$defs.embedded],
      ['#/', 13],
      ['#/a~1b', 14],
      ['#/foo/0', 15],
    ])('resolves %s against the base URI of an embedded schema', (ref, expected) => {
      expect(findSchemaDefinition(ref, rfc6901, 'https://example.com/embedded.json')).toBe(expected);
    });
    it.each([
      ['https://example.com/embedded.json#', rfc6901.$defs.embedded],
      ['embedded.json#/a~1b', 14],
      ['/embedded.json#/a~1b', 14],
      ['embedded.json#/foo/0', 15],
    ])('resolves %s as a bundled ref with a pointer fragment', (ref, expected) => {
      expect(findSchemaDefinition(ref, rfc6901)).toBe(expected);
    });
    it.each([
      '#/foo/2',
      '#/foo/-',
      '#/foo/01',
      '#/foo/bar',
      '#/foo/0/0',
      '#/nested/missing',
      '#/a~2b',
      '#/a~b',
      '#foo',
      '#foo/0',
      '#/__proto__',
      '#/constructor',
      '#/constructor/prototype',
      '#/toString',
    ])('throws for %s, which points at nothing', (ref) => {
      expect(() => findSchemaDefinition(ref, rfc6901)).toThrow(`Could not find a definition for ${ref}`);
      expect(() => findSchemaDefinition(ref, rfc6901, rfc6901.$id)).toThrow(`Could not find a definition for ${ref}`);
    });
  });
  it('resolves refs against a base URI that differs from the `$id` only by case and default port', () => {
    expect(findSchemaDefinition('#/properties/num', bundledSchema, 'HTTPS://Example.com:443/bundled.ref.json')).toBe(
      internalSchema.properties!.num,
    );
  });
  it('resolves relative refs against a relative root `$id`', () => {
    const relativeSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'relative/schema.json',
      $defs: {
        embedded: { $id: 'relative/embedded.json', properties: { a: { type: 'string' } } },
        other: { $id: 'other.json', type: 'number' },
      },
    };
    expect(findSchemaDefinition('embedded.json', relativeSchema)).toBe(relativeSchema.$defs!.embedded);
    expect(findSchemaDefinition('./embedded.json#', relativeSchema)).toBe(relativeSchema.$defs!.embedded);
    expect(findSchemaDefinition('embedded.json#/properties/a', relativeSchema)).toBe(
      (relativeSchema.$defs!.embedded as RJSFSchema).properties!.a,
    );
    expect(findSchemaDefinition('../other.json', relativeSchema)).toBe(relativeSchema.$defs!.other);
    expect(() => findSchemaDefinition('missing.json', relativeSchema)).toThrow(
      'Could not find a definition for missing.json',
    );
  });
  it('resolves relative refs made absolute against the `#` base used for a root without `$id`', () => {
    const schemaWithoutId: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        dot: { $ref: './embedded.json' },
        parent: { $ref: '../embedded.json' },
        traversal: { $ref: 'a/../embedded.json' },
        nested: { $ref: 'sub/a.json' },
        rooted: { $ref: '/embedded.json' },
      },
      $defs: {
        embedded: { $id: 'embedded.json', type: 'string' },
        a: { $id: 'sub/a.json', properties: { b: { $ref: 'b.json' } } },
        b: { $id: 'sub/b.json', type: 'number' },
        rooted: { $id: '/embedded.json', type: 'boolean' },
      },
    };
    const resolved = makeAllReferencesAbsolute(schemaWithoutId, '#');
    expect(resolved.properties).toStrictEqual({
      dot: { $ref: 'embedded.json' },
      parent: { $ref: 'embedded.json' },
      traversal: { $ref: 'embedded.json' },
      nested: { $ref: 'sub/a.json' },
      rooted: { $ref: '/embedded.json' },
    });
    // An absolute-path reference stays rooted, so it must not collide with the relative `embedded.json`
    expect(findSchemaDefinition('#/properties/rooted', resolved)).toBe(resolved.$defs!.rooted);
    expect((resolved.$defs!.a as RJSFSchema).properties).toStrictEqual({ b: { $ref: 'sub/b.json' } });
    expect(findSchemaDefinition('#/properties/dot', resolved)).toBe(resolved.$defs!.embedded);
    expect(findSchemaDefinition('#/$defs/a/properties/b', resolved)).toBe(resolved.$defs!.b);
  });
  it('keeps refs rooted when the root `$id` is an absolute path', () => {
    const rootedSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: '/schemas/root.json',
      properties: { x: { $ref: 'a.json' }, parent: { $ref: '../b.json' }, local: { $ref: '#/$defs/a' } },
      $defs: {
        unrooted: { $id: 'schemas/a.json', type: 'boolean' },
        a: { $id: '/schemas/a.json', type: 'string' },
        b: { $id: '/b.json', type: 'number' },
      },
    };
    expect(findSchemaDefinition('a.json', rootedSchema)).toBe(rootedSchema.$defs!.a);
    expect(findSchemaDefinition('../b.json', rootedSchema)).toBe(rootedSchema.$defs!.b);
    const resolved = makeAllReferencesAbsolute(rootedSchema, rootedSchema.$id!);
    expect(resolved.properties).toStrictEqual({
      x: { $ref: '/schemas/a.json' },
      parent: { $ref: '/b.json' },
      local: { $ref: '/schemas/root.json#/$defs/a' },
    });
    expect(findSchemaDefinition('#/properties/x', resolved)).toBe(resolved.$defs!.a);
    expect(findSchemaDefinition('#/properties/local', resolved)).toBe(resolved.$defs!.a);
  });
  it('resolves refs against a network-path `$id` without picking up a scheme', () => {
    const networkSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: {
        c: { $id: '//cdn.example.com/c.json', properties: { y: { $ref: 'b.json' }, z: { $ref: '#/properties/y' } } },
        b: { $id: '//cdn.example.com/b.json', type: 'number' },
      },
    };
    const resolved = makeAllReferencesAbsolute(networkSchema, '#');
    expect((resolved.$defs!.c as RJSFSchema).properties).toStrictEqual({
      y: { $ref: '//cdn.example.com/b.json' },
      z: { $ref: '//cdn.example.com/c.json#/properties/y' },
    });
    expect(findSchemaDefinition('#/$defs/c/properties/y', resolved)).toBe(resolved.$defs!.b);
    expect(findSchemaDefinition('b.json', networkSchema, '//cdn.example.com/c.json')).toBe(networkSchema.$defs!.b);
    expect(findSchemaDefinition('//CDN.Example.com/b.json', networkSchema, '#')).toBe(networkSchema.$defs!.b);
  });
  it('compares the host of an absolute `$id` with a non-special scheme case-insensitively', () => {
    const gitSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: { g: { $id: 'git://HOST.example.com/b.json', type: 'number' } },
    };
    expect(findSchemaDefinition('git://host.example.com/b.json', gitSchema, '#')).toBe(gitSchema.$defs!.g);
  });
  it('compares refs to `$id`s after percent-encoding and dot-segment normalization', () => {
    const encodedSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      $defs: {
        tilde: { $id: 'https://example.com/~user/embedded.json', type: 'string' },
        dotted: { $id: './relative.json', type: 'number' },
      },
    };
    expect(findSchemaDefinition('%7Euser/embedded.json', encodedSchema)).toBe(encodedSchema.$defs!.tilde);
    expect(findSchemaDefinition('relative.json', { ...encodedSchema, $id: undefined })).toBe(
      encodedSchema.$defs!.dotted,
    );
  });
  it('throws for a ref the URL parser rejects instead of crashing', () => {
    expect(() => findSchemaDefinition('https://[invalid/embedded.json', bundledSchema)).toThrow(
      'Could not find a definition for https://[invalid/embedded.json',
    );
  });
  it('resolves refs within a bundled JSON Schema whose `$id`s are `urn:` URIs', () => {
    const urnSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'urn:example:root',
      $defs: {
        embedded: {
          $id: 'urn:example:embedded',
          properties: { a: { type: 'string' } },
        },
      },
    };
    expect(findSchemaDefinition('urn:example:embedded', urnSchema)).toBe(urnSchema.$defs!.embedded);
    expect(findSchemaDefinition('urn:example:embedded#/properties/a', urnSchema)).toBe(
      (urnSchema.$defs!.embedded as RJSFSchema).properties!.a,
    );
    expect(findSchemaDefinition('#/properties/a', urnSchema, 'urn:example:embedded')).toBe(
      (urnSchema.$defs!.embedded as RJSFSchema).properties!.a,
    );
    expect(() => findSchemaDefinition('relative.json', urnSchema)).toThrow(
      'Could not find a definition for relative.json',
    );
  });
  it('resolves refs whose `$id`s use an internationalized host name, a network-path ref or a `file:` scheme', () => {
    const hostSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://bücher.example/schemas/root.json',
      $defs: {
        punycode: { $id: 'https://xn--bcher-kva.example/schemas/embedded.json', type: 'string' },
        cdn: { $id: 'https://cdn.example.com/other.json', type: 'number' },
        file: { $id: 'file:///schemas/local.json', type: 'boolean' },
      },
    };
    expect(findSchemaDefinition('embedded.json', hostSchema)).toBe(hostSchema.$defs!.punycode);
    expect(findSchemaDefinition('//cdn.example.com/other.json', hostSchema)).toBe(hostSchema.$defs!.cdn);
    expect(findSchemaDefinition('file:///schemas/local.json', hostSchema)).toBe(hostSchema.$defs!.file);
    // Under a relative base there is no scheme to resolve a network-path reference against, so it stays as written
    const cdnSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: { cdn: { $id: '//cdn.example.com/other.json', type: 'number' } },
    };
    expect(findSchemaDefinition('//cdn.example.com/other.json', cdnSchema, '#')).toBe(cdnSchema.$defs!.cdn);
  });
  it('resolves bundled refs whose JSON pointer fragment contains escaped, percent-encoded and non-ASCII characters', () => {
    const pointerSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      $defs: {
        embedded: {
          $id: 'https://example.com/embedded.json',
          properties: {
            'a/b': { type: 'string' },
            'a b': { type: 'number' },
            ünïcode: { type: 'boolean' },
          },
        },
      },
    };
    const { properties } = pointerSchema.$defs!.embedded as RJSFSchema;
    expect(findSchemaDefinition('embedded.json#/properties/a~1b', pointerSchema)).toBe(properties!['a/b']);
    expect(findSchemaDefinition('embedded.json#/properties/a%20b', pointerSchema)).toBe(properties!['a b']);
    expect(findSchemaDefinition('embedded.json#/properties/a b', pointerSchema)).toBe(properties!['a b']);
    expect(findSchemaDefinition('embedded.json#/properties/ünïcode', pointerSchema)).toBe(properties!.ünïcode);
    expect(findSchemaDefinition('embedded.json#/properties/%C3%BCn%C3%AFcode', pointerSchema)).toBe(
      properties!.ünïcode,
    );
  });
  it('does not match a $id carried by instance data as an embedded schema', () => {
    const schemaWithDataId = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      properties: {
        link: { type: 'object', default: { $id: 'https://example.com/other.json', foo: 1 } },
      },
    } as unknown as RJSFSchema;
    expect(() => findSchemaDefinition('https://example.com/other.json', schemaWithDataId)).toThrow(
      'Could not find a definition for https://example.com/other.json',
    );
  });
  it('finds embedded schemas reached through dependencies, tuple items and single-schema keywords', () => {
    const schemaWithDeepEmbedded = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      dependencies: {
        other: ['trigger'],
        trigger: { items: [true, { not: { $id: 'https://example.com/deep.json', type: 'number' } }] },
      },
    } as unknown as RJSFSchema;
    expect(findSchemaDefinition('https://example.com/deep.json', schemaWithDeepEmbedded)).toStrictEqual({
      $id: 'https://example.com/deep.json',
      type: 'number',
    });
  });
});

describe('findSchemaDefinitionRecursive()', () => {
  it('throws error when ref is missing', () => {
    expect(() => findSchemaDefinitionRecursive()).toThrow('Could not find a definition for undefined');
  });
  it('throws error when ref is malformed', () => {
    expect(() => findSchemaDefinitionRecursive('definitions/missing')).toThrow(
      'Could not find a definition for definitions/missing',
    );
  });
  it('throws error when ref does not exist', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/missing', schema)).toThrow(
      'Could not find a definition for #/definitions/missing',
    );
  });
  it('returns the string ref from its definition', () => {
    expect(findSchemaDefinitionRecursive('#/definitions/stringRef', schema)).toBe(schema.definitions!.stringRef);
  });
  it('returns the string ref from its nested definition', () => {
    expect(findSchemaDefinitionRecursive('#/definitions/nestedRef', schema)).toBe(schema.definitions!.stringRef);
  });
  it('returns a combined schema made from its nested definition with the extra props', () => {
    expect(findSchemaDefinitionRecursive('#/definitions/extraNestedRef', schema)).toEqual(EXTRA_EXPECTED);
  });
  it('throws error when ref is a circular reference', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/badCircularNestedRef', schema)).toThrow(
      'Definition for #/definitions/badCircularNestedRef is a circular reference',
    );
  });
  it('throws error when ref is a deep circular reference', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/badCircularDeepNestedRef', schema)).toThrow(
      'Definition for #/definitions/badCircularDeepNestedRef contains a circular reference through #/definitions/badCircularDeeperNestedRef -> #/definitions/badCircularDeepestNestedRef -> #/definitions/badCircularDeepNestedRef',
    );
  });
  it('throws error when bundled ref are not part of JSON Schema Draft 2020-12', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/bundledRef', schema)).toThrow(
      'Could not find a definition for /bundled.ref.json',
    );
  });
  it('throws error when bundled ref with explicit baseURI are not part of JSON Schema Draft 2020-12', () => {
    expect(() =>
      findSchemaDefinitionRecursive('#/properties/num', schema, [], 'https://example.com/bundled.ref.json'),
    ).toThrow('Could not find a definition for #/properties/num');
  });
  it('correctly resolves absolute bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledAbsoluteRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves absolute bundled refs with anchors within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledAbsoluteRefWithAnchor', bundledSchema)).toBe(
      internalSchema.properties!.num,
    );
  });
  it('correctly resolves absolute bundled refs in arrays within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledAbsoluteRefWithinArray', bundledSchema)).toBe(
      (bundledSchema.$defs!.bundledSchemaArray as RJSFSchema).anyOf![0],
    );
  });
  it('correctly resolves absolute bundled refs within a JSON Schema Draft 2020-12 without an `$id`', () => {
    const { $id: d, ...bundledSchemaWithoutId } = bundledSchema;
    expect(findSchemaDefinitionRecursive('#/$defs/bundledAbsoluteRef', bundledSchemaWithoutId)).toStrictEqual(
      internalSchema,
    );
  });
  it('correctly resolves relative bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledRelativeRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves relative bundled refs with anchors within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledRelativeRefWithAnchor', bundledSchema)).toBe(
      internalSchema.$defs!.string,
    );
  });
  it('correctly resolves indirect bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/indirectRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves relative refs with explicit base URI in a bundled JSON Schema', () => {
    expect(
      findSchemaDefinitionRecursive('bundled.ref.json', bundledSchema, [], 'https://example.com/undefined.ref.json'),
    ).toStrictEqual(internalSchema);
  });
  it('correctly resolves local refs with explicit base URI in a bundled JSON Schema', () => {
    expect(
      findSchemaDefinitionRecursive('#/properties/num', bundledSchema, [], 'https://example.com/bundled.ref.json'),
    ).toBe(internalSchema.properties!.num);
  });
  it('throws error when relative ref is undefined in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinitionRecursive('#/$defs/undefinedRef', bundledSchema)).toThrow(
      'Could not find a definition for /undefined.ref.json',
    );
  });
  it('throws error when relative ref with anchor is undefined in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinitionRecursive('#/$defs/undefinedRefWithAnchor', bundledSchema)).toThrow(
      'Could not find a definition for #/$defs/undefined',
    );
  });
  it('throws error when local ref is undefined in a bundled JSON Schema with explicit base URI', () => {
    expect(() =>
      findSchemaDefinitionRecursive(
        '#/properties/undefined',
        bundledSchema,
        [],
        'https://example.com/bundled.ref.json',
      ),
    ).toThrow('Could not find a definition for #/properties/undefined');
  });
  it('throws error when explicit base URI is undefined in a bundled JSON Schema', () => {
    expect(() =>
      findSchemaDefinition('#/properties/undefined', bundledSchema, 'https://example.com/undefined.ref.json'),
    ).toThrow('Could not find a definition for #/properties/undefined');
  });
  it('throws error when ref is a deep circular reference in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinitionRecursive('#/$defs/circularRef', bundledSchema, [])).toThrow(
      'Definition for #/$defs/circularRef contains a circular reference through /bundled.ref.json/#/$defs/circularRef -> /bundled.schema.json/#/$defs/circularRef -> #/$defs/circularRef',
    );
  });
});

describe('makeAllReferencesAbsolute()', () => {
  it('correctly makes all references absolute in a JSON Schema', () => {
    expect(makeAllReferencesAbsolute(internalSchema, internalSchema[ID_KEY]!)).toStrictEqual({
      ...internalSchema,
      $defs: {
        ...internalSchema.$defs,
        circularRef: { $ref: 'https://example.com/bundled.schema.json/#/$defs/circularRef' },
        undefinedRef: { $ref: 'https://example.com/bundled.ref.json#/$defs/undefined' },
      },
      properties: {
        ...internalSchema.properties,
        string: { $ref: 'https://example.com/bundled.ref.json#/$defs/string' },
        allOf: {
          allOf: [
            {
              $ref: 'https://example.com/bundled.ref.json#/$defs/string',
            },
            {
              title: 'String',
            },
          ],
        },
      },
    });
  });
  it('leaves a property named $ref intact when the schema has no root $id', () => {
    const schemaWithRefProperty = { properties: { $ref: { type: 'string' } } } as unknown as RJSFSchema;
    expect(makeAllReferencesAbsolute(schemaWithRefProperty, '#').properties!.$ref).toStrictEqual({
      type: 'string',
    });
  });
  it('leaves a property named $ref intact when the root $id is absolute', () => {
    const schemaWithRefProperty = {
      $id: 'https://example.com/root.json',
      properties: { $ref: { type: 'string' } },
    } as unknown as RJSFSchema;
    expect(
      makeAllReferencesAbsolute(schemaWithRefProperty, schemaWithRefProperty[ID_KEY]!).properties!.$ref,
    ).toStrictEqual({ type: 'string' });
  });
  it('does not re-base siblings on a property named $id', () => {
    const schemaWithIdProperty = {
      $id: 'https://example.com/root.json',
      properties: { $id: { type: 'string' }, other: { $ref: '#/$defs/x' } },
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(schemaWithIdProperty, schemaWithIdProperty[ID_KEY]!);
    expect(resolved.properties!.$id).toStrictEqual({ type: 'string' });
    expect(resolved.properties!.other).toStrictEqual({ $ref: 'https://example.com/root.json#/$defs/x' });
  });
  it('leaves non-object entries of schema arrays untouched', () => {
    const schemaWithArrayKeywords = {
      $id: 'https://example.com/root.json',
      type: 'object',
      properties: { link: { type: ['string', 'null'], $ref: '#/$defs/x' } },
      required: ['link'],
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(schemaWithArrayKeywords, schemaWithArrayKeywords[ID_KEY]!);
    expect(resolved.required).toStrictEqual(['link']);
    expect(resolved.properties!.link).toStrictEqual({
      type: ['string', 'null'],
      $ref: 'https://example.com/root.json#/$defs/x',
    });
  });
  it('does not rewrite $ref-looking strings inside const, default, enum or examples', () => {
    const schemaWithDataKeywords = {
      $id: 'https://example.com/root.json',
      properties: {
        link: {
          const: { $ref: '#/a' },
          default: { $ref: '#/a' },
          enum: [{ $ref: '#/a' }],
          examples: [{ $ref: '#/a' }],
        },
      },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(schemaWithDataKeywords, schemaWithDataKeywords[ID_KEY]!);
    expect(resolved.properties!.link).toStrictEqual({
      const: { $ref: '#/a' },
      default: { $ref: '#/a' },
      enum: [{ $ref: '#/a' }],
      examples: [{ $ref: '#/a' }],
    });
  });
  it('makes $refs absolute under schema-map entries named like data keywords', () => {
    const namedLikeDataKeywords = {
      $id: 'https://example.com/root.json',
      properties: {
        default: { $ref: '#/$defs/x' },
        const: { $ref: '#/$defs/x' },
        enum: { $ref: '#/$defs/x' },
        examples: { $ref: '#/$defs/x' },
      },
      $defs: { x: { type: 'string' }, default: { $ref: '#/$defs/x' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(namedLikeDataKeywords, namedLikeDataKeywords[ID_KEY]!);
    const absolute = 'https://example.com/root.json#/$defs/x';
    expect(resolved.properties!.default).toStrictEqual({ $ref: absolute });
    expect(resolved.properties!.const).toStrictEqual({ $ref: absolute });
    expect(resolved.properties!.enum).toStrictEqual({ $ref: absolute });
    expect(resolved.properties!.examples).toStrictEqual({ $ref: absolute });
    expect(resolved.$defs!.default).toStrictEqual({ $ref: absolute });
  });
  it('leaves unknown keywords holding $ref or $id untouched', () => {
    const withVendorKeywords = {
      $id: 'https://example.com/root.json',
      'x-meta': { $ref: 'docs.md' },
      'x-resource': { $id: 'https://example.com/other.json', title: 'not a schema' },
      properties: { link: { $ref: '#/$defs/x' } },
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(withVendorKeywords, withVendorKeywords[ID_KEY]!);
    expect(resolved['x-meta']).toStrictEqual({ $ref: 'docs.md' });
    expect(resolved['x-resource']).toStrictEqual({ $id: 'https://example.com/other.json', title: 'not a schema' });
    expect(resolved.properties!.link).toStrictEqual({ $ref: 'https://example.com/root.json#/$defs/x' });
  });
  it('makes $refs absolute inside dependentSchemas values', () => {
    const withDependentSchemas = {
      $id: 'https://example.com/root.json',
      properties: { credit: { type: 'number' } },
      dependentSchemas: { credit: { properties: { billing: { $ref: '#/$defs/x' } } } },
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(withDependentSchemas, withDependentSchemas[ID_KEY]!);
    expect(resolved.dependentSchemas!.credit).toStrictEqual({
      properties: { billing: { $ref: 'https://example.com/root.json#/$defs/x' } },
    });
  });
  it('walks draft-7 tuple items and dependencies without treating string arrays as schemas', () => {
    const draft7Shape = {
      $id: 'https://example.com/root.json',
      items: [{ $ref: '#/$defs/x' }, true],
      additionalItems: { $ref: '#/$defs/x' },
      dependencies: {
        a: ['b'],
        b: { properties: { c: { $ref: '#/$defs/x' } } },
      },
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(draft7Shape, draft7Shape[ID_KEY]!);
    const absolute = 'https://example.com/root.json#/$defs/x';
    expect(resolved.items).toStrictEqual([{ $ref: absolute }, true]);
    expect(resolved.additionalItems).toStrictEqual({ $ref: absolute });
    expect(resolved.dependencies).toStrictEqual({ a: ['b'], b: { properties: { c: { $ref: absolute } } } });
  });
  it('walks prefixItems as an array of schemas', () => {
    const withPrefixItems = {
      $id: 'https://example.com/root.json',
      prefixItems: [{ $ref: '#/$defs/x' }, { type: 'number' }],
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(withPrefixItems, withPrefixItems[ID_KEY]!);
    expect(resolved.prefixItems).toStrictEqual([
      { $ref: 'https://example.com/root.json#/$defs/x' },
      { type: 'number' },
    ]);
  });
  it('leaves malformed keyword values untouched', () => {
    const malformed = {
      $id: 'https://example.com/root.json',
      $defs: null,
      allOf: 'nope',
      items: 5,
      additionalProperties: 42,
      dependencies: null,
      properties: { a: { $ref: '#/$defs/x' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(malformed, malformed[ID_KEY]!);
    expect(resolved.$defs).toBeNull();
    expect(resolved.allOf).toBe('nope');
    expect(resolved.items).toBe(5);
    expect(resolved.additionalProperties).toBe(42);
    expect(resolved.dependencies).toBeNull();
    expect(resolved.properties!.a).toStrictEqual({ $ref: 'https://example.com/root.json#/$defs/x' });
  });
  it('returns the same object when nothing needs rewriting', () => {
    const plain = {
      type: 'object',
      properties: { a: { type: 'string' }, b: true },
      allOf: [{ type: 'string' }],
      items: { type: 'string' },
      required: ['a'],
    } as unknown as RJSFSchema;
    expect(makeAllReferencesAbsolute(plain, '#')).toBe(plain);
  });
  it('keeps object identity when every $ref is already absolute', () => {
    const alreadyAbsolute = {
      $id: 'https://example.com/root.json',
      properties: { a: { $ref: 'https://example.com/root.json#/$defs/x' } },
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    expect(makeAllReferencesAbsolute(alreadyAbsolute, alreadyAbsolute[ID_KEY]!)).toBe(alreadyAbsolute);
  });
  it('resolves a $ref under a property named like a data keyword through retrieveSchema', () => {
    const testValidator = getTestValidator({});
    const rootSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      type: 'object',
      properties: {
        home: {
          $id: 'https://example.com/address.json',
          type: 'object',
          properties: { default: { $ref: '#/$defs/street' } },
          $defs: { street: { type: 'string', title: 'street' } },
        },
      },
    } as unknown as RJSFSchema;
    const utils = createSchemaUtils({ validator: testValidator }, rootSchema);
    // `Form` resolves subschemas from the rewritten root schema, not the caller's original tree
    const home = utils.getRootSchema().properties!.home as RJSFSchema;
    const resolved = utils.retrieveSchema(home.properties!.default as RJSFSchema, {});
    expect(resolved.type).toBe('string');
    expect(resolved.title).toBe('street');
  });
});

describe('structure-aware walk pins', () => {
  const ROOT_ID = 'https://example.com/root.json';
  const FOO_ID = 'https://example.com/foo.json';
  const DRAFT_2020_12 = 'https://json-schema.org/draft/2020-12/schema';
  const REF_TARGET = '#/$defs/x';
  const ABSOLUTE_TARGET = `${ROOT_ID}${REF_TARGET}`;
  // The keyword lists are written out here on purpose, so dropping a keyword from a set in
  // `findSchemaDefinition.ts` fails a test instead of passing unnoticed (a `Set.has` check has no branch for
  // coverage to catch). `items` appears in the single and the array list because both of its shapes walk.
  const SINGLE_SUBSCHEMA_KEYWORDS = [
    'items',
    'additionalItems',
    'additionalProperties',
    'contains',
    'propertyNames',
    'not',
    'if',
    'then',
    'else',
    'unevaluatedItems',
    'unevaluatedProperties',
    'contentSchema',
  ];
  const ARRAY_SUBSCHEMA_KEYWORDS = ['prefixItems', 'allOf', 'anyOf', 'oneOf', 'items'];
  const MAP_SUBSCHEMA_KEYWORDS = [
    'properties',
    'patternProperties',
    '$defs',
    'definitions',
    'dependentSchemas',
    'dependencies',
  ];
  it.each(SINGLE_SUBSCHEMA_KEYWORDS)('makes a `$ref` under the `%s` keyword absolute', (keyword) => {
    const bundle = {
      $id: ROOT_ID,
      [keyword]: { $ref: REF_TARGET },
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(bundle, ROOT_ID);
    expect((resolved as unknown as GenericObjectType)[keyword]).toStrictEqual({ $ref: ABSOLUTE_TARGET });
  });
  it.each(ARRAY_SUBSCHEMA_KEYWORDS)('makes a `$ref` inside the `%s` schema array absolute', (keyword) => {
    const bundle = {
      $id: ROOT_ID,
      [keyword]: [{ $ref: REF_TARGET }],
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(bundle, ROOT_ID);
    expect((resolved as unknown as GenericObjectType)[keyword]).toStrictEqual([{ $ref: ABSOLUTE_TARGET }]);
  });
  it.each(MAP_SUBSCHEMA_KEYWORDS)('makes a `$ref` under a `%s` entry absolute', (keyword) => {
    const bundle: GenericObjectType = { $id: ROOT_ID, $defs: { x: { type: 'string' } } };
    if (keyword === '$defs') {
      (bundle.$defs as GenericObjectType).y = { $ref: REF_TARGET };
    } else {
      bundle[keyword] = { foo: { $ref: REF_TARGET } };
    }
    const resolved = makeAllReferencesAbsolute(bundle as unknown as RJSFSchema, ROOT_ID);
    const holder =
      keyword === '$defs'
        ? (resolved as unknown as GenericObjectType).$defs
        : (resolved as unknown as GenericObjectType)[keyword];
    expect((holder as GenericObjectType)[keyword === '$defs' ? 'y' : 'foo']).toStrictEqual({
      $ref: ABSOLUTE_TARGET,
    });
  });
  it.each(SINGLE_SUBSCHEMA_KEYWORDS)('finds an `$id` under the `%s` keyword', (keyword) => {
    const bundle = {
      $schema: DRAFT_2020_12,
      $id: ROOT_ID,
      properties: { a: { $ref: FOO_ID } },
      [keyword]: { $id: FOO_ID, type: 'string' },
    } as unknown as RJSFSchema;
    expect(findSchemaDefinition(FOO_ID, bundle)).toStrictEqual({ $id: FOO_ID, type: 'string' });
  });
  it.each(ARRAY_SUBSCHEMA_KEYWORDS)('finds an `$id` inside the `%s` schema array', (keyword) => {
    const bundle = {
      $schema: DRAFT_2020_12,
      $id: ROOT_ID,
      properties: { a: { $ref: FOO_ID } },
      [keyword]: [{ $id: FOO_ID, type: 'string' }],
    } as unknown as RJSFSchema;
    expect(findSchemaDefinition(FOO_ID, bundle)).toStrictEqual({ $id: FOO_ID, type: 'string' });
  });
  it.each(MAP_SUBSCHEMA_KEYWORDS)('finds an `$id` under a `%s` entry', (keyword) => {
    const bundle: GenericObjectType = {
      $schema: DRAFT_2020_12,
      $id: ROOT_ID,
      properties: { a: { $ref: FOO_ID } },
    };
    const target = { $id: FOO_ID, type: 'string' };
    if (keyword === 'properties') {
      (bundle.properties as GenericObjectType).foo = target;
    } else {
      bundle[keyword] = { foo: target };
    }
    expect(findSchemaDefinition(FOO_ID, bundle as unknown as RJSFSchema)).toStrictEqual(target);
  });
  it('does not find an `$id` kept under an unknown keyword, so bundle schemas belong under `$defs`', () => {
    const bundle = {
      $schema: DRAFT_2020_12,
      $id: ROOT_ID,
      properties: { a: { $ref: FOO_ID } },
      components: { schemas: { Foo: { $id: FOO_ID, type: 'string' } } },
    } as unknown as RJSFSchema;
    expect(() => findSchemaDefinition(FOO_ID, bundle)).toThrow(`Could not find a definition for ${FOO_ID}`);
  });
  it('leaves a `$ref` inside an unknown-keyword container relative, so resolution no longer reaches it', () => {
    const bundle = {
      $schema: DRAFT_2020_12,
      $id: ROOT_ID,
      properties: { a: { $ref: 'https://example.com/lib.json#/components/Foo' } },
      $defs: {
        lib: {
          $id: 'https://example.com/lib.json',
          components: {
            Foo: { type: 'object', properties: { x: { $ref: '#/components/Bar' } } },
            Bar: { type: 'string' },
          },
        },
      },
    } as unknown as RJSFSchema;
    const rewritten = makeAllReferencesAbsolute(bundle, ROOT_ID);
    const lib = (rewritten as unknown as GenericObjectType).$defs as GenericObjectType;
    const components = (lib.lib as GenericObjectType).components as GenericObjectType;
    expect(((components.Foo as GenericObjectType).properties as GenericObjectType).x).toStrictEqual({
      $ref: '#/components/Bar',
    });
    // `retrieveSchema` resolves the outer pointer and then the un-rewritten inner `$ref` against the root,
    // where `/components/Bar` does not exist
    const testValidator = getTestValidator({});
    const utils = createSchemaUtils({ validator: testValidator }, rewritten);
    const a = (utils.getRootSchema() as unknown as GenericObjectType).properties as GenericObjectType;
    expect(() => utils.retrieveSchema(a.a as RJSFSchema, {})).toThrow(
      'Could not find a definition for #/components/Bar',
    );
  });
  it('keeps symbol keys when a node is rebuilt for a `$ref` below it', () => {
    const flagged = {
      $id: ROOT_ID,
      [ADDITIONAL_PROPERTY_FLAG]: true,
      properties: { a: { $ref: REF_TARGET } },
      $defs: { x: { type: 'string' } },
    } as unknown as RJSFSchema;
    const resolved = makeAllReferencesAbsolute(flagged, ROOT_ID);
    const a = ((resolved as unknown as GenericObjectType).properties as GenericObjectType).a as GenericObjectType;
    expect(a).toStrictEqual({ $ref: ABSOLUTE_TARGET });
    expect((resolved as unknown as Record<symbol, unknown>)[ADDITIONAL_PROPERTY_FLAG]).toBe(true);
  });
  it('returns the found node when its own `$ref` is an empty string', () => {
    const rootSchema = { $defs: { a: { $ref: '', type: 'string', default: 'x' } } } as unknown as RJSFSchema;
    expect(findSchemaDefinition('#/$defs/a', rootSchema)).toStrictEqual({ $ref: '', type: 'string', default: 'x' });
  });
});
