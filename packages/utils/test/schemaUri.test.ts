import { RJSF_REF_KEY } from '../src/constants.ts';
import type { RJSFSchema } from '../src/index.ts';
import { createSchemaUtils, JSON_SCHEMA_DRAFT_2020_12 } from '../src/index.ts';
import { isSchemaObject } from '../src/isObject.ts';
import { getByPath } from '../src/pathUtils.ts';
import { isSubschemaKeyword, normalizeUri, resolveUri } from '../src/schemaUri.ts';
import looseSchema from './schema/graph/looseSchema.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const ROOT_ID = 'https://example.com/root.json';
const FOO_ID = 'https://example.com/foo.json';
const ABSOLUTE_TARGET = `${ROOT_ID}#/$defs/x`;

/** Retrieves the subschema at `path` the way `Form` reads it: from the root `createSchemaUtils()` hands out */
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
  it('resolves a `$ref` in an unknown-keyword container against the resource holding it', () => {
    const schema = bundle({
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
    expect(retrieveProperty(schema, 'a').properties?.x).toEqual({ $ref: '#/components/Bar' });
    expect(retrieveAt(schema, ['$defs', 'lib', 'components', 'Foo', 'properties', 'x'])).toEqual({
      type: 'string',
      [RJSF_REF_KEY]: '#/components/Bar',
    });
  });
  it('resolves a $ref under a property named like a data keyword', () => {
    const schema = bundle({
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
