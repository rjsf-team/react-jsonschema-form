import { JSON_SCHEMA_DRAFT_2019_09, JSON_SCHEMA_DRAFT_2020_12 } from '../../../src/index.ts';
import type { RJSFSchema } from '../../../src/index.ts';
import parseSchemaGraph, { EXTERNAL_POINTER } from '../../../src/schema/graph/parseSchemaGraph.ts';
import type { NodeId, ObjectNode, SchemaGraph, SchemaNode } from '../../../src/schema/graph/parseSchemaGraph.ts';
import looseSchema from './looseSchema.ts';

function objectNode(graph: SchemaGraph, id: NodeId | undefined): ObjectNode {
  expect(id).toBeDefined();
  const node: SchemaNode = graph.node(id ?? -1);
  if (node.kind !== 'schema') {
    throw new Error(`node ${id} is a ${node.kind} node`);
  }
  return node;
}

function at(graph: SchemaGraph, pointer: string): ObjectNode {
  return objectNode(graph, graph.byPointer(pointer));
}

/** The node a `$ref`-holding node at `pointer` resolves to */
function target(graph: SchemaGraph, pointer: string): SchemaNode {
  const { ref } = at(graph, pointer);
  expect(ref).toBeDefined();
  return graph.node(ref ?? -1);
}

describe('parseSchemaGraph()', () => {
  describe('nodes and edges', () => {
    const schema = looseSchema({
      $id: 'literal-id',
      type: 'object',
      properties: { a: { type: 'string' }, b: true, c: 5 },
      patternProperties: { '^x': { type: 'number' } },
      additionalProperties: false,
      dependencies: { a: ['b', 7], b: { properties: { d: { type: 'string' } } }, c: 3 },
      allOf: [{ title: 'one' }, 'two', false],
      anyOf: [{ title: 'any' }],
      oneOf: [{ title: 'one of' }],
      if: true,
      then: { title: 'then' },
      else: false,
      not: { type: 'null' },
      discriminator: { propertyName: 'kind' },
      definitions: { tuple: { items: [{ type: 'string' }, true], additionalItems: { type: 'number' } } },
      $defs: { list: { prefixItems: [{ type: 'string' }], items: { type: 'number' } } },
    });
    const graph = parseSchemaGraph(schema);
    const root = objectNode(graph, graph.root);

    it('parses the root as node 0 at the empty pointer', () => {
      expect(graph.root).toBe(0);
      expect(root.pointer).toBe('');
      expect(root.raw).toBe(schema);
      expect(root.pureRef).toBe(false);
    });
    const pointers = (entries: [string, NodeId][]) => entries.map(([key, id]) => [key, graph.node(id).pointer]);
    const childAt = (keyword: string, key?: string) => graph.node(graph.child(root.id, keyword, key) ?? -1);
    it('looks up the node each subschema-valued keyword holds, and none for values that are not subschemas', () => {
      expect(pointers(graph.subschemas(root.id, 'properties'))).toEqual([
        ['a', '/properties/a'],
        ['b', '/properties/b'],
      ]);
      expect(childAt('properties', 'b')).toMatchObject({ kind: 'boolean', value: true });
      expect(graph.child(root.id, 'properties', 'c')).toBeUndefined();
      expect(pointers(graph.subschemas(root.id, 'patternProperties'))).toEqual([['^x', '/patternProperties/^x']]);
      expect(childAt('additionalProperties')).toMatchObject({ kind: 'boolean', value: false });
      expect(pointers(graph.subschemas(root.id, 'allOf'))).toEqual([
        ['0', '/allOf/0'],
        ['2', '/allOf/2'],
      ]);
      expect(pointers(graph.subschemas(root.id, 'anyOf'))).toEqual([['0', '/anyOf/0']]);
      expect(pointers(graph.subschemas(root.id, 'oneOf'))).toEqual([['0', '/oneOf/0']]);
      expect(childAt('if')).toMatchObject({ kind: 'boolean', value: true });
      expect(childAt('then').pointer).toBe('/then');
      expect(childAt('else')).toMatchObject({ kind: 'boolean', value: false });
      expect(childAt('not').pointer).toBe('/not');
      expect(graph.subschemas(root.id, 'then')).toEqual([]);
    });
    it('looks up a schema dependency, and none for a list of names', () => {
      expect(pointers(graph.subschemas(root.id, 'dependencies'))).toEqual([['b', '/dependencies/b']]);
      expect(graph.child(root.id, 'dependencies', 'a')).toBeUndefined();
    });
    it('looks up the tuple form of items, and prefixItems', () => {
      const tuple = at(graph, '/definitions/tuple');
      expect(graph.subschemas(tuple.id, 'items').map(([, id]) => graph.node(id).pointer)).toEqual([
        '/definitions/tuple/items/0',
        '/definitions/tuple/items/1',
      ]);
      expect(graph.child(tuple.id, 'items')).toBeUndefined();
      expect(graph.node(graph.child(tuple.id, 'additionalItems') ?? -1).pointer).toBe(
        '/definitions/tuple/additionalItems',
      );
      const list = at(graph, '/$defs/list');
      expect(graph.subschemas(list.id, 'prefixItems').map(([, id]) => graph.node(id).pointer)).toEqual([
        '/$defs/list/prefixItems/0',
      ]);
      expect(graph.node(graph.child(list.id, 'items') ?? -1).pointer).toBe('/$defs/list/items');
      expect(graph.child(graph.child(list.id, 'items') ?? -1, 'items')).toBeUndefined();
    });
    it('looks up nothing under keywords that hold the wrong shape of value', () => {
      const odd = parseSchemaGraph(looseSchema({ properties: [{}], allOf: { a: {} }, items: 'x' }));
      expect(odd.subschemas(odd.root, 'properties')).toEqual([]);
      expect(odd.child(odd.root, 'properties', '0')).toBeUndefined();
      expect(odd.subschemas(odd.root, 'allOf')).toEqual([]);
      expect(odd.child(odd.root, 'items')).toBeUndefined();
      expect(odd.subschemas(odd.root, 'title')).toEqual([]);
      const flag = graph.child(root.id, 'properties', 'b') ?? -1;
      expect(graph.child(flag, 'items')).toBeUndefined();
      expect(graph.subschemas(flag, 'allOf')).toEqual([]);
    });
    it('finds nodes by object and by pointer, and nothing for what was not parsed', () => {
      expect(graph.byObject(schema)).toBe(graph.root);
      expect(graph.byObject({})).toBeUndefined();
      expect(graph.byPointer('/nowhere')).toBeUndefined();
    });
    it('throws for an id with no node', () => {
      expect(() => graph.node(10_000)).toThrow('No node 10000 in this schema graph');
      expect(() => graph.node(-1)).toThrow('No node -1 in this schema graph');
    });
  });

  describe('identity', () => {
    it('parses a root once', () => {
      const schema: RJSFSchema = { type: 'string' };
      expect(parseSchemaGraph(schema)).toBe(parseSchemaGraph(schema));
      expect(parseSchemaGraph({ type: 'string' })).not.toBe(parseSchemaGraph(schema));
    });
    it('gives an object used in two places one node, found at either pointer', () => {
      const shared: RJSFSchema = { type: 'string' };
      const graph = parseSchemaGraph({ properties: { a: shared, b: shared } });
      expect(graph.byPointer('/properties/a')).toBe(graph.byPointer('/properties/b'));
      expect(graph.node(graph.byObject(shared) ?? -1).pointer).toBe('/properties/a');
    });
    it('gives an object reached in two resources a node per resource, its $ref resolved in each', () => {
      const shared: RJSFSchema = { $ref: '#/$defs/t' };
      const graph = parseSchemaGraph({
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: 'https://example.com/root.json',
        $defs: {
          A: { $id: 'a.json', $defs: { t: { type: 'string' } }, properties: { p: shared } },
          B: { $id: 'b.json', $defs: { t: { type: 'number' } }, properties: { p: shared } },
        },
      });
      expect(target(graph, '/$defs/A/properties/p').pointer).toBe('/$defs/A/$defs/t');
      expect(target(graph, '/$defs/B/properties/p').pointer).toBe('/$defs/B/$defs/t');
      expect(graph.child(at(graph, '/$defs/B').id, 'properties', 'p')).toBe(graph.byPointer('/$defs/B/properties/p'));
      expect(graph.byObject(shared)).toBe(graph.byPointer('/$defs/A/properties/p'));
      expect(graph.byObject(shared, 'https://example.com/b.json')).toBe(graph.byPointer('/$defs/B/properties/p'));
    });
    it('parses an object that contains itself', () => {
      const looped: RJSFSchema = { type: 'object', properties: {} };
      Reflect.set(looped.properties ?? {}, 'self', looped);
      const graph = parseSchemaGraph(looped);
      expect(graph.child(graph.root, 'properties', 'self')).toBe(graph.root);
    });
    it('marks a node that is a $ref and nothing that changes it as pure', () => {
      const graph = parseSchemaGraph({
        definitions: {
          a: { type: 'string' },
          pure: { $ref: '#/definitions/a', title: 'T', description: 'D', $comment: 'c' },
          annotated: { $ref: '#/definitions/a', default: 'x', examples: ['y'], readOnly: true, deprecated: true },
          impure: { $ref: '#/definitions/a', minLength: 1 },
          rebased: { $ref: '#/definitions/a', $id: 'https://example.com/rebased.json' },
        },
      });
      expect(at(graph, '/definitions/pure').pureRef).toBe(true);
      // Annotations beside a `$ref` override the target's, which leaves it reading as its target
      expect(at(graph, '/definitions/annotated').pureRef).toBe(true);
      expect(at(graph, '/definitions/impure').pureRef).toBe(false);
      expect(at(graph, '/definitions/rebased').pureRef).toBe(false);
      expect(at(graph, '/definitions/a').pureRef).toBe(false);
    });
  });

  describe('references under a root of any dialect but draft 2020-12', () => {
    const schema = looseSchema({
      definitions: {
        A: { type: 'string' },
        'a/b~c': { type: 'number' },
        t: true,
        list: [1, 2],
        byName: { $ref: '#/definitions/A' },
        encoded: { $ref: '#/definitions/%41' },
        escaped: { $ref: '#/definitions/a~1b~0c' },
        whole: { $ref: '#' },
        boolean: { $ref: '#/definitions/t' },
        container: { $ref: '#/components/schemas/x' },
        notASchema: { $ref: '#/definitions/list' },
        missing: { $ref: '#/definitions/nothing' },
        external: { $ref: 'other.json#/definitions/A' },
        malformed: { $ref: '#/definitions/%E0%A4%A' },
        notAPointer: { $ref: '#definitions' },
        empty: { $ref: '' },
      },
      components: { schemas: { x: { type: 'boolean' } } },
    });
    const graph = parseSchemaGraph(schema);

    it('resolves a $ref to the node at its canonical location, however it is spelled', () => {
      const A = graph.byPointer('/definitions/A');
      expect(at(graph, '/definitions/byName').ref).toBe(A);
      expect(at(graph, '/definitions/encoded').ref).toBe(A);
      expect(target(graph, '/definitions/escaped').pointer).toBe('/definitions/a~1b~0c');
      expect(at(graph, '/definitions/whole').ref).toBe(graph.root);
      expect(target(graph, '/definitions/boolean')).toMatchObject({ kind: 'boolean', value: true });
    });
    it('names a draft-07 root by an $id beside its own $ref, which is the URI the root is registered under', () => {
      const root = looseSchema({
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://example.com/person.schema.json',
        $ref: '#/definitions/Person',
        definitions: { Person: { type: 'object' }, Tag: { type: 'string' } },
      });
      const rootGraph = parseSchemaGraph(root);
      const tag = rootGraph.byPointer('/definitions/Tag');
      for (const ref of ['#/definitions/Tag', 'https://example.com/person.schema.json#/definitions/Tag']) {
        const adopted = rootGraph.adopt({ $ref: ref });
        expect(objectNode(adopted.graph, adopted.node).ref).toBe(tag);
      }
    });
    it('parses a subschema a $ref names under a keyword no walk follows', () => {
      expect(target(graph, '/definitions/container')).toMatchObject({
        kind: 'schema',
        pointer: '/components/schemas/x',
      });
    });
    it.each([
      ['notASchema', '#/definitions/list'],
      ['missing', '#/definitions/nothing'],
      ['external', 'other.json#/definitions/A'],
      ['malformed', '#/definitions/%E0%A4%A'],
      ['notAPointer', '#definitions'],
      ['empty', ''],
    ])('points a $ref that resolves to nothing (%s) at an invalid node with v7 message', (name, ref) => {
      const message = `Could not find a definition for ${ref}.`;
      expect(target(graph, `/definitions/${name}`)).toEqual({
        kind: 'invalid',
        id: at(graph, `/definitions/${name}`).ref,
        pointer: `/definitions/${name}/$ref`,
        ref,
        reason: 'dangling',
        message,
      });
    });
  });

  describe('alias loops and broken chains point at the error entering them throws', () => {
    const schema: RJSFSchema = {
      definitions: {
        self: { $ref: '#/definitions/self' },
        deep: { $ref: '#/definitions/deeper' },
        deeper: { $ref: '#/definitions/deepest' },
        deepest: { $ref: '#/definitions/deep' },
        into: { $ref: '#/definitions/deep' },
        intoSelf: { $ref: '#/definitions/self', title: 'with a sibling' },
        twoA: { $ref: '#/definitions/twoB' },
        twoB: { $ref: '#/definitions/%74woA' },
        toMissing: { $ref: '#/definitions/chainToMissing' },
        chainToMissing: { $ref: '#/definitions/nothing' },
        toEmpty: { $ref: '#/definitions/emptyRef' },
        emptyRef: { $ref: '', type: 'string' },
        fine: { $ref: '#/definitions/alias' },
        alias: { $ref: '#/definitions/leaf' },
        leaf: { type: 'string' },
      },
    };
    const graph = parseSchemaGraph(schema);
    const deepLoop = (from: string, through: string[]) =>
      `Definition for #/definitions/${from} contains a circular reference through ${through.map((name) => `#/definitions/${name}`).join(' -> ')}`;
    it.each([
      ['self', 'Definition for #/definitions/self is a circular reference'],
      ['deep', deepLoop('deeper', ['deepest', 'deep', 'deeper'])],
      ['deeper', deepLoop('deepest', ['deep', 'deeper', 'deepest'])],
      ['deepest', deepLoop('deep', ['deeper', 'deepest', 'deep'])],
      ['into', deepLoop('deep', ['deeper', 'deepest', 'deep'])],
      ['intoSelf', 'Definition for #/definitions/self is a circular reference'],
      ['twoA', 'Definition for #/definitions/%74woA is a circular reference'],
      ['twoB', 'Definition for #/definitions/twoB is a circular reference'],
      ['toMissing', 'Could not find a definition for #/definitions/nothing.'],
      ['chainToMissing', 'Could not find a definition for #/definitions/nothing.'],
      ['emptyRef', 'Could not find a definition for .'],
    ])('%s', (name, message) => {
      expect(graph.node(at(graph, `/definitions/${name}`).ref ?? -1)).toMatchObject({ kind: 'invalid', message });
    });
    it.each(['toEmpty', 'fine', 'alias'])('%s resolves', (name) => {
      expect(graph.node(at(graph, `/definitions/${name}`).ref ?? -1).kind).toBe('schema');
    });
    it('records why each $ref resolves to nothing', () => {
      const invalid = [
        'self',
        'deep',
        'deeper',
        'deepest',
        'into',
        'intoSelf',
        'twoA',
        'twoB',
        'toMissing',
        'chainToMissing',
        'emptyRef',
      ].map((name) => target(graph, `/definitions/${name}`));
      expect(invalid.map((node) => (node.kind === 'invalid' ? [node.ref, node.reason] : node.kind))).toEqual([
        ['#/definitions/self', 'circular-alias'],
        ['#/definitions/deeper', 'circular-alias'],
        ['#/definitions/deepest', 'circular-alias'],
        ['#/definitions/deep', 'circular-alias'],
        ['#/definitions/deep', 'circular-alias'],
        ['#/definitions/self', 'circular-alias'],
        ['#/definitions/twoB', 'circular-alias'],
        ['#/definitions/%74woA', 'circular-alias'],
        ['#/definitions/chainToMissing', 'dangling'],
        ['#/definitions/nothing', 'dangling'],
        ['', 'dangling'],
      ]);
    });
    it('reads the messages of a self-loop and of a chain into a loop', () => {
      expect(target(graph, '/definitions/self')).toMatchObject({
        message: 'Definition for #/definitions/self is a circular reference',
      });
      expect(target(graph, '/definitions/into')).toMatchObject({
        message:
          'Definition for #/definitions/deep contains a circular reference through #/definitions/deeper -> #/definitions/deepest -> #/definitions/deep',
      });
    });
  });

  it('finds the booleans a 2020-12 $ref with keywords beside it holds through the allOf it reads as', () => {
    const graph = parseSchemaGraph({
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $defs: { base: { type: 'object' }, m: { $ref: '#/$defs/base', properties: { flag: true } } },
    });
    const m = at(graph, '/$defs/m');
    const siblings = graph.child(m.conjunction ?? -1, 'allOf', '0') ?? -1;
    expect(graph.child(siblings, 'properties', 'flag')).toBe(graph.byPointer('/$defs/m/properties/flag'));
  });

  it.each([
    JSON_SCHEMA_DRAFT_2019_09,
    JSON_SCHEMA_DRAFT_2020_12,
    `${JSON_SCHEMA_DRAFT_2019_09}#`,
    `${JSON_SCHEMA_DRAFT_2020_12}#`,
  ])('resolves an $anchor and reads a $ref beside keywords as their allOf under a %s root', ($schema) => {
    const graph = parseSchemaGraph({
      $schema,
      $defs: { a: { $anchor: 'foo', type: 'string' }, m: { $ref: '#foo', title: 'M', minLength: 1 } },
      properties: { p: { $ref: '#foo' } },
    });
    expect(target(graph, '/properties/p').pointer).toBe('/$defs/a');
    expect(at(graph, '/$defs/m').conjunction).toBeDefined();
  });
  it('records the place a $ref names, where the root first holds the subschema it resolves to elsewhere', () => {
    const shared: RJSFSchema = { $id: 'https://example.com/shared.json', $anchor: 'shared', type: 'string' };
    const graph = parseSchemaGraph({
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      properties: { first: shared },
      $defs: {
        again: shared,
        byPointer: { $ref: '#/$defs/again' },
        byId: { $ref: 'https://example.com/shared.json' },
        byAnchor: { $ref: 'https://example.com/shared.json#shared' },
        withSiblings: { $ref: '#/$defs/again', minLength: 1 },
      },
    });
    const sharedNode = graph.byPointer('/properties/first');
    expect(target(graph, '/$defs/byPointer').id).toBe(sharedNode);
    expect(at(graph, '/$defs/byPointer').refPointer).toBe('/$defs/again');
    expect(at(graph, '/$defs/byId').refPointer).toBe('/properties/first');
    expect(at(graph, '/$defs/byAnchor').refPointer).toBe('/properties/first');
    const withSiblings = at(graph, '/$defs/withSiblings');
    const reference = objectNode(graph, graph.child(withSiblings.conjunction ?? -1, 'allOf', '1'));
    expect(reference.refPointer).toBe('/$defs/again');
  });
  it('reads $anchor as no keyword under a draft-07 root', () => {
    const graph = parseSchemaGraph({
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: { a: { $anchor: 'foo', type: 'string' } },
      properties: { p: { $ref: '#foo' } },
    });
    expect(target(graph, '/properties/p')).toMatchObject({ kind: 'invalid', reason: 'dangling' });
  });

  describe('references under a draft 2020-12 root', () => {
    const child = looseSchema({
      $id: 'child.json',
      properties: { a: { $ref: '#/$defs/x' }, b: { $ref: '#leaf' }, c: { $ref: '#nowhere' } },
      $defs: { x: { type: 'string' }, y: { $anchor: 'leaf', type: 'number' } },
    });
    const schema: RJSFSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: 'https://example.com/root.json',
      $defs: {
        child,
        abs: { $ref: 'https://example.com/child.json#/$defs/x' },
        rel: { $ref: 'child.json' },
        relSlash: { $ref: 'child.json#/' },
        upper: { $ref: 'HTTPS://EXAMPLE.COM/child.json#/$defs/x' },
        unknown: { $ref: 'https://example.com/unknown.json' },
        nested: { $ref: '#/$defs/holder/$defs/inner' },
        holder: { $id: 'holder/', $defs: { inner: { properties: { z: { $ref: 'z.json' } } } } },
        z: { $id: 'holder/z.json', type: 'null' },
      },
    };

    it('resolves a relative $id against its parent base URI', () => {
      const graph = parseSchemaGraph(schema);
      expect(at(graph, '/$defs/child').baseUri).toBe('https://example.com/child.json');
      expect(target(graph, '/$defs/child/properties/a').pointer).toBe('/$defs/child/$defs/x');
    });
    it('resolves absolute, relative, case-folded and anchored references', () => {
      const graph = parseSchemaGraph(schema);
      expect(target(graph, '/$defs/abs').pointer).toBe('/$defs/child/$defs/x');
      expect(target(graph, '/$defs/rel').pointer).toBe('/$defs/child');
      expect(target(graph, '/$defs/relSlash').pointer).toBe('/$defs/child');
      expect(target(graph, '/$defs/upper').pointer).toBe('/$defs/child/$defs/x');
      expect(target(graph, '/$defs/child/properties/b').pointer).toBe('/$defs/child/$defs/y');
    });
    it('resolves a pointer through an $id it passes on the way', () => {
      const graph = parseSchemaGraph(schema);
      const inner = target(graph, '/$defs/nested');
      expect(inner).toMatchObject({ pointer: '/$defs/holder/$defs/inner' });
      expect(target(graph, '/$defs/holder/$defs/inner/properties/z').pointer).toBe('/$defs/z');
    });
    it('moves the base on an $id a pointer passes through a keyword holding one subschema, before it reaches data', () => {
      const graph = parseSchemaGraph(
        looseSchema({
          $schema: JSON_SCHEMA_DRAFT_2020_12,
          $defs: {
            a: { $id: 'a/', not: { $id: 'not.json', 'x-meta': { b: { $ref: 'z.json' } } } },
            z: { $id: 'a/z.json', type: 'null' },
            n: { $ref: '#/$defs/a/not/x-meta/b' },
          },
        }),
      );
      expect(target(graph, '/$defs/n').pointer).toBe('/$defs/a/not/x-meta/b');
      expect(target(graph, '/$defs/a/not/x-meta/b').pointer).toBe('/$defs/z');
    });
    it('takes a relative root $id as the root base once', () => {
      const relative: RJSFSchema = {
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: 'a/root.json',
        $defs: { one: { $id: 'b.json', type: 'number' }, two: { $id: 'a/b.json', type: 'string' } },
        properties: { x: { $ref: 'b.json' } },
      };
      const graph = parseSchemaGraph(relative);
      expect(at(graph, '').baseUri).toBe('a/root.json');
      expect(target(graph, '/properties/x').pointer).toBe('/$defs/one');
      const adopted = graph.adopt({ $ref: 'b.json' });
      expect(objectNode(adopted.graph, adopted.node).ref).toBe(graph.byPointer('/$defs/one'));
    });
    it('keeps an $id under a keyword that holds no subschemas from naming a resource or moving the base (#5529)', () => {
      const root: RJSFSchema = {
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: 'https://example.com/root.json',
        $defs: { real: { $id: 'n.json', type: 'boolean' }, s: { type: 'string' } },
        components: { Pet: { type: 'object', properties: { n: { $id: 'n.json', $ref: '#/$defs/s' } } } },
        properties: { pet: { $ref: '#/components/Pet' } },
      };
      const graph = parseSchemaGraph(root);
      expect(target(graph, '/properties/pet').pointer).toBe('/components/Pet');
      expect(target(graph, '/components/Pet/properties/n').pointer).toBe('/$defs/s');
      const adopted = graph.adopt({ $ref: 'n.json' });
      expect(objectNode(adopted.graph, adopted.node).ref).toBe(graph.byPointer('/$defs/real'));
    });
    it('points an unknown resource or anchor at an invalid node', () => {
      const graph = parseSchemaGraph(schema);
      expect(target(graph, '/$defs/unknown')).toMatchObject({
        kind: 'invalid',
        message: 'Could not find a definition for https://example.com/unknown.json.',
      });
      expect(target(graph, '/$defs/child/properties/c')).toMatchObject({ kind: 'invalid', reason: 'dangling' });
    });
    it('resolves a fragment-only reference against a root without $id', () => {
      const graph = parseSchemaGraph({
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $defs: { x: { type: 'string' }, y: { $ref: '#/$defs/x' }, bad: { $ref: '#%' } },
      });
      expect(target(graph, '/$defs/y').pointer).toBe('/$defs/x');
      expect(target(graph, '/$defs/bad').kind).toBe('invalid');
    });
  });

  describe('adopt()', () => {
    const schema = looseSchema({
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      $id: 'https://example.com/root.json',
      $defs: { a: { $anchor: 'anchored', type: 'string' }, broken: { $ref: '#/$defs/missing' } },
      components: { x: { type: 'number' } },
    });
    const graph = parseSchemaGraph(schema);

    it('returns the node of a schema parsed with the root', () => {
      const a = schema.$defs?.a;
      expect(typeof a === 'object' && graph.adopt(a)).toEqual({ graph, node: graph.byPointer('/$defs/a') });
    });
    it('parses a schema from outside the root into a graph extending this one, once', () => {
      const external: RJSFSchema = {
        allOf: [{ $ref: '#/$defs/a' }, { $ref: '#anchored' }, { $ref: '#/components/x' }],
      };
      const adopted = graph.adopt(external);
      expect(adopted.graph).not.toBe(graph);
      expect(adopted.graph.base).toBe(graph);
      expect(adopted.graph.root).toBe(graph.root);
      expect(adopted.graph.rawRoot).toBe(schema);
      expect(graph.adopt(external)).toBe(adopted);
      const node = objectNode(adopted.graph, adopted.node);
      expect(node.pointer).toBe(EXTERNAL_POINTER);
      const refs = adopted.graph.subschemas(node.id, 'allOf').map(([, id]) => objectNode(adopted.graph, id).ref);
      expect(refs.slice(0, 2)).toEqual([graph.byPointer('/$defs/a'), graph.byPointer('/$defs/a')]);
      expect(adopted.graph.node(refs[2] ?? -1).pointer).toBe('/components/x');
      expect(graph.byPointer('/components/x')).toBeUndefined();
      expect(adopted.graph.byPointer('/components/x')).toBe(refs[2]);
      expect(adopted.graph.byObject(schema)).toBe(graph.root);
      expect(adopted.graph.node(graph.root).pointer).toBe('');
    });
    it('parses a copy once while each copy for the same key has the keywords of the last', () => {
      const of = {};
      const keywords = { $ref: '#/$defs/a', title: 'T' };
      const adopted = graph.adoptCopy({ ...keywords }, of, graph.root);
      expect(graph.adoptCopy({ ...keywords }, of, graph.root)).toBe(adopted);
      expect(graph.adoptCopy({ ...keywords }, {}, graph.root)).not.toBe(adopted);
      const retitled = graph.adoptCopy({ ...keywords, title: 'U' }, of, graph.root);
      expect(retitled).not.toBe(adopted);
      expect(graph.adoptCopy({ ...keywords, title: 'U', description: 'D' }, of, graph.root)).not.toBe(retitled);
    });
    it('parses a copy where the node it copies sits, a boolean as a call root', () => {
      const root: RJSFSchema = {
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: 'https://example.com/root.json',
        $defs: {
          t: { type: 'string' },
          flag: true,
          A: { $id: 'a.json', $defs: { t: { type: 'number' } }, properties: { p: { $ref: '#/$defs/t' } } },
        },
      };
      const nested = parseSchemaGraph(root);
      const fromA = nested.adoptCopy(
        { $ref: '#/$defs/t', title: 'T' },
        {},
        nested.byPointer('/$defs/A/properties/p') ?? -1,
      );
      expect(objectNode(fromA.graph, fromA.node).ref).toBe(nested.byPointer('/$defs/A/$defs/t'));
      const fromFlag = nested.adoptCopy({ $ref: '#/$defs/t' }, {}, nested.byPointer('/$defs/flag') ?? -1);
      expect(objectNode(fromFlag.graph, fromFlag.node).ref).toBe(nested.byPointer('/$defs/t'));
    });
    it('follows a chain through the nodes of the graph it extends to a boolean, and to data as nothing', () => {
      const base = parseSchemaGraph(
        looseSchema({
          definitions: {
            no: false,
            toNo: { $ref: '#/definitions/no' },
            text: { type: 'string' },
            toData: { $ref: '#/definitions/text/type' },
          },
        }),
      );
      const toNo = base.adopt({ $ref: '#/definitions/toNo' });
      expect(objectNode(toNo.graph, toNo.node).ref).toBe(base.byPointer('/definitions/toNo'));
      const toData = base.adopt({ $ref: '#/definitions/toData' });
      expect(toData.graph.node(objectNode(toData.graph, toData.node).ref ?? -1)).toMatchObject({
        kind: 'invalid',
        reason: 'dangling',
        message: 'Could not find a definition for #/definitions/text/type.',
      });
    });
    it('extends an extending graph in turn', () => {
      const first = graph.adopt({ $ref: '#/$defs/a' });
      const second = first.graph.adopt({ items: { $ref: '#/$defs/broken' } });
      expect(second.graph.base).toBe(first.graph);
      const items = objectNode(second.graph, second.graph.child(second.node, 'items'));
      expect(second.graph.node(items.ref ?? -1)).toMatchObject({ kind: 'invalid', ref: '#/$defs/broken' });
    });
    it('gives a boolean of an extending graph its own node where the graph it extends has another value', () => {
      const first = graph.adopt({ items: true });
      const second = first.graph.adopt({ items: false, additionalItems: true });
      const items = second.graph.child(second.node, 'items') ?? -1;
      expect(second.graph.node(items)).toMatchObject({
        kind: 'boolean',
        value: false,
        pointer: `${EXTERNAL_POINTER}/items`,
      });
      expect(items).not.toBe(first.graph.child(first.node, 'items'));
    });
    it('finds the boolean a schema of the graph it extends holds, under the pointer it reuses', () => {
      const s1: RJSFSchema = { items: false };
      const first = graph.adopt(s1);
      const second = first.graph.adopt({ allOf: [s1], items: true });
      const s1Node = second.graph.byObject(s1) ?? -1;
      expect(s1Node).toBe(first.node);
      expect(second.graph.node(second.graph.child(s1Node, 'items') ?? -1)).toMatchObject({
        kind: 'boolean',
        value: false,
      });
      expect(second.graph.subschemas(s1Node, 'items')).toEqual([]);
      expect(second.graph.node(second.graph.child(second.node, 'items') ?? -1)).toMatchObject({
        kind: 'boolean',
        value: true,
      });
    });
    it('follows a chain into a resource of the graph it extends to the boolean that resource holds, under the pointer it reuses', () => {
      const first = graph.adopt({ $id: 'http://example.com/a', $defs: { x: false, y: { $ref: '#/$defs/x' } } });
      const own: RJSFSchema = { $ref: 'http://example.com/a#/$defs/y' };
      const second = first.graph.adopt({ $defs: { x: own } });
      const ownNode = objectNode(second.graph, second.graph.byObject(own));
      expect(ownNode.pointer).toBe(`${EXTERNAL_POINTER}/$defs/x`);
      expect(second.graph.node(ownNode.ref ?? -1)).toMatchObject({ kind: 'schema', raw: { $ref: '#/$defs/x' } });
    });
  });
});
