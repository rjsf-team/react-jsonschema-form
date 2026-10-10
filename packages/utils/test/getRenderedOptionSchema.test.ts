import type { RJSFSchema } from '../src/index.ts';
import { ADDITIONAL_PROPERTY_FLAG, getRenderedOptionSchema } from '../src/index.ts';

describe('getRenderedOptionSchema()', () => {
  describe('a non-object parent', () => {
    test("passes on every keyword describing the value, such as an array's items and uniqueItems", () => {
      const parent: RJSFSchema = {
        type: 'array',
        items: { type: 'string', enum: ['a', 'b'] },
        uniqueItems: true,
        oneOf: [{ minItems: 1 }],
      };
      expect(getRenderedOptionSchema(parent, { minItems: 1 })).toEqual({
        type: 'array',
        items: { type: 'string', enum: ['a', 'b'] },
        uniqueItems: true,
        minItems: 1,
      });
    });
    test("passes on a string's format", () => {
      expect(getRenderedOptionSchema({ type: 'string', format: 'date', anyOf: [] }, { minLength: 1 })).toEqual({
        type: 'string',
        format: 'date',
        minLength: 1,
      });
    });
    test('keeps the options, the annotations, the default and the schema document keywords on the parent', () => {
      const parent: RJSFSchema = {
        $id: 'parent',
        $anchor: 'parent',
        $dynamicAnchor: 'node',
        $vocabulary: { 'https://json-schema.org/draft/2020-12/vocab/core': true },
        $schema: 'http://json-schema.org/draft-07/schema#',
        $comment: 'a comment',
        $defs: { a: { type: 'string' } },
        definitions: { b: { type: 'string' } },
        type: 'string',
        title: 'Parent',
        description: 'The parent',
        deprecated: true,
        default: 'x',
        discriminator: { propertyName: 'kind' },
        anyOf: [{ minLength: 1 }],
        oneOf: [{ maxLength: 5 }],
      };
      expect(getRenderedOptionSchema(parent, { minLength: 1 })).toEqual({ type: 'string', minLength: 1 });
    });
    test("keeps the parent's Symbol-keyed markers on the parent", () => {
      const parent = { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } as RJSFSchema;
      expect(Object.getOwnPropertySymbols(getRenderedOptionSchema(parent, { minLength: 1 }))).toEqual([]);
    });
    test("merges an option's items into the parent's", () => {
      const parent: RJSFSchema = { type: 'array', items: { type: 'string' } };
      expect(getRenderedOptionSchema(parent, { type: 'array', items: { minLength: 1 } })).toEqual({
        type: 'array',
        items: { type: 'string', minLength: 1 },
      });
    });
    test("lets the option's own keyword win where the two cannot be combined into one value", () => {
      const parent: RJSFSchema = { type: 'string', format: 'date', pattern: '^a', multipleOf: 2 };
      expect(getRenderedOptionSchema(parent, { format: 'email', pattern: '^b', multipleOf: 3 })).toEqual({
        type: 'string',
        format: 'email',
        pattern: '^b',
        multipleOf: 3,
      });
    });
    test.each<[string, RJSFSchema, RJSFSchema, number]>([
      ['the smaller maxItems', { maxItems: 3 }, { maxItems: 5 }, 3],
      ['the smaller maxItems when the option is the stricter', { maxItems: 5 }, { maxItems: 3 }, 3],
      ['the smaller maxLength', { maxLength: 4 }, { maxLength: 9 }, 4],
      ['the smaller maxProperties', { maxProperties: 2 }, { maxProperties: 7 }, 2],
      ['the smaller maximum', { maximum: 10 }, { maximum: 20 }, 10],
      ['the smaller exclusiveMaximum', { exclusiveMaximum: 10 }, { exclusiveMaximum: 20 }, 10],
      ['the larger minItems', { minItems: 2 }, { minItems: 1 }, 2],
      ['the larger minLength', { minLength: 1 }, { minLength: 3 }, 3],
      ['the larger minProperties', { minProperties: 4 }, { minProperties: 1 }, 4],
      ['the larger minimum', { minimum: 0 }, { minimum: -5 }, 0],
      ['the larger exclusiveMinimum', { exclusiveMinimum: 0 }, { exclusiveMinimum: 5 }, 5],
    ])('keeps %s that both declare, since a value has to meet both', (_, parentBound, optionBound, expected) => {
      const [key] = Object.keys(parentBound);
      expect(getRenderedOptionSchema({ type: 'number', ...parentBound }, optionBound)).toEqual({
        type: 'number',
        [key]: expected,
      });
    });
    test("keeps the stricter bound within a keyword the two both declare a schema for, such as an array's items", () => {
      const parent: RJSFSchema = { type: 'array', items: { type: 'string', maxLength: 5 } };
      expect(getRenderedOptionSchema(parent, { items: { maxLength: 10, minLength: 1 } })).toEqual({
        type: 'array',
        items: { type: 'string', maxLength: 5, minLength: 1 },
      });
    });
    test("keeps the parent's subschema where the option's is true, since true adds nothing to meet", () => {
      const parent: RJSFSchema = {
        type: 'array',
        items: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } } },
      };
      expect(getRenderedOptionSchema(parent, { items: true })).toEqual(parent);
      expect(getRenderedOptionSchema(parent, { items: { properties: { a: true, b: { minimum: 1 } } } })).toEqual({
        type: 'array',
        items: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number', minimum: 1 } } },
      });
    });
    test("keeps the parent's false subschema where the option gives a schema, since nothing meets false", () => {
      const parent: RJSFSchema = {
        type: 'array',
        items: { type: 'object', properties: { a: false }, additionalProperties: false },
      };
      const option: RJSFSchema = {
        items: { properties: { a: { type: 'string' } }, additionalProperties: { type: 'string' } },
      };
      expect(getRenderedOptionSchema(parent, option)).toEqual(parent);
    });
    test('takes a const or default object both declare as the option has it, rather than merging the two values', () => {
      const parent: RJSFSchema = { type: 'array', items: { type: 'object', default: { a: 1 }, const: { a: 1 } } };
      const option: RJSFSchema = { items: { default: { b: 2 }, const: { b: 2 } } };
      expect(getRenderedOptionSchema(parent, option)).toEqual({
        type: 'array',
        items: { type: 'object', default: { b: 2 }, const: { b: 2 } },
      });
    });
    test("leaves an option's true within not or if as the option's, where true constrains the value", () => {
      const parent: RJSFSchema = { type: 'string', not: { maxLength: 3 }, if: { minLength: 1 } };
      expect(getRenderedOptionSchema(parent, { not: true, if: true })).toEqual({ type: 'string', not: true, if: true });
    });
    test('keeps uniqueItems when the parent asks for it and the option does not', () => {
      expect(getRenderedOptionSchema({ type: 'array', uniqueItems: true }, { uniqueItems: false })).toEqual({
        type: 'array',
        uniqueItems: true,
      });
    });
    test('keeps an option bound that is not a number, such as a draft-04 boolean exclusiveMaximum, as the option has it', () => {
      const parent = { type: 'number', maximum: 10, exclusiveMaximum: 5 } as RJSFSchema;
      const option = { maximum: 8, exclusiveMaximum: true } as unknown as RJSFSchema;
      expect(getRenderedOptionSchema(parent, option)).toEqual({ type: 'number', maximum: 8, exclusiveMaximum: true });
    });
    test('does not search a value keyword, such as a const object, for bounds', () => {
      const parent: RJSFSchema = { type: 'array', const: { maximum: 1 }, examples: [{ maxItems: 1 }] };
      expect(getRenderedOptionSchema(parent, { const: { maximum: 9 } })).toEqual({
        type: 'array',
        const: { maximum: 9 },
        examples: [{ maxItems: 1 }],
      });
    });
    test('does not search a keyword JSON Schema does not define for bounds', () => {
      const parent = { type: 'array', 'x-limits': { maxItems: 1 } } as RJSFSchema;
      const option = { 'x-limits': { maxItems: 9 } } as RJSFSchema;
      expect(getRenderedOptionSchema(parent, option)).toEqual({ type: 'array', 'x-limits': { maxItems: 9 } });
    });
    test('does not search a not for bounds, where the looser of the two is what a value has to clear', () => {
      expect(getRenderedOptionSchema({ type: 'string', not: { maxLength: 3 } }, { not: { maxLength: 5 } })).toEqual({
        type: 'string',
        not: { maxLength: 5 },
      });
    });
    test('reads the entries of a properties map as schemas rather than as keywords', () => {
      const parent: RJSFSchema = {
        type: 'array',
        items: { type: 'object', properties: { uniqueItems: true, a: { type: 'string', maxLength: 5 } } },
      };
      const option: RJSFSchema = {
        items: { properties: { uniqueItems: { type: 'string' }, a: { maxLength: 9 } } },
      };
      expect(getRenderedOptionSchema(parent, option)).toEqual({
        type: 'array',
        items: { type: 'object', properties: { uniqueItems: { type: 'string' }, a: { type: 'string', maxLength: 5 } } },
      });
    });
    test('passes on every type a parent allowing several types names', () => {
      expect(getRenderedOptionSchema({ type: ['string', 'number'] }, { minLength: 1 })).toEqual({
        type: ['string', 'number'],
        minLength: 1,
      });
    });
    test("leaves an option naming its own type with that type, over the parent's", () => {
      expect(getRenderedOptionSchema({ type: 'string' }, { type: 'null' })).toEqual({ type: 'null' });
    });
    test('returns the option itself when the parent has nothing to pass on', () => {
      const option: RJSFSchema = { minLength: 1 };
      expect(getRenderedOptionSchema({ title: 'Parent', anyOf: [option] }, option)).toBe(option);
    });
  });

  describe('an object parent', () => {
    const properties: RJSFSchema['properties'] = { a: { type: 'string' }, b: { type: 'string' } };
    test('passes on only its required list and its type, since its own ObjectField renders the rest', () => {
      const parent: RJSFSchema = { type: 'object', properties, required: ['a'], minProperties: 1 };
      expect(getRenderedOptionSchema(parent, { required: ['b'] })).toEqual({ type: 'object', required: ['a', 'b'] });
    });
    test('passes on the object type it was read as when it names no type of its own', () => {
      expect(getRenderedOptionSchema({ properties }, { required: ['a'] })).toEqual({
        type: 'object',
        required: ['a'],
      });
    });
    test("leaves an option naming its own type with that type, over the parent's", () => {
      expect(getRenderedOptionSchema({ properties }, { type: 'object', required: ['a'] })).toEqual({
        type: 'object',
        required: ['a'],
      });
    });
    test('passes on the type list of a nullable object', () => {
      expect(getRenderedOptionSchema({ type: ['object', 'null'], properties }, { required: ['a'] })).toEqual({
        type: ['object', 'null'],
        required: ['a'],
      });
    });
  });
});
