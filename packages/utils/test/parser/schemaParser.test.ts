import type { RJSFSchema } from '../../src/index.ts';
import { mergeSchemas, schemaParser } from '../../src/index.ts';
import {
  PROPERTY_DEPENDENCIES,
  RECURSIVE_REF,
  RECURSIVE_REF_ALLOF,
  SCHEMA_DEPENDENCIES,
  SCHEMA_WITH_ALLOF_CANNOT_MERGE,
  SCHEMA_AND_ONEOF_REF_DEPENDENCIES,
  SCHEMA_AND_REQUIRED_DEPENDENCIES,
  SCHEMA_WITH_ARRAY_CONDITION,
  SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES,
  SCHEMA_WITH_SINGLE_CONDITION,
  SCHEMA_WITH_MULTIPLE_CONDITIONS,
  SCHEMA_WITH_NESTED_CONDITIONS,
  SUPER_SCHEMA,
} from '../testUtils/testData.ts';

describe('schemaParser()', () => {
  it('parses the oneOf options of a schema whose anyOf is resolved first', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        both: {
          anyOf: [{ type: 'string' }, { type: 'number' }],
          oneOf: [
            { minLength: 1, title: 'filled' },
            { maxLength: 0, title: 'empty' },
          ],
        },
      },
    };
    const titles = Object.values(schemaParser(schema)).map((value) => value.title);
    expect(titles).toContain('filled');
    expect(titles).toContain('empty');
  });

  it('parses the properties an option declares that its parent does not', () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            x: {
              anyOf: [
                { type: 'string', minLength: 3, title: 'text' },
                { type: 'number', minimum: 7, title: 'count' },
              ],
            },
          },
        },
      ],
    };
    const titles = Object.values(schemaParser(schema)).map((value) => value.title);
    expect(titles).toContain('text');
    expect(titles).toContain('count');
  });

  it('parses the items an option declares that its parent does not', () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string', minLength: 3, title: 'text' },
              { type: 'number', minimum: 7, title: 'count' },
            ],
          },
        },
      ],
    };
    const titles = Object.values(schemaParser(schema)).map((value) => value.title);
    expect(titles).toContain('text');
    expect(titles).toContain('count');
  });

  it.each(['anyOf', 'oneOf'])('parses the properties and items of a schema with an empty %s', (key) => {
    const itemOptions: RJSFSchema = {
      anyOf: [
        { type: 'string', minLength: 3, title: 'text' },
        { type: 'number', minimum: 7, title: 'count' },
      ],
    };
    const propertyOptions: RJSFSchema = {
      anyOf: [
        { type: 'string', maxLength: 3, title: 'code' },
        { type: 'number', maximum: 7, title: 'size' },
      ],
    };
    const schema: RJSFSchema = {
      type: 'object',
      [key]: [],
      properties: { x: propertyOptions },
      items: itemOptions,
    };
    const titles = Object.values(schemaParser(schema)).map((value) => value.title);
    expect(titles).toEqual(expect.arrayContaining(['text', 'count', 'code', 'size']));
  });

  it('parses property dependencies properly', () => {
    const schemaMap = schemaParser(PROPERTY_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses recursive refs properly', () => {
    const schemaMap = schemaParser(RECURSIVE_REF);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses recursive refs in allOf properly', () => {
    const schemaMap = schemaParser(RECURSIVE_REF_ALLOF);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema dependencies properly', () => {
    const schemaMap = schemaParser(SCHEMA_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema dependencies with one of and refs properly', () => {
    const schemaMap = schemaParser(SCHEMA_AND_ONEOF_REF_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema and required dependencies properly', () => {
    const schemaMap = schemaParser(SCHEMA_AND_REQUIRED_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with oneof and nested dependencies', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with a single condition', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_SINGLE_CONDITION);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with multiple conditions', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_MULTIPLE_CONDITIONS);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with nested conditions', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_NESTED_CONDITIONS);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses superSchema properly', () => {
    const schemaMap = schemaParser(SUPER_SCHEMA);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parse schema with array condition', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_ARRAY_CONDITION);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parse schema with allof not able to merge', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_ALLOF_CANNOT_MERGE);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses the properties that only a oneOf option has', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      oneOf: [
        { properties: { a: { oneOf: [{ const: 'x1' }, { const: 'x2' }] } } },
        { properties: { b: { type: 'string' } } },
      ],
    };
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 'x1' }));
  });
  it('parses the options of a property that every oneOf option redefines', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: { a: { oneOf: [{ const: 'p1' }, { const: 'p2' }] } },
      oneOf: [
        { properties: { a: { oneOf: [{ const: 'o1' }, { const: 'o2' }] } } },
        { properties: { a: { oneOf: [{ const: 'o3' }] } } },
      ],
    };
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'p1' }));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'o1' }));
  });
  it('parses the items that only a oneOf option has', () => {
    const rootSchema: RJSFSchema = {
      oneOf: [{ type: 'array', items: { oneOf: [{ const: 1 }, { const: 2 }] } }, { type: 'string' }],
    };
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 1 }));
  });
  describe('with a customMergeAllOf', () => {
    // Titles the `choice` options, so the options the form validates against differ from the unmerged ones
    const customMergeAllOf = (schema: RJSFSchema): RJSFSchema => {
      const { allOf, ...rest } = schema;
      const merged = (allOf as RJSFSchema[]).reduce((acc, s) => mergeSchemas(acc, s) as RJSFSchema, rest);
      const choice = merged.properties?.choice as RJSFSchema | undefined;
      if (!choice?.oneOf) {
        return merged;
      }
      const oneOf = choice.oneOf.map((o) => ({ ...(o as RJSFSchema), title: `Option ${(o as RJSFSchema).const}` }));
      return { ...merged, properties: { ...merged.properties, choice: { ...choice, oneOf } } };
    };
    const customOption = expect.objectContaining({ const: 'b', title: 'Option b' });
    const choice: RJSFSchema = { oneOf: [{ const: 'a' }, { const: 'b' }] };

    it('parses an allOf merged with it', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(customOption);
      expect(Object.values(schemaParser(rootSchema, { customMergeAllOf }))).toContainEqual(customOption);
    });
    it('parses the allOf merged for a pattern-matching property with it', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { p: { type: 'object', properties: { x: { type: 'string' } } } },
        patternProperties: { '^p$': { properties: { choice } } },
      };
      expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(customOption);
      expect(Object.values(schemaParser(rootSchema, { customMergeAllOf }))).toContainEqual(customOption);
    });
    it('resolves an allOf merged with it further, as the form does', () => {
      // The `patternProperties` only applies to `p` once the `allOf` is merged
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [
          { properties: { p: { type: 'object', properties: { x: { type: 'string' } } } } },
          { patternProperties: { '^p$': { properties: { choice } } } },
        ],
      };
      expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(customOption);
      expect(Object.values(schemaParser(rootSchema, { customMergeAllOf }))).toContainEqual(customOption);
    });
    it('keeps a merge that leaves the allOf in place without expanding it again', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      const identityMergeAllOf = (schema: RJSFSchema) => schema;
      expect(schemaParser(rootSchema, { customMergeAllOf: identityMergeAllOf })).toEqual(schemaParser(rootSchema));
    });
    it('parses the allOf branches alone when it throws', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      const throwingMergeAllOf = () => {
        throw new Error('cannot merge');
      };
      expect(schemaParser(rootSchema, { customMergeAllOf: throwingMergeAllOf })).toEqual(schemaParser(rootSchema));
    });
  });
});
