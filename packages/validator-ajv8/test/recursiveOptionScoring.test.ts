/**
 * Scoring an option asserts that the form data holds at least one of the keys the option declares. An option that
 * carries an `$id` names a document that a `$ref` inside it can resolve back to -- `$ref: ''` names the document
 * itself -- so these verify that the assertion does not reach the children the option describes through such a
 * reference, where it would reject data the option itself accepts.
 *
 * Only AJV resolves a reference like that: `retrieveSchema()` has no base URI to resolve it against and throws
 * `Could not find a definition for .`, so a schema holding one reaches scoring through a direct call rather than
 * through `retrieveSchema()` or a parse. The last test covers the wrapping that scoring now does for every option
 * carrying an `$id`, which a precompiled validator has to have compiled.
 */

import type { RJSFSchema } from '@rjsf/utils';
import {
  getByPath,
  getClosestMatchingOption,
  getFirstMatchingOption,
  isPlainObject,
  retrieveSchema,
} from '@rjsf/utils';
import { Ajv2019 } from 'ajv/dist/2019.js';
import { Ajv2020 } from 'ajv/dist/2020.js';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import validator, { createPrecompiledValidator, customizeValidator } from '../src/index.ts';
import { evalValidatorCode } from './harness/compileSuperSchema.ts';

const RECURSIVE_OPTION: RJSFSchema = {
  $id: 'http://example.com/a.json',
  type: 'object',
  properties: {
    child: { $ref: '' },
    label: { type: 'string' },
  },
};
const OTHER_OPTION: RJSFSchema = { type: 'object', properties: { other: { type: 'string' } } };
const OPTIONS: RJSFSchema[] = [OTHER_OPTION, RECURSIVE_OPTION];
const SCHEMA: RJSFSchema = { oneOf: OPTIONS };

describe('scoring an option that references itself', () => {
  it.each([
    ['an empty child, which the option allows', { child: {} }],
    ['a child nested two deep', { child: { child: {} } }],
    ['a child alongside a filled-in key', { label: 'x', child: {} }],
  ])('matches the recursive option for %s', (_case, formData) => {
    expect(getFirstMatchingOption({ validator }, formData, OPTIONS, SCHEMA)).toBe(1);
  });

  it('still declines an option when the data holds none of the keys it declares', () => {
    // The assertion has to keep applying at the top level: `{}` holds nothing either option declares, so there is no
    // match to make and the first option is the documented fallback
    expect(getFirstMatchingOption({ validator }, {}, OPTIONS, SCHEMA)).toBe(0);
  });

  it('compiles and matches an option describing a map, which declares no keys to assert', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { v: { oneOf: [{ type: 'object', additionalProperties: { type: 'string' } }, { type: 'number' }] } },
    };
    const options = (schema.properties!.v as RJSFSchema).oneOf as RJSFSchema[];
    // Scoring reaches the map option after `stubExistingAdditionalProperties()` has given it an empty `properties`,
    // and an `anyOf` over no keys failed the whole compile with `data/anyOf must NOT have fewer than 1 items`
    expect(() => compileSchemaValidatorsCode(schema)).not.toThrow();
    // The runtime validator failed the same way but quietly, warning and answering `false`, so a map never matched
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      warnings.push(String(args[0]));
    });
    const matched = getFirstMatchingOption({ validator }, { anyKey: 'x' }, options, schema);
    spy.mockRestore();
    expect(matched).toBe(0);
    expect(warnings).toEqual([]);
  });

  it.each([
    ['the 2020-12 dialect', Ajv2020],
    ['the 2019-09 dialect', Ajv2019],
  ])('matches an option whose $id ends in an empty fragment under %s', (_dialect, AjvClass) => {
    const options: RJSFSchema[] = [
      { $id: 'http://e.com/a.json#', type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
      { $id: 'http://e.com/b.json#', type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
    ];
    const schema: RJSFSchema = { type: 'object', oneOf: options };
    // Both drafts allow an empty trailing fragment and require an `$id` to match `^[^#]*#?$`, so a suffix appended
    // inside the fragment made ajv refuse to compile every variant and the match fell back to the first option
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      warnings.push(String(args[0]));
    });
    const matched = getFirstMatchingOption({ validator: customizeValidator({ AjvClass }) }, { b: 1 }, options, schema);
    spy.mockRestore();
    expect(matched).toBe(1);
    expect(warnings).toEqual([]);
  });

  it('scores an option that carries an $id through a precompiled validator', () => {
    const schema: RJSFSchema = {
      oneOf: [
        { $id: 'http://example.com/b.json', type: 'object', properties: { b: { type: 'string' } }, required: ['b'] },
        { $id: 'http://example.com/c.json', type: 'object', properties: { c: { type: 'number' } } },
      ],
    };
    const options = schema.oneOf as RJSFSchema[];
    const precompiled = createPrecompiledValidator(evalValidatorCode(compileSchemaValidatorsCode(schema)), schema);
    expect(getFirstMatchingOption({ validator: precompiled }, { c: 1 }, options, schema)).toBe(1);
    // The `required` an option declares is dropped for scoring, so a key the user has yet to fill in still matches
    expect(getFirstMatchingOption({ validator: precompiled }, { b: undefined }, options, schema)).toBe(0);
  });
});

describe('scoring an option whose property leads to a choice that recurs (#4990)', () => {
  const ROOT: RJSFSchema = {
    definitions: {
      // A JSON value, whose recurring options take different types
      Value: {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { $ref: '#/definitions/Value' } },
          { type: 'object', additionalProperties: { $ref: '#/definitions/Value' } },
        ],
      },
      // The same JSON value, whose recurring options state their types through an allOf
      WrappedValue: {
        anyOf: [
          { type: 'string' },
          { allOf: [{ $ref: '#/definitions/ValueArray' }] },
          { allOf: [{ $ref: '#/definitions/ValueObject' }] },
        ],
      },
      ValueArray: { type: 'array', items: { $ref: '#/definitions/WrappedValue' } },
      ValueObject: { type: 'object', additionalProperties: { $ref: '#/definitions/WrappedValue' } },
      // Kinds of node, told apart by a const, that offer each other as children, as in #4990
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
      // A tree whose recurring options both take objects
      Tree: {
        type: 'object',
        anyOf: [
          { properties: { left: { $ref: '#/definitions/Tree' } } },
          { properties: { right: { $ref: '#/definitions/Tree' } } },
        ],
      },
    },
  };
  const optionsBelow = (below: string): RJSFSchema[] => [
    { properties: { v: { $ref: `#/definitions/${below}` } } },
    { properties: { v: { type: 'number' } } },
  ];

  it.each(['Value', 'WrappedValue', 'Tree'])('checks the type of a property leading to %s', (below) => {
    expect(getFirstMatchingOption({ validator }, { v: 5 }, optionsBelow(below), ROOT)).toBe(1);
  });

  it('merges the option the data matches into a schema whose dependencies offer them', () => {
    const schema: RJSFSchema = { ...ROOT, type: 'object', dependencies: { x: ['v'] }, oneOf: optionsBelow('Value') };
    expect(retrieveSchema({ validator }, schema, schema, { v: 5 }).properties?.v).toEqual({ type: 'number' });
  });

  it.each(['Value', 'Tree'])('tells options apart by what sits beside a property leading to %s', (below) => {
    const metaOf = (kind: string): RJSFSchema => ({
      properties: {
        meta: { type: 'object', properties: { kind: { const: kind }, tree: { $ref: `#/definitions/${below}` } } },
      },
    });
    expect(getClosestMatchingOption({ validator }, ROOT, { meta: { kind: 'b' } }, [metaOf('a'), metaOf('b')], -1)).toBe(
      1,
    );
  });

  it('tells options apart by a const in the node a property names, where that node recurs', () => {
    const options: RJSFSchema[] = [
      { properties: { w: { $ref: '#/definitions/A' } } },
      { properties: { w: { $ref: '#/definitions/B' } } },
    ];
    const formData = { w: { kind: 'B' } };
    expect(getFirstMatchingOption({ validator }, formData, options, ROOT)).toBe(1);
    expect(getClosestMatchingOption({ validator }, ROOT, formData, options, -1)).toBe(1);
    const schema: RJSFSchema = { ...ROOT, type: 'object', dependencies: { x: ['w'] }, oneOf: options };
    expect(retrieveSchema({ validator }, schema, schema, formData).properties?.w).toEqual({
      $ref: '#/definitions/B',
    });
  });

  it.each([
    ['a oneOf', { oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] }, { kind: 'A' }],
    ['a not', { not: { $ref: '#/definitions/A' } }, { kind: 'B' }],
  ])('checks a node that recurs in full below %s beside the option', (_keyword, beside, data) => {
    const options: RJSFSchema[] = [
      { type: 'object', properties: { other: { type: 'number' } } },
      { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], ...beside },
    ];
    expect(getFirstMatchingOption({ validator }, { name: 'x', ...data }, options, ROOT)).toBe(1);
  });

  it.each([
    ['a $ref', (base: string): RJSFSchema => ({ $ref: base })],
    ['an allOf', (base: string): RJSFSchema => ({ allOf: [{ $ref: base }] })],
  ])('tells options apart by a const in the node a recurring alias written as %s names', (_spelling, alias) => {
    const animal = (kind: string): RJSFSchema => ({
      type: 'object',
      properties: {
        kind: { const: kind },
        child: { oneOf: [{ type: 'null' }, { $ref: '#/definitions/Cat' }, { $ref: '#/definitions/Dog' }] },
      },
    });
    const root: RJSFSchema = {
      definitions: {
        Cat: alias('#/definitions/CatBase'),
        Dog: alias('#/definitions/DogBase'),
        CatBase: animal('cat'),
        DogBase: animal('dog'),
      },
    };
    const options: RJSFSchema[] = [
      { properties: { w: { $ref: '#/definitions/Cat' } } },
      { properties: { w: { $ref: '#/definitions/Dog' } } },
    ];
    expect(getFirstMatchingOption({ validator }, { w: { kind: 'dog' } }, options, root)).toBe(1);
  });

  it('checks the type of a property leading to a oneOf of recurring objects that states no type itself', () => {
    const node = (name: string): RJSFSchema => ({
      type: 'object',
      properties: { kind: { const: name }, next: { $ref: '#/definitions/Expr' } },
    });
    const root: RJSFSchema = {
      definitions: {
        Expr: { oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] },
        A: node('A'),
        B: node('B'),
      },
    };
    const options: RJSFSchema[] = [
      { properties: { v: { $ref: '#/definitions/Expr' } } },
      { properties: { v: { type: 'number' } } },
    ];
    expect(getFirstMatchingOption({ validator }, { v: 5 }, options, root)).toBe(1);
  });

  it.each([
    [
      'allOf entries',
      {
        allOf: [
          { $ref: '#/definitions/Base' },
          { properties: { children: { items: { $ref: '#/definitions/Node' } } } },
        ],
      },
    ],
    [
      'a $ref beside properties',
      { $ref: '#/definitions/Base', properties: { children: { items: { $ref: '#/definitions/Node' } } } },
    ],
  ])(
    'checks a node whose %s recur through different properties, which validates the data once',
    (_spelling, nodeSchema) => {
      const root: RJSFSchema = {
        definitions: {
          Node: nodeSchema as RJSFSchema,
          Base: { type: 'object', properties: { kind: { type: 'string' }, parent: { $ref: '#/definitions/Node' } } },
        },
      };
      const options: RJSFSchema[] = [
        { properties: { v: { $ref: '#/definitions/Node' } } },
        { properties: { v: { type: 'number' } } },
      ];
      expect(getFirstMatchingOption({ validator }, { v: 5 }, options, root)).toBe(1);
    },
  );

  it.each([
    [
      'a property and a pattern that cannot match its name',
      {
        type: 'object',
        allOf: [
          { properties: { parent: { $ref: '#/definitions/Node' } } },
          { patternProperties: { '^x-': { $ref: '#/definitions/Node' } } },
        ],
      },
      { type: 'object', properties: { parent: { type: 'string' } } },
      { v: { parent: 'str' } },
    ],
    [
      'tuple positions and the items after a tuple',
      {
        type: 'array',
        allOf: [
          { items: [{ type: 'string' }, { $ref: '#/definitions/Node' }] },
          { additionalItems: { $ref: '#/definitions/Node' } },
        ],
      },
      { type: 'array', items: { type: 'number' } },
      { v: [1, 2] },
    ],
  ])(
    'checks a node whose subschemas recur through %s, which are different parts of the data',
    (_parts, nodeSchema, other, formData) => {
      const root: RJSFSchema = { definitions: { Node: nodeSchema as RJSFSchema } };
      const options: RJSFSchema[] = [
        { properties: { v: { $ref: '#/definitions/Node' } } },
        { properties: { v: other as RJSFSchema } },
      ];
      expect(getFirstMatchingOption({ validator }, formData, options, root)).toBe(1);
    },
  );

  it.each([
    [
      'a property and a pattern matching its name',
      {
        type: 'object',
        properties: { a: { $ref: '#/definitions/X' } },
        patternProperties: { '^a': { $ref: '#/definitions/X' } },
      },
      (inner: unknown) => ({ a: inner }),
      {},
    ],
    [
      'its items and contains',
      {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { $ref: '#/definitions/X' }, contains: { $ref: '#/definitions/X' } },
        ],
      },
      (inner: unknown) => [inner],
      's',
    ],
    [
      'the additionalItems beside an empty tuple and contains',
      {
        anyOf: [
          { type: 'string' },
          {
            type: 'array',
            items: [],
            additionalItems: { $ref: '#/definitions/X' },
            contains: { $ref: '#/definitions/X' },
          },
        ],
      },
      (inner: unknown) => [inner],
      's',
    ],
  ])('matches data many levels deep against a node holding itself through %s', (_parts, nodeSchema, wrap, leaf) => {
    const root: RJSFSchema = { definitions: { X: nodeSchema as RJSFSchema } };
    const options: RJSFSchema[] = [
      { properties: { v: { $ref: '#/definitions/X' } } },
      { properties: { v: { type: 'number' } } },
    ];
    let value: unknown = leaf;
    for (let level = 0; level < 8; level += 1) {
      value = wrap(value);
    }
    const counting = customizeValidator();
    const isValid = vi.spyOn(counting, 'isValid');
    expect(getFirstMatchingOption({ validator: counting }, { v: value }, options, root)).toBe(0);
    // Validating both subschemas holding X at every level would double the work per level of the data, so no schema
    // the validator is handed may reach X
    expect(isValid).toHaveBeenCalled();
    const named = (schema: unknown) =>
      isPlainObject(schema) && typeof schema.$ref === 'string'
        ? getByPath(root, schema.$ref.slice(2).split('/'))
        : schema;
    expect(isValid.mock.calls.filter(([schema]) => JSON.stringify(named(schema)).includes('#/definitions/X'))).toEqual(
      [],
    );
  });

  it('keeps checking a node beside a dependentSchemas entry that leads to a recursive choice', () => {
    const expression = (kind: string): RJSFSchema => ({
      type: 'object',
      properties: { kind: { const: kind }, next: { $ref: '#/$defs/Expr' } },
    });
    const root: RJSFSchema = {
      $defs: {
        Expr: { oneOf: [{ type: 'null' }, { $ref: '#/$defs/P' }, { $ref: '#/$defs/Q' }] },
        P: expression('p'),
        Q: expression('q'),
      },
    };
    const options: RJSFSchema[] = [
      {
        properties: {
          v: {
            type: 'object',
            properties: { kind: { const: 'p' } },
            dependentSchemas: { kind: { $ref: '#/$defs/P' } },
          },
        },
      },
      { properties: { v: { type: 'object', properties: { kind: { const: 'q' } } } } },
    ];
    expect(
      getFirstMatchingOption(
        { validator: customizeValidator({ AjvClass: Ajv2020 }) },
        { v: { kind: 'q' } },
        options,
        root,
      ),
    ).toBe(1);
  });

  it.each([
    [
      'unevaluatedItems beside an items that evaluates every item',
      { type: 'array', items: { $ref: '#/definitions/X' }, unevaluatedItems: { $ref: '#/definitions/X' } },
      { type: 'array', items: { type: 'number' } },
      [1],
    ],
    [
      'unevaluatedProperties beside an additionalProperties that evaluates every property',
      {
        type: 'object',
        additionalProperties: { $ref: '#/definitions/X' },
        unevaluatedProperties: { $ref: '#/definitions/X' },
      },
      { type: 'object', additionalProperties: { type: 'number' } },
      { a: 1 },
    ],
  ])('checks a node holding itself through %s, which applies to nothing', (_parts, nodeSchema, other, value) => {
    const root: RJSFSchema = { definitions: { X: nodeSchema as RJSFSchema } };
    const options: RJSFSchema[] = [
      { properties: { v: { $ref: '#/definitions/X' } } },
      { properties: { v: other as RJSFSchema } },
    ];
    expect(
      getFirstMatchingOption({ validator: customizeValidator({ AjvClass: Ajv2019 }) }, { v: value }, options, root),
    ).toBe(1);
  });

  it.each([
    ['an allOf entry', { allOf: [{ $ref: '#/$defs/Tree' }], unevaluatedProperties: false }],
    ['a $ref beside it', { $ref: '#/$defs/Tree', unevaluatedProperties: false }],
    ['an allOf entry naming another', { allOf: [{ $ref: '#/$defs/Wrapped' }], unevaluatedProperties: false }],
  ])(
    'matches an option holding a node whose unevaluatedProperties sees the properties of %s leading to a recursive choice',
    (_spelling, wrapper) => {
      const root: RJSFSchema = {
        $defs: {
          Tree: {
            type: 'object',
            anyOf: [
              { properties: { child: { $ref: '#/$defs/Tree' }, a: { type: 'string' } } },
              { properties: { child: { $ref: '#/$defs/Tree' }, b: { type: 'number' } } },
            ],
          },
          Wrapped: { allOf: [{ $ref: '#/$defs/Tree' }] },
          W: wrapper as RJSFSchema,
        },
      };
      const options: RJSFSchema[] = [
        { properties: { w: { $ref: '#/$defs/W' } } },
        { properties: { w: { type: 'object' } } },
      ];
      // Cutting the `$ref` to `Tree` down to its type would hide `child` from the `unevaluatedProperties` beside it
      expect(
        getFirstMatchingOption(
          { validator: customizeValidator({ AjvClass: Ajv2019 }) },
          { w: { child: {} } },
          options,
          root,
        ),
      ).toBe(0);
    },
  );

  it.each<[string, RJSFSchema, 'anyOf' | 'oneOf', RJSFSchema[], unknown]>([
    [
      'type',
      { type: ['integer', 'number', 'null', 'object'] },
      'oneOf',
      [{ type: 'null' }, { type: 'integer' }],
      { kind: 'p', next: null },
    ],
    ['enum', { enum: ['a', 'b'] }, 'anyOf', [{ type: 'string' }], 'a'],
  ])(
    'matches an option holding a recursive choice whose %s states one type twice',
    (_spelling, stated, keyword, leaves, value) => {
      const expression = (kind: string): RJSFSchema => ({
        type: 'object',
        properties: { kind: { const: kind }, next: { $ref: '#/$defs/Expr' } },
      });
      const root: RJSFSchema = {
        $defs: { Expr: { ...stated, [keyword]: [...leaves, expression('p'), expression('q')] } },
      };
      const options: RJSFSchema[] = [
        { properties: { child: { type: 'boolean' } } },
        { properties: { child: { $ref: '#/$defs/Expr' } } },
      ];
      // A cut `type` repeating an entry fails to compile, so the option would match nothing
      expect(
        getFirstMatchingOption(
          { validator: customizeValidator({ AjvClass: Ajv2020 }) },
          { child: value },
          options,
          root,
        ),
      ).toBe(1);
    },
  );

  it.each<[string, RJSFSchema, RJSFSchema, unknown]>([
    [
      'the properties an allOf entry declares',
      {
        type: 'object',
        allOf: [{ properties: { a: { $ref: '#/definitions/X' } } }],
        unevaluatedProperties: { $ref: '#/definitions/X' },
      },
      { type: 'object', properties: { a: { type: 'number' } } },
      { a: 1 },
    ],
    [
      'the items an allOf entry evaluates',
      { type: 'array', allOf: [{ items: { $ref: '#/definitions/X' } }], unevaluatedItems: { $ref: '#/definitions/X' } },
      { type: 'array', items: { type: 'number' } },
      [1],
    ],
  ])(
    'checks a node whose unevaluated keyword leaves out %s, which walks each part once',
    (_parts, nodeSchema, other, value) => {
      const root: RJSFSchema = { definitions: { X: nodeSchema } };
      const options: RJSFSchema[] = [{ properties: { v: { $ref: '#/definitions/X' } } }, { properties: { v: other } }];
      expect(
        getFirstMatchingOption({ validator: customizeValidator({ AjvClass: Ajv2019 }) }, { v: value }, options, root),
      ).toBe(1);
    },
  );

  it('matches null against a cut choice whose options are nullable', () => {
    const expression = (kind: string): RJSFSchema => ({
      type: 'object',
      nullable: true,
      properties: { kind: { const: kind }, next: { $ref: '#/$defs/Expr' } },
    });
    const root: RJSFSchema = { $defs: { Expr: { anyOf: [expression('p'), expression('q')] } } };
    const options: RJSFSchema[] = [
      { properties: { other: { type: 'number' } } },
      { type: 'object', properties: { kind: { const: 'r' }, next: { $ref: '#/$defs/Expr' } } },
    ];
    expect(
      getFirstMatchingOption(
        { validator: customizeValidator({ AjvClass: Ajv2020 }) },
        { kind: 'r', next: null },
        options,
        root,
      ),
    ).toBe(1);
  });

  it('drops the required of a dependentSchemas entry in an option the root holds, as it drops one of a dependencies entry', () => {
    const options: RJSFSchema[] = [
      { type: 'object', properties: { c: {} } },
      {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
        dependentSchemas: { a: { required: ['b'] } },
      },
    ];
    expect(
      getFirstMatchingOption({ validator: customizeValidator({ AjvClass: Ajv2019 }) }, { a: 'x' }, options, {
        oneOf: options,
      }),
    ).toBe(1);
  });

  it('cuts a recursive choice that a dependentSchemas entry of an option the root holds leads to', () => {
    const expression = (kind: string): RJSFSchema => ({
      type: 'object',
      properties: { kind: { const: kind }, next: { $ref: '#/$defs/Expr' } },
    });
    const options: RJSFSchema[] = [
      { type: 'object', properties: { c: { type: 'number' } } },
      {
        type: 'object',
        properties: { kind: { const: 'r' } },
        dependentSchemas: { kind: { properties: { next: { $ref: '#/$defs/Expr' } } } },
      },
    ];
    const root: RJSFSchema = {
      $defs: {
        Expr: { oneOf: [{ type: 'null' }, { $ref: '#/$defs/P' }, { $ref: '#/$defs/Q' }] },
        P: expression('p'),
        Q: expression('q'),
      },
      oneOf: options,
    };
    const counting = customizeValidator({ AjvClass: Ajv2020 });
    const isValid = vi.spyOn(counting, 'isValid');
    const data = { kind: 'r', next: { kind: 'p', next: { kind: 'q', next: null } } };
    expect(getFirstMatchingOption({ validator: counting }, data, options, root)).toBe(1);
    expect(isValid).toHaveBeenCalled();
    const named = (schema: unknown) =>
      isPlainObject(schema) && typeof schema.$ref === 'string'
        ? getByPath(root, schema.$ref.slice(2).split('/'))
        : schema;
    // Scoring the option as the root holds it would walk both recurring branches of Expr at every level of the data
    expect(isValid.mock.calls.filter(([schema]) => JSON.stringify(named(schema)).includes('#/$defs/Expr'))).toEqual([]);
  });

  it('keeps the required of an option whose only properties sit in a dependentSchemas entry', () => {
    const options: RJSFSchema[] = [
      { type: 'object', required: ['email'], dependentSchemas: { a: { properties: { b: { type: 'string' } } } } },
      { type: 'object', required: ['phone'] },
    ];
    for (const matching of [validator, customizeValidator({ AjvClass: Ajv2020 })]) {
      expect(getFirstMatchingOption({ validator: matching }, { phone: '1' }, options, { oneOf: options })).toBe(1);
    }
  });

  it('keeps the properties a then below a $ref declares for an unevaluatedProperties: false in the option, where they lead to a recursive choice', () => {
    const expression = (kind: string): RJSFSchema => ({
      properties: { kind: { const: kind }, next: { $ref: '#/$defs/Expr' } },
    });
    const root: RJSFSchema = {
      $defs: {
        // States no type, so a cut leaves nothing of it
        Expr: { anyOf: [expression('p'), expression('q')] },
        Base: {
          if: { properties: { kind: { const: 'p' } }, required: ['kind'] },
          then: { properties: { kind: true, next: { $ref: '#/$defs/Expr' } } },
        },
      },
    };
    const options: RJSFSchema[] = [
      { type: 'object', properties: { other: { type: 'string' } } },
      { allOf: [{ $ref: '#/$defs/Base' }], unevaluatedProperties: false },
    ];
    // Leaving `next` out of the copy would have the `unevaluatedProperties: false` reject it, and no option match
    expect(
      getFirstMatchingOption(
        { validator: customizeValidator({ AjvClass: Ajv2019 }) },
        { kind: 'p', next: { kind: 'q', next: null } },
        options,
        root,
      ),
    ).toBe(1);
  });
  it("copies a node whose unevaluatedProperties sees a conjunct that only leads to a recursive choice, keeping the node's own discriminator", () => {
    const branch = (kind: string): RJSFSchema => ({
      type: 'object',
      $ref: '#/$defs/Base',
      properties: { k: { const: kind } },
      unevaluatedProperties: false,
    });
    const root: RJSFSchema = {
      $defs: {
        C: { oneOf: [{ type: 'null' }, { $ref: '#/$defs/A' }, { $ref: '#/$defs/B' }] },
        Base: { properties: { child: { $ref: '#/$defs/C' } } },
        A: branch('a'),
        B: branch('b'),
      },
    };
    const options: RJSFSchema[] = [
      { properties: { w: { $ref: '#/$defs/A' } } },
      { properties: { w: { $ref: '#/$defs/B' } } },
    ];
    const counting = customizeValidator({ AjvClass: Ajv2020 });
    const isValid = vi.spyOn(counting, 'isValid');
    // `Base`'s copy still declares `child`, so the `unevaluatedProperties` beside it sees what it did, and `k` is checked
    expect(getFirstMatchingOption({ validator: counting }, { w: { k: 'b', child: null } }, options, root)).toBe(1);
    expect(isValid).toHaveBeenCalled();
    expect(isValid.mock.calls.filter(([schema]) => JSON.stringify(schema).includes('#/$defs/C'))).toEqual([]);
  });

  it('drops a dependentRequired in an option, as it drops the names a dependencies entry lists', () => {
    const options: RJSFSchema[] = [
      { properties: { c: { type: 'string' } } },
      { properties: { a: { type: 'string' }, b: { type: 'string' } }, dependentRequired: { a: ['b'] } },
    ];
    expect(
      getFirstMatchingOption({ validator: customizeValidator({ AjvClass: Ajv2020 }) }, { a: 'x' }, options, {
        oneOf: options,
      }),
    ).toBe(1);
  });

  it('keys a cut the same whichever node a precompiled validator and the form read its types from first', () => {
    // Each call builds its own objects, so the compile and the form each read a graph they built themselves
    const build = () => {
      const options: RJSFSchema[] = [{ type: 'object', properties: { x: { $ref: '#/$defs/R' } } }, { type: 'string' }];
      const root: RJSFSchema = {
        $defs: {
          C1: { type: ['object', 'null'] },
          C2: { type: ['null', 'object'] },
          R: {
            allOf: [{ $ref: '#/$defs/C1' }, { $ref: '#/$defs/C2' }],
            anyOf: [
              { properties: { n: { allOf: [{ $ref: '#/$defs/R' }, { $ref: '#/$defs/C1' }] } } },
              { properties: { n: { $ref: '#/$defs/R' } } },
            ],
          },
        },
        type: 'object',
        properties: { p: { oneOf: options } },
      };
      return { options, root };
    };
    const validatorFns = evalValidatorCode(compileSchemaValidatorsCode(build().root, {}));
    const { options, root } = build();
    expect(
      getFirstMatchingOption(
        { validator: createPrecompiledValidator(validatorFns, root) },
        { x: { n: null } },
        options,
        root,
      ),
    ).toBe(0);
  });
});
