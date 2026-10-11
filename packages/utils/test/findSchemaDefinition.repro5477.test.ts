import findSchemaDefinition, {
  findSchemaDefinitionRecursive,
  makeAllReferencesAbsolute,
} from '../src/findSchemaDefinition.ts';
import type { RJSFSchema } from '../src/index.ts';
import retrieveSchema from '../src/schema/retrieveSchema.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const testValidator = getTestValidator({});

// Review-round fixtures from #5477: nested $id scopes in 2020-12 bundles.
describe('nested $id scope regressions (#5477 review)', () => {
  // Root https://example.com/root.json; $defs.parent ($id 'nested/parent.json') holds child
  // ($id 'child.json') which defines q.
  const bundle: RJSFSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://example.com/root.json',
    $defs: {
      parent: {
        $id: 'nested/parent.json',
        $defs: {
          child: {
            $id: 'child.json',
            $defs: {
              q: { type: 'string' },
            },
          },
        },
      },
    },
  };

  it('resolves refs inside a $ref target reached by pointer when the referring schema carries its $id as written', () => {
    const referring: RJSFSchema = {
      $ref: '#/$defs/parent/$defs/child',
      $id: 'child.json',
      properties: { v: { $ref: '#/$defs/q' } },
    };
    const resolved = retrieveSchema({ validator: testValidator }, referring, bundle);
    expect(resolved.properties!.v).toMatchObject({ type: 'string' });
  });

  it('public findSchemaDefinition accepts an as-written nested baseURI', () => {
    expect(findSchemaDefinition('#/$defs/q', bundle, 'child.json')).toEqual({ type: 'string' });
  });

  it('resolves the scope of a shared schema object from the $ref target, not by object identity', () => {
    const shared: RJSFSchema = { $id: 'shared.json', properties: { v: { $ref: 'z.json' } } };
    const root: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      $defs: {
        a: { $id: 'a/', $defs: { z: { $id: 'z.json', type: 'number' }, shared } },
        b: { $id: 'b/', $defs: { z: { $id: 'z.json', type: 'string' }, shared } },
      },
    };
    const resolved = retrieveSchema({ validator: testValidator }, { $ref: 'https://example.com/b/shared.json' }, root);
    expect(resolved.properties!.v).toMatchObject({ $id: 'z.json', type: 'string' });
  });

  it('resolves refs inside a sub-resource reached by a pointer with a fragment', () => {
    const root: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      $defs: {
        c: { $id: 'sub/c.json', $defs: { q: { type: 'string' } }, $ref: '#/$defs/q' },
      },
    };
    // The found sub-resource carries sibling keys next to its $ref, so the chain resolves into an allOf
    // wrapper whose second entry is the inner definition resolved in the sub-resource's own scope
    expect(findSchemaDefinition('https://example.com/root.json#/$defs/c', root)).toEqual({
      allOf: [{ $id: 'sub/c.json', $defs: { q: { type: 'string' } } }, { type: 'string' }],
    });
  });

  it('resolves refs inside a sub-resource via findSchemaDefinitionRecursive', () => {
    const root: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      $defs: {
        c: { $id: 'sub/c.json', $defs: { q: { type: 'string' } }, $ref: '#/$defs/q' },
      },
    };
    expect(findSchemaDefinitionRecursive('https://example.com/root.json#/$defs/c', root)).toEqual({
      allOf: [{ $id: 'sub/c.json', $defs: { q: { type: 'string' } } }, { type: 'string' }],
    });
  });

  // Characterization: root-relative nested $ids (v7 spelling) no longer resolve - the nested $id is
  // now resolved against its parent scope, per spec. This is the documented breaking change.
  it('throws for nested $ids written relative to the bundle root (breaking change)', () => {
    const root: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'relative/schema.json',
      $defs: {
        embedded: { $id: 'relative/embedded.json', type: 'object' },
      },
    };
    expect(() => findSchemaDefinition('embedded.json', root)).toThrow('Could not find a definition');
  });

  // Characterization: makeAllReferencesAbsolute resolves nested $ids against their parent for every
  // draft, so draft-7 bundles get fully-qualified rewrites too.
  it('rewrites draft-7 refs against the resolved nested scope', () => {
    const root: RJSFSchema = {
      definitions: {
        a: {
          $id: 'http://ex.com/a/',
          definitions: {
            b: { $id: 'b.json', $ref: '#/definitions/q' },
          },
        },
        q: { type: 'string' },
      },
    };
    const out = makeAllReferencesAbsolute(root, '');
    expect((out.definitions!.a as RJSFSchema).definitions!.b).toEqual({
      $id: 'b.json',
      $ref: 'http://ex.com/a/b.json#/definitions/q',
    });
  });
});
