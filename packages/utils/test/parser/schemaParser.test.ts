import type { RJSFSchema } from '../../src/index.ts';
import { getValidationSchemas, ID_KEY, noop, resetLogOnce, schemaKey, schemaParser } from '../../src/index.ts';
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

describe('schemaParser()', () => {
  it('lists what getValidationSchemas() lists, under the name 6.x exported it as', () => {
    // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias
    expect(schemaParser(SCHEMA_WITH_SINGLE_CONDITION)).toEqual(getValidationSchemas(SCHEMA_WITH_SINGLE_CONDITION));
  });
});

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
  it.each<[string, RJSFSchema, string]>([
    [
      'a true anyOf option',
      { type: 'object', properties: { p: { anyOf: [true, { type: 'string', title: 'text' }] } } },
      '#/properties/p/anyOf/1',
    ],
    [
      'a false oneOf option',
      { type: 'object', properties: { p: { oneOf: [false, { type: 'string', title: 'text' }] } } },
      '#/properties/p/oneOf/1',
    ],
    ['a true option of the root', { anyOf: [true, { type: 'string', title: 'text' }] }, '#/anyOf/1'],
    [
      'a true option of a dependency oneOf',
      {
        type: 'object',
        properties: { a: { type: 'string' } },
        dependencies: {
          a: { oneOf: [true, { title: 'text', properties: { a: { const: 'x' }, b: { type: 'string' } } }] },
        },
      },
      '#/dependencies/a/oneOf/1',
    ],
  ])('lists the other options of a list holding %s', (_, rootSchema, pointer) => {
    expect(Object.values(getValidationSchemas(rootSchema))).toContainEqual(expect.objectContaining({ $ref: pointer }));
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
  it('lists each if of a schema whose allOf, dependencies and condition multiply into 8192 forms once, without warning', () => {
    resetLogOnce();
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    const oneSided = (key: string): RJSFSchema => ({
      if: { required: [`if_${key}`] },
      then: { properties: { [key]: { type: 'string' } } },
    });
    const schemaWith = (dependencyCount: number): RJSFSchema => {
      const names = Array.from({ length: dependencyCount }, (_, i) => `d${i}`);
      return {
        type: 'object',
        properties: Object.fromEntries(names.map((name) => [name, {}])),
        dependencies: Object.fromEntries(names.map((name) => [name, { properties: { [`dep_${name}`]: {} } }])),
        allOf: ['a0', 'a1', 'a2', 'a3'].map(oneSided),
        ...oneSided('own'),
      };
    };
    // 256 dependency paths, 16 allOf forms and 2 for the condition would give 8192 forms, but the graph lists a
    // pointer to each `if` rather than the forms their combinations resolve to, so there is no limit to pass
    const conditions = ['#/if', '#/allOf/0/if', '#/allOf/1/if', '#/allOf/2/if', '#/allOf/3/if'].map(($ref) => ({
      $ref,
    }));
    expect(listed(schemaWith(8))).toEqual([schemaWith(8), ...conditions]);
    expect(listed(schemaWith(2))).toEqual([schemaWith(2), ...conditions]);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
  it('lists a schema with nine schema dependencies as it stands, with no limit on their subsets to warn about', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    resetLogOnce();
    const keys = Array.from({ length: 9 }, (_, i) => `k${i}`);
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: Object.fromEntries(keys.map((key) => [key, { type: 'string' }])),
      dependencies: Object.fromEntries(keys.map((key) => [key, { properties: { [`${key}v`]: { type: 'string' } } }])),
    };
    // A form applies a schema dependency without asking the validator, and validates the data against the root, which
    // applies whichever subset of them the data selects
    expect(listed(rootSchema)).toEqual([rootSchema]);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
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

  it('lists the scored form of an option that stubs the keys of the data into its properties, whatever the keys', () => {
    const option: RJSFSchema = {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      patternProperties: { '^s_': { type: 'string' } },
    };
    const strict: RJSFSchema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: false,
    };
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: { oneOf: [option, strict] } } };
    // Scoring reads an option where it sits rather than the copy retrieved with the data's keys stubbed into it, so
    // one scored form serves whatever keys the data holds, and the strict option gets one plain and one relaxed
    const name = { $ref: '#/properties/v/oneOf/1/properties/name' };
    expect(listed(rootSchema)).toEqual([
      rootSchema,
      { $ref: '#/properties/v/oneOf/0' },
      {
        type: 'object',
        properties: { id: { $ref: '#/properties/v/oneOf/0/properties/id' } },
        patternProperties: { '^s_': { $ref: '#/properties/v/oneOf/0/patternProperties/%5Es_' } },
      },
      { $ref: '#/properties/v/oneOf/1' },
      { type: 'object', properties: { name }, additionalProperties: false },
      { type: 'object', properties: { name }, additionalProperties: true },
    ]);
  });
  it('lists an option with no names of its own by pointer alone, which it is scored by whatever its keys hold', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: { v: { oneOf: [{ type: 'object', additionalProperties: true }, { type: 'number' }] } },
    };
    expect(listed(rootSchema)).toEqual([
      rootSchema,
      { $ref: '#/properties/v/oneOf/0' },
      { $ref: '#/properties/v/oneOf/1' },
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
