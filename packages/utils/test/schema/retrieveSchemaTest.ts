import type { MockInstance } from 'vitest';

import type { RJSFSchema } from '../../src/index.ts';
import {
  ADDITIONAL_PROPERTY_FLAG,
  GUESSED_TYPE_FLAG,
  createSchemaUtils,
  getByPath,
  isObject,
  PROPERTIES_KEY,
  retrieveSchema,
  RJSF_REF_CYCLE_KEY,
  RJSF_REF_KEY,
  noop,
} from '../../src/index.ts';
import {
  getAllPermutationsOfXxxOf,
  getMatchingPatternProperties,
  getPatternPropertySchema,
  relaxOptionsForScoring,
  resolveAllReferences,
  resolveAnyOrOneOfSchemas,
  resolveCondition,
  resolveSchema,
  retrieveSchemaInternal,
  stubExistingAdditionalProperties,
  withDependentProperties,
  withExactlyOneSubschema,
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

export default function retrieveSchemaTest(testValidator: TestValidatorType) {
  describe('getMatchingPatternProperties()', () => {
    it('returns an empty object when the schema has no patternProperties', () => {
      expect(getMatchingPatternProperties({ type: 'object' }, 'key')).toEqual({});
    });
  });
  describe('getPatternPropertySchema()', () => {
    it('returns undefined when no pattern matches the key', () => {
      expect(
        getPatternPropertySchema({ type: 'object', patternProperties: { '^a': { type: 'string' } } }, 'xyz'),
      ).toBeUndefined();
    });
    it('returns an allOf of every matching pattern subschema', () => {
      const schema: RJSFSchema = {
        type: 'object',
        patternProperties: { '^a': { type: 'string' }, c$: { minLength: 2 } },
      };
      expect(getPatternPropertySchema(schema, 'abc')).toEqual({
        allOf: [{ type: 'string' }, { minLength: 2 }],
      });
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
          type: 'string',
        },
        {
          type: 'number',
        },
      ];
      const schema: RJSFSchema = {
        additionalProperties: {
          oneOf,
        },
        type: 'object',
      };

      const formData = { newKey: {} };
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
      expect(retrieveSchema({ validator: testValidator }, schema, {}, formData)).toEqual({
        ...schema,
        properties: {
          newKey: {
            type: 'object',
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
    it('should `resolve` refs inside of a properties key', () => {
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
      expect(retrieveSchema({ validator: testValidator }, schema, rootSchema)).toEqual({
        type: 'object',
        properties: {
          entity: {
            ...entity,
            [RJSF_REF_KEY]: '#/definitions/entity',
          },
        },
      });
    });
    it('should `resolve` refs inside of an items key', () => {
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
      expect(retrieveSchema({ validator: testValidator }, schema, rootSchema)).toEqual({
        type: 'array',
        items: {
          ...entity,
          [RJSF_REF_KEY]: '#/definitions/entity',
        },
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
            expect(result.properties!.host).toEqual({
              type: 'string',
              title: 'Host',
              [RJSF_REF_KEY]: '#/definitions/host',
            });
          });
          const hostResolved = { type: 'string', title: 'Host', [RJSF_REF_KEY]: '#/definitions/host' };
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
            expect(result.properties!.h).toEqual(hostResolved);
            expect(result.properties!.w).toEqual(hostResolved);
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
            expect(result.properties!.h).toEqual(hostResolved);
            expect(result.properties!.z).toEqual(hostResolved);
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
            expect(result.properties!.x).toEqual(hostResolved);
            expect(result.properties!.y).toEqual(hostResolved);
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
            expect(result.properties!.x).toEqual(hostResolved);
            expect(result.properties!.y).toEqual(hostResolved);
          });
          it('does not flag a $ref shared by several oneOf branches when expanding all branches', () => {
            testValidator.setReturnValues({ isValid: [true, true] });
            const schema: RJSFSchema = {
              type: 'object',
              definitions: {
                host: { type: 'string', title: 'Host' },
                sftp: { properties: { protocol: { enum: ['SFTP'] }, host: { $ref: '#/definitions/host' } } },
                ftps: { properties: { protocol: { enum: ['FTPS'] }, host: { $ref: '#/definitions/host' } } },
              },
              properties: { protocol: { type: 'string', enum: ['SFTP', 'FTPS'] } },
              dependencies: {
                protocol: { oneOf: [{ $ref: '#/definitions/sftp' }, { $ref: '#/definitions/ftps' }] },
              },
            };
            const results = retrieveSchemaInternal(
              { validator: testValidator },
              schema,
              schema,
              { protocol: 'FTPS' },
              true,
            );
            // Expanding every branch also returns the schema with the `protocol` dependency unapplied, which is what
            // a form renders until the user picks a protocol. The shared `$ref` has to resolve in both branches
            expect(results).toHaveLength(3);
            results.slice(0, 2).forEach((result) => expect(result.properties!.host).toEqual(hostResolved));
            expect(results[2].properties).not.toHaveProperty('host');
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
              properties: {
                tree: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
                  },
                  [RJSF_REF_KEY]: '#/definitions/node',
                },
              },
              required: ['tree'],
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
            expect(result.properties!.tree).toEqual(expectedNode);
            expect(result.properties!.extra).toEqual(expectedNode);
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
            expect(result.properties!.tree).toEqual(expectedNode);
            expect(result.properties!.extra).toEqual(expectedNode);
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
            expect(result.properties!.children).toEqual({
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
                },
                [RJSF_REF_KEY]: '#/definitions/node',
              },
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
            expect(result.properties!.tree).toEqual({
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
            expect(result.properties!.a).toEqual({
              type: 'string',
              title: 'Primary',
              enum: ['x', 'y'],
              [RJSF_REF_KEY]: '#/definitions/s',
            });
            expect(result.properties!.b).toEqual({
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
            expect(result.properties!.a).toEqual({
              type: 'object',
              properties: {
                child: {
                  type: 'object',
                  properties: { child: { $ref: '#/definitions/A', [RJSF_REF_CYCLE_KEY]: true } },
                  [RJSF_REF_KEY]: '#/definitions/B',
                },
              },
              [RJSF_REF_KEY]: '#/definitions/A',
            });
            expect(result.properties!.b).toEqual({
              type: 'object',
              properties: {
                child: {
                  type: 'object',
                  properties: { child: { $ref: '#/definitions/B', [RJSF_REF_CYCLE_KEY]: true } },
                  [RJSF_REF_KEY]: '#/definitions/A',
                },
              },
              [RJSF_REF_KEY]: '#/definitions/B',
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
            expect(result.properties!.n).toEqual({
              type: 'object',
              properties: {
                name: { type: 'string' },
                child: { $ref: '#/definitions/node', [RJSF_REF_CYCLE_KEY]: true },
              },
              [RJSF_REF_KEY]: '#/definitions/node',
            });
          });
          it('expands all branches of a conditional reached through a $ref follow-up pass', () => {
            testValidator.setReturnValues({ isValid: [true] });
            const rootSchema: RJSFSchema = {
              definitions: {
                cond: {
                  type: 'object',
                  properties: { k: { type: 'string' } },
                  if: { properties: { k: { const: 'x' } } },
                  then: { properties: { t: { type: 'string' } } },
                  else: { properties: { e: { type: 'string' } } },
                },
              },
            };
            // Expanding the $ref changes the schema, so the conditional is resolved on a follow-up fixpoint
            // pass; both branches then resolve with the branch-local counter already past the first pass.
            const results = retrieveSchemaInternal(
              { validator: testValidator },
              { $ref: '#/definitions/cond' },
              rootSchema,
              { k: 'x' },
              true,
            );
            expect(results).toHaveLength(2);
            expect(results[0].properties!.t).toEqual({ type: 'string' });
            expect(results[1].properties!.e).toEqual({ type: 'string' });
          });
          // Nesting depth doesn't count as passes, so no finite schema reaches the backstop through the public
          // retrieveSchema path; it fires only when passCount is injected directly, as below, or if a regression
          // breaks structural termination.
          it('returns the schema resolved so far, flagged as a cycle, when the pass-count backstop is exceeded', () => {
            const schema: RJSFSchema = { definitions: { x: { type: 'string' } }, $ref: '#/definitions/x' };
            const [result] = retrieveSchemaInternal(
              { validator: testValidator },
              schema,
              schema,
              {},
              false,
              [],
              undefined,
              undefined,
              101,
            );
            expect(result).toEqual({ ...schema, [RJSF_REF_CYCLE_KEY]: true });
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
            expect(result).toEqual({ $ref: '#/definitions/a' });
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
              $ref: '#/definitions/a',
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
            expect(result).toEqual({ $ref: '#/definitions/a' });
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
              $ref: '#/definitions/node',
              [RJSF_REF_KEY]: '#/definitions/node',
            });
          });
          it('collapses a dependent property that points back at its enclosing definition', () => {
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
              properties: { k: { type: 'string' }, child: { $ref: '#/definitions/node' } },
              [RJSF_REF_KEY]: '#/definitions/node',
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
            expect(result).toEqual({
              type: 'object',
              properties: { petType: { type: 'string' }, hunts: { type: 'boolean' } },
              $ref: '#/definitions/Pet',
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
            expect(result.properties!.h).toEqual(hostResolved);
            expect(result.properties!.w).toEqual(hostResolved);
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
            expect(result.properties!.w).toEqual({
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
            expect(result.properties!.w).toEqual({
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
      });
    });
    describe('allOf', () => {
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
      it('should merge the allOf when expanding all branches, as a form does', () => {
        const schema: RJSFSchema = {
          properties: { test: { type: 'string' } },
          allOf: [{ minLength: 2 }, { maxLength: 5 }],
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {};
        expect(retrieveSchemaInternal({ validator: testValidator }, schema, rootSchema, formData, true)).toEqual([
          { properties: { test: { type: 'string' } }, minLength: 2, maxLength: 5 },
        ]);
      });
      it('should expand the branches of a property merged with the patternProperties that match it', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            p: {
              type: 'object',
              properties: { t: { type: 'string' } },
              if: { properties: { t: { const: 'yes' } } },
              then: { properties: { c: { type: 'number' } } },
              else: { properties: { c: { type: 'boolean' } } },
            },
          },
          patternProperties: { '^p$': { properties: { extra: { type: 'string' } } } },
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const properties = ({ properties: expanded }: RJSFSchema) => isObject(expanded?.p) && expanded.p.properties;
        // Merging `p` with its matching pattern resolves it, so the branches of that resolution are expanded too
        expect(
          retrieveSchemaInternal({ validator: testValidator }, schema, rootSchema, undefined, true).map(properties),
        ).toEqual([
          { t: { type: 'string' }, extra: { type: 'string' }, c: { type: 'number' } },
          { t: { type: 'string' }, extra: { type: 'string' }, c: { type: 'boolean' } },
        ]);
      });
      it('should ignore a dependency oneOf that qualifies no option when expanding all branches', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' }, b: { type: 'string' } },
          dependencies: { a: { oneOf: [{ required: ['b'] }] } },
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        // No option names `a`, so expanding qualifies none of them and the `oneOf` is ignored, as it is when the form
        // data picks no single valid one
        expect(retrieveSchemaInternal({ validator: testValidator }, schema, rootSchema, undefined, true)).toEqual([
          { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } },
        ]);
      });
      it('should vary the branches of pattern-matched properties one at a time, not in every combination', () => {
        const conditional: RJSFSchema = {
          type: 'object',
          if: { properties: { a: { const: 'x' } } },
          then: { properties: { c: { type: 'number' } } },
          else: { properties: { c: { type: 'boolean' } } },
        };
        const schema: RJSFSchema = {
          type: 'object',
          properties: { p0: { type: 'object' }, p1: { type: 'object' }, p2: { type: 'object' } },
          patternProperties: { '^p': conditional },
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        // Each property contributes its own extra branch rather than multiplying the ones before it, so three
        // two-branch properties make `1 + 3` variants and not `2 ** 3`
        expect(retrieveSchemaInternal({ validator: testValidator }, schema, rootSchema, undefined, true)).toHaveLength(
          4,
        );
      });
      it('should drop an allOf it cannot merge when expanding all branches, as a form does', () => {
        const schema: RJSFSchema = {
          properties: { test: { type: 'string' } },
          allOf: [{ type: 'string' }, { type: 'boolean' }],
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = {};
        const { allOf, ...restOfSchema } = schema;
        expect(retrieveSchemaInternal({ validator: testValidator }, schema, rootSchema, formData, true)).toEqual([
          restOfSchema,
        ]);
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
    describe('withDependentProperties()', () => {
      it('returns the schema when additionally required is falsey', () => {
        const schema: RJSFSchema = { type: 'string' };
        expect(withDependentProperties(schema)).toEqual(schema);
      });
    });
    describe('withExactlyOneSubschema()', () => {
      it('Handle conditions with falsy subschema, subschema.properties, or condition schema', () => {
        const schema: RJSFSchema = {
          type: 'integer',
        };
        const oneOf: RJSFSchema['oneOf'] = [
          true,
          { properties: undefined },
          { properties: { foo: { type: 'string' } } },
        ];
        expect(withExactlyOneSubschema({ validator: testValidator }, schema, schema, 'bar', oneOf, false, [])).toEqual([
          schema,
        ]);
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
        // `resolveAllReferences()` merges every property's resolved references into the list it was given, so by the
        // time `aa` is merged with its pattern that list holds the one `other` resolved. Seeding the merge with it
        // would read `aa`'s pattern as a cycle and hand the renderer a literal `$ref` in place of its constraint
        expect(retrieveSchema({ validator: testValidator }, schema, rootSchema, {}).properties).toEqual({
          aa: { type: 'string', maxLength: 7, [RJSF_REF_KEY]: '#/definitions/text' },
          other: { maxLength: 7, [RJSF_REF_KEY]: '#/definitions/constrained' },
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
        const b = retrieveSchema({ validator: testValidator }, root.properties!.b as RJSFSchema, rootSchema, {});
        // `resolveAllReferences()` has flagged the key as a `$ref` cycle, since the path it was reached by holds the
        // reference it names, and the key carries that flag on through the expansion of it. That is not the merge
        // this schema's own recursive key leaves undone, so the pattern applies here as it does to any other key
        expect(b.properties!.a).toEqual(
          expect.objectContaining({ title: 'Pattern', properties: expect.objectContaining({ b: expect.anything() }) }),
        );
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
        // The subschemas still constrain the property, so it is not marked as guessed, but an `allOf` naming another
        // type than the data cannot be merged with the guessed one, so neither is copied into the stub
        expect(stubExistingAdditionalProperties({ validator: testValidator }, schema, undefined, formData)).toEqual({
          ...schema,
          properties: {
            foo: { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true },
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
    });
    describe('getAllPermutationsOfXxxOf()', () => {
      it('returns a single permutation when there are only one version of each row', () => {
        const oneOfs: RJSFSchema[][] = [
          [{ title: 'A', type: 'string' }],
          [{ title: 'B', type: 'number' }],
          [{ title: 'C', type: 'boolean' }],
        ];
        expect(getAllPermutationsOfXxxOf(oneOfs)).toEqual([
          [
            { title: 'A', type: 'string' },
            { title: 'B', type: 'number' },
            { title: 'C', type: 'boolean' },
          ],
        ]);
      });
      it('returns 2 permutations when there are 2 versions in one row and one in another', () => {
        const oneOfs: RJSFSchema[][] = [
          [{ title: 'A', type: 'string' }],
          [
            { title: 'B1', type: 'number' },
            { title: 'B2', type: 'boolean' },
          ],
        ];
        expect(getAllPermutationsOfXxxOf(oneOfs)).toEqual([
          [
            { title: 'A', type: 'string' },
            { title: 'B1', type: 'number' },
          ],
          [
            { title: 'A', type: 'string' },
            { title: 'B2', type: 'boolean' },
          ],
        ]);
      });
      it('returns 6 permutations when there are 3 in row 1, 2 in row 2 and one in row 3', () => {
        const oneOfs: RJSFSchema[][] = [
          [{ title: 'A', type: 'string' }],
          [
            { title: 'B1', type: 'number' },
            { title: 'B2', type: 'boolean' },
          ],
          [
            { title: 'C1', type: 'string' },
            { title: 'C2', type: 'number' },
            { title: 'C3', type: 'boolean' },
          ],
        ];
        expect(getAllPermutationsOfXxxOf(oneOfs)).toEqual([
          [
            { title: 'A', type: 'string' },
            { title: 'B1', type: 'number' },
            { title: 'C1', type: 'string' },
          ],
          [
            { title: 'A', type: 'string' },
            { title: 'B2', type: 'boolean' },
            { title: 'C1', type: 'string' },
          ],
          [
            { title: 'A', type: 'string' },
            { title: 'B1', type: 'number' },
            { title: 'C2', type: 'number' },
          ],
          [
            { title: 'A', type: 'string' },
            { title: 'B2', type: 'boolean' },
            { title: 'C2', type: 'number' },
          ],
          [
            { title: 'A', type: 'string' },
            { title: 'B1', type: 'number' },
            { title: 'C3', type: 'boolean' },
          ],
          [
            { title: 'A', type: 'string' },
            { title: 'B2', type: 'boolean' },
            { title: 'C3', type: 'boolean' },
          ],
        ]);
      });
    });
    it('resolveAllReferences() resolves the references of a oneOf beside an empty anyOf', () => {
      const schema: RJSFSchema = {
        definitions: { name: { type: 'string' } },
        anyOf: [],
        oneOf: [{ $ref: '#/definitions/name' }],
      };
      expect(resolveAllReferences(schema, schema, [], undefined, true).oneOf).toEqual([
        { type: 'string', [RJSF_REF_KEY]: '#/definitions/name' },
      ]);
    });
    it('resolveAllReferences() resolves the references of a oneOf a $ref brings beside an empty anyOf', () => {
      const schema: RJSFSchema = {
        definitions: { name: { type: 'string' }, named: { oneOf: [{ $ref: '#/definitions/name' }] } },
        $ref: '#/definitions/named',
        anyOf: [],
      };
      expect(resolveAllReferences(schema, schema, [], undefined, true).oneOf).toEqual([
        { type: 'string', [RJSF_REF_KEY]: '#/definitions/name' },
      ]);
    });
    describe('resolveAnyOrOneOfSchemas()', () => {
      it('resolves anyOf with $ref for single element, merging schemas', () => {
        const anyOfSchema: RJSFSchema = SUPER_SCHEMA.properties?.multi as RJSFSchema;
        expect(resolveAnyOrOneOfSchemas({ validator: testValidator }, anyOfSchema, SUPER_SCHEMA, false, [])).toEqual([
          {
            ...(SUPER_SCHEMA.definitions?.foo as RJSFSchema),
            title: 'multi',
            [RJSF_REF_KEY]: '#/definitions/foo',
          },
        ]);
      });
      it('resolves the anyOf of a schema that also has a oneOf, dropping both when not expanding every branch', () => {
        const schema: RJSFSchema = { title: 'both', anyOf: [{ type: 'string' }], oneOf: [{ type: 'number' }] };
        expect(resolveAnyOrOneOfSchemas({ validator: testValidator }, schema, schema, false)).toEqual([
          { title: 'both', type: 'string' },
        ]);
      });
      it.each([false, true])(
        'resolves an empty anyOf to the schema without it, expanding every branch: %s',
        (expand) => {
          const schema: RJSFSchema = { type: 'string', title: 'empty', anyOf: [] };
          expect(resolveAnyOrOneOfSchemas({ validator: testValidator }, schema, schema, expand)).toEqual([
            { type: 'string', title: 'empty' },
          ]);
        },
      );
      it('retrieves a schema with dependencies beside an empty anyOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          anyOf: [],
          properties: { a: { type: 'string' } },
          dependencies: { a: { properties: { b: { type: 'number' } } } },
        };
        expect(retrieveSchema({ validator: testValidator }, schema, schema, { a: 'x' })).toEqual({
          type: 'object',
          properties: { a: { type: 'string' }, b: { type: 'number' } },
        });
      });
      it('resolves the anyOf of a schema that also has a oneOf, keeping the oneOf to resolve next', () => {
        const schema: RJSFSchema = { title: 'both', anyOf: [{ type: 'string' }], oneOf: [{ type: 'number' }] };
        expect(resolveAnyOrOneOfSchemas({ validator: testValidator }, schema, schema, true)).toEqual([
          { title: 'both', type: 'string', oneOf: [{ type: 'number' }] },
        ]);
      });
      it('resolves oneOf with $ref for expandedAll elements, merging schemas', () => {
        const oneOfSchema: RJSFSchema = SUPER_SCHEMA.properties?.single as RJSFSchema;
        expect(resolveAnyOrOneOfSchemas({ validator: testValidator }, oneOfSchema, SUPER_SCHEMA, true, [])).toEqual([
          {
            ...(SUPER_SCHEMA.definitions?.choice1 as RJSFSchema),
            required: ['choice', 'more'],
            [RJSF_REF_KEY]: '#/definitions/choice1',
          },
          {
            ...(SUPER_SCHEMA.definitions?.choice2 as RJSFSchema),
            required: ['choice'],
            [RJSF_REF_KEY]: '#/definitions/choice2',
          },
        ]);
      });
      it('resolves oneOf with multiple $refs', () => {
        const schema: RJSFSchema = {
          oneOf: [
            {
              type: 'object',
              properties: {
                field: {
                  $ref: '#/definitions/aObject',
                },
              },
            },
            {
              type: 'array',
              items: {
                $ref: '#/definitions/bObject',
              },
            },
          ],
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            aObject: {
              properties: {
                a: { enum: ['typeA'] },
                b: { type: 'number' },
              },
            },
            bObject: {
              properties: {
                a: { enum: ['typeB'] },
                c: { type: 'boolean' },
              },
            },
          },
        };
        expect(resolveAnyOrOneOfSchemas({ validator: testValidator }, schema, rootSchema, true, [])).toEqual([
          {
            type: 'object',
            properties: {
              field: {
                properties: {
                  a: { enum: ['typeA'] },
                  b: { type: 'number' },
                },
                [RJSF_REF_KEY]: '#/definitions/aObject',
              },
            },
          },
          {
            type: 'array',
            items: {
              properties: {
                a: { enum: ['typeB'] },
                c: { type: 'boolean' },
              },
              [RJSF_REF_KEY]: '#/definitions/bObject',
            },
          },
        ]);
      });
    });
    describe('relaxOptionsForScoring()', () => {
      it('converts boolean true to an empty schema', () => {
        expect(relaxOptionsForScoring([true])).toEqual([{}]);
      });
      it('converts boolean false to a {not:{}} schema', () => {
        expect(relaxOptionsForScoring([false])).toEqual([{ not: {} }]);
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
      it('builds the relaxed form of an option once, so re-scoring it does not hash it again', () => {
        const option: RJSFSchema = {
          $id: 'strict',
          type: 'object',
          properties: { a: { type: 'string' } },
          additionalProperties: false,
        };
        // Relaxing derives an `$id`, which serializes the option, and `omitExtraData()` relaxes the options of a
        // `oneOf` on every call: the same object back is what keeps the scoring memo keyed by it hitting too
        expect(relaxOptionsForScoring([option])[0]).toBe(relaxOptionsForScoring([option])[0]);
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
    describe('resolveCondition()', () => {
      it('returns both conditions with expandAll', () => {
        expect(
          resolveCondition(
            { validator: testValidator },
            SCHEMA_WITH_SINGLE_CONDITION,
            SCHEMA_WITH_SINGLE_CONDITION,
            true,
            [],
          ),
        ).toEqual([
          {
            type: 'object',
            properties: {
              ...SCHEMA_WITH_SINGLE_CONDITION.properties,
              ...(SCHEMA_WITH_SINGLE_CONDITION.then as RJSFSchema).properties,
            },
          },
          {
            type: 'object',
            properties: {
              ...SCHEMA_WITH_SINGLE_CONDITION.properties,
              ...(SCHEMA_WITH_SINGLE_CONDITION.else as RJSFSchema).properties,
            },
          },
        ]);
      });
      it('returns neither condition with expandAll, using boolean based then/else', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            country: {
              default: 'United States of America',
              enum: ['United States of America', 'Canada'],
            },
          },
          if: {
            properties: { country: { const: 'United States of America' } },
          },
          then: false,
          else: true,
        };
        expect(resolveCondition({ validator: testValidator }, schema, schema, true, [])).toEqual([
          {
            type: 'object',
            properties: {
              ...SCHEMA_WITH_SINGLE_CONDITION.properties,
            },
          },
        ]);
      });
    });
    describe('resolveReference() with customMergeAllOf', () => {
      it('should pass customMergeAllOf parameter to retrieveSchemaInternal', () => {
        const schema: RJSFSchema = {
          $ref: '#/definitions/testRef',
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
        const customMergeAllOf = vi.fn().mockReturnValue({
          type: 'object',
          properties: {
            base: { type: 'string' },
            string: { type: 'string' },
            number: { type: 'number' },
          },
        });
        const result = retrieveSchema({ validator: testValidator, customMergeAllOf }, schema, rootSchema, {});
        expect(customMergeAllOf).toHaveBeenCalled();
        expect(result).toEqual({
          type: 'object',
          properties: {
            base: { type: 'string' },
            string: { type: 'string' },
            number: { type: 'number' },
          },
        });
      });
    });
    describe('resolveDependencies() with customMergeAllOf', () => {
      it('should pass customMergeAllOf parameter through dependency resolution', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            a: { type: 'string' },
          },
          dependencies: {
            a: {
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
            },
          },
        };
        const rootSchema: RJSFSchema = { definitions: {} };
        const formData = { a: 'test' };
        const customMergeAllOf = vi.fn().mockReturnValue({
          type: 'object',
          properties: {
            string: { type: 'string' },
            number: { type: 'number' },
          },
        });
        const result = retrieveSchema({ validator: testValidator, customMergeAllOf }, schema, rootSchema, formData);
        expect(customMergeAllOf).toHaveBeenCalled();
        expect(result).toEqual({
          type: 'object',
          properties: {
            a: { type: 'string' },
            string: { type: 'string' },
            number: { type: 'number' },
          },
        });
      });
    });
    describe('resolveSchema() integration with customMergeAllOf', () => {
      it('should properly pass customMergeAllOf through all resolution paths', () => {
        const schema: RJSFSchema = {
          $ref: '#/definitions/baseSchema',
          dependencies: {
            trigger: {
              allOf: [
                {
                  type: 'object',
                  properties: {
                    prop1: { type: 'string' },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    prop2: { type: 'number' },
                  },
                },
              ],
            },
          },
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            baseSchema: {
              type: 'object',
              properties: {
                base: { type: 'string' },
              },
              allOf: [
                {
                  type: 'object',
                  properties: {
                    additional: { type: 'boolean' },
                  },
                },
              ],
            },
          },
        };
        const formData = { trigger: 'value' };
        const customMergeAllOf = vi.fn().mockImplementation((schema: RJSFSchema) => {
          // Custom merge logic that combines all properties
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
        // Verify that customMergeAllOf was called multiple times (for different allOf blocks)
        expect(customMergeAllOf).toHaveBeenCalledTimes(3);
        expect(result).toEqual({
          type: 'object',
          properties: {
            base: { type: 'string' },
            additional: { type: 'boolean' },
          },
          allOf: undefined,
          [RJSF_REF_KEY]: '#/definitions/baseSchema',
        });
      });
      it('should handle customMergeAllOf with nested $ref resolution', () => {
        const schema: RJSFSchema = {
          $ref: '#/definitions/nestedRef',
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            nestedRef: {
              $ref: '#/definitions/finalSchema',
              allOf: [
                {
                  type: 'object',
                  properties: {
                    nested: { type: 'string' },
                  },
                },
              ],
            },
            finalSchema: {
              type: 'object',
              properties: {
                final: { type: 'number' },
              },
            },
          },
        };
        const customMergeAllOf = vi.fn().mockReturnValue({
          type: 'object',
          properties: {
            final: { type: 'number' },
            nested: { type: 'string' },
          },
        });
        const result = retrieveSchema({ validator: testValidator, customMergeAllOf }, schema, rootSchema, {});
        expect(customMergeAllOf).toHaveBeenCalled();
        expect(result).toEqual({
          type: 'object',
          properties: {
            final: { type: 'number' },
            nested: { type: 'string' },
          },
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
        // Should be called for both allOf blocks (level2 and dependency)
        expect(customMergeAllOf).toHaveBeenCalledTimes(3);
        expect(result).toEqual({
          type: 'object',
          properties: {
            base: { type: 'string' },
            additional: { type: 'number' },
          },
          allOf: undefined,
          [RJSF_REF_KEY]: '#/definitions/level1',
        });
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
      it('resolves a shared $ref in the first anyOf option using it and keeps it as a ref in later options', () => {
        // An option that reuses a ref an earlier option already expanded keeps the plain `$ref`, matching the
        // behavior before the path-scoped cycle fix. Materializing the ref in every option makes the result grow
        // exponentially on DAGs of shared refs; the chosen branch is resolved again when it renders, so the field
        // still expands in the form.
        const host: RJSFSchema = { type: 'string', title: 'Host' };
        const schema: RJSFSchema = {
          definitions: { host },
          anyOf: [
            { properties: { x: { $ref: '#/definitions/host' } } },
            { properties: { y: { $ref: '#/definitions/host' } } },
          ],
        };
        const hostResolved = { type: 'string', title: 'Host', [RJSF_REF_KEY]: '#/definitions/host' };
        const [result] = retrieveSchemaInternal({ validator: testValidator }, schema, schema, {}, false, [], true);
        expect(result.anyOf).toEqual([
          { properties: { x: hostResolved } },
          { properties: { y: { $ref: '#/definitions/host' } } },
        ]);
      });
      it('still expands a $ref in a sibling subtree that an earlier anyOf option already expanded', () => {
        const definitions: Record<string, RJSFSchema> = {
          X: { type: 'object', properties: { name: { type: 'string' } } },
          Y: { type: 'object', properties: { x: { $ref: '#/definitions/X' } } },
        };
        const schema: RJSFSchema = {
          definitions,
          type: 'object',
          properties: {
            u: { anyOf: [{ $ref: '#/definitions/X' }, { $ref: '#/definitions/Y' }] },
            w: { $ref: '#/definitions/Y' },
          },
        };
        const xMaterialized = {
          type: 'object',
          properties: { name: { type: 'string' } },
          [RJSF_REF_KEY]: '#/definitions/X',
        };
        const [result] = retrieveSchemaInternal({ validator: testValidator }, schema, schema, {}, false, [], true);
        expect((result.properties!.u as RJSFSchema).anyOf).toEqual([
          xMaterialized,
          {
            type: 'object',
            properties: { x: { $ref: '#/definitions/X' } },
            [RJSF_REF_KEY]: '#/definitions/Y',
          },
        ]);
        expect(result.properties!.w).toEqual({
          type: 'object',
          properties: { x: xMaterialized },
          [RJSF_REF_KEY]: '#/definitions/Y',
        });
      });
      it('resolves references without the optional expandedRefs argument', () => {
        const host: RJSFSchema = { type: 'string', title: 'Host' };
        const rootSchema: RJSFSchema = {
          definitions: { host },
          anyOf: [
            { properties: { x: { $ref: '#/definitions/host' } } },
            { properties: { y: { $ref: '#/definitions/host' } } },
          ],
        };
        // Without the walk-local expandedRefs list there is nothing to collapse later options against, so both expand.
        const result = resolveAllReferences(rootSchema, rootSchema, [], undefined, true);
        expect(result.anyOf).toEqual([
          { properties: { x: { type: 'string', title: 'Host', [RJSF_REF_KEY]: '#/definitions/host' } } },
          { properties: { y: { type: 'string', title: 'Host', [RJSF_REF_KEY]: '#/definitions/host' } } },
        ]);
      });
      it('resolveSchema resolves a top-level $ref with only the required arguments', () => {
        const host: RJSFSchema = { type: 'string', title: 'Host' };
        const schema: RJSFSchema = { $ref: '#/definitions/host' };
        const rootSchema: RJSFSchema = { definitions: { host } };
        const [result] = resolveSchema({ validator: testValidator }, schema, rootSchema, false, []);
        expect(result).toEqual({ type: 'string', title: 'Host', [RJSF_REF_KEY]: '#/definitions/host' });
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
        const [result] = retrieveSchemaInternal(
          { validator: testValidator },
          { $ref: '#/definitions/L0' },
          rootSchema,
          {},
          false,
          [],
          true,
        );
        // Expanding both identical options per level would produce ~2^14 copies of the leaf.
        expect(JSON.stringify(result).length).toBeLessThan(20000);
      });
    });
  });
}
