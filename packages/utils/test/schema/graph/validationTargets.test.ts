import type { RJSFSchema, SchemaContext } from '../../../src/index.ts';
import parseSchemaGraph from '../../../src/schema/graph/parseSchemaGraph.ts';
import type { SchemaGraph } from '../../../src/schema/graph/parseSchemaGraph.ts';
import {
  declaredPropertyTarget,
  dependencyCondition,
  holdsDeclaredKey,
  pointerTo,
  scoringTarget,
  targetOf,
  validationTargets,
  withVariantId,
} from '../../../src/schema/graph/validationTargets.ts';
import getTestValidator from '../../testUtils/getTestValidator.ts';

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
  it('leaves the characters a fragment may hold as they are, and percent-encodes the rest', () => {
    const root: RJSFSchema = { $defs: { 'a$b:c@d+e#f g%h': {} } };
    const graph = parseSchemaGraph(root);
    expect(pointerTo(graph, nodeAt(graph, '/$defs/a$b:c@d+e#f g%h'))).toEqual({
      $ref: '#/$defs/a$b:c@d+e%23f%20g%25h',
    });
  });
  it('leaves a lone surrogate, which has no URI encoding, as it is beside the characters it encodes', () => {
    const root: RJSFSchema = { properties: { 'a\uD800 \uD83D\uDE00\uDC00': {} } };
    const graph = parseSchemaGraph(root);
    expect(pointerTo(graph, nodeAt(graph, '/properties/a\uD800 \uD83D\uDE00\uDC00'))).toEqual({
      $ref: '#/properties/a\uD800%20%F0%9F%98%80\uDC00',
    });
  });
  it('escapes a # that ends the pointer, which Ajv would drop as an empty fragment', () => {
    const root: RJSFSchema = { properties: { 'Phone #': {} } };
    const graph = parseSchemaGraph(root);
    expect(pointerTo(graph, nodeAt(graph, '/properties/Phone #'))).toEqual({ $ref: '#/properties/Phone%20%23' });
  });
  it('hands a boolean subschema over as the schema it stands for, which ata reads as true behind a $ref', () => {
    const root: RJSFSchema = { anyOf: [false, true] };
    const graph = parseSchemaGraph(root);
    expect(pointerTo(graph, nodeAt(graph, '/anyOf/0'))).toBeUndefined();
    expect(targetOf(graph, nodeAt(graph, '/anyOf/0'))).toEqual({ not: {} });
    expect(targetOf(graph, nodeAt(graph, '/anyOf/1'))).toEqual({});
  });
  it('names nothing for a schema parsed from outside the root, which is validated as it stands', () => {
    const root: RJSFSchema = { properties: {} };
    const graph = parseSchemaGraph(root);
    const outside: RJSFSchema = { type: 'number' };
    const { graph: overlay, node } = graph.adopt(outside);
    expect(pointerTo(overlay, node)).toBeUndefined();
    expect(targetOf(overlay, node)).toBe(outside);
  });
  it('names an option and an if where the root holds them as one, though it holds the objects first elsewhere', () => {
    const option: RJSFSchema = { type: 'string' };
    const condition: RJSFSchema = { required: ['a'] };
    const root: RJSFSchema = { properties: { a: option, c: condition }, anyOf: [option], if: condition };
    const graph = parseSchemaGraph(root);
    expect(pointerTo(graph, nodeAt(graph, '/properties/a'))).toEqual({ $ref: '#/anyOf/0' });
    expect(pointerTo(graph, nodeAt(graph, '/properties/c'))).toEqual({ $ref: '#/if' });
    expect(validationTargets(graph)).toEqual(expect.arrayContaining([{ $ref: '#/anyOf/0' }, { $ref: '#/if' }]));
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
      properties: { a: { $ref: '#/oneOf/0/properties/a' } },
      if: { $ref: '#/oneOf/0/if' },
      then: {},
      else: {},
      dependencies: { e: { title: 'e' } },
    });
  });
  it('keeps a boolean allOf entry and a $ref that resolves to nothing as they stand', () => {
    const schema: RJSFSchema = {
      oneOf: [{ $ref: '#/definitions/missing', allOf: [true], properties: {}, required: ['a'] }],
    };
    expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/definitions/missing', allOf: [true], properties: {} });
  });
  it('reads a $ref to a boolean schema as what the boolean says', () => {
    const schema: RJSFSchema = {
      definitions: { never: false },
      oneOf: [{ $ref: '#/definitions/never', properties: { a: {} }, required: ['a'] }],
    };
    expect(scored(schema, '/oneOf/0')).toEqual({
      properties: { a: { $ref: '#/oneOf/0/properties/a' } },
      allOf: [{ not: {} }],
    });
  });
  it('names a subschema it reaches again through its own $ref rather than copying it without end', () => {
    const schema: RJSFSchema = { oneOf: [{ allOf: [{ $ref: '#/oneOf/0' }], properties: {}, required: ['a'] }] };
    expect(scored(schema, '/oneOf/0')).toEqual({ allOf: [{ allOf: [{ $ref: '#/oneOf/0' }] }], properties: {} });
  });
  it('relaxes an additionalProperties: false only when asked to', () => {
    const schema: RJSFSchema = { anyOf: [{ properties: { a: {} }, additionalProperties: false }] };
    expect(scored(schema, '/anyOf/0')).toEqual({ $ref: '#/anyOf/0' });
    expect(scored(schema, '/anyOf/0', true)).toEqual({
      properties: { a: { $ref: '#/anyOf/0/properties/a' } },
      additionalProperties: true,
    });
  });
  it('scores a boolean option by what it stands for', () => {
    expect(scored({ anyOf: [true] }, '/anyOf/0')).toEqual({});
  });
  it('keeps the required of an option whose scope declares no properties, which it is chosen by', () => {
    const schema: RJSFSchema = {
      properties: { email: {} },
      oneOf: [
        { required: ['email'], dependencies: { email: ['phone'] } },
        { title: 'By email', required: ['email'] },
      ],
    };
    expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    expect(scored(schema, '/oneOf/1', true)).toEqual({ $ref: '#/oneOf/1' });
    const strict: RJSFSchema = {
      oneOf: [{ required: ['email'], dependencies: { a: ['b'] }, additionalProperties: false }],
    };
    expect(scored(strict, '/oneOf/0', true)).toEqual({
      required: ['email'],
      dependencies: { a: ['b'] },
      additionalProperties: true,
    });
  });
  it('names the subschemas below a copy where they sit in the root and drops its $id, which would rebase their $refs', () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          $id: 'http://e.com/A.json',
          definitions: { s: { const: 'a' } },
          properties: { kind: { $ref: '#/definitions/s' } },
          required: ['kind'],
        },
      ],
    };
    expect(scored(schema, '/oneOf/0')).toEqual({
      definitions: { s: { $ref: '#/oneOf/0/definitions/s' } },
      properties: { kind: { $ref: '#/oneOf/0/properties/kind' } },
    });
  });
  it('names the subschemas below an option the root holds first as a property at the place it is an option', () => {
    const text: RJSFSchema = { type: 'string' };
    const option: RJSFSchema = { properties: { email: text }, required: ['email'] };
    const schema: RJSFSchema = { properties: { name: text, primary: option }, oneOf: [option] };
    expect(scored(schema, '/properties/primary')).toEqual({
      properties: { email: { $ref: '#/oneOf/0/properties/email' } },
    });
  });
  it('names the subschemas behind a $ref at the place it names, where the root holds the target first elsewhere', () => {
    const base: RJSFSchema = { properties: { id: { type: 'string' } } };
    const schema: RJSFSchema = {
      properties: { b: base },
      definitions: { Base: base },
      oneOf: [{ $ref: '#/definitions/Base', required: ['id'] }],
    };
    expect(scored(schema, '/oneOf/0')).toEqual({
      allOf: [{ properties: { id: { $ref: '#/definitions/Base/properties/id' } } }],
    });
  });
  it('names an allOf entry holding the option itself at its place rather than copying it without end', () => {
    const option: RJSFSchema = { properties: { x: {} }, required: ['x'] };
    option.allOf = [option];
    expect(scored({ oneOf: [option] }, '/oneOf/0')).toEqual({
      properties: { x: { $ref: '#/oneOf/0/properties/x' } },
      allOf: [{ $ref: '#/oneOf/0/allOf/0' }],
    });
  });
});

describe('declaredPropertyTarget()', () => {
  it('checks the value against every declaration that applies whatever the data', () => {
    const root: RJSFSchema = {
      definitions: { Base: { properties: { kind: { type: 'string' } } } },
      discriminator: { propertyName: 'kind' },
      oneOf: [{ allOf: [{ $ref: '#/definitions/Base' }, { properties: { kind: { const: 'a' } } }] }],
    };
    const graph = parseSchemaGraph(root);
    const target = declaredPropertyTarget(graph, nodeAt(graph, '/oneOf/0'), 'kind');
    expect(target).toEqual({
      allOf: [{ $ref: '#/definitions/Base/properties/kind' }, { $ref: '#/oneOf/0/allOf/1/properties/kind' }],
    });
    expect(validationTargets(graph)).toContainEqual(target);
  });
  it('checks the value against each place of a declaration the scope holds twice, as against two copies of it', () => {
    const kind: RJSFSchema = { properties: { kind: { type: 'string' } } };
    const root: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf: [{ allOf: [kind, kind] }] };
    const graph = parseSchemaGraph(root);
    expect(declaredPropertyTarget(graph, nodeAt(graph, '/oneOf/0'), 'kind')).toEqual({
      allOf: [{ $ref: '#/oneOf/0/allOf/0/properties/kind' }, { $ref: '#/oneOf/0/allOf/1/properties/kind' }],
    });
  });
  it('reads only the first declaration of a then or an else, which apply to different data', () => {
    const root: RJSFSchema = {
      oneOf: [
        { if: {}, then: { properties: { kind: { const: 'a' } } }, else: { properties: { kind: { const: 'b' } } } },
      ],
    };
    const graph = parseSchemaGraph(root);
    expect(declaredPropertyTarget(graph, nodeAt(graph, '/oneOf/0'), 'kind')).toEqual({
      $ref: '#/oneOf/0/then/properties/kind',
    });
  });
});

describe('dependencyCondition()', () => {
  it('names an option where the root holds it as an option of that dependency, though it holds it first elsewhere', () => {
    const work: RJSFSchema = { properties: { kind: { enum: ['work'] } } };
    const root: RJSFSchema = {
      properties: { kind: { type: 'string' }, sample: { oneOf: [work] } },
      dependencies: { kind: { oneOf: [{ properties: { kind: { enum: ['home'] } } }, work] } },
    };
    const graph = parseSchemaGraph(root);
    const condition = dependencyCondition(graph, nodeAt(graph, '/properties/sample/oneOf/0'), 'kind');
    expect(condition).toEqual({
      type: 'object',
      properties: { kind: { $ref: '#/dependencies/kind/oneOf/1/properties/kind' } },
    });
    expect(validationTargets(graph)).toContainEqual(condition);
  });
});

describe('holdsDeclaredKey()', () => {
  const context: SchemaContext = { validator: getTestValidator({}) };
  const schema: RJSFSchema = {
    oneOf: [{ properties: { id: {} }, patternProperties: { '^s_': {} } }, { properties: { id: {} } }],
  };
  const graph = parseSchemaGraph(schema);
  it('counts a key one of the option patterns matches', () => {
    expect(holdsDeclaredKey(context, graph, nodeAt(graph, '/oneOf/0'), { s_x: 1 })).toBe(true);
    expect(holdsDeclaredKey(context, graph, nodeAt(graph, '/oneOf/1'), { s_x: 1 })).toBe(false);
  });
  it('does not ask a value that is not an object', () => {
    expect(holdsDeclaredKey(context, graph, nodeAt(graph, '/oneOf/1'), 'text')).toBe(true);
  });
  it('counts no key by a pattern no flag compiles, beside the keys the option names and patterns that compile', () => {
    const invalid: RJSFSchema = { oneOf: [{ properties: { a: {} }, patternProperties: { '(?<x': {}, '^s_': {} } }] };
    const invalidGraph = parseSchemaGraph(invalid);
    expect(holdsDeclaredKey(context, invalidGraph, nodeAt(invalidGraph, '/oneOf/0'), { a: 1 })).toBe(true);
    expect(holdsDeclaredKey(context, invalidGraph, nodeAt(invalidGraph, '/oneOf/0'), { s_x: 1 })).toBe(true);
    expect(holdsDeclaredKey(context, invalidGraph, nodeAt(invalidGraph, '/oneOf/0'), { b: 1 })).toBe(false);
  });
  it('matches an option whose properties name nothing only where it takes extra keys, as the context reads it', () => {
    const empty: RJSFSchema = { oneOf: [{ type: 'object', properties: {} }] };
    const emptyGraph = parseSchemaGraph(empty);
    const id = nodeAt(emptyGraph, '/oneOf/0');
    expect(holdsDeclaredKey(context, emptyGraph, id, { a: 1 })).toBe(false);
    expect(holdsDeclaredKey({ ...context, additionalPropertiesWhenAbsent: 'allow' }, emptyGraph, id, { a: 1 })).toBe(
      true,
    );
  });
});

describe('validationTargets()', () => {
  it('lists {}, the schema SchemaField retrieves a boolean option as, beside what the option stands for', () => {
    const schema: RJSFSchema = { properties: { a: { anyOf: [false, {}] } } };
    const targets = validationTargets(parseSchemaGraph(schema));
    expect(targets).toContainEqual({ not: {} });
    expect(targets).toContainEqual({});
  });
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

describe('validationTargets() of a root sharing objects', () => {
  /** The targets listed for the root, but the root itself */
  const listed = (root: RJSFSchema) => validationTargets(parseSchemaGraph(root)).slice(1);
  it('lists an object the root holds in two places at each, as it lists two equal copies of it', () => {
    const contact = (): RJSFSchema => ({
      properties: { kind: { type: 'string' } },
      oneOf: [{ properties: { email: { type: 'string' } }, required: ['email'] }],
      if: { required: ['kind'] },
    });
    const shared = contact();
    const sharing = listed({ properties: { home: shared, work: shared } });
    expect(sharing).toEqual(listed({ properties: { home: contact(), work: contact() } }));
    expect(sharing).toEqual(
      expect.arrayContaining([{ $ref: '#/properties/home/if' }, { $ref: '#/properties/work/if' }]),
    );
  });
  it('lists the places of a root holding itself through its own objects up to where one recurs, whichever it shares', () => {
    const looping = (): RJSFSchema => {
      const node: RJSFSchema = {
        type: 'object',
        oneOf: [{ properties: { a: { type: 'string' } }, required: ['a'] }, { properties: { b: { type: 'string' } } }],
      };
      node.properties = { next: node };
      return node;
    };
    const shared = looping();
    const sharing: RJSFSchema = { properties: { x: shared, y: shared } };
    const separate: RJSFSchema = { properties: { x: looping(), y: looping() } };
    expect(listed(sharing)).toEqual(listed(separate));
    const graph = parseSchemaGraph(separate);
    expect(listed(sharing)).toContainEqual(scoringTarget(graph, nodeAt(graph, '/properties/y/oneOf/0'), false));
    expect(listed(sharing)).not.toContainEqual({ $ref: '#/properties/x/properties/next/oneOf/0' });
  });
  it('lists the subschemas below the place a $ref names under a keyword no walk follows', () => {
    const root: RJSFSchema = {
      $ref: '#/components/schemas/Pet',
      components: { schemas: { Pet: { oneOf: [{ type: 'string' }] } } },
    };
    expect(listed(root)).toContainEqual({ $ref: '#/components/schemas/Pet/oneOf/0' });
  });
});

describe('withVariantId()', () => {
  it('returns a schema without an $id as it is', () => {
    const schema: RJSFSchema = { type: 'object' };
    expect(withVariantId(schema)).toBe(schema);
  });
  it('derives the $id from its own, leaving out the empty fragment the newer drafts reject in it', () => {
    const derived = withVariantId({ $id: 'http://e.com/a.json#', type: 'object' });
    expect(derived.$id).toMatch(/^http:\/\/e\.com\/a\.json\?rjsf=[^#?]+$/);
    expect(derived.type).toBe('object');
  });
  it('replaces the suffix of a derived $id rather than adding another', () => {
    const derived = withVariantId({ $id: 'http://e.com/a.json', type: 'object' });
    expect(derived.$id).toMatch(/^http:\/\/e\.com\/a\.json\?rjsf=[^#?]+$/);
    expect(withVariantId(derived).$id).toBe(derived.$id);
  });
});
