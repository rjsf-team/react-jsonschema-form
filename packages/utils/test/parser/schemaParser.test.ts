import type { RJSFSchema } from '../../src/index.ts';
import { mergeSchemas, schemaParser } from '../../src/index.ts';
import {
  CHOICE as choice,
  SCHEMA_MERGED_FOR_PATTERN_PROPERTY,
  TITLED_CHOICE_OPTION,
  titleChoiceMergeAllOf as customMergeAllOf,
} from '../testUtils/customMergeAllOfData.ts';
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
  it('parses the options a oneOf option only has through its own allOf', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: {
        p: {
          oneOf: [
            {
              type: 'object',
              allOf: [
                { properties: { choice: { oneOf: [{ const: 'a' }, { const: 'b' }] } } },
                { properties: { z: { type: 'string' } } },
              ],
            },
          ],
        },
      },
    };
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 'a' }));
  });
  it('parses the options of a property the merged allOf gives its patternProperties', () => {
    // The `patternProperties` only applies to `p` once the `allOf` is merged, so only the merged schema has the options
    const rootSchema: RJSFSchema = {
      type: 'object',
      allOf: [
        { properties: { p: { type: 'object', properties: { x: { type: 'string' } } } } },
        { patternProperties: { '^p$': { properties: { choice: { oneOf: [{ const: 'a' }, { const: 'b' }] } } } } },
      ],
    };
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 'a' }));
  });
  it('parses the options of every position of a tuple items and of its additionalItems', () => {
    const rootSchema: RJSFSchema = {
      type: 'array',
      items: [{ oneOf: [{ const: 'i1' }, { const: 'i2' }] }, { type: 'string' }],
      additionalItems: { anyOf: [{ const: 'a1' }, { const: 'a2' }] },
    };
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'i1' }));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'a1' }));
  });
  it('parses the options of the additionalProperties and patternProperties a form renders extra keys with', () => {
    // No form data is parsed, so an extra key is never stubbed into `properties`; the schemas a form renders one with
    // have to be reached through the keywords themselves
    const rootSchema: RJSFSchema = {
      type: 'object',
      patternProperties: { '^x': { oneOf: [{ const: 'pp1' }, { const: 'pp2' }] } },
      additionalProperties: { oneOf: [{ const: 'ap1' }, { const: 'ap2' }] },
    };
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'pp1' }));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'ap1' }));
  });
  it('parses no additionalItems of an items that is not a tuple, as a form renders none', () => {
    const rootSchema: RJSFSchema = {
      type: 'array',
      items: { type: 'string' },
      additionalItems: { oneOf: [{ const: 'never' }] },
    };
    expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(expect.objectContaining({ const: 'never' }));
  });
  it('parses a schema whose allOf nests without multiplying the merges it makes', () => {
    const nested = (n: number): RJSFSchema => ({
      allOf: [{ properties: { [`a${n}`]: { type: 'string' } } }, { properties: { [`b${n}`]: { type: 'string' } } }],
    });
    const rootSchema: RJSFSchema = { type: 'object', allOf: [0, 1, 2, 3, 4, 5].map(nested) };
    let merges = 0;
    const customMergeAllOf = (schema: RJSFSchema) => {
      merges += 1;
      const { allOf, ...rest } = schema;
      return (allOf as RJSFSchema[]).reduce((acc, s) => mergeSchemas(acc, s) as RJSFSchema, rest);
    };
    schemaParser(rootSchema, { customMergeAllOf });
    // One merge per `allOf`, rather than one per combination of the branches of the nested ones
    expect(merges).toBe(7);
  });
  describe('with a customMergeAllOf', () => {
    const customOption = expect.objectContaining(TITLED_CHOICE_OPTION);

    it('parses an allOf merged with it', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(customOption);
      expect(Object.values(schemaParser(rootSchema, { customMergeAllOf }))).toContainEqual(customOption);
    });
    it('parses the allOf merged for a pattern-matching property with it', () => {
      const rootSchema = SCHEMA_MERGED_FOR_PATTERN_PROPERTY;
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
    it('parses the options it merges rather than the unmerged ones', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      // The form only ever validates against the options the merge produced, so the unmerged ones are left uncompiled
      const schemas = Object.values(schemaParser(rootSchema, { customMergeAllOf }));
      expect(schemas).toContainEqual(customOption);
      expect(schemas).not.toContainEqual(expect.objectContaining({ const: 'b', title: undefined }));
    });
    it('parses nothing of an allOf it leaves in place, as the form renders nothing of one', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      const identityMergeAllOf = (schema: RJSFSchema) => schema;
      // A merge that returns its input leaves the form with no `properties` to render, so there is nothing to validate
      expect(Object.values(schemaParser(rootSchema, { customMergeAllOf: identityMergeAllOf }))).toEqual([
        expect.objectContaining({ allOf: expect.any(Array) }),
      ]);
    });
    it('parses the allOf with it dropped when it throws, as the form does', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { kept: { oneOf: [{ const: 'k1' }, { const: 'k2' }] } },
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      const throwingMergeAllOf = () => {
        throw new Error('cannot merge');
      };
      const schemas = Object.values(schemaParser(rootSchema, { customMergeAllOf: throwingMergeAllOf }));
      // The form drops an `allOf` it cannot merge, keeping the rest of the schema, and validates against that
      expect(schemas).toContainEqual(expect.objectContaining({ const: 'k1' }));
      expect(schemas).not.toContainEqual(expect.objectContaining({ const: 'b' }));
    });
  });
});
