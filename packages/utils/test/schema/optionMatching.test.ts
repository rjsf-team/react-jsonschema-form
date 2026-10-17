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
});
