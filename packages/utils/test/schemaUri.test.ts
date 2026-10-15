import { ADDITIONAL_PROPERTY_FLAG, RJSF_REF_KEY } from '../src/constants.ts';
import type { RJSFSchema } from '../src/index.ts';
import { createSchemaUtils, JSON_SCHEMA_DRAFT_2020_12 } from '../src/index.ts';
import { isSchemaObject } from '../src/isObject.ts';
import { getByPath } from '../src/pathUtils.ts';
import { isSubschemaKeyword, makeAllReferencesAbsolute, normalizeUri, resolveUri } from '../src/schemaUri.ts';
import looseSchema from './schema/graph/looseSchema.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const ROOT_ID = 'https://example.com/root.json';
const FOO_ID = 'https://example.com/foo.json';
const REF_TARGET = '#/$defs/x';
const ABSOLUTE_TARGET = `${ROOT_ID}${REF_TARGET}`;
const X_DEFS: RJSFSchema['$defs'] = { x: { type: 'string' } };

/** Retrieves the subschema at `path` the way `Form` reads it: from the root `createSchemaUtils()` rewrote */
function retrieveAt(rootSchema: RJSFSchema, path: string[]): RJSFSchema {
  const utils = createSchemaUtils({ validator: getTestValidator({}) }, rootSchema);
  const subschema: unknown = getByPath(utils.getRootSchema(), path);
  return utils.retrieveSchema(isSchemaObject(subschema) ? subschema : {}, undefined);
}

function retrieveProperty(rootSchema: RJSFSchema, name: string): RJSFSchema {
  return retrieveAt(rootSchema, ['properties', name]);
}

describe('resolveUri()', () => {
  it.each([
    ['an absolute base', ROOT_ID, 'sub/a.json', 'https://example.com/sub/a.json'],
    ['a fragment against an absolute base', ROOT_ID, '#/$defs/x', ABSOLUTE_TARGET],
    [
      'a base with an upper-case scheme and host and a default port',
      'HTTPS://Example.com:443/a/b.json',
      '../c.json',
      'https://example.com/c.json',
    ],
    [
      'a non-special scheme, lower-casing its host',
      'git://HOST.example.com/a.json',
      'b.json',
      'git://host.example.com/b.json',
    ],
    ['the `#` base of a root without `$id`, dropping a `./`', '#', './embedded.json', 'embedded.json'],
    ['the `#` base, dropping a `..` above it', '#', '../embedded.json', 'embedded.json'],
    ['the `#` base, removing dot segments', '#', 'a/../embedded.json', 'embedded.json'],
    ['the `#` base, keeping an absolute path rooted', '#', '/embedded.json', '/embedded.json'],
    ['a relative base', 'relative/schema.json', 'embedded.json', 'relative/embedded.json'],
    ['a relative base, up a level', 'relative/schema.json', '../other.json', 'other.json'],
    ['an absolute-path base', '/schemas/root.json', 'a.json', '/schemas/a.json'],
    ['an absolute-path base, up a level', '/schemas/root.json', '../b.json', '/b.json'],
    ['a fragment against an absolute-path base', '/schemas/root.json', '#/$defs/a', '/schemas/root.json#/$defs/a'],
    [
      'a network-path base, without picking up a scheme',
      '//cdn.example.com/c.json',
      'b.json',
      '//cdn.example.com/b.json',
    ],
    [
      'a network-path base, lower-casing its host',
      '//CDN.Example.com/c.json',
      '#/properties/y',
      '//cdn.example.com/c.json#/properties/y',
    ],
    ['a network-path ref under a relative base', '#', '//CDN.Example.com/b.json', '//cdn.example.com/b.json'],
    [
      'an internationalized host',
      'https://bücher.example/schemas/root.json',
      'embedded.json',
      'https://xn--bcher-kva.example/schemas/embedded.json',
    ],
    ['an absolute ref under an empty base', '', 'file:///schemas/local.json', 'file:///schemas/local.json'],
    ['an absolute ref under an opaque base', 'urn:example:root', 'urn:example:embedded', 'urn:example:embedded'],
  ])('resolves against %s', (_, base, ref, expected) => {
    expect(resolveUri(base, ref)).toBe(expected);
  });
  it('returns the ref as written when the base or the ref is one the URL parser rejects', () => {
    expect(resolveUri('urn:example:root', 'relative.json')).toBe('relative.json');
    expect(resolveUri(ROOT_ID, 'https://[invalid/embedded.json')).toBe('https://[invalid/embedded.json');
  });
});

describe('normalizeUri()', () => {
  it('normalizes the scheme and host case, the default port and dot segments', () => {
    expect(normalizeUri('HTTPS://Example.com:443/a/./b/../c.json')).toBe('https://example.com/a/c.json');
  });
  it('decodes percent-encoded unreserved characters only', () => {
    expect(normalizeUri('https://example.com/%7Euser/%41%2f.json')).toBe('https://example.com/~user/A%2f.json');
    expect(normalizeUri('%7e')).toBe('~');
  });
  it('drops a leading `./` from a relative reference and leaves an opaque URI as written', () => {
    expect(normalizeUri('./relative.json')).toBe('relative.json');
    expect(normalizeUri('urn:Example:X')).toBe('urn:Example:X');
  });
});

describe('isSubschemaKeyword()', () => {
  it.each(['items', 'not', 'contentSchema', 'prefixItems', 'oneOf', 'properties', '$defs', 'dependencies'])(
    'reads `%s` as holding subschemas',
    (key) => {
      expect(isSubschemaKeyword(key)).toBe(true);
    },
  );
  it.each(['const', 'default', 'enum', 'examples', 'title', 'x-meta'])('reads `%s` as holding data', (key) => {
    expect(isSubschemaKeyword(key)).toBe(false);
  });
});

describe('makeAllReferencesAbsolute()', () => {
  it('makes every $ref absolute against the root $id', () => {
    const schema = looseSchema({
      $id: ROOT_ID,
      $defs: { string: { type: 'string' }, other: { $ref: '/other.json/#/$defs/a' } },
      properties: {
        num: { type: 'integer' },
        string: { $ref: '#/$defs/string' },
        allOf: { allOf: [{ $ref: '#/$defs/string' }, { title: 'String' }] },
      },
    });
    expect(makeAllReferencesAbsolute(schema, ROOT_ID)).toStrictEqual({
      $id: ROOT_ID,
      $defs: { string: { type: 'string' }, other: { $ref: 'https://example.com/other.json/#/$defs/a' } },
      properties: {
        num: { type: 'integer' },
        string: { $ref: 'https://example.com/root.json#/$defs/string' },
        allOf: { allOf: [{ $ref: 'https://example.com/root.json#/$defs/string' }, { title: 'String' }] },
      },
    });
  });
  it('resolves a nested relative $id against its parent before resolving the $refs under it', () => {
    const schema: RJSFSchema = {
      $id: 'https://e.x/root.json',
      $defs: {
        c: { $id: 'sub/c.json', properties: { w: { $ref: '#/$defs/w' } }, $defs: { w: { type: 'string' } } },
      },
    };
    expect(makeAllReferencesAbsolute(schema, 'https://e.x/root.json').$defs?.c).toStrictEqual({
      $id: 'sub/c.json',
      properties: { w: { $ref: 'https://e.x/sub/c.json#/$defs/w' } },
      $defs: { w: { type: 'string' } },
    });
  });
  it('resolves relative refs against the `#` base used for a root without `$id`', () => {
    const schema: RJSFSchema = {
      properties: {
        dot: { $ref: './embedded.json' },
        parent: { $ref: '../embedded.json' },
        rooted: { $ref: '/embedded.json' },
      },
      $defs: { a: { $id: 'sub/a.json', properties: { b: { $ref: 'b.json' } } } },
    };
    const resolved = makeAllReferencesAbsolute(schema, '#');
    expect(resolved.properties).toStrictEqual({
      dot: { $ref: 'embedded.json' },
      parent: { $ref: 'embedded.json' },
      rooted: { $ref: '/embedded.json' },
    });
    expect(getByPath(resolved, ['$defs', 'a', 'properties'])).toStrictEqual({ b: { $ref: 'sub/b.json' } });
  });
  it('keeps refs rooted under an absolute-path root `$id`, and network-path refs without a scheme', () => {
    const rooted: RJSFSchema = {
      $id: '/schemas/root.json',
      properties: { x: { $ref: 'a.json' }, local: { $ref: '#/$defs/a' } },
      $defs: { c: { $id: '//cdn.example.com/c.json', properties: { y: { $ref: 'b.json' } } } },
    };
    const resolved = makeAllReferencesAbsolute(rooted, '/schemas/root.json');
    expect(resolved.properties).toStrictEqual({
      x: { $ref: '/schemas/a.json' },
      local: { $ref: '/schemas/root.json#/$defs/a' },
    });
    expect(getByPath(resolved, ['$defs', 'c', 'properties', 'y'])).toStrictEqual({ $ref: '//cdn.example.com/b.json' });
  });
  it('leaves a property named $ref or $id intact and does not re-base its siblings on it', () => {
    const schema = looseSchema({
      $id: ROOT_ID,
      properties: { $ref: { type: 'string' }, $id: { type: 'string' }, other: { $ref: REF_TARGET } },
      $defs: X_DEFS,
    });
    expect(makeAllReferencesAbsolute(schema, ROOT_ID).properties).toStrictEqual({
      $ref: { type: 'string' },
      $id: { type: 'string' },
      other: { $ref: ABSOLUTE_TARGET },
    });
    const withoutId = looseSchema({ properties: { $ref: { type: 'string' } } });
    expect(makeAllReferencesAbsolute(withoutId, '#')).toBe(withoutId);
  });
  it('leaves data keywords, unknown keywords and malformed keyword values untouched', () => {
    const schema = looseSchema({
      $id: ROOT_ID,
      type: ['string', 'null'],
      required: ['link'],
      const: { $ref: '#/a' },
      default: { $ref: '#/a' },
      enum: [{ $ref: '#/a' }],
      examples: [{ $ref: '#/a' }],
      'x-meta': { $ref: 'docs.md' },
      'x-resource': { $id: 'https://example.com/other.json', title: 'not a schema' },
      allOf: 'nope',
      items: 5,
      additionalProperties: 42,
      dependencies: null,
      properties: { link: { $ref: REF_TARGET } },
      $defs: X_DEFS,
    });
    expect(makeAllReferencesAbsolute(schema, ROOT_ID)).toStrictEqual({
      ...schema,
      properties: { link: { $ref: ABSOLUTE_TARGET } },
    });
  });
  it('makes $refs absolute under schema-map entries named like data keywords', () => {
    const schema = looseSchema({
      $id: ROOT_ID,
      properties: { default: { $ref: REF_TARGET }, enum: { $ref: REF_TARGET } },
      $defs: { x: { type: 'string' }, default: { $ref: REF_TARGET } },
    });
    expect(makeAllReferencesAbsolute(schema, ROOT_ID)).toStrictEqual({
      $id: ROOT_ID,
      properties: { default: { $ref: ABSOLUTE_TARGET }, enum: { $ref: ABSOLUTE_TARGET } },
      $defs: { x: { type: 'string' }, default: { $ref: ABSOLUTE_TARGET } },
    });
  });
  it('walks draft-7 tuple items and dependencies without treating non-schema entries as schemas', () => {
    const schema = looseSchema({
      $id: ROOT_ID,
      items: [{ $ref: REF_TARGET }, true],
      dependencies: { a: ['b'], b: { properties: { c: { $ref: REF_TARGET } } } },
      $defs: X_DEFS,
    });
    expect(makeAllReferencesAbsolute(schema, ROOT_ID)).toStrictEqual({
      $id: ROOT_ID,
      items: [{ $ref: ABSOLUTE_TARGET }, true],
      dependencies: { a: ['b'], b: { properties: { c: { $ref: ABSOLUTE_TARGET } } } },
      $defs: X_DEFS,
    });
  });
  // The keyword lists are written out so that dropping a keyword from the walk fails a test: a `Set.has` check has no
  // branch for coverage to catch. `items` is in the single and the array list because both of its shapes are walked.
  it.each([
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
  ])('makes a `$ref` under the `%s` keyword absolute', (keyword) => {
    const resolved = makeAllReferencesAbsolute(looseSchema({ $id: ROOT_ID, [keyword]: { $ref: REF_TARGET } }), ROOT_ID);
    expect(getByPath(resolved, [keyword])).toStrictEqual({ $ref: ABSOLUTE_TARGET });
  });
  it.each(['prefixItems', 'allOf', 'anyOf', 'oneOf', 'items'])(
    'makes a `$ref` inside the `%s` schema array absolute',
    (keyword) => {
      const schema = looseSchema({ $id: ROOT_ID, [keyword]: [{ $ref: REF_TARGET }, { type: 'number' }] });
      expect(getByPath(makeAllReferencesAbsolute(schema, ROOT_ID), [keyword])).toStrictEqual([
        { $ref: ABSOLUTE_TARGET },
        { type: 'number' },
      ]);
    },
  );
  it.each(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas', 'dependencies'])(
    'makes a `$ref` under a `%s` entry absolute',
    (keyword) => {
      const schema = looseSchema({ $id: ROOT_ID, [keyword]: { foo: { $ref: REF_TARGET } } });
      expect(getByPath(makeAllReferencesAbsolute(schema, ROOT_ID), [keyword, 'foo'])).toStrictEqual({
        $ref: ABSOLUTE_TARGET,
      });
    },
  );
  it('returns the same object when nothing needs rewriting', () => {
    const plain = looseSchema({
      type: 'object',
      properties: { a: { type: 'string' }, b: true },
      allOf: [{ type: 'string' }],
      items: { type: 'string' },
      required: ['a'],
    });
    expect(makeAllReferencesAbsolute(plain, '#')).toBe(plain);
    const alreadyAbsolute: RJSFSchema = { $id: ROOT_ID, properties: { a: { $ref: ABSOLUTE_TARGET } }, $defs: X_DEFS };
    expect(makeAllReferencesAbsolute(alreadyAbsolute, ROOT_ID)).toBe(alreadyAbsolute);
  });
  it('keeps symbol keys when a node is rebuilt for a `$ref` below it', () => {
    const flagged = looseSchema({
      $id: ROOT_ID,
      [ADDITIONAL_PROPERTY_FLAG]: true,
      properties: { a: { $ref: REF_TARGET } },
    });
    const resolved = makeAllReferencesAbsolute(flagged, ROOT_ID);
    expect(resolved.properties).toStrictEqual({ a: { $ref: ABSOLUTE_TARGET } });
    expect(Reflect.get(resolved, ADDITIONAL_PROPERTY_FLAG)).toBe(true);
  });
  it('leaves a `$ref` in an unknown-keyword container relative, for retrieval to resolve against its resource', () => {
    const schema = looseSchema({
      $schema: JSON_SCHEMA_DRAFT_2020_12,
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
    });
    const rewritten = makeAllReferencesAbsolute(schema, ROOT_ID);
    expect(getByPath(rewritten, ['$defs', 'lib', 'components', 'Foo', 'properties', 'x'])).toStrictEqual({
      $ref: '#/components/Bar',
    });
    expect(retrieveProperty(schema, 'a').properties?.x).toEqual({ $ref: '#/components/Bar' });
    expect(retrieveAt(schema, ['$defs', 'lib', 'components', 'Foo', 'properties', 'x'])).toEqual({
      type: 'string',
      [RJSF_REF_KEY]: '#/components/Bar',
    });
  });
  it('lets retrieveSchema resolve a $ref under a property named like a data keyword', () => {
    const schema = looseSchema({
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: ROOT_ID,
      properties: {
        home: {
          $id: 'https://example.com/address.json',
          type: 'object',
          properties: { default: { $ref: '#/$defs/street' } },
          $defs: { street: { type: 'string', title: 'street' } },
        },
      },
    });
    expect(retrieveAt(schema, ['properties', 'home', 'properties', 'default'])).toMatchObject({
      type: 'string',
      title: 'street',
    });
  });
});

describe('$id resolution of a draft 2020-12 bundle', () => {
  function bundle(own: object): RJSFSchema {
    return looseSchema({ $schema: JSON_SCHEMA_DRAFT_2020_12, $id: ROOT_ID, ...own });
  }
  it.each([
    ['under a single-subschema keyword', { not: { $id: FOO_ID, type: 'string' } }],
    ['inside a schema array', { anyOf: [{ $id: FOO_ID, type: 'string' }] }],
    ['under a schema-map entry', { $defs: { foo: { $id: FOO_ID, type: 'string' } } }],
    [
      'through dependencies and tuple items',
      { dependencies: { other: ['trigger'], trigger: { items: [true, { not: { $id: FOO_ID, type: 'string' } }] } } },
    ],
  ])('finds an embedded resource %s', (_, own) => {
    expect(retrieveProperty(bundle({ ...own, properties: { a: { $ref: FOO_ID } } }), 'a')).toMatchObject({
      type: 'string',
    });
  });
  it.each([
    ['an upper-case host and a default port', 'HTTPS://Example.COM:443/foo.json'],
    ['a percent-encoded unreserved character', 'https://example.com/%66oo.json'],
    ['a relative reference', 'foo.json'],
    ['dot segments', './sub/../foo.json'],
  ])('matches an `$id` through %s', (_, ref) => {
    const schema = bundle({ properties: { a: { $ref: ref } }, $defs: { foo: { $id: FOO_ID, type: 'string' } } });
    expect(retrieveProperty(schema, 'a')).toMatchObject({ type: 'string' });
  });
  it('resolves a JSON pointer fragment into an embedded resource with escaped and percent-encoded tokens', () => {
    const schema = bundle({
      properties: {
        slash: { $ref: 'foo.json#/properties/a~1b' },
        space: { $ref: 'foo.json#/properties/a%20b' },
        unicode: { $ref: 'foo.json#/properties/%C3%BCn%C3%AFcode' },
      },
      $defs: {
        foo: {
          $id: FOO_ID,
          properties: { 'a/b': { type: 'string' }, 'a b': { type: 'number' }, ünïcode: { type: 'boolean' } },
        },
      },
    });
    expect(retrieveProperty(schema, 'slash')).toMatchObject({ type: 'string' });
    expect(retrieveProperty(schema, 'space')).toMatchObject({ type: 'number' });
    expect(retrieveProperty(schema, 'unicode')).toMatchObject({ type: 'boolean' });
  });
  it('resolves `urn:` resources', () => {
    const schema = looseSchema({
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: 'urn:example:root',
      properties: { a: { $ref: 'urn:example:embedded#/properties/b' } },
      $defs: { embedded: { $id: 'urn:example:embedded', properties: { b: { type: 'string' } } } },
    });
    expect(retrieveProperty(schema, 'a')).toMatchObject({ type: 'string' });
  });
  it.each([
    ['an `$id` held by instance data', { default: { $id: FOO_ID } }],
    ['an `$id` under an unknown keyword', { components: { schemas: { Foo: { $id: FOO_ID, type: 'string' } } } }],
  ])('does not find %s', (_, own) => {
    const schema = bundle({ ...own, properties: { a: { $ref: FOO_ID } } });
    expect(() => retrieveProperty(schema, 'a')).toThrow(`Could not find a definition for ${FOO_ID}`);
  });
});
