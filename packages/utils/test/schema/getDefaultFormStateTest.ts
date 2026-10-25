import { createDeepAllOfMerge } from '@x0k/json-schema-merge';
import type { MockInstance } from 'vitest';

import type {
  CustomMergeAllOf,
  DefaultFormStateBehavior,
  FormFieldState,
  GenericObjectType,
  RJSFSchema,
  UiSchema,
} from '../../src/index.ts';
import { createSchemaUtils, fieldPathFromList, getDefaultFormState, isObject, noop } from '../../src/index.ts';
import {
  AdditionalItemsHandling,
  computeDefaultBasedOnSchemaTypeAndDefaults,
  computeDefaults,
  getArrayDefaults,
  getDefaultBasedOnSchemaType,
  getInnerSchemaForArrayItem,
  getObjectDefaults,
  ensureFormDataMatchingSchema,
} from '../../src/schema/getDefaultFormState.ts';
import shallowAllOfMerge from '../../src/schema/shallowAllOfMerge.ts';
import {
  PET_RESOURCE_DEEP_SCHEMA,
  PET_RESOURCE_SCHEMA,
  RECURSIVE_REF,
  RECURSIVE_REF_ALLOF,
} from '../testUtils/testData.ts';
import type { TestValidatorType } from './types.ts';

const ENUM_WITH_DEFAULT: RJSFSchema = { type: 'string', enum: ['x', 'y'], default: 'x' };

/** Runs the `getDefaultFormState()` suite against `testValidator`
 *
 * @param testValidator - The validator the suite runs against
 * @param [readsTupleItems=true] - Whether the validator's dialect reads an array-valued `items` as a tuple, which
 *        Ajv's 2020-12 class rejects: a condition the form validates by its place in such a root is then checked
 *        against a root that validator cannot compile, and fails as validating the whole root does
 */
export default function getDefaultFormStateTest(testValidator: TestValidatorType, readsTupleItems = true) {
  describe('getDefaultFormState()', () => {
    let consoleWarnSpy: MockInstance;
    beforeAll(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop); // mock this to avoid actually warning in the tests
    });
    afterAll(() => {
      consoleWarnSpy.mockRestore();
    });
    // A fresh spy on a view of `testValidator`, since `vi.spyOn()` on the utils mock's own `vi.fn()` would count the
    // calls of earlier tests and reset its implementation on restore
    function withIsValidSpy() {
      const isValid = vi.fn<TestValidatorType['isValid']>((...args) => testValidator.isValid(...args));
      const validator: TestValidatorType = Object.assign(Object.create(testValidator) as TestValidatorType, {
        isValid,
      });
      return { validator, isValid };
    }
    describe('an object naming no additionalProperties', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' } },
        default: { a: 'x', extra: 'y' },
      };
      it('seeds the extra keys of its default where the context allows them', () => {
        const allowing = createSchemaUtils(
          { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' },
          schema,
        );
        expect(allowing.getDefaultFormState(schema)).toEqual({ a: 'x', extra: 'y' });
      });
      it('seeds none of them where the context forbids them', () => {
        expect(createSchemaUtils({ validator: testValidator }, schema).getDefaultFormState(schema)).toEqual({ a: 'x' });
      });
      it('fills the defaults of an option beside dependencies whose properties name nothing only where it forbids extra keys', () => {
        const dependent: RJSFSchema = {
          type: 'object',
          properties: { kind: { type: 'string' } },
          dependencies: { kind: ['kind'] },
          oneOf: [
            { properties: {} },
            { properties: { b: { type: 'string' }, c: { type: 'string', default: 'filled' } } },
          ],
        };
        const forbidding = createSchemaUtils({ validator: testValidator }, dependent);
        const allowing = createSchemaUtils(
          { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' },
          dependent,
        );
        expect(forbidding.getDefaultFormState(dependent, { b: 'x' })).toEqual({ b: 'x', c: 'filled' });
        expect(allowing.getDefaultFormState(dependent, { b: 'x' })).toEqual({ b: 'x' });
        expect(forbidding.getDefaultFormState(dependent, { b: 'x' })).toEqual({ b: 'x', c: 'filled' });
      });
    });
    describe('an explicitly undefined property schema', () => {
      // A JS-authored schema can conditionally omit a property with `{ properties: { foo: cond ? {...} : undefined } }`
      const schema = {
        type: 'object',
        properties: { foo: undefined, bar: { type: 'string' } },
      } as unknown as RJSFSchema;

      test('getObjectDefaults treats it as an empty schema', () => {
        expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({});
      });

      test('ensureFormDataMatchingSchema treats it as an empty schema', () => {
        const allOfSchema = {
          allOf: [schema],
          type: 'object',
          properties: { foo: undefined },
        } as unknown as RJSFSchema;
        expect(
          ensureFormDataMatchingSchema(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            allOfSchema,
            allOfSchema,
            { foo: 'a value' },
          ),
        ).toEqual({ foo: 'a value' });
      });
    });

    it('throws error when schema is not an object', () => {
      expect(() =>
        getDefaultFormState({ validator: testValidator }, { schema: null as unknown as RJSFSchema }),
      ).toThrow('Invalid schema:');
    });

    describe('object schemas', () => {
      describe('schema with a ref', () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: 'number',
              default: 42,
            },
            testdef: {
              type: 'object',
              properties: {
                foo: {
                  $ref: '#/definitions/foo',
                },
              },
            },
          },
          $ref: '#/definitions/testdef',
        };
        const expected = {
          foo: 42,
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema }, expected),
          ).toBe(undefined);
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema }, expected)).toEqual({});
        });
      });

      describe('schema with anyOf containing $ref AND default should preserve existing formData', () => {
        // This test verifies the fix for a bug where anyOf schemas with $ref AND default
        // would incorrectly override existing formData with the default value.
        // The bug occurs when:
        // 1. anyOf with default gets merged with the matched $ref option
        // 2. parentDefaults accumulates during recursion
        // 3. The "merge defaults" branch catches anyOf/$ref schemas
        const schema: RJSFSchema = {
          $defs: {
            Inner: {
              type: 'object',
              properties: {
                str: { type: 'string', default: 'default_str' },
                extra: { type: 'object', default: { key: 'value' } },
              },
            },
            Wrapper: {
              type: 'object',
              properties: {
                inner: {
                  $ref: '#/$defs/Inner',
                  default: { str: 'default_str', extra: { key: 'value' } },
                },
              },
            },
          },
          type: 'object',
          properties: {
            outer: {
              anyOf: [{ $ref: '#/$defs/Wrapper' }],
              default: { inner: { str: 'default_str', extra: { key: 'value' } } },
            },
          },
        };

        test('getDefaultFormState should preserve existing formData when anyOf has $ref and default', () => {
          const existingFormData = {
            outer: {
              inner: {
                str: 'user_value', // User's change - should be preserved
                extra: { key: 'value' },
              },
            },
          };

          const result = getDefaultFormState(
            { validator: testValidator },
            { schema, formData: existingFormData, rootSchema: schema },
          ) as GenericObjectType;

          // The user's value should be preserved, NOT overridden by the default
          expect(result?.outer?.inner?.str).toBe('user_value');
        });

        test('getDefaultFormState should apply defaults when formData is undefined', () => {
          const result = getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema },
          ) as GenericObjectType;

          // Defaults should be applied when no formData exists
          expect(result?.outer?.inner?.str).toBe('default_str');
        });
      });

      describe('schema with a const property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: {
              type: 'string',
              const: 'test',
            },
          },
        };
        const expected = {
          test: 'test',
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(
            expected,
          );
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        describe('constAsDefaults is never', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'never',
          };
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });
        });
      });

      describe('a property written as a $ref to a const', () => {
        const schema: RJSFSchema = {
          definitions: { K: { type: 'string', const: 'k' } },
          type: 'object',
          properties: { constInPlace: { type: 'string', const: 'k' }, constViaRef: { $ref: '#/definitions/K' } },
        };
        it.each<NonNullable<DefaultFormStateBehavior['emptyObjectFields']>>([
          'skipDefaults',
          'populateRequiredDefaults',
        ])(
          'fills the const behind the $ref as the const written in place, under emptyObjectFields %s',
          (emptyObjectFields) => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ constInPlace: 'k', constViaRef: 'k' });
          },
        );
      });

      describe('an object with an optional property that has a nested required property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const expected = {
          requiredProperty: 'foo',
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(
            expected,
          );
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });
      });

      describe('an object with an optional property that has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                  default: '',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const expected = {
          requiredProperty: 'foo',
          optionalProperty: { nestedRequiredProperty: '' },
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(
            expected,
          );
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });
      });

      describe('an object with an optional property that has a nested required property and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const includeUndefinedValues = true;
        const expected = {
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: 'foo',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });
      });

      describe("an object with an optional property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNumberProperty: {
              type: 'number',
            },
            optionalObjectProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected = {
          optionalNumberProperty: undefined,
          optionalObjectProperty: {
            nestedRequiredProperty: {},
          },
          requiredProperty: 'foo',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });
      });

      describe("an object with an null-type property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNullProperty: {
              type: 'null',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        // A `null` schema allows one value, so a missing one is that value
        const expected = {
          optionalNullProperty: null,
          requiredProperty: 'foo',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });
      });

      describe('required boolean properties default to false when no default is provided', () => {
        it('sets required boolean to false when no default is given', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean' },
            },
            required: ['agree'],
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
            agree: false,
          });
        });

        it('preserves an explicit schema default of true for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean', default: true },
            },
            required: ['agree'],
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
            agree: true,
          });
        });

        it('does not set a default for an optional boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean' },
            },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
        });

        it('preserves existing formData true for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean' },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { agree: true }, rootSchema: schema },
            ),
          ).toEqual({ agree: true });
        });

        it('preserves existing formData false for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean' },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { agree: false }, rootSchema: schema },
            ),
          ).toEqual({ agree: false });
        });

        it('sets no false for a type list resolving to boolean whose widget renders another listed type', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { agree: { type: ['null', 'boolean', 'string'] } },
            required: ['agree'],
          };
          const uiSchema: UiSchema = { agree: { 'ui:widget': 'textarea' } };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema })).toEqual(
            {},
          );
        });

        it('sets no false for a select over a type list naming boolean first among several non-null types', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { agree: { type: ['null', 'boolean', 'string'], enum: [null, true, 'a'] } },
            required: ['agree'],
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
        });

        it('sets false for a select over a nullable boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { agree: { type: ['null', 'boolean'], enum: [null, true, false] } },
            required: ['agree'],
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
            agree: false,
          });
        });

        it('sets false for a type list whose checkbox widget renders its boolean type', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { agree: { type: ['number', 'boolean'] } },
            required: ['agree'],
          };
          const uiSchema: UiSchema = { agree: { 'ui:widget': 'checkbox' } };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema })).toEqual({
            agree: false,
          });
        });
      });

      // The list resolves to its container type, but the value it holds is of another type it names, which the
      // container's defaults would be spread into or put in place of
      describe('a type list holding a value of another listed type', () => {
        it('spreads no array defaults into an object held by a list resolving to array', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              v: { type: ['null', 'array', 'object'], items: { type: 'string', default: 'q' }, minItems: 2 },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, rootSchema: schema, formData: { v: { a: 'x' } } },
            ),
          ).toEqual({ v: { a: 'x' } });
        });

        it.each<[string, RJSFSchema]>([
          ['object', { type: ['null', 'object', 'string'], properties: { a: { type: 'string', default: 'x' } } }],
          ['object', { type: ['null', 'object'], properties: { a: { type: 'string', default: 'x' } } }],
          ['array', { type: ['null', 'array', 'string'], items: { type: 'string' }, minItems: 1 }],
        ])('keeps a null held by a list resolving to %s', (_, schema) => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: null }),
          ).toBe(null);
        });

        it.each<[string, RJSFSchema]>([
          [
            'object',
            {
              type: ['null', 'object', 'string'],
              default: 'abc',
              properties: { a: { type: 'string', default: 'x' } },
            },
          ],
          ['array', { type: ['null', 'array', 'string'], default: 'abc', items: { type: 'string' }, minItems: 1 }],
        ])('keeps a default of another listed type on a list resolving to %s', (_, schema) => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toBe('abc');
        });

        it('fills in the defaults when the list holds no value yet', () => {
          const schema: RJSFSchema = {
            type: ['null', 'object', 'string'],
            properties: { a: { type: 'string', default: 'x' } },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({ a: 'x' });
        });

        it('fills in the array defaults of a list naming object behind a oneOf', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              list: { oneOf: [{ type: ['array', 'object'], items: { type: 'string', default: 'x' }, minItems: 2 }] },
            },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
            list: ['x', 'x'],
          });
        });

        it('fills in the array defaults of a list naming object with dependencies', () => {
          const schema: RJSFSchema = {
            type: ['array', 'object'],
            items: { type: 'string', default: 'x' },
            minItems: 2,
            dependencies: {},
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(['x', 'x']);
        });
      });

      describe('required boolean properties and the requiredBooleanDefault flag', () => {
        const defaultFormStateBehavior: DefaultFormStateBehavior = {
          requiredBooleanDefault: 'skip',
        };
        const requiredBooleanSchema: RJSFSchema = {
          type: 'object',
          properties: {
            agree: { type: 'boolean' },
          },
          required: ['agree'],
        };

        it('leaves a required boolean undefined when no default is given', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({});
        });

        it('leaves a required nullable boolean undefined when no default is given', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: ['boolean', 'null'] },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, rootSchema: schema, includeUndefinedValues: false },
            ),
          ).toEqual({});
        });

        it('still applies an explicit schema default for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean', default: true },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, rootSchema: schema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: true });
        });

        it('still applies a parent default for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: { agree: false },
            properties: {
              agree: { type: 'boolean' },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, rootSchema: schema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: false });
        });

        it('preserves existing formData false for a required boolean', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: requiredBooleanSchema,
                formData: { agree: false },
                rootSchema: requiredBooleanSchema,
                includeUndefinedValues: false,
              },
            ),
          ).toEqual({ agree: false });
        });

        it('populates false again when the flag is populateFalse', () => {
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: {
                  requiredBooleanDefault: 'populateFalse',
                },
              },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: false });
        });

        it('returns undefined from getDefaultBasedOnSchemaType for a required boolean when skip is set', () => {
          const schema: RJSFSchema = { type: 'boolean' };
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
              rootSchema: schema,
              required: true,
            }),
          ).toBeUndefined();
        });

        it('populates false when the flag is omitted', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: {} },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({
            agree: false,
          });
        });

        it('populates false for an unrecognized string value instead of silently skipping', () => {
          // An untyped JS consumer or a deserialized setting can hand in a value the type does not admit
          const misspelled = {
            requiredBooleanDefault: 'populatefalse',
          } as unknown as DefaultFormStateBehavior;
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: misspelled },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: false });
        });

        it('populates false for a non-string value instead of silently skipping', () => {
          const wrongType = { requiredBooleanDefault: true } as unknown as DefaultFormStateBehavior;
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: wrongType },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: false });
        });
      });

      describe('an object with an additionalProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          additionalProperties: true,
          required: ['requiredProperty'],
          default: {
            foo: 'bar',
          },
        };
        const expected = {
          requiredProperty: 'foo',
          foo: 'bar',
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema }, { foo: 'bar' }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema }, { foo: 'bar' }),
          ).toEqual(expected);
        });
      });

      describe('an object with an additionalProperties and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          additionalProperties: {
            type: 'string',
          },
          required: ['requiredProperty'],
          default: {
            foo: 'bar',
          },
        };
        const includeUndefinedValues = true;
        const expected = {
          requiredProperty: 'foo',
          foo: 'bar',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType(
              { validator: testValidator },
              schema,
              { rootSchema: schema, includeUndefinedValues },
              { foo: 'bar' },
            ),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults(
              { validator: testValidator },
              schema,
              { rootSchema: schema, includeUndefinedValues },
              { foo: 'bar' },
            ),
          ).toEqual(expected);
        });
      });

      describe('an object with additionalProperties type object with defaults and formdata', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: {
              title: 'Test',
              type: 'object',
              properties: {
                foo: {
                  type: 'string',
                },
              },
              additionalProperties: {
                type: 'object',
                properties: {
                  host: {
                    title: 'Host',
                    type: 'string',
                    default: 'localhost',
                  },
                  port: {
                    title: 'Port',
                    type: 'integer',
                    default: 389,
                  },
                },
              },
            },
          },
        };
        const rawFormData = { test: { foo: 'x', newKey: {} } };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
          ).toEqual({
            test: {
              foo: 'x',
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          });
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual({
            test: {
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          });
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
          ).toEqual({
            test: {
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          });
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual({
            test: {
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          });
        });

        describe('an object with schema-level default and renamed additionalProperties key in formData', () => {
          // Regression: when a schema has a top-level `default` that seeds additionalProperties keys,
          // renaming one of those keys in formData should NOT re-inject the stale default key.
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              options: {
                type: 'object',
                title: 'Options',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    option_name: { type: 'string', title: 'Option Name' },
                  },
                },
                default: { efs: { option_name: 'EFS' } },
              },
            },
          };

          test('getDefaultFormState does not re-inject default key when formData has a renamed key', () => {
            const rawFormData = { options: { efsKey: { option_name: 'EFS' } } };
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
            ).toEqual({
              options: { efsKey: { option_name: 'EFS' } },
            });
          });

          test('getDefaultFormState seeds default keys when options formData is empty', () => {
            const rawFormData = { options: {} };
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
            ).toEqual({
              options: { efs: { option_name: 'EFS' } },
            });
          });

          test('getDefaultFormState seeds default when options is absent from formData', () => {
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: {}, rootSchema: schema }),
            ).toEqual({
              options: { efs: { option_name: 'EFS' } },
            });
          });

          test('getObjectDefaults does not re-inject default key when formData has a renamed key', () => {
            const rawFormData = { options: { efsKey: { option_name: 'EFS' } } };
            // getObjectDefaults only computes schema defaults, not formData values, so efsKey gets {}
            // (the additionalProperties schema has no value defaults). The key point is that the stale
            // schema-level default key 'efs' is NOT present in the result.
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({ options: { efsKey: {} } });
          });
        });

        describe('an object with additionalProperties type object with formdata and no defaults', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              test: {
                title: 'Test',
                type: 'object',
                properties: {
                  foo: {
                    type: 'string',
                  },
                },
                additionalProperties: {
                  type: 'object',
                  properties: {
                    host: {
                      title: 'Host',
                      type: 'string',
                    },
                    port: {
                      title: 'Port',
                      type: 'integer',
                    },
                  },
                },
              },
            },
          };
          const rawFormData = { test: { foo: 'x', newKey: {} } };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
            ).toEqual({
              test: {
                foo: 'x',
                newKey: {},
              },
            });
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual({
              test: {
                newKey: {},
              },
            });
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({
              test: {
                newKey: {},
              },
            });
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({
              test: {
                newKey: {},
              },
            });
          });
        });

        describe('an object with additionalProperties type object with no defaults and non-object formdata', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              test: {
                title: 'Test',
                type: 'object',
                properties: {
                  foo: {
                    type: 'string',
                  },
                },
                additionalProperties: {
                  type: 'object',
                  properties: {
                    host: {
                      title: 'Host',
                      type: 'string',
                    },
                    port: {
                      title: 'Port',
                      type: 'integer',
                    },
                  },
                },
              },
            },
          };
          const rawFormData = {};
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual(
              expected,
            );
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual(expected);
          });
        });

        describe('an object with deep nested dependencies with formData', () => {
          beforeEach(() => {
            // Mock isValid so that withExactlyOneSubschema works as expected
            testValidator.setReturnValues({
              isValid: [
                true, // First oneOf... first === first
                false, // Second oneOf... second !== first
              ],
            });
          });
          afterAll(() => {
            // Reset the testValidator
            if (typeof testValidator.reset === 'function') {
              testValidator?.reset();
            }
          });

          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              nestedObject: {
                type: 'object',
                properties: {
                  first: {
                    type: 'string',
                    enum: ['no', 'yes'],
                    default: 'no',
                  },
                },
                dependencies: {
                  first: {
                    oneOf: [
                      {
                        properties: {
                          first: {
                            enum: ['yes'],
                          },
                          second: {
                            type: 'object',
                            properties: {
                              deeplyNestedThird: {
                                type: 'string',
                                enum: ['before', 'after'],
                                default: 'before',
                              },
                            },
                          },
                        },
                      },
                      {
                        properties: {
                          first: {
                            enum: ['no'],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          };
          const rawFormData = {
            nestedObject: {
              first: 'yes',
            },
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                {
                  validator: testValidator,
                  defaultFormStateBehavior: {
                    emptyObjectFields: 'populateAllDefaults',
                    allOf: 'skipDefaults',
                    arrayMinItems: {
                      populate: 'populate' as any,
                      mergeExtraDefaults: false,
                    },
                    mergeDefaultsIntoFormData: 'useFormDataIfPresent',
                  },
                },
                { schema, formData: rawFormData, rootSchema: schema, includeUndefinedValues: false },
              ),
            ).toEqual({
              nestedObject: {
                first: 'yes',
                second: {
                  deeplyNestedThird: 'before',
                },
              },
            });
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual({
              nestedObject: {
                first: 'no',
                second: {
                  deeplyNestedThird: 'before',
                },
              },
            });
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({
              nestedObject: {
                first: 'no',
                second: {
                  deeplyNestedThird: 'before',
                },
              },
            });
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({
              nestedObject: {
                first: 'no',
                second: {
                  deeplyNestedThird: 'before',
                },
              },
            });
          });
        });

        describe('handling an invalid property schema', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              invalidProperty: 'not a valid property value',
            },
          } as RJSFSchema;
          const includeUndefinedValues = 'excludeObjectChildren';
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
                rootSchema: schema,
                includeUndefinedValues,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
            ).toEqual(expected);
          });
        });

        describe('a recursive schema', () => {
          const schema = RECURSIVE_REF;
          // NOTE: defined at L410
          // const includeUndefinedValues = 'excludeObjectChildren';

          test('getDefaultFormState', () => {
            // NOTE: `includeUndefinedValues` is not used L861
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
              children: {
                name: '',
              },
              name: '',
            });
          });

          test('computeDefaults', () => {
            // NOTE: `includeUndefinedValues` is not used L1275
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({
              children: {
                name: '',
              },
              name: '',
            });
          });

          test('getDefaultBasedOnSchemaType', () => {
            // NOTE: `includeUndefinedValues` is not used L1598
            expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toBe(
              undefined,
            );
          });

          test('getObjectDefaults', () => {
            // NOTE: `includeUndefinedValues` is not used L1930
            expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({});
          });
        });

        describe('a recursive schema whose then branch refers back to it', () => {
          const node: RJSFSchema = {
            type: 'object',
            properties: { name: { type: 'string', default: 'n' } },
            if: {},
            then: { properties: { child: { $ref: '#/definitions/node' } } },
          };
          const schema: RJSFSchema = { definitions: { node }, $ref: '#/definitions/node' };

          test('getDefaultFormState stops at the recursion the branch expanded', () => {
            // The recursion is reached through the branch's expanded `$ref`, which the retrieve of the `if` leaves in
            // place for the `$ref` check to stop at
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
              name: 'n',
              child: { name: 'n' },
            });
          });
        });

        describe('a recursive schema whose anyOf option refers back to it', () => {
          const nodeWith = (c: RJSFSchema): RJSFSchema => ({
            definitions: {
              node: { type: 'object', properties: { name: { type: 'string', default: 'n' }, c } },
            },
            $ref: '#/definitions/node',
          });
          const ref: RJSFSchema = { $ref: '#/definitions/node' };
          const formData = { c: { c: { c: { c: {} } } } };

          test.each<[string, RJSFSchema]>([
            ['as an option', { anyOf: [ref, { type: 'null' }] }],
            ['as an option of an object', { type: 'object', anyOf: [ref, { properties: { z: { type: 'string' } } }] }],
            ['as a property', ref],
          ])('getDefaultFormState stops where the schema does, whatever the data holds below, %s', (_, c) => {
            const schema = nodeWith(c);
            expect(getDefaultFormState({ validator: testValidator }, { schema, formData, rootSchema: schema })).toEqual(
              {
                name: 'n',
                c: { name: 'n', c: { c: { c: {} } } },
              },
            );
          });
        });

        describe('a schema resolved from a $ref whose then branch is a $ref to a recursive definition', () => {
          const kid: RJSFSchema = {
            type: 'object',
            properties: { tag: { type: 'string', default: 't' }, kid: { $ref: '#/definitions/kid' } },
          };
          const parent: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'string' } },
            if: {},
            then: { $ref: '#/definitions/kid' },
          };
          const schema: RJSFSchema = {
            definitions: { parent, kid },
            type: 'object',
            properties: { p: { $ref: '#/definitions/parent' } },
          };

          test('getDefaultFormState fills one level of the recursion, as it does for a $ref property', () => {
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
              p: { tag: 't', kid: { tag: 't' } },
            });
          });
        });

        describe('a recursive schema whose dependencies entry refers back to it', () => {
          const node: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'string', default: 'x' } },
            dependencies: { a: { properties: { child: { $ref: '#/definitions/node' } } } },
          };
          const expected = { a: 'x', child: { a: 'x' } };

          test.each<[string, RJSFSchema, unknown]>([
            ['the root', { definitions: { node }, $ref: '#/definitions/node' }, expected],
            [
              'a property',
              { definitions: { node }, type: 'object', properties: { p: { $ref: '#/definitions/node' } } },
              { p: expected },
            ],
          ])('getDefaultFormState stops at the recursion the entry declares, from %s', (_, schema, defaults) => {
            // The default meets the dependency at every level, so the entry applies wherever the definition is reached
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(defaults);
          });
        });

        describe('a branch beside a $ref that uses the definition a second time', () => {
          const Q: RJSFSchema = { type: 'object', properties: { name: { type: 'string', default: 'd' } } };
          const friend: RJSFSchema = { properties: { friend: { $ref: '#/definitions/Q' } } };

          test.each<[string, RJSFSchema]>([
            ['an allOf entry', { allOf: [friend] }],
            ['a then branch', { if: {}, then: friend }],
            ['a dependencies entry', { dependencies: { name: friend } }],
          ])('getDefaultFormState fills in the property %s declares', (_, sibling) => {
            // The branch is not part of the definition, so its `$ref` to the definition is not a recursion to stop at
            const schema: RJSFSchema = {
              definitions: { Q },
              type: 'object',
              properties: { b: { $ref: '#/definitions/Q', ...sibling } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ b: { name: 'd', friend: { name: 'd' } } });
          });

          it('getDefaultFormState fills in the items an allOf beside the $ref of an array declares', () => {
            // The array's `allOf` is merged by `computeDefaults()` itself rather than by `getObjectDefaults()`, and
            // the same schema written without the `$ref` beside the `allOf` gets these defaults
            const L: RJSFSchema = { type: 'array', minItems: 1, items: {} };
            const schema: RJSFSchema = {
              definitions: { L },
              type: 'object',
              required: ['p'],
              properties: { p: { $ref: '#/definitions/L', allOf: [{ items: { $ref: '#/definitions/L' } }] } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ p: [[undefined]] });
          });
        });

        describe('a recursive schema whose if has its properties resolved', () => {
          // Resolving the `if` expands the `$ref` back to the definition in place, so the recursion is reached through
          // the expanded property rather than through the `$ref` the plain schema holds; both pin the same result
          const recursion: RJSFSchema = { $ref: '#/definitions/node' };
          const withDefault = (child: RJSFSchema): RJSFSchema => ({
            type: 'object',
            properties: { name: { type: 'string', default: 'n' }, child },
            default: { child: { child: { name: 'deep' } } },
          });
          const withItems = (items: RJSFSchema): RJSFSchema => ({
            type: 'object',
            properties: { name: { type: 'string', default: 'n' }, kids: { type: 'array', minItems: 1, items } },
            required: ['kids'],
          });
          const rooted = (node: RJSFSchema): RJSFSchema => ({ definitions: { node }, $ref: '#/definitions/node' });
          const defaults = (schema: RJSFSchema, uiSchema?: UiSchema) =>
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema });

          test('keeps the parent and own defaults at the recursion, as a $ref to it does', () => {
            const expected = { name: 'n', child: { name: 'n', child: { name: 'deep', child: { name: 'deep' } } } };
            expect(defaults(rooted(withDefault(recursion)))).toEqual(expected);
            expect(defaults(rooted({ ...withDefault(recursion), if: {} }))).toEqual(expected);
          });

          test('takes the ui:initialValue at the recursion, as a $ref to it does', () => {
            const uiSchema: UiSchema = { child: { child: { 'ui:initialValue': { name: 'init' } } } };
            const expected = { name: 'n', child: { name: 'n', child: { name: 'init' } } };
            const node: RJSFSchema = {
              type: 'object',
              properties: { name: { type: 'string', default: 'n' }, child: recursion },
            };
            expect(defaults(rooted(node), uiSchema)).toEqual(expected);
            expect(defaults(rooted({ ...node, if: {} }), uiSchema)).toEqual(expected);
          });

          test('stops at a recursion reached through array items', () => {
            const expected = { name: 'n', kids: [{ name: 'n', kids: [undefined] }] };
            expect(defaults(rooted(withItems(recursion)))).toEqual(expected);
            expect(defaults(rooted({ ...withItems(recursion), if: {} }))).toEqual(expected);
          });

          test('stops at a recursion an allOf around the $ref hides from the $ref check', () => {
            const schema = rooted(withDefault({ allOf: [recursion] }));
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ name: 'n', child: { name: 'n', child: { name: 'deep', child: { name: 'deep' } } } });
          });

          test('expands a $ref back to the definition whose allOf merged another $ref in once', () => {
            const schema: RJSFSchema = {
              definitions: {
                outer: {
                  allOf: [{ $ref: '#/definitions/inner' }, { properties: { extra: { type: 'string', default: 'e' } } }],
                },
                inner: {
                  type: 'object',
                  properties: { name: { type: 'string', default: 'n' }, back: { $ref: '#/definitions/outer' } },
                },
              },
              type: 'object',
              properties: { a: { $ref: '#/definitions/outer' } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ a: { name: 'n', extra: 'e', back: { name: 'n', extra: 'e' } } });
          });

          test('stops a recursion under a populated allOf where it stops the same one without it', () => {
            const tags: RJSFSchema = { type: 'array', minItems: 1, items: { $ref: '#/definitions/tags' } };
            const populated = (definition: RJSFSchema) => {
              const schema: RJSFSchema = {
                definitions: { tags: definition },
                type: 'object',
                required: ['t'],
                properties: { t: { $ref: '#/definitions/tags' } },
              };
              return getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              );
            };
            expect(populated(tags)).toEqual({ t: [[undefined]] });
            expect(populated({ ...tags, allOf: [{ minItems: 1 }] })).toEqual({ t: [[undefined]] });
          });
        });

        describe('a recursive schema whose typed property resolves its way back to it', () => {
          // The property is an object or holds one, so `getObjectDefaults()` is what resolves its `allOf` or `then`,
          // and what expands the `$ref` back to the definition where the `$ref` check cannot see it
          const recursion: RJSFSchema = { $ref: '#/definitions/node' };
          const throughAllOf: RJSFSchema = { type: 'object', allOf: [recursion] };
          const rooted = (node: RJSFSchema): RJSFSchema => ({
            definitions: { node: { type: 'object', ...node } },
            $ref: '#/definitions/node',
          });
          const withChild = (child: RJSFSchema): RJSFSchema =>
            rooted({ properties: { name: { type: 'string', default: 'n' }, child } });
          const defaults = (schema: RJSFSchema, allOf?: 'populateDefaults') =>
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf } },
              { schema, rootSchema: schema },
            );

          test('stops at a recursion reached through the allOf of a property', () => {
            expect(defaults(withChild(throughAllOf), 'populateDefaults')).toEqual({ name: 'n', child: { name: 'n' } });
          });

          test('stops at a recursion reached through the then branch of a property', () => {
            expect(defaults(withChild({ type: 'object', if: {}, then: recursion }))).toEqual({
              name: 'n',
              child: { name: 'n' },
            });
          });

          test('stops at a recursion reached through the allOf of array items', () => {
            const schema = withChild({ type: 'array', minItems: 1, items: throughAllOf });
            expect(defaults(schema, 'populateDefaults')).toEqual({ name: 'n', child: [{ name: 'n', child: [{}] }] });
          });

          test('stops at a recursion reached through the allOf of additionalProperties', () => {
            // The keys come from a default, which names one at the recursion without holding data for it
            const schema: RJSFSchema = {
              ...rooted({ properties: { name: { type: 'string', default: 'n' } }, additionalProperties: throughAllOf }),
              default: { extra: { extra: {} } },
            };
            expect(defaults(schema, 'populateDefaults')).toEqual({ name: 'n', extra: { name: 'n' } });
          });
        });

        describe('a recursive allof schema', () => {
          const schema = RECURSIVE_REF_ALLOF;
          const expected = {
            value: [undefined],
          };

          test('getDefaultFormState', () => {
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(
              expected,
            );
          });

          test('getObjectDefaults', () => {
            expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
          });
        });

        describe('a simple schema and no optional args', () => {
          const schema: RJSFSchema = { type: 'string' };
          const expected = undefined;

          test('getDefaultFormState', () => {
            expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema)).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema)).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(getObjectDefaults({ validator: testValidator }, schema)).toEqual({});
          });
        });

        describe('an object const value merge with formData', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              localConst: {
                type: 'string',
                const: 'local',
              },
              RootConst: {
                type: 'object',
                properties: {
                  attr1: {
                    type: 'number',
                  },
                  attr2: {
                    type: 'boolean',
                  },
                },
                const: {
                  attr1: 1,
                  attr2: true,
                },
              },
              RootAndLocalConst: {
                type: 'string',
                const: 'FromLocal',
              },
              fromFormData: {
                type: 'string',
              },
            },
            const: {
              RootAndLocalConst: 'FromRoot',
            },
          };
          const rawFormData = {
            fromFormData: 'fromFormData',
          };
          const includeUndefinedValues = false;
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            emptyObjectFields: 'skipDefaults',
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, formData: rawFormData, rootSchema: schema, includeUndefinedValues },
              ),
            ).toEqual({
              localConst: 'local',
              RootConst: {
                attr1: 1,
                attr2: true,
              },
              RootAndLocalConst: 'FromLocal',
              fromFormData: 'fromFormData',
            });
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                includeUndefinedValues,
              }),
            ).toEqual({
              localConst: 'local',
              RootConst: {
                attr1: 1,
                attr2: true,
              },
              RootAndLocalConst: 'FromLocal',
            });
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                includeUndefinedValues,
              }),
            ).toEqual({
              localConst: 'local',
              RootConst: {
                attr1: 1,
                attr2: true,
              },
              RootAndLocalConst: 'FromLocal',
            });
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                includeUndefinedValues,
              }),
            ).toEqual({
              localConst: 'local',
              RootConst: {
                attr1: 1,
                attr2: true,
              },
              RootAndLocalConst: 'FromLocal',
            });
          });

          describe('constAsDefault is never', () => {
            const defaultFormStateBehavior: DefaultFormStateBehavior = {
              emptyObjectFields: 'skipDefaults',
              constAsDefaults: 'never',
            };

            test('getDefaultFormState', () => {
              expect(
                getDefaultFormState(
                  { validator: testValidator, defaultFormStateBehavior },
                  { schema, formData: rawFormData, rootSchema: schema, includeUndefinedValues },
                ),
              ).toEqual({
                fromFormData: 'fromFormData',
              });
            });

            test('computeDefaults', () => {
              expect(
                computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                  rootSchema: schema,
                  rawFormData,
                  includeUndefinedValues,
                }),
              ).toEqual({});
            });

            test('getDefaultBasedOnSchemaType', () => {
              expect(
                getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                  rootSchema: schema,
                }),
              ).toEqual({});
            });

            test('getObjectDefaults', () => {
              expect(
                getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                  rootSchema: schema,
                }),
              ).toEqual({});
            });
          });
        });
      });

      describe('an object with non valid formData for enum properties', () => {
        beforeEach(() => {
          // Mock isValid so that withExactlyOneSubschema works as expected
          testValidator.setReturnValues({
            isValid: [false, true],
          });
        });
        afterAll(() => {
          // Reset the testValidator
          if (typeof testValidator.reset === 'function') {
            testValidator?.reset();
          }
        });

        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
          },
          dependencies: {
            animal: {
              oneOf: [
                {
                  properties: {
                    animal: {
                      enum: ['Cat'],
                    },
                    food: {
                      type: 'string',
                      enum: ['meat', 'grass', 'fish'],
                      default: 'meat',
                    },
                  },
                },
                {
                  properties: {
                    animal: {
                      enum: ['Fish'],
                    },
                    food: {
                      type: 'string',
                      enum: ['insect', 'worms'],
                      default: 'worms',
                    },
                    water: {
                      type: 'string',
                      enum: ['lake', 'sea'],
                      default: 'sea',
                    },
                  },
                },
              ],
            },
          },
        };
        const rawFormData = {
          animal: 'Fish',
          food: 'meat',
          water: null,
        };
        const shouldMergeDefaultsIntoFormData = true;

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
          ).toEqual({
            animal: 'Fish',
            food: 'worms',
            water: null,
          });
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData,
            }),
          ).toEqual({
            animal: 'Fish',
            food: 'worms',
            water: null,
          });
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData,
            }),
          ).toEqual({
            animal: 'Fish',
            food: 'meat',
            water: null,
          });
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData,
            }),
          ).toEqual({
            animal: 'Fish',
            food: 'meat',
            water: null,
          });
        });

        describe('mergeDefaultsIntoFormData set to "useDefaultIfFormDataUndefined"', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
          };
          const expected = {
            animal: 'Fish',
            food: 'worms',
            water: 'sea',
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, formData: rawFormData, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                shouldMergeDefaultsIntoFormData,
              }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                shouldMergeDefaultsIntoFormData,
              }),
            ).toEqual({
              animal: 'Fish',
              food: 'meat',
              water: null,
            });
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                shouldMergeDefaultsIntoFormData,
              }),
            ).toEqual({
              animal: 'Fish',
              food: 'meat',
              water: null,
            });
          });
        });
      });

      it.each<[string, RJSFSchema, GenericObjectType, GenericObjectType]>([
        ['at the top', { b: ENUM_WITH_DEFAULT }, { b: 'zz' }, { b: 'x' }],
        [
          'one level down',
          { a: { type: 'object', properties: { b: ENUM_WITH_DEFAULT } } },
          { a: { b: 'zz' } },
          { a: { b: 'x' } },
        ],
        [
          'two levels down',
          { a: { type: 'object', properties: { c: { type: 'object', properties: { b: ENUM_WITH_DEFAULT } } } } },
          { a: { c: { b: 'zz' } } },
          { a: { c: { b: 'x' } } },
        ],
      ])(
        'replaces a value its enum no longer offers with the default %s (#5523)',
        (_, properties, formData, expected) => {
          const schema: RJSFSchema = { type: 'object', properties };
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
        },
      );

      it('replaces an object value its enum no longer offers with the default one level down (#5523)', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: { type: 'string', enum: [{ label: 'a' }, { label: 'b' }], default: { label: 'a' } },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { test: { label: 'z' } } }),
        ).toEqual({ test: { label: 'a' } });
      });

      describe('an object with a valid formData and enum property with default value', () => {
        test('getDefaultFormState', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              test: {
                type: 'string',
                enum: [
                  { label: 'a', value: 'a' },
                  { label: 'b', value: 'b' },
                ],
                default: { label: 'a', value: 'a' },
              },
            },
          };

          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { test: { label: 'b', value: 'b' } } },
            ),
          ).toEqual({
            test: { label: 'b', value: 'b' },
          });
        });
      });

      it("skips the constant default of a schema's anyOf under skipOneOf when it also has a oneOf", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            field: { type: 'string', anyOf: [{ const: 'a' }, { const: 'b' }], oneOf: [{ const: 'a' }] },
          },
          required: ['field'],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'skipOneOf' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({});
      });

      it("takes the constant default of a schema's anyOf under skipOneOf when the oneOf beside it is empty", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { field: { type: 'string', anyOf: [{ const: 'a' }, { const: 'b' }], oneOf: [] } },
          required: ['field'],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'skipOneOf' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ field: 'a' });
      });

      it('takes the constant default from the oneOf of a schema whose anyOf is empty', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { field: { anyOf: [], oneOf: [{ const: 'a' }] } },
          required: ['field'],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ field: 'a' });
      });

      it('takes the constant default from the anyOf of a schema that also has a oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            field: { anyOf: [{ const: 1 }, { const: 2 }], oneOf: [{ const: 'a' }] },
          },
          required: ['field'],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ field: 1 });
      });

      it.each<[string, RJSFSchema, GenericObjectType, GenericObjectType]>([
        [
          'at the root',
          { type: 'object', const: { a: 1 }, properties: { a: { type: 'number' } } },
          { a: 2, b: 5 },
          { a: 2 },
        ],
        [
          'inside an object',
          {
            type: 'object',
            properties: { o: { type: 'object', const: { a: 1 }, properties: { a: { type: 'number' } } } },
          },
          { o: { a: 2, b: 5 } },
          { o: { a: 2 } },
        ],
      ])('keeps only the data keys an object const names %s', (_name, schema, formData, expected) => {
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
            { schema, formData },
          ),
        ).toEqual(expected);
      });

      describe('oneOf with const values', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            oneOfField: {
              title: 'One Of Field',
              type: 'string',
              oneOf: [
                {
                  const: 'username',
                  title: 'Username and password',
                },
                {
                  const: 'secret',
                  title: 'SSO',
                },
              ],
            },
          },
          required: ['oneOfField'],
        };

        describe('constAsDefaults is always', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'always',
          };
          const expected = {
            oneOfField: 'username',
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });
        });

        describe('constAsDefaults is skipOneOf', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'skipOneOf',
          };
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });
        });

        describe('constAsDefaults is never', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'never',
          };
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });
        });
      });

      describe('an object with invalid formData const and constAsDefault set to always', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            stringField: {
              type: 'string',
              const: 'fromConst',
            },
          },
        };
        const rawFormData = {
          stringField: 'fromFormData',
        };
        const defaultFormStateBehavior: DefaultFormStateBehavior = {
          constAsDefaults: 'always',
        };
        const expected = {
          stringField: 'fromConst',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: rawFormData, rootSchema: schema },
            ),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
              rootSchema: schema,
              rawFormData,
            }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
              rootSchema: schema,
              rawFormData,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
              rootSchema: schema,
              rawFormData,
            }),
          ).toEqual(expected);
        });
      });

      describe('an nested object with if/then condition', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            wrappingObject: {
              type: 'object',
              properties: {
                checkbox: {
                  type: 'boolean',
                },
              },
              if: {
                properties: {
                  checkbox: {
                    const: true,
                  },
                },
                required: ['checkbox'],
              },
              then: {
                properties: {
                  foo: {
                    type: 'string',
                    default: 'foo value',
                  },
                },
                required: ['foo'],
              },
            },
          },
        };
        const rawFormData = {
          wrappingObject: {
            checkbox: true,
          },
        };
        const expected = {
          wrappingObject: {
            checkbox: true,
            foo: 'foo value',
          },
        };
        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData: true,
            }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData: true,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData: true,
            }),
          ).toEqual(expected);
        });
      });
    });

    describe('selects over object or array constants', () => {
      it('keeps the value getDefaultBasedOnSchemaType() is handed for constants written as $refs', () => {
        const schema: RJSFSchema = {
          type: 'object',
          oneOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/b' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: { a: { const: { x: 1 } }, b: { const: { x: 2 } } },
          type: 'object',
          properties: { pick: schema },
        };
        expect(
          getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema, rawFormData: { x: 2 } }),
        ).toEqual({ x: 2 });
      });
      it('leaves a required enum select with no default unfilled, rather than an empty value no option allows', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['x', 'e'],
          properties: {
            x: { type: 'object', enum: [{ a: 1 }, { b: 2 }] },
            e: { type: 'array', enum: [[1], [2]] },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
      });
      it('defaults a required oneOf select to its first constant as a whole, as a primitive one is', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['s', 'o', 'e'],
          properties: {
            s: { type: 'string', oneOf: [{ const: 'a' }, { const: 'b' }] },
            o: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
            e: { type: 'array', anyOf: [{ const: [1] }, { const: [2] }] },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          s: 'a',
          o: { a: 1 },
          e: [1],
        });
      });
      it('defaults a select over object constants written as $refs as one written in place', () => {
        const pick: RJSFSchema = { type: 'object', oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] };
        const schema: RJSFSchema = {
          definitions: { A: { const: { k: 'a' }, title: 'A' }, B: { const: { k: 'b' }, title: 'B' } },
          type: 'object',
          properties: { pick },
        };
        const withDefault: RJSFSchema = { ...schema, properties: { pick: { ...pick, default: { k: 'b' } } } };
        const required: RJSFSchema = { ...schema, required: ['pick'] };
        expect(getDefaultFormState({ validator: testValidator }, { schema: withDefault })).toEqual({
          pick: { k: 'b' },
        });
        expect(getDefaultFormState({ validator: testValidator }, { schema: required })).toEqual({ pick: { k: 'a' } });
      });
      it('defaults a oneOf select to the constant matching its own default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { o: { type: 'object', default: { b: 2 }, oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          o: { b: 2 },
        });
      });
      it('keeps its own default when constants are never defaults', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['o', 'p'],
          properties: {
            o: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
            p: { type: 'object', default: { b: 2 }, oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'never' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ p: { b: 2 } });
      });
      it.each<[string, RJSFSchema]>([
        ['a oneOf', { type: 'object', default: { a: 1 }, oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] }],
        ['an enum', { type: 'object', default: { a: 1 }, enum: [{ a: 1 }, { b: 2 }] }],
      ])('keeps the constant picked in %s select rather than blending its default into it', (_, choice) => {
        const schema: RJSFSchema = { type: 'object', properties: { choice } };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { choice: { b: 2 } }, rootSchema: schema },
          ),
        ).toEqual({ choice: { b: 2 } });
      });
      it('keeps the array picked in a select rather than padding it with its default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { choice: { type: 'array', default: [1, 2, 3], enum: [[1, 2, 3], [4]] } },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
                arrayMinItems: { mergeExtraDefaults: true },
              },
            },
            { schema, formData: { choice: [4] }, rootSchema: schema },
          ),
        ).toEqual({ choice: [4] });
      });
      it('leaves an object oneOf select unfilled under skipOneOf, as a primitive one is', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['s', 'o'],
          properties: {
            s: { type: 'string', oneOf: [{ const: 'x' }, { const: 'y' }] },
            o: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'skipOneOf' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('keeps a default the parent sets for an object select when constants are never defaults', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { s: 'y', o: { b: 2 } },
          properties: {
            s: { type: 'string', oneOf: [{ const: 'x' }, { const: 'y' }] },
            o: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'never' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ s: 'y', o: { b: 2 } });
      });
      it('fills the minimum items of an array of object selects as it does for primitive selects', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['arr', 'strs'],
          properties: {
            arr: { type: 'array', minItems: 1, items: { type: 'object', enum: [{ a: 1 }, { b: 2 }] } },
            strs: { type: 'array', minItems: 1, items: { type: 'string', enum: ['a', 'b'] } },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          arr: [undefined],
          strs: [undefined],
        });
      });
      it('defaults a typeless oneOf of object constants to its first constant, as a typed one is', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['p'],
          properties: { p: { oneOf: [{ const: { a: 1, b: 1 } }, { const: { a: 2 } }] } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          p: { a: 1, b: 1 },
        });
      });
      it('does not throw for an enum beside a oneOf of options that are not constants', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            choice: {
              type: 'object',
              enum: [{ a: 1 }, { b: 2 }],
              anyOf: [{ required: ['a'] }, { required: ['b'] }],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
      });
      it.each<[string, RJSFSchema]>([
        ['a typed', { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] }],
        ['a typeless', { oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] }],
      ])('applies ui:initialValue to %s object oneOf select', (_, choice) => {
        const schema: RJSFSchema = { type: 'object', required: ['choice'], properties: { choice } };
        const uiSchema: UiSchema = { choice: { 'ui:initialValue': { b: 2 } } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema })).toEqual({
          choice: { b: 2 },
        });
      });
      it('applies ui:emptyValue to an object oneOf select with nothing else to default to', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { choice: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] } },
        };
        const uiSchema: UiSchema = { choice: { 'ui:emptyValue': { b: 2 } } };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'never' } },
            { schema, rootSchema: schema, uiSchema },
          ),
        ).toEqual({ choice: { b: 2 } });
      });
      it('picks the constant an ancestor default names over its own default when ancestors win', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { plan: { tier: 2 } },
          properties: {
            plan: { type: 'object', default: { tier: 1 }, oneOf: [{ const: { tier: 1 } }, { const: { tier: 2 } }] },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                nestedDefaultsPrecedence: 'ancestorWins',
              },
            },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ plan: { tier: 2 } });
      });
      it('picks the constant an ancestor default names for an object oneOf select', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { plan: { tier: 2 } },
          properties: { plan: { type: 'object', oneOf: [{ const: { tier: 1 } }, { const: { tier: 2 } }] } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          plan: { tier: 2 },
        });
      });
      it.each<[string, DefaultFormStateBehavior | undefined, Record<string, unknown>]>([
        ['its own default', undefined, { tier: 1 }],
        ['the ancestor default when ancestors win', { nestedDefaultsPrecedence: 'ancestorWins' }, { color: 'red' }],
      ])('picks %s for an enum select over object constants rather than blending the two', (_, behavior, expected) => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { plan: { color: 'red' } },
          properties: {
            plan: { type: 'object', default: { tier: 1 }, enum: [{ tier: 1 }, { color: 'red' }] },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: behavior },
            { schema, rootSchema: schema },
          ),
        ).toEqual({
          plan: expected,
        });
      });
    });

    describe('array schemas', () => {
      test.each([false, 0, '', 'ab', {}, 5, true])(
        'fills minItems with the item default when the array default is %j',
        (value) => {
          const schema: RJSFSchema = {
            type: 'array',
            minItems: 2,
            default: value,
            items: { type: 'string', default: 'x' },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(['x', 'x']);
        },
      );

      describe('array with defaults with no formData', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 4,
          default: ['Raphael', 'Michaelangelo'],
          items: {
            type: 'string',
            default: 'Unknown',
          },
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected = ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType(
              { validator: testValidator },
              schema,
              { rootSchema: schema, includeUndefinedValues },
              ['Raphael', 'Michaelangelo'],
            ),
          ).toEqual(expected);
        });

        test('getArrayDefaults', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }, [
              'Raphael',
              'Michaelangelo',
            ]),
          ).toEqual(expected);
        });

        describe('with empty array as formData', () => {
          const rawFormData: unknown = [];
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: {
              mergeExtraDefaults: true,
              populate: 'all',
            },
          };

          test('getDefaultFormState', () => {
            expect(
              // NOTE: `rawFormData` is not used L1003
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema, includeUndefinedValues },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                includeUndefinedValues,
              }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType(
                { validator: testValidator, defaultFormStateBehavior },
                schema,
                { rootSchema: schema, rawFormData, includeUndefinedValues },
                ['Raphael', 'Michaelangelo'],
              ),
            ).toEqual(expected);
          });

          test('getArrayDefaults', () => {
            expect(
              getArrayDefaults(
                { validator: testValidator, defaultFormStateBehavior },
                schema,
                { rootSchema: schema, rawFormData, includeUndefinedValues },
                ['Raphael', 'Michaelangelo'],
              ),
            ).toEqual(expected);
          });
        });
      });

      describe('array with no defaults', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 4,
          items: {
            type: 'string',
          },
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected: undefined[] = [undefined, undefined, undefined, undefined];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toEqual(expected);
        });

        test('getArrayDefaults', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });
      });

      describe('array const value populate as defaults', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 4,
          const: ['ConstFromRoot', 'ConstFromRoot'],
          items: {
            type: 'string',
            const: 'Constant',
          },
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected = ['ConstFromRoot', 'ConstFromRoot', 'Constant', 'Constant'];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType(
              { validator: testValidator },
              schema,
              { rootSchema: schema, includeUndefinedValues },
              ['ConstFromRoot', 'ConstFromRoot'],
            ),
          ).toEqual(expected);
        });

        test('getArrayDefaults', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }, [
              'ConstFromRoot',
              'ConstFromRoot',
            ]),
          ).toEqual(expected);
        });
      });

      describe('array with nested dependent fixed-length array schema', () => {
        const schema: RJSFSchema = {
          items: [
            {
              dependencies: {
                checkbox: {
                  if: {
                    properties: {
                      checkbox: {
                        const: true,
                      },
                    },
                  },
                  then: {
                    properties: {
                      inner_array: {
                        items: [
                          {
                            title: 'Fixed Item',
                            type: 'string',
                          },
                        ],
                        title: 'Inner Fixed-Length Array',
                        type: 'array',
                      },
                    },
                  },
                },
              },
              properties: {
                checkbox: {
                  title: 'Dependency Checkbox',
                  type: 'boolean',
                },
              },
              title: 'Outer Item',
              type: 'object',
            },
          ],
          title: 'Outer Fixed Length Array',
          type: 'array',
        };
        const formData = [{ checkbox: true }];
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected = [
          {
            checkbox: true,
            inner_array: [undefined],
          },
        ];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData, includeUndefinedValues }),
          ).toEqual(readsTupleItems ? expected : formData);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, {
              rawFormData: formData,
              includeUndefinedValues,
              shouldMergeDefaultsIntoFormData: true,
            }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { includeUndefinedValues }, [
              {
                checkbox: true,
              },
            ]),
          ).toEqual(expected);
        });

        test('getArrayDefaults', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { includeUndefinedValues }, [
              {
                checkbox: true,
              },
            ]),
          ).toEqual(expected);
        });
      });

      describe('an invalid array schema', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: 'not a valid item value',
        } as RJSFSchema;
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected: never[] = [];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults, requiredAsRoot = true', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
              requiredAsRoot: true,
            }),
          ).toEqual(expected);
        });

        test('computeDefaults, requiredAsRoot = false', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toBeUndefined();
        });

        test('getDefaultBasedOnSchemaType, requiredAsRoot = true', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
              requiredAsRoot: true,
            }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType, requiredAsRoot = false', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toBeUndefined();
        });

        test('getArrayDefaults, requiredAsRoot = true', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
              requiredAsRoot: true,
            }),
          ).toEqual(expected);
        });

        test('getArrayDefaults, requiredAsRoot = false', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toBeUndefined();
        });
      });

      describe('simple schema and no optional args', () => {
        const schema: RJSFSchema = { type: 'array' };
        const expected: never[] = [];

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual(expected);
        });

        test('computeDefaults, requiredAsRoot = true', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { requiredAsRoot: true })).toEqual(expected);
        });

        test('computeDefaults, requiredAsRoot = false', () => {
          expect(computeDefaults({ validator: testValidator }, schema)).toBeUndefined();
        });

        test('getDefaultBasedOnSchemaType, requiredAsRoot = true', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { requiredAsRoot: true })).toEqual(
            expected,
          );
        });

        test('getDefaultBasedOnSchemaType, requiredAsRoot = false', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema)).toBeUndefined();
        });

        test('getArrayDefaults, requiredAsRoot = true', () => {
          expect(getArrayDefaults({ validator: testValidator }, schema, { requiredAsRoot: true })).toEqual(expected);
        });

        test('getArrayDefaults, requiredAsRoot = false', () => {
          expect(getArrayDefaults({ validator: testValidator }, schema)).toBeUndefined();
        });
      });

      describe('an array with const', () => {
        const schema: RJSFSchema = { type: 'array', const: ['foo', 'bar'] };

        describe('constAsDefaults is not never (default)', () => {
          const expected = ['foo', 'bar'];

          test('getDefaultFormState', () => {
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            // computeDefaults resolves the const value into `defaults` before calling getDefaultBasedOnSchemaType
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema }, expected),
            ).toEqual(expected);
          });

          test('getArrayDefaults', () => {
            // computeDefaults resolves the const value into `defaults` before calling getArrayDefaults
            expect(getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema }, expected)).toEqual(
              expected,
            );
          });
        });

        describe('constAsDefaults is never', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'never',
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual([]);
          });

          test('computeDefaults, requiredAsRoot = true', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                requiredAsRoot: true,
              }),
            ).toEqual([]);
          });

          test('computeDefaults, requiredAsRoot = false', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toBeUndefined();
          });

          test('getArrayDefaults, requiredAsRoot = true', () => {
            expect(
              getArrayDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                requiredAsRoot: true,
              }),
            ).toEqual([]);
          });

          test('getArrayDefaults, requiredAsRoot = false', () => {
            expect(
              getArrayDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toBeUndefined();
          });
        });
      });

      describe('optional array with arrayMinItems.populate = never', () => {
        test('optional array with arrayMinItems.populate = never, no form data', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              minItemsArray: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'string',
                },
              },
            },
          };
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: { populate: 'never' },
          };

          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({});
        });

        test('optional array with arrayMinItems.populate = never preserves short formData as-is', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              minItemsArray: {
                type: 'array',
                minItems: 2,
                items: { type: 'string' },
              },
            },
          };
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: { populate: 'never' },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { minItemsArray: ['foo'] } },
            ),
          ).toEqual({ minItemsArray: ['foo'] });
        });

        test('optional array with arrayMinItems.populate = never preserves formData that already meets minItems', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              minItemsArray: {
                type: 'array',
                minItems: 2,
                items: { type: 'string' },
              },
            },
          };
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: { populate: 'never' },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { minItemsArray: ['foo', 'bar'] } },
            ),
          ).toEqual({ minItemsArray: ['foo', 'bar'] });
        });

        test('required array with arrayMinItems.populate = never does not pad minItems with null (issue #5163)', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                minItems: 1,
                items: { type: 'string' },
              },
            },
            required: ['tags'],
          };
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: { populate: 'never' },
          };

          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
            tags: [],
          });
        });
      });
    });

    it('getInnerSchemaForArrayItem() item of type boolean returns empty schema', () => {
      expect(getInnerSchemaForArrayItem({ items: [true] }, AdditionalItemsHandling.Ignore, 0)).toEqual({});
    });
    describe('computeDefaultBasedOnSchemaTypeAndDefaults()', () => {
      let schema: RJSFSchema;
      describe('Object', () => {
        beforeAll(() => {
          schema = {
            type: 'object',
            default: null,
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeUndefined();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, {})).toEqual({});
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = { foo: 'bar' };
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Nullable Object', () => {
        beforeAll(() => {
          schema = {
            type: ['null', 'object'],
            default: null,
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeNull();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, {})).toBeNull();
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = { foo: 'bar' };
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Array', () => {
        beforeAll(() => {
          schema = {
            type: 'array',
            default: null,
            items: { type: 'string' },
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeUndefined();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, [])).toEqual([]);
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = ['bar'];
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Nullable Array', () => {
        beforeAll(() => {
          schema = {
            type: ['null', 'array'],
            default: null,
            items: { type: 'string' },
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeNull();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, [])).toBeNull();
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = ['bar'];
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Nullable String', () => {
        beforeAll(() => {
          schema = {
            type: 'string',
            default: null,
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeUndefined();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, '')).toEqual('');
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = 'bar';
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Nullable String', () => {
        beforeAll(() => {
          schema = {
            type: ['null', 'string'],
            default: null,
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeNull();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, '')).toBeNull();
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = 'bar';
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
    });
    describe('getValidFormData', () => {
      let schema: RJSFSchema;
      it('Test schema with non valid formData for enum property', () => {
        schema = {
          type: 'string',
          enum: ['a', 'b', 'c'],
        };

        expect(ensureFormDataMatchingSchema({ validator: testValidator }, schema, schema, 'd')).toBeUndefined();
      });
      it('Test schema with valid formData for enum property', () => {
        expect(ensureFormDataMatchingSchema({ validator: testValidator }, schema, schema, 'b')).toEqual('b');
      });
      it('drops object data a schema of no object type holds, at the top and inside an object (#5522)', () => {
        const string: RJSFSchema = { type: 'string' };
        const holder: RJSFSchema = { type: 'object', properties: { s: string, t: { type: 'number' } } };
        expect(ensureFormDataMatchingSchema({ validator: testValidator }, string, string, { b: 2 })).toBeUndefined();
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, holder, holder, { s: { b: 2 }, t: 1 }),
        ).toEqual({ t: 1 });
      });
      it('drops object data a property written as a $ref to a schema of no object type holds', () => {
        const rootSchema: RJSFSchema = {
          definitions: { S: { type: 'string' } },
          type: 'object',
          properties: { s: { $ref: '#/definitions/S' }, t: { type: 'number' } },
        };
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, rootSchema, rootSchema, { s: { b: 2 }, t: 1 }),
        ).toEqual({ t: 1 });
      });
      it('drops object data a property merged from several declarations of no object type holds, its allOf populated', () => {
        const rootSchema: RJSFSchema = {
          definitions: { S: { type: 'string' } },
          type: 'object',
          properties: { s: { minLength: 1 }, t: { type: 'number' } },
          allOf: [{ properties: { s: { $ref: '#/definitions/S' } } }],
        };
        const defaultFormStateBehavior: DefaultFormStateBehavior = { allOf: 'populateDefaults' };
        const context = { validator: testValidator, defaultFormStateBehavior };
        expect(ensureFormDataMatchingSchema(context, rootSchema, rootSchema, { s: { b: 2 }, t: 1 })).toEqual({ t: 1 });
        expect(ensureFormDataMatchingSchema(context, rootSchema, rootSchema, { s: 'x', t: 1 })).toEqual({
          s: 'x',
          t: 1,
        });
      });
      it('drops object data none of the constants a nested select reads through $refs is', () => {
        const rootSchema: RJSFSchema = {
          definitions: { A: { const: { a: 1 } }, B: { const: { a: 2 } } },
          type: 'object',
          properties: {
            o: {
              type: 'object',
              properties: { p: { type: 'object', oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] } },
            },
          },
        };
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, rootSchema, rootSchema, { o: { p: { a: 3 } } }),
        ).toEqual({ o: {} });
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, rootSchema, rootSchema, { o: { p: { a: 2 } } }),
        ).toEqual({ o: { p: { a: 2 } } });
      });
      it('keeps an option of constants written as $refs and drops a value none of them holds', () => {
        const color: RJSFSchema = {
          type: 'string',
          oneOf: [{ $ref: '#/definitions/red' }, { $ref: '#/definitions/blue' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: { red: { const: 'red' }, blue: { const: 'blue' } },
          type: 'object',
          properties: { color },
        };
        expect(ensureFormDataMatchingSchema({ validator: testValidator }, color, rootSchema, 'blue')).toEqual('blue');
        expect(ensureFormDataMatchingSchema({ validator: testValidator }, color, rootSchema, 'green')).toBeUndefined();
      });
      it('drops a value none of the options of a property written as a $ref to an allOf holds', () => {
        const rootSchema: RJSFSchema = {
          definitions: { E: { allOf: [{ type: 'string', enum: ['a', 'b'] }] } },
          type: 'object',
          properties: {
            inPlace: { allOf: [{ type: 'string', enum: ['a', 'b'] }] },
            viaRef: { $ref: '#/definitions/E' },
            free: true,
          },
        };
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, rootSchema, rootSchema, {
            inPlace: 'zzz',
            viaRef: 'zzz',
            free: 'zzz',
          }),
        ).toEqual({ inPlace: undefined, viaRef: undefined, free: 'zzz' });
      });
      it('Test schema with const property', () => {
        schema = {
          type: 'string',
          enum: ['a', 'b', 'c'],
          const: 'a',
        };

        expect(ensureFormDataMatchingSchema({ validator: testValidator }, schema, schema, 'a')).toEqual('a');
      });

      it('Test schema with valid formData with an enum and its default value', () => {
        schema = {
          type: 'string',
          enum: [
            { label: 'a', value: 'a' },
            { label: 'b', value: 'b' },
          ],
          default: { label: 'a', value: 'a' },
        };

        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { label: 'b', value: 'b' } }),
        ).toEqual({
          label: 'b',
          value: 'b',
        });
      });
    });
    describe('AJV $data reference in const property in schema should not be treated as default/const value', () => {
      let schema: RJSFSchema;
      it('test nested object with $data in the schema, optional array', () => {
        schema = {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              title: 'E-mail',
              format: 'email',
            },
            emailConfirm: {
              type: 'string',
              const: {
                $data: '/email',
              },
              title: 'Confirm e-mail',
              format: 'email',
            },
            nestedObject: {
              type: 'object',
              properties: {
                nestedEmail: {
                  type: 'string',
                  title: 'E-mail',
                  format: 'email',
                },
                nestedEmailConfirm: {
                  type: 'string',
                  title: 'Confirm e-mail',
                  const: {
                    $data: '/nestedObject/nestedEmail',
                  },
                  format: 'email',
                },
              },
            },
            nestedObjectConfirm: {
              type: 'object',
              properties: {
                nestedEmailConfirm: {
                  type: 'string',
                  title: 'Confirm e-mail',
                  const: {
                    $data: '/nestedObject/nestedEmail',
                  },
                  format: 'email',
                },
              },
            },
            arrayConfirm: {
              type: 'array',
              items: {
                type: 'string',
                title: 'Confirm e-mail',
                const: {
                  $data: '/nestedObject/nestedEmail',
                },
                format: 'email',
              },
            },
          },
        };
        expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({});
      });
      it('test nested object with $data in the schema, required array', () => {
        schema = {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              title: 'E-mail',
              format: 'email',
            },
            emailConfirm: {
              type: 'string',
              const: {
                $data: '/email',
              },
              title: 'Confirm e-mail',
              format: 'email',
            },
            nestedObject: {
              type: 'object',
              properties: {
                nestedEmail: {
                  type: 'string',
                  title: 'E-mail',
                  format: 'email',
                },
                nestedEmailConfirm: {
                  type: 'string',
                  title: 'Confirm e-mail',
                  const: {
                    $data: '/nestedObject/nestedEmail',
                  },
                  format: 'email',
                },
              },
            },
            nestedObjectConfirm: {
              type: 'object',
              properties: {
                nestedEmailConfirm: {
                  type: 'string',
                  title: 'Confirm e-mail',
                  const: {
                    $data: '/nestedObject/nestedEmail',
                  },
                  format: 'email',
                },
              },
            },
            arrayConfirm: {
              type: 'array',
              items: {
                type: 'string',
                title: 'Confirm e-mail',
                const: {
                  $data: '/nestedObject/nestedEmail',
                },
                format: 'email',
              },
            },
          },
          required: ['arrayConfirm'],
        };
        expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({
          arrayConfirm: [],
        });
      });
      it('test nested object with $data in the schema and emptyObjectFields set to populateRequiredDefaults', () => {
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ arrayConfirm: [] });
      });
      it('test nested object with $data in the schema and emptyObjectFields set to skipEmptyDefaults', () => {
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('test nested object with $data in the schema and emptyObjectFields set to skipDefaults', () => {
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
    });
    describe('default form state behavior: ignore min items unless required', () => {
      it('should return empty data for an optional array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalArray: {
              type: 'array',
              minItems: 2,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('should return empty array when given an empty array as form data for an optional array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalArray: {
              type: 'array',
              minItems: 2,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema, rawFormData: { optionalArray: [] } },
          ),
        ).toEqual({ optionalArray: [] });
      });
      it('should return undefined filled array for a required array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
            },
          },
          required: ['requiredArray'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredArray: [undefined, undefined] });
      });
      it('should return defaults array for a required array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              default: ['default0', 'default1'],
            },
          },
          required: ['requiredArray'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredArray: ['default0', 'default1'] });
      });
      it('should not combine defaults with raw form data for a required array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string', default: 'default0' },
              minItems: 2,
            },
          },
          required: ['requiredArray'],
        };
        // merging defaults with formData does not happen in computeDefaults, regardless of parameters
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema, rawFormData: { requiredArray: ['raw0'] } },
          ),
        ).toEqual({ requiredArray: ['default0', 'default0'] });
      });
    });
    describe('default form state behaviour: allOf = "populateDefaults"', () => {
      it('should populate default values correctly', () => {
        const schema: RJSFSchema = {
          title: 'Example',
          type: 'object',
          properties: {
            animalInfo: {
              properties: {
                animal: {
                  type: 'string',
                  default: 'Cat',
                  enum: ['Cat', 'Fish'],
                },
              },
              allOf: [
                {
                  if: {
                    properties: {
                      animal: {
                        const: 'Cat',
                      },
                    },
                  },
                  then: {
                    properties: {
                      food: {
                        type: 'string',
                        default: 'meat',
                        enum: ['meat', 'grass', 'fish'],
                      },
                    },
                    required: ['food'],
                  },
                },
              ],
            },
          },
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ animalInfo: { animal: 'Cat', food: 'meat' } });
      });
      it('should populate the default of a `$ref` wrapped in a single-element `allOf`', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            animal: { title: 'Animal', allOf: [{ $ref: '#/definitions/Animal' }] },
          },
          required: ['animal'],
          definitions: {
            Animal: { type: 'string', enum: ['Cat', 'Dog', 'Bird'], default: 'Dog' },
          },
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ animal: 'Dog' });
      });
      it('should populate the defaults of a `$ref` to an object wrapped in a single-element `allOf`', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            pet: { allOf: [{ $ref: '#/definitions/Pet' }] },
          },
          definitions: {
            Pet: {
              type: 'object',
              properties: {
                name: { type: 'string', default: 'Rex' },
                legs: { type: 'integer', default: 4 },
              },
            },
          },
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ pet: { name: 'Rex', legs: 4 } });
      });
      it('should populate no default for a non-object `allOf` schema that merges to one with no default', () => {
        // A `contains` subschema inside `allOf` merges into the array schema rather than producing a
        // default, so the array property is correctly left out of the result.
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: { type: 'string' },
              allOf: [{ contains: { const: 'a' } }],
            },
          },
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
    });

    describe('default form state behaviour: allOf = "skipDefaults"', () => {
      it('should populate default values correctly', () => {
        const schema: RJSFSchema = {
          title: 'Example',
          type: 'object',
          properties: {
            animalInfo: {
              properties: {
                animal: {
                  type: 'string',
                  default: 'Cat',
                  enum: ['Cat', 'Fish'],
                },
              },
              allOf: [
                {
                  if: {
                    properties: {
                      animal: {
                        const: 'Cat',
                      },
                    },
                  },
                  then: {
                    properties: {
                      food: {
                        type: 'string',
                        default: 'meat',
                        enum: ['meat', 'grass', 'fish'],
                      },
                    },
                    required: ['food'],
                  },
                },
              ],
            },
          },
        };

        expect(
          computeDefaults({ validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } }, schema, {
            rootSchema: schema,
          }),
        ).toEqual({ animalInfo: { animal: 'Cat' } });
      });
      it('should not populate the default of a `$ref` wrapped in a single-element `allOf`', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            animal: { title: 'Animal', allOf: [{ $ref: '#/definitions/Animal' }] },
          },
          required: ['animal'],
          definitions: {
            Animal: { type: 'string', enum: ['Cat', 'Dog', 'Bird'], default: 'Dog' },
          },
        };

        expect(
          computeDefaults({ validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } }, schema, {
            rootSchema: schema,
          }),
        ).toEqual({});
      });
    });
    describe('default form state behavior: arrayMinItems.populate = "never"', () => {
      it('should not be filled if minItems defined and required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
          },
          required: ['requiredArray'],
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ requiredArray: [] });
      });
      it('should not be filled if minItems defined and non required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ nonRequiredArray: [] });
      });

      it('should be filled with default values if required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              default: ['raw0'],
              items: { type: 'string' },
              minItems: 1,
            },
          },
          required: ['requiredArray'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ requiredArray: ['raw0'] });
      });

      it('should be filled with default values if non required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              default: ['raw0'],
              items: { type: 'string' },
              minItems: 1,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ nonRequiredArray: ['raw0'] });
      });

      it('should be filled with default values partly and not fill others', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              default: ['raw0'],
              items: { type: 'string' },
              minItems: 2,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema, rawFormData: { nonRequiredArray: ['raw1'] } },
          ),
        ).toStrictEqual({ nonRequiredArray: ['raw1'] });
      });

      it('should not add items to formData', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema, rawFormData: { nonRequiredArray: ['not add'] } },
          ),
        ).toStrictEqual({ nonRequiredArray: ['not add'] });
      });

      it('should be empty array if minItems not defined and required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['requiredArray'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ requiredArray: [] });
      });
      it('should be empty array if minItems not defined and non required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ nonRequiredArray: [] });
      });

      it('injecting data should be stopped at the top level of tree', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              minItems: 2,
              items: {
                type: 'object',
                properties: {
                  nestedValue: { type: 'string' },
                  nestedArray: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ nonRequiredArray: [] });
      });
      it('no injecting for childs', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              minItems: 2,
              items: {
                type: 'object',
                properties: {
                  nestedValue: { type: 'string' },
                  nestedArray: { type: 'array', minItems: 3, items: { type: 'string' } },
                },
              },
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            {
              rootSchema: schema,
              rawFormData: {
                nonRequiredArray: [
                  {
                    nestedArray: ['raw0'],
                  },
                ],
              },
            },
          ),
        ).toStrictEqual({
          nonRequiredArray: [
            {
              nestedArray: ['raw0'],
            },
          ],
        });
      });
    });
    /**
     * emptyObjectFields options tests
     */
    describe('default form state behavior: emptyObjectFields = "populateRequiredDefaults"', () => {
      it('test an object with an optional property that has a nested required property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo' });
      });
      it('test an object with a nested required property in a ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            nestedRequired: {
              properties: {
                nested: {
                  type: 'string',
                  default: 'foo',
                },
              },
              required: ['nested'],
            },
          },
          properties: {
            nestedRequiredProperty: {
              $ref: '#/definitions/nestedRequired',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty', 'nestedRequiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo', nestedRequiredProperty: { nested: 'foo' } });
      });
      it('test an object with a nested optional property in a ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            nestedOptional: {
              properties: {
                nested: {
                  type: 'string',
                  default: 'foo',
                },
              },
            },
          },
          properties: {
            nestedOptionalProperty: {
              $ref: '#/definitions/nestedOptional',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty', 'nestedOptionalProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo', nestedOptionalProperty: {} });
      });
      it('test an object with an optional property that has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                  default: '',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo' });
      });
      it('test an object with a required property that has a nested optional property which has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            baseRequiredProperty: {
              type: 'object',
              properties: {
                optionalProperty: {
                  type: 'object',
                  properties: {
                    nestedRequiredProperty: {
                      type: 'string',
                      default: '',
                    },
                  },
                  required: ['nestedRequiredProperty'],
                },
                requiredProperty: {
                  type: 'string',
                  default: 'foo',
                },
              },
              required: ['requiredProperty'],
            },
            baseOptionalProperty: {
              type: 'string',
              default: 'baseOptionalProperty',
            },
          },
          required: ['baseRequiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({
          baseRequiredProperty: {
            requiredProperty: 'foo',
          },
        });
      });
      it('test an object with an optional property that has a nested required property and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: true },
          ),
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: 'foo',
        });
      });
      it("test an object with an optional property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNumberProperty: {
              type: 'number',
            },
            optionalObjectProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: 'excludeObjectChildren' },
          ),
        ).toEqual({
          optionalNumberProperty: undefined,
          requiredProperty: 'foo',
        });
      });
    });
    describe('default form state behavior: emptyObjectFields = "skipDefaults"', () => {
      it('test an object with an optional property that has a nested required property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('test an object with an optional property that has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                  default: '',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('test an object with an optional property that has a nested required property and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: true },
          ),
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: 'foo',
        });
      });
      it("test an object with an optional property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNumberProperty: {
              type: 'number',
            },
            optionalObjectProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: 'excludeObjectChildren' },
          ),
        ).toEqual({
          optionalNumberProperty: undefined,
          requiredProperty: 'foo',
        });
      });
    });
    describe('default form state behavior: emptyObjectFields = "skipEmptyDefaults"', () => {
      it('test an object with an optional property that has a nested required property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo' });
      });
      it('test an object with a nested required property in a ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            nestedRequired: {
              properties: {
                nested: {
                  type: 'string',
                  default: 'foo',
                },
              },
              required: ['nested'],
            },
          },
          properties: {
            nestedRequiredProperty: {
              $ref: '#/definitions/nestedRequired',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty', 'nestedRequiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo', nestedRequiredProperty: { nested: 'foo' } });
      });
      it('test an object with a nested optional property in a ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            nestedOptional: {
              properties: {
                nested: {
                  type: 'string',
                  default: 'foo',
                },
              },
            },
          },
          properties: {
            nestedOptionalProperty: {
              $ref: '#/definitions/nestedOptional',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty', 'nestedOptionalProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({
          nestedOptionalProperty: {
            nested: 'foo',
          },
          requiredProperty: 'foo',
        });
      });
      it('test an object with an optional property that has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                  default: '',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: '',
          },
          requiredProperty: 'foo',
        });
      });
      it('test an object with an optional property that has a nested required property and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: true },
          ),
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: 'foo',
        });
      });
      it("test an object with an optional property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNumberProperty: {
              type: 'number',
            },
            optionalObjectProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: 'excludeObjectChildren' },
          ),
        ).toEqual({
          optionalNumberProperty: undefined,
          requiredProperty: 'foo',
        });
      });
      it('test an optional array without default value, an optional array with a default value, and a required array', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              title: 'Multiple Select Input',
              items: {
                type: 'string',
                enum: ['option1', 'option2'],
              },
              uniqueItems: true,
            },
            arrayWithDefault: {
              type: 'array',
              title: 'Required multiple Select Input',
              items: {
                type: 'string',
                enum: ['option1', 'option2'],
              },
              uniqueItems: true,
              default: ['option1'],
            },
            arrayRequired: {
              type: 'array',
              title: 'Required multiple Select Input',
              items: {
                type: 'string',
                enum: ['option1', 'option2'],
              },
              uniqueItems: true,
            },
          },
          required: ['arrayRequired'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: 'excludeObjectChildren' },
          ),
        ).toEqual({ arrayWithDefault: ['option1'] });
      });
    });

    describe('root default', () => {
      it('should map root schema default to form state, if any', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'string',
                default: 'foo',
              },
            },
          ),
        ).toEqual('foo');
      });
      it('should keep existing form data that is equal to 0', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'number',
                default: 1,
              },
              formData: 0,
            },
          ),
        ).toEqual(0);
      });
      it('should keep existing form data that is equal to false', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'boolean',
              },
              formData: false,
            },
          ),
        ).toEqual(false);
      });

      it.each([null, undefined, NaN])('should overwrite existing form data that is equal to a %s', (noneValue) => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'number',
                default: 1,
              },
              formData: noneValue,
            },
          ),
        ).toEqual(1);
      });
      it('should prefer a non-object const over an object default on a non-object schema', () => {
        const schema: RJSFSchema = { type: 'string', const: 'x', default: { a: 1 } };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual('x');
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: 'y' })).toEqual('y');
      });
      it.each<[string, RJSFSchema, GenericObjectType, (string | number)[]]>([
        ['a string const schema', { type: 'string', const: 'x', default: { a: 1 } }, { b: 2 }, ['0']],
        ['an array default', { type: 'array', default: [1, 2] }, { b: 2 }, ['0']],
        ['the tail of an array default', { type: 'array', default: [1, 2] }, { b: 2 }, ['1']],
        ['a string default inside allOf', { allOf: [{ type: 'string', default: 'x' }] }, { b: 2 }, ['0']],
        [
          'a nested string property default',
          { type: 'object', properties: { a: { type: 'string', default: 'x' } } },
          { a: { b: 2 } },
          ['a', '0'],
        ],
      ])('should not add index keys to object form data for %s', (_, schema, formData, indexKeyPath) => {
        const result = getDefaultFormState({ validator: testValidator }, { schema, formData });
        // Only an object holding the key is the bug; a string or array that satisfies the schema has index keys too.
        // An object holder must equal the form data it was given, so dropping that form data fails as well
        const holderPath = indexKeyPath.slice(0, -1);
        const holder = holderPath.reduce<unknown>((value, key) => (value as GenericObjectType)?.[key], result);
        const formDataHolder = holderPath.reduce<GenericObjectType>(
          (value, key) => value[key] as GenericObjectType,
          formData,
        );
        expect(isObject(holder) ? holder : formDataHolder).toEqual(formDataHolder);
      });
      it.each<[string, RJSFSchema, unknown]>([
        ['a string const', { type: 'string', const: 'x' }, 'x'],
        ['a string', { type: 'string' }, undefined],
        ['a string default', { type: 'string', default: 'ok' }, 'ok'],
        ['an array default', { type: 'array', default: [1, 2] }, [1, 2]],
        ['a number', { type: 'number' }, undefined],
        ['an integer', { type: 'integer' }, undefined],
        ['a boolean', { type: 'boolean' }, undefined],
        ['a null', { type: 'null' }, null],
        ['an untyped const', { const: 'x' }, 'x'],
        ['a type list of no object', { type: ['string', 'number'], default: 7 }, 7],
      ])('replaces object form data of %s schema, whose type takes no object (#5522)', (_, schema, expected) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { b: 2 } })).toEqual(expected);
      });
      it.each<[string, RJSFSchema]>([
        ['an object or null', { type: ['object', 'null'] }],
        ['a string or object', { type: ['string', 'object'] }],
        ['an untyped default', { default: 'foo' }],
        ['an untyped schema', {}],
        ['an anyOf naming no type of its own', { anyOf: [{ type: 'string' }, { type: 'number' }] }],
      ])('keeps object form data of a schema that allows %s (#5522)', (_, schema) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { b: 2 } })).toEqual({ b: 2 });
      });
      it.each<[string, object]>([
        ['a Date', new Date(0)],
        ['an object whose valueOf() gives an epoch, as a moment object does', { valueOf: () => 0 }],
      ])('keeps %s held by a string schema, which is no object form data (#5522)', (_, formData) => {
        const schema: RJSFSchema = { type: 'string', format: 'date-time' };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it.each<[string, RJSFSchema, GenericObjectType, GenericObjectType]>([
        [
          'a string property with a default',
          { type: 'object', properties: { s: { type: 'string', default: 'd' } } },
          { s: { z: 1 }, t: 1 },
          { s: 'd', t: 1 },
        ],
        [
          'a string property',
          { type: 'object', properties: { s: { type: 'string' } } },
          { s: { z: 1 }, t: 1 },
          { t: 1 },
        ],
        [
          'an array property',
          { type: 'object', properties: { s: { type: 'array', items: { type: 'number' }, default: [1, 2] } } },
          { s: { z: 1 } },
          { s: [1, 2] },
        ],
        [
          'a property two levels down',
          {
            type: 'object',
            properties: { a: { type: 'object', properties: { s: { type: 'string', default: 'd' } } } },
          },
          { a: { s: { z: 1 }, t: 1 } },
          { a: { s: 'd', t: 1 } },
        ],
        [
          'a $ref property',
          {
            type: 'object',
            definitions: { S: { type: 'string', default: 'r' } },
            properties: { s: { $ref: '#/definitions/S' } },
          },
          { s: { z: 1 } },
          { s: 'r' },
        ],
      ])('replaces object form data of %s, whose type takes no object (#5522)', (_, schema, formData, expected) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
      });
      it('replaces null-prototype object form data of a string property with its default, as plain object data (#5522)', () => {
        const schema: RJSFSchema = { type: 'object', properties: { s: { type: 'string', default: 'd' } } };
        const formData = { s: Object.assign(Object.create(null), { a: 1 }) };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual({ s: 'd' });
      });
      describe.each([false, true])('with initialDefaultsGenerated %s', (initialDefaultsGenerated) => {
        it.each<[string, RJSFSchema, GenericObjectType]>([
          ['additionalProperties', { type: 'object', additionalProperties: { type: 'string' } }, { extra: { a: 1 } }],
          [
            'additionalProperties with a default',
            { type: 'object', additionalProperties: { type: 'string', default: 'a' } },
            { k: { q: 1 } },
          ],
          ['patternProperties', { type: 'object', patternProperties: { '^x': { type: 'string' } } }, { xa: { a: 1 } }],
          [
            'patternProperties with a default',
            { type: 'object', patternProperties: { '^x': { type: 'string', default: 'a' } } },
            { xa: { q: 1 } },
          ],
        ])('keeps object data under a root %s of no object type, as it does one level down', (_, schema, formData) => {
          const holder: RJSFSchema = { type: 'object', properties: { o: schema } };
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData, initialDefaultsGenerated }),
          ).toEqual(formData);
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema: holder, formData: { o: formData }, initialDefaultsGenerated },
            ),
          ).toEqual({
            o: formData,
          });
        });
      });
      it('keeps the nested objects the user cleared under an untyped field with an object default, once defaults are generated', () => {
        const field: RJSFSchema = { default: { a: 1, b: { c: 2 } } };
        const schema: RJSFSchema = { type: 'object', properties: { p: field } };
        const formData = { a: 1, b: {} };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema: field, formData, initialDefaultsGenerated: true },
          ),
        ).toEqual(formData);
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { p: formData }, initialDefaultsGenerated: true },
          ),
        ).toEqual({ p: formData });
      });
      it.each<[string, GenericObjectType | null]>([
        ['an empty object', {}],
        ['an object with a key', { a: 'x' }],
      ])('keeps %s the data holds for a nullable object field defaulting to null', (_, value) => {
        const field: RJSFSchema = { type: ['null', 'object'], default: null, properties: { a: { type: 'string' } } };
        const schema: RJSFSchema = { type: 'object', properties: { o: field } };
        for (const initialDefaultsGenerated of [false, true]) {
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { o: value }, initialDefaultsGenerated },
            ),
          ).toEqual({ o: value });
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema: field, formData: value, initialDefaultsGenerated },
            ),
          ).toEqual(value);
        }
      });
      it.each<[string, RJSFSchema, DefaultFormStateBehavior]>([
        [
          'with no default, under useDefaultIfFormDataUndefined',
          { type: 'string' },
          { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
        ],
        [
          'with a default, under useDefaultIfFormDataUndefined and skipDefaults',
          { type: 'string', default: 'd' },
          { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined', emptyObjectFields: 'skipDefaults' },
        ],
      ])('keeps a declared key the data holds as undefined, %s', (_, property, defaultFormStateBehavior) => {
        const schema: RJSFSchema = { type: 'object', properties: { s: property } };
        const result = getDefaultFormState(
          { validator: testValidator, defaultFormStateBehavior },
          { schema, formData: { s: undefined } },
        );
        expect(isObject(result) && Object.hasOwn(result, 's')).toBe(true);
        expect(result).toEqual({ s: undefined });
      });
      it.each<[string, RJSFSchema, GenericObjectType, string]>([
        ['an extra key', { type: 'object', properties: { o: { type: 'object' } } }, { extra: { a: 1 } }, 'extra'],
        [
          'a select over object constants',
          { type: 'object', properties: { p: { oneOf: [{ const: { a: 1 } }, { const: { a: 2 } }] } } },
          { p: { a: 2 } },
          'p',
        ],
      ])('returns no object of the form data it keeps, for %s', (_, schema, formData, key) => {
        const result = getDefaultFormState({ validator: testValidator }, { schema, formData });
        expect(result).toEqual(formData);
        expect(isObject(result) && Reflect.get(result, key)).not.toBe(formData[key]);
      });
      it.each<[string, RJSFSchema, GenericObjectType, GenericObjectType]>([
        [
          'inside an object',
          {
            type: 'object',
            properties: { x: { type: 'object', enum: [{ a: 1 }, { a: 2 }], default: { a: 1 } } },
          },
          { x: { a: 3, c: 1 } },
          { x: { a: 1 } },
        ],
        ['at the root', { type: 'object', enum: [{ a: 1 }, { a: 2 }], default: { a: 1 } }, { a: 3 }, { a: 1 }],
        [
          'typed as a string, at the root',
          { type: 'string', enum: [{ l: 'a' }, { l: 'b' }], default: { l: 'a' } },
          { l: 'z' },
          { l: 'a' },
        ],
      ])(
        'replaces object form data that none of the constants of a select over objects is, %s (#5522)',
        (_, schema, formData, expected) => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
        },
      );
      it('should not spread a primitive form data value into an object default', () => {
        const schema: RJSFSchema = { type: 'string', enum: ['a', 'b'], default: { a: 1 } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: 'zz' })).toEqual({ a: 1 });
      });
      it.each([
        ['number', 5],
        ['boolean', true],
      ] as const)('should keep %s form data on a schema with an object default', (type, value) => {
        expect(
          getDefaultFormState({ validator: testValidator }, { schema: { type, default: { a: 1 } }, formData: value }),
        ).toEqual(value);
      });
      it('should keep array form data on a root array schema with an object default', () => {
        const schema: RJSFSchema = { type: 'array', default: {}, items: { type: 'string' } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: ['q'] })).toEqual(['q']);
      });
      it('should prefer an array const over an object default', () => {
        expect(
          getDefaultFormState({ validator: testValidator }, { schema: { const: [1, 2], default: { a: 1 } } }),
        ).toEqual([1, 2]);
      });
      it('should compute array defaults for an array schema with dependencies', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: { type: 'string', default: 'x' },
          minItems: 2,
          dependencies: { a: ['b'] },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual(['x', 'x']);
      });
      it('should compute the item defaults of an array schema with dependencies only once', () => {
        // Each computation of the item's defaults validates its `oneOf` dependency once
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: { a: { type: 'string', default: 'x' } },
            dependencies: { a: { oneOf: [{ properties: { a: { const: 'x' } } }] } },
          },
          minItems: 1,
          dependencies: { b: ['c'] },
        };
        const { validator, isValid } = withIsValidSpy();
        computeDefaults({ validator }, schema, { rootSchema: schema });
        expect(isValid).toHaveBeenCalledTimes(1);
      });
      it('should resolve dependencies against the inherited default of a whole-value select with an array type', () => {
        const schema: RJSFSchema = {
          type: ['array', 'object'],
          enum: [{ a: 1 }, { a: 2 }],
          dependencies: { a: { oneOf: [{ properties: { a: { const: 1 } } }] } },
        };
        const { validator, isValid } = withIsValidSpy();
        computeDefaults({ validator }, schema, { rootSchema: schema, parentDefaults: { a: 1 } });
        expect(isValid).toHaveBeenCalled();
      });
    });
    describe('nested default', () => {
      it('should map schema object prop default to form state', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
                properties: {
                  string: {
                    type: 'string',
                    default: 'foo',
                  },
                },
              },
            },
          ),
        ).toEqual({ string: 'foo' });
      });
      it('should default to empty object if no properties are defined', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
              },
            },
          ),
        ).toEqual({});
      });
      it('should recursively map schema object default to form state', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
                properties: {
                  object: {
                    type: 'object',
                    properties: {
                      string: {
                        type: 'string',
                        default: 'foo',
                      },
                    },
                  },
                },
              },
            },
          ),
        ).toEqual({ object: { string: 'foo' } });
      });
      it('should map schema array default to form state', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
                properties: {
                  array: {
                    type: 'array',
                    default: ['foo', 'bar'],
                    items: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          ),
        ).toEqual({ array: ['foo', 'bar'] });
      });
      it('should recursively map schema array default to form state', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
                properties: {
                  object: {
                    type: 'object',
                    properties: {
                      array: {
                        type: 'array',
                        default: ['foo', 'bar'],
                        items: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          ),
        ).toEqual({ object: { array: ['foo', 'bar'] } });
      });
      it('should propagate nested defaults to resulting formData by default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            object: {
              type: 'object',
              properties: {
                array: {
                  type: 'array',
                  default: ['foo', 'bar'],
                  items: {
                    type: 'string',
                  },
                },
                bool: {
                  type: 'boolean',
                  default: true,
                },
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          object: { array: ['foo', 'bar'], bool: true },
        });
      });
      it('should keep parent defaults if they don`t have a node level default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'object',
              default: {
                level2: {
                  leaf1: 1,
                  leaf2: 1,
                  leaf3: 1,
                  leaf4: 1,
                },
              },
              properties: {
                level2: {
                  type: 'object',
                  default: {
                    // No level2 default for leaf1
                    leaf2: 2,
                    leaf3: 2,
                  },
                  properties: {
                    leaf1: { type: 'number' }, // No level2 default for leaf1
                    leaf2: { type: 'number' }, // No level3 default for leaf2
                    leaf3: { type: 'number', default: 3 },
                    leaf4: { type: 'number' }, // Defined in formData.
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema,
              formData: {
                level1: { level2: { leaf4: 4 } },
              },
            },
          ),
        ).toEqual({
          level1: {
            level2: { leaf1: 1, leaf2: 2, leaf3: 3, leaf4: 4 },
          },
        });
      });
      it('should support nested values in formData', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'object',
              properties: {
                level2: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        leaf1: {
                          type: 'string',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        const formData = {
          level1: {
            level2: {
              leaf1: 'a',
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual({
          level1: { level2: { leaf1: 'a' } },
        });
      });
      it('should use parent defaults for ArrayFields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'array',
              default: [1, 2, 3],
              items: { type: 'number' },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: [1, 2, 3],
        });
      });
      it('should use parent defaults for ArrayFields if declared in parent', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { level1: [1, 2, 3] },
          properties: {
            level1: {
              type: 'array',
              items: { type: 'number' },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: [1, 2, 3],
        });
      });
      it('should map item defaults to fixed array default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              items: [
                {
                  type: 'string',
                  default: 'foo',
                },
                {
                  type: 'number',
                },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          array: ['foo', undefined],
        });
      });
      it('should merge schema array item defaults from grandparent for overlapping default definitions', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: {
            level1: { level2: ['root-default-1', 'root-default-2'] },
          },
          properties: {
            level1: {
              type: 'object',
              properties: {
                level2: {
                  type: 'array',
                  items: [
                    {
                      type: 'string',
                      default: 'child-default-1',
                    },
                    {
                      type: 'string',
                    },
                  ],
                },
              },
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: { level2: ['child-default-1', 'root-default-2'] },
        });
      });
      it('should overwrite schema array item defaults from parent for nested default definitions', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: {
            level1: {
              level2: [{ item: 'root-default-1' }, { item: 'root-default-2' }],
            },
          },
          properties: {
            level1: {
              type: 'object',
              default: { level2: [{ item: 'parent-default-1' }, {}] },
              properties: {
                level2: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      item: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: { level2: [{ item: 'parent-default-1' }, {}] },
        });
      });
      it('should merge schema array item defaults from the same item for overlapping default definitions', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'array',
              default: ['property-default-1', 'property-default-2'],
              items: [
                {
                  type: 'string',
                  default: 'child-default-1',
                },
                // this falls back to an empty item when it is missing
              ],
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: ['child-default-1', 'property-default-2'],
        });
      });
      it('should merge schema from additionalItems defaults into property default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'array',
              default: [
                {
                  item: 'property-default-1',
                },
                {},
              ],
              additionalItems: {
                type: 'object',
                properties: {
                  item: {
                    type: 'string',
                    default: 'additional-default',
                  },
                },
              },
              items: [
                {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                    },
                  },
                },
              ],
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: [{ item: 'property-default-1' }, { item: 'additional-default' }],
        });
      });
      it('should overwrite defaults over multiple levels with arrays', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: {
            level1: [
              {
                item: 'root-default-1',
              },
              {
                item: 'root-default-2',
              },
              {
                item: 'root-default-3',
              },
              {
                item: 'root-default-4',
              },
            ],
          },
          properties: {
            level1: {
              type: 'array',
              default: [
                {
                  item: 'property-default-1',
                },
                {},
                {},
              ],
              additionalItems: {
                type: 'object',
                properties: {
                  item: {
                    type: 'string',
                    default: 'additional-default',
                  },
                },
              },
              items: [
                {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                    },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                      default: 'child-default-2',
                    },
                  },
                },
              ],
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: [{ item: 'property-default-1' }, { item: 'child-default-2' }, { item: 'additional-default' }],
        });
      });
      it('should use schema default for referenced definitions', () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: 'number',
            },
            testdef: {
              type: 'object',
              properties: {
                foo: {
                  $ref: '#/definitions/foo',
                },
              },
            },
          },
          $ref: '#/definitions/testdef',
          default: { foo: 42 },
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);

        expect(schemaUtils.getDefaultFormState(schema)).toEqual({
          foo: 42,
        });
      });
      it("should prefer descendant's default with a $ref", () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: 'number',
              default: 1,
            },
            testdef: {
              type: 'object',
              properties: {
                foo: {
                  $ref: '#/definitions/foo',
                },
              },
            },
          },
          $ref: '#/definitions/testdef',
          default: { foo: 42 },
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);

        expect(schemaUtils.getDefaultFormState(schema)).toEqual({
          foo: 1,
        });
      });
      it('should populate defaults for oneOf + ref', () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: 'object',
              properties: {
                fooProp: {
                  type: 'string',
                },
                fooProp2: {
                  type: 'string',
                  default: 'fooProp2',
                },
              },
            },
            bar: {
              type: 'object',
              properties: {
                barProp: {
                  type: 'string',
                },
                barProp2: {
                  type: 'string',
                  default: 'barProp2',
                },
              },
            },
          },
          oneOf: [
            {
              $ref: '#/definitions/foo',
            },
            {
              $ref: '#/definitions/bar',
            },
          ],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { fooProp: 'fooProp' }, rootSchema: schema },
          ),
        ).toEqual({
          fooProp: 'fooProp',
          fooProp2: 'fooProp2',
        });
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { barProp: 'barProp' }, rootSchema: schema },
          ),
        ).toEqual({
          barProp: 'barProp',
          barProp2: 'barProp2',
        });
      });
      it('should fill array with additional items schema when items is empty', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 1,
              additionalItems: {
                type: 'string',
                default: 'foo',
              },
              items: [],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          array: ['foo'],
        });
      });
      it('should not fill array with additional items from schema when items is empty and form data contains partial array', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 2,
              additionalItems: {
                type: 'string',
                default: 'foo',
              },
              items: [],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { array: ['bar'] } })).toEqual({
          array: ['bar'],
        });
      });
      it('should fill defaults in existing array items', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              item: {
                type: 'string',
                default: 'foo',
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: [{}] })).toEqual([
          { item: 'foo' },
        ]);
      });
      it('defaults passed along for multiselect arrays when minItems is present', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 1,
              uniqueItems: true,
              default: ['foo', 'qux'],
              items: {
                type: 'string',
                enum: ['foo', 'bar', 'fuzz', 'qux'],
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          array: ['foo', 'qux'],
        });
      });
      it('returns empty defaults when no item defaults are defined for required array', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 1,
              uniqueItems: true,
              items: {
                type: 'string',
                enum: ['foo', 'bar', 'fuzz', 'qux'],
              },
            },
          },
          required: ['array'],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          array: [],
        });
      });
      it('returns undefined defaults when no item defaults are defined for optional array', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 1,
              uniqueItems: true,
              items: {
                type: 'string',
                enum: ['foo', 'bar', 'fuzz', 'qux'],
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({});
      });
      it('returns explicit defaults along with auto-fill when provided', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            turtles: {
              type: 'array',
              minItems: 4,
              default: ['Raphael', 'Michaelangelo'],
              items: {
                type: 'string',
                default: 'Unknown',
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          turtles: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
        });
      });
      describe('nestedDefaultsPrecedence is ancestorWins', () => {
        const defaultFormStateBehavior: DefaultFormStateBehavior = {
          nestedDefaultsPrecedence: 'ancestorWins',
        };
        it('should default to empty object if no properties are defined', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: {
                  type: 'object',
                },
              },
            ),
          ).toEqual({});
        });
        it('should recursively map schema object default to form state', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: {
                  type: 'object',
                  properties: {
                    object: {
                      type: 'object',
                      properties: {
                        string: {
                          type: 'string',
                          default: 'foo',
                        },
                      },
                    },
                  },
                },
              },
            ),
          ).toEqual({ object: { string: 'foo' } });
        });
        it('should map schema array default to form state', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: {
                  type: 'object',
                  properties: {
                    array: {
                      type: 'array',
                      default: ['foo', 'bar'],
                      items: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            ),
          ).toEqual({ array: ['foo', 'bar'] });
        });
        it('should recursively map schema array default to form state', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: {
                  type: 'object',
                  properties: {
                    object: {
                      type: 'object',
                      properties: {
                        array: {
                          type: 'array',
                          default: ['foo', 'bar'],
                          items: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            ),
          ).toEqual({ object: { array: ['foo', 'bar'] } });
        });
        it('should propagate nested defaults to resulting formData by default', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              object: {
                type: 'object',
                properties: {
                  array: {
                    type: 'array',
                    default: ['foo', 'bar'],
                    items: {
                      type: 'string',
                    },
                  },
                  bool: {
                    type: 'boolean',
                    default: true,
                  },
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            object: { array: ['foo', 'bar'], bool: true },
          });
        });
        it('should keep parent defaults regardless of node level defaults', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'object',
                default: {
                  level2: {
                    leaf1: 1,
                    leaf2: 1,
                    leaf3: 1,
                    leaf4: 1,
                  },
                },
                properties: {
                  level2: {
                    type: 'object',
                    default: {
                      // No level2 default for leaf1
                      leaf2: 2,
                      leaf3: 2,
                    },
                    properties: {
                      leaf1: { type: 'number' }, // No level2 default for leaf1
                      leaf2: { type: 'number' }, // No level3 default for leaf2
                      leaf3: { type: 'number', default: 3 },
                      leaf4: { type: 'number' }, // Defined in formData.
                    },
                  },
                },
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema,
                formData: {
                  level1: { level2: { leaf4: 4 } },
                },
              },
            ),
          ).toEqual({
            level1: {
              level2: { leaf1: 1, leaf2: 1, leaf3: 1, leaf4: 4 },
            },
          });
        });
        it('should support nested values in formData', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'object',
                properties: {
                  level2: {
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          leaf1: {
                            type: 'string',
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          };
          const formData = {
            level1: {
              level2: {
                leaf1: 'a',
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData }),
          ).toEqual({
            level1: { level2: { leaf1: 'a' } },
          });
        });
        it('should use parent defaults for ArrayFields', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'array',
                default: [1, 2, 3],
                items: { type: 'number' },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: [1, 2, 3],
          });
        });
        it('should use parent defaults for ArrayFields if declared in parent', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: { level1: [1, 2, 3] },
            properties: {
              level1: {
                type: 'array',
                items: { type: 'number' },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: [1, 2, 3],
          });
        });
        it('should map item defaults to fixed array default', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                items: [
                  {
                    type: 'string',
                    default: 'foo',
                  },
                  {
                    type: 'number',
                  },
                ],
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            array: ['foo', undefined],
          });
        });
        it('should prefer schema array item defaults from grandparent for overlapping default definitions', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: {
              level1: { level2: ['root-default-1', 'root-default-2'] },
            },
            properties: {
              level1: {
                type: 'object',
                properties: {
                  level2: {
                    type: 'array',
                    items: [
                      {
                        type: 'string',
                        default: 'child-default-1',
                      },
                      {
                        type: 'string',
                      },
                    ],
                  },
                },
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: { level2: ['root-default-1', 'root-default-2'] },
          });
        });
        it('should prefer schema array item defaults from parent for nested default definitions', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: {
              level1: {
                level2: [{ item: 'root-default-1' }, { item: 'root-default-2' }],
              },
            },
            properties: {
              level1: {
                type: 'object',
                default: { level2: [{ item: 'parent-default-1' }, {}] },
                properties: {
                  level2: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        item: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: { level2: [{ item: 'root-default-1' }, { item: 'root-default-2' }] },
          });
        });
        it('should prefer schema array defaults for overlapping item default definitions', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'array',
                default: ['property-default-1', 'property-default-2'],
                items: [
                  {
                    type: 'string',
                    default: 'child-default-1',
                  },
                  // this falls back to an empty item when it is missing
                ],
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: ['property-default-1', 'property-default-2'],
          });
        });
        it('should merge schema from additionalItems defaults into property default', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'array',
                default: [
                  {
                    item: 'property-default-1',
                  },
                  {},
                ],
                additionalItems: {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                      default: 'additional-default',
                    },
                  },
                },
                items: [
                  {
                    type: 'object',
                    properties: {
                      item: {
                        type: 'string',
                      },
                    },
                  },
                ],
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: [{ item: 'property-default-1' }, { item: 'additional-default' }],
          });
        });
        it("should prefer ancestor's defaults over multiple levels with arrays", () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: {
              level1: [
                {
                  item: 'root-default-1',
                },
                {
                  item: 'root-default-2',
                },
                {
                  item: 'root-default-3',
                },
                {
                  item: 'root-default-4',
                },
              ],
            },
            properties: {
              level1: {
                type: 'array',
                default: [
                  {
                    item: 'property-default-1',
                  },
                  {},
                  {},
                ],
                additionalItems: {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                      default: 'additional-default',
                    },
                  },
                },
                items: [
                  {
                    type: 'object',
                    properties: {
                      item: {
                        type: 'string',
                      },
                    },
                  },
                  {
                    type: 'object',
                    properties: {
                      item: {
                        type: 'string',
                        default: 'child-default-2',
                      },
                    },
                  },
                ],
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: [
              {
                item: 'root-default-1',
              },
              {
                item: 'root-default-2',
              },
              {
                item: 'root-default-3',
              },
              {
                item: 'root-default-4',
              },
            ],
          });
        });
        it('should use schema default for referenced definitions', () => {
          const schema: RJSFSchema = {
            definitions: {
              foo: {
                type: 'number',
              },
              testdef: {
                type: 'object',
                properties: {
                  foo: {
                    $ref: '#/definitions/foo',
                  },
                },
              },
            },
            $ref: '#/definitions/testdef',
            default: { foo: 42 },
          };
          const schemaUtils = createSchemaUtils({ validator: testValidator, defaultFormStateBehavior }, schema);

          expect(schemaUtils.getDefaultFormState(schema)).toEqual({
            foo: 42,
          });
        });
        it("should prefer ancestor's default with a $ref", () => {
          const schema: RJSFSchema = {
            definitions: {
              foo: {
                type: 'number',
                default: 1,
              },
              testdef: {
                type: 'object',
                properties: {
                  foo: {
                    $ref: '#/definitions/foo',
                  },
                },
              },
            },
            $ref: '#/definitions/testdef',
            default: { foo: 42 },
          };
          const schemaUtils = createSchemaUtils({ validator: testValidator, defaultFormStateBehavior }, schema);

          expect(schemaUtils.getDefaultFormState(schema)).toEqual({
            foo: 42,
          });
        });
        it('should populate defaults for oneOf + ref', () => {
          const schema: RJSFSchema = {
            definitions: {
              foo: {
                type: 'object',
                properties: {
                  fooProp: {
                    type: 'string',
                  },
                  fooProp2: {
                    type: 'string',
                    default: 'fooProp2',
                  },
                },
              },
              bar: {
                type: 'object',
                properties: {
                  barProp: {
                    type: 'string',
                  },
                  barProp2: {
                    type: 'string',
                    default: 'barProp2',
                  },
                },
              },
            },
            oneOf: [
              {
                $ref: '#/definitions/foo',
              },
              {
                $ref: '#/definitions/bar',
              },
            ],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { fooProp: 'fooProp' }, rootSchema: schema },
            ),
          ).toEqual({
            fooProp: 'fooProp',
            fooProp2: 'fooProp2',
          });
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { barProp: 'barProp' }, rootSchema: schema },
            ),
          ).toEqual({
            barProp: 'barProp',
            barProp2: 'barProp2',
          });
        });
        it('should fill array with additional items schema when items is empty', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 1,
                additionalItems: {
                  type: 'string',
                  default: 'foo',
                },
                items: [],
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            array: ['foo'],
          });
        });
        it('should not fill array with additional items from schema when items is empty and form data contains partial array', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 2,
                additionalItems: {
                  type: 'string',
                  default: 'foo',
                },
                items: [],
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { array: ['bar'] } },
            ),
          ).toEqual({
            array: ['bar'],
          });
        });
        it('should fill defaults in existing array items', () => {
          const schema: RJSFSchema = {
            type: 'array',
            minItems: 2,
            items: {
              type: 'object',
              properties: {
                item: {
                  type: 'string',
                  default: 'foo',
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: [{}] }),
          ).toEqual([{ item: 'foo' }]);
        });
        it('defaults passed along for multiselect arrays when minItems is present', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                default: ['foo', 'qux'],
                items: {
                  type: 'string',
                  enum: ['foo', 'bar', 'fuzz', 'qux'],
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            array: ['foo', 'qux'],
          });
        });
        it('returns empty defaults when no item defaults are defined for required array', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                items: {
                  type: 'string',
                  enum: ['foo', 'bar', 'fuzz', 'qux'],
                },
              },
            },
            required: ['array'],
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            array: [],
          });
        });
        it('returns undefined defaults when no item defaults are defined for optional array', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                items: {
                  type: 'string',
                  enum: ['foo', 'bar', 'fuzz', 'qux'],
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({});
        });
        it('returns explicit defaults along with auto-fill when provided', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              turtles: {
                type: 'array',
                minItems: 4,
                default: ['Raphael', 'Michaelangelo'],
                items: {
                  type: 'string',
                  default: 'Unknown',
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            turtles: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
          });
        });
        it.each<[string, RJSFSchema, Exclude<RJSFSchema['default'], undefined>]>([
          ['0', { type: 'integer', default: 1 }, 0],
          ['false', { type: 'boolean', default: true }, false],
          ["''", { type: 'string', default: 'deeper' }, ''],
          ['null', { type: ['integer', 'null'], default: 1 }, null],
        ])('keeps an ancestor default of %s over the property default (#5624)', (_name, property, ancestorDefault) => {
          const schema: RJSFSchema = {
            type: 'object',
            default: { value: ancestorDefault },
            properties: { value: property },
          };
          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
            value: ancestorDefault,
          });
        });
        it.each<[string, RJSFSchema, Exclude<RJSFSchema['default'], undefined>, unknown]>([
          ['an object on a string', { type: 'string', default: 'x' }, { v: 5 }, 'x'],
          ['a string on a number', { type: 'number', default: 1 }, '5', 1],
          ['a fraction on an integer', { type: 'integer', default: 1 }, 1.5, 1],
        ])(
          'gives the property default over an ancestor default its type cannot hold, %s',
          (_name, property, ancestorDefault, expected) => {
            const schema: RJSFSchema = { type: 'object', default: { v: ancestorDefault }, properties: { v: property } };
            expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
              v: expected,
            });
          },
        );
        it.each<[string, RJSFSchema, Exclude<RJSFSchema['default'], undefined>, unknown]>([
          ['an anyOf option', { anyOf: [{ type: 'number' }, { type: 'string' }], default: 'x' }, 5, 5],
          ['a oneOf option', { oneOf: [{ type: 'number' }, { type: 'string' }], default: 'x' }, 5, 5],
          ['no option', { anyOf: [{ type: 'number' }, { type: 'string' }], default: 'x' }, true, 'x'],
        ])(
          'gives an ancestor default over the property default where %s holds it',
          (_name, property, ancestor, expected) => {
            const schema: RJSFSchema = { type: 'object', default: { v: ancestor }, properties: { v: property } };
            expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
              v: expected,
            });
          },
        );
        it.each<[string, Exclude<RJSFSchema['default'], undefined>]>([
          ['true', true],
          ['null', null],
          ['{}', {}],
        ])(
          'gives the option the own default picks, with its default, over an ancestor default of %s no option holds',
          (_name, ancestor) => {
            const schema: RJSFSchema = {
              type: 'object',
              default: { v: ancestor },
              properties: {
                v: {
                  anyOf: [
                    { type: 'number', default: 1 },
                    { type: 'string', default: 's' },
                  ],
                  default: 'x',
                },
              },
            };
            expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
              v: 's',
            });
          },
        );
        it('keeps a falsy default two levels up over the property default (#5624)', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: { inner: { value: 0 } },
            properties: {
              inner: {
                type: 'object',
                default: { value: 2 },
                properties: { value: { type: 'integer', default: 1 } },
              },
            },
          };
          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
            inner: { value: 0 },
          });
        });
      });
    });
    describe('defaults with allOf', () => {
      let schema: RJSFSchema;
      const animalInfoSchema: RJSFSchema = {
        properties: {
          animal: {
            type: 'string',
            default: 'Cat',
            enum: ['Cat', 'Fish'],
          },
        },
        allOf: [
          {
            if: {
              properties: {
                animal: {
                  const: 'Cat',
                },
              },
            },
            then: {
              properties: {
                food: {
                  type: 'string',
                  default: 'meat',
                  enum: ['meat', 'grass', 'fish'],
                },
              },
              required: ['food'],
            },
          },
        ],
      };
      const animalInfoObjectSchema: RJSFSchema = {
        title: 'Example',
        type: 'object',
        properties: {
          animalInfo: animalInfoSchema,
        },
      };
      const animalInfoArraySchema: RJSFSchema = { type: 'array', items: animalInfoSchema };
      const rootAllOfSchema: RJSFSchema = {
        ...animalInfoObjectSchema,
        allOf: [{ properties: { name: { type: 'string' } } }],
      };
      const [animalCondition] = animalInfoSchema.allOf as RJSFSchema[];
      const fishFirstAnimalInfoSchema: RJSFSchema = {
        properties: { animal: { type: 'string', default: 'Cat', enum: ['Cat', 'Fish', 'Dog'] } },
        allOf: [
          {
            if: { properties: { animal: { const: 'Fish' } } },
            then: { properties: { food: { type: 'string', default: 'grass' } } },
          },
          {
            if: { properties: { animal: { const: 'Dog' } } },
            then: { properties: { food: { type: 'string', default: 'fish' } } },
          },
          animalCondition,
        ],
      };

      afterEach(() => {
        testValidator.reset?.();
      });

      it('should populate root defaults for allOf', () => {
        schema = {
          allOf: [
            {
              properties: {
                first: {
                  title: 'First',
                  type: 'string',
                },
              },
            },
            {
              properties: {
                second: {
                  title: 'Second',
                  type: 'string',
                },
              },
            },
          ],
          default: {
            second: 'Second 2!',
          },
          type: 'object',
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          second: 'Second 2!',
        });
      });

      describe('default form state behaviour: allOf = "populateDefaults"', () => {
        it('should populate default values correctly', () => {
          expect(
            computeDefaults(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
              animalInfoObjectSchema,
              { rootSchema: animalInfoObjectSchema },
            ),
          ).toEqual({ animalInfo: { animal: 'Cat', food: 'meat' } });
        });

        it('should apply conditional const defaults consistently for root and nested allOf schemas', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            allOf: 'populateDefaults',
            constAsDefaults: 'always',
          };
          const conditionalSchema = {
            type: 'object',
            properties: {
              animal: {
                enum: ['Cat', 'Fish'],
              },
              food: {
                type: 'string',
                enum: ['meat', 'grass', 'fish'],
              },
            },
            allOf: [
              {
                if: {
                  properties: {
                    animal: {
                      const: 'Cat',
                    },
                  },
                },
                then: {
                  properties: {
                    food: {
                      const: 'fish',
                    },
                  },
                  required: ['food'],
                },
              },
              {
                required: ['animal'],
              },
            ],
          } satisfies RJSFSchema;
          const formData = {
            animal: 'Cat',
            food: 'meat',
          };

          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema: conditionalSchema, formData, rootSchema: conditionalSchema },
            ),
          ).toEqual({
            animal: 'Cat',
            food: 'fish',
          });

          const nestedSchema: RJSFSchema = {
            type: 'object',
            properties: {
              nested: conditionalSchema,
            },
            required: ['nested'],
          };

          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema: nestedSchema, formData: { nested: formData }, rootSchema: nestedSchema },
            ),
          ).toEqual({
            nested: {
              animal: 'Cat',
              food: 'fish',
            },
          });
        });

        it('keeps the data of a nested object over its own default where its allOf is left unmerged', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              field: {
                allOf: [{ properties: { first: { type: 'string' } } }, { properties: { second: { type: 'string' } } }],
                default: { second: 'second!' },
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { field: { second: 'changed!' } }, rootSchema: schema },
            ),
          ).toEqual({ field: { second: 'changed!' } });
        });

        it('should populate the conditional defaults of an allOf in array items', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
              { schema: animalInfoArraySchema, formData: [{ animal: 'Cat' }], rootSchema: animalInfoArraySchema },
            ),
          ).toEqual([{ animal: 'Cat', food: 'meat' }]);
        });

        // Pins a known limitation rather than intended behavior; see the matching skipDefaults test below.
        it('should fill in the first then default in array items with no data even when its if does not match the defaulted value (known limitation)', () => {
          const fishFirstArraySchema: RJSFSchema = { type: 'array', items: fishFirstAnimalInfoSchema };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
              { schema: fishFirstArraySchema, formData: [{}], rootSchema: fishFirstArraySchema },
            ),
          ).toEqual([{ animal: 'Cat', food: 'grass' }]);
        });
      });

      describe('default form state behaviour: allOf = "skipDefaults"', () => {
        const directConditionArraySchema: RJSFSchema = {
          type: 'array',
          items: { properties: animalInfoSchema.properties, ...animalCondition },
        };
        const directIfArraySchema: RJSFSchema = {
          type: 'array',
          items: {
            ...animalInfoSchema,
            properties: { ...animalInfoSchema.properties, x: {} },
            if: { properties: { x: { const: 1 } } },
          },
        };
        const nestedPlacements = [
          {
            where: 'array items',
            wrap: (schema: RJSFSchema): RJSFSchema => ({ type: 'array', items: schema }),
            wrapData: (data: object) => [data],
          },
          {
            where: 'an object property',
            wrap: (schema: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { nested: schema } }),
            wrapData: (data: object) => ({ nested: data }),
          },
        ];

        it('should populate default values correctly', () => {
          expect(
            computeDefaults(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              animalInfoObjectSchema,
              { rootSchema: animalInfoObjectSchema },
            ),
          ).toEqual({ animalInfo: { animal: 'Cat' } });
        });

        it('should not populate the conditional defaults of an allOf in array items', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: animalInfoArraySchema, formData: [{ animal: 'Cat' }], rootSchema: animalInfoArraySchema },
            ),
          ).toEqual([{ animal: 'Cat' }]);
        });

        it('should skip the plain property defaults of a nested allOf too', () => {
          const plainAllOfSchema: RJSFSchema = {
            type: 'object',
            properties: {
              animalInfo: {
                type: 'object',
                properties: { name: { type: 'string', default: 'Tom' } },
                allOf: [{ properties: { animal: { type: 'string', default: 'Cat' } } }],
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: plainAllOfSchema, rootSchema: plainAllOfSchema },
            ),
          ).toEqual({ animalInfo: { name: 'Tom' } });
        });

        it("should populate the conditional defaults of the root schema's own allOf, which skipDefaults does not skip", () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: animalInfoSchema, formData: { animal: 'Cat' }, rootSchema: animalInfoSchema },
            ),
          ).toEqual({ animal: 'Cat', food: 'meat' });
        });

        it('should skip the allOf of the oneOf option picked on the initial render, even in the root schema', () => {
          const rootOneOfSchema: RJSFSchema = { oneOf: [{ type: 'object', ...animalInfoSchema }] };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: rootOneOfSchema, rootSchema: rootOneOfSchema },
            ),
          ).toEqual({ animal: 'Cat' });
        });

        it('should pick the if-then-else branch from the form data, so a then default whose if requires a defaulted value is left out', () => {
          // The mock validator cannot evaluate `required`, so it returns what the real validators do here; the claim
          // itself is only exercised by the ajv8, ata and cfworker runs of this test.
          testValidator.setReturnValues({ isValid: [false] });
          const requiredAnimalSchema: RJSFSchema = {
            ...animalInfoSchema,
            allOf: [{ ...animalCondition, if: { ...(animalCondition.if as RJSFSchema), required: ['animal'] } }],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: requiredAnimalSchema, rootSchema: requiredAnimalSchema },
            ),
          ).toEqual({ animal: 'Cat' });
        });

        // Pins a known limitation rather than intended behavior: the if is checked against the form data, not the
        // computed defaults, so a Cat default gets the Fish entry's food. A fix that evaluates the if against the
        // defaults is expected to change this result.
        it('should fill in the first then default on empty data even when its if does not match the defaulted value (known limitation)', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: fishFirstAnimalInfoSchema, rootSchema: fishFirstAnimalInfoSchema },
            ),
          ).toEqual({ animal: 'Cat', food: 'grass' });
        });

        it('should drop the whole allOf when a custom merger throws on the conflicting then defaults', () => {
          consoleWarnSpy.mockClear();
          const conflict = new Error('conflicting food defaults');
          const mergeAllOfUnlessFoodDefaultsConflict: CustomMergeAllOf = (schema) => {
            const foodDefaults = new Set(
              (schema.allOf as RJSFSchema[]).map(
                (entry) => (entry.properties?.food as RJSFSchema | undefined)?.default,
              ),
            );
            foodDefaults.delete(undefined);
            if (foodDefaults.size > 1) {
              throw conflict;
            }
            return shallowAllOfMerge(schema) as RJSFSchema;
          };
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults' },
                customMergeAllOf: mergeAllOfUnlessFoodDefaultsConflict,
              },
              { schema: animalInfoSchema, formData: { animal: 'Cat' }, rootSchema: animalInfoSchema },
            ),
          ).toEqual({ animal: 'Cat', food: 'meat' });
          expect(consoleWarnSpy).not.toHaveBeenCalledWith('could not merge subschemas in allOf:\n', conflict);
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults' },
                customMergeAllOf: mergeAllOfUnlessFoodDefaultsConflict,
              },
              { schema: fishFirstAnimalInfoSchema, rootSchema: fishFirstAnimalInfoSchema },
            ),
          ).toEqual({ animal: 'Cat' });
          expect(consoleWarnSpy).toHaveBeenCalledWith('could not merge subschemas in allOf:\n', conflict);
        });

        it('should populate the conditional defaults of an if-then-else placed directly in array items', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              {
                schema: directConditionArraySchema,
                formData: [{ animal: 'Cat' }],
                rootSchema: directConditionArraySchema,
              },
            ),
          ).toEqual([{ animal: 'Cat', food: 'meat' }]);
        });

        it('should not populate the conditional defaults of an if-then-else placed directly in array items when emptyObjectFields is skipEmptyDefaults', () => {
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults', emptyObjectFields: 'skipEmptyDefaults' },
              },
              {
                schema: directConditionArraySchema,
                formData: [{ animal: 'Cat' }],
                rootSchema: directConditionArraySchema,
              },
            ),
          ).toEqual([{ animal: 'Cat' }]);
        });

        it("should skip a property's allOf conditional defaults even where a deep custom merger merges the root's allOf", () => {
          const deepAllOfMerge: CustomMergeAllOf = (schema) => {
            const merged = shallowAllOfMerge(schema) as RJSFSchema;
            const properties = Object.fromEntries(
              Object.entries(merged.properties ?? {}).map(([key, property]) => [
                key,
                typeof property === 'object' && 'allOf' in property ? shallowAllOfMerge(property) : property,
              ]),
            );
            return { ...merged, properties };
          };
          const formData = { animalInfo: { animal: 'Cat' } };
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults' },
                customMergeAllOf: deepAllOfMerge,
              },
              { schema: rootAllOfSchema, formData, rootSchema: rootAllOfSchema },
            ),
          ).toEqual(formData);
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults' },
                customMergeAllOf: deepAllOfMerge,
              },
              { schema: animalInfoObjectSchema, formData, rootSchema: animalInfoObjectSchema },
            ),
          ).toEqual(formData);
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'populateDefaults' },
                customMergeAllOf: deepAllOfMerge,
              },
              { schema: rootAllOfSchema, formData, rootSchema: rootAllOfSchema },
            ),
          ).toEqual({ animalInfo: { animal: 'Cat', food: 'meat' } });
        });

        it("should skip a property's allOf conditional defaults with @x0k/json-schema-merge's createDeepAllOfMerge", () => {
          const getDefaults = (allOf: DefaultFormStateBehavior['allOf']) =>
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf },
                customMergeAllOf: createDeepAllOfMerge(shallowAllOfMerge) as CustomMergeAllOf,
              },
              { schema: rootAllOfSchema, formData: { animalInfo: { animal: 'Cat' } }, rootSchema: rootAllOfSchema },
            );
          expect(getDefaults('skipDefaults')).toEqual({ animalInfo: { animal: 'Cat' } });
          expect(getDefaults('populateDefaults')).toEqual({ animalInfo: { animal: 'Cat', food: 'meat' } });
        });

        it.each(nestedPlacements)(
          "should skip a property's allOf conditional defaults with createDeepAllOfMerge in $where whose schema also has a direct if",
          ({ wrap, wrapData }) => {
            const deepMerge = createDeepAllOfMerge(shallowAllOfMerge) as CustomMergeAllOf;
            const directIfSchema = wrap({ ...rootAllOfSchema, if: { properties: { x: { const: 1 } } }, then: {} });
            const allOfSchema = wrap(rootAllOfSchema);
            const formData = wrapData({ animalInfo: { animal: 'Cat' } });
            const getDefaults = (schema: RJSFSchema, behavior: DefaultFormStateBehavior) =>
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: behavior, customMergeAllOf: deepMerge },
                { schema, formData, rootSchema: schema },
              );
            expect(getDefaults(directIfSchema, { allOf: 'skipDefaults' })).toEqual(formData);
            expect(getDefaults(directIfSchema, { allOf: 'populateDefaults' })).toEqual(
              wrapData({ animalInfo: { animal: 'Cat', food: 'meat' } }),
            );
            expect(getDefaults(allOfSchema, { allOf: 'skipDefaults' })).toEqual(formData);
            expect(
              getDefaults(directIfSchema, { allOf: 'skipDefaults', emptyObjectFields: 'skipEmptyDefaults' }),
            ).toEqual(formData);
          },
        );

        it('should populate the conditional defaults of an allOf in array items whose schema also has a direct if', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: directIfArraySchema, formData: [{ animal: 'Cat' }], rootSchema: directIfArraySchema },
            ),
          ).toEqual([{ animal: 'Cat', food: 'meat' }]);
        });

        it('should not populate the conditional defaults of an allOf next to a direct if in array items when emptyObjectFields is skipEmptyDefaults', () => {
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults', emptyObjectFields: 'skipEmptyDefaults' },
              },
              { schema: directIfArraySchema, formData: [{ animal: 'Cat' }], rootSchema: directIfArraySchema },
            ),
          ).toEqual([{ animal: 'Cat' }]);
        });

        const dependencyCases: { entry: string; dependency: RJSFSchema }[] = [
          { entry: 'an allOf with an if-then-else', dependency: { allOf: [animalCondition] } },
          {
            entry: 'an allOf with a plain property default',
            dependency: { allOf: [{ properties: { food: { type: 'string', default: 'meat' } } }] },
          },
          { entry: 'a direct if-then-else', dependency: animalCondition },
          {
            entry: 'an if-then-else whose if requires the property',
            dependency: { ...animalCondition, if: { properties: { animal: { const: 'Cat' } }, required: ['animal'] } },
          },
        ];
        it.each(
          nestedPlacements.flatMap((placement) =>
            dependencyCases.map((dependencyCase) => ({ ...placement, ...dependencyCase })),
          ),
        )(
          'should populate the defaults of $entry in a dependencies entry in $where once its property has a value, even when emptyObjectFields is skipEmptyDefaults',
          ({ wrap, wrapData, dependency }) => {
            const dependentSchema = (animal: RJSFSchema): RJSFSchema =>
              wrap({ type: 'object', properties: { animal }, dependencies: { animal: dependency } });
            const defaultedSchema = dependentSchema({ type: 'string', default: 'Cat' });
            const noDefaultSchema = dependentSchema({ type: 'string' });
            const formData = wrapData({});
            const getDefaults = (schema: RJSFSchema, behavior: DefaultFormStateBehavior) =>
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: behavior },
                { schema, formData, rootSchema: schema },
              );
            expect(getDefaults(defaultedSchema, { allOf: 'skipDefaults' })).toEqual(
              wrapData({ animal: 'Cat', food: 'meat' }),
            );
            expect(
              getDefaults(defaultedSchema, { allOf: 'skipDefaults', emptyObjectFields: 'skipEmptyDefaults' }),
            ).toEqual(wrapData({ animal: 'Cat', food: 'meat' }));
            expect(getDefaults(defaultedSchema, { allOf: 'skipDefaults', emptyObjectFields: 'skipDefaults' })).toEqual(
              formData,
            );
            expect(getDefaults(noDefaultSchema, { allOf: 'skipDefaults' })).toEqual(formData);
          },
        );
      });
    });
    describe('defaults with oneOf', () => {
      afterEach(() => {
        // Reset the testValidator
        if (typeof testValidator.reset === 'function') {
          testValidator?.reset();
        }
      });
      it('should not populate defaults for empty oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              oneOf: [],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({});
      });
      it('should populate defaults from the schema itself beside an empty oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'a', oneOf: [] },
            nested: { type: 'object', properties: { b: { type: 'string', default: 'b' } }, oneOf: [] },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
          nested: { b: 'b' },
        });
      });
      it.each<[string, RJSFSchema, unknown]>([
        ['a string', { type: 'string', default: 'a', oneOf: [] }, 'hello'],
        ['a number', { type: 'number', default: 1, anyOf: [] }, 5],
        ['an enum', { type: 'string', default: 'a', enum: [] }, 'hello'],
      ])(
        'should keep the form data of %s beside an empty option list rather than replace it with the default',
        (_, field, value) => {
          const schema: RJSFSchema = { type: 'object', properties: { field } };
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { field: value } })).toEqual({
            field: value,
          });
          expect(getDefaultFormState({ validator: testValidator }, { schema: field, formData: value })).toEqual(value);
        },
      );
      it('should keep the form data of an array beside an empty anyOf at the root', () => {
        const schema: RJSFSchema = { type: 'array', items: { type: 'string' }, anyOf: [] };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: ['x', 'y'] })).toEqual(['x', 'y']);
      });
      it('should populate defaults for oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              oneOf: [
                { type: 'string', default: 'a' },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
        });
      });
      it('should populate root defaults for oneOf', () => {
        const schema: RJSFSchema = {
          oneOf: [
            {
              properties: {
                first: {
                  title: 'First',
                  type: 'string',
                },
              },
            },
            {
              properties: {
                second: {
                  title: 'Second',
                  type: 'string',
                },
              },
            },
          ],
          default: {
            second: 'Second 2!',
          },
          type: 'object',
        };

        // Mock isValid so that withExactlyOneSubschema works as expected
        testValidator.setReturnValues({
          isValid: [
            false, // First oneOf... first === first
            false, // Second oneOf... second !== first
            false, // Third oneOf... second === second
            true, // Fourth oneOf... second === second
          ],
        });

        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          second: 'Second 2!',
        });
      });
      it('should populate defaults for oneOf when `type`: `object` is missing', () => {
        const schema: RJSFSchema = {
          type: 'object',
          oneOf: [
            {
              properties: { name: { type: 'string', default: 'a' } },
            },
            {
              properties: { id: { type: 'number', default: 13 } },
            },
          ],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
        });
      });
      it('should populate nested default values for oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'object',
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: {
            first: 'First Name',
          },
        });
      });
      it('should not populate nested default values for oneOf, when not required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'object',
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({ name: {} });
      });
      it('should populate nested default values for oneOf, when required is merged in', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'object',
              required: ['first'],
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: '1st Name' },
                  },
                },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({
          name: {
            first: 'First Name',
          },
        });
      });
      it('should populate nested default values merging required fields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['foo', 'bar'],
          properties: {
            foo: {
              type: 'string',
              default: 'fooVal',
            },
          },
          oneOf: [
            {
              properties: {
                bar: {
                  type: 'number',
                },
                baz: {
                  default: 'bazIsRequired',
                },
              },
              required: ['baz'],
            },
          ],
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({ foo: 'fooVal', baz: 'bazIsRequired' });
      });
      it('should populate defaults for oneOf + dependencies', () => {
        const schema: RJSFSchema = {
          oneOf: [
            {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          ],
          dependencies: {
            name: {
              oneOf: [
                {
                  properties: {
                    name: {
                      type: 'string',
                    },
                    grade: {
                      default: 'A',
                    },
                  },
                },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { name: 'Name' } })).toEqual({
          name: 'Name',
          grade: 'A',
        });
      });
      it('should populate defaults for oneOf second option', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: {
              oneOf: [
                { properties: { a: { type: 'string', default: 'a' } } },
                { properties: { b: { type: 'string', default: 'b' } } },
              ],
            },
          },
        };
        // Mock errors so that getMatchingOption works as expected
        testValidator.setReturnValues({ isValid: [false, false, false, true] });
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { test: { b: 'b' } } })).toEqual({
          test: { b: 'b' },
        });
      });
    });
    describe('defaults with anyOf', () => {
      afterEach(() => {
        // Reset the testValidator
        if (typeof testValidator.reset === 'function') {
          testValidator?.reset();
        }
      });
      it("computes an array's defaults from its selected option as it is rendered, meeting the parent's bounds and items", () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: { type: 'object', properties: { a: { type: 'string', default: 'dflt' } } },
          anyOf: [{ items: true, minItems: 1 }, { maxItems: 3 }],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual([{ a: 'dflt' }, { a: 'dflt' }]);
      });
      it("computes an array's defaults from a selected option written as a $ref as from the option it names", () => {
        const schema: RJSFSchema = {
          definitions: { loose: { items: true, minItems: 1 } },
          type: 'array',
          minItems: 2,
          items: { type: 'object', properties: { a: { type: 'string', default: 'dflt' } } },
          anyOf: [{ $ref: '#/definitions/loose' }, { maxItems: 3 }],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual([
          { a: 'dflt' },
          { a: 'dflt' },
        ]);
      });
      describe('a selected option written as a $ref naming an allOf', () => {
        const pet = (field: RJSFSchema): RJSFSchema => ({
          $defs: {
            Base: { type: 'object', properties: { id: { type: 'string', default: 'ID' } } },
            Cat: {
              allOf: [
                { $ref: '#/$defs/Base' },
                { type: 'object', properties: { meow: { type: 'boolean', default: true } } },
              ],
            },
          },
          type: 'object',
          properties: { pet: { ...field, anyOf: [{ $ref: '#/$defs/Cat' }] } },
        });
        it.each<[string, RJSFSchema]>([
          ['that inherits nothing', {}],
          ['that inherits from its field', { minProperties: 1 }],
        ])('leaves the allOf defaults to the allOf behavior for an option %s', (_, field) => {
          const schema = pet(field);
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: { pet: {} } }),
          ).toEqual({ pet: {} });
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
              { schema, rootSchema: schema, formData: { pet: {} } },
            ),
          ).toEqual({ pet: { id: 'ID', meow: true } });
        });
      });
      it("merges a selected option written as a $ref with its field's default, as it merges one written in place", () => {
        const schema: RJSFSchema = {
          $defs: {
            O: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } } },
            S: { type: 'string', default: 'child' },
          },
          type: 'object',
          properties: {
            o: { default: { a: 1 }, anyOf: [{ $ref: '#/$defs/O' }] },
            s: { default: 'parent', anyOf: [{ $ref: '#/$defs/S' }] },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: { o: { b: 2 } } }),
        ).toEqual({ o: { a: 1, b: 2 }, s: 'child' });
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' } },
            { schema, rootSchema: schema, formData: { o: { b: 2 } } },
          ),
        ).toEqual({ o: { a: 1, b: 2 }, s: 'child' });
      });
      it('keeps object data of a schema whose options, read through $refs, take none of it (#5522)', () => {
        const schema: RJSFSchema = {
          definitions: { A: { const: 'a' }, N: { type: 'number' } },
          anyOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/N' }],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { b: 2 } })).toEqual({ b: 2 });
      });
      it.each<[string, RJSFSchema, GenericObjectType]>([
        ['at the root', { type: 'object', additionalProperties: { type: 'string', enum: ['a'] } }, { extra: 'zz' }],
        [
          'nested in an object',
          {
            type: 'object',
            properties: { o: { type: 'object', additionalProperties: { type: 'string', enum: ['a'] } } },
          },
          { o: { extra: 'zz' } },
        ],
      ])('keeps an additional property its field takes none of as the user left it, %s', (_, schema, formData) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it('gives the defaults of a field none of whose options, nor the field itself, takes its object data', () => {
        const schema: RJSFSchema = { type: 'string', default: 'd', anyOf: [{ minLength: 1 }, { maxLength: 5 }] };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { b: 2 } })).toEqual('d');
      });
      it.each<[string, unknown, GenericObjectType]>([
        ['the constant one option holds', { answer: '2' }, { p: { answer: '2' } }],
        ['a constant no option holds', { answer: '3' }, {}],
        ['an object naming no selector value', { other: 1 }, {}],
        ['a value of another type', 'x', { p: 'x' }],
      ])('matches data of a discriminated select over object constants by its selector, for %s', (_, p, expected) => {
        const option = (answer: string): RJSFSchema => ({
          type: 'object',
          properties: { answer: { type: 'string', default: answer } },
          const: { answer },
        });
        const select: RJSFSchema = {
          type: 'object',
          discriminator: { propertyName: 'answer' },
          oneOf: [option('1'), option('2')],
        };
        const schema: RJSFSchema = { type: 'object', properties: { p: select } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { p } })).toEqual(expected);
      });
      it('keeps a value its select no longer offers where no default replaces it', () => {
        const schema: RJSFSchema = { type: 'object', properties: { country: { type: 'string', enum: ['US', 'CA'] } } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { country: 'FR' } })).toEqual({
          country: 'FR',
        });
      });
      it.each<[string, RJSFSchema, GenericObjectType]>([
        ['true', { type: 'object', properties: { x: true } }, { x: { a: 1 } }],
        ['false', { type: 'object', properties: { x: false } }, { x: { a: 1 } }],
        [
          'true, nested',
          { type: 'object', properties: { x: { type: 'object', properties: { y: true } } } },
          { x: { y: { a: 1 } } },
        ],
      ])('keeps object data under a property whose schema is %s as it is', (_, schema, formData) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it.each<[string, RJSFSchema, GenericObjectType]>([
        [
          'an untyped property with an object default',
          { type: 'object', properties: { x: { default: { a: 1 } } } },
          { x: { a: 5 } },
        ],
        [
          'an untyped property under an object parent default',
          { type: 'object', default: { x: { a: 1 } }, properties: { x: {} } },
          { x: { a: 5 } },
        ],
        [
          'a type list property with an object default',
          { type: 'object', properties: { x: { type: ['array', 'object'], default: { a: 1 } } } },
          { x: { a: 5 } },
        ],
        [
          'an untyped property nested in an object',
          { type: 'object', properties: { x: { type: 'object', properties: { y: { default: { a: 1 } } } } } },
          { x: { y: { a: 5 } } },
        ],
      ])('keeps object data over the defaults of %s', (_, schema, formData) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it.each<[string, RJSFSchema, GenericObjectType]>([
        [
          'an integer',
          { type: 'object', default: { v: null }, properties: { v: { type: 'integer', default: 1 } } },
          { v: 1 },
        ],
        [
          'a boolean',
          { type: 'object', default: { b: null }, properties: { b: { type: 'boolean', default: true } } },
          { b: true },
        ],
        [
          'a tuple',
          {
            type: 'object',
            default: { t: null },
            properties: { t: { type: 'array', items: [{ type: 'integer', default: 1 }] } },
          },
          { t: [1] },
        ],
        [
          'an object, under a false ancestor default',
          {
            type: 'object',
            default: { o: false },
            properties: { o: { type: 'object', properties: { a: { type: 'number' } }, default: { a: 2 } } },
          },
          { o: { a: 2 } },
        ],
      ])(
        "gives a property's own default over an empty ancestor default its type can't hold, for %s, when ancestorWins",
        (_, schema, expected) => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' } },
              { schema },
            ),
          ).toEqual(expected);
        },
      );
      it('stops following a selected option written as a $ref once it leads back to a $ref already followed', () => {
        const schema: RJSFSchema = {
          definitions: {
            a: { type: 'string', anyOf: [{ $ref: '#/definitions/b' }, { minLength: 1 }] },
            b: { type: 'string', default: 'b', anyOf: [{ $ref: '#/definitions/a' }, { maxLength: 3 }] },
          },
          $ref: '#/definitions/a',
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual('b');
      });
      it("computes a tuple's defaults from its selected option as it is rendered", () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'string', default: 'a' }],
          additionalItems: { type: 'string', default: 'z' },
          anyOf: [{ minItems: 3 }, { maxItems: 5 }],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual(['a', 'z', 'z']);
      });
      it("seeds a field's selected option with the field's default, whether the option is a schema or true", () => {
        const schema: RJSFSchema = { type: 'string', default: 'x', anyOf: [true, { minLength: 1 }] };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual('x');
        expect(getDefaultFormState({ validator: testValidator }, { schema: { ...schema, anyOf: [{}] } })).toEqual('x');
      });
      it("adds both options' defaults to an object whose type comes through its allOf, as to one declaring it", () => {
        const field: RJSFSchema = {
          allOf: [{ $ref: '#/definitions/Base' }],
          anyOf: [{ properties: { a: { type: 'string', default: 'A' } } }],
          oneOf: [{ properties: { b: { type: 'string', default: 'B' } } }],
        };
        const withField = (v: RJSFSchema): RJSFSchema => ({
          definitions: { Base: { type: 'object', properties: { id: { type: 'string' } } } },
          type: 'object',
          properties: { v },
        });
        const expected = { v: { a: 'A', b: 'B' } };
        expect(getDefaultFormState({ validator: testValidator }, { schema: withField(field) })).toEqual(expected);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema: withField({ ...field, type: 'object' }) }),
        ).toEqual(expected);
      });
      it('should not populate defaults for empty anyOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              anyOf: [],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({});
      });
      it('should populate defaults from the schema itself beside an empty anyOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'a', anyOf: [] },
            nested: { type: 'object', properties: { b: { type: 'string', default: 'b' } }, anyOf: [] },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
          nested: { b: 'b' },
        });
      });
      it('should merge a default beside an empty anyOf with its parent default, as it would without the anyOf', () => {
        const child: RJSFSchema = {
          type: 'object',
          default: { b: 2 },
          properties: { a: { type: 'number' }, b: { type: 'number' } },
        };
        const withParent = (c: RJSFSchema): RJSFSchema => ({
          type: 'object',
          properties: { p: { type: 'object', default: { c: { a: 1 } }, properties: { c } } },
        });
        const expected = getDefaultFormState({ validator: testValidator }, { schema: withParent(child), formData: {} });
        expect(expected).toEqual({ p: { c: { a: 1, b: 2 } } });
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema: withParent({ ...child, anyOf: [] }), formData: {} },
          ),
        ).toEqual(expected);
      });
      it('should populate defaults for anyOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              anyOf: [
                { type: 'string', default: 'a' },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
        });
      });
      it('should populate root defaults for anyOf', () => {
        const schema: RJSFSchema = {
          anyOf: [
            {
              properties: {
                first: {
                  title: 'First',
                  type: 'string',
                },
              },
            },
            {
              properties: {
                second: {
                  title: 'Second',
                  type: 'string',
                },
              },
            },
          ],
          default: {
            second: 'Second 2!',
          },
          type: 'object',
        };

        // Mock isValid so that withExactlyOneSubschema works as expected
        testValidator.setReturnValues({
          isValid: [
            false, // First anyOf... first === first
            false, // Second anyOf... second !== first
            false, // Third anyOf... second === second
            true, // Fourth anyOf... second === second
          ],
        });

        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          second: 'Second 2!',
        });
      });
      it('should populate nested default values for anyOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'object',
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: {
            first: 'First Name',
          },
        });
      });
      it('should not populate nested default values for anyOf, when not required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'object',
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({ name: {} });
      });
      it('should populate nested default values for anyOf, when required is merged in', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'object',
              required: ['first'],
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: '1st Name' },
                  },
                },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({
          name: {
            first: 'First Name',
          },
        });
      });
      it('should populate nested default values merging required fields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['foo', 'bar'],
          properties: {
            foo: {
              type: 'string',
              default: 'fooVal',
            },
          },
          anyOf: [
            {
              properties: {
                bar: {
                  type: 'number',
                },
                baz: {
                  default: 'bazIsRequired',
                },
              },
              required: ['baz'],
            },
          ],
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({ foo: 'fooVal', baz: 'bazIsRequired' });
      });
      it('should populate defaults for anyOf + dependencies', () => {
        const schema: RJSFSchema = {
          anyOf: [
            {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          ],
          dependencies: {
            name: {
              oneOf: [
                {
                  properties: {
                    name: {
                      type: 'string',
                    },
                    grade: {
                      type: 'string',
                      default: 'A',
                    },
                  },
                },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { name: 'Name' } })).toEqual({
          name: 'Name',
          grade: 'A',
        });
      });
      it('should populate defaults for anyOf second option', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: {
              anyOf: [
                { properties: { a: { type: 'string', default: 'a' } } },
                { properties: { b: { type: 'string', default: 'b' } } },
              ],
            },
          },
        };
        // Mock errors so that getMatchingOption works as expected
        testValidator.setReturnValues({ isValid: [false, false, false, true] });
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { test: { b: 'b' } } })).toEqual({
          test: { b: 'b' },
        });
      });
    });
    describe('with dependencies', () => {
      it.each([
        'inline',
        'allOf',
        '$ref',
        'inside allOf',
        '$ref inside allOf',
        'nested allOf',
        'properties outside allOf',
      ])('should populate dependency defaults when formData is undefined with %s', (variant) => {
        testValidator.setReturnValues({ isValid: [true, false] });
        const dependencySchema: RJSFSchema = {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'integer', default: 0 },
          },
          dependencies: {
            type: {
              oneOf: [
                {
                  properties: {
                    type: { enum: [0] },
                    value: { type: 'integer', default: 5 },
                  },
                  required: ['value'],
                },
                {
                  properties: {
                    type: { enum: [1] },
                  },
                },
              ],
            },
          },
        };
        let schema = dependencySchema;
        if (variant === '$ref') {
          schema = { $ref: '#/definitions/dep', definitions: { dep: dependencySchema } };
        } else if (variant === 'allOf') {
          schema = {
            ...dependencySchema,
            allOf: [{ properties: { fromAllOf: { type: 'string', default: 'A' } } }],
          };
        } else if (variant === 'inside allOf') {
          schema = { type: 'object', allOf: [dependencySchema] };
        } else if (variant === '$ref inside allOf') {
          schema = {
            type: 'object',
            allOf: [{ $ref: '#/definitions/dep' }],
            definitions: { dep: dependencySchema },
          };
        } else if (variant === 'nested allOf') {
          schema = { type: 'object', allOf: [{ allOf: [dependencySchema] }] };
        } else if (variant === 'properties outside allOf') {
          schema = {
            type: 'object',
            properties: dependencySchema.properties,
            allOf: [{ dependencies: dependencySchema.dependencies }],
          };
        }
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          type: 0,
          value: 5,
          ...(variant === 'allOf' ? { fromAllOf: 'A' } : {}),
        });
      });
      it('should count a default as the value of a root dependencies entry whatever else the form data holds, as a nested entry does', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { animal: { type: 'string', default: 'Cat' }, other: { type: 'string' } },
          dependencies: { animal: { properties: { food: { type: 'string', default: 'meat' } } } },
        };
        const nested: RJSFSchema = { type: 'object', properties: { n: schema } };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { other: 'x' }, rootSchema: schema }),
        ).toEqual({ animal: 'Cat', other: 'x', food: 'meat' });
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema: nested, formData: { n: { other: 'x' } }, rootSchema: nested },
          ),
        ).toEqual({ n: { animal: 'Cat', other: 'x', food: 'meat' } });
      });
      it('should populate dependency defaults when formData is an empty object', () => {
        testValidator.setReturnValues({ isValid: [true] });
        const schema: RJSFSchema = {
          type: 'object',
          properties: { type: { type: 'integer', default: 0 } },
          dependencies: {
            type: {
              oneOf: [{ properties: { type: { enum: [0] }, value: { type: 'integer', default: 5 } } }],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {}, rootSchema: schema })).toEqual(
          { type: 0, value: 5 },
        );
      });
      it.each([undefined, {}])(
        'should resolve dependency references without rootSchema and with formData=%j',
        (formData) => {
          testValidator.setReturnValues({ isValid: [true] });
          const schema: RJSFSchema = {
            type: 'object',
            definitions: { extra: { type: 'string', default: 'RefDefault' } },
            properties: { type: { type: 'integer', default: 0 } },
            dependencies: {
              type: {
                oneOf: [{ properties: { type: { enum: [0] }, extraField: { $ref: '#/definitions/extra' } } }],
              },
            },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual({
            type: 0,
            extraField: 'RefDefault',
          });
        },
      );
      describe.each(['oneOf', 'anyOf'])('inside %s', (keyword) => {
        it.each([undefined, {}])(
          'should resolve dependency references without rootSchema and with formData=%j',
          (formData) => {
            const schema: RJSFSchema = {
              type: 'object',
              definitions: { extra: { type: 'string', default: 'RefDefault' } },
              [keyword]: [
                {
                  properties: { type: { type: 'integer', default: 0 } },
                  dependencies: {
                    type: {
                      properties: { extraField: { $ref: '#/definitions/extra' } },
                    },
                  },
                },
              ],
            };
            expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual({
              type: 0,
              extraField: 'RefDefault',
            });
          },
        );
      });
      it('should preserve dependency defaults when resolving a conditional branch', () => {
        const schema: RJSFSchema = {
          type: 'object',
          if: {},
          then: {
            properties: { name: { type: 'string', default: 'Name' } },
            dependencies: { name: { properties: { grade: { type: 'string', default: 'A' } } } },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({ name: 'Name', grade: 'A' });
      });
      it('should preserve dependency defaults when merging matching pattern properties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            child: {
              type: 'object',
              properties: { name: { type: 'string', default: 'Name' } },
              dependencies: { name: { properties: { grade: { type: 'string', default: 'A' } } } },
            },
          },
          patternProperties: { '^child$': { type: 'object' } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          child: { name: 'Name', grade: 'A' },
        });
      });
      it('should populate defaults for dependencies', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          dependencies: {
            name: {
              oneOf: [
                {
                  properties: {
                    name: {
                      type: 'string',
                    },
                    grade: {
                      type: 'string',
                      default: 'A',
                    },
                  },
                },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { name: 'Name' } })).toEqual({
          name: 'Name',
          grade: 'A',
        });
      });
      it('should populate defaults for nested dependencies', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
              dependencies: {
                name: {
                  oneOf: [
                    {
                      properties: {
                        name: {
                          type: 'string',
                        },
                        grade: {
                          type: 'string',
                          default: 'A',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { foo: { name: 'Name' } } }),
        ).toEqual({
          foo: {
            name: 'Name',
            grade: 'A',
          },
        });
      });
      it('should populate defaults for nested dependencies in arrays', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            properties: {
              foo: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                },
                dependencies: {
                  name: {
                    oneOf: [
                      {
                        properties: {
                          name: {
                            type: 'string',
                          },
                          grade: {
                            type: 'string',
                            default: 'A',
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: [{ foo: { name: 'Name' } }] }),
        ).toEqual([
          {
            foo: {
              name: 'Name',
              grade: 'A',
            },
          },
        ]);
      });
      it('should populate defaults for nested dependencies in arrays that sit below another object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            outer: {
              type: 'object',
              properties: {
                rows: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                    },
                    dependencies: {
                      name: {
                        oneOf: [
                          {
                            properties: {
                              name: {
                                type: 'string',
                              },
                              grade: {
                                type: 'string',
                                default: 'A',
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { outer: { rows: [{ name: 'Name' }] } } },
          ),
        ).toEqual({
          outer: {
            rows: [
              {
                name: 'Name',
                grade: 'A',
              },
            ],
          },
        });
      });
      it("applies a dependency's oneOf option that declares the property in an allOf entry", () => {
        testValidator.setReturnValues({ isValid: [false, true] });
        const schema: RJSFSchema = {
          type: 'object',
          properties: { k: { type: 'string', enum: ['a', 'b'] } },
          dependencies: {
            k: {
              oneOf: [
                {
                  allOf: [{ properties: { k: { enum: ['a'] } } }],
                  properties: { ka: { type: 'string', default: 'A' } },
                },
                {
                  allOf: [{ properties: { k: { enum: ['b'] } } }],
                  properties: { kb: { type: 'string', default: 'B' } },
                },
              ],
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: { k: 'b' } }),
        ).toEqual({ k: 'b', kb: 'B' });
      });
      it('should populate defaults for nested dependencies in arrays when matching enum values in oneOf', () => {
        // Mock isValid so that withExactlyOneSubschema works as expected
        testValidator.setReturnValues({
          isValid: [
            true, // First oneOf... first === first
            false, // Second oneOf... second !== first
            false, // First oneOf... first !== second
            true, // Second oneOf... second === second
          ],
        });
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            properties: {
              foo: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                },
                dependencies: {
                  name: {
                    oneOf: [
                      {
                        properties: {
                          name: {
                            enum: ['first'],
                          },
                          grade: {
                            type: 'string',
                            default: 'A',
                          },
                        },
                      },
                      {
                        properties: {
                          name: {
                            enum: ['second'],
                          },
                          grade: {
                            type: 'string',
                            default: 'B',
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: [{ foo: { name: 'first' } }, { foo: { name: 'second' } }, { foo: { name: 'third' } }] },
          ),
        ).toEqual([
          {
            foo: {
              name: 'first',
              grade: 'A',
            },
          },
          {
            foo: {
              name: 'second',
              grade: 'B',
            },
          },
          {
            foo: {
              name: 'third',
            },
          },
        ]);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          `ignoring oneOf in dependencies of "name" because there isn't exactly one subschema that is valid`,
        );
      });
      it('should populate defaults for nested oneOf + dependencies', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: {
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                  },
                },
              ],
              dependencies: {
                name: {
                  oneOf: [
                    {
                      properties: {
                        name: {
                          type: 'string',
                        },
                        grade: {
                          type: 'string',
                          default: 'A',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { foo: { name: 'Name' } } }),
        ).toEqual({
          foo: {
            name: 'Name',
            grade: 'A',
          },
        });
      });
      it('should populate defaults for properties to ensure the dependencies conditions are resolved based on it', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['authentication'],
          properties: {
            authentication: {
              title: 'Authentication',
              type: 'object',
              properties: {
                credentialType: {
                  title: 'Credential type',
                  type: 'string',
                  default: 'username',
                  oneOf: [
                    {
                      const: 'username',
                      title: 'Username and password',
                    },
                    {
                      const: 'secret',
                      title: 'SSO',
                    },
                  ],
                },
              },
              dependencies: {
                credentialType: {
                  allOf: [
                    {
                      if: {
                        properties: {
                          credentialType: {
                            const: 'username',
                          },
                        },
                      },
                      then: {
                        properties: {
                          usernameAndPassword: {
                            type: 'object',
                            properties: {
                              username: {
                                type: 'string',
                                title: 'Username',
                              },
                              password: {
                                type: 'string',
                                title: 'Password',
                              },
                            },
                            required: ['username', 'password'],
                          },
                        },
                        required: ['usernameAndPassword'],
                      },
                    },
                    {
                      if: {
                        properties: {
                          credentialType: {
                            const: 'secret',
                          },
                        },
                      },
                      then: {
                        properties: {
                          sso: {
                            type: 'string',
                            title: 'SSO',
                          },
                        },
                        required: ['sso'],
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          authentication: {
            credentialType: 'username',
            usernameAndPassword: {},
          },
        });
      });
      it('should populate defaults for nested dependencies when formData passed to computeDefaults is undefined', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            can_1: {
              type: 'object',
              properties: {
                phy: {
                  title: 'Physical',
                  description: 'XYZ',
                  type: 'object',
                  properties: {
                    bit_rate_cfg_mode: {
                      title: 'Sub title',
                      description: 'XYZ',
                      type: 'integer',
                      default: 0,
                    },
                  },
                  dependencies: {
                    bit_rate_cfg_mode: {
                      oneOf: [
                        {
                          properties: {
                            bit_rate_cfg_mode: {
                              enum: [0],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          can_1: {
            phy: {
              bit_rate_cfg_mode: 0,
            },
          },
        });
      });
      it('should not crash for defaults for nested dependencies when formData passed to computeDefaults is null', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            can_1: {
              type: 'object',
              properties: {
                phy: {
                  title: 'Physical',
                  description: 'XYZ',
                  type: 'object',
                  properties: {
                    bit_rate_cfg_mode: {
                      title: 'Sub title',
                      description: 'XYZ',
                      type: 'integer',
                      default: 0,
                    },
                  },
                  dependencies: {
                    bit_rate_cfg_mode: {
                      oneOf: [
                        {
                          properties: {
                            bit_rate_cfg_mode: {
                              enum: [0],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { can_1: { phy: null } } }),
        ).toEqual({
          can_1: {
            phy: null,
          },
        });
      });
    });
    describe('with schema keys not defined in the formData', () => {
      it('shouldn`t add in undefined keys to formData', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };
        const formData = {
          foo: 'foo',
          baz: 'baz',
        };
        const result = {
          foo: 'foo',
          baz: 'baz',
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(result);
      });
    });
    describe('object with defaults and undefined in formData, testing mergeDefaultsIntoFormData', () => {
      let schema: RJSFSchema;
      let defaultedFormData: any;
      beforeAll(() => {
        schema = {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['field'],
        };
        defaultedFormData = { field: 'foo' };
      });
      it('returns field value of default when formData is empty', () => {
        const formData = {};
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(defaultedFormData);
      });
      it('returns field value of undefined when formData has undefined for field', () => {
        const formData = { field: undefined };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it('returns field value of default when formData has undefined for field and `useDefaultIfFormDataUndefined`', () => {
        const formData = { field: undefined };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
              },
            },
            { schema, formData },
          ),
        ).toEqual(defaultedFormData);
      });
    });
    it('should return undefined defaults for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
          },
        },
      };
      expect(
        getDefaultFormState(
          { validator: testValidator },
          { schema, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({
        requiredArray: [undefined, undefined],
      });
    });
    it('should not combine defaults with raw form data for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
          },
        },
      };
      expect(
        getDefaultFormState(
          { validator: testValidator },
          { schema, formData: { requiredArray: ['raw0'] }, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({
        requiredArray: ['raw0'],
      });
    });
    it('should combine ALL defaults with raw form data for a array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
          },
        },
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: { mergeExtraDefaults: true },
            },
          },
          { schema, formData: { requiredArray: ['raw0'] }, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({
        requiredArray: ['raw0', undefined],
      });
    });
    it('should return given defaults for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string', default: 'default0' },
            minItems: 2,
          },
        },
        required: ['requiredArray'],
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: { populate: 'requiredOnly' },
            },
          },
          { schema, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({ requiredArray: ['default0', 'default0'] });
    });
    it('should not combine defaults with raw form data for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string', default: 'default0' },
            minItems: 2,
          },
        },
        required: ['requiredArray'],
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: { populate: 'requiredOnly' },
            },
          },
          { schema, formData: { requiredArray: ['raw0'] }, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({ requiredArray: ['raw0'] });
    });
    it('should combine ALL defaults with raw form data for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string', default: 'default0' },
            minItems: 2,
          },
        },
        required: ['requiredArray'],
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: { populate: 'requiredOnly', mergeExtraDefaults: true },
            },
          },
          { schema, formData: { requiredArray: ['raw0'] }, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({ requiredArray: ['raw0', 'default0'] });
    });
    it('should not populate defaults for array items when computeSkipPopulate returns true', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          stringArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          numberArray: {
            type: 'array',
            items: { type: 'number' },
            minItems: 1,
          },
        },
        required: ['stringArray', 'numberArray'],
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: {
                computeSkipPopulate: (_, schema) =>
                  !Array.isArray(schema?.items) &&
                  typeof schema?.items !== 'boolean' &&
                  schema?.items?.type === 'number',
              },
            },
          },
          { schema, formData: {}, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({ stringArray: [undefined], numberArray: [] });
    });
    it('handles a `null` default value', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          empty: {
            type: 'null',
            default: null,
          },
        },
      };
      expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {}, rootSchema: schema })).toEqual({
        empty: null,
      });
    });

    describe.each(['skipDefaults', 'populateRequiredDefaults'] as const)(
      'the null of a missing null value under emptyObjectFields: %s',
      (emptyObjectFields) => {
        const defaultsOf = (schema: RJSFSchema, formData?: unknown) =>
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
            { schema, formData, rootSchema: schema },
          );

        it('is filled in for an optional property, through a `$ref` and inside an optional object', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              n: { type: 'null' },
              viaRef: { $ref: '#/$defs/alias' },
              o: { type: 'object', properties: { n: { $ref: '#/$defs/none' }, s: { type: 'string', default: 'x' } } },
            },
            $defs: { alias: { $ref: '#/$defs/none' }, none: { type: 'null' } },
          };
          expect(defaultsOf(schema)).toEqual({ n: null, viaRef: null, o: { n: null } });
        });

        it('is filled in again when the same schema is read a second time in the same context', () => {
          const context = { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } };
          const schema: RJSFSchema = { type: 'object', properties: { n: { type: 'null' } } };
          expect(getDefaultFormState(context, { schema, rootSchema: schema })).toEqual({ n: null });
          expect(getDefaultFormState(context, { schema, rootSchema: schema })).toEqual({ n: null });
        });

        it.each<[string, RJSFSchema, unknown?]>([
          ['allOf', { type: 'object', allOf: [{ properties: { n: { type: 'null' } }, required: ['n'] }] }],
          [
            'if/then',
            {
              type: 'object',
              properties: { k: { type: 'string' } },
              if: { properties: { k: { const: 'x' } } },
              then: { properties: { n: { type: 'null' } } },
            },
          ],
          [
            'dependencies',
            {
              type: 'object',
              properties: { k: { type: 'string' } },
              dependencies: { k: { properties: { n: { type: 'null' } } } },
            },
            { a: { k: 'x' } },
          ],
        ])('is filled in inside an optional object for a property its %s brings in', (_, objectSchema, formData) => {
          const schema: RJSFSchema = { type: 'object', properties: { a: objectSchema } };
          expect(defaultsOf(schema, formData)).toEqual({ a: expect.objectContaining({ n: null }) });
        });

        it('is filled in for a property that is null only through its own allOf or if/then/else', () => {
          const schema: RJSFSchema = {
            type: 'object',
            required: ['wrapped', 'plain', 'conditional'],
            properties: {
              wrapped: { description: 'x', allOf: [{ $ref: '#/$defs/none' }] },
              plain: { allOf: [{ type: 'null' }] },
              conditional: { if: { minLength: 1 }, then: { type: 'null' }, else: { type: 'null' } },
            },
            $defs: { none: { type: 'null' } },
          };
          expect(defaultsOf(schema)).toEqual({ wrapped: null, plain: null, conditional: null });
        });

        it("is filled in for an own property the object's allOf makes null", () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              a: {
                type: 'object',
                properties: { n: { title: 'N' } },
                allOf: [{ properties: { n: { type: 'null' } }, required: ['n'] }],
              },
            },
          };
          expect(defaultsOf(schema)).toEqual({ a: { n: null } });
        });

        it("is filled in as an own key for a property named __proto__ the object's allOf makes null", () => {
          const schema: RJSFSchema = JSON.parse(
            '{"type":"object","properties":{"a":{"type":"object","properties":{"__proto__":{"title":"P"}},"allOf":[{"properties":{"__proto__":{"type":"null"}},"required":["__proto__"]}]}}}',
          );
          const result = defaultsOf(schema);
          const a = isObject(result) ? result.a : undefined;
          expect(Object.getPrototypeOf(a)).toBe(Object.prototype);
          expect(Object.getOwnPropertyDescriptor(a, '__proto__')).toMatchObject({ value: null, enumerable: true });
        });

        it('is filled in for an array item and an additional property the data holds', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              arr: {
                type: 'array',
                items: { type: 'object', properties: { n: { type: 'null' }, s: { type: 'string' } }, required: ['n'] },
              },
              extra: { type: 'object', additionalProperties: { type: 'object', properties: { n: { type: 'null' } } } },
            },
          };
          expect(defaultsOf(schema, { arr: [{ s: 'x' }], extra: { k: {} } })).toEqual({
            arr: [{ s: 'x', n: null }],
            extra: { k: { n: null } },
          });
        });

        it('is filled in for a null schema with a `default: null`, directly and through a `$ref`', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              d: { type: 'null', default: null },
              o: { type: 'object', properties: { d: { type: 'null', default: null } } },
              r: { $ref: '#/$defs/nullDefault' },
            },
            $defs: { nullDefault: { type: 'null', default: null } },
          };
          expect(defaultsOf(schema)).toEqual({ d: null, o: { d: null }, r: null });
        });

        it('is not added for an optional object the optional data controls render without its fields', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { o: { type: 'object', properties: { n: { type: 'null' }, s: { type: 'string' } } } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
              {
                schema,
                rootSchema: schema,
                uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
              },
            ),
          ).toEqual({});
        });

        it('is not looked for in an allOf that brings in no property', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'object', allOf: [{ minProperties: 0 }] } },
          };
          expect(defaultsOf(schema)).toEqual({});
        });

        it('is filled in for a property an allOf of the root brings in', () => {
          const schema: RJSFSchema = { type: 'object', allOf: [{ properties: { n: { type: 'null' } } }] };
          expect(defaultsOf(schema)).toEqual({ n: null });
        });

        it('is filled in alone among the properties an allOf brings in', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              a: {
                type: 'object',
                allOf: [{ properties: { s: { type: 'string', default: 'x' }, n: { type: 'null' } } }],
              },
            },
          };
          expect(defaultsOf(schema)).toEqual({ a: { n: null } });
        });

        it('is filled in for a property an allOf brings into an item of a tuple', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              pair: {
                type: 'array',
                items: [{ type: 'object', allOf: [{ properties: { n: { type: 'null' } } }] }],
              },
            },
          };
          expect(defaultsOf(schema, { pair: [{}] })).toEqual({ pair: [{ n: null }] });
        });

        it('is looked for, and not found, in an allOf that brings in no property of a schema that allows null', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              a: { type: 'object', allOf: [{ minProperties: 0 }] },
              s: { type: ['string', 'null'] },
              t: { type: ['string', 'number'] },
            },
          };
          expect(defaultsOf(schema)).toEqual({});
        });

        it('is not added for a `default: null` of another type', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              s: { type: 'string', default: null },
              viaRef: { $ref: '#/$defs/text', default: null },
              o: { type: 'object', properties: { s: { type: 'string', default: 'x' } } },
            },
            $defs: { text: { $ref: '#/$defs/string' }, string: { type: 'string' } },
          };
          expect(defaultsOf(schema)).toEqual({});
        });
      },
    );

    describe.each(['populateAllDefaults', 'populateRequiredDefaults', 'skipEmptyDefaults', 'skipDefaults'] as const)(
      'an optional object the optional data controls render collapsed, under emptyObjectFields: %s',
      (emptyObjectFields) => {
        const collapsedDefaultsOf = (schema: RJSFSchema) =>
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
            {
              schema,
              rootSchema: schema,
              uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
            },
          );

        it('is left out with the null schema it holds, as it would be without one', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              opt: { type: 'object', required: ['s'], properties: { s: { type: 'string' }, n: { type: 'null' } } },
            },
          };
          expect(collapsedDefaultsOf(schema)).toEqual({});
        });

        it('fills in no null in an optional object inside it', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              opt: {
                type: 'object',
                properties: { inner: { type: 'object', properties: { n: { type: 'null' } } } },
              },
            },
          };
          expect(collapsedDefaultsOf(schema)).toEqual({});
        });

        it.each<[string, (opt: RJSFSchema) => RJSFSchema]>([
          ['an allOf', (opt) => ({ type: 'object', allOf: [{ properties: { opt } }] })],
          [
            'an if/then',
            (opt) => ({ type: 'object', if: { properties: { s: { const: 'x' } } }, then: { properties: { opt } } }),
          ],
        ])('is left out where %s of an object below the root brings it in, as where the object names it', (_, of) => {
          const opt: RJSFSchema = { type: 'object', properties: { n: { type: 'null' } } };
          const withOpt = (o: RJSFSchema): RJSFSchema => ({
            type: 'object',
            required: ['o'],
            properties: { o: { ...o, properties: { s: { type: 'string' }, ...o.properties } } },
          });
          const defaultsOf = (schema: RJSFSchema) =>
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
              {
                schema,
                rootSchema: schema,
                formData: { o: { s: 'x' } },
                uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
              },
            );
          const broughtIn = defaultsOf(withOpt(of(opt)));
          expect(broughtIn).toEqual({ o: { s: 'x' } });
          expect(broughtIn).toEqual(defaultsOf(withOpt({ type: 'object', properties: { opt } })));
        });

        it('fills in no null in one the data holds as an empty object, which the controls show as holding none', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { opt: { type: 'object', properties: { n: { type: 'null' } } } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
              {
                schema,
                rootSchema: schema,
                formData: { opt: {} },
                uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
              },
            ),
          ).toEqual({ opt: {} });
        });

        it('fills in the null of one its own defaults add, which renders its fields', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              opt: { type: 'object', properties: { s: { type: 'string', default: 'x' }, n: { type: 'null' } } },
            },
          };
          // The settings that add an optional object holding a default
          const isAdded = emptyObjectFields === 'populateAllDefaults' || emptyObjectFields === 'skipEmptyDefaults';
          expect(collapsedDefaultsOf(schema)).toEqual(isAdded ? { opt: { s: 'x', n: null } } : {});
        });

        it('still fills in the null of a required one, which renders its fields', () => {
          const schema: RJSFSchema = {
            type: 'object',
            required: ['req'],
            properties: { req: { type: 'object', properties: { n: { type: 'null' } } } },
          };
          expect(collapsedDefaultsOf(schema)).toEqual({ req: { n: null } });
        });

        it('is left out when the `ui:definitions` entry of the definition it references asks for the controls', () => {
          const schema: RJSFSchema = {
            type: 'object',
            definitions: { Opt: { type: 'object', properties: { n: { type: 'null' } } } },
            properties: { opt: { $ref: '#/definitions/Opt' } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
              {
                schema,
                rootSchema: schema,
                uiSchema: {
                  'ui:definitions': {
                    '#/definitions/Opt': { 'ui:options': { enableOptionalDataFieldForType: ['object'] } },
                  },
                },
              },
            ),
          ).toEqual({});
        });
      },
    );

    describe('an optional object an allOf of an object below the root brings in', () => {
      const opt: RJSFSchema = { type: 'object', properties: { n: { type: 'null' } } };

      it('is left out when its own uiSchema entry asks for the optional data controls', () => {
        // A property schema of `true` beside it, which names no field of its own
        const schema: RJSFSchema = {
          type: 'object',
          required: ['o'],
          properties: { o: { type: 'object', allOf: [{ properties: { opt, any: true } }] } },
        };
        const formData: GenericObjectType = { o: {} };
        const uiSchema: UiSchema<GenericObjectType> = {
          o: { opt: { 'ui:options': { enableOptionalDataFieldForType: ['object'] } } },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData, uiSchema }),
        ).toEqual({ o: {} });
      });

      it('is left out as an additional property when the entry its additional properties share asks for the controls', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['o'],
          properties: { o: { type: 'object', allOf: [{ additionalProperties: opt }] } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema,
              rootSchema: schema,
              formData: { o: { k: undefined } },
              uiSchema: {
                o: { additionalProperties: { 'ui:options': { enableOptionalDataFieldForType: ['object'] } } },
              },
            },
          ),
        ).toEqual({ o: { k: undefined } });
      });
    });

    describe('a null the user left in the data', () => {
      const nullableItems: RJSFSchema = { type: 'array', items: { type: ['string', 'null'], default: 'd' } };
      it.each<[string, RJSFSchema, unknown, unknown]>([
        ['an item of a type list', nullableItems, [null], [null]],
        [
          'an item offering anyOf options',
          { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'null' }], default: 'd' } },
          [null],
          [null],
        ],
        [
          'an array inside an object',
          { type: 'object', properties: { a: nullableItems } },
          { a: [null, 'x'] },
          { a: [null, 'x'] },
        ],
        ['a tuple entry', { type: 'array', items: [{ type: ['string', 'null'], default: 'd' }] }, [null], [null]],
      ])('is kept for %s', (_name, schema, formData, expected) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData, initialDefaultsGenerated: true }),
        ).toEqual(expected);
      });
      it.each<NonNullable<DefaultFormStateBehavior['emptyObjectFields']>>([
        'populateAllDefaults',
        'populateRequiredDefaults',
        'skipEmptyDefaults',
        'skipDefaults',
      ])('is kept for the keys of an object under emptyObjectFields %s', (emptyObjectFields) => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            a: { type: ['string', 'null'], default: 'd' },
            o: { type: ['object', 'null'], properties: { x: { type: 'string', default: 'd' } } },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
            { schema, formData: { a: null, o: null } },
          ),
        ).toEqual({ a: null, o: null });
      });
      it('takes the default under useDefaultIfFormDataUndefined', () => {
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
            },
            { schema: nullableItems, formData: [null] },
          ),
        ).toEqual(['d']);
      });
      it('takes the default as the whole form data', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema: { type: ['string', 'null'], default: 'd' }, formData: null },
          ),
        ).toBe('d');
      });
    });

    describe('where a null fill can come from', () => {
      it('is filled in from a definition a typeless allOf reaches through a $ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { n: { allOf: [{ $ref: '#/definitions/Nothing' }] } },
          definitions: { Nothing: { type: 'null' } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({ n: null });
      });

      it("fills in nothing from an object's allOf that declares no properties, whatever else the root holds", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { n: { type: 'null' }, o: { type: 'object', allOf: [{ $ref: '#/definitions/Described' }] } },
          definitions: { Described: { description: 'An object' } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({ n: null });
      });
    });

    describe('the null of a null value the data holds as `undefined`', () => {
      it('is filled in, as for a missing one', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['n'],
          properties: {
            n: { type: 'null' },
            s: { type: 'string' },
            a: { type: 'object', properties: { n: { type: 'null' } } },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, formData: { n: undefined, s: 'a', a: { n: undefined } } },
          ),
        ).toEqual({ n: null, s: 'a', a: { n: null } });
      });

      it('is filled in for an object schema with an object `default` and no `type`, leaving the data as it was', () => {
        const schema: RJSFSchema = {
          properties: {
            n: { type: 'null' },
            s: { type: 'string' },
            a: { type: 'object', properties: { n: { type: 'null' } } },
            arr: { type: 'array', items: { type: 'object', properties: { n: { type: 'null' } } } },
          },
          default: {},
        };
        const formData = { n: undefined, s: 'a', a: { n: undefined }, arr: [{ n: undefined }] };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData })).toEqual({
          n: null,
          s: 'a',
          a: { n: null },
          arr: [{ n: null }],
        });
        expect(formData).toEqual({ n: undefined, s: 'a', a: { n: undefined }, arr: [{ n: undefined }] });
      });

      it.each<[string, RJSFSchema]>([
        ['an additional property', { type: 'object', additionalProperties: { type: 'null' } }],
        ['a property an allOf brings in', { type: 'object', allOf: [{ properties: { n: { type: 'null' } } }] }],
      ])('is filled in for %s of an object below the root, as for one of the root', (_, nested) => {
        const schema: RJSFSchema = { type: 'object', properties: { o: nested } };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, formData: { o: { n: undefined } } },
          ),
        ).toEqual({ o: { n: null } });
      });

      it('is not filled in for a value of another type', () => {
        const schema: RJSFSchema = { type: 'object', properties: { s: { type: 'string', default: null } } };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: { s: undefined } }),
        ).toEqual({ s: undefined });
      });

      // The data's `undefined` wins over every default of the object, as it does for an object that holds no null schema
      const holder: RJSFSchema = {
        type: 'object',
        properties: { n: { type: 'null' }, s: { type: 'string', default: 'x' } },
      };
      it.each<[string, RJSFSchema, GenericObjectType, boolean]>([
        ['a property', { type: 'object', properties: { p: holder } }, { p: undefined }, false],
        [
          'a property an allOf brings in',
          { type: 'object', properties: { o: { type: 'object', allOf: [{ properties: { p: holder } }] } } },
          { o: { p: undefined } },
          false,
        ],
        [
          'an additional property',
          { type: 'object', properties: { o: { type: 'object', additionalProperties: holder } } },
          { o: { p: undefined } },
          false,
        ],
        [
          'an additional property, once the defaults are generated',
          { type: 'object', properties: { o: { type: 'object', additionalProperties: holder } } },
          { o: { p: undefined } },
          true,
        ],
        [
          'an anyOf/oneOf property',
          { type: 'object', properties: { p: { oneOf: [holder, { type: 'string' }] } } },
          { p: undefined },
          false,
        ],
      ])(
        'is not filled in for an object holding a null field that is %s the data holds as undefined',
        (_, schema, formData, initialDefaultsGenerated) => {
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, rootSchema: schema, formData, initialDefaultsGenerated },
            ),
          ).toEqual(formData);
        },
      );
    });

    describe('the null of an additional property of an object below the root, once the defaults are generated', () => {
      const defaultsOf = (additionalProperties: RJSFSchema, formData: GenericObjectType) => {
        const schema: RJSFSchema = { type: 'object', properties: { o: { type: 'object', additionalProperties } } };
        return getDefaultFormState(
          { validator: testValidator },
          { schema, rootSchema: schema, formData, initialDefaultsGenerated: true },
        );
      };

      it('is filled in for a value the data holds as undefined', () => {
        expect(defaultsOf({ type: 'null' }, { o: { k: undefined } })).toEqual({ o: { k: null } });
      });

      it('is filled in beside the properties the object names, which are left to their own defaults', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            o: { type: 'object', properties: { s: { type: 'string' } }, additionalProperties: { type: 'null' } },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, formData: { o: { s: 'a', k: undefined } }, initialDefaultsGenerated: true },
          ),
        ).toEqual({ o: { s: 'a', k: null } });
      });

      it('is filled in by getObjectDefaults() for an object it is handed alone', () => {
        const schema: RJSFSchema = { type: 'object', additionalProperties: { type: 'null' } };
        expect(
          getObjectDefaults({ validator: testValidator }, schema, {
            rootSchema: schema,
            rawFormData: { k: undefined },
            initialDefaultsGenerated: true,
          }),
        ).toEqual({ k: null });
      });

      it('is filled in alone in an object the data holds, which takes no other default', () => {
        const additionalProperties: RJSFSchema = {
          type: 'object',
          properties: { n: { type: 'null' }, s: { type: 'string', default: 'x' } },
        };
        expect(defaultsOf(additionalProperties, { o: { k: {} } })).toEqual({ o: { k: { n: null } } });
      });

      it('leaves an additional property that holds no null fill as the data holds it', () => {
        expect(defaultsOf({ type: 'object', properties: { s: { default: 'x' } } }, { o: { k: {} } })).toEqual({
          o: { k: {} },
        });
      });

      it('leaves a value of a nullable type, whose field renders the type beside null, as it is held', () => {
        expect(defaultsOf({ type: ['string', 'null'] }, { o: { k: undefined } })).toEqual({ o: { k: undefined } });
      });
    });

    describe('the null of an anyOf/oneOf option', () => {
      const defaultsOf = (option: RJSFSchema) => {
        const schema: RJSFSchema = { type: 'object', properties: { p: { oneOf: [option, { type: 'string' }] } } };
        return getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema });
      };

      it('is left out for an option of `type: "null"`, which renders no field', () => {
        expect(defaultsOf({ type: 'null' })).toEqual({});
      });

      it.each<[string, RJSFSchema]>([
        ["`type: ['null']`", { type: ['null'] }],
        ['`const: null`', { const: null }],
      ])('is filled in for an option of %s, which renders a field', (_, option) => {
        expect(defaultsOf(option)).toEqual({ p: null });
      });

      it('is left out for an option that is `type: "null"` once its allOf is merged', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { p: { oneOf: [{ allOf: [{ type: 'null' }] }, { type: 'string' }] } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({});
      });
    });

    describe('array object reference sharing fix (issue #4756)', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          config: {
            oneOf: [
              {
                title: 'List Configuration',
                properties: {
                  items: {
                    type: 'array',
                    minItems: 2,
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
                required: ['items'],
              },
            ],
          },
        },
      };

      it('should create independent object instances for array items via getDefaultFormState', () => {
        const result = getDefaultFormState(
          { validator: testValidator },
          { schema, rootSchema: schema },
        ) as GenericObjectType;

        expect(result).toStrictEqual({ config: { items: [{}, {}] } });

        // Verify that modifying properties of one array item doesn't affect others
        expect(result.config.items).toBeDefined();
        expect(Array.isArray(result.config.items)).toBe(true);

        // Verify objects are independent instances - modifying one shouldn't affect the other
        result.config.items[0].field = 'test-value-1';
        expect(result.config.items[1].field).toBeUndefined();
        expect(result.config.items[0]).not.toBe(result.config.items[1]);
      });

      it('should create independent object instances for array items via computeDefaults', () => {
        const result = computeDefaults({ validator: testValidator }, schema, {
          rootSchema: schema,
        }) as GenericObjectType;

        expect(result).toStrictEqual({ config: { items: [{}, {}] } });

        // Verify that modifying properties of one array item doesn't affect others
        expect(result.config.items).toBeDefined();
        expect(Array.isArray(result.config.items)).toBe(true);

        // Verify objects are independent instances - modifying one shouldn't affect the other
        result.config.items[0].field = 'test-value-1';
        expect(result.config.items[1].field).toBeUndefined();
        expect(result.config.items[0]).not.toBe(result.config.items[1]);
      });

      it('should create independent object instances for array items via getArrayDefaults', () => {
        const arraySchema: RJSFSchema = {
          type: 'array',
          minItems: 3,
          items: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
              },
            },
          },
        };

        const result = getArrayDefaults({ validator: testValidator }, arraySchema, {
          rootSchema: arraySchema,
        }) as GenericObjectType[];

        expect(result).toStrictEqual([{}, {}, {}]);

        // Verify that array exists and objects are independent
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        // Verify objects are independent instances
        result[0].field = 'test-value-1';
        result[1].field = 'test-value-2';
        expect(result[2].field).toBeUndefined();
        expect(result[0]).not.toBe(result[1]);
        expect(result[1]).not.toBe(result[2]);
        expect(result[0]).not.toBe(result[2]);
      });

      it('should ensure array items with default values are independent instances', () => {
        const arraySchemaWithDefaults: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
                default: 'default-value',
              },
            },
          },
        };

        const result = getArrayDefaults({ validator: testValidator }, arraySchemaWithDefaults, {
          rootSchema: arraySchemaWithDefaults,
        }) as GenericObjectType[];

        expect(result).toStrictEqual([{ field: 'default-value' }, { field: 'default-value' }]);

        // Verify that array exists and objects are independent
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        // Verify objects are independent instances - modifying one shouldn't affect the other
        result[0].field = 'modified-value';
        expect(result[1].field).toBe('default-value');
        expect(result[0]).not.toBe(result[1]);
      });

      it('should ensure nested objects in arrays are independent instances', () => {
        const nestedObjectSchema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              nested: {
                type: 'object',
                properties: {
                  value: {
                    type: 'string',
                    default: 'nested-default',
                  },
                },
              },
            },
          },
        };

        const result = getArrayDefaults({ validator: testValidator }, nestedObjectSchema, {
          rootSchema: nestedObjectSchema,
        }) as GenericObjectType[];

        expect(result).toStrictEqual([
          { nested: { value: 'nested-default' } },
          { nested: { value: 'nested-default' } },
        ]);

        // Verify that array exists and nested objects are independent
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        // Verify nested objects are independent instances
        result[0].nested.value = 'modified-nested-value';
        expect(result[1].nested.value).toBe('nested-default');
        expect(result[0]).not.toBe(result[1]);
        expect(result[0].nested).not.toBe(result[1].nested);
      });
    });

    describe('ui:emptyValue in getDefaultFormState', () => {
      it('uses emptyValue as the default when there is no schema default and no formData', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        const uiSchema = {
          name: { 'ui:emptyValue': '' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ name: '' });
      });

      it('does not use emptyValue when a schema default exists', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'hello' },
          },
        };
        const uiSchema = {
          name: { 'ui:emptyValue': '' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ name: 'hello' });
      });

      it('does not use emptyValue when formData is provided', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        const uiSchema = {
          name: { 'ui:emptyValue': '' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { name: 'world' }, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ name: 'world' });
      });

      it('applies emptyValue in nested objects', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            address: {
              type: 'object',
              properties: {
                city: { type: 'string' },
              },
            },
          },
        };
        const uiSchema = {
          address: {
            city: { 'ui:emptyValue': '' },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ address: { city: '' } });
      });

      it('behaves unchanged when no uiSchema is passed', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
      });
    });

    describe('ui:initialValue in getDefaultFormState', () => {
      it('uses initialValue as the default when there is no formData and no schema default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            country: { type: 'string' },
          },
        };
        const uiSchema = {
          country: { 'ui:initialValue': 'US' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ country: 'US' });
      });

      it('overrides a schema default with initialValue', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            country: { type: 'string', default: 'UK' },
          },
        };
        const uiSchema = {
          country: { 'ui:initialValue': 'US' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ country: 'US' });
      });

      it('does not override formData that was already provided', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            country: { type: 'string' },
          },
        };
        const uiSchema = {
          country: { 'ui:initialValue': 'US' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { country: 'FR' }, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ country: 'FR' });
      });

      it('takes priority over emptyValue', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            country: { type: 'string' },
          },
        };
        const uiSchema = {
          country: { 'ui:initialValue': 'US', 'ui:emptyValue': '' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ country: 'US' });
      });

      it('applies initialValue in nested objects', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            address: {
              type: 'object',
              properties: {
                country: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        };
        const uiSchema = {
          address: {
            country: { 'ui:initialValue': 'US' },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ address: { country: 'US' } });
      });

      it('applies initialValue on reset (undefined formData)', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        const uiSchema = {
          name: { 'ui:initialValue': 'default name' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ name: 'default name' });
      });
    });

    describe('ui:initialValue/ui:emptyValue in array items', () => {
      it('applies ui:initialValue to array items created to satisfy minItems', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        };
        const uiSchema = {
          items: { name: { 'ui:initialValue': 'Anonymous' } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'Anonymous' }, { name: 'Anonymous' }]);
      });

      it('applies ui:initialValue to existing array item formData missing the field', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        };
        const uiSchema = {
          items: { name: { 'ui:initialValue': 'Anonymous' } },
        };
        const formData = [{}, { name: 'Chuck' }];
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'Anonymous' }, { name: 'Chuck' }]);
      });

      it('applies ui:emptyValue to tuple (fixed) items', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
        };
        const uiSchema = {
          items: { name: { 'ui:emptyValue': 'unnamed' } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'unnamed' }, { name: 'unnamed' }]);
      });

      it('ignores a dynamic (function) uiSchema.items rather than applying it blindly', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        };
        const uiSchema = {
          items: () => ({ name: { 'ui:initialValue': 'Anonymous' } }),
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{}]);
      });

      it('ignores a dynamic (function) uiSchema.items for tuple (fixed) items too', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'object', properties: { name: { type: 'string' } } }],
        };
        const uiSchema = {
          items: () => ({ name: { 'ui:emptyValue': 'unnamed' } }),
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{}]);
      });

      it('applies a per-position ui:initialValue to minItems filler entries when uiSchema.items is a tuple (array)', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: { type: 'string' },
        };
        const uiSchema = {
          items: [{ 'ui:initialValue': 'first' }, { 'ui:initialValue': 'second' }],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual(['first', 'second']);
      });

      it('applies a per-position ui:initialValue when uiSchema.items is itself a tuple (array)', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
        };
        const uiSchema = {
          items: [{ name: { 'ui:initialValue': 'first' } }, { name: { 'ui:initialValue': 'second' } }],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'first' }, { name: 'second' }]);
      });

      it('applies additionalItems uiSchema, not the tuple uiSchema.items, to items beyond the tuple', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: [{ type: 'object', properties: { name: { type: 'string' } } }],
          additionalItems: { type: 'object', properties: { name: { type: 'string' } } },
        };
        const uiSchema = {
          items: { name: { 'ui:initialValue': 'tuple position' } },
          additionalItems: { name: { 'ui:initialValue': 'beyond the tuple' } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'tuple position' }, { name: 'beyond the tuple' }]);
      });

      it('applies additionalItems uiSchema to existing formData beyond a tuple length', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'string' }],
          additionalItems: { type: 'string' },
        };
        const uiSchema = {
          items: { 'ui:emptyValue': 'tuple' },
          additionalItems: { 'ui:emptyValue': 'extra' },
        };
        const formData = [undefined, undefined];
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual(['tuple', 'extra']);
      });

      it('does not resurrect ui:initialValue on a cleared tuple position after the initial pass', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { pair: { type: 'array', items: [{ type: 'string' }, { type: 'string' }] } },
        };
        const uiSchema = { pair: { items: [{ 'ui:initialValue': 'a' }, {}] } };
        // initialDefaultsGenerated: true (the 8th positional arg) means this is a subsequent recompute, not the
        // initial/reset pass, so `ui:initialValue` must not spring back onto the cleared first position.
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema,
              formData: { pair: [undefined, 'z'] },
              rootSchema: schema,
              includeUndefinedValues: false,
              initialDefaultsGenerated: true,
              uiSchema,
            },
          ),
        ).toEqual({ pair: [undefined, 'z'] });
      });

      it('does not apply ui:initialValue to a minItems filler entry after the initial pass', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: { type: 'string' },
        };
        const uiSchema = { items: { 'ui:initialValue': 'a' } };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, initialDefaultsGenerated: true, uiSchema },
          ),
        ).toEqual([undefined, undefined]);
      });
    });

    describe('ui:initialValue for additionalProperties', () => {
      it('applies uiSchema.additionalProperties, not a dynamically-named uiSchema entry, to an additional property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
          additionalProperties: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        };
        const uiSchema = {
          extraKey: { name: { 'ui:initialValue': 'wrong entry' } },
          additionalProperties: { name: { 'ui:initialValue': 'from additionalProperties' } },
        };
        const rawFormData = { foo: 'x', extraKey: {} };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: rawFormData, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({
          foo: 'x',
          extraKey: { name: 'from additionalProperties' },
        });
      });
    });

    describe('ui:initialValue/ui:emptyValue in oneOf/anyOf options', () => {
      it('applies ui:initialValue declared under uiSchema.oneOf[i] on first render, matching what applies on option change', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            thing: {
              oneOf: [
                { type: 'object', title: 'A', properties: { a: { type: 'string' } } },
                { type: 'object', title: 'B', properties: { b: { type: 'string' } } },
              ],
            },
          },
        };
        const uiSchema = {
          thing: { oneOf: [{ a: { 'ui:initialValue': 'x' } }, {}] },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ thing: { a: 'x' } });
      });

      it('applies ui:initialValue declared under uiSchema.anyOf[i] on first render', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            thing: {
              anyOf: [
                { type: 'object', title: 'A', properties: { a: { type: 'string' } } },
                { type: 'object', title: 'B', properties: { b: { type: 'string' } } },
              ],
            },
          },
        };
        const uiSchema = {
          thing: { anyOf: [{ a: { 'ui:initialValue': 'x' } }, {}] },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ thing: { a: 'x' } });
      });
    });

    describe('ui:definitions in getDefaultFormState', () => {
      it('applies ui:initialValue declared inside a ui:definitions fragment', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            Address: { type: 'object', properties: { country: { type: 'string' } } },
          },
          properties: { home: { $ref: '#/definitions/Address' } },
        };
        const uiSchema = {
          'ui:definitions': { '#/definitions/Address': { country: { 'ui:initialValue': 'US' } } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ home: { country: 'US' } });
      });

      it('applies ui:initialValue from an explicitly-passed uiSchemaDefinitions even when uiSchema itself has none', () => {
        // Mirrors how a sub-uiSchema (an array's uiSchema.items, a oneOf/anyOf option, additionalProperties, ...)
        // is handed to getDefaultFormState() without carrying the root's own ui:definitions alongside it.
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            Address: { type: 'object', properties: { country: { type: 'string' } } },
          },
          properties: { home: { $ref: '#/definitions/Address' } },
        };
        const subUiSchema = {};
        const rootUiSchemaDefinitions = { '#/definitions/Address': { country: { 'ui:initialValue': 'US' } } };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema,
              rootSchema: schema,
              includeUndefinedValues: false,
              uiSchema: subUiSchema,
              uiSchemaDefinitions: rootUiSchemaDefinitions,
            },
          ),
        ).toEqual({ home: { country: 'US' } });
      });
    });
    describe('under a draft 2020-12 root with $id resources', () => {
      it("fills the defaults of the same #/ $ref text in two resources from each one's own definition (#5529)", () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            node: { type: 'object', properties: { l: { $ref: 'lib.json' } } },
            lib: { $id: 'lib.json', $defs: { node: { type: 'number', default: 7 } }, $ref: '#/$defs/node' },
          },
          $ref: '#/$defs/node',
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({ l: 7 });
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
        expect(schemaUtils.getDefaultFormState(schemaUtils.getRootSchema())).toEqual({ l: 7 });
      });
      it('fills the defaults of a $ref under a relative root $id through createSchemaUtils()', () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'nested/root.json',
          $defs: { c: { $id: 'child.json', type: 'object', properties: { v: { type: 'string', default: 'ok' } } } },
          type: 'object',
          properties: { c: { $ref: 'child.json' } },
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
        expect(schemaUtils.getDefaultFormState(schemaUtils.getRootSchema())).toEqual({ c: { v: 'ok' } });
      });
      it.each<[number, RJSFSchema, unknown]>([
        [1, PET_RESOURCE_SCHEMA, { p: { kind: 5 } }],
        [2, PET_RESOURCE_DEEP_SCHEMA, { p: { info: { kind: 5 } } }],
      ])(
        'picks the option for data by the $ref a merged property holds in a resource of its own, %i level(s) down',
        (_, schema, formData) => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData })).toEqual(
            formData,
          );
        },
      );
    });
    describe('of a subschema retrieveSchema() handed out', () => {
      // The root and the nested resource each define `x`, so a `$ref` resolved against the wrong one fills 1
      it.each<[string, RJSFSchema]>([
        [
          'draft-07',
          {
            definitions: {
              x: { type: 'number', default: 1 },
              child: {
                $id: 'child.json',
                definitions: { x: { type: 'string', default: 'nested' } },
                type: 'array',
                items: { $ref: '#/definitions/x' },
              },
            },
            type: 'object',
            properties: { list: { $ref: '#/definitions/child' } },
          },
        ],
        [
          'draft 2020-12',
          {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $id: 'https://example.com/root.json',
            $defs: {
              x: { type: 'number', default: 1 },
              child: {
                $id: 'nested/child.json',
                $defs: { x: { type: 'string', default: 'nested' } },
                type: 'array',
                items: { $ref: '#/$defs/x' },
              },
            },
            type: 'object',
            properties: { list: { $ref: 'nested/child.json' } },
          },
        ],
      ])('fills an item of a nested resource from that resource, as a new row does (%s)', (_, schema) => {
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
        const list = schemaUtils.retrieveSchema(schema).properties?.list;
        const items = isObject(list) ? schemaUtils.retrieveSchema(list).items : undefined;
        if (!isObject(items) || Array.isArray(items)) {
          throw new Error('The list has no items schema');
        }
        expect(schemaUtils.getDefaultFormState(items)).toBe('nested');
      });
    });

    describe('own prototype-named properties', () => {
      it('keeps an additionalProperties key named like an Object.prototype member', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' } },
          additionalProperties: { type: 'string' },
        };
        const result = getDefaultFormState(
          { validator: testValidator },
          { schema: { ...schema, default: JSON.parse('{"constructor":"c","valueOf":"v"}') }, formData: { a: 'x' } },
        );
        expect(Object.getOwnPropertyDescriptor(result, 'constructor')?.value).toBe('c');
        expect(Object.getOwnPropertyDescriptor(result, 'valueOf')?.value).toBe('v');
      });

      it('keeps extra form data through the public entry point', () => {
        const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { toString: 'abc', b: 1 } }),
        ).toEqual({
          toString: 'abc',
          b: 1,
        });
      });

      it('does not turn an inherited toString into own data during allOf matching', () => {
        const schema: RJSFSchema = JSON.parse(
          '{"type":"object","properties":{"toString":{"allOf":[{"type":"string"}]},"a":{"type":"string","default":"x"}}}',
        );
        const result = getDefaultFormState(
          { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
          { schema, formData: { a: 'y' } },
        );
        expect(result).toEqual({ a: 'y' });
        expect(Object.hasOwn(result!, 'toString')).toBe(false);
      });

      it.each([{}, JSON.parse('{"__proto__":{"y":"u"}}')])(
        'retains __proto__ schema defaults with data %s',
        (formData) => {
          const schema: RJSFSchema = JSON.parse(
            '{"type":"object","properties":{"__proto__":{"type":"object","properties":{"x":{"default":"dx"}}}}}',
          );
          const result = getDefaultFormState({ validator: testValidator }, { schema, formData });
          expect(Object.hasOwn(result, '__proto__')).toBe(true);
          expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
          expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toEqual({
            x: 'dx',
            ...(Object.getOwnPropertyDescriptor(formData, '__proto__')?.value ?? {}),
          });
        },
      );

      it('seeds object defaults beside a property declared as false', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { x: false },
          additionalProperties: { type: 'string' },
          default: { y: 'd' },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { x: 1 } })).toEqual({
          x: 1,
          y: 'd',
        });
      });

      it('does not read an inherited member of a parent const for a property named like one', () => {
        const schema: RJSFSchema = JSON.parse(
          '{"type":"object","const":{"a":"q"},"properties":{"a":{"type":"string"},"toString":{"type":"string"}}}',
        );
        const result = getDefaultFormState({ validator: testValidator }, { schema, formData: {} });
        expect(Object.hasOwn(result!, 'toString')).toBe(false);
      });

      it('copies a __proto__ key of a default as an own key', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { p: { default: JSON.parse('{"__proto__":{"x":1}}') } },
        };
        const result = getDefaultFormState({ validator: testValidator }, { schema });
        expect(result).toEqual(JSON.parse('{"p":{"__proto__":{"x":1}}}'));
        expect(Object.getPrototypeOf(Object.getOwnPropertyDescriptor(result, 'p')?.value)).toBe(Object.prototype);
      });

      it('matches no property named __proto__ that the data holds no own value for', () => {
        const schema: RJSFSchema = JSON.parse(
          '{"type":"object","properties":{"__proto__":{"type":"object","allOf":[{}],"properties":{"x":{"type":"string"}}}}}',
        );
        const result = ensureFormDataMatchingSchema({ validator: testValidator }, schema, schema, { a: 'y' });
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        expect(result).toEqual({ a: 'y' });
      });
    });

    it("seeds the extra keys of an option taking an object's in its place with the object's uiSchema entry for them", () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: { type: 'string' },
        default: { p: 'd' },
        oneOf: [{ title: 'A', oneOf: [{ properties: { x: { type: 'string' } } }] }],
      };
      // The option's own uiSchema entry says nothing of the extra keys, which its field renders with the object's
      const uiSchema = { additionalProperties: { 'ui:initialValue': 'I' }, oneOf: [{}] };
      expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema })).toEqual({
        p: 'I',
      });
    });

    describe('the option a field shows, from a fieldState', () => {
      const a: RJSFSchema = { title: 'A', properties: { a: { type: 'string', default: 'x' } } };
      const b: RJSFSchema = { title: 'B', properties: { b: { type: 'string', default: 'y' } } };
      /** A `fieldState` showing the option at `index` of every field it is asked about, recording each field's path */
      const showing = (index: number) => {
        const paths: string[] = [];
        const fieldState: FormFieldState = {
          selectedOption: (fieldPath) => {
            paths.push(fieldPath);
            return index;
          },
          isExpanded: () => false,
        };
        return { fieldState, paths };
      };

      it("computes a field's defaults from the option it shows rather than the one its data matches", () => {
        const schema: RJSFSchema = { type: 'object', oneOf: [a, b] };
        const { fieldState, paths } = showing(1);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {}, fieldState }),
        ).toEqual({ b: 'y' });
        expect(paths).toEqual([fieldPathFromList([])]);
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {} })).toEqual(
          { a: 'x' },
        );
        expect(
          createSchemaUtils({ validator: testValidator }, schema).getDefaultFormState(
            schema,
            {},
            false,
            undefined,
            undefined,
            undefined,
            fieldState,
          ),
        ).toEqual({ b: 'y' });
      });

      it('asks for each field by its path: a property, an array item, a tuple item and an additional property', () => {
        const optionField: RJSFSchema = { type: 'object', oneOf: [a, b] };
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            o: optionField,
            list: { type: 'array', items: optionField },
            tuple: { type: 'array', items: [optionField] },
          },
          additionalProperties: optionField,
        };
        const { fieldState, paths } = showing(1);
        const formData = { o: {}, list: [{}], tuple: [{}], k: {} };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData, fieldState }),
        ).toEqual({ o: { b: 'y' }, list: [{ b: 'y' }], tuple: [{ b: 'y' }], k: { b: 'y' } });
        expect(paths).toEqual(
          expect.arrayContaining([['o'], ['list', 0], ['tuple', 0], ['k']].map((path) => fieldPathFromList(path))),
        );
      });

      it('reads an option written as a boolean as an option allowing anything', () => {
        const schema: RJSFSchema = { type: 'object', oneOf: [true, b] };
        const { fieldState } = showing(1);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {}, fieldState }),
        ).toEqual({ b: 'y' });
      });

      it('falls back to the option the data matches where the fieldState shows none', () => {
        const schema: RJSFSchema = { type: 'object', oneOf: [a, b] };
        const { fieldState } = showing(-1);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {}, fieldState }),
        ).toEqual({ a: 'x' });
      });

      it('falls back to the option the data matches where the fieldState names an index past the options', () => {
        const schema: RJSFSchema = { type: 'object', oneOf: [a, b] };
        const { fieldState } = showing(2);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {}, fieldState }),
        ).toEqual({ a: 'x' });
      });

      it('asks nothing of a select, over constants or an enum, nor of a field holding no data, which its default matches', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            kind: { oneOf: [{ const: 'p' }, { const: 'q' }] },
            size: { type: 'string', enum: ['s', 'm'], oneOf: [{ minLength: 1 }, { maxLength: 1 }] },
            o: { type: 'object', oneOf: [a, b] },
          },
        };
        const { fieldState, paths } = showing(0);
        const formData = { kind: 'q', size: 'm' };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData, fieldState }),
        ).toEqual({ kind: 'q', size: 'm', o: { a: 'x' } });
        expect(paths).toEqual([]);
      });
    });
  });
}
