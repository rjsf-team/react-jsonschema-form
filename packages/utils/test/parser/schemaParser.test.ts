import type { RJSFSchema } from '../../src/index.ts';
import { getValidationSchemas, ID_KEY, schemaKey } from '../../src/index.ts';
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

/** The schemas `getValidationSchemas()` lists, without the `$id` it keys each one by */
function listed(rootSchema: RJSFSchema): RJSFSchema[] {
  return Object.values(getValidationSchemas(rootSchema)).map(({ [ID_KEY]: _id, ...schema }) => schema);
}

describe('getValidationSchemas()', () => {
  it('parses property dependencies properly', () => {
    const schemaMap = getValidationSchemas(PROPERTY_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses recursive refs properly', () => {
    const schemaMap = getValidationSchemas(RECURSIVE_REF);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses recursive refs in allOf properly', () => {
    const schemaMap = getValidationSchemas(RECURSIVE_REF_ALLOF);
    expect(schemaMap).toMatchSnapshot();
  });
  it.each<[string, RJSFSchema]>([
    [
      'two definitions whose patterns match the keys referring to each other (#5452 a)',
      {
        $ref: '#/definitions/x',
        definitions: {
          x: {
            type: 'object',
            properties: { y: { $ref: '#/definitions/y' } },
            patternProperties: { '^y': { title: 'Y' } },
          },
          y: {
            type: 'object',
            properties: { x: { $ref: '#/definitions/x' } },
            patternProperties: { '^x': { title: 'X' } },
          },
        },
      },
    ],
    [
      'an allOf entry declaring a recursive property its own pattern matches (#5452 b)',
      {
        $ref: '#/definitions/node',
        definitions: {
          node: {
            type: 'object',
            allOf: [
              {
                properties: { child: { $ref: '#/definitions/node' }, name: { type: 'string' } },
                patternProperties: { '^child': { title: 'Child' } },
              },
            ],
          },
        },
      },
    ],
  ])('terminates on %s, listing the root alone', (_, rootSchema) => {
    expect(listed(rootSchema)).toEqual([rootSchema]);
  });
  it('parses schema dependencies properly', () => {
    const schemaMap = getValidationSchemas(SCHEMA_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema dependencies with one of and refs properly', () => {
    const schemaMap = getValidationSchemas(SCHEMA_AND_ONEOF_REF_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema and required dependencies properly', () => {
    const schemaMap = getValidationSchemas(SCHEMA_AND_REQUIRED_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with oneof and nested dependencies', () => {
    const schemaMap = getValidationSchemas(SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with a single condition', () => {
    const schemaMap = getValidationSchemas(SCHEMA_WITH_SINGLE_CONDITION);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with multiple conditions', () => {
    const schemaMap = getValidationSchemas(SCHEMA_WITH_MULTIPLE_CONDITIONS);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with nested conditions', () => {
    const schemaMap = getValidationSchemas(SCHEMA_WITH_NESTED_CONDITIONS);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses superSchema properly', () => {
    const schemaMap = getValidationSchemas(SUPER_SCHEMA);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parse schema with array condition', () => {
    const schemaMap = getValidationSchemas(SCHEMA_WITH_ARRAY_CONDITION);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parse schema with allof not able to merge', () => {
    const schemaMap = getValidationSchemas(SCHEMA_WITH_ALLOF_CANNOT_MERGE);
    expect(schemaMap).toMatchSnapshot();
  });
  it('keys every schema by schemaKey(), carrying the key as its $id', () => {
    const schemaMap = getValidationSchemas(SUPER_SCHEMA);
    for (const [key, schema] of Object.entries(schemaMap)) {
      expect(schema[ID_KEY]).toBe(key);
    }
    expect(schemaMap[schemaKey(SUPER_SCHEMA)]).toEqual({ ...SUPER_SCHEMA, [ID_KEY]: schemaKey(SUPER_SCHEMA) });
  });

  it('lists each if by pointer, whether or not it has an else (#5453)', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' }, nested: { if: { required: ['b'] }, then: { required: ['c'] } } },
      if: { properties: { a: { const: 'x' } }, required: ['a'] },
      then: { properties: { extra: { type: 'string' } } },
    };
    expect(listed(schema)).toEqual([schema, { $ref: '#/if' }, { $ref: '#/properties/nested/if' }]);
  });

  it('lists each option by pointer, and as scored without the required it states', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        v: {
          oneOf: [
            { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
            { type: 'object', properties: { b: { type: 'string' } }, additionalProperties: false },
          ],
        },
      },
    };
    expect(listed(schema)).toEqual([
      schema,
      { $ref: '#/properties/v/oneOf/0' },
      { type: 'object', properties: { a: { $ref: '#/properties/v/oneOf/0/properties/a' } } },
      { $ref: '#/properties/v/oneOf/1' },
      {
        type: 'object',
        properties: { b: { $ref: '#/properties/v/oneOf/1/properties/b' } },
        additionalProperties: true,
      },
    ]);
  });

  it('reads a $ref an option spells as an allOf entry of what it names when it scores the option', () => {
    const schema: RJSFSchema = {
      definitions: { Base: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
      oneOf: [{ $ref: '#/definitions/Base', title: 'derived', required: ['x'] }, { type: 'number' }],
    };
    expect(listed(schema)).toContainEqual({
      title: 'derived',
      allOf: [{ type: 'object', properties: { id: { $ref: '#/definitions/Base/properties/id' } } }],
    });
  });

  it('lists the discriminator property of each option by pointer', () => {
    const schema: RJSFSchema = {
      discriminator: { propertyName: 'kind' },
      oneOf: [
        { properties: { kind: { type: 'string', pattern: '^a' } } },
        { properties: { kind: { type: 'string', pattern: '^b' } } },
      ],
    };
    expect(listed(schema)).toEqual(
      expect.arrayContaining([{ $ref: '#/oneOf/0/properties/kind' }, { $ref: '#/oneOf/1/properties/kind' }]),
    );
  });

  it('lists the discriminator property of the options a $ref beside the discriminator reaches', () => {
    const field: RJSFSchema = { $ref: '#/definitions/S', discriminator: { propertyName: 'kind' } };
    const schema: RJSFSchema = {
      definitions: {
        S: {
          oneOf: [{ properties: { kind: { type: 'string', const: 'a' } } }, { properties: { b: { type: 'string' } } }],
        },
      },
      type: 'object',
      properties: { s: field },
    };
    const kinds = listed(schema).filter(({ $ref }) => typeof $ref === 'string' && $ref.endsWith('/kind'));
    expect(kinds).toEqual([{ $ref: '#/definitions/S/oneOf/0/properties/kind' }]);
  });

  it("lists the condition each option of a dependency's oneOf is matched on", () => {
    const schema: RJSFSchema = {
      definitions: { refOption: { properties: { pet: { const: 'cat' } } } },
      properties: { pet: { type: 'string' } },
      dependencies: {
        pet: { oneOf: [{ properties: { pet: { const: 'dog' } } }, { $ref: '#/definitions/refOption' }] },
      },
    };
    expect(listed(schema)).toEqual(
      expect.arrayContaining([
        { type: 'object', properties: { pet: { $ref: '#/dependencies/pet/oneOf/0/properties/pet' } } },
        { type: 'object', properties: { pet: { $ref: '#/definitions/refOption/properties/pet' } } },
      ]),
    );
  });

  it('percent-encodes a pointer token a URI fragment cannot hold as it stands', () => {
    const schema: RJSFSchema = { properties: { 'a b/c%': { if: { type: 'string' } } } };
    expect(listed(schema)).toContainEqual({ $ref: '#/properties/a%20b~1c%25/if' });
  });

  it('terminates on a oneOf of a $ref to the root beside dependencies (#5452 c)', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
      dependencies: { a: ['b'] },
      oneOf: [{ $ref: '#' }, { properties: { c: { type: 'string' } } }],
    };
    const schemas = listed(schema);
    expect(schemas).toContainEqual({ $ref: '#/oneOf/0' });
    // The listed `dependencies` of the root are a `required` in disguise, so the option is scored without them
    expect(schemas).toContainEqual({
      allOf: [
        {
          type: 'object',
          properties: { a: { $ref: '#/properties/a' }, b: { $ref: '#/properties/b' } },
          oneOf: [{ $ref: '#/oneOf/0' }, { $ref: '#/oneOf/1' }],
        },
      ],
    });
  });

  it('throws when two different schemas share a key', () => {
    // `Aa` and `BB` hash alike, so the two pointers differing only there do too
    const schema: RJSFSchema = { properties: { Aa: { if: { type: 'string' } }, BB: { if: { type: 'string' } } } };
    expect(() => getValidationSchemas(schema)).toThrow(`Two different schemas exist with the same key`);
  });
});
