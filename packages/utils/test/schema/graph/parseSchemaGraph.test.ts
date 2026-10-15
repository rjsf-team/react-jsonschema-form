import { makeAllReferencesAbsolute } from '../../../src/findSchemaDefinition.ts';
import { findSchemaDefinition, JSON_SCHEMA_DRAFT_2020_12 } from '../../../src/index.ts';
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

function messageOf(action: () => unknown): string | undefined {
  try {
    action();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
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
      expect(root.literalId).toBe('literal-id');
      expect(root.pureRef).toBe(false);
    });
    it('parses each subschema-valued keyword into an edge, and skips values that are not subschemas', () => {
      expect([...(root.properties ?? [])].map(([name, id]) => [name, graph.node(id).pointer])).toEqual([
        ['a', '/properties/a'],
        ['b', '/properties/b'],
      ]);
      expect(graph.node(root.properties?.get('b') ?? -1)).toMatchObject({ kind: 'boolean', value: true });
      expect(root.patternProperties?.map(({ pattern, node }) => [pattern, graph.node(node).pointer])).toEqual([
        ['^x', '/patternProperties/^x'],
      ]);
      expect(graph.node(root.additionalProperties ?? -1)).toMatchObject({ kind: 'boolean', value: false });
      expect(root.allOf?.map((id) => graph.node(id).pointer)).toEqual(['/allOf/0', '/allOf/2']);
      expect(root.anyOf?.map((id) => graph.node(id).pointer)).toEqual(['/anyOf/0']);
      expect(root.oneOf?.map((id) => graph.node(id).pointer)).toEqual(['/oneOf/0']);
      expect(graph.node(root.if ?? -1)).toMatchObject({ kind: 'boolean', value: true });
      expect(graph.node(root.then ?? -1).pointer).toBe('/then');
      expect(graph.node(root.else ?? -1)).toMatchObject({ kind: 'boolean', value: false });
      expect(root.discriminator).toBe('kind');
      expect(graph.byPointer('/not')).toBeDefined();
    });
    it('normalizes array and schema dependencies', () => {
      expect([...(root.dependencies ?? [])].map(([key, edge]) => [key, edge])).toEqual([
        ['a', { required: ['b'] }],
        ['b', { schema: graph.byPointer('/dependencies/b') }],
      ]);
    });
    it('parses the tuple form of items and prefixItems into prefixItems', () => {
      const tuple = at(graph, '/definitions/tuple');
      expect(tuple.prefixItems?.map((id) => graph.node(id).pointer)).toEqual([
        '/definitions/tuple/items/0',
        '/definitions/tuple/items/1',
      ]);
      expect(graph.node(tuple.additionalItems ?? -1).pointer).toBe('/definitions/tuple/additionalItems');
      const list = at(graph, '/$defs/list');
      expect(list.prefixItems?.map((id) => graph.node(id).pointer)).toEqual(['/$defs/list/prefixItems/0']);
      expect(graph.node(list.items ?? -1).pointer).toBe('/$defs/list/items');
    });
    it('leaves keywords that hold the wrong shape of value without an edge', () => {
      const odd = parseSchemaGraph(
        looseSchema({
          properties: [],
          allOf: { a: {} },
          items: 'x',
          discriminator: { propertyName: 1 },
        }),
      );
      expect(objectNode(odd, odd.root)).not.toHaveProperty('properties');
      expect(objectNode(odd, odd.root)).not.toHaveProperty('allOf');
      expect(objectNode(odd, odd.root)).not.toHaveProperty('items');
      expect(objectNode(odd, odd.root)).not.toHaveProperty('discriminator');
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
    it('records no diagnostics for a schema without references', () => {
      expect(graph.diagnostics).toEqual([]);
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
    it('parses an object that contains itself', () => {
      const looped: RJSFSchema = { type: 'object', properties: {} };
      Reflect.set(looped.properties ?? {}, 'self', looped);
      const graph = parseSchemaGraph(looped);
      expect(objectNode(graph, graph.root).properties?.get('self')).toBe(graph.root);
    });
    it('marks a node that is a $ref and nothing that changes it as pure', () => {
      const graph = parseSchemaGraph({
        definitions: {
          a: { type: 'string' },
          pure: { $ref: '#/definitions/a', title: 'T', description: 'D', $comment: 'c' },
          impure: { $ref: '#/definitions/a', default: 'x' },
        },
      });
      expect(at(graph, '/definitions/pure').pureRef).toBe(true);
      expect(at(graph, '/definitions/impure').pureRef).toBe(false);
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
      expect(graph.diagnostics).toContainEqual({
        node: graph.byPointer(`/definitions/${name}`),
        ref,
        reason: 'dangling',
        message,
      });
    });
  });

  describe('alias loops and broken chains throw what findSchemaDefinition() throws', () => {
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
    const names = Object.keys(schema.definitions ?? {}).filter((name) => name !== 'leaf');

    it.each(names)('%s', (name) => {
      const ref = `#/definitions/${name}`;
      const node = at(graph, `/definitions/${name}`);
      const own = typeof node.raw.$ref === 'string' ? node.raw.$ref : '';
      const thrown = messageOf(() => findSchemaDefinition(own, schema));
      const resolved = graph.node(node.ref ?? -1);
      if (thrown === undefined) {
        expect(resolved.kind).not.toBe('invalid');
      } else {
        expect(resolved).toMatchObject({ kind: 'invalid', message: thrown });
      }
      expect(ref).toContain(name);
    });
    it('records a diagnostic per $ref', () => {
      expect(graph.diagnostics.map(({ ref, reason }) => [ref, reason])).toEqual([
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
    it('reads the messages of the loops findSchemaDefinition.test.ts pins', () => {
      expect(target(graph, '/definitions/self')).toMatchObject({
        message: 'Definition for #/definitions/self is a circular reference',
      });
      expect(target(graph, '/definitions/into')).toMatchObject({
        message:
          'Definition for #/definitions/deep contains a circular reference through #/definitions/deeper -> #/definitions/deepest -> #/definitions/deep',
      });
    });
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

    it('resolves a relative $id against its parent base URI (#5467)', () => {
      const graph = parseSchemaGraph(schema);
      expect(at(graph, '/$defs/child').baseUri).toBe('https://example.com/child.json');
      expect(target(graph, '/$defs/child/properties/a').pointer).toBe('/$defs/child/$defs/x');
    });
    it('resolves the copy makeAllReferencesAbsolute() makes of the root the same way', () => {
      const absolute = makeAllReferencesAbsolute(schema, schema.$id ?? '#');
      const graph = parseSchemaGraph(absolute);
      expect(target(graph, '/$defs/child/properties/a').pointer).toBe('/$defs/child/$defs/x');
      expect(target(graph, '/$defs/child/properties/b').pointer).toBe('/$defs/child/$defs/y');
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

  describe('resolveRef()', () => {
    const schema: RJSFSchema = {
      definitions: { a: { type: 'string' }, t: false },
      unreferenced: { x: { type: 'number' } },
      properties: { p: { $ref: '#/definitions/a' } },
    };
    const graph = parseSchemaGraph(schema);

    it('resolves a ui:definitions key to the node it names', () => {
      expect(graph.resolveRef('#/definitions/a')).toBe(graph.byPointer('/definitions/a'));
      expect(graph.resolveRef('#/definitions/t')).toBe(graph.byPointer('/definitions/t'));
    });
    it('finds nothing at a location no walk or $ref parsed', () => {
      expect(graph.resolveRef('#/unreferenced/x')).toBeUndefined();
      expect(graph.resolveRef('#/definitions/missing')).toBeUndefined();
      expect(graph.resolveRef('#/definitions/a/type')).toBeUndefined();
    });
    it('resolves from a boolean node against the root base under draft 2020-12', () => {
      const scoped = parseSchemaGraph({
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: 'https://example.com/r.json',
        $defs: { t: true, s: { type: 'string' } },
      });
      expect(scoped.resolveRef('#/$defs/s', scoped.byPointer('/$defs/t'))).toBe(scoped.byPointer('/$defs/s'));
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
      const refs = (node.allOf ?? []).map((id) => objectNode(adopted.graph, id).ref);
      expect(refs.slice(0, 2)).toEqual([graph.byPointer('/$defs/a'), graph.byPointer('/$defs/a')]);
      expect(adopted.graph.node(refs[2] ?? -1).pointer).toBe('/components/x');
      expect(graph.byPointer('/components/x')).toBeUndefined();
      expect(adopted.graph.byPointer('/components/x')).toBe(refs[2]);
      expect(adopted.graph.byObject(schema)).toBe(graph.root);
      expect(adopted.graph.node(graph.root).pointer).toBe('');
      expect(adopted.graph.diagnostics).toEqual(graph.diagnostics);
    });
    it('parses a copy once while each copy for the same key has the keywords of the last', () => {
      const of = {};
      const keywords = { $ref: '#/$defs/a', title: 'T' };
      const adopted = graph.adoptCopy({ ...keywords }, of);
      expect(graph.adoptCopy({ ...keywords }, of)).toBe(adopted);
      expect(graph.adoptCopy({ ...keywords }, {})).not.toBe(adopted);
      const retitled = graph.adoptCopy({ ...keywords, title: 'U' }, of);
      expect(retitled).not.toBe(adopted);
      expect(graph.adoptCopy({ ...keywords, title: 'U', description: 'D' }, of)).not.toBe(retitled);
    });
    it('extends an extending graph in turn', () => {
      const first = graph.adopt({ $ref: '#/$defs/a' });
      const second = first.graph.adopt({ items: { $ref: '#/$defs/broken' } });
      expect(second.graph.base).toBe(first.graph);
      const items = objectNode(second.graph, objectNode(second.graph, second.node).items);
      expect(second.graph.node(items.ref ?? -1)).toMatchObject({ kind: 'invalid', ref: '#/$defs/broken' });
      expect(second.graph.diagnostics).toHaveLength(graph.diagnostics.length + 1);
    });
    it('gives a boolean of an extending graph its own node where the graph it extends has another value', () => {
      const first = graph.adopt({ items: true });
      const second = first.graph.adopt({ items: false, additionalItems: true });
      const items = objectNode(second.graph, second.node).items ?? -1;
      expect(second.graph.node(items)).toMatchObject({
        kind: 'boolean',
        value: false,
        pointer: `${EXTERNAL_POINTER}/items`,
      });
      expect(items).not.toBe(objectNode(first.graph, first.node).items);
    });
  });
});
