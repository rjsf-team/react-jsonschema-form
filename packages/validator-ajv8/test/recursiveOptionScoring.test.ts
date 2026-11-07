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
import { getClosestMatchingOption, getFirstMatchingOption, retrieveSchema } from '@rjsf/utils';
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
});
