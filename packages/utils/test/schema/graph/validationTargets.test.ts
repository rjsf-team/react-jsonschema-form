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
  describe('a part of the data that leads to a recursive choice (#4990)', () => {
    /** A choice two of whose options take objects and hold the choice again in the same property */
    const NESTED: RJSFSchema = {
      anyOf: [
        { type: 'object', properties: { child: { $ref: '#/definitions/Choice' }, a: { type: 'string' } } },
        { type: 'object', properties: { child: { $ref: '#/definitions/Choice' }, b: { type: 'number' } } },
      ],
    };
    it('reads a property holding a oneOf as the types its options take, which the field below matches on its own', () => {
      const schema: RJSFSchema = {
        definitions: {
          A: {
            type: 'object',
            properties: {
              child: { oneOf: [{ type: 'null' }, { $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] },
            },
          },
          B: {
            type: 'object',
            properties: {
              child: { oneOf: [{ type: 'null' }, { $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] },
            },
          },
        },
        oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        allOf: [{ type: 'object', properties: { child: { type: ['null', 'object'] } } }],
      });
    });
    it('reads a part recurring with the choice as its types, and copies one leading to it through a $ref, an allOf, a then or a property', () => {
      const schema: RJSFSchema = {
        definitions: { Choice: NESTED },
        oneOf: [
          {
            properties: {
              viaRef: { $ref: '#/definitions/Choice' },
              viaAllOf: { allOf: [{ $ref: '#/definitions/Choice' }] },
              nested: {
                type: 'object',
                properties: { deep: { $ref: '#/definitions/Choice' } },
                allOf: [{ required: ['deep'] }],
              },
              conditional: { if: { $ref: '#/definitions/Choice' }, then: { minLength: 1 } },
              branches: {
                type: 'object',
                if: { required: ['a'] },
                then: { $ref: '#/definitions/Choice' },
                else: { $ref: '#/definitions/Choice' },
                dependencies: { a: { $ref: '#/definitions/Choice' } },
              },
              plain: { type: 'string' },
            },
            patternProperties: { '^x-': { $ref: '#/definitions/Choice' } },
            additionalProperties: { $ref: '#/definitions/Choice' },
            unevaluatedProperties: { $ref: '#/definitions/Choice' },
            items: { $ref: '#/definitions/Choice' },
            unevaluatedItems: { $ref: '#/definitions/Choice' },
          },
        ],
      };
      // `Choice` takes objects alone
      const choice = { allOf: [{ type: 'object' }] };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          viaRef: choice,
          viaAllOf: { allOf: [choice] },
          nested: {
            type: 'object',
            properties: { deep: choice },
            allOf: [{ $ref: '#/oneOf/0/properties/nested/allOf/0' }],
          },
          conditional: {},
          branches: {
            type: 'object',
            if: { $ref: '#/oneOf/0/properties/branches/if' },
            then: choice,
            else: choice,
            dependencies: { a: choice },
          },
          plain: { $ref: '#/oneOf/0/properties/plain' },
        },
        patternProperties: { '^x-': choice },
        additionalProperties: choice,
        unevaluatedProperties: choice,
        items: choice,
        unevaluatedItems: choice,
      });
    });
    it('keeps a not and a contains leading to a choice, which read as {} would narrow what the option accepts', () => {
      const schema: RJSFSchema = {
        definitions: { Choice: NESTED },
        oneOf: [{ not: { $ref: '#/definitions/Choice' }, contains: { $ref: '#/definitions/Choice' }, required: ['a'] }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('keeps checking a choice of plain options, such as an enum written as a oneOf of consts', () => {
      const schema: RJSFSchema = {
        oneOf: [
          {
            properties: {
              size: {
                type: 'string',
                oneOf: [
                  { const: 's', title: 'Small' },
                  { const: 'l', title: 'Large' },
                ],
              },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('keeps a part whose choice holds another choice but never itself, as an OpenAPI nullable $ref does', () => {
      const schema: RJSFSchema = {
        definitions: {
          Person: { type: 'object', properties: { nickname: { anyOf: [{ type: 'string' }, { type: 'null' }] } } },
        },
        oneOf: [
          {
            properties: {
              owner: { anyOf: [{ $ref: '#/definitions/Person' }, { type: 'null' }] },
              address: {
                type: 'object',
                properties: { country: { type: 'string' } },
                dependencies: { country: { oneOf: [{ properties: { country: { const: 'SE' } } }] } },
              },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('keeps a property that leads to no choice where it sits in the root', () => {
      const schema: RJSFSchema = {
        oneOf: [{ properties: { a: { type: 'object', properties: { b: { $ref: '#/definitions/S' } } } } }],
        definitions: { S: { type: 'string' } },
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('cuts what recurs below a part in a schema adopted from outside the root that names a recursive choice of the root', () => {
      const choice: RJSFSchema = {
        oneOf: [{ type: 'null' }, { $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }],
      };
      const root: RJSFSchema = {
        definitions: {
          A: { type: 'object', properties: { child: choice } },
          B: { type: 'object', properties: { child: choice } },
        },
      };
      const { graph, node } = parseSchemaGraph(root).adopt({
        properties: { child: { $ref: '#/definitions/A' }, name: { type: 'string' } },
      });
      expect(scoringTarget(graph, node, false)).toEqual({
        properties: {
          child: { allOf: [{ type: 'object', properties: { child: { type: ['null', 'object'] } } }] },
          name: { type: 'string' },
        },
      });
    });
    it('keeps a part leading to a choice whose recurring options take different types, as a JSON value does', () => {
      const schema: RJSFSchema = {
        definitions: {
          Value: {
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { $ref: '#/definitions/Value' } },
              { type: 'object', additionalProperties: { $ref: '#/definitions/Value' } },
            ],
          },
        },
        oneOf: [{ properties: { payload: { $ref: '#/definitions/Value' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('cuts a part leading to a choice whose recurring options can take the same value, an integer being a number', () => {
      const schema: RJSFSchema = {
        definitions: {
          Count: {
            anyOf: [
              { type: ['integer', 'array'], items: { $ref: '#/definitions/Count' } },
              { type: ['number', 'object'], items: { $ref: '#/definitions/Count' } },
            ],
          },
          Anything: true,
          Untyped: {
            anyOf: [
              { $ref: '#/definitions/Anything', items: { $ref: '#/definitions/Untyped' } },
              { type: 'array', items: { $ref: '#/definitions/Untyped' } },
            ],
          },
        },
        oneOf: [{ properties: { count: { $ref: '#/definitions/Count' }, untyped: { $ref: '#/definitions/Untyped' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: { count: { allOf: [{ type: ['number', 'array', 'object'] }] }, untyped: {} },
      });
    });
    it('keeps a part leading to a choice with one recurring option, which validates the data below it once', () => {
      const schema: RJSFSchema = {
        definitions: {
          Tree: { anyOf: [{ type: 'number' }, { type: 'array', items: { $ref: '#/definitions/Tree' } }] },
        },
        oneOf: [{ properties: { payload: { $ref: '#/definitions/Tree' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('reads a part as {} where an if and its then or else both recur, but not where only the then does', () => {
      const schema: RJSFSchema = {
        definitions: {
          Twice: {
            if: { properties: { a: { $ref: '#/definitions/Twice' } } },
            then: { properties: { a: { $ref: '#/definitions/Twice' } } },
          },
          Otherwise: {
            if: { properties: { a: { $ref: '#/definitions/Otherwise' } } },
            else: { properties: { a: { $ref: '#/definitions/Otherwise' } } },
          },
          Once: { if: { type: 'object' }, then: { properties: { b: { $ref: '#/definitions/Once' } } } },
        },
        oneOf: [
          {
            properties: {
              twice: { $ref: '#/definitions/Twice' },
              otherwise: { $ref: '#/definitions/Otherwise' },
              once: { $ref: '#/definitions/Once' },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: { twice: {}, otherwise: {}, once: { $ref: '#/oneOf/0/properties/once' } },
      });
    });
    it('keeps a part leading to a dependency that recurses, which applies once and offers no choice', () => {
      const schema: RJSFSchema = {
        definitions: {
          Node: {
            type: 'object',
            properties: { kind: { type: 'string' } },
            dependencies: { kind: { properties: { extra: { $ref: '#/definitions/Node' } } } },
          },
        },
        oneOf: [{ properties: { tree: { $ref: '#/definitions/Node' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('leaves out a dependency offering options that recur, keeping the rest of the node holding it', () => {
      const schema: RJSFSchema = {
        definitions: {
          Node: {
            type: 'object',
            properties: { kind: { type: 'string' } },
            dependencies: {
              kind: {
                oneOf: [
                  { properties: { left: { $ref: '#/definitions/Node' } } },
                  { properties: { left: { $ref: '#/definitions/Node' }, side: { const: 'right' } } },
                ],
              },
            },
          },
        },
        oneOf: [{ properties: { tree: { $ref: '#/definitions/Node' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          tree: {
            allOf: [
              {
                type: 'object',
                properties: { kind: { $ref: '#/definitions/Node/properties/kind' } },
              },
            ],
          },
        },
      });
    });
    it('cuts where two recurring subschemas apply to the same value, as two allOf entries or a $ref beside a oneOf do', () => {
      const schema: RJSFSchema = {
        definitions: {
          Pair: {
            type: 'object',
            properties: { c: { allOf: [{ $ref: '#/definitions/Pair' }, { $ref: '#/definitions/PairExt' }] } },
          },
          PairExt: { properties: { c: { $ref: '#/definitions/Pair' } } },
          Pet: { type: 'object', $ref: '#/definitions/Base', oneOf: [{ $ref: '#/definitions/Cat' }, { type: 'null' }] },
          Base: { type: 'object', properties: { next: { $ref: '#/definitions/Pet' } } },
          Cat: { allOf: [{ $ref: '#/definitions/Base' }, { properties: { meow: { type: 'string' } } }] },
        },
        oneOf: [{ properties: { pair: { $ref: '#/definitions/Pair' }, pet: { $ref: '#/definitions/Pet' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          pair: { allOf: [{ type: 'object', properties: { c: { type: 'object' } } }] },
          pet: { allOf: [{ type: 'object' }] },
        },
      });
    });
    it('reads the types of recurring subschemas from their allOf, const and enum as well as their type', () => {
      const schema: RJSFSchema = {
        definitions: {
          Wrapped: {
            anyOf: [
              { enum: ['a', 'b'], items: { $ref: '#/definitions/Wrapped' } },
              { const: null, items: { $ref: '#/definitions/Wrapped' } },
              { allOf: [{ type: 'array' }], items: { $ref: '#/definitions/Wrapped' } },
              {
                type: ['object', 'string'],
                allOf: [{ type: ['object', 'null'] }],
                additionalProperties: { $ref: '#/definitions/Wrapped' },
              },
            ],
          },
          Consts: {
            anyOf: [
              { const: 1, items: { $ref: '#/definitions/Consts' } },
              { type: 'integer', items: { $ref: '#/definitions/Consts' } },
            ],
          },
          Lists: {
            anyOf: [
              { const: [1], items: { $ref: '#/definitions/Lists' } },
              { type: 'array', items: [{}], additionalItems: { $ref: '#/definitions/Lists' } },
            ],
          },
          Either: {
            if: { type: 'string' },
            then: { type: 'object', properties: { a: { $ref: '#/definitions/Either' } } },
            else: { type: 'array', items: { $ref: '#/definitions/Either' } },
          },
        },
        oneOf: [
          {
            properties: {
              wrapped: { $ref: '#/definitions/Wrapped' },
              consts: { $ref: '#/definitions/Consts' },
              lists: { $ref: '#/definitions/Lists' },
              either: { $ref: '#/definitions/Either' },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          wrapped: { $ref: '#/oneOf/0/properties/wrapped' },
          consts: { allOf: [{ type: 'number' }] },
          lists: { allOf: [{ type: 'array' }] },
          either: { $ref: '#/oneOf/0/properties/either' },
        },
      });
    });
    it('keeps every check of a recurring node a part enters from outside its cycle but what recurs', () => {
      const schema: RJSFSchema = {
        definitions: {
          A: {
            type: 'object',
            properties: {
              kind: { const: 'A' },
              child: { oneOf: [{ type: 'null' }, { $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] },
            },
          },
          B: {
            type: 'object',
            properties: {
              kind: { const: 'B' },
              child: { oneOf: [{ type: 'null' }, { $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] },
            },
          },
        },
        oneOf: [
          {
            properties: { w: { $ref: '#/definitions/A' } },
            not: { $ref: '#/definitions/B' },
            allOf: [{ properties: { plain: { type: 'string' } } }, { $ref: '#/definitions/A' }],
          },
        ],
      };
      const entered = {
        type: 'object',
        properties: { kind: { $ref: '#/definitions/A/properties/kind' }, child: { type: ['null', 'object'] } },
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: { w: { allOf: [entered] } },
        not: { $ref: '#/oneOf/0/not' },
        allOf: [{ properties: { plain: { $ref: '#/oneOf/0/allOf/0/properties/plain' } } }, { allOf: [entered] }],
      });
    });
    it('keeps a part whose subschemas recur through different parts of the data, which walks each part once', () => {
      const schema: RJSFSchema = {
        definitions: {
          Node: {
            allOf: [
              { $ref: '#/definitions/Base' },
              { properties: { children: { items: { $ref: '#/definitions/Node' } } } },
            ],
          },
          Base: { type: 'object', properties: { parent: { $ref: '#/definitions/Node' } } },
          Sides: {
            type: 'object',
            anyOf: [
              { properties: { left: { $ref: '#/definitions/Sides' } } },
              { properties: { right: { $ref: '#/definitions/Sides' } } },
            ],
          },
          Items: {
            anyOf: [
              { type: 'array', items: { $ref: '#/definitions/Items' } },
              { type: 'array', contains: { type: 'string' }, additionalProperties: { $ref: '#/definitions/Items' } },
            ],
          },
        },
        oneOf: [
          {
            properties: {
              node: { $ref: '#/definitions/Node' },
              sides: { $ref: '#/definitions/Sides' },
              items: { $ref: '#/definitions/Items' },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('cuts where a recurring property meets a recurring pattern property, which can name the same key', () => {
      const schema: RJSFSchema = {
        definitions: {
          Keys: {
            type: 'object',
            anyOf: [
              { properties: { a: { $ref: '#/definitions/Keys' } } },
              { patternProperties: { '^a': { $ref: '#/definitions/Keys' } } },
            ],
          },
        },
        oneOf: [{ properties: { keys: { $ref: '#/definitions/Keys' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ properties: { keys: { allOf: [{ type: 'object' }] } } });
    });
    it('cuts where subschemas recur through the same keyword, or a dependentSchemas entry through a property the node holds', () => {
      const schema: RJSFSchema = {
        definitions: {
          Names: {
            anyOf: [
              { type: 'object', propertyNames: { $ref: '#/definitions/Names' } },
              { type: 'object', propertyNames: { $ref: '#/definitions/Names' } },
            ],
          },
          Deps: {
            type: 'object',
            properties: { x: { $ref: '#/definitions/Deps' } },
            dependentSchemas: { a: { properties: { x: { $ref: '#/definitions/Deps' } } } },
          },
        },
        oneOf: [{ properties: { names: { $ref: '#/definitions/Names' }, deps: { $ref: '#/definitions/Deps' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: { names: { allOf: [{ type: 'object' }] }, deps: { allOf: [{ type: 'object' }] } },
      });
    });
    it('copies a dependentSchemas entry leading to a recursive choice, as it copies a dependencies one, keeping the node beside it', () => {
      const expression = (kind: string): RJSFSchema => ({
        type: 'object',
        properties: { kind: { const: kind }, next: { $ref: '#/$defs/Expr' } },
      });
      const schema: RJSFSchema = {
        $defs: {
          Expr: { oneOf: [{ type: 'null' }, { $ref: '#/$defs/P' }, { $ref: '#/$defs/Q' }] },
          P: expression('p'),
          Q: expression('q'),
        },
        oneOf: [
          {
            properties: {
              v: {
                type: 'object',
                properties: { kind: { const: 'p' } },
                dependentSchemas: { kind: { $ref: '#/$defs/P' } },
              },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          v: {
            type: 'object',
            properties: { kind: { $ref: '#/oneOf/0/properties/v/properties/kind' } },
            dependentSchemas: {
              kind: {
                allOf: [
                  {
                    type: 'object',
                    properties: { kind: { $ref: '#/$defs/P/properties/kind' }, next: { type: ['null', 'object'] } },
                  },
                ],
              },
            },
          },
        },
      });
    });
    it('reads a cut choice that takes no type at all as accepting nothing', () => {
      const schema: RJSFSchema = {
        definitions: {
          Never: {
            type: 'string',
            const: 1,
            anyOf: [
              { properties: { c: { $ref: '#/definitions/Never' } } },
              { properties: { c: { $ref: '#/definitions/Never' } } },
            ],
          },
        },
        oneOf: [{ properties: { never: { $ref: '#/definitions/Never' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ properties: { never: { allOf: [{ not: {} }] } } });
    });
    it('reads a cut choice whose type or enum repeats a type as naming it once, as the meta-schema requires', () => {
      const ref = (name: string): RJSFSchema => ({ $ref: `#/definitions/${name}` });
      const expression = (kind: string): RJSFSchema => ({
        type: 'object',
        properties: { kind: { const: kind }, next: ref('Repeated') },
      });
      const branch: RJSFSchema = { type: 'object', properties: { c: ref('Strings') } };
      const schema: RJSFSchema = {
        definitions: {
          Repeated: {
            type: ['integer', 'number', 'null', 'object'],
            oneOf: [{ type: 'null' }, { type: 'integer' }, expression('p'), expression('q')],
          },
          Strings: { enum: ['a', 'b'], anyOf: [{ type: 'string' }, branch, branch] },
        },
        oneOf: [{ properties: { repeated: ref('Repeated'), strings: ref('Strings') } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          repeated: { allOf: [{ type: ['number', 'null', 'object'] }] },
          strings: { allOf: [{ type: 'string' }] },
        },
      });
    });
    it('reads a cut choice whose options are nullable as taking null too, as Ajv reads nullable', () => {
      const expression = (kind: string): RJSFSchema => ({
        type: 'object',
        nullable: true,
        properties: { kind: { const: kind }, next: { $ref: '#/definitions/Expr' } },
      });
      const schema: RJSFSchema = {
        definitions: { Expr: { anyOf: [expression('p'), expression('q')] } },
        oneOf: [{ properties: { next: { $ref: '#/definitions/Expr' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ properties: { next: { allOf: [{ type: ['object', 'null'] }] } } });
    });
    it('reads the dependentSchemas of an option the root holds as part of its scope, as it reads its dependencies', () => {
      const expression = (kind: string): RJSFSchema => ({
        type: 'object',
        properties: { kind: { const: kind }, next: { $ref: '#/definitions/Expr' } },
      });
      const schema: RJSFSchema = {
        definitions: {
          Expr: { oneOf: [{ type: 'null' }, { $ref: '#/definitions/P' }, { $ref: '#/definitions/Q' }] },
          P: expression('p'),
          Q: expression('q'),
        },
        oneOf: [
          { type: 'object', properties: { a: { type: 'string' } }, dependentSchemas: { a: { required: ['b'] } } },
          {
            type: 'object',
            properties: { kind: { const: 'r' } },
            dependentSchemas: { kind: { properties: { next: { $ref: '#/definitions/Expr' } } } },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        type: 'object',
        properties: { a: { $ref: '#/oneOf/0/properties/a' } },
        dependentSchemas: { a: {} },
      });
      expect(scored(schema, '/oneOf/1')).toEqual({
        type: 'object',
        properties: { kind: { $ref: '#/oneOf/1/properties/kind' } },
        dependentSchemas: { kind: { properties: { next: { allOf: [{ type: ['null', 'object'] }] } } } },
      });
    });
    it('reads the types of subschemas that apply to one value in a cycle the same whichever of them is read first', () => {
      const A: RJSFSchema = { anyOf: [{ $ref: '#/definitions/B' }, { type: 'string' }] };
      const B: RJSFSchema = { type: 'number', allOf: [{ $ref: '#/definitions/A' }] };
      const Tree: RJSFSchema = {
        anyOf: [
          { allOf: [{ $ref: '#/definitions/A' }], properties: { c: { $ref: '#/definitions/Tree' } } },
          { allOf: [{ $ref: '#/definitions/B' }], properties: { c: { $ref: '#/definitions/Tree' } } },
        ],
      };
      const option: RJSFSchema = { properties: { v: { $ref: '#/definitions/Tree' } } };
      const aFirst = scored({ definitions: { A, B, Tree }, oneOf: [option] }, '/oneOf/0');
      const bFirst = scored({ definitions: { B, A, Tree }, oneOf: [option] }, '/oneOf/0');
      expect(aFirst).toEqual({ properties: { v: { allOf: [{ type: ['number', 'string'] }] } } });
      expect(bFirst).toEqual(aFirst);
    });
    it('cuts as a whole a node whose unevaluatedProperties sees a conjunct leading to a recursive choice', () => {
      const schema: RJSFSchema = {
        definitions: {
          Node: { allOf: [{ $ref: '#/definitions/Base' }], unevaluatedProperties: false },
          Base: {
            type: 'object',
            anyOf: [
              { properties: { c: { $ref: '#/definitions/Node' } } },
              { properties: { c: { $ref: '#/definitions/Node' } } },
            ],
          },
          Items: { unevaluatedItems: false, $ref: '#/definitions/List' },
          List: {
            type: 'array',
            anyOf: [{ prefixItems: [{ $ref: '#/definitions/List' }] }, { items: { $ref: '#/definitions/List' } }],
          },
        },
        oneOf: [{ properties: { node: { $ref: '#/definitions/Node' }, items: { $ref: '#/definitions/Items' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: { node: { allOf: [{ type: 'object' }] }, items: { allOf: [{ type: 'array' }] } },
      });
    });
    it('copies a node whose unevaluatedProperties sees a conjunct whose copy keeps every part it evaluates', () => {
      const branch = (kind: string): RJSFSchema => ({
        type: 'object',
        $ref: '#/$defs/Base',
        properties: { k: { const: kind } },
        unevaluatedProperties: false,
      });
      const schema: RJSFSchema = {
        $defs: {
          C: { oneOf: [{ type: 'null' }, { $ref: '#/$defs/A' }, { $ref: '#/$defs/B' }] },
          Base: { properties: { child: { $ref: '#/$defs/C' } } },
          A: branch('a'),
          B: branch('b'),
        },
        oneOf: [{ properties: { w: { $ref: '#/$defs/A' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          w: {
            allOf: [
              {
                type: 'object',
                properties: { k: { $ref: '#/$defs/A/properties/k' } },
                unevaluatedProperties: false,
                allOf: [{ properties: { child: { type: ['null', 'object'] } } }],
              },
            ],
          },
        },
      });
    });
    it('cuts as a whole a node whose unevaluatedProperties sees a conjunct holding a cut conjunct', () => {
      const schema: RJSFSchema = {
        definitions: {
          Node: { allOf: [{ $ref: '#/definitions/Wrapped' }], unevaluatedProperties: false },
          Wrapped: { allOf: [{ $ref: '#/definitions/Base' }] },
          Base: {
            type: 'object',
            anyOf: [
              { properties: { c: { $ref: '#/definitions/Node' } } },
              { properties: { c: { $ref: '#/definitions/Node' } } },
            ],
          },
        },
        oneOf: [{ properties: { node: { $ref: '#/definitions/Node' } } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ properties: { node: { allOf: [{ type: 'object' }] } } });
    });
    it('drops a dependentRequired from the copy, as it drops the names a dependencies entry lists', () => {
      const schema: RJSFSchema = {
        oneOf: [{ properties: { a: { type: 'string' }, b: { type: 'string' } }, dependentRequired: { a: ['b'] } }],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: { a: { $ref: '#/oneOf/0/properties/a' }, b: { $ref: '#/oneOf/0/properties/b' } },
      });
    });
    it('keeps a dependentRequired below a part of the data, which scoring loosens only in the option', () => {
      const schema: RJSFSchema = {
        definitions: { Choice: NESTED },
        oneOf: [
          {
            properties: {
              w: { properties: { t: { $ref: '#/definitions/Choice' } }, dependentRequired: { t: ['u'] } },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: { w: { properties: { t: { allOf: [{ type: 'object' }] } }, dependentRequired: { t: ['u'] } } },
      });
    });
    it('checks a node of an adopted schema whose unevaluatedProperties sees the properties a subschema of the root declares', () => {
      const root: RJSFSchema = {
        $id: 'urn:root',
        definitions: { Base: { type: 'object', properties: { a: { type: 'string' } } } },
      };
      const { graph, node } = parseSchemaGraph(root).adopt({
        $id: 'urn:adopted',
        $defs: {
          X: {
            allOf: [{ $ref: 'urn:root#/definitions/Base' }],
            properties: { c: { $ref: '#/$defs/X' } },
            unevaluatedProperties: { $ref: '#/$defs/X' },
          },
        },
        properties: { v: { $ref: '#/$defs/X' } },
      });
      // `c` and the properties neither `X` nor `Base` declares are different parts, so `X` walks each once
      expect(scoringTarget(graph, node, false)).toMatchObject({
        properties: {
          v: { allOf: [{ properties: { c: expect.anything() }, unevaluatedProperties: expect.anything() }] },
        },
      });
    });
    it('cuts as a whole a node adopted twice over whose unevaluatedProperties sees a cut conjunct of the root', () => {
      const root: RJSFSchema = {
        definitions: {
          Base: {
            type: 'object',
            anyOf: [
              { properties: { c: { $ref: '#/definitions/Base' } } },
              { properties: { c: { $ref: '#/definitions/Base' } } },
            ],
          },
        },
      };
      const { graph: adopted } = parseSchemaGraph(root).adopt({ properties: { u: { type: 'string' } } });
      const { graph, node } = adopted.adopt({
        properties: { v: { allOf: [{ $ref: '#/definitions/Base' }], unevaluatedProperties: false } },
      });
      expect(graph.base).toBe(adopted);
      expect(scoringTarget(graph, node, false)).toEqual({ properties: { v: { type: 'object' } } });
    });
    it('copies a node whose unevaluatedProperties sees only conjuncts leading to no recursive choice', () => {
      const schema: RJSFSchema = {
        definitions: { Choice: NESTED },
        oneOf: [
          {
            properties: {
              w: {
                allOf: [{ type: 'object' }],
                unevaluatedProperties: false,
                properties: { t: { $ref: '#/definitions/Choice' } },
              },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          w: {
            allOf: [{ $ref: '#/oneOf/0/properties/w/allOf/0' }],
            unevaluatedProperties: false,
            properties: { t: { allOf: [{ type: 'object' }] } },
          },
        },
      });
    });
    it('keeps an empty allOf entry the option writes, which no cut emptied', () => {
      const schema: RJSFSchema = { oneOf: [{ allOf: [{}], properties: { a: { type: 'string' } }, required: ['a'] }] };
      expect(scored(schema, '/oneOf/0')).toEqual({
        allOf: [{}],
        properties: { a: { $ref: '#/oneOf/0/properties/a' } },
      });
    });
    it('keeps a part whose $defs hold a recursive choice, which a validator reaches only through a $ref', () => {
      const schema: RJSFSchema = {
        oneOf: [
          {
            properties: {
              meta: {
                $id: 'meta.json',
                type: 'string',
                $defs: { Tree: { anyOf: [{ type: 'string' }, { items: { $ref: '#/$defs/Tree' } }] } },
              },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('keeps a node whose subschemas recur through properties, patterns, the rest of the properties or items that cannot be the same', () => {
      const ref = (name: string): RJSFSchema => ({ $ref: `#/definitions/${name}` });
      const schema: RJSFSchema = {
        definitions: {
          Pattern: {
            type: 'object',
            allOf: [{ properties: { parent: ref('Pattern') } }, { patternProperties: { '^x-': ref('Pattern') } }],
          },
          PatternFirst: {
            type: 'object',
            allOf: [
              { patternProperties: { '^x-': ref('PatternFirst') } },
              { properties: { parent: ref('PatternFirst') } },
            ],
          },
          Claimed: {
            type: 'object',
            allOf: [
              { properties: { parent: ref('Claimed') } },
              { properties: { parent: { type: 'object' } }, additionalProperties: ref('Claimed') },
            ],
          },
          ClaimedByPattern: {
            type: 'object',
            allOf: [
              { properties: { parent: ref('ClaimedByPattern') } },
              { patternProperties: { '^p': { type: 'object' } }, additionalProperties: ref('ClaimedByPattern') },
            ],
          },
          Unevaluated: {
            type: 'object',
            properties: { a: ref('Unevaluated') },
            unevaluatedProperties: ref('Unevaluated'),
          },
          UnevaluatedItems: {
            type: 'array',
            prefixItems: [ref('UnevaluatedItems')],
            unevaluatedItems: ref('UnevaluatedItems'),
          },
          Left: {
            type: 'object',
            allOf: [
              { patternProperties: { '^x-': ref('Left') } },
              { patternProperties: { '^x-': { type: 'object' } }, additionalProperties: ref('Left') },
            ],
          },
          Own: {
            type: 'object',
            properties: { a: ref('Own') },
            patternProperties: { '^b': ref('Own') },
            additionalProperties: ref('Own'),
          },
          Tuple: {
            type: 'array',
            allOf: [{ items: [{ type: 'string' }, ref('Tuple')] }, { additionalItems: ref('Tuple') }],
          },
          Prefixed: { type: 'array', prefixItems: [ref('Prefixed')], items: ref('Prefixed') },
          Rest: { type: 'array', items: [ref('Rest')], additionalItems: ref('Rest') },
          EvaluatedItems: { type: 'array', items: ref('EvaluatedItems'), unevaluatedItems: ref('EvaluatedItems') },
          EvaluatedRest: {
            type: 'array',
            items: [ref('EvaluatedRest')],
            additionalItems: ref('EvaluatedRest'),
            unevaluatedItems: ref('EvaluatedRest'),
          },
          TupleThenUnevaluated: {
            type: 'array',
            items: [ref('TupleThenUnevaluated')],
            unevaluatedItems: ref('TupleThenUnevaluated'),
          },
          EvaluatedProperties: {
            type: 'object',
            additionalProperties: ref('EvaluatedProperties'),
            unevaluatedProperties: ref('EvaluatedProperties'),
          },
          // The properties and items its conjuncts evaluate, however deep, are left out of an unevaluated keyword
          Shared: { properties: { b: { type: 'string' } } },
          ConjunctEvaluated: {
            type: 'object',
            allOf: [true, ref('Shared'), { allOf: [ref('Shared')] }, { properties: { a: ref('ConjunctEvaluated') } }],
            unevaluatedProperties: ref('ConjunctEvaluated'),
          },
          ConjunctRest: {
            type: 'object',
            allOf: [{ additionalProperties: ref('ConjunctRest') }],
            unevaluatedProperties: ref('ConjunctRest'),
          },
          ConjunctUnevaluated: {
            type: 'object',
            allOf: [{ unevaluatedProperties: ref('ConjunctUnevaluated') }],
            unevaluatedProperties: ref('ConjunctUnevaluated'),
          },
          ConjunctItems: {
            type: 'array',
            allOf: [{ items: ref('ConjunctItems') }],
            unevaluatedItems: ref('ConjunctItems'),
          },
          ConjunctUnevaluatedItems: {
            type: 'array',
            allOf: [{ unevaluatedItems: ref('ConjunctUnevaluatedItems') }],
            unevaluatedItems: ref('ConjunctUnevaluatedItems'),
          },
          ConjunctTuple: {
            type: 'array',
            allOf: [{ prefixItems: [ref('ConjunctTuple')] }],
            unevaluatedItems: ref('ConjunctTuple'),
          },
        },
        oneOf: [
          {
            properties: Object.fromEntries(
              [
                'Pattern',
                'PatternFirst',
                'Claimed',
                'ClaimedByPattern',
                'Unevaluated',
                'UnevaluatedItems',
                'Left',
                'Own',
                'Tuple',
                'Prefixed',
                'Rest',
                'EvaluatedItems',
                'EvaluatedRest',
                'TupleThenUnevaluated',
                'EvaluatedProperties',
                'ConjunctEvaluated',
                'ConjunctRest',
                'ConjunctUnevaluated',
                'ConjunctItems',
                'ConjunctUnevaluatedItems',
                'ConjunctTuple',
              ].map((name) => [name, ref(name)]),
            ),
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({ $ref: '#/oneOf/0' });
    });
    it('cuts where its own parts, or those of the subschemas applying to the same value, can be the same', () => {
      const ref = (name: string): RJSFSchema => ({ $ref: `#/definitions/${name}` });
      const schema: RJSFSchema = {
        definitions: {
          OwnPattern: {
            type: 'object',
            properties: { a: ref('OwnPattern') },
            patternProperties: { '^a': ref('OwnPattern') },
          },
          OwnContains: { type: 'array', items: ref('OwnContains'), contains: ref('OwnContains') },
          Patterns: {
            type: 'object',
            allOf: [{ patternProperties: { '^a': ref('Patterns') } }, { patternProperties: { '^b': ref('Patterns') } }],
          },
          Rests: {
            type: 'object',
            allOf: [{ additionalProperties: ref('Rests') }, { additionalProperties: ref('Rests') }],
          },
          Unclaimed: {
            type: 'object',
            allOf: [
              { properties: { parent: ref('Unclaimed') } },
              { properties: { x: {} }, additionalProperties: ref('Unclaimed') },
            ],
          },
          Items: { type: 'array', allOf: [{ items: [ref('Items')] }, { items: ref('Items') }] },
          // An empty tuple leaves every item to the `additionalItems` beside it
          EmptyTuple: { type: 'array', items: [], additionalItems: ref('EmptyTuple'), contains: ref('EmptyTuple') },
        },
        oneOf: [
          {
            properties: Object.fromEntries(
              ['OwnPattern', 'OwnContains', 'Patterns', 'Rests', 'Unclaimed', 'Items', 'EmptyTuple'].map((name) => [
                name,
                ref(name),
              ]),
            ),
          },
        ],
      };
      const object = { allOf: [{ type: 'object' }] };
      const array = { allOf: [{ type: 'array' }] };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          OwnPattern: object,
          OwnContains: array,
          Patterns: object,
          Rests: object,
          Unclaimed: object,
          Items: array,
          EmptyTuple: array,
        },
      });
    });
    it('reads a part cut to nothing as {}, and leaves out an allOf entry, then, else or dependency cut to nothing', () => {
      const free: RJSFSchema = { $ref: '#/definitions/Free' };
      const schema: RJSFSchema = {
        definitions: {
          // A recursive choice stating no type, which a cut leaves nothing of
          Free: { anyOf: [{ properties: { c: free } }, { properties: { c: free } }] },
        },
        oneOf: [
          {
            properties: {
              wrapped: { allOf: [free] },
              branches: {
                type: 'object',
                if: { required: ['a'] },
                then: free,
                else: free,
                dependencies: { a: free, b: ['a'] },
              },
            },
          },
        ],
      };
      expect(scored(schema, '/oneOf/0')).toEqual({
        properties: {
          wrapped: {},
          branches: {
            type: 'object',
            if: { $ref: '#/oneOf/0/properties/branches/if' },
            dependencies: { b: ['a'] },
          },
        },
      });
    });
    it('names a subschema below a part that leads to no choice where the root holds it, though reached outside the root', () => {
      const plain: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const root: RJSFSchema = { definitions: { Choice: NESTED, Plain: plain } };
      const { graph, node } = parseSchemaGraph(root).adopt({
        properties: {
          v: { allOf: [plain, { $ref: '#/definitions/Choice' }] },
          w: { oneOf: [{ $ref: '#/definitions/Choice' }, { type: 'null' }] },
        },
      });
      expect(scoringTarget(graph, node, false)).toEqual({
        properties: {
          v: { allOf: [{ $ref: '#/definitions/Plain' }, { allOf: [{ type: 'object' }] }] },
          w: { type: ['object', 'null'] },
        },
      });
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
  it('lists no declaration for a `propertyName` the discriminator inherits, which the form does not read either', () => {
    class InheritedPropertyName {
      declare readonly propertyName: string;
    }
    Object.defineProperty(InheritedPropertyName.prototype, 'propertyName', { value: 'kind' });
    const root: RJSFSchema = {
      definitions: { Base: { properties: { kind: { type: 'string' } } } },
      discriminator: new InheritedPropertyName(),
      oneOf: [{ allOf: [{ $ref: '#/definitions/Base' }, { properties: { kind: { const: 'a' } } }] }],
    };
    const graph = parseSchemaGraph(root);
    expect(validationTargets(graph)).not.toContainEqual(
      declaredPropertyTarget(graph, nodeAt(graph, '/oneOf/0'), 'kind'),
    );
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
