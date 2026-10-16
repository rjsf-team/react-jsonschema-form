import { JSON_SCHEMA_DRAFT_2019_09, RJSF_REF_KEY } from '../src/constants.ts';
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

describe('$id resolution of a nested resource', () => {
  const retrieveRef = (rootSchema: RJSFSchema, $ref: string) =>
    retrieveAt({ ...rootSchema, properties: { r: { $ref } } }, ['properties', 'r']);
  const child: RJSFSchema = {
    $id: 'child.json',
    type: 'object',
    properties: { a: { $ref: '#/$defs/x' }, b: { $ref: 'sibling.json' } },
    $defs: { x: { type: 'string' } },
  };
  const sibling: RJSFSchema = { $id: 'sibling.json', type: 'number' };
  const nestedUnder = (rootId: string | undefined): RJSFSchema => ({
    $schema: JSON_SCHEMA_DRAFT_2020_12,
    ...(rootId === undefined ? {} : { $id: rootId }),
    properties: { c: { $ref: 'nested/child.json' } },
    $defs: { parent: { $id: 'nested/parent.json', $defs: { child, sibling } } },
  });

  it('resolves a relative `$id` against the `$id` of the resource it is nested in', () => {
    const rootSchema = nestedUnder(ROOT_ID);
    expect(retrieveRef(rootSchema, 'https://example.com/nested/child.json')).toMatchObject({ $id: 'child.json' });
    expect(retrieveRef(rootSchema, 'nested/child.json#/$defs/x')).toMatchObject({ type: 'string' });
    expect(() => retrieveRef(rootSchema, 'child.json')).toThrow('Could not find a definition for child.json.');
    expect(() => retrieveRef(rootSchema, 'nested/child.json#/$defs/missing')).toThrow(
      'Could not find a definition for nested/child.json#/$defs/missing.',
    );
  });
  it.each([
    ['an absolute', ROOT_ID],
    ['a relative', 'schemas/root.json'],
    ['no', undefined],
  ])('resolves the `$ref`s inside it against its resolved `$id` under a root with %s `$id`', (_, rootId) => {
    const path = ['$defs', 'parent', '$defs', 'child', 'properties'];
    expect(retrieveAt(nestedUnder(rootId), [...path, 'a'])).toMatchObject({ type: 'string' });
    expect(retrieveAt(nestedUnder(rootId), [...path, 'b'])).toMatchObject({ $id: 'sibling.json', type: 'number' });
    expect(retrieveProperty(nestedUnder(rootId), 'c')).toMatchObject({ $id: 'child.json', type: 'object' });
  });
  it('does not find a resource the relative `$ref` inside it does not name', () => {
    const rootSchema: RJSFSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $defs: {
        b: { $id: 'b.json', type: 'number' },
        sub: { $id: 'sub/a.json', properties: { x: { $ref: 'b.json' } } },
      },
    };
    expect(() => retrieveAt(rootSchema, ['$defs', 'sub', 'properties', 'x'])).toThrow(
      'Could not find a definition for b.json.',
    );
  });
  it('resolves relative `$id`s and `$ref`s against a relative root `$id`', () => {
    const rootSchema: RJSFSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: 'relative/schema.json',
      $defs: {
        embedded: { $id: 'embedded.json', properties: { a: { type: 'string' } } },
        other: { $id: '../other.json', type: 'number' },
      },
    };
    expect(retrieveRef(rootSchema, 'embedded.json')).toMatchObject({ $id: 'embedded.json' });
    expect(retrieveRef(rootSchema, './embedded.json#')).toMatchObject({ $id: 'embedded.json' });
    expect(retrieveRef(rootSchema, 'embedded.json#/properties/a')).toMatchObject({ type: 'string' });
    expect(retrieveRef(rootSchema, '../other.json')).toMatchObject({ type: 'number' });
    expect(() => retrieveRef(rootSchema, 'missing.json')).toThrow('Could not find a definition for missing.json.');
  });
  it('resolves the relative `$ref`s of a root without `$id`, keeping an absolute-path one rooted', () => {
    const rootSchema: RJSFSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      properties: {
        dot: { $ref: './embedded.json' },
        parent: { $ref: '../embedded.json' },
        traversal: { $ref: 'a/../embedded.json' },
        rooted: { $ref: '/embedded.json' },
      },
      $defs: {
        embedded: { $id: 'embedded.json', type: 'string' },
        a: { $id: 'sub/a.json', properties: { b: { $ref: 'b.json' } } },
        b: { $id: 'sub/b.json', type: 'number' },
        rooted: { $id: '/embedded.json', type: 'boolean' },
      },
    };
    expect(retrieveProperty(rootSchema, 'dot')).toMatchObject({ type: 'string' });
    expect(retrieveProperty(rootSchema, 'parent')).toMatchObject({ type: 'string' });
    expect(retrieveProperty(rootSchema, 'traversal')).toMatchObject({ type: 'string' });
    expect(retrieveProperty(rootSchema, 'rooted')).toMatchObject({ type: 'boolean' });
    expect(retrieveAt(rootSchema, ['$defs', 'a', 'properties', 'b'])).toMatchObject({ type: 'number' });
  });
  it('rebases the `$ref`s under a nested `$id` that is itself nested in another', () => {
    const rootSchema: RJSFSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: ROOT_ID,
      $defs: {
        y: { $id: 'deep/y.json', type: 'null' },
        child: {
          $id: 'child.json',
          properties: { a: { $ref: '#/$defs/x' } },
          $defs: { x: { $id: 'deep/x.json', properties: { y: { $ref: 'y.json' } } } },
        },
      },
    };
    expect(retrieveAt(rootSchema, ['$defs', 'child', 'properties', 'a'])).toMatchObject({ $id: 'deep/x.json' });
    expect(retrieveAt(rootSchema, ['$defs', 'child', '$defs', 'x', 'properties', 'y'])).toMatchObject({
      type: 'null',
    });
  });
  it('resolves a relative `$id` and `$ref` under a `urn:` base without their dot segments', () => {
    const rootSchema: RJSFSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: 'urn:example:root',
      properties: { a: { $ref: './child.json' } },
      $defs: { child: { $id: './child.json', type: 'string' } },
    };
    expect(retrieveRef(rootSchema, 'child.json')).toMatchObject({ type: 'string' });
    expect(retrieveProperty(rootSchema, 'a')).toMatchObject({ type: 'string' });
  });
  it('throws for a `$ref` into a resource whose fragment is neither a JSON pointer nor an anchor', () => {
    const rootSchema: RJSFSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: ROOT_ID,
      $defs: { a: { type: 'string' } },
    };
    expect(() => retrieveRef(rootSchema, `${ROOT_ID}#foo`)).toThrow(`Could not find a definition for ${ROOT_ID}#foo.`);
  });
  it('finds a resource whose relative nested `$id` ends in `/` only by a `$ref` ending in it too, and one without by either', () => {
    const rootSchema: RJSFSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: ROOT_ID,
      $defs: { dir: { $id: 'nested/', $defs: { x: { type: 'string' } } }, plain: { $id: 'plain', type: 'null' } },
    };
    expect(retrieveRef(rootSchema, 'https://example.com/nested/#/$defs/x')).toMatchObject({ type: 'string' });
    expect(() => retrieveRef(rootSchema, 'https://example.com/nested')).toThrow(
      'Could not find a definition for https://example.com/nested.',
    );
    expect(retrieveRef(rootSchema, 'https://example.com/plain/')).toMatchObject({ type: 'null' });
  });
  it('finds a root, and an embedded resource, whose `$id` ends in an empty fragment', () => {
    const rootSchema: RJSFSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: `${ROOT_ID}#`,
      properties: { a: { $ref: '#/$defs/x' }, b: { $ref: 'lib.json' } },
      $defs: {
        x: { type: 'string' },
        lib: {
          $id: 'lib.json#',
          type: 'object',
          properties: { c: { $ref: '#/$defs/n' } },
          $defs: { n: { type: 'null' } },
        },
      },
    };
    expect(retrieveProperty(rootSchema, 'a')).toMatchObject({ type: 'string' });
    expect(retrieveProperty(rootSchema, 'b')).toMatchObject({ $id: 'lib.json#' });
    expect(retrieveAt(rootSchema, ['$defs', 'lib', 'properties', 'c'])).toMatchObject({ type: 'null' });
  });

  describe('a pointer into an embedded resource', () => {
    const inner: RJSFSchema = {
      $id: 'inner.json',
      properties: { q: { $ref: '#/$defs/x' } },
      $defs: { x: { const: 3 } },
    };
    const lib: RJSFSchema = {
      $id: 'lib.json',
      properties: { p: { $ref: '#/$defs/x' }, q: { $ref: '#/$defs/inner/properties/q' }, m: { $ref: '#/$defs/x/m' } },
      $defs: { x: { type: 'string' }, inner },
    };
    const libUnder = (rootId: string | undefined): RJSFSchema => ({
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      ...(rootId === undefined ? {} : { $id: rootId }),
      properties: { a: { $ref: '#/$defs/lib' } },
      $defs: { lib, x: { type: 'number' } },
    });

    it.each([
      ['an absolute', ROOT_ID],
      ['no', undefined],
    ])('resolves a relative `$ref` inside it against that resource under a root with %s `$id`', (_, rootId) => {
      expect(retrieveRef(libUnder(rootId), '#/$defs/lib/properties/p')).toMatchObject({ type: 'string' });
      expect(retrieveRef(libUnder(rootId), '#/$defs/lib/$defs/inner/properties/q')).toMatchObject({ const: 3 });
    });
    it('rebases on each resource a pointer written inside a resource reaches from there', () => {
      const path = ['$defs', 'lib', 'properties'];
      expect(retrieveAt(libUnder(ROOT_ID), [...path, 'q'])).toMatchObject({ const: 3 });
      expect(() => retrieveAt(libUnder(ROOT_ID), [...path, 'm'])).toThrow(
        'Could not find a definition for #/$defs/x/m.',
      );
    });
    it('rebases on a resource the pointer reaches through a keyword holding one subschema', () => {
      const rootSchema: RJSFSchema = {
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: ROOT_ID,
        $defs: {
          list: {
            type: 'array',
            items: { $id: 'item.json', properties: { r: { $ref: '#/$defs/x' } }, $defs: { x: { type: 'null' } } },
          },
          x: { type: 'number' },
        },
      };
      expect(retrieveRef(rootSchema, '#/$defs/list/items/properties/r')).toMatchObject({ type: 'null' });
    });
    it('does not read the same `$ref` written in two resources as a circular reference', () => {
      const rootSchema: RJSFSchema = {
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: ROOT_ID,
        $defs: {
          x: { $ref: 'chain.json' },
          chain: { $id: 'chain.json', $ref: '#/$defs/x', $defs: { x: { type: 'string' } } },
        },
      };
      expect(retrieveRef(rootSchema, '#/$defs/x')).toMatchObject({ type: 'string' });
    });
    it('does not rebase on a fragment-only `$id`', () => {
      const rootSchema: RJSFSchema = {
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: ROOT_ID,
        $defs: { anchored: { $id: '#anchored', $ref: '#/$defs/str' }, str: { type: 'string' } },
      };
      expect(retrieveRef(rootSchema, '#/$defs/anchored')).toMatchObject({ $id: '#anchored', type: 'string' });
    });
    it('does not rebase on an `$id` under a keyword that holds no subschemas, or beside a `$ref` there', () => {
      const rootSchema = looseSchema({
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        properties: { a: { $ref: '#/components/Pet/properties/name' }, b: { $ref: '#/components/Pet' } },
        components: {
          Pet: {
            $id: 'pet.json',
            type: 'object',
            properties: { name: { $ref: '#/components/Name' }, n: { $id: 'n.json', $ref: '#/components/Name' } },
          },
          Name: { type: 'string' },
        },
      });
      expect(retrieveProperty(rootSchema, 'a')).toMatchObject({ type: 'string' });
      expect(retrieveAt(rootSchema, ['components', 'Pet', 'properties', 'n'])).toMatchObject({
        $id: 'n.json',
        type: 'string',
      });
    });
  });

  describe('the keywords beside a `$ref` into an embedded resource', () => {
    const besideUnder = (rootId: string | undefined): RJSFSchema => ({
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      ...(rootId === undefined ? {} : { $id: rootId }),
      properties: { a: { $ref: '#/$defs/lib/$defs/x', properties: { y: { $ref: '#/$defs/top' } } } },
      $defs: { lib: { $id: 'lib.json', $defs: { x: { type: 'object' } } }, top: { type: 'string' } },
    });

    it.each([
      ['an absolute', ROOT_ID],
      ['no', undefined],
    ])('keep the base of the resource they were written in under a root with %s `$id`', (_, rootId) => {
      expect(retrieveProperty(besideUnder(rootId), 'a')).toMatchObject({ type: 'object' });
      expect(retrieveAt(besideUnder(rootId), ['properties', 'a', 'properties', 'y'])).toMatchObject({ type: 'string' });
    });
    it('resolve against an `$id` beside the `$ref`, as the `$ref` does', () => {
      const rootSchema: RJSFSchema = {
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: ROOT_ID,
        properties: {
          a: {
            $id: 'own.json',
            $ref: '#/$defs/obj',
            properties: { y: { $ref: '#/$defs/str' } },
            $defs: { obj: { type: 'object' }, str: { type: 'string' } },
          },
        },
        $defs: { obj: { type: 'number' }, str: { type: 'number' } },
      };
      expect(retrieveProperty(rootSchema, 'a')).toMatchObject({ type: 'object' });
      expect(retrieveAt(rootSchema, ['properties', 'a', 'properties', 'y'])).toMatchObject({ type: 'string' });
    });
  });
});

describe('$id resolution under a draft-07 or 2019-09 root', () => {
  const DRAFT_07 = 'http://json-schema.org/draft-07/schema#';
  it.each([
    ['draft-07', DRAFT_07, 'definitions'],
    ['2019-09', JSON_SCHEMA_DRAFT_2019_09, '$defs'],
    ['no `$schema`', undefined, 'definitions'],
  ])('starts a resource a pointer into it resolves in under %s', (_, draft, defs) => {
    const rootSchema: RJSFSchema = {
      ...(draft === undefined ? {} : { $schema: draft }),
      $id: ROOT_ID,
      [defs]: {
        x: { type: 'number' },
        other: {
          $id: 'https://example.com/other.json',
          [defs]: { x: { type: 'string' } },
          properties: { p: { $ref: `#/${defs}/x` } },
        },
      },
      properties: { a: { $ref: `#/${defs}/other/properties/p` } },
    };
    expect(retrieveProperty(rootSchema, 'a')).toMatchObject({ type: 'string' });
    expect(retrieveAt(rootSchema, [defs, 'other', 'properties', 'p'])).toMatchObject({ type: 'string' });
  });
  it.each([
    ['rebases', '2019-09', JSON_SCHEMA_DRAFT_2019_09, 'string'],
    ['is ignored by', 'draft-07', DRAFT_07, 'number'],
  ])('an `$id` beside a `$ref` %s the %s `$ref`', (_, __, draft, type) => {
    const rootSchema: RJSFSchema = {
      $schema: draft,
      $id: ROOT_ID,
      properties: { a: { $id: 'own.json', $ref: '#/$defs/str', $defs: { str: { type: 'string' } } } },
      $defs: { str: { type: 'number' } },
    };
    expect(retrieveProperty(rootSchema, 'a')).toMatchObject({ type });
  });
  it('an `$id` beside a draft-07 `$ref` a pointer reaches starts no resource', () => {
    const rootSchema: RJSFSchema = {
      $schema: DRAFT_07,
      $id: ROOT_ID,
      definitions: { a: { $id: 'a.json', $ref: '#/definitions/b' }, b: { type: 'string' } },
      properties: { x: { $ref: '#/definitions/a' } },
    };
    expect(retrieveProperty(rootSchema, 'x')).toMatchObject({ type: 'string' });
  });
  it.each([
    ['draft-07', DRAFT_07, 'definitions'],
    ['2019-09', JSON_SCHEMA_DRAFT_2019_09, '$defs'],
  ])('starts a resource a %s `$ref` names by its URI', (_, draft, defs) => {
    const rootSchema: RJSFSchema = {
      $schema: draft,
      $id: ROOT_ID,
      [defs]: { other: { $id: 'other.json', type: 'string', [defs]: { y: { type: 'null' } } } },
      properties: { a: { $ref: 'other.json' }, b: { $ref: `https://example.com/other.json#/${defs}/y` } },
    };
    expect(retrieveProperty(rootSchema, 'a')).toMatchObject({ $id: 'other.json', type: 'string' });
    expect(retrieveProperty(rootSchema, 'b')).toMatchObject({ type: 'null' });
  });
});
