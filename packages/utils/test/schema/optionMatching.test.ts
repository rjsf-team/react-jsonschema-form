import type { RJSFSchema } from '../../src/index.ts';
import { getClosestMatchingOption, getFirstMatchingOption, omitExtraData, retrieveSchema } from '../../src/index.ts';
import { miniValidator } from './graph/miniValidator.ts';

describe('matching options through the schema graph', () => {
  it('passes over a boolean option and one without the discriminator when matching by const', () => {
    const field: RJSFSchema = {
      discriminator: { propertyName: 'kind' },
      oneOf: [true, { properties: { z: {} } }, { properties: { kind: { const: 'b' }, x: {} } }],
    };
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: field } };
    const validator = miniValidator();
    expect(omitExtraData({ validator }, rootSchema, rootSchema, { v: { kind: 'b', x: 1, y: 2 } })).toEqual({
      v: { kind: 'b', x: 1 },
    });
    expect(validator.calls).toBe(0);
  });
  it('matches by const alone an option whose base declares the discriminator with neither a const nor an enum', () => {
    const option = (kind: string): RJSFSchema => ({
      allOf: [{ $ref: '#/definitions/Base' }, { properties: { kind: { const: kind }, [kind]: {} } }],
    });
    const field: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf: [option('a'), option('b')] };
    const rootSchema: RJSFSchema = {
      definitions: { Base: { properties: { kind: { type: 'string' } } } },
      type: 'object',
      properties: { v: field },
    };
    const validator = miniValidator();
    expect(omitExtraData({ validator }, rootSchema, rootSchema, { v: { kind: 'b', a: 1, b: 2 } })).toEqual({
      v: { kind: 'b', b: 2 },
    });
    expect(validator.calls).toBe(0);
  });
  describe('reading a base that declares the discriminator with neither a const nor an enum', () => {
    type Case = [name: string, kind: RJSFSchema, values: (string | number)[], value: string | number];
    const matching = (kind: RJSFSchema, values: readonly (string | number)[], value: string | number) => {
      const options: RJSFSchema[] = values.map((entry) => ({
        allOf: [{ $ref: '#/definitions/Base' }, { properties: { kind: { const: entry } } }],
      }));
      const field: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf: options };
      const rootSchema: RJSFSchema = {
        definitions: { Base: { properties: { kind } } },
        type: 'object',
        properties: { v: field },
      };
      const validator = miniValidator();
      const index = getFirstMatchingOption({ validator }, { kind: value }, options, rootSchema, 'kind');
      return { index, calls: validator.calls };
    };
    it.each<Case>([
      ['no type', { title: 'Kind' }, ['a', 'b'], 'b'],
      ['a type list allowing the value', { type: ['null', 'string'] }, ['a', 'b'], 'b'],
      ['an integer type the value is', { type: 'integer' }, [1, 2], 2],
    ])('matches by const alone past one with %s', (_name, kind: RJSFSchema, values, value) => {
      expect(matching(kind, values, value)).toEqual({ index: 1, calls: 0 });
    });
    it.each<Case>([
      ['a type the value is not', { type: 'integer' }, [1, 1.5], 1.5],
      ['a pattern', { type: 'string', pattern: '.' }, ['a', 'b'], 'b'],
    ])('leaves the validator to check past one with %s', (_name, kind: RJSFSchema, values, value) => {
      expect(matching(kind, values, value).calls).toBeGreaterThan(0);
    });
  });
  it('asks the validator in order where an earlier option declares the discriminator with a constraint it has to read', () => {
    const oneOf: RJSFSchema[] = [
      { allOf: [{ $ref: '#/definitions/Base' }], properties: { kind: { const: 'a' }, x: {} } },
      { type: 'object', properties: { kind: { enum: ['a', 'z'] }, y: {} } },
    ];
    const field: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf };
    const rootSchema: RJSFSchema = {
      definitions: { Base: { type: 'object', properties: { kind: { type: 'string', minLength: 1 } } } },
      type: 'object',
      properties: { v: field },
    };
    const context = { validator: miniValidator() };
    expect(getFirstMatchingOption(context, { kind: 'a' }, oneOf, rootSchema, 'kind')).toBe(0);
    expect(getClosestMatchingOption(context, rootSchema, { kind: 'a' }, oneOf, 0, 'kind')).toBe(0);
    expect(getFirstMatchingOption(context, { kind: 'q', y: 1 }, oneOf.slice(1), rootSchema, 'kind')).toBe(0);
  });
  it.each<[string, RJSFSchema]>([
    ['additionalProperties', { additionalProperties: { type: 'string' } }],
    ['patternProperties', { patternProperties: { '^s_': { type: 'string' } } }],
  ])('matches an option whose properties name nothing by the %s an allOf entry declares', (_name, entry) => {
    const oneOf: RJSFSchema[] = [
      { type: 'object', properties: { n: { type: 'number' } } },
      { type: 'object', properties: {}, allOf: [entry] },
    ];
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: { oneOf } } };
    expect(getFirstMatchingOption({ validator: miniValidator() }, { s_a: 'x' }, oneOf, rootSchema)).toBe(1);
  });
  it('matches past an option holding a patternProperties pattern no flag compiles', () => {
    const options: RJSFSchema[] = [
      { type: 'object', properties: { a: { type: 'string' } }, patternProperties: { '(?<x': { type: 'string' } } },
      { type: 'object', properties: { b: { type: 'number' } } },
    ];
    const rootSchema: RJSFSchema = { oneOf: options };
    const validator = miniValidator();
    expect(getFirstMatchingOption({ validator }, { b: 1 }, options, rootSchema)).toBe(1);
    expect(getClosestMatchingOption({ validator }, rootSchema, { b: 1 }, options)).toBe(1);
  });
  it('omits by a boolean option the data matches', () => {
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: { oneOf: [true] } } };
    expect(omitExtraData({ validator: miniValidator() }, rootSchema, rootSchema, { v: { a: 1 } })).toEqual({
      v: { a: 1 },
    });
  });
  it('drops an empty option list beside dependencies, which offers no choice', () => {
    const rootSchema: RJSFSchema = { type: 'object', dependencies: { a: ['b'] }, oneOf: [] };
    expect(retrieveSchema({ validator: miniValidator() }, rootSchema, rootSchema, {})).not.toHaveProperty('oneOf');
  });
  it('leaves unstubbed a key an option declares through the then of a boolean if', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      oneOf: [{ if: true, then: { properties: { x: { type: 'number' } } } }],
    };
    const retrieved = retrieveSchema({ validator: miniValidator() }, rootSchema, rootSchema, { x: 1, y: 'y' });
    expect(Object.keys(retrieved.properties ?? {})).toEqual(['y']);
  });
  it.each([
    [
      'an allOf entry',
      (kind: string, key: string): RJSFSchema => ({
        allOf: [{ properties: { kind: { const: kind } } }],
        properties: { [key]: {} },
      }),
    ],
    [
      'its then',
      (kind: string, key: string): RJSFSchema => ({
        if: true,
        then: { properties: { kind: { const: kind } } },
        properties: { [key]: {} },
      }),
    ],
  ])('matches by its keys data without the discriminator when the options declare it in %s', (_name, option) => {
    const options = [option('a', 'x'), option('b', 'y')];
    const field: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf: options };
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: field } };
    const validator = miniValidator();
    expect(getFirstMatchingOption({ validator }, { y: 1 }, options, rootSchema, 'kind')).toBe(1);
    expect(getClosestMatchingOption({ validator }, rootSchema, { y: 1 }, options, -1, 'kind')).toBe(1);
    expect(omitExtraData({ validator }, rootSchema, rootSchema, { v: { y: 1 } })).toEqual({ v: { y: 1 } });
  });
  describe('options whose every declaration of the discriminator accepts the value', () => {
    const options: RJSFSchema[] = [{ $ref: '#/definitions/Cat' }, { $ref: '#/definitions/Dog' }];
    const pet: RJSFSchema = { discriminator: { propertyName: 'petType' }, oneOf: options };
    const rootOf = (own: (key: string, other: string) => RJSFSchema): RJSFSchema => ({
      definitions: {
        Pet: { type: 'object', properties: { petType: { type: 'string' } } },
        Cat: { allOf: [{ $ref: '#/definitions/Pet' }], ...own('hunts', 'barks') },
        Dog: { allOf: [{ $ref: '#/definitions/Pet' }], ...own('barks', 'hunts') },
      },
      type: 'object',
      properties: { pet },
    });
    const data = { petType: 'Dog', barks: true };
    it('matches by the whole option, which rejects the keys of the other', () => {
      const rootSchema = rootOf((key, other) => ({
        properties: { petType: true, [key]: { type: 'boolean' }, [other]: false },
      }));
      const validator = miniValidator();
      expect(getFirstMatchingOption({ validator }, data, options, rootSchema, 'petType')).toBe(1);
      expect(getFirstMatchingOption({ validator }, data, options, rootSchema)).toBe(1);
    });
    it('scores the options by their keys where both match', () => {
      const rootSchema = rootOf((key) => ({
        properties: { petType: true, [key]: { type: 'boolean' } },
        required: [key],
      }));
      const validator = miniValidator();
      expect(getClosestMatchingOption({ validator }, rootSchema, data, options, 0, 'petType')).toBe(1);
      expect(omitExtraData({ validator }, rootSchema, rootSchema, { pet: data })).toEqual({ pet: data });
    });
  });
});
