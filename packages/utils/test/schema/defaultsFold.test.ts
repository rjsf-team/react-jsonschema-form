import { createSchemaUtils, getDefaultFormState, isObject } from '../../src/index.ts';
import type { DefaultFormStateBehavior, RJSFSchema, SchemaContext } from '../../src/index.ts';
import {
  computeDefaults,
  getArrayDefaults,
  getDefaultBasedOnSchemaType,
  getObjectDefaults,
} from '../../src/schema/getDefaultFormState.ts';
import looseSchema from './graph/looseSchema.ts';
import { miniValidator } from './graph/miniValidator.ts';

const validator = miniValidator();

describe('getDefaultFormState() as one fold over the merge plan', () => {
  it('merges the then of an if inside an allOf it populates, under skipEmptyDefaults', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        pet: {
          type: 'object',
          properties: { kind: { type: 'string', default: 'cat' } },
          allOf: [
            {
              if: { properties: { kind: { const: 'cat' } } },
              then: { properties: { meow: { type: 'string', default: 'yes' } } },
            },
          ],
        },
      },
    };
    const defaultFormStateBehavior: DefaultFormStateBehavior = {
      emptyObjectFields: 'skipEmptyDefaults',
      allOf: 'populateDefaults',
    };
    expect(
      getDefaultFormState({ validator, defaultFormStateBehavior }, { schema, formData: { pet: { kind: 'cat' } } }),
    ).toEqual({ pet: { kind: 'cat', meow: 'yes' } });
  });

  it("applies the ui:definitions entry of the field's own $ref only, not that of a $ref an allOf merges in", () => {
    const schema: RJSFSchema = {
      definitions: {
        A: { allOf: [{ $ref: '#/definitions/B' }], properties: { a: { type: 'string' } } },
        B: { type: 'object', properties: { b: { type: 'string' }, c: { type: 'string' } } },
      },
      type: 'object',
      properties: { field: { $ref: '#/definitions/A' } },
    };
    const uiSchema = {
      'ui:definitions': {
        '#/definitions/A': { b: { 'ui:initialValue': 'from A' } },
        '#/definitions/B': { b: { 'ui:initialValue': 'from B' }, c: { 'ui:initialValue': 'from B' } },
      },
    };
    expect(
      getDefaultFormState(
        { validator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
        { schema, rootSchema: schema, uiSchema },
      ),
    ).toEqual({ field: { b: 'from A' } });
  });

  it.each<[string, RJSFSchema, unknown]>([
    [
      'the definition a $ref with keywords beside it names',
      {
        definitions: {
          D: {
            type: 'object',
            properties: { d: { type: 'string', default: 'd' } },
            allOf: [{ properties: { n: { type: 'string', default: 'n' } } }],
          },
        },
        type: 'object',
        properties: {
          plain: { $ref: '#/definitions/D' },
          beside: { $ref: '#/definitions/D', properties: { s: { type: 'string', default: 's' } } },
        },
      },
      { plain: { d: 'd' }, beside: { s: 's', d: 'd' } },
    ],
    [
      'a property merged with the pattern its name matches',
      {
        type: 'object',
        properties: {
          cx: { type: 'object', allOf: [{ properties: { n: { type: 'string', default: 'n' } } }] },
          dx: { type: 'object', allOf: [{ properties: { n: { type: 'string', default: 'n' } } }] },
        },
        patternProperties: { '^c': { title: 'C' } },
      },
      {},
    ],
  ])("skips the allOf of %s under allOf: 'skipDefaults', as any other property's", (_, schema, expected) => {
    expect(getDefaultFormState({ validator }, { schema, rootSchema: schema })).toEqual(expected);
  });

  describe('options a customMergeAllOf rewrote', () => {
    // The merge hands back a copy of the options, which no node of the schema declares
    const customMergeAllOf = (schema: RJSFSchema): RJSFSchema => {
      const [member] = schema.allOf ?? [];
      return typeof member === 'object' ? { ...member, anyOf: member.anyOf?.map((option) => option) } : {};
    };

    it("computes an object's defaults from the option merged into it, as written", () => {
      const schema: RJSFSchema = {
        allOf: [
          {
            type: 'object',
            properties: { a: { type: 'string', default: 'a' } },
            anyOf: [{ properties: { b: { type: 'string', default: 'b' } } }],
          },
        ],
      };
      expect(getDefaultFormState({ validator, customMergeAllOf }, { schema })).toEqual({ a: 'a', b: 'b' });
    });

    it('computes the defaults of any other field from the option as it is rendered', () => {
      const schema: RJSFSchema = {
        definitions: { S: { type: 'string', default: 's' } },
        allOf: [{ type: 'string', anyOf: [{ $ref: '#/definitions/S' }] }],
      };
      expect(getDefaultFormState({ validator, customMergeAllOf }, { schema })).toEqual('s');
    });
  });

  it('reads a tuple item a customMergeAllOf adds as it stands', () => {
    const schema: RJSFSchema = { allOf: [{ type: 'array' }] };
    const customMergeAllOf = (): RJSFSchema => ({ type: 'array', items: [{ type: 'string', default: 'a' }] });
    expect(getDefaultFormState({ validator, customMergeAllOf }, { schema })).toEqual(['a']);
  });

  it('getObjectDefaults() resolves a schema holding an if before reading its properties', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'a' } },
      if: { properties: { a: { const: 'a' } } },
      then: { properties: { b: { type: 'string', default: 'b' } } },
    };
    expect(getObjectDefaults({ validator }, schema, { rootSchema: schema, rawFormData: { a: 'a' } })).toEqual({
      a: 'a',
      b: 'b',
    });
  });

  describe('a default beside a $ref whose target declares one', () => {
    const definitions: RJSFSchema['definitions'] = {
      s: { type: 'string', default: 'target' },
      o: { type: 'object', properties: { s: { type: 'string' } }, default: { s: 'target' } },
      alias: { $ref: '#/definitions/s', default: 'alias' },
    };
    const defaultsOf = (schema: RJSFSchema, formData?: unknown) =>
      getDefaultFormState({ validator }, { schema: { definitions, ...schema }, formData });

    it('overrides the target, as every other keyword beside the $ref does', () => {
      expect(
        defaultsOf({
          type: 'object',
          properties: {
            p: { $ref: '#/definitions/s', default: 'beside' },
            o: { $ref: '#/definitions/o', default: { s: 'beside' } },
            nested: { type: 'object', properties: { p: { $ref: '#/definitions/s', default: 'beside' } } },
          },
        }),
      ).toEqual({ p: 'beside', o: { s: 'beside' }, nested: { p: 'beside' } });
      expect(defaultsOf({ $ref: '#/definitions/s', default: 'beside' })).toBe('beside');
      expect(defaultsOf({ type: 'array', minItems: 1, items: { $ref: '#/definitions/s', default: 'beside' } })).toEqual(
        ['beside'],
      );
    });
    it('overrides it along an alias chain, past a $ref back into a recursion and in computeDefaults()', () => {
      expect(
        defaultsOf({
          type: 'object',
          properties: {
            outer: { $ref: '#/definitions/alias', default: 'beside' },
            inner: { $ref: '#/definitions/alias' },
          },
        }),
      ).toEqual({ outer: 'beside', inner: 'alias' });
      expect(
        computeDefaults({ validator }, { $ref: '#/definitions/s', default: 'beside' }, { rootSchema: { definitions } }),
      ).toBe('beside');
      const node: RJSFSchema = {
        type: 'object',
        properties: { v: { $ref: '#/definitions/s', default: 'beside' }, child: { $ref: '#/definitions/node' } },
      };
      expect(defaultsOf({ definitions: { ...definitions, node }, $ref: '#/definitions/node' })).toEqual({
        v: 'beside',
        child: { v: 'beside' },
      });
      const tree: RJSFSchema = {
        type: 'object',
        default: { name: 'target' },
        properties: {
          name: { type: 'string' },
          child: { $ref: '#/definitions/tree', default: { name: 'beside' } },
        },
      };
      expect(defaultsOf({ definitions: { ...definitions, tree }, $ref: '#/definitions/tree' })).toEqual({
        name: 'target',
        child: { name: 'beside', child: { name: 'beside' } },
      });
    });
  });

  describe('a recursion through an option list a property reaches through its $ref', () => {
    const nested = (depth: number): object => (depth === 0 ? {} : { c: nested(depth - 1) });
    const withOptions = (options: RJSFSchema): RJSFSchema => ({
      definitions: {
        options,
        node: {
          type: 'object',
          properties: { name: { type: 'string', default: 'n' }, c: { $ref: '#/definitions/options' } },
        },
      },
      $ref: '#/definitions/node',
    });

    it('stops where the option list written on the property stops, whatever the data holds below', () => {
      const schema = withOptions({
        type: 'object',
        oneOf: [{ $ref: '#/definitions/node' }, { properties: { z: { type: 'string', default: 'z' } } }],
      });
      expect(getDefaultFormState({ validator }, { schema })).toEqual({ name: 'n', c: { name: 'n' } });
      expect(getDefaultFormState({ validator }, { schema, rootSchema: schema, formData: nested(7) })).toEqual({
        name: 'n',
        c: { name: 'n', c: nested(5) },
      });
    });
    it('for an option list that is not an object as well', () => {
      const schema = withOptions({ anyOf: [{ $ref: '#/definitions/node' }, { type: 'null' }] });
      expect(getDefaultFormState({ validator }, { schema, rootSchema: schema, formData: nested(4) })).toEqual({
        name: 'n',
        c: { name: 'n', c: nested(2) },
      });
    });
  });
});

const D = (name: string) => `#/definitions/${name}`;
const populate: DefaultFormStateBehavior = { allOf: 'populateDefaults' };

/** The defaults of `schema` as its own root, under `behavior` */
function defaultsOf(schema: RJSFSchema, formData?: unknown, behavior?: DefaultFormStateBehavior, context = validator) {
  return getDefaultFormState(
    { validator: context, defaultFormStateBehavior: behavior },
    { schema, rootSchema: schema, formData },
  );
}

describe('getDefaultFormState() on recursive schemas', () => {
  const ref: RJSFSchema = { $ref: D('node') };
  const nodeWith = (child: RJSFSchema): RJSFSchema => ({
    definitions: { node: { type: 'object', properties: { name: { type: 'string', default: 'n' }, child } } },
    $ref: D('node'),
  });
  const A: RJSFSchema = {
    type: 'object',
    properties: { a: { type: 'string', default: 'x' } },
    dependencies: { a: { properties: { b: { $ref: D('B') } } } },
  };
  const B: RJSFSchema = {
    type: 'object',
    properties: { c: { type: 'string', default: 'y' } },
    dependencies: { c: { properties: { a2: { $ref: D('A') } } } },
  };
  const ab = { a: 'x', b: { c: 'y', a2: { a: 'x', b: { c: 'y' } } } };

  it.each<[string, RJSFSchema, DefaultFormStateBehavior | undefined, unknown]>([
    [
      'an allOf declaring the recursive property (#5500)',
      nodeWith({ type: 'object', allOf: [{ properties: { x: ref } }] }),
      populate,
      { name: 'n', child: { x: { name: 'n' } } },
    ],
    [
      'an allOf declaring the recursive items (#5500)',
      nodeWith({ type: 'array', minItems: 1, allOf: [{ items: ref }] }),
      populate,
      { name: 'n', child: [{ name: 'n', child: [undefined] }] },
    ],
    [
      'a then declaring the recursive property (#5500)',
      nodeWith({ type: 'object', if: {}, then: { properties: { x: ref } } }),
      undefined,
      { name: 'n', child: { x: { name: 'n' } } },
    ],
    [
      'array items whose then declares the recursive property (#5500)',
      nodeWith({ type: 'array', minItems: 1, items: { type: 'object', if: {}, then: { properties: { x: ref } } } }),
      undefined,
      { name: 'n', child: [{ x: { name: 'n', child: [{}] } }] },
    ],
    [
      'a dependencies entry that is the recursive $ref (#5500)',
      nodeWith({ type: 'object', properties: { x: { type: 'string', default: 'x' } }, dependencies: { x: ref } }),
      undefined,
      { name: 'n', child: { x: 'x', name: 'n', child: { x: 'x' } } },
    ],
    [
      'a dependencies entry declaring the recursive property (#5500)',
      nodeWith({
        type: 'object',
        properties: { x: { type: 'string', default: 'x' } },
        dependencies: { x: { properties: { y: ref } } },
      }),
      undefined,
      { name: 'n', child: { x: 'x', y: { name: 'n', child: { x: 'x' } } } },
    ],
    ['an allOf that is the recursive $ref', nodeWith({ allOf: [ref] }), populate, { name: 'n', child: { name: 'n' } }],
    [
      'a then that is the recursive $ref',
      nodeWith({ type: 'object', if: {}, then: ref }),
      undefined,
      { name: 'n', child: { name: 'n' } },
    ],
    ['two definitions whose dependencies refer to each other', { definitions: { A, B }, $ref: D('A') }, undefined, ab],
    [
      'the same two definitions as array items',
      {
        definitions: { A, B },
        type: 'object',
        properties: { arr: { type: 'array', minItems: 1, items: { $ref: D('A') } } },
      },
      undefined,
      { arr: [ab] },
    ],
    [
      'two definitions whose patterns match the keys referring to each other (#5452 a)',
      {
        definitions: {
          x: { type: 'object', properties: { y: { $ref: D('y') } }, patternProperties: { '^y': { title: 'Y' } } },
          y: { type: 'object', properties: { x: { $ref: D('x') } }, patternProperties: { '^x': { title: 'X' } } },
        },
        $ref: D('x'),
      },
      undefined,
      {},
    ],
    [
      'an allOf entry declaring a recursive property its own pattern matches (#5452 b)',
      {
        definitions: {
          node: {
            type: 'object',
            allOf: [
              { properties: { child: ref, name: { type: 'string' } }, patternProperties: { '^child': { title: 'C' } } },
            ],
          },
        },
        $ref: D('node'),
      },
      undefined,
      {},
    ],
    [
      'an allOf that adds a default to the recursive $ref',
      nodeWith({ allOf: [ref, { properties: { extra: { type: 'string', default: 'e' } } }] }),
      populate,
      { name: 'n', child: { name: 'n', extra: 'e', child: { extra: 'e' } } },
    ],
  ])('terminates on a recursion through %s, stopping where it comes back round', (_, schema, behavior, expected) => {
    const defaults = defaultsOf(schema, undefined, behavior);
    expect(defaults).toEqual(expected);
    expect(defaultsOf(schema, defaults, behavior)).toEqual(expected);
  });

  describe('a recursion through an option list a merge rebuilt', () => {
    const optA: RJSFSchema = { properties: { next: { $ref: D('node') }, a: { type: 'string', default: 'x' } } };
    const optB: RJSFSchema = { properties: { b: { type: 'string' } } };
    const optC: RJSFSchema = { properties: { c: { type: 'string', default: 'c' } } };
    const optD: RJSFSchema = { properties: { d: { type: 'string' } } };
    // A merge that copies what it merges, as a `customMergeAllOf` may, hands back a list no node declares
    const copyingMerge = (schema: RJSFSchema): RJSFSchema => {
      const { allOf = [], ...rest } = schema;
      return allOf.reduce<RJSFSchema>(
        (merged, member) => (isObject(member) ? { ...merged, ...structuredClone(member) } : merged),
        structuredClone(rest),
      );
    };
    const twoLists = { next: { a: 'x', c: 'c' }, a: 'x', c: 'c' };
    it.each<[string, RJSFSchema, unknown]>([
      [
        'an object, merged with its field',
        { type: 'object', properties: { k: { type: 'string', default: 'k' } }, allOf: [{ anyOf: [true, optB] }] },
        { k: 'k' },
      ],
      ['any other field, rendered alone', { allOf: [{ anyOf: [true, { type: 'string', default: 's' }] }] }, undefined],
    ])(
      'reads a boolean option of a list a customMergeAllOf copied as the schema it stands for, for %s',
      (_, schema, expected) => {
        const context = { validator, defaultFormStateBehavior: populate, customMergeAllOf: copyingMerge };
        expect(getDefaultFormState(context, { schema, rootSchema: schema })).toEqual(expected);
      },
    );

    it.each<[string, RJSFSchema, DefaultFormStateBehavior | undefined, Partial<SchemaContext>, unknown]>([
      [
        'a $ref with an anyOf beside it whose target has an anyOf',
        {
          definitions: {
            node: {
              type: 'object',
              anyOf: [{ properties: { a: { type: 'string', default: 'x' } } }, optB],
              properties: { next: { $ref: D('node'), anyOf: [optC, optD] } },
            },
          },
          $ref: D('node'),
        },
        undefined,
        {},
        { next: { c: 'c', a: 'x' }, a: 'x' },
      ],
      [
        'an allOf of two option lists beside an if',
        {
          definitions: {
            node: {
              type: 'object',
              if: { properties: { k: { const: 'z' } } },
              then: { properties: { t: { type: 'string' } } },
              allOf: [{ anyOf: [optA, optB] }, { anyOf: [optC, optD] }],
            },
          },
          $ref: D('node'),
        },
        undefined,
        {},
        twoLists,
      ],
      [
        'an allOf of two option lists',
        {
          definitions: { node: { type: 'object', allOf: [{ anyOf: [optA, optB] }, { anyOf: [optC, optD] }] } },
          $ref: D('node'),
        },
        { allOf: 'populateDefaults' },
        {},
        twoLists,
      ],
      [
        'one list a customMergeAllOf copied',
        { definitions: { node: { type: 'object', allOf: [{ anyOf: [optA, optB] }] } }, $ref: D('node') },
        { allOf: 'populateDefaults' },
        { customMergeAllOf: copyingMerge },
        { next: { a: 'x' }, a: 'x' },
      ],
      [
        'a list a dependency brings, written in place',
        {
          definitions: {
            node: {
              type: 'object',
              properties: { name: { type: 'string', default: 'n' } },
              dependencies: { name: { anyOf: [{ properties: { next: { $ref: D('node') } } }, optB] } },
            },
          },
          $ref: D('node'),
        },
        undefined,
        {},
        { name: 'n', next: { name: 'n' } },
      ],
      [
        'a list a dependency brings through a $ref',
        {
          definitions: {
            node: {
              type: 'object',
              properties: { name: { type: 'string', default: 'n' } },
              dependencies: { name: { $ref: D('options') } },
            },
            options: { anyOf: [{ properties: { next: { $ref: D('node') } } }, optB] },
          },
          $ref: D('node'),
        },
        undefined,
        {},
        { name: 'n', next: { name: 'n' } },
      ],
    ])(
      'terminates on %s, expanding the recursion once as through a list the plan met',
      (_, schema, behavior, context, expected) => {
        const defaults = getDefaultFormState(
          { validator, defaultFormStateBehavior: behavior, ...context },
          { schema, rootSchema: schema },
        );
        expect(defaults).toEqual(expected);
      },
    );
  });

  it('gives nothing for an anyOf option that refers back to the schema offering it, and the other option for its data', () => {
    const schema: RJSFSchema = {
      definitions: { node: { anyOf: [ref, { type: 'object', properties: { x: { type: 'string', default: 'x' } } }] } },
      $ref: D('node'),
    };
    expect(defaultsOf(schema)).toBeUndefined();
    expect(defaultsOf(schema, { x: 'x' })).toEqual({ x: 'x' });
  });

  it('fills the property a definition at the root recurses through by its then, as under a property', () => {
    const definitions: RJSFSchema['definitions'] = {
      Pet: {
        type: 'object',
        properties: { petType: { type: 'string', default: 'cat' }, friend: { $ref: D('Pet') } },
        if: { properties: { petType: { const: 'cat' } } },
        then: { $ref: D('Cat') },
      },
      Cat: { allOf: [{ $ref: D('Pet') }, { type: 'object', properties: { hunts: { type: 'string', default: 'h' } } }] },
    };
    const pet = { petType: 'cat', hunts: 'h', friend: { petType: 'cat', hunts: 'h' } };
    expect(defaultsOf({ definitions, $ref: D('Pet') })).toEqual(pet);
    expect(defaultsOf({ definitions, type: 'object', properties: { p: { $ref: D('Pet') } } })).toEqual({ p: pet });
  });

  it('gives an empty object for a definition that merges a schema which merges it back in, with no data', () => {
    const schema: RJSFSchema = {
      definitions: {
        Pet: {
          type: 'object',
          properties: { petType: { type: 'string' } },
          if: { properties: { petType: { const: 'cat' } } },
          then: { $ref: D('Cat') },
        },
        Cat: { allOf: [{ $ref: D('Pet') }, { type: 'object', properties: { hunts: { type: 'boolean' } } }] },
      },
      $ref: D('Cat'),
    };
    expect(defaultsOf(schema)).toEqual({});
  });

  it('fills a recursive array whose minItems sits in an allOf to the depth of one whose minItems sits beside its items', () => {
    const pl: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'x' }, child: { $ref: D('pl') } },
    };
    const withArray = (arr: RJSFSchema): RJSFSchema => ({ definitions: { pl }, type: 'object', properties: { arr } });
    const expected = { arr: [{ a: 'x', child: { a: 'x' } }] };
    expect(
      defaultsOf(withArray({ type: 'array', allOf: [{ minItems: 1 }], items: { $ref: D('pl') } }), undefined, populate),
    ).toEqual(expected);
    expect(
      defaultsOf(withArray({ type: 'array', minItems: 1, items: { $ref: D('pl') } }), undefined, populate),
    ).toEqual(expected);
  });

  it('fills the keys of the data an additionalProperties or pattern recursion matches down to where the schema stops', () => {
    const map: RJSFSchema = {
      definitions: {
        map: {
          type: 'object',
          properties: { name: { type: 'string', default: 'm' } },
          additionalProperties: { $ref: D('map') },
        },
      },
      $ref: D('map'),
    };
    expect(defaultsOf(map, { k: { j: { i: {} } } })).toEqual({ name: 'm', k: { name: 'm', j: { i: {} } } });
    const pattern: RJSFSchema = {
      definitions: {
        node: {
          type: 'object',
          properties: { n: { type: 'string', default: 'n' } },
          patternProperties: { '^c': { $ref: D('node') } },
        },
      },
      $ref: D('node'),
    };
    expect(defaultsOf(pattern, { c1: { c2: { c3: { c4: {} } } } })).toEqual({
      n: 'n',
      c1: { n: 'n', c2: { c3: { c4: {} } } },
    });
  });

  it("fills a recursive property a pattern matches once, with the pattern's defaults at the collapse", () => {
    const schema: RJSFSchema = {
      definitions: {
        node: {
          type: 'object',
          properties: { child: { $ref: D('node') } },
          patternProperties: { '^c': { type: 'object', properties: { tag: { oneOf: [{ const: 'p' }] } } } },
        },
      },
      $ref: D('node'),
    };
    const defaults = defaultsOf(schema);
    expect(defaults).toEqual({ child: { tag: 'p', child: { tag: 'p' } } });
    expect(defaultsOf(schema, defaults)).toEqual(defaults);
  });

  it('gives the same defaults on every call for the keys a recursive default object names', () => {
    const schema: RJSFSchema = {
      definitions: {
        map: {
          type: 'object',
          properties: { name: { type: 'string', default: 'm' } },
          additionalProperties: { $ref: D('map') },
          default: { k: {} },
        },
      },
      $ref: D('map'),
    };
    const expected = { name: 'm', k: { name: 'm' } };
    let defaults = defaultsOf(schema);
    expect(defaults).toEqual(expected);
    for (let call = 0; call < 3; call += 1) {
      defaults = defaultsOf(schema, defaults);
      expect(defaults).toEqual(expected);
    }
  });

  it("fills the keywords beside a recursive $ref together with its target's at every level, as the form renders them", () => {
    const schema: RJSFSchema = {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'n' },
            child: { $ref: D('node'), properties: { own: { type: 'string', default: 'o' } } },
          },
        },
      },
      $ref: D('node'),
    };
    // The recursion collapses below `child`, which keeps the keywords beside its `$ref`
    expect(defaultsOf(schema)).toEqual({ name: 'n', child: { own: 'o', name: 'n', child: { own: 'o' } } });
  });

  it('stops a recursion through a percent-encoded $ref where the same $ref written plainly stops', () => {
    const withChild = (ref: string): RJSFSchema => ({
      definitions: {
        A: { type: 'object', properties: { name: { type: 'string', default: 'n' }, child: { $ref: ref } } },
      },
      $ref: D('A'),
    });
    expect(defaultsOf(withChild('#/definitions/%41'))).toEqual({ name: 'n', child: { name: 'n' } });
    expect(defaultsOf(withChild(D('A')))).toEqual({ name: 'n', child: { name: 'n' } });
  });

  it('stops a recursion through a chain of aliases where its first alias enters the definition again', () => {
    const schema: RJSFSchema = {
      definitions: {
        node: { type: 'object', properties: { n: { type: 'string', default: 'n' }, c: { $ref: D('A1') } } },
        A1: { $ref: D('A2') },
        A2: { $ref: D('node') },
      },
      $ref: D('node'),
    };
    expect(defaultsOf(schema)).toEqual({ n: 'n', c: { n: 'n' } });
  });

  it('fills three levels for a root that is the recursive definition and two for a $ref to it', () => {
    const pl: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'x' }, child: { $ref: '#' } },
    };
    expect(defaultsOf(pl)).toEqual({ a: 'x', child: { a: 'x', child: { a: 'x' } } });
    const definition: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'x' }, child: { $ref: D('pl') } },
    };
    expect(defaultsOf({ definitions: { pl: definition }, $ref: D('pl') })).toEqual({ a: 'x', child: { a: 'x' } });
  });
});

describe('getDefaultFormState() reading $ref, branches and extra keys as the form does', () => {
  const draft2020 = 'https://json-schema.org/draft/2020-12/schema';
  const S: RJSFSchema = { type: 'string', default: 'def' };
  const O: RJSFSchema = {
    type: 'object',
    properties: { a: { type: 'string' }, b: { type: 'string' } },
    default: { a: 'da', b: 'db' },
    required: ['b'],
  };

  it('gives a property without a type the defaults of the branch its then supplies', () => {
    expect(
      defaultsOf({
        definitions: { S },
        type: 'object',
        properties: { p: { if: {}, then: { $ref: D('S'), default: 'sib' } } },
      }),
    ).toEqual({ p: 'sib' });
    expect(
      defaultsOf({
        definitions: { O },
        type: 'object',
        properties: { p: { if: {}, then: { $ref: D('O'), required: ['a'] } } },
      }),
    ).toEqual({ p: { a: 'da', b: 'db' } });
  });

  it('lets a default beside the $ref of a tuple entry or of additionalItems override the target', () => {
    const s: RJSFSchema = { type: 'string', default: 'target' };
    const schema: RJSFSchema = {
      definitions: { s },
      type: 'object',
      properties: {
        t: { type: 'array', items: [{ $ref: D('s'), default: 'beside' }, { $ref: D('s') }] },
        x: {
          type: 'array',
          minItems: 2,
          items: [{ type: 'string' }],
          additionalItems: { $ref: D('s'), default: 'beside' },
        },
      },
    };
    expect(defaultsOf(schema)).toEqual({ t: ['beside', 'target'], x: [undefined, 'beside'] });
  });

  it('fills the keywords beside a $ref another $ref reaches together with its target, whatever the allOf behavior', () => {
    const definitions: RJSFSchema['definitions'] = {
      O: { properties: { a: { type: 'string', default: 'a' } } },
      M: { $ref: D('O'), properties: { b: { type: 'string', default: 'b' } } },
    };
    const schema: RJSFSchema = { definitions, type: 'object', properties: { v: { $ref: D('M') } } };
    expect(defaultsOf(schema)).toEqual({ v: { b: 'b', a: 'a' } });
    expect(defaultsOf(schema, undefined, populate)).toEqual({ v: { b: 'b', a: 'a' } });
  });

  it.each(['https://json-schema.org/draft/2019-09/schema', draft2020])(
    "under %s, fills a field's own $ref with keywords beside it as the allOf of both, as where another $ref reaches it",
    ($schema) => {
      const Pet: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string', default: 'n' } },
        required: ['name'],
      };
      const meow: RJSFSchema = {
        properties: { meow: { type: 'string', default: 'm' } },
        if: { properties: { meow: { const: 'm' } } },
        then: { properties: { t: { type: 'string', default: 't' } } },
      };
      const inPlace: RJSFSchema = {
        $schema,
        $defs: { Pet },
        type: 'object',
        properties: { cat: { $ref: '#/$defs/Pet', ...meow } },
      };
      const reached: RJSFSchema = {
        $schema,
        $defs: { Pet, Cat: { $ref: '#/$defs/Pet', ...meow } },
        type: 'object',
        properties: { cat: { $ref: '#/$defs/Cat' } },
      };
      const filled = { cat: { meow: 'm', t: 't', name: 'n' } };
      const populate: DefaultFormStateBehavior = { allOf: 'populateDefaults' };
      expect(defaultsOf(inPlace, undefined, populate)).toEqual(filled);
      expect(defaultsOf(reached, undefined, populate)).toEqual(filled);
      const skipEmpty: DefaultFormStateBehavior = { ...populate, emptyObjectFields: 'skipEmptyDefaults' };
      expect(defaultsOf(inPlace, undefined, skipEmpty)).toEqual(filled);
      expect(defaultsOf(reached, undefined, skipEmpty)).toEqual(filled);
      expect(defaultsOf(inPlace)).toEqual(defaultsOf(reached));
    },
  );

  it.each([undefined, 'https://json-schema.org/draft/2019-09/schema', draft2020])(
    'under %s, fills a $ref beside only annotations as its target, in place, reached through a $ref and as an option',
    ($schema) => {
      const Pet: RJSFSchema = { type: 'object', properties: { name: { type: 'string', default: 'n' } } };
      const annotations = { title: 'My pet', description: 'd', examples: [{}], deprecated: false, readOnly: false };
      const dialect = $schema === undefined ? {} : { $schema };
      const inPlace: RJSFSchema = {
        ...dialect,
        $defs: { Pet },
        type: 'object',
        properties: { p: { $ref: '#/$defs/Pet', ...annotations } },
      };
      const reached: RJSFSchema = {
        ...dialect,
        $defs: { Pet, Named: { $ref: '#/$defs/Pet', ...annotations } },
        type: 'object',
        properties: { p: { $ref: '#/$defs/Named' } },
      };
      const option: RJSFSchema = {
        ...dialect,
        $defs: { Pet },
        type: 'object',
        properties: {
          p: {
            oneOf: [
              { $ref: '#/$defs/Pet', title: 'Pet' },
              { type: 'object', title: 'None' },
            ],
          },
        },
      };
      expect(defaultsOf(inPlace)).toEqual({ p: { name: 'n' } });
      expect(defaultsOf(reached)).toEqual({ p: { name: 'n' } });
      expect(defaultsOf(option)).toEqual({ p: { name: 'n' } });
      const withDefault: RJSFSchema = {
        $defs: { Pet },
        properties: { p: { $ref: '#/$defs/Pet', default: { name: 'd' } } },
      };
      expect(defaultsOf({ ...dialect, ...withDefault })).toEqual(defaultsOf(withDefault));
    },
  );

  it.each([undefined, 'https://json-schema.org/draft/2019-09/schema', draft2020])(
    'under %s, fills the then of an if beside a $ref under the default allOf behavior, as the form renders it',
    ($schema) => {
      const dialect = $schema === undefined ? {} : { $schema };
      const Base: RJSFSchema = { type: 'object', properties: { k: { type: 'string', default: 'x' } } };
      const condition: RJSFSchema = {
        if: { properties: { k: { const: 'x' } } },
        then: { properties: { t: { type: 'string', default: 't' } } },
      };
      const inPlace: RJSFSchema = {
        ...dialect,
        $defs: { Base, T: true },
        type: 'object',
        properties: { p: { $ref: '#/$defs/Base', ...condition }, b: { $ref: '#/$defs/T', minProperties: 0 } },
      };
      const reached: RJSFSchema = {
        ...dialect,
        $defs: { Base, Conditioned: { $ref: '#/$defs/Base', ...condition } },
        type: 'object',
        properties: { p: { $ref: '#/$defs/Conditioned' } },
      };
      const inherited: RJSFSchema = {
        ...dialect,
        $defs: { Conditioned: { ...Base, ...condition } },
        type: 'object',
        properties: { p: { $ref: '#/$defs/Conditioned', required: ['k'] } },
      };
      expect(defaultsOf(inPlace)).toEqual({ p: { k: 'x', t: 't' } });
      expect(defaultsOf(reached)).toEqual({ p: { k: 'x', t: 't' } });
      expect(defaultsOf(inherited)).toEqual({ p: { k: 'x', t: 't' } });
    },
  );

  describe('a property a branch declares again', () => {
    const branchProperties: RJSFSchema['properties'] = {
      o: { default: { y: 2 } },
      n: { properties: { j: { type: 'string', default: 'bj' } } },
      k: { const: { d: 2 } },
    };
    const properties: RJSFSchema['properties'] = {
      a: { type: 'string', default: 'x' },
      o: { default: { x: 1 } },
      n: { type: 'object', properties: { i: { type: 'string', default: 'bi' } } },
      k: { type: 'object', const: { c: 1 }, properties: { c: {} } },
    };
    const shapes: [string, RJSFSchema][] = [
      [
        'then',
        {
          type: 'object',
          properties,
          if: { properties: { a: { const: 'x' } } },
          then: { properties: branchProperties },
        },
      ],
      ['dependencies', { type: 'object', properties, dependencies: { a: { properties: branchProperties } } }],
      ['oneOf', { type: 'object', properties, oneOf: [{ properties: branchProperties }] }],
    ];
    it.each(shapes)('is merged from a %s as the branch is merged into the field, the branch winning', (_, schema) => {
      const defaults = defaultsOf(schema);
      expect(defaults).toEqual({ a: 'x', o: { x: 1, y: 2 }, n: { i: 'bi', j: 'bj' }, k: { c: 1 } });
      expect(isObject(defaults) && isObject(defaults.n) ? Object.keys(defaults.n) : []).toEqual(['i', 'j']);
    });
    it('renders in the order and with the default the field it is merged into shows', () => {
      const [, schema] = shapes[0];
      const schemaUtils = createSchemaUtils({ validator }, schema);
      const view = schemaUtils.retrieveSchema(schema, { a: 'x' });
      const propertyOf = (key: string, data?: unknown) => {
        const property = view.properties?.[key];
        return schemaUtils.retrieveSchema(typeof property === 'object' ? property : {}, data);
      };
      expect(Object.keys(propertyOf('n', {}).properties ?? {})).toEqual(['i', 'j']);
      expect(propertyOf('o').default).toEqual({ x: 1, y: 2 });
    });
  });

  describe('an option chosen at the root', () => {
    const withOption = (option: RJSFSchema, beside: RJSFSchema = {}) => ({
      root: { type: 'object', ...beside, oneOf: [option] } satisfies RJSFSchema,
      property: {
        type: 'object',
        properties: { p: { type: 'object', ...beside, oneOf: [option] } },
      } satisfies RJSFSchema,
    });
    it("follows allOf: 'skipDefaults' for its allOf as under a property, the root's own allOf merged", () => {
      const option: RJSFSchema = {
        allOf: [{ properties: { a: { default: 'A' } } }, { properties: { b: { default: 'B' } } }],
      };
      const { root, property } = withOption(option);
      expect(defaultsOf(root, {})).toEqual({});
      expect(defaultsOf(property, {})).toEqual({});
      const own = withOption(option, { allOf: [{ properties: { r: { type: 'string', default: 'R' } } }] });
      expect(defaultsOf(own.root, {})).toEqual({ r: 'R' });
    });
    it("follows emptyObjectFields: 'skipEmptyDefaults' for its if as under a property", () => {
      const { root, property } = withOption({ if: true, then: { properties: { t: { default: 'T' } } } });
      const behavior: DefaultFormStateBehavior = { emptyObjectFields: 'skipEmptyDefaults' };
      expect(defaultsOf(root, {}, behavior)).toEqual({});
      expect(defaultsOf(property, {}, behavior)).toEqual({});
    });
  });

  it.each<[string, RJSFSchema]>([
    [
      'an object default a branch merges',
      {
        type: 'object',
        properties: { o: { default: { x: 1 } } },
        if: true,
        then: { properties: { o: { default: { y: 2 } } } },
      },
    ],
    ['an array default', { type: 'object', properties: { o: { type: 'array', default: [{ x: 1 }] } } }],
    ['an object const', { type: 'object', properties: { o: { const: { x: [1] } } } }],
    [
      'the constant of a select over objects',
      { type: 'object', properties: { o: { type: 'object', oneOf: [{ const: { x: 1 } }] } }, required: ['o'] },
    ],
  ])('hands out %s as a copy, which the caller can change without changing later calls', (_, schema) => {
    const pristine = structuredClone(schema);
    const first = defaultsOf(schema);
    const expected = structuredClone(first);
    const pending: unknown[] = [first];
    for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
      if (Array.isArray(next)) {
        pending.push(...next);
        next.push('changed');
      } else if (isObject(next)) {
        pending.push(...Object.values(next));
        next.changed = true;
      }
    }
    expect(defaultsOf(schema)).toEqual(expected);
    expect(schema).toEqual(pristine);
  });

  it('copies a default held in a proxy, as an observable store holds one, and hands a class instance through', () => {
    class Money {
      readonly amount = 5;
    }
    const money = new Money();
    const shared = { a: 1 };
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        list: { type: 'array', items: { type: 'string' }, default: new Proxy(['x', 'y'], {}) },
        map: { type: 'object', properties: { a: { type: 'number' } }, default: new Proxy({ a: 1 }, {}) },
        price: looseSchema({ default: money }),
        pair: { type: 'array', default: [shared, shared] },
      },
    };
    const defaults = defaultsOf(schema);
    expect(defaults).toEqual({ list: ['x', 'y'], map: { a: 1 }, price: money, pair: [shared, shared] });
    expect(isObject(defaults) && defaults.price).toBe(money);
    // A value met twice is copied once, as `structuredClone()` copies it
    const pair: unknown = isObject(defaults) ? defaults.pair : undefined;
    expect(Array.isArray(pair) && pair[0] === pair[1] && pair[0] !== shared).toBe(true);
  });

  it('resolves a $ref to an $anchor, and one under a nested $id with a path segment against that $id', () => {
    const target: RJSFSchema = { type: 'object', properties: { v: { type: 'string', default: 'v' } } };
    const anchored = { ...target, $anchor: 'nodeA' };
    expect(
      defaultsOf({
        $schema: draft2020,
        $id: 'https://example.com/root',
        $defs: { n: anchored },
        type: 'object',
        properties: { p: { $ref: '#nodeA' } },
      }),
    ).toEqual({ p: { v: 'v' } });
    expect(
      defaultsOf({
        $schema: draft2020,
        $id: 'https://example.com/root.json',
        $defs: {
          c: {
            $id: 'sub/c.json',
            type: 'object',
            properties: { w: { $ref: '#/$defs/w' } },
            $defs: { w: { type: 'string', default: 'w' } },
          },
        },
        type: 'object',
        properties: { p: { $ref: 'sub/c.json' } },
      }),
    ).toEqual({ p: { w: 'w' } });
  });

  it('takes the schema as its own root without a rootSchema, whatever the data', () => {
    const schema: RJSFSchema = {
      definitions: { a: { type: 'string', default: 'x' } },
      type: 'object',
      properties: { p: { $ref: D('a') }, q: { type: 'string' } },
    };
    expect(getDefaultFormState({ validator }, { schema })).toEqual({ p: 'x' });
    expect(getDefaultFormState({ validator }, { schema, formData: { q: '1' } })).toEqual({ p: 'x', q: '1' });
  });

  it('follows the allOf behavior for an allOf behind the $ref of an extra key, as behind a property', () => {
    const allOfMap: RJSFSchema = {
      definitions: { A: { allOf: [{ type: 'object', properties: { a: { type: 'string', default: 'a' } } }] } },
      type: 'object',
      patternProperties: { '^p': { $ref: D('A') } },
      additionalProperties: { $ref: D('A') },
    };
    expect(defaultsOf(allOfMap, { k: {}, pk: {} })).toEqual({ k: {}, pk: {} });
    expect(defaultsOf(allOfMap, { k: {}, pk: {} }, populate)).toEqual({ k: { a: 'a' }, pk: { a: 'a' } });
    const inheritanceMap: RJSFSchema = {
      $schema: draft2020,
      $defs: {
        O: { type: 'object', properties: { a: { type: 'string', default: 'a' } } },
        M: { $ref: '#/$defs/O', properties: { b: { type: 'string', default: 'b' } } },
      },
      type: 'object',
      additionalProperties: { $ref: '#/$defs/M' },
    };
    // The keywords beside a `$ref` are no `allOf` the schema declares, so they are filled whatever the behavior
    expect(defaultsOf(inheritanceMap, { k: {} })).toEqual({ k: { a: 'a', b: 'b' } });
    expect(defaultsOf(inheritanceMap, { k: {} }, populate)).toEqual({ k: { a: 'a', b: 'b' } });
  });

  it('applies a dependencies entry merged from an allOf once a default qualifies it, under populateDefaults', () => {
    const dependencies: RJSFSchema['dependencies'] = { a: { properties: { c: { type: 'string', default: 'c' } } } };
    const withA: RJSFSchema = { type: 'object', properties: { a: { type: 'string', default: 'x' } } };
    const schema: RJSFSchema = {
      type: 'object',
      properties: { p: { allOf: [{ dependencies }, withA] }, q: { allOf: [{ ...withA, dependencies }] } },
    };
    expect(defaultsOf(schema, undefined, populate)).toEqual({ p: { a: 'x', c: 'c' }, q: { a: 'x', c: 'c' } });
    expect(defaultsOf(schema)).toEqual({});
    const chain: RJSFSchema = {
      $schema: draft2020,
      $defs: { O: withA, M: { $ref: '#/$defs/O', dependencies } },
      type: 'object',
      properties: { p: { $ref: '#/$defs/M' } },
    };
    expect(defaultsOf(chain, undefined, populate)).toEqual({ p: { a: 'x', c: 'c' } });
  });

  it("checks an array's if against its own data in the helpers, as computeDefaults() does", () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: { type: 'string', default: 'x' },
      if: { minItems: 2 },
      then: { minItems: 3 },
      else: { minItems: 1 },
    };
    const context = { validator };
    const props = { rootSchema: schema, rawFormData: ['a'] };
    expect(computeDefaults(context, schema, props)).toEqual(['x']);
    expect(getDefaultBasedOnSchemaType(context, schema, props)).toEqual(['x']);
    expect(getArrayDefaults(context, schema, props)).toEqual(['x']);
  });

  it('hands computeSkipPopulate the array with its items written as a $ref read as the definition they name', () => {
    const schema: RJSFSchema = {
      definitions: { num: { type: 'number' } },
      type: 'object',
      properties: {
        strings: { type: 'array', items: { type: 'string' }, minItems: 1 },
        numbers: { type: 'array', items: { $ref: '#/definitions/num' }, minItems: 1 },
      },
      required: ['strings', 'numbers'],
    };
    const computeSkipPopulate = (_context: unknown, array: RJSFSchema) =>
      isObject(array.items) && !Array.isArray(array.items) && array.items.type === 'number';
    expect(defaultsOf(schema, undefined, { arrayMinItems: { computeSkipPopulate } })).toEqual({
      strings: [undefined],
      numbers: [],
    });
  });

  it("merges the allOf and the if of the option a field picks as the field's own", () => {
    const option: RJSFSchema = {
      if: { properties: { k: { const: 'x' } } },
      then: { properties: { t: { type: 'string', default: 'T' } } },
      allOf: [{ properties: { m: { type: 'string', default: 'M' } } }],
    };
    const field: RJSFSchema = {
      type: 'object',
      properties: { k: { type: 'string', default: 'x' } },
      anyOf: [option, { properties: { z: { type: 'string' } } }],
    };
    expect(defaultsOf(field, { k: 'x' })).toEqual({ k: 'x', t: 'T', m: 'M' });
    expect(defaultsOf({ type: 'object', properties: { p: field } }, { p: { k: 'x' } })).toEqual({
      p: { k: 'x', t: 'T', m: 'M' },
    });
    expect(
      defaultsOf(
        { type: 'object', properties: { p: field } },
        { p: { k: 'x' } },
        {
          emptyObjectFields: 'skipEmptyDefaults',
          allOf: 'populateDefaults',
        },
      ),
    ).toEqual({ p: { k: 'x', t: 'T', m: 'M' } });
  });

  it("merges a field's allOf for an if any of its declarations holds, whichever is merged first", () => {
    const withIf: RJSFSchema = {
      type: 'object',
      properties: { q: { type: 'string' } },
      if: { required: ['zzz'] },
      then: {},
      else: {},
    };
    const withAllOf: RJSFSchema = { allOf: [{ properties: { r: { type: 'string', default: 'R' } } }] };
    const declaredBy = (own: RJSFSchema, branch: RJSFSchema): RJSFSchema => ({
      type: 'object',
      properties: { p: own },
      if: { required: [] },
      then: { properties: { p: branch } },
    });
    expect(defaultsOf(declaredBy(withIf, withAllOf), {})).toEqual({ p: { r: 'R' } });
    expect(defaultsOf(declaredBy({ ...withIf, ...withAllOf }, { if: { required: ['zzz'] } }), {})).toEqual({
      p: { r: 'R' },
    });
    expect(defaultsOf(declaredBy({ type: 'object', ...withAllOf }, withIf), {})).toEqual({ p: { r: 'R' } });
  });

  it('gives a property the default of the option an allOf entry chooses over an earlier entry, nested as at the root, under populateDefaults', () => {
    const object: RJSFSchema = {
      type: 'object',
      allOf: [
        { properties: { c: { type: 'string', default: 'm0' } } },
        {
          oneOf: [{ properties: { c: { type: 'string', default: 'opt' } } }, { properties: { z: { type: 'number' } } }],
        },
      ],
    };
    expect(defaultsOf(object, undefined, populate)).toEqual({ c: 'opt' });
    expect(defaultsOf({ type: 'object', properties: { o: object } }, undefined, populate)).toEqual({
      o: { c: 'opt' },
    });
  });

  describe('a subschema keywords beside a $ref declare again, merged with the one a resource of its own declares', () => {
    // The resource's `#/$defs/s` names its own definition, which the root names nothing by, or another one by `homonym`
    const rootOf = (property: RJSFSchema, s: RJSFSchema, resource: RJSFSchema, homonym?: RJSFSchema): RJSFSchema => ({
      $schema: draft2020,
      $id: 'https://example.com/root.json',
      $defs: {
        ...(homonym === undefined ? {} : { s: homonym }),
        res: { $id: 'res.json', ...resource, $defs: { s, ...resource.$defs } },
      },
      type: 'object',
      properties: { p: property },
    });
    const select: RJSFSchema = { type: 'string', default: 'r', enum: ['r', 'q'] };
    const list: RJSFSchema = { type: 'array', items: { $ref: '#/$defs/s' } };
    it("reads a property's $ref in the resource", () => {
      const schema = rootOf(
        { $ref: 'res.json', properties: { k: { title: 'K' } } },
        { const: 'c' },
        { type: 'object', properties: { k: { $ref: '#/$defs/s' } } },
      );
      expect(defaultsOf(schema, undefined, { emptyObjectFields: 'skipEmptyDefaults' })).toEqual({ p: { k: 'c' } });
    });
    it.each<[string, unknown]>([
      ['the value it names', { p: { k: 'c' } }],
      ['no value for it', { p: {} }],
    ])("reads a property's $ref in the resource for data holding %s", (_, formData) => {
      const schema = rootOf(
        { $ref: 'res.json', properties: { k: { title: 'K' } } },
        { const: 'c' },
        { type: 'object', properties: { k: { $ref: '#/$defs/s' } } },
      );
      expect(defaultsOf(schema, formData)).toEqual({ p: { k: 'c' } });
    });
    it.each<[string, RJSFSchema, unknown, unknown, DefaultFormStateBehavior | undefined]>([
      [
        'a $ref to it, data it names',
        { $ref: 'res.json#/$defs/o', properties: { k: { title: 'K' } } },
        { p: { k: 'c' } },
        { p: { k: 'c' } },
        undefined,
      ],
      [
        'a $ref to it, data it does not name',
        { $ref: 'res.json#/$defs/o', properties: { k: { title: 'K' } } },
        { p: { k: 'x' } },
        { p: { k: 'x' } },
        undefined,
      ],
      [
        'an allOf entry naming it, populated',
        { allOf: [{ $ref: 'res.json#/$defs/o' }, { properties: { k: { title: 'K' } } }] },
        { p: {} },
        { p: { k: 'c' } },
        populate,
      ],
    ])(
      "reads a property's $ref in the resource for a definition the resource holds, by %s",
      (_, property, formData, defaults, behavior) => {
        const resource: RJSFSchema = { $defs: { o: { type: 'object', properties: { k: { $ref: '#/$defs/s' } } } } };
        expect(defaultsOf(rootOf(property, { const: 'c' }, resource), formData, behavior)).toEqual(defaults);
      },
    );
    it.each<[string, RJSFSchema, unknown]>([
      ['filled up to minItems', { minItems: 1 }, { p: ['r'] }],
      ['a multi-select, left unfilled', { minItems: 1, uniqueItems: true }, {}],
    ])("reads the items' $ref in the resource for an array %s", (_, beside, defaults) => {
      expect(defaultsOf(rootOf({ $ref: 'res.json', items: { title: 'I' }, ...beside }, select, list))).toEqual(
        defaults,
      );
    });
    it("reads the items' $ref in the resource rather than the root's definition of the same name", () => {
      const schema = rootOf({ $ref: 'res.json', items: { title: 'I' }, minItems: 1, uniqueItems: true }, select, list, {
        type: 'string',
        default: 'root',
      });
      expect(defaultsOf(schema)).toEqual({});
    });
    const behaviors: [string, DefaultFormStateBehavior | undefined][] = [
      ['by default', undefined],
      ['populated', populate],
      ['skipping empty defaults', { emptyObjectFields: 'skipEmptyDefaults' }],
    ];
    it.each(behaviors)(
      "picks an option a dependency in the resource brings by the option's $ref there, %s",
      (_, behavior) => {
        const resource: RJSFSchema = {
          $defs: {
            o1: { properties: { x: { type: 'string', default: 'x' } } },
            o2: { properties: { y: { type: 'string', default: 'y' } } },
            o: {
              type: 'object',
              properties: { k: { type: 'string' } },
              dependencies: { k: { anyOf: [{ $ref: '#/$defs/o1' }, { $ref: '#/$defs/o2' }] } },
            },
          },
        };
        const schema = rootOf({ $ref: 'res.json#/$defs/o' }, {}, resource);
        expect(defaultsOf(schema, { p: { k: 'a' } }, behavior)).toEqual({ p: { k: 'a', x: 'x' } });
      },
    );
    it.each(behaviors.slice(0, 2))(
      'reads the $refs of an option a merge of two lists in the resource rebuilt there, %s',
      (_, behavior) => {
        const option = (key: string, beside: RJSFSchema = { $ref: '#/$defs/s' }): RJSFSchema => ({
          properties: { [key]: beside },
        });
        // An `if` beside the `allOf` has it merged, which makes the cross product of the two lists
        const resource: RJSFSchema = {
          $defs: {
            o: {
              type: 'object',
              if: {},
              then: {},
              allOf: [{ anyOf: [option('a'), option('b')] }, { anyOf: [option('a', { title: 'A' }), option('c')] }],
            },
          },
        };
        const schema = rootOf({ $ref: 'res.json#/$defs/o' }, { type: 'string', default: 's' }, resource);
        expect(defaultsOf(schema, undefined, behavior)).toEqual({ p: { a: 's' } });
        expect(defaultsOf(schema, { p: { k: 'a' } }, behavior)).toEqual({ p: { a: 's', k: 'a' } });
        expect(defaultsOf(schema, { p: { a: 'z' } }, behavior)).toEqual({ p: { a: 'z' } });
      },
    );
  });
});

describe('getDefaultFormState() termination and cost', { timeout: 30_000 }, () => {
  /** Ref cycles of coprime periods meeting under one root `allOf`, each level a property `k` merging a leaf and the
   * next definition of its cycle
   */
  function coprimeCycles(periods: number[]): RJSFSchema {
    const definitions: Record<string, RJSFSchema> = { Leaf: { type: 'object' } };
    periods.forEach((period, cycle) => {
      for (let step = 0; step < period; step += 1) {
        definitions[`C${cycle}_${step}`] = {
          type: 'object',
          properties: {
            [`n${cycle}`]: { type: 'string', default: 'n' },
            k: { allOf: [{ $ref: D('Leaf') }, { $ref: D(`C${cycle}_${(step + 1) % period}`) }] },
          },
        };
      }
    });
    return { definitions, type: 'object', allOf: periods.map((_, cycle) => ({ $ref: D(`C${cycle}_0`) })) };
  }

  /** Depth of nested `k` objects in `value` */
  function depthOfK(value: unknown): number {
    return isObject(value) && 'k' in value ? 1 + depthOfK(value.k) : 0;
  }

  it('stops chains through several cycles of definitions at a fixed depth, whatever the periods', () => {
    expect(defaultsOf(coprimeCycles([2, 3]))).toEqual({ n0: 'n', n1: 'n' });
    const twoThree = defaultsOf(coprimeCycles([2, 3]), undefined, populate);
    expect(depthOfK(twoThree)).toBe(7);
    const five = defaultsOf(coprimeCycles([2, 3, 5, 7, 11]), undefined, populate);
    expect(depthOfK(five)).toBe(25);
    expect(defaultsOf(coprimeCycles([2, 3, 5, 7, 11]), five, populate)).toEqual(five);
  });

  it('fills a chain of definitions with a dependency at every level once per level, without validating', () => {
    const depth = 32;
    const definitions: Record<string, RJSFSchema> = {};
    for (let level = 0; level < depth; level += 1) {
      definitions[`D${level}`] = {
        type: 'object',
        properties: {
          v: { type: 'string', default: 'v' },
          w: { type: 'string' },
          ...(level + 1 < depth ? { next: { $ref: D(`D${level + 1}`) } } : {}),
        },
        dependencies: { v: { properties: { w: { type: 'string', default: 'w' } } } },
      };
    }
    const expected = Array.from({ length: depth - 1 }).reduce<Record<string, unknown>>(
      (inner) => ({ v: 'v', w: 'w', next: inner }),
      { v: 'v', w: 'w' },
    );
    const counting = miniValidator();
    expect(defaultsOf({ definitions, $ref: D('D0') }, undefined, undefined, counting)).toEqual(expected);
    expect(counting.calls).toBe(0);
  });

  it('fills a chain of dependencies, each declaring the default the next one depends on, in one call', () => {
    const length = 9;
    const properties: Record<string, RJSFSchema> = { k0: { type: 'string', default: 'v' } };
    const dependencies: Record<string, RJSFSchema> = {};
    for (let key = 1; key < length; key += 1) {
      properties[`k${key}`] = { type: 'string' };
      dependencies[`k${key - 1}`] = { properties: { [`k${key}`]: { type: 'string', default: 'v' } } };
    }
    expect(defaultsOf({ type: 'object', properties, dependencies })).toEqual(
      Object.fromEntries(Array.from({ length }, (_, key) => [`k${key}`, 'v'])),
    );
  });

  describe('definitions that all refer to one another', () => {
    function dense(size: number): RJSFSchema {
      const definitions: Record<string, RJSFSchema> = {};
      for (let from = 0; from < size; from += 1) {
        const properties: Record<string, RJSFSchema> = { v: { type: 'string', default: 'v' } };
        for (let to = 0; to < size; to += 1) {
          if (to !== from) {
            properties[`p${to}`] = { $ref: D(`d${to}`) };
          }
        }
        definitions[`d${from}`] = { type: 'object', properties };
      }
      return { definitions, $ref: D('d0') };
    }
    function objectCount(value: unknown): number {
      return isObject(value) ? 1 + Object.values(value).reduce<number>((sum, child) => sum + objectCount(child), 0) : 0;
    }

    it('fills each path until a definition comes back round, and a path never past one repeat', () => {
      expect(defaultsOf(dense(3))).toMatchObject({
        v: 'v',
        p1: { v: 'v', p0: { v: 'v', p1: { v: 'v', p2: { v: 'v' } }, p2: { v: 'v', p1: { v: 'v' } } } },
      });
      expect(objectCount(defaultsOf(dense(3)))).toBe(35);
    });
    it.each([
      [4, 544],
      [5, 12_805],
    ])('fills K%i with %i objects without validating, the same again from its own output', (size, objects) => {
      const counting = miniValidator();
      const defaults = defaultsOf(dense(size), undefined, undefined, counting);
      expect(objectCount(defaults)).toBe(objects);
      expect(counting.calls).toBe(0);
      expect(defaultsOf(dense(size), defaults)).toEqual(defaults);
    });
  });
});
