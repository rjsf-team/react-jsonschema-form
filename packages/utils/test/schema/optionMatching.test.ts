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
