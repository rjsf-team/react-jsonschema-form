import type { RJSFSchema } from '../../../src/index.ts';
import parseSchemaGraph from '../../../src/schema/graph/parseSchemaGraph.ts';
import type { SchemaGraph } from '../../../src/schema/graph/parseSchemaGraph.ts';
import {
  holdsDeclaredKey,
  pointerTo,
  scoringTarget,
  targetOf,
  validationTargets,
} from '../../../src/schema/graph/validationTargets.ts';

function nodeAt(graph: SchemaGraph, pointer: string): number {
  const id = graph.byPointer(pointer);
  expect(id).toBeDefined();
  return id ?? -1;
}

function scored(schema: RJSFSchema, pointer: string, relax = false): RJSFSchema {
  const graph = parseSchemaGraph(schema);
  return scoringTarget(graph, nodeAt(graph, pointer), relax);
}

describe('pointerTo()', () => {
  it('names a node by where it sits in the root', () => {
    const root: RJSFSchema = { properties: { a: { type: 'string' } } };
    const graph = parseSchemaGraph(root);
    expect(pointerTo(graph, nodeAt(graph, '/properties/a'))).toEqual({ $ref: '#/properties/a' });
    expect(pointerTo(graph, graph.root)).toEqual({ $ref: '#' });
  });
  it('names nothing for a schema parsed from outside the root, which is validated as it stands', () => {
    const root: RJSFSchema = { properties: {} };
    const graph = parseSchemaGraph(root);
    const outside: RJSFSchema = { type: 'number' };
    const { graph: overlay, node } = graph.adopt(outside);
    expect(pointerTo(overlay, node)).toBeUndefined();
    expect(targetOf(overlay, node)).toBe(outside);
  });
  it('names nothing for a $ref that resolves to nothing', () => {
    const root: RJSFSchema = { properties: { a: { $ref: '#/definitions/missing' } } };
    const graph = parseSchemaGraph(root);
    const node = graph.node(nodeAt(graph, '/properties/a'));
    const ref = node.kind === 'schema' ? node.ref : undefined;
    expect(ref).toBeDefined();
    expect(pointerTo(graph, ref ?? -1)).toBeUndefined();
  });
  it('reads a boolean subschema with no place in the root as the schema it stands for', () => {
    const root: RJSFSchema = { properties: {} };
    const graph = parseSchemaGraph(root);
    const { graph: overlay, node } = graph.adopt({ anyOf: [false] });
    const falseOption = overlay.child(node, 'anyOf', '0');
    expect(falseOption).toBeDefined();
    expect(targetOf(overlay, falseOption ?? -1)).toEqual({ not: {} });
  });
});

describe('scoringTarget()', () => {
  it('drops the required stated by the then, else and dependencies schemas of an option, and the listed dependencies', () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          properties: { a: { type: 'string' } },
          if: { properties: { a: { const: 'x' } } },
          then: { required: ['b'] },
          else: { required: ['c'] },
          dependencies: { a: ['d'], e: { required: ['f'], title: 'e' } },
        },
      ],
    };
    expect(scored(schema, '/oneOf/0')).toEqual({
      properties: { a: { type: 'string' } },
      if: { properties: { a: { const: 'x' } } },
      then: {},
      else: {},
      dependencies: { e: { title: 'e' } },
    });
  });
  it('keeps a boolean allOf entry and a $ref that resolves to nothing as they stand', () => {
    const schema: RJSFSchema = { oneOf: [{ $ref: '#/definitions/missing', allOf: [true], required: ['a'] }] };
    expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/definitions/missing', allOf: [true] });
  });
  it('names a subschema it reaches again through its own $ref rather than copying it without end', () => {
    const schema: RJSFSchema = { oneOf: [{ allOf: [{ $ref: '#/oneOf/0' }], required: ['a'] }] };
    expect(scored(schema, '/oneOf/0')).toEqual({ allOf: [{ allOf: [{ $ref: '#/oneOf/0' }] }] });
  });
  it('relaxes an additionalProperties: false only when asked to', () => {
    const schema: RJSFSchema = { anyOf: [{ properties: { a: {} }, additionalProperties: false }] };
    expect(scored(schema, '/anyOf/0')).toEqual({ $ref: '#/anyOf/0' });
    expect(scored(schema, '/anyOf/0', true)).toEqual({ properties: { a: {} }, additionalProperties: true });
  });
  it('scores a boolean option by a pointer to it', () => {
    expect(scored({ anyOf: [true] }, '/anyOf/0')).toEqual({ $ref: '#/anyOf/0' });
  });
});

describe('holdsDeclaredKey()', () => {
  const schema: RJSFSchema = {
    oneOf: [{ properties: { id: {} }, patternProperties: { '^s_': {} } }, { properties: { id: {} } }],
  };
  const graph = parseSchemaGraph(schema);
  it('counts a key one of the option patterns matches', () => {
    expect(holdsDeclaredKey(graph, nodeAt(graph, '/oneOf/0'), { s_x: 1 })).toBe(true);
    expect(holdsDeclaredKey(graph, nodeAt(graph, '/oneOf/1'), { s_x: 1 })).toBe(false);
  });
  it('does not ask a value that is not an object', () => {
    expect(holdsDeclaredKey(graph, nodeAt(graph, '/oneOf/1'), 'text')).toBe(true);
  });
});

describe('validationTargets()', () => {
  it("leaves out a dependency's oneOf option that declares nothing under the dependency's name", () => {
    const schema: RJSFSchema = {
      properties: { a: {} },
      dependencies: { a: { oneOf: [{ properties: { b: {} } }] } },
    };
    expect(validationTargets(parseSchemaGraph(schema))).not.toContainEqual(
      expect.objectContaining({ type: 'object', properties: expect.anything() }),
    );
  });
});
