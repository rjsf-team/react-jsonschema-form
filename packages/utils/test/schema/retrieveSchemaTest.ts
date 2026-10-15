import type { MockInstance } from 'vitest';

import type { RJSFSchema } from '../../src/index.ts';
import {
  ADDITIONAL_PROPERTY_FLAG,
  GUESSED_TYPE_FLAG,
  createSchemaUtils,
  getByPath,
  getRenderedOptionSchema,
  isObject,
  PROPERTIES_KEY,
  retrieveSchema,
  RJSF_PROVENANCE_KEY,
  RJSF_REF_CYCLE_KEY,
  RJSF_REF_KEY,
  noop,
} from '../../src/index.ts';
import {
  getAdditionalPropertyType,
  relaxOptionsForScoring,
  resolveOwnRef,
  stubExistingAdditionalProperties,
} from '../../src/schema/retrieveSchema.ts';
import {
  PROPERTY_DEPENDENCIES,
  RECURSIVE_REF,
  RECURSIVE_REF_ALLOF,
  SCHEMA_AND_ONEOF_REF_DEPENDENCIES,
  SCHEMA_AND_REQUIRED_DEPENDENCIES,
  SCHEMA_DEPENDENCIES,
  SCHEMA_WITH_MULTIPLE_CONDITIONS,
  SCHEMA_WITH_NESTED_CONDITIONS,
  SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES,
  SCHEMA_WITH_SINGLE_CONDITION,
  SUPER_SCHEMA,
} from '../testUtils/testData.ts';
import type { TestValidatorType } from './types.ts';

/** Reads a subschema handed out by `retrieveSchema()` as the schema it is, or the empty schema for any other value */
function schemaOf(value: unknown): RJSFSchema {
  return isObject(value) && !Array.isArray(value) ? value : {};
}

/** Retrieves the subschema a retrieved `schema` holds at `key`, as the field rendering it does: `retrieveSchema()`
 * hands out a `$ref` below the schema it retrieves as it stands, for the field holding it to resolve
 */
function retrieveProperty(
  testValidator: TestValidatorType,
  schema: RJSFSchema,
  key: string,
  rootSchema: RJSFSchema,
  formData?: unknown,
): RJSFSchema {
  return retrieveSchema({ validator: testValidator }, schemaOf(schema.properties?.[key]), rootSchema, formData);
}

export default function retrieveSchemaTest(testValidator: TestValidatorType) {
  describe('getAdditionalPropertyType()', () => {
    it('returns the type the schema names, resolving a nullable one', () => {
      expect(getAdditionalPropertyType({ type: 'string' })).toBe('string');
      expect(getAdditionalPropertyType({ type: ['integer', 'null'] })).toBe('integer');
      expect(getAdditionalPropertyType({ type: ['null'] })).toBe('null');
    });
    it('returns the type the schema implies', () => {
      expect(getAdditionalPropertyType({ properties: { foo: { type: 'string' } } })).toBe('object');
    });
    it('returns the type the values of a typeless enum have', () => {
      // `getSchemaType()` answers `string` for any typeless `enum`, which would seed one of numbers with a string it
      // rejects
      expect(getAdditionalPropertyType({ enum: [1, 2] })).toBe('number');
      expect(getAdditionalPropertyType({ enum: [null, 1] })).toBe('number');
      expect(getAdditionalPropertyType({ enum: [null] })).toBe('null');
      expect(getAdditionalPropertyType({ type: 'string', enum: ['a'] })).toBe('string');
    });
    it('returns the type anyOf or oneOf options agree on', () => {
      expect(getAdditionalPropertyType({ anyOf: [{ properties: {} }, { type: 'object' }] })).toBe('object');
      expect(getAdditionalPropertyType({ oneOf: [{ type: 'number', minimum: 0 }, { type: 'number' }] })).toBe('number');
      // Each option is read the same way the schema itself is, so an option's own typeless `enum` speaks for it rather
      // than answering the `string` `getSchemaType()` gives any of them
      expect(getAdditionalPropertyType({ anyOf: [{ enum: [1] }, { enum: [2, 3] }] })).toBe('number');
    });
    it('returns undefined for anyOf or oneOf options that disagree about the type', () => {
      expect(getAdditionalPropertyType({ anyOf: [{ type: 'string' }, { type: 'number' }] })).toBeUndefined();
      expect(getAdditionalPropertyType({ oneOf: [{ type: 'string' }, true] })).toBeUndefined();
      expect(getAdditionalPropertyType({ anyOf: [{ minLength: 2 }] })).toBeUndefined();
    });
    it('returns the type the definition a reference names says, given a root schema to look it up in', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          cat: { type: 'object', properties: { meow: { type: 'string' } } },
          dog: { properties: { woof: { type: 'string' } } },
          named: { $ref: '#/definitions/cat' },
          loop: { oneOf: [{ $ref: '#/definitions/loop' }] },
        },
      };
      // A `$ref` is how an option usually names the object or the enum it is, so options spelled as one agree on a type
      // the way inline options do
      expect(
        getAdditionalPropertyType(
          { oneOf: [{ $ref: '#/definitions/cat' }, { $ref: '#/definitions/dog' }] },
          rootSchema,
        ),
      ).toBe('object');
      // Two options naming the same definition both read it, and a reference the definition itself holds is followed on
      expect(
        getAdditionalPropertyType(
          { anyOf: [{ $ref: '#/definitions/cat' }, { $ref: '#/definitions/named' }] },
          rootSchema,
        ),
      ).toBe('object');
      // A reference followed once is not followed again, since a recursive option refers back to itself without end,
      // and one naming no definition says nothing about the type
      expect(getAdditionalPropertyType({ $ref: '#/definitions/loop' }, rootSchema)).toBeUndefined();
      expect(getAdditionalPropertyType({ $ref: '#/definitions/missing' }, rootSchema)).toBeUndefined();
      // Without a root schema there is no definition to read the type out of
      expect(getAdditionalPropertyType({ $ref: '#/definitions/cat' })).toBeUndefined();
    });
    it('reads the subschemas merged in beside options that name no type between them', () => {
      // The options answer only where they agree on a type. An `allOf` entry and a `$ref` beside them hold the value
      // whichever option is chosen, so a type one of those names is the whole subschema's, which is what
      // `retrieveSchema()` would read off the merge had anything resolved it
      expect(getAdditionalPropertyType({ allOf: [{ type: 'number' }], anyOf: [{ minimum: 1 }, { maximum: 5 }] })).toBe(
        'number',
      );
      const rootSchema: RJSFSchema = { definitions: { n: { type: 'number' } } };
      expect(
        getAdditionalPropertyType({ $ref: '#/definitions/n', anyOf: [{ minimum: 1 }, { maximum: 5 }] }, rootSchema),
      ).toBe('number');
      // Options that disagree are read the same way: the merge holds the value to the entry under either of them
      expect(
        getAdditionalPropertyType({ allOf: [{ type: 'number' }], anyOf: [{ type: 'number' }, { type: 'string' }] }),
      ).toBe('number');
    });
    it('reads a definition two merged entries both name, where the first of them shadows its type', () => {
      // Each entry follows the references reaching the subschema without consuming them for the entries beside it, as
      // an option does: the second entry resolves the definition unshadowed, so the type behind it answers for the
      // merge even where the first replaced it with a name JSON Schema does not define
      const rootSchema: RJSFSchema = { definitions: { n: { type: 'number' } } };
      // `JSON.parse` because a type name JSON Schema does not define is one only an untyped caller can write, which is
      // also what makes the first entry shadow the definition's type without naming a type of its own
      const subSchema: RJSFSchema = JSON.parse(
        '{ "allOf": [{ "$ref": "#/definitions/n", "type": "notAType" }, { "$ref": "#/definitions/n" }] }',
      );
      expect(getAdditionalPropertyType(subSchema, rootSchema)).toBe('number');
    });
    it('returns the type an allOf entry names, since the merge holds the value to every entry at once', () => {
      expect(getAdditionalPropertyType({ allOf: [{ type: 'number' }] })).toBe('number');
      // An entry naming no type adds nothing to the one that does, whichever order they come in
      expect(getAdditionalPropertyType({ allOf: [{ minimum: 0 }, { type: 'number' }] })).toBe('number');
      expect(getAdditionalPropertyType({ allOf: [true, { enum: [1, 2] }] })).toBe('number');
      expect(getAdditionalPropertyType({ allOf: [{ minimum: 0 }] })).toBeUndefined();
    });
    it('returns undefined for a schema that says nothing about the type', () => {
      expect(getAdditionalPropertyType({})).toBeUndefined();
      expect(getAdditionalPropertyType({ minLength: 2 })).toBeUndefined();
    });
  });
  describe('resolveOwnRef()', () => {
    const components = {
      schemas: {
        M: { $ref: '#/components/schemas/O', properties: { b: { type: 'string' } } },
        O: { type: 'object', properties: { a: { type: 'string' } } },
      },
    };
    const option: RJSFSchema = { $ref: '#/components/schemas/M' };

    it('reads a definition no $ref of the root reaches as the form reads it, the keywords beside a chained $ref merged in', () => {
      const unreached: RJSFSchema = { components };
      const reached: RJSFSchema = { components, properties: { x: { $ref: '#/components/schemas/M' } } };
      const expected = {
        type: 'object',
        properties: { b: { type: 'string' }, a: { type: 'string' } },
        [RJSF_REF_KEY]: '#/components/schemas/M',
      };

      expect(resolveOwnRef(option, unreached)).toEqual(expected);
      expect(resolveOwnRef(option, reached)).toEqual(expected);
      expect(retrieveSchema({ validator: testValidator }, option, unreached).properties).toEqual(expected.properties);
    });
    it('throws for a $ref that names no definition', () => {
      expect(() => resolveOwnRef({ $ref: '#/components/schemas/missing' }, { components })).toThrow(
        'Could not find a definition for #/components/schemas/missing.',
      );
    });
  });
  describe('retrieveSchema()', () => {
    let consoleWarnSpy: MockInstance;
    beforeAll(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop); // mock this to avoid actually warning in the tests
    });
    afterAll(() => {
      consoleWarnSpy.mockRestore();
    });
    afterEach(() => {
      consoleWarnSpy.mockClear();
      testValidator.reset?.();
    });
    it('returns empty object when schema is not an object', () => {
      expect(retrieveSchema({ validator: testValidator }, [] as RJSFSchema)).toEqual({});
    });
    it('tolerates a schema with an explicitly undefined `properties`', () => {
      const schema = { type: 'object', properties: undefined } as RJSFSchema;
      expect(retrieveSchema({ validator: testValidator }, schema)).toEqual({
        type: 'object',
        properties: {},
      });
    });
    it('should `resolve` a schema which contains definitions', () => {
      const schema: RJSFSchema = { $ref: '#/definitions/address' };
      const address: RJSFSchema = {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['street_address', 'city', 'state'],
      };
      const rootSchema: RJSFSchema = { definitions: { address } };

      expect(retrieveSchema({ validator: testValidator }, schema, rootSchema)).toEqual({
        ...address,
        [RJSF_REF_KEY]: '#/definitions/address',
      });
    });
    it('should `resolve` a schema which contains definitions not in `#/definitions`', () => {
      const address: RJSFSchema = {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['street_address', 'city', 'state'],
      };
      const schema: RJSFSchema = {
        $ref: '#/definitions/address',
        definitions: { address },
      };

      expect(retrieveSchema({ validator: testValidator }, schema, schema)).toEqual({
        definitions: { address },
        ...address,
        [RJSF_REF_KEY]: '#/definitions/address',
      });
    });
    it('should give an error when JSON pointer is not in a URI encoded format', () => {
      const address: RJSFSchema = {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['street_address', 'city', 'state'],
      };
      const schema: RJSFSchema = {
        $ref: '/definitions/schemas/address',
        definitions: { address },
      };

      expect(() => retrieveSchema({ validator: testValidator }, schema, schema)).toThrow('Could not find a definition');
    });
    it('should give an error when JSON pointer does not point to anything', () => {
      const schema: RJSFSchema = {
        $ref: '#/definitions/schemas/address',
        definitions: { schemas: {} },
      };

      expect(() => retrieveSchema({ validator: testValidator }, schema, schema)).toThrow('Could not find a definition');
    });
    it('should `resolve` escaped JSON Pointers', () => {
      const schema: RJSFSchema = { $ref: '#/definitions/a~0complex~1name' };
      const address: RJSFSchema = { type: 'string' };
      const rootSchema: RJSFSchema = {
        definitions: { 'a~complex/name': address },
      };

      expect(retrieveSchema({ validator: testValidator }, schema, rootSchema)).toEqual({
        ...address,
        [RJSF_REF_KEY]: '#/definitions/a~0complex~1name',
      });
    });
    it('should `resolve` and stub out a schema which contains an `additionalProperties` with a definition', () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          $ref: '#/definitions/address',
        },
      };

      const address: RJSFSchema = {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['street_address', 'city', 'state'],
      };

      const rootSchema: RJSFSchema = { definitions: { address } };
      const formData = { newKey: {} };

      expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
        ...schema,
        properties: {
          newKey: {
            ...address,
            [RJSF_REF_KEY]: '#/definitions/address',
            [ADDITIONAL_PROPERTY_FLAG]: true,
          },
        },
      });
    });
    it('should resolve conditions in additionalProperties $ref using the additional property value', () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          $ref: '#/definitions/property',
        },
      };

      const property: RJSFSchema = {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['string', 'object'],
          },
        },
        if: {
          required: ['type'],
          properties: {
            type: {
              const: 'object',
            },
          },
        },
        then: {
          properties: {
            properties: {
              type: 'object',
              additionalProperties: {
                $ref: '#/definitions/property',
              },
            },
          },
        },
      };

      const rootSchema: RJSFSchema = { definitions: { property } };
      const formData = {
        newKey: {
          type: 'object',
        },
      };

      expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
        ...schema,
        properties: {
          newKey: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['string', 'object'],
              },
              properties: {
                type: 'object',
                additionalProperties: {
                  $ref: '#/definitions/property',
                },
              },
            },
            [RJSF_REF_KEY]: '#/definitions/property',
            [ADDITIONAL_PROPERTY_FLAG]: true,
          },
        },
      });
    });
    it('should `resolve` and stub out a schema which contains an `additionalProperties` with a type and definition', () => {
      const schema: RJSFSchema = {
        type: 'string',
        additionalProperties: {
          $ref: '#/definitions/number',
        },
      };

      const number: RJSFSchema = {
        type: 'number',
      };

      const rootSchema: RJSFSchema = { definitions: { number } };
      const formData = { newKey: {} };

      expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
        ...schema,
        properties: {
          newKey: {
            ...number,
            [RJSF_REF_KEY]: '#/definitions/number',
            [ADDITIONAL_PROPERTY_FLAG]: true,
          },
        },
      });
    });
    it('should `resolve` and stub out a schema which contains an `additionalProperties` with oneOf', () => {
      const oneOf: RJSFSchema[] = [
        {
          type: 'object',
          properties: { foo: { type: 'string' } },
        },
        {
          type: 'object',
          properties: { bar: { type: 'number' } },
        },
      ];
      const schema: RJSFSchema = {
        additionalProperties: {
          oneOf,
        },
        type: 'object',
      };

      const formData = { newKey: {} };
      // The options agree the property is an object, so the stub names that type and the field for it renders the
      // shared properties beside the option selector
      expect(retrieveSchema({ validator: testValidator }, schema, {}, formData)).toEqual({
        ...schema,
        properties: {
          newKey: {
            type: 'object',
            oneOf,
            [ADDITIONAL_PROPERTY_FLAG]: true,
          },
        },
      });
    });
    it('should `resolve` and stub out a schema which contains an `additionalProperties` with anyOf', () => {
      const anyOf: RJSFSchema[] = [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ];
      const schema: RJSFSchema = {
        additionalProperties: {
          anyOf,
        },
        type: 'object',
      };

      const formData = { newKey: {} };
      // The options disagree about the type, so the stub names none: choosing an option is what settles it, and a type
      // of its own would render a field for that type beside the options
      expect(retrieveSchema({ validator: testValidator }, schema, {}, formData)).toEqual({
        ...schema,
        properties: {
          newKey: {
            anyOf,
            [ADDITIONAL_PROPERTY_FLAG]: true,
          },
        },
      });
    });
    it('should handle null formData for schema which contains additionalProperties', () => {
      const schema: RJSFSchema = {
        additionalProperties: {
          type: 'string',
        },
        type: 'object',
      };

      const formData = null;
      expect(retrieveSchema({ validator: testValidator }, schema, {}, formData)).toEqual({
        ...schema,
        properties: {},
      });
    });
    it('should stub out a key only an unevaluatedProperties describes', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' } },
        unevaluatedProperties: { type: 'number' },
      };

      const formData = { a: 'q', b: 2 };
      // The keyword describes the keys the `properties` leave over, so an object naming it takes extra keys as much as
      // one naming `additionalProperties` does, and the key it describes renders as the field that description calls
      // for
      expect(retrieveSchema({ validator: testValidator }, schema, {}, formData)).toEqual({
        ...schema,
        properties: {
          a: { type: 'string' },
          b: { type: 'number', [ADDITIONAL_PROPERTY_FLAG]: true },
        },
      });
    });
    it('should leave a key an anyOf or oneOf option declares to the option that renders it', () => {
      const oneOf: RJSFSchema[] = [{ properties: { kind: { const: 'a' }, a: { type: 'string' } } }];
      const schema: RJSFSchema = {
        type: 'object',
        patternProperties: { '^x_': { type: 'string' } },
        oneOf,
      };

      const formData = { kind: 'a', a: 'v', other: 1 };
      // The options are left for the option selector to choose between rather than merged in, so a key one of them
      // declares is missing from the `properties` here and would otherwise be stubbed beside the field the chosen
      // option renders for it, giving the one value two fields to be written from
      expect(retrieveSchema({ validator: testValidator }, schema, {}, formData)).toEqual({
        ...schema,
        properties: {
          other: { type: 'number', [ADDITIONAL_PROPERTY_FLAG]: true, [GUESSED_TYPE_FLAG]: true },
        },
      });
    });
    it('should prioritize local definitions over foreign ones', () => {
      const schema: RJSFSchema = {
        $ref: '#/definitions/address',
        title: 'foo',
      };
      const address: RJSFSchema = {
        type: 'string',
        title: 'bar',
      };
      const rootSchema: RJSFSchema = { definitions: { address } };

      expect(retrieveSchema({ validator: testValidator }, schema, rootSchema)).toEqual({
        ...address,
        title: 'foo',
        [RJSF_REF_KEY]: '#/definitions/address',
      });
    });
    it('recursive ref should resolve once', () => {
      const result = retrieveSchema({ validator: testValidator }, RECURSIVE_REF, RECURSIVE_REF);
      const enumDef = RECURSIVE_REF.definitions!['@enum'] as RJSFSchema;
      expect(result).toEqual({
        definitions: RECURSIVE_REF.definitions,
        ...enumDef,
        [RJSF_REF_KEY]: '#/definitions/@enum',
        // children is a circular object-property $ref — retrieveSchema marks it to stop infinite renders
        properties: {
          ...enumDef.properties,
          children: { $ref: '#/definitions/@enum', [RJSF_REF_CYCLE_KEY]: true },
        },
      });
    });
    it('recursive array-items ref resolves without cycle flag (items are data-driven, not infinite)', () => {
      // A tree schema where children is an array of the same type.
      // Array items are only rendered when data exists, so no __rjsf_ref_cycle flag should be added.
      const treeSchema: RJSFSchema = {
        definitions: {
          node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              children: {
                type: 'array',
                items: { $ref: '#/definitions/node' },
              },
            },
          },
        },
        $ref: '#/definitions/node',
      };
      const result = retrieveSchema({ validator: testValidator }, treeSchema, treeSchema);
      const nodeDef = treeSchema.definitions!.node as RJSFSchema;
      // children.items stays as the original $ref (no __rjsf_ref_cycle) because it's an array context
      expect(result).toEqual({
        definitions: treeSchema.definitions,
        ...nodeDef,
        [RJSF_REF_KEY]: '#/definitions/node',
      });
    });
    it('recursive allof ref should resolve once', () => {
      const result = retrieveSchema(
        { validator: testValidator },
        getByPath(RECURSIVE_REF_ALLOF, [PROPERTIES_KEY, 'value', 'items']),
        RECURSIVE_REF_ALLOF,
      );
      expect(result).toEqual({
        ...(RECURSIVE_REF_ALLOF.definitions!['@enum'] as RJSFSchema),
        [RJSF_REF_KEY]: '#/definitions/@enum',
      });
    });
    it('should `resolve` refs inside of a properties key with bad property', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          firstName: 'some mame' as unknown as RJSFSchema,
        },
      };
      const rootSchema: RJSFSchema = {
        type: 'object',
      };
      expect(retrieveSchema({ validator: testValidator }, schema, rootSchema)).toEqual(schema);
    });
    it('hands out a `$ref` inside of a properties key for the property to resolve', () => {
      const entity: RJSFSchema = {
        type: 'string',
        title: 'Entity',
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          entity: {
            $ref: '#/definitions/entity',
          },
        },
      };
      const rootSchema: RJSFSchema = {
        type: 'object',
        definitions: {
          entity,
        },
      };
      const retrieved = retrieveSchema({ validator: testValidator }, schema, rootSchema);
      expect(retrieved).toEqual({ type: 'object', properties: { entity: { $ref: '#/definitions/entity' } } });
      expect(retrieveProperty(testValidator, retrieved, 'entity', rootSchema)).toEqual({
        ...entity,
        [RJSF_REF_KEY]: '#/definitions/entity',
      });
    });
    it('hands out a `$ref` inside of an items key for the item to resolve', () => {
      const entity: RJSFSchema = {
        type: 'string',
        title: 'Entity',
      };
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          $ref: '#/definitions/entity',
        },
      };
      const rootSchema: RJSFSchema = {
        type: 'object',
        definitions: {
          entity,
        },
      };
      const { items } = retrieveSchema({ validator: testValidator }, schema, rootSchema);
      expect(items).toEqual({ $ref: '#/definitions/entity' });
      expect(retrieveSchema({ validator: testValidator }, schemaOf(items), rootSchema)).toEqual({
        ...entity,
        [RJSF_REF_KEY]: '#/definitions/entity',
      });
    });
    it('should `resolve` a bundled draft 2020-12 JSON Schema', () => {
      const definitions: RJSFSchema = {
        'https://jsonschema.dev/schemas/mixins/integer': {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://jsonschema.dev/schemas/mixins/integer',
          type: 'integer',
        },
        'https://jsonschema.dev/schemas/mixins/non-negative-integer': {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://jsonschema.dev/schemas/mixins/non-negative-integer',
          $ref: 'integer',
          minimum: 0,
        },
      };
      const schema: RJSFSchema = {
        $id: 'https://jsonschema.dev/schemas/examples/non-negative-integer-bundle',
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $defs: definitions,
        $ref: 'https://jsonschema.dev/schemas/mixins/non-negative-integer',
      };
      expect(retrieveSchema({ validator: testValidator }, schema, schema)).toEqual({
        $id: 'https://jsonschema.dev/schemas/examples/non-negative-integer-bundle',
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $defs: definitions,
        minimum: 0,
        type: 'integer',
        [RJSF_REF_KEY]: 'https://jsonschema.dev/schemas/mixins/non-negative-integer',
      });
    });
    describe('property dependencies', () => {
      describe('false condition', () => {
        it('should not add required properties', () => {
          const rootSchema: RJSFSchema = { definitions: {} };
          const formData = {};
          expect(retrieveSchema({ validator: testValidator }, PROPERTY_DEPENDENCIES, rootSchema, formData)).toEqual({
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'integer' },
            },
            required: ['a'],
          });
        });
      });

      describe('true condition', () => {
        describe('when required is not defined', () => {
          it('should define required properties', () => {
            const schema: RJSFSchema = {
              ...PROPERTY_DEPENDENCIES,
              required: undefined,
            };
            const rootSchema: RJSFSchema = { definitions: {} };
            const formData = { a: '1' };
            expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              required: ['b'],
            });
          });
          it('should not define required properties, when the dependency is a boolean', () => {
            const schema: RJSFSchema = {
              ...PROPERTY_DEPENDENCIES,
              required: undefined,
              dependencies: {
                a: true,
              },
            };
            const rootSchema: RJSFSchema = { definitions: {} };
            const formData = { a: '1' };
            expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
            });
          });
        });

        describe('when required is defined', () => {
          it('should concat required properties', () => {
            const rootSchema: RJSFSchema = { definitions: {} };
            const formData = { a: '1' };
            expect(retrieveSchema({ validator: testValidator }, PROPERTY_DEPENDENCIES, rootSchema, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              required: ['a', 'b'],
            });
          });
        });
      });
    });
    describe('schema dependencies', () => {
      describe('conditional', () => {
        describe('false condition', () => {
          it('should not modify properties', () => {
            const rootSchema: RJSFSchema = { definitions: {} };
            const formData = {};
            expect(retrieveSchema({ validator: testValidator }, SCHEMA_DEPENDENCIES, rootSchema, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
              },
            });
          });
        });

        describe('true condition', () => {
          it('should add properties', () => {
            const rootSchema: RJSFSchema = { definitions: {} };
            const formData = { a: '1' };
            expect(retrieveSchema({ validator: testValidator }, SCHEMA_DEPENDENCIES, rootSchema, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
            });
          });
          it('should concat required properties', () => {
            const rootSchema: RJSFSchema = { definitions: {} };
            const formData = { a: '1' };
            expect(
              retrieveSchema({ validator: testValidator }, SCHEMA_AND_REQUIRED_DEPENDENCIES, rootSchema, formData),
            ).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              required: ['a', 'b'],
            });
          });
          it('should not concat enum properties, but should concat `required` properties', () => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['FOO', 'BAR', 'BAZ'] },
                b: { type: 'string', enum: ['GREEN', 'BLUE', 'RED'] },
              },
              required: ['a'],
              dependencies: {
                a: {
                  properties: {
                    a: { enum: ['FOO'] },
                    b: { enum: ['BLUE'] },
                  },
                  required: ['a', 'b'],
                },
              },
            };
            const rootSchema: RJSFSchema = { definitions: {} };
            const formData = { a: 'FOO' };
            expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['FOO'] },
                b: { type: 'string', enum: ['BLUE'] },
              },
              required: ['a', 'b'],
            });
          });
        });

        describe('with $ref in dependency', () => {
          it('should retrieve referenced schema', () => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                a: { type: 'string' },
              },
              dependencies: {
                a: {
                  $ref: '#/definitions/needsB',
                },
              },
            };
            const rootSchema: RJSFSchema = {
              definitions: {
                needsB: {
                  properties: {
                    b: { type: 'integer' },
                  },
                },
              },
            };
            const formData = { a: '1' };
            expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              [RJSF_REF_KEY]: '#/definitions/needsB',
            });
          });
        });

        describe('with $ref in oneOf', () => {
          it('does not flag a shared $ref as a cycle when several oneOf branches use it', () => {
            testValidator.setReturnValues({
              isValid: [
                false, // SFTP branch does not match
                true, // FTPS branch matches
              ],
            });
            const schema: RJSFSchema = {
              type: 'object',
              definitions: {
                host: { type: 'string', title: 'Host' },
                sftp: {
                  properties: { protocol: { enum: ['SFTP'] }, host: { $ref: '#/definitions/host' } },
                },
                ftps: {
                  properties: { protocol: { enum: ['FTPS'] }, host: { $ref: '#/definitions/host' } },
                },
              },
              properties: {
                protocol: { type: 'string', enum: ['SFTP', 'FTPS'], default: 'SFTP' },
              },
              dependencies: {
                protocol: {
                  oneOf: [{ $ref: '#/definitions/sftp' }, { $ref: '#/definitions/ftps' }],
                },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { protocol: 'FTPS' });
            expect(result.properties?.host).toEqual({ $ref: '#/definitions/host' });
            expect(retrieveProperty(testValidator, result, 'host', schema)).toEqual({
              type: 'string',
              title: 'Host',
              [RJSF_REF_KEY]: '#/definitions/host',
            });
          });
          const hostResolved = { type: 'string', title: 'Host', [RJSF_REF_KEY]: '#/definitions/host' };
          const host = { $ref: '#/definitions/host' };
          it('does not flag a $ref used by a root property and by a dependencies oneOf branch', () => {
            testValidator.setReturnValues({ isValid: [false, true] });
            const schema: RJSFSchema = {
              type: 'object',
              definitions: {
                host: { type: 'string', title: 'Host' },
                b1: { properties: { protocol: { enum: ['A'] }, w: { $ref: '#/definitions/host' } } },
                b2: { properties: { protocol: { enum: ['B'] }, w: { $ref: '#/definitions/host' } } },
              },
              properties: {
                protocol: { type: 'string', enum: ['A', 'B'] },
                h: { $ref: '#/definitions/host' },
              },
              dependencies: {
                protocol: { oneOf: [{ $ref: '#/definitions/b1' }, { $ref: '#/definitions/b2' }] },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { protocol: 'B' });
            expect(result.properties).toEqual(expect.objectContaining({ h: host, w: host }));
            expect(retrieveProperty(testValidator, result, 'h', schema)).toEqual(hostResolved);
            expect(retrieveProperty(testValidator, result, 'w', schema)).toEqual(hostResolved);
          });
          it('does not flag a $ref used by the dependency properties and by its oneOf branch', () => {
            testValidator.setReturnValues({ isValid: [true] });
            const schema: RJSFSchema = {
              type: 'object',
              definitions: {
                host: { type: 'string', title: 'Host' },
                b1: { properties: { protocol: { enum: ['A'] }, z: { $ref: '#/definitions/host' } } },
              },
              properties: { protocol: { type: 'string', enum: ['A'] } },
              dependencies: {
                protocol: {
                  properties: { h: { $ref: '#/definitions/host' } },
                  oneOf: [{ $ref: '#/definitions/b1' }],
                },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { protocol: 'A' });
            expect(result.properties).toEqual(expect.objectContaining({ h: host, z: host }));
            expect(retrieveProperty(testValidator, result, 'h', schema)).toEqual(hostResolved);
            expect(retrieveProperty(testValidator, result, 'z', schema)).toEqual(hostResolved);
          });
          it('does not flag a $ref shared by two dependencies keys', () => {
            const schema: RJSFSchema = {
              type: 'object',
              definitions: { host: { type: 'string', title: 'Host' } },
              properties: { a: { type: 'string' }, b: { type: 'string' } },
              dependencies: {
                a: { properties: { x: { $ref: '#/definitions/host' } } },
                b: { properties: { y: { $ref: '#/definitions/host' } } },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { a: '1', b: '2' });
            expect(result.properties).toEqual(expect.objectContaining({ x: host, y: host }));
            expect(retrieveProperty(testValidator, result, 'x', schema)).toEqual(hostResolved);
            expect(retrieveProperty(testValidator, result, 'y', schema)).toEqual(hostResolved);
          });
          it('does not flag a $ref shared by two allOf entries', () => {
            const schema: RJSFSchema = {
              type: 'object',
              definitions: { host: { type: 'string', title: 'Host' } },
              allOf: [
                { properties: { x: { $ref: '#/definitions/host' } } },
                { properties: { y: { $ref: '#/definitions/host' } } },
              ],
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, {});
            expect(result.properties).toEqual({ x: host, y: host });
            expect(retrieveProperty(testValidator, result, 'x', schema)).toEqual(hostResolved);
            expect(retrieveProperty(testValidator, result, 'y', schema)).toEqual(hostResolved);
          });
          it('terminates on a recursive definition under an allOf root', () => {
            const node: RJSFSchema = {
              type: 'object',
              properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } },
            };
            const schema: RJSFSchema = {
              definitions: { node },
              type: 'object',
              properties: { tree: { $ref: '#/definitions/node' } },
              allOf: [{ required: ['tree'] }],
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, {});
            expect(result).toEqual({
              definitions: { node },
              type: 'object',
              properties: { tree: { $ref: '#/definitions/node' } },
              required: ['tree'],
            });
            expect(retrieveProperty(testValidator, result, 'tree', schema, {})).toEqual({
              type: 'object',
              properties: {
                name: { type: 'string' },
                child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
              },
              [RJSF_REF_KEY]: '#/definitions/node',
            });
          });
          it('terminates on a recursive definition under a dependencies root', () => {
            const node: RJSFSchema = {
              type: 'object',
              properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } },
            };
            const schema: RJSFSchema = {
              definitions: { node },
              type: 'object',
              properties: { a: { type: 'string' }, tree: { $ref: '#/definitions/node' } },
              dependencies: {
                a: { properties: { extra: { $ref: '#/definitions/node' } } },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { a: '1' });
            const expectedNode = {
              type: 'object',
              properties: {
                name: { type: 'string' },
                child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
              },
              [RJSF_REF_KEY]: '#/definitions/node',
            };
            expect(retrieveProperty(testValidator, result, 'tree', schema)).toEqual(expectedNode);
            expect(retrieveProperty(testValidator, result, 'extra', schema)).toEqual(expectedNode);
          });
          it('terminates on a recursive definition under an if/then root', () => {
            testValidator.setReturnValues({ isValid: [true] });
            const node: RJSFSchema = {
              type: 'object',
              properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } },
            };
            const schema: RJSFSchema = {
              definitions: { node },
              type: 'object',
              properties: { tree: { $ref: '#/definitions/node' } },
              if: { properties: { a: { const: '1' } } },
              then: { properties: { extra: { $ref: '#/definitions/node' } } },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { a: '1' });
            const expectedNode = {
              type: 'object',
              properties: {
                name: { type: 'string' },
                child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
              },
              [RJSF_REF_KEY]: '#/definitions/node',
            };
            expect(retrieveProperty(testValidator, result, 'tree', schema)).toEqual(expectedNode);
            expect(retrieveProperty(testValidator, result, 'extra', schema)).toEqual(expectedNode);
          });
          it('terminates on a recursive definition behind array items under an allOf root', () => {
            const node: RJSFSchema = {
              type: 'object',
              properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } },
            };
            const schema: RJSFSchema = {
              definitions: { node },
              type: 'object',
              properties: { children: { type: 'array', items: { $ref: '#/definitions/node' } } },
              allOf: [{ required: ['children'] }],
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, {});
            const { items } = retrieveProperty(testValidator, result, 'children', schema);
            expect(items).toEqual({ $ref: '#/definitions/node' });
            expect(retrieveSchema({ validator: testValidator }, schemaOf(items), schema)).toEqual({
              type: 'object',
              properties: {
                name: { type: 'string' },
                child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
              },
              [RJSF_REF_KEY]: '#/definitions/node',
            });
          });
          it('collapses a self-referencing property after one level', () => {
            const node: RJSFSchema = {
              type: 'object',
              properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } },
            };
            const schema: RJSFSchema = {
              definitions: { node },
              type: 'object',
              properties: { tree: { $ref: '#/definitions/node' } },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema);
            expect(retrieveProperty(testValidator, result, 'tree', schema)).toEqual({
              type: 'object',
              properties: {
                name: { type: 'string' },
                child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
              },
              [RJSF_REF_KEY]: '#/definitions/node',
            });
          });
          it('does not leak sibling keywords of one $ref into another usage of the same $ref', () => {
            const s: RJSFSchema = { type: 'string', title: 'Base' };
            const schema: RJSFSchema = {
              definitions: { s },
              type: 'object',
              properties: {
                a: { $ref: '#/definitions/s', title: 'Primary', enum: ['x', 'y'] },
                b: { $ref: '#/definitions/s' },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema);
            expect(retrieveProperty(testValidator, result, 'a', schema)).toEqual({
              type: 'string',
              title: 'Primary',
              enum: ['x', 'y'],
              [RJSF_REF_KEY]: '#/definitions/s',
            });
            expect(retrieveProperty(testValidator, result, 'b', schema)).toEqual({
              type: 'string',
              title: 'Base',
              [RJSF_REF_KEY]: '#/definitions/s',
            });
          });
          it('marks the closing edge of mutually recursive definitions as a cycle on both entry points', () => {
            const definitions: Record<string, RJSFSchema> = {
              A: { type: 'object', properties: { child: { $ref: '#/definitions/B' } } },
              B: { type: 'object', properties: { child: { $ref: '#/definitions/A' } } },
            };
            const schema: RJSFSchema = {
              definitions,
              type: 'object',
              properties: { a: { $ref: '#/definitions/A' }, b: { $ref: '#/definitions/B' } },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema);
            const a = retrieveProperty(testValidator, result, 'a', schema);
            expect(a).toEqual({
              type: 'object',
              properties: { child: { $ref: '#/definitions/B' } },
              [RJSF_REF_KEY]: '#/definitions/A',
            });
            expect(retrieveProperty(testValidator, a, 'child', schema)).toEqual({
              type: 'object',
              properties: { child: { $ref: '#/definitions/A', [RJSF_REF_CYCLE_KEY]: true } },
              [RJSF_REF_KEY]: '#/definitions/B',
            });
            const b = retrieveProperty(testValidator, result, 'b', schema);
            expect(b).toEqual({
              type: 'object',
              properties: { child: { $ref: '#/definitions/A' } },
              [RJSF_REF_KEY]: '#/definitions/B',
            });
            expect(retrieveProperty(testValidator, b, 'child', schema)).toEqual({
              type: 'object',
              properties: { child: { $ref: '#/definitions/B', [RJSF_REF_CYCLE_KEY]: true } },
              [RJSF_REF_KEY]: '#/definitions/A',
            });
          });
          it('keeps a cycle-flagged $ref collapsed when dependencies are re-walked', () => {
            const node: RJSFSchema = {
              type: 'object',
              properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } },
            };
            const schema: RJSFSchema = {
              definitions: { node },
              type: 'object',
              properties: { a: { type: 'string' } },
              dependencies: { a: { properties: { n: { $ref: '#/definitions/node' } } } },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { a: 'x' });
            expect(retrieveProperty(testValidator, result, 'n', schema)).toEqual({
              type: 'object',
              properties: {
                name: { type: 'string' },
                child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
              },
              [RJSF_REF_KEY]: '#/definitions/node',
            });
          });
          it.each<[string, RJSFSchema]>([
            ['a dependency that is a $ref', { dependencies: { a: { $ref: '#/definitions/extra' } } }],
            [
              'a dependency whose oneOf branch is a $ref',
              { dependencies: { a: { oneOf: [{ $ref: '#/definitions/branch' }] } } },
            ],
            ['a then that is a $ref', { if: true, then: { $ref: '#/definitions/extra' } }],
          ])('flags a dependent property that points back at its definition after %s was merged', (_, ahead) => {
            const node: RJSFSchema = {
              type: 'object',
              properties: { a: { type: 'string' }, b: { type: 'string' } },
              ...ahead,
              dependencies: {
                ...ahead.dependencies,
                b: { properties: { child: { $ref: '#/definitions/node' } } },
              },
            };
            const schema: RJSFSchema = {
              definitions: {
                node,
                extra: { properties: { x: { type: 'string' } } },
                branch: { properties: { a: { enum: ['1'] }, x: { type: 'string' } } },
              },
              $ref: '#/definitions/node',
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { a: '1', b: '1' });
            expect(result.properties).toHaveProperty('x');
            expect(result.properties?.child).toEqual({ $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true });
            expect(Reflect.get(result, RJSF_REF_KEY)).toBe('#/definitions/node');
          });
          it.each<[string, RJSFSchema]>([
            ['a then that is a $ref', { if: true, then: { $ref: '#/definitions/branch' } }],
            ['a dependency that is a $ref', { dependencies: { a: { $ref: '#/definitions/branch' } } }],
            [
              'a dependency whose oneOf branch is a $ref',
              { dependencies: { a: { oneOf: [{ $ref: '#/definitions/branch' }] } } },
            ],
          ])('leaves a recursion inside the definition of %s collapsed', (_, branchOf) => {
            const branch: RJSFSchema = {
              type: 'object',
              properties: { a: { enum: ['1'] }, kid: { $ref: '#/definitions/branch' } },
            };
            const node: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } }, ...branchOf };
            const schema: RJSFSchema = { definitions: { node, branch }, $ref: '#/definitions/node' };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { a: '1' });
            expect(result.properties?.kid).toEqual({ $ref: '#/definitions/branch', [RJSF_REF_CYCLE_KEY]: true });
            expect(Reflect.get(result, RJSF_REF_KEY)).toBe('#/definitions/node');
          });

          // A finite, non-cyclic chain of refs through allOf, dependencies or if/then branches must resolve
          // fully at any depth: branch resolutions count their own fixpoint passes, not the nesting depth.
          const mkChain = (kind: 'allOf' | 'deps' | 'then', n: number): RJSFSchema => {
            const definitions: Record<string, RJSFSchema> = {};
            for (let i = 0; i < n; i++) {
              const next: RJSFSchema =
                i + 1 < n ? { $ref: `#/definitions/d${i + 1}` } : { properties: { leaf: { type: 'string' } } };
              const props: RJSFSchema = { k: { type: 'string' }, [`v${i}`]: { type: 'string' } };
              if (kind === 'allOf') {
                definitions[`d${i}`] = { allOf: [{ properties: { [`v${i}`]: { type: 'string' } } }, next] };
              } else if (kind === 'deps') {
                definitions[`d${i}`] = { type: 'object', properties: props, dependencies: { k: next } };
              } else {
                definitions[`d${i}`] = {
                  type: 'object',
                  properties: props,
                  if: { properties: { k: { const: 'x' } } },
                  then: next,
                };
              }
            }
            return { definitions, $ref: '#/definitions/d0' };
          };
          it.each([
            ['allOf', 102, 103],
            ['deps', 100, 102],
            ['then', 100, 102],
          ] as const)('resolves a %s chain %i levels deep fully, not as a cycle', (kind, n, propertyCount) => {
            const schema = mkChain(kind, n);
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { k: 'x' });
            expect(RJSF_REF_CYCLE_KEY in result).toBe(false);
            expect(result.properties!.leaf).toEqual({ type: 'string' });
            expect(Object.keys(result.properties!)).toHaveLength(propertyCount);
          });
          it('collapses a definition that reaches itself through allOf', () => {
            const rootSchema: RJSFSchema = { definitions: { a: { allOf: [{ $ref: '#/definitions/a' }] } } };
            const result = retrieveSchema({ validator: testValidator }, { $ref: '#/definitions/a' }, rootSchema);
            // The definition merged with itself is the definition, with no literal `$ref` left behind
            expect(result).toEqual({ [RJSF_REF_KEY]: '#/definitions/a' });
          });
          it('collapses a definition that reaches itself through if/then', () => {
            testValidator.setReturnValues({ isValid: [true] });
            const rootSchema: RJSFSchema = {
              definitions: {
                a: {
                  type: 'object',
                  properties: { k: { type: 'string' } },
                  if: { properties: { k: { const: 'x' } } },
                  then: { $ref: '#/definitions/a' },
                },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, { $ref: '#/definitions/a' }, rootSchema, {
              k: 'x',
            });
            expect(result).toEqual({
              type: 'object',
              properties: { k: { type: 'string' } },
              [RJSF_REF_KEY]: '#/definitions/a',
            });
          });
          it('collapses mutually recursive definitions that reach each other through allOf', () => {
            const rootSchema: RJSFSchema = {
              definitions: {
                a: { allOf: [{ $ref: '#/definitions/b' }] },
                b: { allOf: [{ $ref: '#/definitions/a' }] },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, { $ref: '#/definitions/a' }, rootSchema);
            expect(result).toEqual({ [RJSF_REF_KEY]: '#/definitions/a' });
          });
          it('collapses a definition that reaches itself through dependencies', () => {
            const rootSchema: RJSFSchema = {
              definitions: {
                node: {
                  type: 'object',
                  properties: { k: { type: 'string' } },
                  dependencies: { k: { $ref: '#/definitions/node' } },
                },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, { $ref: '#/definitions/node' }, rootSchema, {
              k: 'a',
            });
            expect(result).toEqual({
              type: 'object',
              properties: { k: { type: 'string' } },
              [RJSF_REF_KEY]: '#/definitions/node',
            });
          });
          it('flags a dependent property that points back at its enclosing definition as a cycle', () => {
            const node: RJSFSchema = {
              type: 'object',
              properties: { k: { type: 'string' } },
              dependencies: { k: { properties: { child: { $ref: '#/definitions/node' } } } },
            };
            const rootSchema: RJSFSchema = { definitions: { node } };
            const result = retrieveSchema({ validator: testValidator }, { $ref: '#/definitions/node' }, rootSchema, {
              k: 'a',
            });
            expect(result).toEqual({
              type: 'object',
              properties: { k: { type: 'string' }, child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true } },
              [RJSF_REF_KEY]: '#/definitions/node',
            });
          });
          it.each<[string, RJSFSchema]>([
            ['an allOf entry', { allOf: [{ properties: { child: { $ref: '#/definitions/node' } } }] }],
            ['a then branch', { if: {}, then: { properties: { child: { $ref: '#/definitions/node' } } } }],
          ])(
            'flags a property %s declares that points back at the definition the schema was resolved from',
            (_, branch) => {
              const node: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } }, ...branch };
              const rootSchema: RJSFSchema = {
                definitions: { node },
                properties: { p: { $ref: '#/definitions/node' } },
              };
              // The schema the field of `p` is handed, which says where it came from, so retrieving it knows the `$ref`
              // its branch's property points back through
              const result = retrieveProperty(
                testValidator,
                retrieveSchema({ validator: testValidator }, rootSchema, rootSchema),
                'p',
                rootSchema,
              );
              expect(result).toEqual({
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
                },
                [RJSF_REF_KEY]: '#/definitions/node',
              });
            },
          );
          describe('a branch beside a $ref that uses the definition a second time', () => {
            const Q: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const friend: RJSFSchema = { properties: { friend: { $ref: '#/definitions/Q' } } };
            const expanded = { ...Q, [RJSF_REF_KEY]: '#/definitions/Q' };
            const formData = { name: 'n' };
            const siblings: [string, RJSFSchema][] = [
              ['an allOf entry', { allOf: [friend] }],
              ['a then branch', { if: {}, then: friend }],
              ['a dependencies entry', { dependencies: { name: friend } }],
            ];

            it.each(siblings)('expands the property %s declares, with the $ref at the root', (_, sibling) => {
              // The branch stands beside the `$ref` rather than in the definition, so it is not inside what the
              // `$ref` expanded to
              const schema: RJSFSchema = { definitions: { Q }, $ref: '#/definitions/Q', ...sibling };
              const result = retrieveSchema({ validator: testValidator }, schema, schema, formData);
              expect(result.properties?.friend).toEqual({ $ref: '#/definitions/Q' });
              expect(retrieveProperty(testValidator, result, 'friend', schema)).toEqual(expanded);
            });

            it.each(siblings)('expands the property %s declares, with the $ref in a property', (_, sibling) => {
              const schema: RJSFSchema = {
                definitions: { Q },
                type: 'object',
                properties: { b: { $ref: '#/definitions/Q', ...sibling } },
              };
              // The schema the field of `b` is handed: its `$ref` expanded in place, with the branch still to resolve
              const b = retrieveSchema({ validator: testValidator }, schema, schema, { b: formData }).properties?.b;
              const result = retrieveSchema({ validator: testValidator }, isObject(b) ? b : {}, schema, formData);
              expect(result.properties?.friend).toEqual({ $ref: '#/definitions/Q' });
              expect(retrieveProperty(testValidator, result, 'friend', schema)).toEqual(expanded);
            });
          });
          it('collapses an OpenAPI-style discriminator pair that loops through if/then and allOf', () => {
            testValidator.setReturnValues({ isValid: [true] });
            const rootSchema: RJSFSchema = {
              definitions: {
                Pet: {
                  type: 'object',
                  properties: { petType: { type: 'string' } },
                  if: { properties: { petType: { const: 'cat' } } },
                  then: { $ref: '#/definitions/Cat' },
                },
                Cat: {
                  allOf: [
                    { $ref: '#/definitions/Pet' },
                    { type: 'object', properties: { hunts: { type: 'boolean' } } },
                  ],
                },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, { $ref: '#/definitions/Pet' }, rootSchema, {
              petType: 'cat',
            });
            // `Pet` merged back in through `Cat` adds nothing, and leaves no literal `$ref` behind
            expect(result).toEqual({
              type: 'object',
              properties: { petType: { type: 'string' }, hunts: { type: 'boolean' } },
              [RJSF_REF_KEY]: '#/definitions/Pet',
            });
          });
          it('resolves a shared $ref in dependencies branches when the root is itself a $ref', () => {
            testValidator.setReturnValues({ isValid: [false, true] });
            const host: RJSFSchema = { type: 'string', title: 'Host' };
            const schema: RJSFSchema = {
              $ref: '#/definitions/Root',
              definitions: {
                host,
                Root: {
                  properties: {
                    protocol: { enum: ['A', 'B'] },
                    h: { $ref: '#/definitions/host' },
                  },
                  dependencies: {
                    protocol: {
                      oneOf: [
                        { properties: { protocol: { enum: ['A'] }, w: { $ref: '#/definitions/host' } } },
                        { properties: { protocol: { enum: ['B'] }, w: { $ref: '#/definitions/host' } } },
                      ],
                    },
                  },
                },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { protocol: 'B' });
            const hostResolved = { type: 'string', title: 'Host', [RJSF_REF_KEY]: '#/definitions/host' };
            expect(retrieveProperty(testValidator, result, 'h', schema)).toEqual(hostResolved);
            expect(retrieveProperty(testValidator, result, 'w', schema)).toEqual(hostResolved);
          });
          it('resolves a shared $ref in a then branch when the root is itself a $ref', () => {
            testValidator.setReturnValues({ isValid: [true] });
            const host: RJSFSchema = { type: 'string', title: 'Host' };
            const schema: RJSFSchema = {
              $ref: '#/definitions/Root',
              definitions: {
                host,
                Root: {
                  properties: { protocol: { enum: ['A', 'B'] } },
                  if: { properties: { protocol: { const: 'B' } } },
                  then: { properties: { w: { $ref: '#/definitions/host' } } },
                },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { protocol: 'B' });
            expect(retrieveProperty(testValidator, result, 'w', schema)).toEqual({
              type: 'string',
              title: 'Host',
              [RJSF_REF_KEY]: '#/definitions/host',
            });
          });
          it('resolves a shared $ref in an allOf entry when the root is itself a $ref', () => {
            const host: RJSFSchema = { type: 'string', title: 'Host' };
            const schema: RJSFSchema = {
              $ref: '#/definitions/Root',
              definitions: {
                host,
                Root: {
                  properties: { protocol: { enum: ['A', 'B'] } },
                  allOf: [{ properties: { w: { $ref: '#/definitions/host' } } }],
                },
              },
            };
            const result = retrieveSchema({ validator: testValidator }, schema, schema, { protocol: 'B' });
            expect(retrieveProperty(testValidator, result, 'w', schema)).toEqual({
              type: 'string',
              title: 'Host',
              [RJSF_REF_KEY]: '#/definitions/host',
            });
          });
          it('should retrieve referenced schemas', () => {
            // Mock isValid so that withExactlyOneSubschema works as expected
            testValidator.setReturnValues({
              isValid: [
                false, // First oneOf... second !== first
                true, // Second oneOf... second === second
              ],
            });
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                a: { enum: ['typeA', 'typeB'] },
              },
              dependencies: {
                a: {
                  oneOf: [{ $ref: '#/definitions/needsA' }, { $ref: '#/definitions/needsB' }],
                },
              },
            };
            const rootSchema: RJSFSchema = {
              definitions: {
                needsA: {
                  properties: {
                    a: { enum: ['typeA'] },
                    b: { type: 'number' },
                  },
                },
                needsB: {
                  properties: {
                    a: { enum: ['typeB'] },
                    c: { type: 'boolean' },
                  },
                },
              },
            };
            const formData = { a: 'typeB' };
            expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
              type: 'object',
              properties: {
                a: { enum: ['typeA', 'typeB'] },
                c: { type: 'boolean' },
              },
              [RJSF_REF_KEY]: '#/definitions/needsB',
            });
          });
        });
      });

      describe('dynamic', () => {
        describe('false condition', () => {
          it('should not modify properties', () => {
            const schema: RJSFSchema = {
              ...SCHEMA_AND_ONEOF_REF_DEPENDENCIES,
              properties: {
                a: { type: 'string' },
              },
              definitions: undefined,
            };
            const formData = {};
            expect(
              retrieveSchema({ validator: testValidator }, schema, SCHEMA_AND_ONEOF_REF_DEPENDENCIES, formData),
            ).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
              },
            });
          });
        });

        describe('true condition', () => {
          it('should add `first` properties given `first` data', () => {
            // Mock isValid so that withExactlyOneSubschema works as expected
            testValidator.setReturnValues({
              isValid: [
                true, // First dependency... first === first
                false, // Second dependency... second !== first
              ],
            });
            const schema: RJSFSchema = {
              ...SCHEMA_AND_ONEOF_REF_DEPENDENCIES,
              definitions: undefined,
            };
            const formData = { a: 'int' };
            expect(
              retrieveSchema({ validator: testValidator }, schema, SCHEMA_AND_ONEOF_REF_DEPENDENCIES, formData),
            ).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
                b: { type: 'integer' },
              },
              definitions: undefined,
              [RJSF_REF_KEY]: '#/definitions/needsA',
            });
          });

          it('should add `second` properties given `second` data', () => {
            // Mock isValid so that withExactlyOneSubschema works as expected
            testValidator.setReturnValues({
              isValid: [
                false, // First dependency... first !== second
                true, // Second dependency... second === second
              ],
            });
            const schema: RJSFSchema = {
              ...SCHEMA_AND_ONEOF_REF_DEPENDENCIES,
              definitions: undefined,
            };
            const formData = { a: 'bool' };
            expect(
              retrieveSchema({ validator: testValidator }, schema, SCHEMA_AND_ONEOF_REF_DEPENDENCIES, formData),
            ).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
                b: { type: 'boolean' },
              },
              definitions: undefined,
              [RJSF_REF_KEY]: '#/definitions/needsB',
            });
          });

          describe('showing/hiding nested dependencies', () => {
            let schema: RJSFSchema;
            let rootSchema: RJSFSchema;
            beforeAll(() => {
              schema = SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES;
              rootSchema = { definitions: {} };
            });

            it('should not include nested dependencies that should be hidden', () => {
              // Mock isValid so that withExactlyOneSubschema works as expected
              testValidator.setReturnValues({
                isValid: [
                  false, // employee_accounts oneOf ... - fail
                  true, // update_absences first oneOf... success
                  false, // update_absences second oneOf... fail
                  false, // update_absences third oneOf... fail
                ],
              });
              const formData = {
                employee_accounts: false,
                update_absences: 'BOTH',
              };
              expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
                type: 'object',
                properties: {
                  employee_accounts: {
                    type: 'boolean',
                    title: 'Employee Accounts',
                  },
                },
              });
              expect(consoleWarnSpy).toHaveBeenCalledWith(
                `ignoring oneOf in dependencies of "employee_accounts" because there isn't exactly one subschema that is valid`,
              );
            });

            it('should include nested dependencies that should not be hidden', () => {
              // Mock isValid so that withExactlyOneSubschema works as expected
              testValidator.setReturnValues({
                isValid: [
                  true, // employee_accounts oneOf... success
                  true, // update_absences first oneOf... success
                  false, // update_absences second oneOf... fail
                  false, // update_absences third oneOf... fail
                ],
              });
              const formData = {
                employee_accounts: true,
                update_absences: 'BOTH',
              };
              expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
                type: 'object',
                properties: {
                  employee_accounts: {
                    type: 'boolean',
                    title: 'Employee Accounts',
                  },
                  permitted_extension: {
                    title: 'Permitted Extension',
                    type: 'integer',
                  },
                  update_absences: {
                    title: 'Update Absences',
                    type: 'string',
                    oneOf: [
                      {
                        title: 'Both',
                        const: 'BOTH',
                      },
                    ],
                  },
                },
              });
            });
          });
        });

        describe('with $ref in dependency', () => {
          it('should retrieve the referenced schema', () => {
            // Mock isValid so that withExactlyOneSubschema works as expected
            testValidator.setReturnValues({
              isValid: [
                false, // First oneOf... fail
                true, // Second oneOf... success
              ],
            });
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
              },
              dependencies: {
                a: {
                  $ref: '#/definitions/typedInput',
                },
              },
            };
            const rootSchema: RJSFSchema = {
              definitions: {
                typedInput: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ['int'] },
                        b: { type: 'integer' },
                      },
                    },
                    {
                      properties: {
                        a: { enum: ['bool'] },
                        b: { type: 'boolean' },
                      },
                    },
                  ],
                },
              },
            };
            const formData = { a: 'bool' };
            expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
                b: { type: 'boolean' },
              },
              [RJSF_REF_KEY]: '#/definitions/typedInput',
            });
          });
        });
        describe('with oneOf in an allOf entry or a branch of the dependency', () => {
          const typedInput: RJSFSchema = {
            oneOf: [
              { properties: { a: { enum: ['int'] }, b: { type: 'integer' } } },
              { properties: { a: { enum: ['bool'] }, b: { type: 'boolean' } } },
            ],
          };
          const cases: [string, RJSFSchema, boolean[]][] = [
            ['an allOf entry', { allOf: [typedInput] }, [false, true]],
            ['the then of an if', { if: true, then: typedInput }, [true, false, true]],
          ];
          it.each(cases)('applies the option the data matches from %s', (_, dependency, isValid) => {
            testValidator.setReturnValues({ isValid });
            const schema: RJSFSchema = {
              type: 'object',
              properties: { a: { type: 'string', enum: ['int', 'bool'] } },
              dependencies: { a: dependency },
            };
            expect(retrieveSchema({ validator: testValidator }, schema, schema, { a: 'bool' }).properties).toEqual({
              a: { type: 'string', enum: ['int', 'bool'] },
              b: { type: 'boolean' },
            });
          });
        });
      });
    });
    describe('allOf', () => {
      it.each([true, false])(
        'should keep a symbol an `allOf` branch defines with a getter (enumerable: %s)',
        (enumerable) => {
          const branch: RJSFSchema = { type: 'string' };
          Object.defineProperty(branch, RJSF_REF_KEY, { get: () => '#/definitions/a', enumerable });
          const schema: RJSFSchema = { allOf: [branch, { title: 'A' }] };

          expect(retrieveSchema({ validator: testValidator }, schema, {}, 'x')).toEqual({
            type: 'string',
            title: 'A',
            [RJSF_REF_KEY]: '#/definitions/a',
          });
        },
      );
      it('should merge types', () => {
        const schema: RJSFSchema = {
          allOf: [{ type: ['string', 'number', 'null'] }, { type: 'string' }],
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {};
        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          type: 'string',
        });
      });
      it('should not merge `allOf.contains` schemas', () => {
        // https://github.com/rjsf-team/react-jsonschema-form/issues/2923#issuecomment-1946034240
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              a: {
                type: 'string',
              },
            },
          },
          allOf: [
            {
              maxItems: 5,
            },
            {
              contains: {
                type: 'object',
                properties: {
                  a: {
                    pattern: '1',
                  },
                },
              },
            },
            {
              contains: {
                type: 'object',
                properties: {
                  a: {
                    pattern: '2',
                  },
                },
              },
            },
          ],
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {};
        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              a: {
                type: 'string',
              },
            },
          },
          maxItems: 5,
          contains: {
            type: 'object',
            properties: {
              a: {
                pattern: '1',
              },
            },
          },
          allOf: [
            {
              contains: {
                type: 'object',
                properties: {
                  a: {
                    pattern: '2',
                  },
                },
              },
            },
          ],
        });
      });
      it('should not merge incompatible types', () => {
        const schema: RJSFSchema = {
          allOf: [{ type: 'string' }, { type: 'boolean' }],
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {};
        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({});
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringMatching(/could not merge subschemas in allOf/),
          expect.any(Error),
        );
      });
      it('should merge types with $ref in them', () => {
        const schema: RJSFSchema = {
          allOf: [{ $ref: '#/definitions/1' }, { $ref: '#/definitions/2' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            '1': { type: 'string' },
            '2': { minLength: 5 },
          },
        };
        const formData = {};
        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          type: 'string',
          minLength: 5,
          [RJSF_REF_KEY]: '#/definitions/1',
        });
      });
      it('should properly merge schemas with nested allOf`s', () => {
        const schema: RJSFSchema = {
          allOf: [
            {
              type: 'string',
              allOf: [{ minLength: 2 }, { maxLength: 5 }],
            },
            {
              type: 'string',
              allOf: [{ default: 'hi' }, { minLength: 4 }],
            },
          ],
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {};
        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          type: 'string',
          minLength: 4,
          maxLength: 5,
          default: 'hi',
        });
      });

      it('should use customMergeAllOf when provided', () => {
        const schema: RJSFSchema = {
          allOf: [
            {
              type: 'object',
              properties: {
                string: { type: 'string' },
              },
            },
            {
              type: 'object',
              properties: {
                number: { type: 'number' },
              },
            },
          ],
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {};
        const customMergeAllOf = vi.fn().mockReturnValue({
          type: 'object',
          properties: {
            string: { type: 'string' },
            number: { type: 'number' },
          },
        });

        expect(retrieveSchema({ validator: testValidator, customMergeAllOf }, schema, rootSchema, formData)).toEqual({
          type: 'object',
          properties: {
            string: { type: 'string' },
            number: { type: 'number' },
          },
        });
        expect(customMergeAllOf).toHaveBeenCalledWith(schema);
      });
      it('should `resolve` a draft 2020-12 schema with `$defs` property in an `allOf` block', () => {
        const schema: RJSFSchema = {
          $schema: 'http://json-schema.org/draft/2020-12/schema#',
          allOf: [
            {
              type: 'object',
              $defs: {
                string: {
                  type: 'string',
                },
              },
            },
            {
              type: 'object',
              $defs: {
                number: {
                  type: 'number',
                },
              },
            },
          ],
        };

        expect(retrieveSchema({ validator: testValidator }, schema, {}, {})).toEqual({
          $schema: 'http://json-schema.org/draft/2020-12/schema#',
          type: 'object',
          $defs: { string: { type: 'string' }, number: { type: 'number' } },
        });
      });
    });
    describe('Conditional schemas (If, Then, Else)', () => {
      it('should resolve if, then', () => {
        // Mock errors so that resolveCondition works as expected
        testValidator.setReturnValues({
          isValid: [
            true, // First condition Country... USA pass
            false, // Second condition Countery... Canada fail
          ],
        });
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {
          country: 'United States of America',
          postal_code: '20500',
        };
        expect(
          retrieveSchema({ validator: testValidator }, SCHEMA_WITH_SINGLE_CONDITION, rootSchema, formData),
        ).toEqual({
          type: 'object',
          properties: {
            country: {
              default: 'United States of America',
              enum: ['United States of America', 'Canada'],
            },
            postal_code: { pattern: '[0-9]{5}(-[0-9]{4})?' },
          },
        });
      });
      it('should resolve if, else', () => {
        // Mock errors so that resolveCondition works as expected
        testValidator.setReturnValues({
          isValid: [
            false, // First condition Country... USA fail
          ],
        });
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {
          country: 'Canada',
          postal_code: 'K1M 1M4',
        };
        expect(
          retrieveSchema({ validator: testValidator }, SCHEMA_WITH_SINGLE_CONDITION, rootSchema, formData),
        ).toEqual({
          type: 'object',
          properties: {
            country: {
              default: 'United States of America',
              enum: ['United States of America', 'Canada'],
            },
            postal_code: { pattern: '[A-Z][0-9][A-Z] [0-9][A-Z][0-9]' },
          },
        });
      });
      it('should preserve a matched boolean false branch as an impossible schema', () => {
        testValidator.setReturnValues({
          isValid: [true],
        });
        const schema: RJSFSchema = {
          type: 'number',
          if: {
            const: 13,
          },
          then: false,
        };

        expect(retrieveSchema({ validator: testValidator }, schema, schema, 13)).toEqual({
          type: 'number',
          not: {},
        });
      });
      it('should preserve a matched boolean true branch as an empty schema', () => {
        testValidator.setReturnValues({
          isValid: [true],
        });
        const schema: RJSFSchema = {
          type: 'number',
          if: {
            const: 13,
          },
          then: true,
        };

        expect(retrieveSchema({ validator: testValidator }, schema, schema, 13)).toEqual({
          type: 'number',
        });
      });
      it('should resolve multiple conditions', () => {
        // Mock errors so that resolveCondition works as expected
        testValidator.setReturnValues({
          isValid: [
            true, // First condition animal... Cat pass
            false, // Second condition animal... Fish fail
          ],
        });
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
          },
          allOf: [
            {
              if: {
                properties: { animal: { const: 'Cat' } },
              },
              then: {
                properties: {
                  food: { type: 'string', enum: ['meat', 'grass', 'fish'] },
                },
              },
              required: ['food'],
            },
            {
              if: {
                properties: { animal: { const: 'Fish' } },
              },
              then: {
                properties: {
                  food: {
                    type: 'string',
                    enum: ['insect', 'worms'],
                  },
                  water: {
                    type: 'string',
                    enum: ['lake', 'sea'],
                  },
                },
                required: ['food', 'water'],
              },
            },
            {
              required: ['animal'],
            },
          ],
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {
          animal: 'Cat',
        };

        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
            food: { type: 'string', enum: ['meat', 'grass', 'fish'] },
          },
          required: ['food', 'animal'],
        });
      });
      it('should resolve multiple conditions in nested allOf blocks', () => {
        // Mock errors so that resolveCondition works as expected
        testValidator.setReturnValues({
          isValid: [
            false, // First condition Animal... Cat fail
            true, // Second condition Animal... Dog pass
            false, // Third condition Breed... Alsatian fail
            true, // Fourth condition Breed... Dalmation pass
          ],
        });
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {
          Animal: 'Dog',
          Breed: {
            BreedName: 'Dalmation',
          },
        };

        expect(
          retrieveSchema({ validator: testValidator }, SCHEMA_WITH_MULTIPLE_CONDITIONS, rootSchema, formData),
        ).toEqual({
          type: 'object',
          properties: {
            Animal: {
              default: 'Cat',
              enum: ['Cat', 'Dog'],
              title: 'Animal',
              type: 'string',
            },
            Breed: {
              properties: {
                BreedName: {
                  default: 'Alsatian',
                  enum: ['Alsatian', 'Dalmation'],
                  title: 'Breed name',
                  type: 'string',
                },
              },
              allOf: [
                {
                  if: {
                    required: ['BreedName'],
                    properties: {
                      BreedName: {
                        const: 'Alsatian',
                      },
                    },
                  },
                  then: {
                    properties: {
                      Fur: {
                        default: 'brown',
                        enum: ['black', 'brown'],
                        title: 'Fur',
                        type: 'string',
                      },
                    },
                    required: ['Fur'],
                  },
                },
                {
                  if: {
                    required: ['BreedName'],
                    properties: {
                      BreedName: {
                        const: 'Dalmation',
                      },
                    },
                  },
                  then: {
                    properties: {
                      Spots: {
                        default: 'small',
                        enum: ['large', 'small'],
                        title: 'Spots',
                        type: 'string',
                      },
                    },
                    required: ['Spots'],
                  },
                },
              ],
              required: ['BreedName'],
              title: 'Breed',
            },
          },
          required: ['Animal'],
        });
      });
      it('should resolve $ref', () => {
        // Mock errors so that resolveCondition works as expected
        testValidator.setReturnValues({
          isValid: [
            true, // First condition animal... Cat pass
            false, // Second condition animal... Fish fail
          ],
        });
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
          },
          allOf: [
            {
              if: {
                properties: { animal: { const: 'Cat' } },
              },
              then: {
                $ref: '#/definitions/cat',
              },
              required: ['food'],
            },
            {
              if: {
                properties: { animal: { const: 'Fish' } },
              },
              then: {
                $ref: '#/definitions/fish',
              },
            },
            {
              required: ['animal'],
            },
          ],
        };

        const rootSchema: RJSFSchema = {
          definitions: {
            cat: {
              properties: {
                food: { type: 'string', enum: ['meat', 'grass', 'fish'] },
              },
            },
            fish: {
              properties: {
                food: {
                  type: 'string',
                  enum: ['insect', 'worms'],
                },
                water: {
                  type: 'string',
                  enum: ['lake', 'sea'],
                },
              },
              required: ['food', 'water'],
            },
          },
        };

        const formData = {
          animal: 'Cat',
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, rootSchema);

        expect(schemaUtils.retrieveSchema(schema, formData)).toEqual({
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
            food: { type: 'string', enum: ['meat', 'grass', 'fish'] },
          },
          required: ['food', 'animal'],
          [RJSF_REF_KEY]: '#/definitions/cat',
        });
      });
      it('handles nested if then else', () => {
        const rootSchema: RJSFSchema = {};
        const formData = {
          country: 'USA',
          state: 'New York',
        };

        expect(
          retrieveSchema({ validator: testValidator }, SCHEMA_WITH_NESTED_CONDITIONS, rootSchema, formData),
        ).toEqual({
          type: 'object',
          properties: {
            country: {
              enum: ['USA'],
            },
            state: { type: 'string', enum: ['California', 'New York'] },
            city: {
              type: 'string',
              enum: ['New York City', 'Buffalo', 'Rochester'],
            },
          },
          required: ['country', 'state'],
        });
      });
      it.each([
        { type: 'integer', value: 0 },
        { type: 'boolean', value: false },
        { type: 'string', value: '' },
      ] as const)('evaluates the condition against a falsy $type value', ({ type, value }) => {
        const schema: RJSFSchema = {
          type,
          if: { const: value },
          then: { title: 'matched' },
          else: { title: 'unmatched' },
        };
        expect(retrieveSchema({ validator: testValidator }, schema, {}, value)).toEqual({ type, title: 'matched' });
      });
      it('evaluates an object condition against a null value as against an empty object', () => {
        const schema: RJSFSchema = {
          type: ['object', 'null'],
          if: { required: ['a'] },
          then: { title: 'matched' },
          else: { title: 'unmatched' },
        };
        // The real validators ignore this and evaluate the condition, which is what pins the fallback to `{}`
        testValidator.setReturnValues({ isValid: [false] });
        expect(retrieveSchema({ validator: testValidator }, schema, {}, null)).toEqual({
          type: ['object', 'null'],
          title: 'unmatched',
        });
      });
      it('overrides the base schema with a conditional branch when merged', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            myString: {
              type: 'string',
              minLength: 5,
            },
          },
          if: true,
          then: {
            properties: {
              myString: {
                minLength: 10, // This value of minLength should override the original value
              },
            },
          },
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {};
        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          type: 'object',
          properties: {
            myString: {
              type: 'string',
              minLength: 10,
            },
          },
        });
      });
    });
    describe('withPatternProperties()', () => {
      it('validates schemas with conditions inside patternProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: {
              type: 'object',
            },
          },
          patternProperties: {
            '^[a-z]+$': {
              type: 'object',
              properties: {
                isString: { type: 'boolean' },
              },
              allOf: [
                {
                  if: {
                    properties: { isString: { const: true } },
                  },
                  then: {
                    properties: {
                      value: {
                        type: 'string',
                      },
                    },
                  },
                },
                {
                  if: {
                    properties: { isString: { const: false } },
                  },
                  then: {
                    properties: {
                      value: {
                        type: 'number',
                      },
                    },
                  },
                },
              ],
            },
          },
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        testValidator.setReturnValues({
          isValid: [true, false, true, false],
        });
        expect(
          retrieveSchema({ validator: testValidator }, schema, rootSchema, {
            foo: { isString: true },
            bar: { isString: true },
          }),
        ).toEqual({
          ...schema,
          properties: {
            foo: {
              type: 'object',
              properties: {
                isString: { type: 'boolean' },
                value: { type: 'string' },
              },
            },
            bar: {
              [ADDITIONAL_PROPERTY_FLAG]: true,
              type: 'object',
              properties: {
                isString: { type: 'boolean' },
                value: { type: 'string' },
              },
            },
          },
        });
        testValidator.setReturnValues({
          isValid: [false, true, false, true],
        });
        expect(
          retrieveSchema({ validator: testValidator }, schema, rootSchema, {
            foo: { isString: false },
            bar: { isString: false },
          }),
        ).toEqual({
          ...schema,
          properties: {
            foo: {
              type: 'object',
              properties: {
                isString: { type: 'boolean' },
                value: { type: 'number' },
              },
            },
            bar: {
              [ADDITIONAL_PROPERTY_FLAG]: true,
              type: 'object',
              properties: {
                isString: { type: 'boolean' },
                value: { type: 'number' },
              },
            },
          },
        });
      });
      it('merges all subschemas that match the patternProperties regex', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'number' },
            baz: { type: 'boolean' },
          },
          patternProperties: {
            '^foo': {
              minimum: 10,
            },
            '^foo.*': {
              maximum: 20,
            },
            '^bar': {
              multipleOf: 2,
            },
          },
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {};
        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {
            foo: {
              type: 'number',
              minimum: 10,
              maximum: 20,
            },
            baz: {
              type: 'boolean',
            },
          },
        });
      });
      it('resolves a $ref in a patternProperties entry for every key it matches, not just the first', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { aa: { type: 'string' }, ab: { type: 'string' } },
          patternProperties: { '^a': { $ref: '#/definitions/constrained' } },
        };
        const rootSchema: RJSFSchema = { definitions: { constrained: { minLength: 3 } } };
        // Each key resolves the shared entry in its own right: a `$ref` the key before it went through is not one
        // this key has, so a list of resolved references shared between them would leave this one unresolved
        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, {}).properties).toEqual({
          aa: { type: 'string', minLength: 3, [RJSF_REF_KEY]: '#/definitions/constrained' },
          ab: { type: 'string', minLength: 3, [RJSF_REF_KEY]: '#/definitions/constrained' },
        });
      });
      it('resolves a $ref in a patternProperties entry that a sibling property resolved first', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { aa: { $ref: '#/definitions/text' }, other: { $ref: '#/definitions/constrained' } },
          patternProperties: { '^a': { $ref: '#/definitions/constrained' } },
        };
        const rootSchema: RJSFSchema = {
          definitions: { text: { type: 'string' }, constrained: { maxLength: 7 } },
        };
        // `other` resolving the reference first must not leave `aa`'s pattern a literal `$ref` in place of its
        // constraint. `other` is handed out as it stands, for its own field to resolve
        const retrieved = retrieveSchema({ validator: testValidator }, schema, rootSchema, {});
        expect(retrieved.properties).toEqual({
          aa: { type: 'string', maxLength: 7, [RJSF_REF_KEY]: '#/definitions/text' },
          other: { $ref: '#/definitions/constrained' },
        });
        expect(retrieveProperty(testValidator, retrieved, 'other', rootSchema)).toEqual({
          maxLength: 7,
          [RJSF_REF_KEY]: '#/definitions/constrained',
        });
      });
      it('merges a pattern into a boolean property, which carries no reference of its own', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { aa: true, bb: false },
          patternProperties: { '^a': { minLength: 3 } },
        };
        // JSON Schema allows a boolean wherever a schema goes, so the key a pattern matches may hold one: `true`
        // constrains nothing and leaves the pattern's constraint, and the unmatched `false` is left as it stands
        expect(retrieveSchema({ validator: testValidator }, schema, { definitions: {} }, {}).properties).toEqual({
          aa: { minLength: 3 },
          bb: false,
        });
      });
      it('merges a pattern into a key whose own allOf already declares what the pattern does', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { foo: { allOf: [{ minLength: 2 }] }, bar: { type: 'string' } },
          patternProperties: { '^f': { minLength: 2 } },
        };
        // A merge an inner recursion level left undone is recognised by the marker that level set, not by the `allOf`
        // holding the patterns, which a schema may also declare itself. Read by shape, this key would be taken as
        // already merged and left with its `allOf` unresolved
        expect(retrieveSchema({ validator: testValidator }, schema, { definitions: {} }, {}).properties).toEqual({
          foo: { minLength: 2 },
          bar: { type: 'string' },
        });
      });
      it('merges a pattern into a key whose own allOf holds a $ref alongside what the pattern declares', () => {
        const rootSchema: RJSFSchema = {
          type: 'object',
          definitions: { Base: { type: 'string', title: 'Base' } },
          properties: { p: { allOf: [{ $ref: '#/definitions/Base' }, { maxLength: 5 }] } },
          patternProperties: { '^p': { maxLength: 5 } },
        };
        // No recursion is involved, so the `$ref` resolves and the patterns merge in. Reading the trailing entries of
        // the `allOf` as a merge already made would hand `SchemaField` the unresolved `allOf` instead
        expect(retrieveSchema({ validator: testValidator }, rootSchema, rootSchema, {}).properties!.p).toEqual({
          type: 'string',
          title: 'Base',
          maxLength: 5,
          [RJSF_REF_KEY]: '#/definitions/Base',
        });
      });
      it('keeps the properties of a schema a key refers back to when a pattern also matches that key', () => {
        const rootSchema: RJSFSchema = {
          definitions: {
            node: {
              type: 'object',
              properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } },
              patternProperties: { '^child$': { properties: { extra: { type: 'string' } } } },
            },
          },
          $ref: '#/definitions/node',
        };
        const root = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema, {});
        // The merge of the recursive key is left undone rather than resolved, since resolving it would stop at the
        // literal `$ref` and a later shallow spread would let the pattern's `properties` replace the node's own
        const child = root.properties!.child as RJSFSchema;
        const resolvedChild = retrieveSchema({ validator: testValidator }, child, rootSchema, {});
        expect(Object.keys(resolvedChild.properties!).sort()).toEqual(['child', 'extra', 'name']);
        // and the level below it resolves the same way rather than terminating by losing the recursion
        const grandchild = retrieveSchema(
          { validator: testValidator },
          resolvedChild.properties!.child as RJSFSchema,
          rootSchema,
          {},
        );
        expect(Object.keys(grandchild.properties!).sort()).toEqual(['child', 'extra', 'name']);
      });
      it('merges a pattern into a key referring back to a schema other than the one that holds it', () => {
        const rootSchema: RJSFSchema = {
          definitions: {
            A: { type: 'object', properties: { b: { $ref: '#/definitions/B' } } },
            B: {
              type: 'object',
              properties: { a: { $ref: '#/definitions/A' }, s: { type: 'string' } },
              patternProperties: { '^a$': { title: 'Pattern' } },
            },
          },
          $ref: '#/definitions/A',
        };
        const root = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema, {});
        const b = retrieveProperty(testValidator, root, 'b', rootSchema, {});
        // `a` leads back to `A`, which `b` was reached through, so it is the cycle; retrieving `b` again keeps it so
        expect(b.properties?.a).toEqual({ $ref: '#/definitions/A', [RJSF_REF_CYCLE_KEY]: true });
        // Expanding it gives the pattern, as it does any other key
        const expanded = retrieveSchema(
          { validator: testValidator },
          { ...schemaOf(b.properties?.a), [RJSF_REF_CYCLE_KEY]: false },
          rootSchema,
          {},
        );
        expect(expanded).toEqual(
          expect.objectContaining({ title: 'Pattern', properties: expect.objectContaining({ b: expect.anything() }) }),
        );
      });
      it('leaves a key an earlier retrieval stubbed out of the merge when the result is retrieved again', () => {
        const schema: RJSFSchema = {
          type: 'object',
          patternProperties: { '^k': { $id: '#money', enum: [1, 2, 5], default: 5, not: { const: 2 } } },
        };
        const formData = { k1: 1 };
        const once = retrieveSchema({ validator: testValidator }, schema, undefined, formData);
        // The stub names the type the pattern implies and leaves its `$id` out, since an `$id` copied onto every
        // sibling property would route them all to the one field registered under it
        expect(once.properties!.k1).not.toHaveProperty('$id');
        // `SchemaField` retrieves an object's schema and `ObjectField` retrieves the result, so a stub left in the
        // merge would be merged with the very patterns it was built from and take all of that back on the second pass
        expect(retrieveSchema({ validator: testValidator }, once, undefined, formData)).toEqual(once);
      });
    });
    describe('stubExistingAdditionalProperties()', () => {
      it('deals with undefined formData', () => {
        const schema: RJSFSchema = { type: 'string' };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('deals with non-object formData', () => {
        const schema: RJSFSchema = { type: 'string' };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, [])).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has property keys that match formData, additionalProperties is boolean', () => {
        const schema: RJSFSchema = {
          additionalProperties: true,
        };
        const formData = { bar: 1, baz: false, foo: 'str' };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              type: 'number',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
            baz: {
              type: 'boolean',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
            foo: {
              type: 'string',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
          },
        });
      });
      it('has property keys that match schema AND formData, additionalProperties is boolean', () => {
        const schema: RJSFSchema = {
          properties: {
            foo: { type: 'string' },
            bar: { type: 'number' },
          },
          additionalProperties: true,
        };
        const formData = { foo: 'blah', bar: 1, baz: true };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            ...schema.properties,
            baz: {
              type: 'boolean',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
          },
        });
      });
      it('has additionalProperties of type number', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'number' },
        };
        const formData = { bar: 1 };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              ...(schema.additionalProperties as object),
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
          },
        });
      });
      it('has additionalProperties of empty object', () => {
        const schema: RJSFSchema = {
          additionalProperties: {},
        };
        const formData = { foo: 'blah', bar: 1, baz: true };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            foo: {
              type: 'string',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
            bar: {
              type: 'number',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
            baz: {
              type: 'boolean',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
          },
        });
      });
      it('has additionalProperties that constrains the value without naming a type', () => {
        const schema: RJSFSchema = {
          additionalProperties: { enum: ['a', 'b'] },
        };
        const formData = { foo: 'a' };
        // The stub takes the guessed type and keeps the constraint, but is NOT marked as guessed: the schema
        // constrains the value, so the fallback UI must not offer it every other type
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            foo: {
              enum: ['a', 'b'],
              type: 'string',
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
          },
        });
      });
      it('has additionalProperties that only annotates the value', () => {
        const schema: RJSFSchema = {
          additionalProperties: { title: 'Anything', description: 'Any type at all', $comment: 'unconstrained' },
        };
        const formData = { foo: 'a' };
        // Annotations say nothing about the value, so the property is still free to hold anything and the stub is
        // marked as guessed, letting the fallback UI offer every type
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            foo: {
              title: 'Anything',
              description: 'Any type at all',
              $comment: 'unconstrained',
              type: 'string',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
          },
        });
      });
      it('has additionalProperties that only annotates or identifies the value in other ways', () => {
        const annotations: RJSFSchema = {
          default: '',
          examples: ['a'],
          readOnly: true,
          writeOnly: false,
          deprecated: true,
          $id: 'https://example.com/anything',
          $schema: 'http://json-schema.org/draft-07/schema#',
        };
        const schema: RJSFSchema = { additionalProperties: annotations };
        const formData = { foo: 'a' };
        // None of these is an assertion about the value either, so a `default` or `readOnly` alone must not cost the
        // property the types it is free to hold. The identifiers are not copied, since every stubbed sibling would
        // otherwise share them
        const { $id, $schema, ...copiedAnnotations } = annotations;
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            foo: {
              ...copiedAnnotations,
              type: 'string',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
          },
        });
      });
      it('has additionalProperties with keywords that assert nothing about the value', () => {
        const schema: RJSFSchema = {
          additionalProperties: {
            $defs: { name: { type: 'string' } },
            contentMediaType: 'text/plain',
            contentEncoding: 'base64',
            'x-unknown': true,
          } as RJSFSchema,
        };
        const formData = { foo: 'a' };
        // A container, a content annotation or a keyword not known at all must not lock the property's type in place
        const stub = stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)
          .properties!.foo as RJSFSchema;
        expect(GUESSED_TYPE_FLAG in stub).toBe(true);
        expect(stub.type).toBe('string');
        // The `$ref` that would reach into a container is dropped, so copying the container into every property
        // would hand each of them an unreachable copy for `hashForSchema()` and `deepEquals()` to walk
        expect('$defs' in stub).toBe(false);
        expect(stub.contentMediaType).toBe('text/plain');
      });
      it('has additionalProperties with containers that no stub carries a copy of', () => {
        const schema: RJSFSchema = {
          additionalProperties: {
            title: 'Anything',
            $defs: { name: { type: 'string' } },
            definitions: { other: { type: 'number' } },
          },
        };
        const formData = { foo: 'a', bar: 1 };

        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            foo: { title: 'Anything', type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true, [GUESSED_TYPE_FLAG]: true },
            bar: { title: 'Anything', type: 'number', [ADDITIONAL_PROPERTY_FLAG]: true, [GUESSED_TYPE_FLAG]: true },
          },
        });
      });
      it('has additionalProperties that identifies the subschema beside the keywords naming the type', () => {
        const schema: RJSFSchema = {
          additionalProperties: { $id: '#money', $defs: { other: { type: 'number' } }, enum: [1, 2, 5] },
        };
        const formData = { foo: 1, bar: 5 };
        // The stub is built once per property key whatever named its type, so an identifier every sibling would share
        // and a container every sibling would carry an unreachable copy of are left out of this stub as much as out of
        // one built from the data
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            foo: { enum: [1, 2, 5], type: 'number', [ADDITIONAL_PROPERTY_FLAG]: true },
            bar: { enum: [1, 2, 5], type: 'number', [ADDITIONAL_PROPERTY_FLAG]: true },
          },
        });
      });
      it('has additionalProperties with a ref that names no type', () => {
        const schema: RJSFSchema = { additionalProperties: { $ref: '#/definitions/email' } };
        const rootSchema: RJSFSchema = { definitions: { email: { format: 'email' } } };
        const formData = { bar: 'blah' };
        // The marker naming the definition the property was described through survives the stub, so `resolveUiSchema()`
        // applies that definition's `ui:definitions` entry to the property as it does for one whose definition names a
        // type
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              format: 'email',
              type: 'string',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [RJSF_REF_KEY]: '#/definitions/email',
            },
          },
        });
      });
      it('has anyOf options that all declare a property of their own', () => {
        const schema: RJSFSchema = {
          additionalProperties: true,
          anyOf: [
            { properties: { kind: { type: 'string' } } },
            { properties: { kind: { type: 'string' } }, anyOf: [{ properties: { kind: { type: 'string' } } }] },
          ],
        };
        const formData = { kind: 'a', other: true };
        // A name every option declares has a field whichever option the user is shown, an option of an option included,
        // so the object around them stubs no second field for it
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            other: { type: 'boolean', [ADDITIONAL_PROPERTY_FLAG]: true, [GUESSED_TYPE_FLAG]: true },
          },
        });
      });
      it('has anyOf options of which only some declare a property', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          anyOf: [
            true,
            { type: 'object' },
            { properties: { kind: { type: 'string' } }, anyOf: [{ properties: { deep: { type: 'number' } } }] },
          ],
        };
        const formData = { kind: 'a', deep: 1 };
        // A name the other options don't declare is stubbed all the same: the option on screen is the user's to choose,
        // and under one that declares none of these names the value would have no field to be edited or removed with.
        // An option that is not a schema at all, and one that declares no properties, declare nothing
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            kind: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true },
            deep: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true },
          },
        });
      });
      it('has an anyOf option that takes keys of its own', () => {
        const schema: RJSFSchema = {
          unevaluatedProperties: { type: 'number' },
          oneOf: [{ patternProperties: { '^s_': { type: 'string' } } }],
        };
        const formData = { s_a: 'hello', other: 1 };
        // An option that takes keys of its own has every key the data holds stubbed into it, the way the object around
        // it does, so there is none left for the object to stub a second field for
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has an anyOf option whose own options all take keys of theirs', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [{ oneOf: [{ additionalProperties: { type: 'number' } }] }],
        };
        const formData = { other: 1 };
        // The option takes every key its own options take, so there is none left for the object to stub a second field
        // for
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has anyOf options that declare properties through a reference or an allOf', () => {
        const schema: RJSFSchema = {
          additionalProperties: true,
          oneOf: [{ $ref: '#/definitions/named' }, { allOf: [{ $ref: '#/definitions/named' }] }],
        };
        const rootSchema: RJSFSchema = { definitions: { named: { properties: { name: { type: 'string' } } } } };
        const formData = { name: 'a', other: true };
        // An option declares its properties through a reference or an `allOf` as much as inline, and the names are
        // looked up rather than the option resolved
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {
            other: { type: 'boolean', [ADDITIONAL_PROPERTY_FLAG]: true, [GUESSED_TYPE_FLAG]: true },
          },
        });
      });
      it('has an anyOf option whose own properties shadow the ones its reference names', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [{ $ref: '#/definitions/named', properties: { shown: { type: 'number' } } }],
        };
        const rootSchema: RJSFSchema = { definitions: { named: { properties: { shadowed: { type: 'boolean' } } } } };
        const formData = { shown: 1, shadowed: 'hi' };
        // A reference resolves as `{ ...definition, ...option }`, so a keyword the option declares itself replaces the
        // definition's rather than joining it: the option renders no field for `shadowed`, which is the object's to
        // stub rather than a name it can leave to the option
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: { shadowed: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('has an anyOf option naming one definition twice, shadowing it only once', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              allOf: [
                { $ref: '#/definitions/named', properties: { shown: { type: 'number' } } },
                { $ref: '#/definitions/named' },
              ],
            },
          ],
        };
        const rootSchema: RJSFSchema = { definitions: { named: { properties: { named: { type: 'boolean' } } } } };
        const formData = { shown: 1, named: true };
        // The second entry resolves the definition unshadowed, so the option renders the name behind it after all:
        // each entry follows the references reaching the option without consuming them for the entries beside it, as
        // an option of its own would, where a list shared across them would have left the first entry's shadowed read
        // standing as the definition's only one
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has an anyOf option whose own condition shadows the one its reference names', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              $ref: '#/definitions/conditioned',
              if: { properties: { kind: { const: 'z' } }, required: ['kind'] },
              then: { properties: { shown: { type: 'number' } } },
            },
          ],
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            conditioned: {
              properties: { kind: { type: 'string' } },
              if: { properties: { kind: { const: 'a' } }, required: ['kind'] },
              then: { properties: { hidden: { type: 'number' } } },
            },
          },
        };
        // The shadowed condition settles nothing the form renders, so its branch declares no name to leave to the
        // option -- and it is never put to the validator, which is the only question asked about it anywhere, so a
        // precompiled validator has no function compiled for it
        testValidator.setReturnValues({ isValid: [false] });
        expect(
          stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, {
            kind: 'a',
            hidden: 1,
          }),
        ).toEqual({
          ...schema,
          properties: { hidden: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('has an anyOf option whose reference names no definition', () => {
        const schema: RJSFSchema = { additionalProperties: true, oneOf: [{ $ref: '#/definitions/missing' }] };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = { other: true };
        // A reference naming no definition declares nothing, as the option holding it does until whatever resolves it
        // to render it reports the broken reference
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {
            other: { type: 'boolean', [ADDITIONAL_PROPERTY_FLAG]: true, [GUESSED_TYPE_FLAG]: true },
          },
        });
      });
      it('has an anyOf option whose reference names a boolean definition', () => {
        const schema: RJSFSchema = { additionalProperties: true, oneOf: [{ $ref: '#/definitions/anything' }] };
        const rootSchema: RJSFSchema = { definitions: { anything: true } };
        const formData = { other: true };
        // A definition that is simply `true` declares no property either
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {
            other: { type: 'boolean', [ADDITIONAL_PROPERTY_FLAG]: true, [GUESSED_TYPE_FLAG]: true },
          },
        });
      });
      it('has an anyOf option that declares a property in the branch its condition takes', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              properties: { kind: { type: 'string' } },
              if: { properties: { kind: { const: 'a' } }, required: ['kind'] },
              then: { properties: { extra: { type: 'number' } } },
              else: { properties: { spare: { type: 'number' } } },
            },
          ],
        };
        const rootSchema: RJSFSchema = {};
        // The branch the condition takes is the one whose properties the option renders, so a name it declares is
        // passed over there and stubbed under the branch that leaves it undeclared
        testValidator.setReturnValues({ isValid: [true] });
        expect(
          stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, {
            kind: 'a',
            extra: 1,
          }),
        ).toEqual({ ...schema, properties: {} });
        testValidator.setReturnValues({ isValid: [false] });
        expect(
          stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, {
            kind: 'b',
            extra: 1,
          }),
        ).toEqual({
          ...schema,
          properties: { extra: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('has an anyOf option with a condition and no root schema to resolve it against', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              properties: { kind: { type: 'string' } },
              if: { properties: { kind: { const: 'a' } } },
              then: { properties: { extra: { type: 'number' } } },
            },
          ],
        };
        const formData = { kind: 'a', extra: 1 };
        // Without a root schema there is nothing to resolve the condition against, so neither branch is read and the
        // name it declares keeps the field the object stubs for it
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: { extra: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('has a property name that is also a name on Object.prototype', () => {
        const schema: RJSFSchema = { additionalProperties: { type: 'string' } };
        const formData = { constructor: 'c', toString: 't' };
        // The declared names are read as own names, so a key called `constructor` or `toString` is stubbed rather than
        // left as a value with no field to edit or remove it with
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            constructor: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true },
            toString: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true },
          },
        });
      });
      it('has an anyOf option whose reference names a definition that takes keys of its own', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [{ $ref: '#/definitions/anyMap' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: { anyMap: { type: 'object', additionalProperties: { type: 'number' } } },
        };
        const formData = { other: 1 };
        // The definition the option is spelled as is what gives it that keyword, so the option renders every extra key
        // the data holds as surely as one carrying the keyword inline does, and stubbing the key here would give the
        // one value a second field beside the one the option renders for it
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has an anyOf option composed of an allOf entry that takes keys of its own', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [{ allOf: [{ properties: { kind: { type: 'string' } } }, { $ref: '#/definitions/patternedMap' }] }],
        };
        const rootSchema: RJSFSchema = {
          definitions: { patternedMap: { patternProperties: { '^x_': { type: 'number' } } } },
        };
        const formData = { x_one: 1 };
        // The keyword is as much the option's for being reached through an entry of the `allOf` it is composed of, and
        // through the reference that entry is spelled as, as it is for being written on the option itself
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has an anyOf option whose reference names a definition offering options of its own', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [{ $ref: '#/definitions/variant' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            variant: {
              oneOf: [
                { properties: { shared: { type: 'number' } } },
                { properties: { shared: { type: 'boolean' }, only: { type: 'number' } } },
              ],
            },
          },
        };
        const formData = { shared: 1, only: 2 };
        // The options behind the reference are the ones the option renders, so a name every one of them renders has
        // that option's field whichever is chosen and stubbing it here would give the one value a second field, while
        // a name only one of them declares keeps the field the object stubs for it
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: { only: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('has an anyOf option composed of an allOf entry offering options of its own', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [{ allOf: [{ oneOf: [{ properties: { nested: { type: 'number' } } }] }] }],
        };
        const formData = { nested: 1 };
        // The options are as much the option's for being reached through an entry of the `allOf` it is composed of as
        // they are for being written on the option itself
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has an option declaring a name through a dependency the data brings in', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              properties: { kind: { type: 'string' } },
              dependencies: { kind: { properties: { extra: { type: 'number' } } } },
            },
          ],
        };
        const formData = { kind: 'a', extra: 3 };
        // `retrieveSchema()` merges a dependency the data has the key of into the option before it renders, so the
        // name it declares is the option's own and a stub for it would give the one value a second field
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has an option declaring a name through a dependency the data leaves out', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              properties: { kind: { type: 'string' } },
              dependencies: {
                kind: { properties: { extra: { type: 'number' } } },
                absent: { properties: { unreached: { type: 'number' } } },
              },
            },
          ],
        };
        const formData = { extra: 3, unreached: 4 };
        // A dependency is read on the terms it is applied on: the data has neither key, and `absent` is not a property
        // the option declares, so neither dependency is merged in and the names they declare are the object's to stub
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: {
            extra: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true },
            unreached: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true },
          },
        });
      });
      it('has an option declaring a dependency as a list of required names', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [{ properties: { kind: { type: 'string' } }, dependencies: { kind: ['other'] } }],
        };
        const formData = { kind: 'a', other: 1 };
        // A property-list dependency adds nothing to `required` but declares no name of its own
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: { other: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it("resolves an option's $ref under a nested $id against that $id for the names the option declares", () => {
        const rootSchema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            child: {
              $id: 'child.json',
              type: 'object',
              additionalProperties: { type: 'number' },
              anyOf: [{ $ref: '#/$defs/x', additionalProperties: false }],
              $defs: { x: { type: 'object', properties: { a: { type: 'string' } } } },
            },
          },
          type: 'object',
          properties: { c: { $ref: 'child.json' } },
        };
        expect(retrieveProperty(testValidator, rootSchema, 'c', rootSchema, { a: 'hi' }).properties).toEqual({});
      });
      it('reads a $ref to a boolean definition as naming nothing', () => {
        const rootSchema: RJSFSchema = {
          definitions: { yes: true },
          type: 'object',
          additionalProperties: { type: 'number' },
          anyOf: [{ $ref: '#/definitions/yes', properties: { b: { type: 'string' } } }],
        };
        expect(
          stubExistingAdditionalProperties({ validator: testValidator }, rootSchema, rootSchema, { a: 1 }).properties,
        ).toEqual({ a: { type: 'number', [ADDITIONAL_PROPERTY_FLAG]: true } });
      });
      it("has an option declaring a name through the branch a dependency's oneOf settles on the data", () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              properties: { kind: { type: 'string', enum: ['x', 'y'] } },
              dependencies: {
                kind: {
                  oneOf: [
                    { properties: { kind: { enum: ['x'] }, px: { type: 'number' } } },
                    { properties: { kind: { enum: ['y'] }, py: { type: 'number' } } },
                  ],
                },
              },
            },
          ],
        };
        // The first branch of the dependency matches and the second does not, which is the one valid branch
        // `withExactlyOneSubschema()` needs to merge it in
        testValidator.setReturnValues({ isValid: [true, false] });
        const formData = { kind: 'x', px: 1 };
        // `withExactlyOneSubschema()` merges that branch into the option with no selector involved, so `px` is a name
        // the option renders: stubbing it would put a text input beside the number field the branch describes
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has an option declaring a name through a dependency spelled as a $ref to the oneOf', () => {
        const rootSchema: RJSFSchema = {
          definitions: {
            dep: {
              oneOf: [
                { properties: { kind: { enum: ['x'] }, px: { type: 'number' } } },
                { properties: { kind: { enum: ['y'] }, py: { type: 'number' } } },
              ],
            },
          },
        };
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              properties: { kind: { type: 'string', enum: ['x', 'y'] } },
              dependencies: { kind: { $ref: '#/definitions/dep' } },
            },
          ],
        };
        // The first branch of the dependency matches and the second does not, which is the one valid branch
        // `withExactlyOneSubschema()` needs to merge it in
        testValidator.setReturnValues({ isValid: [true, false] });
        const formData = { kind: 'x', px: 1 };
        // `withDependentSchema()` resolves the dependency before it takes the `oneOf` off, so the branch is settled
        // from the data for this spelling as surely as for an inline one, and `px` is a name the option renders
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has an option whose dependency spelled as a $ref qualifies no single branch', () => {
        const branches: RJSFSchema[] = [
          { properties: { kind: { type: 'string' }, px: { type: 'number' } } },
          { properties: { kind: { type: 'string' }, px: { type: 'string' } } },
        ];
        const rootSchema: RJSFSchema = { definitions: { dep: { oneOf: branches } } };
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              properties: { kind: { type: 'string' } },
              dependencies: { kind: { $ref: '#/definitions/dep' } },
            },
          ],
        };
        // Neither branch constrains `kind` beyond the type the data has, so both match, which is the case
        // `withExactlyOneSubschema()` logs and merges nothing in
        testValidator.setReturnValues({ isValid: [true, true] });
        const formData = { kind: 'x', px: 1 };
        // With no branch merged there is no field for `px` under the option, as there is none for the inline spelling
        // below: read through the reference, the branches would be options of their own and a name both declare one
        // the form renders
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: { px: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('has an option whose dependency oneOf qualifies no single branch', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              properties: { kind: { type: 'string' } },
              dependencies: {
                kind: {
                  oneOf: [
                    { properties: { kind: { type: 'string' }, px: { type: 'number' } } },
                    { properties: { kind: { type: 'string' }, py: { type: 'number' } } },
                  ],
                },
              },
            },
          ],
        };
        // Neither branch constrains `kind` beyond the type the data has, so both match, which is the case
        // `withExactlyOneSubschema()` logs and merges nothing in
        const formData = { kind: 'x', px: 1 };
        // With no branch merged there is no field for `px` under the option, so the name is the object's to stub
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: { px: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('has an option whose dependency oneOf holds a branch that names no condition', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          // `JSON.parse` because a boolean among the branches is a shape only an untyped caller can write, and it
          // names no condition the way the branch beside it leaves `kind` out
          oneOf: JSON.parse(
            '[{ "properties": { "kind": { "type": "string" } }, "dependencies": { "kind": { "oneOf": [true, { "properties": { "px": { "type": "number" } } }, { "properties": { "kind": { "enum": ["x"] }, "py": { "type": "number" } } }] } } }]',
          ),
        };
        // Only the branch naming `kind` is put to the validator at all, and it is the one that matches
        testValidator.setReturnValues({ isValid: [true] });
        const formData = { kind: 'x', px: 1, py: 2 };
        // A branch that does not name the dependency key is no more a candidate than a boolean one, so the only
        // branch merged in is the one that does: `py` is the option's name and `px` is the object's to stub
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: { px: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it("has an option whose dependency oneOf names its branches' conditions behind a $ref", () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          definitions: {
            x: { properties: { kind: { enum: ['x'] }, px: { type: 'number' } } },
            y: { properties: { kind: { enum: ['y'] }, py: { type: 'number' } } },
          },
          oneOf: [
            {
              properties: { kind: { type: 'string', enum: ['x', 'y'] } },
              dependencies: {
                kind: {
                  // The first branch names no condition of its own and none behind a reference either, so it is no
                  // candidate and is never put to the validator
                  oneOf: [{ required: ['kind'] }, { $ref: '#/definitions/x' }, { $ref: '#/definitions/y' }],
                },
              },
            },
          ],
        };
        // The condition the first reference names matches and the second's does not, which is the one valid branch
        // `withExactlyOneSubschema()` needs to merge it in
        testValidator.setReturnValues({ isValid: [true, false] });
        const formData = { kind: 'x', px: 1 };
        // `withDependentSchema()` resolves the branches before matching them, so the condition behind the reference is
        // the one that settles the branch: read unresolved the branch names none, no branch qualifies, and `px` takes
        // a text input beside the number field the branch renders it with
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('has an option with a dependency oneOf and no root schema to match its branches against', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          oneOf: [
            {
              properties: { kind: { type: 'string' } },
              dependencies: { kind: { oneOf: [{ properties: { kind: { enum: ['x'] }, px: { type: 'number' } } }] } },
            },
          ],
        };
        const formData = { kind: 'x', px: 1 };
        // Without a root schema no branch is matched, as no condition is settled, so the names a branch declares are
        // left to be stubbed rather than credited to the option
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: { px: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('describes its extra keys with unevaluatedProperties beside options that declare different names', () => {
        const schema: RJSFSchema = {
          type: 'object',
          oneOf: [
            { properties: { kind: { const: 'a' }, a: { type: 'object', properties: { x: { type: 'string' } } } } },
            { properties: { kind: { const: 'b' }, b: { type: 'number' } } },
          ],
          unevaluatedProperties: { type: 'string' },
        };
        const formData = { kind: 'a', a: { x: 'hi' } };
        // The keyword says nothing about a key the matching option evaluates, so a name that option declares is left
        // to it: stubbing `a` here would put a text input over the object the first option describes, and writing to
        // it would replace that object with a string
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: {},
        });
      });
      it('describes its extra keys with unevaluatedProperties beside an option the data does not match', () => {
        const schema: RJSFSchema = {
          type: 'object',
          oneOf: [
            { properties: { kind: { const: 'b' }, b: { type: 'number' } } },
            { properties: { kind: { const: 'a' }, a: { type: 'object', properties: { x: { type: 'string' } } } } },
          ],
          unevaluatedProperties: { type: 'string' },
        };
        // The matching option leads the list, which is the option the stub validator answers with as well as the one
        // the data validates against, so the walk reads the same option under either
        const formData = { kind: 'b', a: 'left over' };
        // Only the option the data matches evaluates anything, so `a` is a key nothing evaluates: the keyword
        // describes it and the object stubs it, where leaving it to the option declaring it would cost the value the
        // only field it has
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: { a: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('describes its extra keys with unevaluatedProperties beside an option whose reference names no definition', () => {
        const schema: RJSFSchema = {
          type: 'object',
          oneOf: [{ properties: { a: { type: 'number' } } }, { $ref: '#/definitions/missing' }],
          unevaluatedProperties: { type: 'string' },
        };
        // The matching option leads the list, which is the option the stub validator answers with, so the reference
        // beside it is one the walk resolves to score and reads nothing else off
        const formData = { a: 1, extra: 'hi' };
        // Matching the option the data belongs to resolves the references first, and an unresolvable one is scored as
        // it stands rather than throwing: the reference says as little about the data as the walk of the options reads
        // off it, and whatever resolves the option to render it reports the reference on its own, where a throw here
        // would take down an object that asked nothing but which of its keys to stub
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: { extra: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('describes its extra keys with additionalProperties beside unevaluatedProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: { type: 'string' },
          unevaluatedProperties: { type: 'number' },
          oneOf: [{ properties: { only: { type: 'boolean' } } }, { properties: { kind: { type: 'string' } } }],
        };
        const formData = { only: true };
        // `additionalProperties` describes the key whichever option is chosen, and it takes precedence over the
        // keyword beside it, so only a name every option renders is left to the options
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, schema, formData)).toEqual({
          ...schema,
          properties: { only: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('has an allOf entry that takes keys of its own, left unmerged', () => {
        const schema: RJSFSchema = {
          additionalProperties: { type: 'string' },
          allOf: [{ properties: { kind: { type: 'string' } }, patternProperties: { '^x_': { type: 'number' } } }],
        };
        const formData = { x_one: 1 };
        // `retrieveSchema()` merges an `allOf` before it stubs, so an entry of one that takes keys of its own is this
        // very object taking them -- the case the stub is for, not one to leave to another schema
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: { x_one: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true } },
        });
      });
      it('has a property name of __proto__', () => {
        const schema: RJSFSchema = { additionalProperties: { type: 'string' } };
        const formData = JSON.parse('{"__proto__": "p"}') as object;
        // A plain assignment would run the setter `Object.prototype` carries for the name and declare no property at
        // all, leaving the value with no field to edit or remove it with
        const stubbed = stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData);
        expect(Object.keys(stubbed.properties!)).toEqual(['__proto__']);
        expect(Object.getOwnPropertyDescriptor(stubbed.properties, '__proto__')?.value).toEqual({
          type: 'string',
          [ADDITIONAL_PROPERTY_FLAG]: true,
        });
      });
      it('has an anyOf option that refers back to the definition it is declared in', () => {
        const schema: RJSFSchema = { additionalProperties: true, anyOf: [{ $ref: '#/definitions/loop' }] };
        const rootSchema: RJSFSchema = {
          definitions: {
            loop: { properties: { deep: { type: 'string' } }, anyOf: [{ $ref: '#/definitions/loop' }] },
          },
        };
        const formData = { deep: 'a', other: true };
        // A reference followed once is not followed again, since a recursive option refers back to itself without end
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {
            other: { type: 'boolean', [ADDITIONAL_PROPERTY_FLAG]: true, [GUESSED_TYPE_FLAG]: true },
          },
        });
      });
      it('has additionalProperties with a default of another type than the data', () => {
        const schema: RJSFSchema = { additionalProperties: { title: 'Anything', default: 'X' } };
        const formData = { foo: 1, bar: 'a' };
        // A string default would re-seed the number field with a value it cannot hold, so it is only kept for the
        // property whose data is a string too
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            foo: { title: 'Anything', type: 'number', [ADDITIONAL_PROPERTY_FLAG]: true, [GUESSED_TYPE_FLAG]: true },
            bar: {
              title: 'Anything',
              default: 'X',
              type: 'string',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
          },
        });
      });
      it('has additionalProperties constrained through subschemas', () => {
        const schema: RJSFSchema = { additionalProperties: { allOf: [{ type: 'number' }], not: { const: 0 } } };
        const formData = { foo: 'a' };
        // The subschema is resolved before it is stubbed, so the `allOf` names the property's type rather than leaving
        // it to data the schema rejects, and the property renders as the field that type calls for
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            foo: { type: 'number', not: { const: 0 }, [ADDITIONAL_PROPERTY_FLAG]: true },
          },
        });
      });
      it('has additionalProperties with a ref', () => {
        const schema: RJSFSchema = {
          additionalProperties: { $ref: '#/definitions/foo' },
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            foo: { type: 'string' },
          },
        };
        const formData = { bar: 'blah' };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, rootSchema, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              type: 'string',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [RJSF_REF_KEY]: '#/definitions/foo',
            },
          },
        });
      });
      it('has property keys that does not match patternProperties, no additionalProperties', () => {
        const schema: RJSFSchema = {
          patternProperties: {
            '^foo': {
              type: 'string',
            },
            '^bar': {
              type: 'number',
            },
          },
        };
        const formData = { baz: 1 };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            baz: {
              type: 'number',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
          },
        });
      });
      it('has property keys that does not match patternProperties, additionalProperties is false', () => {
        const schema: RJSFSchema = {
          patternProperties: {
            '^foo': {
              type: 'string',
            },
            '^bar': {
              type: 'number',
            },
          },
          additionalProperties: false,
        };
        const formData = { baz: 1 };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            baz: {
              type: 'null',
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
          },
        });
      });
      it('has property keys that does not match patternProperties, unevaluatedProperties is false', () => {
        // `unevaluatedProperties: false` rejects exactly the keys the patterns leave over, so a key none of them
        // match is as forbidden as it is under `additionalProperties: false` and gets the same stub
        const schema: RJSFSchema = {
          patternProperties: {
            '^foo': {
              type: 'string',
            },
          },
          unevaluatedProperties: false,
        };
        const formData = { baz: 1 };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            baz: {
              type: 'null',
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
          },
        });
      });
      it('has property keys that does not match patternProperties, unevaluatedProperties is false beside an additionalProperties schema', () => {
        // The `additionalProperties` schema evaluates the key, which leaves `unevaluatedProperties` nothing to reject
        const schema: RJSFSchema = {
          patternProperties: {
            '^foo': {
              type: 'string',
            },
          },
          additionalProperties: {
            type: 'number',
          },
          unevaluatedProperties: false,
        };
        const formData = { baz: 1 };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            baz: {
              type: 'number',
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
          },
        });
      });
      it('has property keys that match patternProperties', () => {
        const schema: RJSFSchema = {
          patternProperties: {
            '^foo': {
              type: 'string',
            },
            '^bar': {
              type: 'number',
              minimum: 10,
            },
          },
        };
        const formData = { bar: 1 };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              type: 'number',
              minimum: 10,
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
          },
        });
      });
      it('has property keys that match multiple patternProperties', () => {
        const schema: RJSFSchema = {
          patternProperties: {
            '^foo': {
              type: 'string',
            },
            '^bar': {
              type: 'number',
              minimum: 10,
            },
            '^ba.*': {
              type: 'number',
              maximum: 20,
            },
          },
        };
        const formData = { bar: 1 };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              type: 'number',
              minimum: 10,
              maximum: 20,
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
          },
        });
      });
      it('has property keys that match patternProperties, additionalProperties is boolean', () => {
        const schema: RJSFSchema = {
          patternProperties: {
            '^foo': {
              type: 'string',
            },
            '^bar': {
              type: 'number',
              minimum: 10,
            },
          },
          additionalProperties: true,
        };
        const formData = { bar: 1, baz: true };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              type: 'number',
              minimum: 10,
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
            baz: {
              type: 'boolean',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
          },
        });
      });
      it('has property keys that match patternProperties, additionalProperties is object', () => {
        const schema: RJSFSchema = {
          patternProperties: {
            '^foo': {
              type: 'string',
            },
            '^bar': {
              type: 'number',
              minimum: 10,
            },
          },
          additionalProperties: {
            type: 'number',
            maximum: 20,
          },
        };
        const formData = { bar: 1, baz: 2 };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              type: 'number',
              minimum: 10,
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
            baz: {
              type: 'number',
              maximum: 20,
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
          },
        });
      });
      it('has a property key matching a patternProperties subschema that names no type', () => {
        // The matching pattern says what the value has to be without saying what it is, so the stub takes the type
        // from the data the key holds and keeps the constraint, leaving a field that renders and validates the value
        const schema: RJSFSchema = {
          patternProperties: {
            '^ba': {
              minLength: 2,
            },
          },
        };
        const formData = { bar: 'hello' };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              type: 'string',
              minLength: 2,
              [ADDITIONAL_PROPERTY_FLAG]: true,
            },
          },
        });
      });
      it('has a property key matching a patternProperties subschema that constrains nothing', () => {
        // A pattern that constrains the value not at all leaves the key free to hold any type, which is what the
        // guessed marker tells the fallback UI, so the type the data gives the stub is not one it locks in
        const schema: RJSFSchema = {
          patternProperties: {
            '^ba': {},
          },
        };
        const formData = { bar: 'hello' };
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            bar: {
              type: 'string',
              [ADDITIONAL_PROPERTY_FLAG]: true,
              [GUESSED_TYPE_FLAG]: true,
            },
          },
        });
      });
    });
    describe('relaxOptionsForScoring()', () => {
      it('converts boolean true to an empty schema', () => {
        expect(relaxOptionsForScoring([true])).toEqual([{}]);
      });
      it('converts boolean false to a {not:{}} schema', () => {
        expect(relaxOptionsForScoring([false])).toEqual([{ not: {} }]);
      });
      it('derives the $id of a widened option, leaving out the empty fragment the newer drafts reject in it', () => {
        const option: RJSFSchema = { $id: 'http://e.com/a.json#', type: 'object', additionalProperties: false };
        const [widened] = relaxOptionsForScoring([option]);
        expect(widened.$id).toMatch(/^http:\/\/e\.com\/a\.json\?rjsf=[^#?]+$/);
        expect(relaxOptionsForScoring([widened])[0].$id).toBe(widened.$id);
      });
      it('widens additionalProperties:false to true', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' } },
          additionalProperties: false,
        };
        expect(relaxOptionsForScoring([schema])).toEqual([
          {
            type: 'object',
            properties: { a: { type: 'string' } },
            additionalProperties: true,
          },
        ]);
      });
      it('leaves schemas without additionalProperties unchanged', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' } },
        };
        expect(relaxOptionsForScoring([schema])).toEqual([schema]);
      });
      it('leaves schemas with additionalProperties:true unchanged', () => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: true,
        };
        expect(relaxOptionsForScoring([schema])).toEqual([schema]);
      });
      it('handles a mixed array of booleans and schemas', () => {
        const schemaFalse: RJSFSchema = {
          type: 'object',
          additionalProperties: false,
        };
        expect(relaxOptionsForScoring([true, false, schemaFalse])).toEqual([
          {},
          { not: {} },
          { type: 'object', additionalProperties: true },
        ]);
      });
      describe('resolveRefs=true', () => {
        it('resolves a $ref and widens additionalProperties:false to true', () => {
          const rootSchema: RJSFSchema = {
            definitions: {
              Strict: {
                type: 'object',
                properties: { a: { type: 'string' } },
                additionalProperties: false,
              },
            },
          };
          expect(relaxOptionsForScoring([{ $ref: '#/definitions/Strict' }], true, rootSchema)).toEqual([
            expect.objectContaining({
              type: 'object',
              properties: { a: { type: 'string' } },
              additionalProperties: true,
            }),
          ]);
        });
        it('resolves a $ref without additionalProperties constraint and leaves it unchanged', () => {
          const rootSchema: RJSFSchema = {
            definitions: {
              Open: { type: 'object', properties: { b: { type: 'number' } } },
            },
          };
          expect(relaxOptionsForScoring([{ $ref: '#/definitions/Open' }], true, rootSchema)).toEqual([
            expect.objectContaining({
              type: 'object',
              properties: { b: { type: 'number' } },
            }),
          ]);
        });
        it('leaves a plain schema (no $ref) unchanged when there is no additionalProperties:false', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { c: { type: 'string' } },
          };
          expect(relaxOptionsForScoring([schema], true, {})).toEqual([schema]);
        });
        it('does not resolve refs when resolveRefs is false (default)', () => {
          const rootSchema: RJSFSchema = {
            definitions: {
              Strict: {
                type: 'object',
                properties: { a: { type: 'string' } },
                additionalProperties: false,
              },
            },
          };
          const ref: RJSFSchema = { $ref: '#/definitions/Strict' };
          expect(relaxOptionsForScoring([ref], false, rootSchema)).toEqual([ref]);
        });
        it('does not resolve refs when resolveRefs is true but rootSchema is omitted', () => {
          const ref: RJSFSchema = { $ref: '#/definitions/Strict' };
          expect(relaxOptionsForScoring([ref], true)).toEqual([ref]);
        });
      });
    });
    describe('Edge cases for customMergeAllOf fix', () => {
      it('should handle undefined customMergeAllOf parameter gracefully', () => {
        const schema: RJSFSchema = {
          $ref: '#/definitions/testRef',
          dependencies: {
            trigger: {
              allOf: [
                {
                  type: 'object',
                  properties: {
                    prop: { type: 'string' },
                  },
                },
              ],
            },
          },
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            testRef: {
              type: 'object',
              properties: {
                base: { type: 'string' },
              },
            },
          },
        };
        const formData = { trigger: 'value' };
        // Test with undefined customMergeAllOf (should use default mergeAllOf)
        const result = retrieveSchema({ validator: testValidator }, schema, rootSchema, formData);
        expect(result).toEqual({
          type: 'object',
          properties: {
            base: { type: 'string' },
            prop: { type: 'string' },
          },
          [RJSF_REF_KEY]: '#/definitions/testRef',
        });
      });
      it('should handle customMergeAllOf that throws an error', () => {
        const schema: RJSFSchema = {
          allOf: [
            {
              type: 'object',
              properties: {
                string: { type: 'string' },
              },
            },
            {
              type: 'object',
              properties: {
                number: { type: 'number' },
              },
            },
          ],
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const customMergeAllOf = vi.fn().mockImplementation(() => {
          throw new Error('Custom merge failed');
        });
        const result = retrieveSchema({ validator: testValidator, customMergeAllOf }, schema, rootSchema, {});
        // Should fall back to default behavior when custom merge fails
        expect(result).toEqual({});
        expect(consoleWarnSpy).toHaveBeenCalledWith('could not merge subschemas in allOf:\n', expect.any(Error));
      });
      it('should pass customMergeAllOf through complex nested resolution chains', () => {
        const schema: RJSFSchema = {
          $ref: '#/definitions/level1',
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            level1: {
              $ref: '#/definitions/level2',
              dependencies: {
                dep1: {
                  allOf: [
                    {
                      type: 'object',
                      properties: {
                        nested1: { type: 'string' },
                      },
                    },
                  ],
                },
              },
            },
            level2: {
              type: 'object',
              properties: {
                base: { type: 'string' },
              },
              allOf: [
                {
                  type: 'object',
                  properties: {
                    additional: { type: 'number' },
                  },
                },
              ],
            },
          },
        };
        const formData = { dep1: 'value' };
        const customMergeAllOf = vi.fn().mockImplementation((schema: RJSFSchema) => {
          const allProperties: any = {};
          if (schema.properties) {
            Object.assign(allProperties, schema.properties);
          }
          if (schema.allOf) {
            schema.allOf.forEach((subSchema) => {
              if (typeof subSchema === 'object' && subSchema.properties) {
                Object.assign(allProperties, subSchema.properties);
              }
            });
          }
          return {
            ...schema,
            properties: allProperties,
            allOf: undefined,
          };
        });
        const result = retrieveSchema({ validator: testValidator, customMergeAllOf }, schema, rootSchema, formData);
        // `level1` and its `dependencies` read as one `allOf`, merged beside `level2`'s own and the one `dep1` brings,
        // which qualifies since the keywords beside the `$ref` declare no property
        expect(customMergeAllOf).toHaveBeenCalledTimes(3);
        expect(result).toEqual({
          properties: {
            base: { type: 'string' },
            additional: { type: 'number' },
            nested1: { type: 'string' },
          },
          allOf: undefined,
          [RJSF_REF_KEY]: '#/definitions/level1',
        });
      });
    });
    describe('retrieveSchema() over the schema graph', () => {
      const D = (name: string) => `#/definitions/${name}`;
      const node: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' }, child: { $ref: D('node') } },
      };
      const collapsedChild = { $ref: D('node'), [RJSF_REF_CYCLE_KEY]: true };

      it('resolves a dense definition graph one level at a time, and the same again from its own output', () => {
        const names = ['d0', 'd1', 'd2', 'd3'];
        const definitions = Object.fromEntries(
          names.map((name): [string, RJSFSchema] => [
            name,
            {
              type: 'object',
              properties: Object.fromEntries(
                names.filter((other) => other !== name).map((other) => [other, { $ref: D(other) }]),
              ),
            },
          ]),
        );
        const rootSchema: RJSFSchema = { definitions, $ref: D('d0') };
        const once = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema);
        expect(once.properties).toEqual({ d1: { $ref: D('d1') }, d2: { $ref: D('d2') }, d3: { $ref: D('d3') } });
        expect(retrieveSchema({ validator: testValidator }, once, rootSchema)).toEqual(once);
        // As `ObjectField` retrieves the schema `SchemaField` retrieved, resolving the options too
        expect(retrieveSchema({ validator: testValidator }, once, rootSchema, {}, true)).toEqual(once);
        const d1 = retrieveProperty(testValidator, once, 'd1', rootSchema);
        // `d0` is the definition the root was resolved from, so `d1`'s way back to it is the cycle
        expect(d1.properties).toEqual({
          d0: { $ref: D('d0'), [RJSF_REF_CYCLE_KEY]: true },
          d2: { $ref: D('d2') },
          d3: { $ref: D('d3') },
        });
      });
      it.each<[string, (schema: RJSFSchema) => RJSFSchema]>([
        ['an unchanged spread copy', (schema) => ({ ...schema })],
        ['a copy with a keyword of its own', (schema) => ({ ...schema, description: 'copied' })],
      ])('resolves %s of a handed-out property as the property it copies', (_, copy) => {
        const rootSchema: RJSFSchema = {
          definitions: {
            A: { type: 'object', properties: { a: { type: 'string' }, b: { $ref: D('B') } } },
            B: { type: 'object', properties: { c: { type: 'string' }, a2: { $ref: D('A') } } },
          },
          $ref: D('A'),
        };
        const top = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema);
        const b = schemaOf(top.properties?.b);
        const original = retrieveSchema({ validator: testValidator }, b, rootSchema);
        const copied = retrieveSchema({ validator: testValidator }, copy(b), rootSchema);
        expect(original.properties?.a2).toEqual({ $ref: D('A'), [RJSF_REF_CYCLE_KEY]: true });
        expect(copied.properties).toEqual(original.properties);
      });
      it('collapses a recursion reached through an allOf (#5501)', () => {
        const rootSchema: RJSFSchema = {
          definitions: { node: { type: 'object', properties: { child: { allOf: [{ $ref: D('node') }] } } } },
          $ref: D('node'),
        };
        const retrieved = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema);
        expect(retrieved.properties?.child).toEqual({ allOf: [{ $ref: D('node') }], [RJSF_REF_CYCLE_KEY]: true });
      });
      it('collapses a recursion reached through a then on the property (#5501)', () => {
        const child: RJSFSchema = { type: 'object', if: {}, then: { $ref: D('node') } };
        const rootSchema: RJSFSchema = {
          definitions: { node: { type: 'object', properties: { name: { type: 'string' }, child } } },
          $ref: D('node'),
        };
        const retrieved = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema);
        expect(retrieved.properties?.child).toEqual({ ...child, [RJSF_REF_CYCLE_KEY]: true });
      });
      it('expands a collapsed property by one level when retrieved with its cycle flag cleared', () => {
        const rootSchema: RJSFSchema = { definitions: { node }, $ref: D('node') };
        const retrieved = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema);
        expect(retrieved.properties?.child).toEqual(collapsedChild);
        const expanded = retrieveSchema(
          { validator: testValidator },
          { ...schemaOf(retrieved.properties?.child), [RJSF_REF_CYCLE_KEY]: false },
          rootSchema,
        );
        expect(expanded).toEqual({
          ...node,
          properties: { name: { type: 'string' }, child: collapsedChild },
          [RJSF_REF_KEY]: D('node'),
        });
      });
      it.each<[string, RJSFSchema]>([
        [
          '#5452a, two definitions whose patterns match the keys referring to each other',
          {
            $ref: D('x'),
            definitions: {
              x: { type: 'object', properties: { y: { $ref: D('y') } }, patternProperties: { '^y': { title: 'Y' } } },
              y: { type: 'object', properties: { x: { $ref: D('x') } }, patternProperties: { '^x': { title: 'X' } } },
            },
          },
        ],
        [
          '#5452b, an allOf entry declaring a recursive property its own pattern matches',
          {
            $ref: D('node'),
            definitions: {
              node: {
                type: 'object',
                allOf: [{ properties: { child: { $ref: D('node') } }, patternProperties: { '^c': { title: 'C' } } }],
              },
            },
          },
        ],
      ])('terminates on %s', (_, rootSchema) => {
        const retrieved = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema);
        expect(retrieveSchema({ validator: testValidator }, retrieved, rootSchema)).toEqual(retrieved);
      });
      describe('on its own output', () => {
        const ref: RJSFSchema = { $ref: D('node') };
        const nodeWith = (child: RJSFSchema): RJSFSchema => ({
          definitions: { node: { type: 'object', properties: { name: { type: 'string' }, child } } },
          $ref: D('node'),
        });
        /** The ids of the properties below `schema` down to `depth` levels, each retrieved as the form retrieves it,
         * with `cycle` after the id of one flagged as the cycle; every one is checked to come back unchanged
         */
        function walk(schema: RJSFSchema, rootSchema: RJSFSchema, data: unknown, depth: number, id = 'root'): string[] {
          const retrieved = retrieveSchema({ validator: testValidator }, schema, rootSchema, data);
          expect(retrieveSchema({ validator: testValidator }, retrieved, rootSchema, data)).toEqual(retrieved);
          return Object.entries(retrieved.properties ?? {}).flatMap(([key, property]) => {
            const child = schemaOf(property);
            if (Reflect.get(child, RJSF_REF_CYCLE_KEY) === true) {
              return [`${id}_${key} cycle`];
            }
            const childData = isObject(data) ? data[key] : undefined;
            return depth === 0
              ? []
              : [`${id}_${key}`, ...walk(child, rootSchema, childData, depth - 1, `${id}_${key}`)];
          });
        }

        it.each<[string, RJSFSchema, string[], unknown?]>([
          ['a property', nodeWith(ref), ['root_name', 'root_child cycle']],
          [
            'an allOf declaring the property (#5500)',
            nodeWith({ type: 'object', allOf: [{ properties: { x: ref } }] }),
            ['root_name', 'root_child', 'root_child_x cycle'],
          ],
          [
            'a then declaring the property (#5500)',
            nodeWith({ type: 'object', if: {}, then: { properties: { x: ref } } }),
            ['root_name', 'root_child', 'root_child_x cycle'],
          ],
          [
            'a dependencies entry declaring the property (#5500)',
            nodeWith({
              type: 'object',
              properties: { x: { type: 'string' } },
              dependencies: { x: { properties: { y: ref } } },
            }),
            ['root_name', 'root_child', 'root_child_x', 'root_child_y cycle'],
            { child: { x: 'x' } },
          ],
          [
            'a chain of aliases',
            {
              definitions: {
                node: { type: 'object', properties: { n: { type: 'string' }, c: { $ref: D('A1') } } },
                A1: { $ref: D('A2') },
                A2: ref,
              },
              $ref: D('node'),
            },
            ['root_n', 'root_c cycle'],
          ],
          [
            'two definitions that refer to each other',
            {
              definitions: {
                A: { type: 'object', properties: { a: { type: 'string' }, b: { $ref: D('B') } } },
                B: { type: 'object', properties: { c: { type: 'string' }, a2: { $ref: D('A') } } },
              },
              $ref: D('A'),
            },
            ['root_a', 'root_b', 'root_b_c', 'root_b_a2 cycle'],
          ],
          [
            'a root that is not a $ref',
            { type: 'object', properties: { name: { type: 'string' }, child: { $ref: '#' } } },
            ['root_name', 'root_child', 'root_child_name', 'root_child_child cycle'],
          ],
        ])(
          'gives back every level of a recursion through %s, collapsing where it comes back round',
          (_, rootSchema, ids, data) => {
            expect(walk(rootSchema, rootSchema, data, 4)).toEqual(ids);
          },
        );
      });
      it('flags a boolean property as a cycle when a pattern it matches leads back round the recursion', () => {
        const rootSchema: RJSFSchema = {
          definitions: {
            node: { type: 'object', properties: { child: true }, patternProperties: { '^c': { $ref: D('node') } } },
          },
          $ref: D('node'),
        };
        const retrieved = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema);
        expect(retrieved.properties?.child).toEqual({ [RJSF_REF_CYCLE_KEY]: true });
      });
      it('merges the patterns of a key into it, and flags the key that leads back as a cycle', () => {
        const rootSchema: RJSFSchema = {
          $ref: D('x'),
          definitions: {
            x: { type: 'object', properties: { y: { $ref: D('y') } }, patternProperties: { '^y': { title: 'Y' } } },
            y: { type: 'object', properties: { x: { $ref: D('x') } }, patternProperties: { '^x': { title: 'X' } } },
          },
        };
        const retrieved = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema);
        expect(retrieved.properties?.y).toEqual({
          type: 'object',
          title: 'Y',
          properties: { x: { $ref: D('x'), [RJSF_REF_CYCLE_KEY]: true } },
          patternProperties: { '^x': { title: 'X' } },
          [RJSF_REF_KEY]: D('y'),
        });
      });
      it('renders nothing beside the selector for an option that refers back to the schema offering it', () => {
        const rootSchema: RJSFSchema = {
          definitions: {
            node: { anyOf: [{ $ref: D('node') }, { type: 'object', properties: { x: { type: 'string' } } }] },
          },
          $ref: D('node'),
        };
        const retrieved = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema, {}, true);
        expect(retrieved.anyOf).toEqual([{}, { type: 'object', properties: { x: { type: 'string' } } }]);
        const [ownOption] = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema, {}).anyOf ?? [];
        expect(retrieveSchema({ validator: testValidator }, schemaOf(ownOption), rootSchema, {})).toEqual({});
      });
      it('hands out each subschema of a prefixItems tuple for its row to resolve', () => {
        const rootSchema: RJSFSchema = {
          definitions: { node },
          type: 'array',
          prefixItems: [{ $ref: D('node') }, true],
        };
        const prefixItems: unknown = retrieveSchema({ validator: testValidator }, rootSchema, rootSchema).prefixItems;
        expect(prefixItems).toEqual([{ $ref: D('node') }, true]);
        const [first] = Array.isArray(prefixItems) ? prefixItems : [];
        expect(retrieveSchema({ validator: testValidator }, schemaOf(first), rootSchema)).toEqual({
          ...node,
          properties: { name: { type: 'string' }, child: collapsedChild },
          [RJSF_REF_KEY]: D('node'),
        });
      });
      it('merges the option beside dependencies, reading a boolean option as the schema it stands for', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' } },
          dependencies: { a: ['b'] },
          anyOf: [false, true],
        };
        const retrieved = retrieveSchema({ validator: testValidator }, schema, schema, { a: 'x' });
        expect(retrieved).not.toHaveProperty('anyOf');
        expect(retrieved.required).toEqual(['b']);
      });
      it.each(['anyOf', 'oneOf'] as const)(
        'keeps the %s the option merged beside dependencies declares of its own',
        (keyword) => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'string' } },
            dependencies: { a: ['a'] },
            [keyword]: [
              {
                properties: { k: { const: 'one' } },
                [keyword]: [
                  { properties: { p: { type: 'string' } }, required: ['p'] },
                  { properties: { q: { type: 'number' } }, required: ['q'] },
                ],
              },
              { properties: { k: { const: 'two' } } },
            ],
          };
          const retrieved = retrieveSchema({ validator: testValidator }, schema, schema, { k: 'one', q: 2 });
          expect(retrieved.properties).toHaveProperty('k');
          expect(retrieved[keyword]?.map((option) => (isObject(option) ? option.required : option))).toEqual([
            ['p'],
            ['q'],
          ]);
        },
      );
      it.each(['https://json-schema.org/draft/2019-09/schema', 'https://json-schema.org/draft/2020-12/schema'])(
        "under %s, reads a field's own $ref with keywords beside it as the allOf of both, as where another $ref reaches it",
        ($schema) => {
          const rootSchema: RJSFSchema = {
            $schema,
            type: 'object',
            $defs: { Pet: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
            properties: { cat: { $ref: '#/$defs/Pet', properties: { meow: { type: 'string' } } } },
          };
          const schemaUtils = createSchemaUtils({ validator: testValidator }, rootSchema);
          const cat = schemaUtils.retrieveSchema(
            schemaOf(schemaUtils.retrieveSchema(schemaUtils.getRootSchema()).properties?.cat),
          );
          expect(cat.properties).toEqual({ meow: { type: 'string' }, name: { type: 'string' } });
          expect(cat.required).toEqual(['name']);
        },
      );
      it('resolves a $ref under a relative $id against that $id', () => {
        const rootSchema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            child: { $id: 'child.json', properties: { a: { $ref: '#/$defs/x' } }, $defs: { x: { type: 'string' } } },
          },
          properties: { c: { $ref: 'child.json' } },
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, rootSchema);
        const root = schemaUtils.getRootSchema();
        const c = schemaUtils.retrieveSchema(schemaOf(schemaUtils.retrieveSchema(root).properties?.c));
        expect(schemaUtils.retrieveSchema(schemaOf(c.properties?.a))).toEqual(
          expect.objectContaining({ type: 'string' }),
        );
      });
      it("resolves an option's $ref under a relative $id against that $id, for the defaults and option scoring", () => {
        const rootSchema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            child: {
              $id: 'child.json',
              type: 'object',
              properties: { a: { anyOf: [{ $ref: '#/$defs/x' }, { type: 'number' }] } },
              $defs: { x: { type: 'string', default: 'dx' } },
            },
          },
          type: 'object',
          properties: { c: { $ref: 'child.json' } },
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, rootSchema);
        const root = schemaUtils.getRootSchema();
        expect(schemaUtils.getDefaultFormState(root)).toEqual({ c: { a: 'dx' } });
        const c = schemaUtils.retrieveSchema(schemaOf(schemaUtils.retrieveSchema(root).properties?.c));
        const a = schemaUtils.retrieveSchema(schemaOf(c.properties?.a), 's');
        const handedOut = (a.anyOf ?? []).map(schemaOf);
        const raw = root.$defs?.child;
        const rawOptions = isObject(raw) && isObject(raw.properties?.a) ? (raw.properties.a.anyOf ?? []) : [];
        expect(schemaUtils.getClosestMatchingOption('s', handedOut, 1)).toBe(0);
        expect(schemaUtils.getClosestMatchingOption('s', rawOptions.map(schemaOf), 1)).toBe(0);
      });
      it('resolves a $ref under a relative root $id to the resource it names, not one whose $id repeats the path', () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'a/root.json',
          $defs: {
            one: { $id: 'b.json', type: 'number' },
            two: { $id: 'a/b.json', type: 'string' },
          },
          properties: { x: { $ref: 'b.json' } },
        };
        const utils = createSchemaUtils({ validator: testValidator }, schema);
        expect(utils.getRootSchema().properties?.x).toEqual({ $ref: 'b.json' });
        const x = utils.retrieveSchema(schemaOf(utils.retrieveSchema(utils.getRootSchema()).properties?.x));
        expect(x).toEqual(expect.objectContaining({ $id: 'b.json', type: 'number' }));
        expect(retrieveSchema({ validator: testValidator }, { $ref: 'b.json' }, schema).type).toBe('number');
      });
      it('resolves the $ref of an additionalProperties under a nested $id on a later call (#5529)', () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            x: { type: 'string' },
            lib: {
              $id: 'lib.json',
              type: 'object',
              additionalProperties: { $ref: '#/$defs/x' },
              $defs: { x: { type: 'number' } },
            },
          },
          properties: { p: { $ref: 'lib.json' } },
        };
        const p = retrieveSchema({ validator: testValidator }, { $ref: 'lib.json' }, schema, { k: 1 });
        const k = retrieveSchema({ validator: testValidator }, schemaOf(p.properties?.k), schema, 1);
        expect(k.type).toBe('number');
      });
      it("resolves the additionalProperties $ref of a nested resource under a relative root $id to the resource's own definition (#5529)", () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'schemas/root.json',
          $defs: {
            x: { type: 'number' },
            child: {
              $id: 'nested/child.json',
              $defs: { x: { type: 'string' } },
              additionalProperties: { $ref: '#/$defs/x' },
            },
          },
          properties: { c: { $ref: '#/$defs/child' } },
        };
        const utils = createSchemaUtils({ validator: testValidator }, schema);
        const child = schemaOf(utils.getRootSchema().$defs?.child);
        const additionalProperties = schemaOf(child.additionalProperties);
        expect(additionalProperties).toEqual({ $ref: '#/$defs/x' });
        expect(utils.retrieveSchema(additionalProperties)).toEqual({ type: 'string', [RJSF_REF_KEY]: '#/$defs/x' });
      });
      it('resolves a $ref under an inline nested $id that properties reach (#5529)', () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: { x: { type: 'string' } },
          properties: {
            a: { $id: 'lib.json', properties: { b: { $ref: '#/$defs/x' } }, $defs: { x: { type: 'number' } } },
          },
        };
        const a = retrieveProperty(testValidator, schema, 'a', schema);
        expect(retrieveProperty(testValidator, a, 'b', schema).type).toBe('number');
      });
      it('hands out each object option a customMergeAllOf lists for the field, wherever it puts it', () => {
        const b: RJSFSchema = { title: 'b' };
        const c: RJSFSchema = { title: 'c' };
        const schema: RJSFSchema = { allOf: [{ anyOf: [true] }, { anyOf: [b, c] }] };
        const customMergeAllOf = (merged: RJSFSchema): RJSFSchema => ({ anyOf: [b, true, c], title: merged.title });
        const retrieved = retrieveSchema({ validator: testValidator, customMergeAllOf }, schema, schema);
        const [first, second, third] = retrieved.anyOf ?? [];
        expect(second).toBe(true);
        expect([first, third].map((option) => isObject(option) && RJSF_PROVENANCE_KEY in option)).toEqual([true, true]);
        expect(retrieveSchema({ validator: testValidator }, schemaOf(third), schema)).toEqual({ title: 'c' });
      });
      it("resolves the $ref of one object reached in two resources against each resource's own definitions", () => {
        const shared: RJSFSchema = { $ref: '#/$defs/t' };
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            A: { $id: 'a.json', $defs: { t: { type: 'string' } }, type: 'object', properties: { p: shared } },
            B: { $id: 'b.json', $defs: { t: { type: 'number' } }, type: 'object', properties: { p: shared } },
          },
          type: 'object',
          properties: { a: { $ref: 'a.json' }, b: { $ref: 'b.json' } },
        };
        const root = retrieveSchema({ validator: testValidator }, schema, schema, {});
        const a = retrieveProperty(testValidator, root, 'a', schema, {});
        const b = retrieveProperty(testValidator, root, 'b', schema, {});
        expect(retrieveProperty(testValidator, a, 'p', schema).type).toBe('string');
        expect(retrieveProperty(testValidator, b, 'p', schema).type).toBe('number');
      });
      it('resolves the $ref of a copy of a subschema handed out inside a nested resource against that resource', () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            t: { type: 'string', title: 'root t' },
            A: {
              $id: 'a.json',
              $defs: { t: { type: 'number', title: 'A t' } },
              type: 'object',
              properties: { p: { $ref: '#/$defs/t' }, q: { minimum: 1, anyOf: [{ $ref: '#/$defs/t' }] } },
            },
          },
          type: 'object',
          properties: { a: { $ref: 'a.json' } },
        };
        const root = retrieveSchema({ validator: testValidator }, schema, schema, {});
        const a = retrieveProperty(testValidator, root, 'a', schema, {});
        const p = schemaOf(a.properties?.p);
        expect(retrieveSchema({ validator: testValidator }, { ...p, description: 'copy' }, schema).type).toBe('number');
        const q = retrieveProperty(testValidator, a, 'q', schema);
        const option = schemaOf(q.anyOf?.[0]);
        expect(retrieveSchema({ validator: testValidator }, option, schema).title).toBe('A t');
        const rendered = getRenderedOptionSchema(q, option);
        expect(retrieveSchema({ validator: testValidator }, rendered, schema).title).toBe('A t');
      });
      it("resolves the same #/ $ref text in two resources to each one's own definition", () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            node: { type: 'object', properties: { l: { $ref: 'lib.json' } } },
            lib: { $id: 'lib.json', $defs: { node: { type: 'number', default: 7 } }, $ref: '#/$defs/node' },
          },
          $ref: '#/$defs/node',
        };
        const root = retrieveSchema({ validator: testValidator }, schema, schema);
        expect(retrieveProperty(testValidator, root, 'l', schema)).toEqual(
          expect.objectContaining({ type: 'number', default: 7 }),
        );
      });
      it('keeps an $id under a keyword that holds no subschemas from moving the base of a $ref beside it (#5529)', () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: { real: { $id: 'n.json', type: 'boolean' }, s: { type: 'string' } },
          components: { Pet: { type: 'object', properties: { n: { $id: 'n.json', $ref: '#/$defs/s' } } } },
          properties: { pet: { $ref: '#/components/Pet' } },
        };
        const pet = retrieveProperty(testValidator, schema, 'pet', schema);
        expect(retrieveProperty(testValidator, pet, 'n', schema).type).toBe('string');
      });
    });
    describe('retrieveSchema() with resolveAnyOfOrOneOfRefs', () => {
      it('resolves simple ref with no anyOf or oneOfs when false', () => {
        const priceSchema: RJSFSchema = SUPER_SCHEMA.properties?.price as RJSFSchema;
        expect(retrieveSchema({ validator: testValidator }, priceSchema, SUPER_SCHEMA, {})).toEqual({
          ...(SUPER_SCHEMA.definitions?.price as RJSFSchema),
          [RJSF_REF_KEY]: '#/definitions/price',
        });
      });
      it('resolves simple ref with no anyOf or oneOfs when true', () => {
        const priceSchema: RJSFSchema = SUPER_SCHEMA.properties?.price as RJSFSchema;
        expect(retrieveSchema({ validator: testValidator }, priceSchema, SUPER_SCHEMA, {}, true)).toEqual({
          ...(SUPER_SCHEMA.definitions?.price as RJSFSchema),
          [RJSF_REF_KEY]: '#/definitions/price',
        });
      });
      it('does not resolves the references inside of anyOfs when false', () => {
        const anyOfSchema: RJSFSchema = SUPER_SCHEMA.properties?.multi as RJSFSchema;
        expect(retrieveSchema({ validator: testValidator }, anyOfSchema, SUPER_SCHEMA, {})).toEqual(anyOfSchema);
      });
      it('resolves the references inside of anyOfs when true', () => {
        const anyOfSchema: RJSFSchema = SUPER_SCHEMA.properties?.multi as RJSFSchema;
        expect(retrieveSchema({ validator: testValidator }, anyOfSchema, SUPER_SCHEMA, {}, true)).toEqual({
          ...anyOfSchema,
          anyOf: [
            {
              ...(SUPER_SCHEMA.definitions?.foo as RJSFSchema),
              [RJSF_REF_KEY]: '#/definitions/foo',
            },
          ],
        });
      });
      it('does not resolves the references inside of oneOfs when false', () => {
        const oneOfSchema: RJSFSchema = SUPER_SCHEMA.properties?.single as RJSFSchema;
        expect(retrieveSchema({ validator: testValidator }, oneOfSchema, SUPER_SCHEMA, {}, false)).toEqual(oneOfSchema);
      });
      it('resolves the references inside of oneOfs when true', () => {
        const oneOfSchema: RJSFSchema = SUPER_SCHEMA.properties?.single as RJSFSchema;
        expect(retrieveSchema({ validator: testValidator }, oneOfSchema, SUPER_SCHEMA, {}, true)).toEqual({
          ...oneOfSchema,
          oneOf: [
            {
              ...(SUPER_SCHEMA.definitions?.choice1 as RJSFSchema),
              [RJSF_REF_KEY]: '#/definitions/choice1',
            },
            {
              ...(SUPER_SCHEMA.definitions?.choice2 as RJSFSchema),
              [RJSF_REF_KEY]: '#/definitions/choice2',
            },
          ],
        });
      });
      it('keeps the materialized schema linear on a DAG of shared anyOf refs', () => {
        const definitions: Record<string, RJSFSchema> = {};
        for (let i = 0; i < 14; i++) {
          definitions[`L${i}`] = {
            type: 'array',
            items: { anyOf: [{ $ref: `#/definitions/L${i + 1}` }, { $ref: `#/definitions/L${i + 1}` }] },
          };
        }
        definitions.L14 = { type: 'string' };
        const rootSchema: RJSFSchema = { type: 'object', definitions };
        const result = retrieveSchema({ validator: testValidator }, { $ref: '#/definitions/L0' }, rootSchema, {}, true);
        // Expanding both identical options per level would produce ~2^14 copies of the leaf.
        expect(JSON.stringify(result).length).toBeLessThan(20000);
      });
    });
  });
}
