import { createSchemaUtils, getDefaultFormState, RJSFSchema } from '../../src';
import {
  AdditionalItemsHandling,
  computeDefaults,
  getArrayDefaults,
  getDefaultBasedOnSchemaType,
  getInnerSchemaForArrayItem,
  getObjectDefaults,
  ensureFormDataMatchingSchema,
} from '../../src/schema/getDefaultFormState';
import { RECURSIVE_REF, RECURSIVE_REF_ALLOF } from '../testUtils/testData';
import { IExpectType, TestValidatorType } from './types';
import { resolveDependencies } from '../../src/schema/retrieveSchema';

/**
 * Validate the expected value based on the index of the expectList
 * @param index = index of the expectList
 * @param expectList = list of expected values
 * @param schema = schema
 * @param options = optional arguments
 */
const validateBasedOnIndex = (index: number, expectList: IExpectType[], schema: RJSFSchema, options?: any) => {
  const { expectedCB, toEqual } = expectList[index];
  expect(expectedCB(schema, options)).toEqual(toEqual);
};

type ObjectDefaultExpectList = [
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType,
  IExpectType
];

/**
 * This function tests schema with type object default values with expectedList, which has a generic callback to get expected data and toEqual data. It is used in multiple places with different methods. This will then test all object default values across different methods.
 *
 * Important: when adding a new test, please make sure to add the test at the end of the list to avoid breaking the existing tests. Also update the 'ObjectDefaultExpectList' type and add one or more 'IExpectType' to it. This will let typescript show you an error if you didn't update all the 'testObjectDefault' methods accordingly.
 * @param {TestValidatorType} testValidator
 * @param {IExpectType[]} expectList
 */
const testObjectDefault = (testValidator: TestValidatorType, expectList: ObjectDefaultExpectList) => {
  describe('object default test ', () => {
    let schema: RJSFSchema;
    it('test a schema with a ref', () => {
      schema = {
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
      validateBasedOnIndex(0, expectList, schema);
    });
    it('test a schema with a const property', () => {
      schema = {
        type: 'object',
        properties: {
          test: {
            type: 'string',
            const: 'test',
          },
        },
      };
      validateBasedOnIndex(1, expectList, schema);
    });
    it('test a schema with a const property and constAsDefaults is never', () => {
      validateBasedOnIndex(2, expectList, schema, {
        experimental_defaultFormStateBehavior: { constAsDefaults: 'never' },
      });
    });
    it('test an object with an optional property that has a nested required property', () => {
      schema = {
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
      validateBasedOnIndex(3, expectList, schema);
    });
    it('test an object with an optional property that has a nested required property with default', () => {
      schema = {
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
      validateBasedOnIndex(4, expectList, schema);
    });
    it('test an object with an optional property that has a nested required property and includeUndefinedValues', () => {
      schema = {
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
      validateBasedOnIndex(5, expectList, schema, { includeUndefinedValues: true });
    });
    it("test an object with an optional property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
      schema = {
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
      validateBasedOnIndex(6, expectList, schema, { includeUndefinedValues: 'excludeObjectChildren' });
    });
    it('test an object with an additionalProperties', () => {
      schema = {
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
      validateBasedOnIndex(7, expectList, schema);
    });
    it('test an object with an additionalProperties and includeUndefinedValues', () => {
      schema = {
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
      validateBasedOnIndex(8, expectList, schema, { includeUndefinedValues: true });
    });
    it('test an object with additionalProperties type object with defaults and formdata', () => {
      schema = {
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
      validateBasedOnIndex(9, expectList, schema, { rawFormData: { test: { foo: 'x', newKey: {} } } });
    });
    it('test an object with additionalProperties type object with formdata and no defaults', () => {
      schema = {
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
      validateBasedOnIndex(10, expectList, schema, { rawFormData: { test: { foo: 'x', newKey: {} } } });
    });
    it('test an object with additionalProperties type object with no defaults and non-object formdata', () => {
      schema = {
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
      validateBasedOnIndex(11, expectList, schema, { rawFormData: {} });
    });
    it('test an object with deep nested dependencies with formData', () => {
      schema = {
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

      // Mock isValid so that withExactlyOneSubschema works as expected
      testValidator.setReturnValues({
        isValid: [
          true, // First oneOf... first === first
          false, // Second oneOf... second !== first
        ],
      });

      validateBasedOnIndex(12, expectList, schema, {
        rawFormData: {
          nestedObject: {
            first: 'yes',
          },
        },
        testValidator,
      });
    });
    it('test handling an invalid property schema', () => {
      schema = {
        type: 'object',
        properties: {
          invalidProperty: 'not a valid property value',
        },
      } as RJSFSchema;

      validateBasedOnIndex(13, expectList, schema, {
        includeUndefinedValues: 'excludeObjectChildren',
      });
    });
    it('test with a recursive schema', () => {
      validateBasedOnIndex(14, expectList, RECURSIVE_REF, {
        includeUndefinedValues: 'excludeObjectChildren',
      });
    });
    it('test with a recursive allof schema', () => {
      validateBasedOnIndex(15, expectList, RECURSIVE_REF_ALLOF);
    });
    it('test returns undefined with simple schema and no optional args', () => {
      schema = { type: 'string' };
      validateBasedOnIndex(16, expectList, schema);
    });
    it('test an object const value merge with formData', () => {
      schema = {
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

      validateBasedOnIndex(17, expectList, schema, {
        rawFormData: {
          fromFormData: 'fromFormData',
        },
        experimental_defaultFormStateBehavior: {
          emptyObjectFields: 'skipDefaults',
        },
      });
    });
    it('test an object const value merge with formData and constAsDefault is never', () => {
      validateBasedOnIndex(18, expectList, schema, {
        rawFormData: {
          fromFormData: 'fromFormData',
        },
        experimental_defaultFormStateBehavior: {
          emptyObjectFields: 'skipDefaults',
          constAsDefaults: 'never',
        },
        testValidator,
      });
    });
    it('test an object with non valid formData for enum properties', () => {
      schema = {
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
                  multipleChoicesList: {
                    type: 'array',
                    title: 'A multiple choices list',
                    items: {
                      type: 'string',
                      enum: ['foo', 'bar', 'qux'],
                    },
                    uniqueItems: true,
                    default: ['foo'],
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
                  multipleChoicesList: {
                    type: 'array',
                    title: 'A multiple choices list',
                    items: {
                      type: 'string',
                      enum: ['a', 'a', 'b', 'c'],
                    },
                    uniqueItems: true,
                    default: ['a'],
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

      // Mock isValid so that withExactlyOneSubschema works as expected
      testValidator.setReturnValues({
        isValid: [false, true],
      });

      validateBasedOnIndex(19, expectList, schema, {
        rawFormData: {
          animal: 'Fish',
          food: 'meat',
          multipleChoicesList: ['a'],
          water: null,
        },
        shouldMergeDefaultsIntoFormData: true,
        testValidator,
      });
    });
    it('test an object with non valid formData for enum properties with mergeDefaultsIntoFormData set to "useDefaultIfFormDataUndefined"', () => {
      // Mock isValid so that withExactlyOneSubschema works as expected
      testValidator.setReturnValues({
        isValid: [false, true],
      });

      validateBasedOnIndex(20, expectList, schema, {
        rawFormData: {
          animal: 'Fish',
          food: 'meat',
          multipleChoicesList: ['a'],
          water: null,
        },
        shouldMergeDefaultsIntoFormData: true,
        experimental_defaultFormStateBehavior: {
          mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
        },
        testValidator,
      });

      // Reset the testValidator
      if (typeof testValidator.reset === 'function') {
        testValidator?.reset();
      }
    });
    it('test oneOf with const values and constAsDefaults is always', () => {
      schema = {
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
      validateBasedOnIndex(21, expectList, schema, {
        experimental_defaultFormStateBehavior: {
          constAsDefaults: 'always',
        },
      });
    });
    it('test oneOf with const values and constAsDefaults is skipOneOf', () => {
      validateBasedOnIndex(22, expectList, schema, {
        experimental_defaultFormStateBehavior: {
          constAsDefaults: 'skipOneOf',
        },
      });
    });
    it('test oneOf with const values and constAsDefaults is never', () => {
      validateBasedOnIndex(23, expectList, schema, {
        experimental_defaultFormStateBehavior: {
          constAsDefaults: 'never',
        },
      });
    });
    it('Test an object with invalid formData const and constAsDefault set to always', () => {
      schema = {
        type: 'object',
        properties: {
          stringField: {
            type: 'string',
            const: 'fromConst',
          },
        },
      };

      validateBasedOnIndex(24, expectList, schema, {
        rawFormData: {
          stringField: 'fromFormData',
        },
        experimental_defaultFormStateBehavior: {
          constAsDefaults: 'always',
        },
      });
    });
  });
};

type ArrayDefaultExpectList = [IExpectType, IExpectType, IExpectType, IExpectType, IExpectType, IExpectType];

/**
 * This function tests schema with type array default values with expectedList, which has a generic callback to get expected data and toEqual data. It is used in multiple places with different methods. This will then test all array default values across different methods.
 *
 * Important: when adding a new test, please make sure to add the test at the end of the list to avoid breaking the existing tests. Also update the 'ArrayDefaultExpectList' type and add one or more 'IExpectType' to it. This will let typescript show you an error if you didn't update all the 'testArrayDefault' methods accordingly.
 * @param {TestValidatorType} testValidator
 * @param {IExpectType[]} expectList
 */
const testArrayDefault = (testValidator: TestValidatorType, expectList: ArrayDefaultExpectList) => {
  describe('test array default', () => {
    // Reset the testValidator
    if (typeof testValidator.reset === 'function') {
      testValidator?.reset();
    }

    it('test an array with defaults with no formData', () => {
      const schema: RJSFSchema = {
        type: 'array',
        minItems: 4,
        default: ['Raphael', 'Michaelangelo'],
        items: {
          type: 'string',
          default: 'Unknown',
        },
      };

      validateBasedOnIndex(0, expectList, schema, {
        includeUndefinedValues: 'excludeObjectChildren',
      });
    });
    it('test an array with defaults with empty array as formData', () => {
      const schema: RJSFSchema = {
        type: 'array',
        minItems: 4,
        default: ['Raphael', 'Michaelangelo'],
        items: {
          type: 'string',
          default: 'Unknown',
        },
      };

      validateBasedOnIndex(1, expectList, schema, {
        rawFormData: [],
        includeUndefinedValues: 'excludeObjectChildren',
        experimental_defaultFormStateBehavior: {
          arrayMinItems: {
            mergeExtraDefaults: true,
            populate: 'all',
          },
        },
      });
    });
    it('test an array with no defaults', () => {
      const schema: RJSFSchema = {
        type: 'array',
        minItems: 4,
        items: {
          type: 'string',
        },
      };

      validateBasedOnIndex(2, expectList, schema, {
        includeUndefinedValues: 'excludeObjectChildren',
      });
    });
    it('test an array const value populate as defaults', () => {
      const schema: RJSFSchema = {
        type: 'array',
        minItems: 4,
        const: ['ConstFromRoot', 'ConstFromRoot'],
        items: {
          type: 'string',
          const: 'Constant',
        },
      };

      validateBasedOnIndex(3, expectList, schema, {
        includeUndefinedValues: 'excludeObjectChildren',
      });
    });
    it('test handling an invalid array schema', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: 'not a valid item value',
      } as RJSFSchema;

      validateBasedOnIndex(4, expectList, schema, {
        includeUndefinedValues: 'excludeObjectChildren',
      });
    });
    it('test returns undefined with simple schema and no optional args', () => {
      const schema: RJSFSchema = { type: 'array' };
      validateBasedOnIndex(5, expectList, schema);
    });
  });
};

export default function getDefaultFormStateTest(testValidator: TestValidatorType) {
  describe('getDefaultFormState()', () => {
    let consoleWarnSpy: jest.SpyInstance;
    beforeAll(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(); // mock this to avoid actually warning in the tests
    });
    afterAll(() => {
      consoleWarnSpy.mockRestore();
    });
    it('throws error when schema is not an object', () => {
      expect(() => getDefaultFormState(testValidator, null as unknown as RJSFSchema)).toThrowError('Invalid schema:');
    });
    // test object defaults
    testObjectDefault(testValidator, [
      {
        expectedCB: (schema) => getDefaultFormState(testValidator, schema, undefined, schema),
        toEqual: {
          foo: 42,
        },
      },
      {
        expectedCB: (schema) => getDefaultFormState(testValidator, schema, undefined, schema),
        toEqual: {
          test: 'test',
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(
            testValidator,
            schema,
            undefined,
            schema,
            undefined,
            options.experimental_defaultFormStateBehavior
          ),
        toEqual: {},
      },
      {
        expectedCB: (schema) => getDefaultFormState(testValidator, schema, undefined, schema),
        toEqual: { requiredProperty: 'foo' },
      },
      {
        expectedCB: (schema) => getDefaultFormState(testValidator, schema, undefined, schema),
        toEqual: {
          requiredProperty: 'foo',
          optionalProperty: { nestedRequiredProperty: '' },
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(testValidator, schema, undefined, schema, options?.includeUndefinedValues),
        toEqual: {
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: 'foo',
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(testValidator, schema, undefined, schema, options?.includeUndefinedValues),
        toEqual: {
          optionalNumberProperty: undefined,
          optionalObjectProperty: {
            nestedRequiredProperty: {},
          },
          requiredProperty: 'foo',
        },
      },
      {
        expectedCB: (schema) => getDefaultFormState(testValidator, schema, undefined, schema),
        toEqual: {
          requiredProperty: 'foo',
          foo: 'bar',
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(testValidator, schema, undefined, schema, options?.includeUndefinedValues),
        toEqual: {
          requiredProperty: 'foo',
          foo: 'bar',
        },
      },
      {
        expectedCB: (schema, options) => getDefaultFormState(testValidator, schema, options.rawFormData, schema),
        toEqual: {
          test: {
            foo: 'x',
            newKey: {
              host: 'localhost',
              port: 389,
            },
          },
        },
      },
      {
        expectedCB: (schema, options) => getDefaultFormState(testValidator, schema, options.rawFormData, schema),
        toEqual: {
          test: {
            foo: 'x',
            newKey: {},
          },
        },
      },
      {
        expectedCB: (schema, options) => getDefaultFormState(testValidator, schema, options.rawFormData, schema),
        toEqual: {},
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(options.testValidator, schema, options.rawFormData, schema, false, {
            emptyObjectFields: 'populateAllDefaults',
            allOf: 'skipDefaults',
            arrayMinItems: {
              populate: 'populate' as any,
              mergeExtraDefaults: false,
            },
            mergeDefaultsIntoFormData: 'useFormDataIfPresent',
          }),
        toEqual: {
          nestedObject: {
            first: 'yes',
            second: {
              deeplyNestedThird: 'before',
            },
          },
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(testValidator, schema, undefined, schema, options.includeUndefinedValues),
        toEqual: {},
      },
      {
        expectedCB: (schema) => getDefaultFormState(testValidator, schema, undefined, schema),
        toEqual: {
          children: {
            name: '',
          },
          name: '',
        },
      },
      {
        expectedCB: (schema) => getDefaultFormState(testValidator, schema, undefined, schema),
        toEqual: {
          value: [undefined],
        },
      },
      {
        expectedCB: (schema) => getDefaultFormState(testValidator, schema, undefined),
        toEqual: undefined,
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(
            testValidator,
            schema,
            options.rawFormData,
            schema,
            false,
            options.experimental_defaultFormStateBehavior
          ),
        toEqual: {
          localConst: 'local',
          RootConst: {
            attr1: 1,
            attr2: true,
          },
          RootAndLocalConst: 'FromLocal',
          fromFormData: 'fromFormData',
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(
            testValidator,
            schema,
            options.rawFormData,
            schema,
            false,
            options.experimental_defaultFormStateBehavior
          ),
        toEqual: {
          fromFormData: 'fromFormData',
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(options.testValidator, schema, options.rawFormData, schema),
        toEqual: {
          animal: 'Fish',
          food: 'worms',
          multipleChoicesList: ['a'],
          water: null,
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(
            options.testValidator,
            schema,
            options.rawFormData,
            schema,
            undefined,
            options.experimental_defaultFormStateBehavior
          ),
        toEqual: {
          animal: 'Fish',
          food: 'worms',
          multipleChoicesList: ['a'],
          water: 'sea',
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(
            testValidator,
            schema,
            undefined,
            schema,
            undefined,
            options.experimental_defaultFormStateBehavior
          ),
        toEqual: {
          oneOfField: 'username',
        },
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(
            testValidator,
            schema,
            undefined,
            schema,
            undefined,
            options.experimental_defaultFormStateBehavior
          ),
        toEqual: {},
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(
            testValidator,
            schema,
            undefined,
            schema,
            undefined,
            options.experimental_defaultFormStateBehavior
          ),
        toEqual: {},
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(
            testValidator,
            schema,
            options.rawFormData,
            schema,
            undefined,
            options.experimental_defaultFormStateBehavior
          ),
        toEqual: {
          stringField: 'fromConst',
        },
      },
    ]);
    // test array defaults
    testArrayDefault(testValidator, [
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(testValidator, schema, undefined, schema, options.includeUndefinedValues),
        toEqual: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(
            testValidator,
            schema,
            undefined,
            schema,
            options.includeUndefinedValues,
            options.experimental_defaultFormStateBehavior
          ),
        toEqual: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(testValidator, schema, undefined, schema, options.includeUndefinedValues),
        toEqual: [],
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(testValidator, schema, undefined, schema, options.includeUndefinedValues),
        toEqual: ['ConstFromRoot', 'ConstFromRoot', 'Constant', 'Constant'],
      },
      {
        expectedCB: (schema, options) =>
          getDefaultFormState(testValidator, schema, undefined, schema, options.includeUndefinedValues),
        toEqual: [],
      },
      {
        expectedCB: (schema) => getDefaultFormState(testValidator, schema),
        toEqual: [],
      },
    ]);
    it('getInnerSchemaForArrayItem() item of type boolean returns empty schema', () => {
      expect(getInnerSchemaForArrayItem({ items: [true] }, AdditionalItemsHandling.Ignore, 0)).toEqual({});
    });
    describe('resolveDependencies()', () => {
      it('test an object with dependencies', () => {
        const schema: RJSFSchema = {
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
        };

        // Mock isValid so that withExactlyOneSubschema works as expected
        testValidator.setReturnValues({
          isValid: [
            true, // First oneOf... first === first
            false, // Second oneOf... second !== first
          ],
        });
        expect(
          resolveDependencies(
            testValidator,
            schema,
            schema,
            false,
            [],
            {
              first: 'yes',
            },
            undefined
          )
        ).toEqual([
          {
            type: 'object',
            properties: {
              first: {
                type: 'string',
                enum: ['no', 'yes'],
                default: 'no',
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
        ]);
      });
    });
    describe('computeDefaults()', () => {
      // test object defaults
      testObjectDefault(testValidator, [
        {
          expectedCB: (schema) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            foo: 42,
          },
        },
        {
          expectedCB: (schema) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            test: 'test',
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: { requiredProperty: 'foo' },
        },
        {
          expectedCB: (schema) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            requiredProperty: 'foo',
            optionalProperty: { nestedRequiredProperty: '' },
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            optionalProperty: {
              nestedRequiredProperty: {
                undefinedProperty: undefined,
              },
            },
            requiredProperty: 'foo',
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            optionalNumberProperty: undefined,
            optionalObjectProperty: {
              nestedRequiredProperty: {},
            },
            requiredProperty: 'foo',
          },
        },
        {
          expectedCB: (schema) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            requiredProperty: 'foo',
            foo: 'bar',
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            requiredProperty: 'foo',
            foo: 'bar',
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            test: {
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            test: {
              newKey: {},
            },
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            nestedObject: {
              first: 'no',
              second: {
                deeplyNestedThird: 'before',
              },
            },
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            name: '',
          },
        },
        {
          expectedCB: (schema) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            value: [undefined],
          },
        },
        {
          expectedCB: (schema) => computeDefaults(testValidator, schema),
          toEqual: undefined,
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            localConst: 'local',
            RootConst: {
              attr1: 1,
              attr2: true,
            },
            RootAndLocalConst: 'FromLocal',
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(options.testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            animal: 'Fish',
            food: 'worms',
            multipleChoicesList: ['a'],
            water: 'sea',
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(options.testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            animal: 'Fish',
            food: 'worms',
            multipleChoicesList: ['a'],
            water: 'sea',
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            oneOfField: 'username',
          },
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            stringField: 'fromConst',
          },
        },
      ]);
      // test array defaults
      testArrayDefault(testValidator, [
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: [],
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: ['ConstFromRoot', 'ConstFromRoot', 'Constant', 'Constant'],
        },
        {
          expectedCB: (schema, options) =>
            computeDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: [],
        },
        {
          expectedCB: (schema) => getArrayDefaults(testValidator, schema),
          toEqual: [],
        },
      ]);
    });
    describe('getDefaultBasedOnSchemaType()', () => {
      // test object defaults
      testObjectDefault(testValidator, [
        {
          expectedCB: (schema) =>
            getDefaultBasedOnSchemaType(
              testValidator,
              schema,
              {
                rootSchema: schema,
              },
              {
                foo: 42,
              }
            ),
          toEqual: undefined,
        },
        {
          expectedCB: (schema) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            test: 'test',
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: { requiredProperty: 'foo' },
        },
        {
          expectedCB: (schema) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            requiredProperty: 'foo',
            optionalProperty: { nestedRequiredProperty: '' },
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            optionalProperty: {
              nestedRequiredProperty: {
                undefinedProperty: undefined,
              },
            },
            requiredProperty: 'foo',
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            optionalNumberProperty: undefined,
            optionalObjectProperty: {
              nestedRequiredProperty: {},
            },
            requiredProperty: 'foo',
          },
        },
        {
          expectedCB: (schema) =>
            getDefaultBasedOnSchemaType(
              testValidator,
              schema,
              {
                rootSchema: schema,
              },
              { foo: 'bar' }
            ),
          toEqual: {
            requiredProperty: 'foo',
            foo: 'bar',
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(
              testValidator,
              schema,
              {
                rootSchema: schema,
                ...options,
              },
              { foo: 'bar' }
            ),
          toEqual: {
            requiredProperty: 'foo',
            foo: 'bar',
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            test: {
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            test: {
              newKey: {},
            },
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            nestedObject: {
              first: 'no',
              second: {
                deeplyNestedThird: 'before',
              },
            },
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: undefined,
        },
        {
          expectedCB: (schema) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            value: [undefined],
          },
        },
        {
          expectedCB: (schema) => getDefaultBasedOnSchemaType(testValidator, schema),
          toEqual: undefined,
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            localConst: 'local',
            RootConst: {
              attr1: 1,
              attr2: true,
            },
            RootAndLocalConst: 'FromLocal',
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(options.testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            animal: 'Fish',
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(options.testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            animal: 'Fish',
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            oneOfField: 'username',
          },
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            stringField: 'fromConst',
          },
        },
      ]);
      // test array defaults
      testArrayDefault(testValidator, [
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(
              testValidator,
              schema,
              {
                rootSchema: schema,
                ...options,
              },
              ['Raphael', 'Michaelangelo']
            ),
          toEqual: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(
              testValidator,
              schema,
              {
                rootSchema: schema,
                ...options,
              },
              ['Raphael', 'Michaelangelo']
            ),
          toEqual: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: [],
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(
              testValidator,
              schema,
              {
                rootSchema: schema,
                ...options,
              },
              ['ConstFromRoot', 'ConstFromRoot']
            ),
          toEqual: ['ConstFromRoot', 'ConstFromRoot', 'Constant', 'Constant'],
        },
        {
          expectedCB: (schema, options) =>
            getDefaultBasedOnSchemaType(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: [],
        },
        {
          expectedCB: (schema) => getDefaultBasedOnSchemaType(testValidator, schema),
          toEqual: [],
        },
      ]);
    });
    describe('getObjectDefaults()', () => {
      // test object defaults
      testObjectDefault(testValidator, [
        {
          expectedCB: (schema) =>
            getObjectDefaults(
              testValidator,
              schema,
              {
                rootSchema: schema,
              },
              {
                foo: 42,
              }
            ),
          toEqual: {},
        },
        {
          expectedCB: (schema) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            test: 'test',
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: { requiredProperty: 'foo' },
        },
        {
          expectedCB: (schema) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            requiredProperty: 'foo',
            optionalProperty: { nestedRequiredProperty: '' },
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            optionalProperty: {
              nestedRequiredProperty: {
                undefinedProperty: undefined,
              },
            },
            requiredProperty: 'foo',
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            optionalNumberProperty: undefined,
            optionalObjectProperty: {
              nestedRequiredProperty: {},
            },
            requiredProperty: 'foo',
          },
        },
        {
          expectedCB: (schema) =>
            getObjectDefaults(
              testValidator,
              schema,
              {
                rootSchema: schema,
              },
              { foo: 'bar' }
            ),
          toEqual: {
            requiredProperty: 'foo',
            foo: 'bar',
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(
              testValidator,
              schema,
              {
                rootSchema: schema,
                ...options,
              },
              { foo: 'bar' }
            ),
          toEqual: {
            requiredProperty: 'foo',
            foo: 'bar',
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            test: {
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            test: {
              newKey: {},
            },
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            nestedObject: {
              first: 'no',
              second: {
                deeplyNestedThird: 'before',
              },
            },
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
            }),
          toEqual: {
            value: [undefined],
          },
        },
        {
          expectedCB: (schema) => getObjectDefaults(testValidator, schema),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            localConst: 'local',
            RootConst: {
              attr1: 1,
              attr2: true,
            },
            RootAndLocalConst: 'FromLocal',
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(options.testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            animal: 'Fish',
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(options.testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            animal: 'Fish',
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            oneOfField: 'username',
          },
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {},
        },
        {
          expectedCB: (schema, options) =>
            getObjectDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: {
            stringField: 'fromConst',
          },
        },
      ]);
    });
    describe('getArrayDefaults()', () => {
      // test array defaults
      testArrayDefault(testValidator, [
        {
          expectedCB: (schema, options) =>
            getArrayDefaults(
              testValidator,
              schema,
              {
                rootSchema: schema,
                ...options,
              },
              ['Raphael', 'Michaelangelo']
            ),
          toEqual: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
        },
        {
          expectedCB: (schema, options) =>
            getArrayDefaults(
              testValidator,
              schema,
              {
                rootSchema: schema,
                ...options,
              },
              ['Raphael', 'Michaelangelo']
            ),
          toEqual: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
        },
        {
          expectedCB: (schema, options) =>
            getArrayDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: [],
        },
        {
          expectedCB: (schema, options) =>
            getArrayDefaults(
              testValidator,
              schema,
              {
                rootSchema: schema,
                ...options,
              },
              ['ConstFromRoot', 'ConstFromRoot']
            ),
          toEqual: ['ConstFromRoot', 'ConstFromRoot', 'Constant', 'Constant'],
        },
        {
          expectedCB: (schema, options) =>
            getArrayDefaults(testValidator, schema, {
              rootSchema: schema,
              ...options,
            }),
          toEqual: [],
        },
        {
          expectedCB: (schema) => getArrayDefaults(testValidator, schema),
          toEqual: [],
        },
      ]);
    });
    describe('getValidFormData', () => {
      let schema: RJSFSchema;
      it('Test schema with non valid formData for enum property', () => {
        schema = {
          type: 'string',
          enum: ['a', 'b', 'c'],
        };

        expect(ensureFormDataMatchingSchema(testValidator, schema, schema, 'd')).toBeUndefined();
      });
      it('Test schema with valid formData for enum property', () => {
        expect(ensureFormDataMatchingSchema(testValidator, schema, schema, 'b')).toEqual('b');
      });
      it('Test schema with const property', () => {
        schema = {
          type: 'string',
          enum: ['a', 'b', 'c'],
          const: 'a',
        };

        expect(ensureFormDataMatchingSchema(testValidator, schema, schema, 'a')).toEqual('a');
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            rawFormData: { optionalArray: [] },
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            rawFormData: { requiredArray: ['raw0'] },
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { allOf: 'populateDefaults' },
          })
        ).toEqual({ animalInfo: { animal: 'Cat', food: 'meat' } });
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { allOf: 'skipDefaults' },
          })
        ).toEqual({ animalInfo: { animal: 'Cat' } });
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            rawFormData: { nonRequiredArray: ['raw1'] },
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            rawFormData: { nonRequiredArray: ['not add'] },
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            rawFormData: {
              nonRequiredArray: [
                {
                  nestedArray: ['raw0'],
                },
              ],
            },
            experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
          })
        ).toEqual({ requiredProperty: 'foo' });
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            includeUndefinedValues: true,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            includeUndefinedValues: 'excludeObjectChildren',
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
          })
        ).toEqual({
          optionalNumberProperty: undefined,
          optionalObjectProperty: {},
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            includeUndefinedValues: true,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            includeUndefinedValues: 'excludeObjectChildren',
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
          })
        ).toEqual({
          optionalNumberProperty: undefined,
          optionalObjectProperty: {},
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            includeUndefinedValues: true,
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' },
          })
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            includeUndefinedValues: 'excludeObjectChildren',
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' },
          })
        ).toEqual({
          optionalNumberProperty: undefined,
          optionalObjectProperty: {},
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
          computeDefaults(testValidator, schema, {
            rootSchema: schema,
            includeUndefinedValues: 'excludeObjectChildren',
            experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' },
          })
        ).toEqual({ arrayWithDefault: ['option1'] });
      });
    });

    describe('root default', () => {
      it('should map root schema default to form state, if any', () => {
        expect(
          getDefaultFormState(testValidator, {
            type: 'string',
            default: 'foo',
          })
        ).toEqual('foo');
      });
      it('should keep existing form data that is equal to 0', () => {
        expect(
          getDefaultFormState(
            testValidator,
            {
              type: 'number',
              default: 1,
            },
            0
          )
        ).toEqual(0);
      });
      it('should keep existing form data that is equal to false', () => {
        expect(
          getDefaultFormState(
            testValidator,
            {
              type: 'boolean',
            },
            false
          )
        ).toEqual(false);
      });

      it.each([null, undefined, NaN])('should overwrite existing form data that is equal to a %s', (noneValue) => {
        expect(
          getDefaultFormState(
            testValidator,
            {
              type: 'number',
              default: 1,
            },
            noneValue
          )
        ).toEqual(1);
      });
    });
    describe('nested default', () => {
      it('should map schema object prop default to form state', () => {
        expect(
          getDefaultFormState(testValidator, {
            type: 'object',
            properties: {
              string: {
                type: 'string',
                default: 'foo',
              },
            },
          })
        ).toEqual({ string: 'foo' });
      });
      it('should default to empty object if no properties are defined', () => {
        expect(
          getDefaultFormState(testValidator, {
            type: 'object',
          })
        ).toEqual({});
      });
      it('should recursively map schema object default to form state', () => {
        expect(
          getDefaultFormState(testValidator, {
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
          })
        ).toEqual({ object: { string: 'foo' } });
      });
      it('should map schema array default to form state', () => {
        expect(
          getDefaultFormState(testValidator, {
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
          })
        ).toEqual({ array: ['foo', 'bar'] });
      });
      it('should recursively map schema array default to form state', () => {
        expect(
          getDefaultFormState(testValidator, {
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
          })
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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
          getDefaultFormState(testValidator, schema, {
            level1: { level2: { leaf4: 4 } },
          })
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
        expect(getDefaultFormState(testValidator, schema, formData)).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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
        const schemaUtils = createSchemaUtils(testValidator, schema);

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
        expect(getDefaultFormState(testValidator, schema, { fooProp: 'fooProp' }, schema)).toEqual({
          fooProp: 'fooProp',
          fooProp2: 'fooProp2',
        });
        expect(getDefaultFormState(testValidator, schema, { barProp: 'barProp' }, schema)).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, { array: ['bar'] })).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, [{}])).toEqual([{ item: 'foo' }]);
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          array: ['foo', 'qux'],
        });
      });
      it('returns empty defaults when no item defaults are defined', () => {
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          array: [],
        });
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          turtles: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
        });
      });
    });
    describe('defaults with oneOf', () => {
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({});
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          name: 'a',
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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
          getDefaultFormState(testValidator, schema, {}, undefined, undefined, {
            emptyObjectFields: 'populateRequiredDefaults',
          })
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
          getDefaultFormState(testValidator, schema, {}, undefined, undefined, {
            emptyObjectFields: 'populateRequiredDefaults',
          })
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
          getDefaultFormState(testValidator, schema, {}, undefined, undefined, {
            emptyObjectFields: 'populateRequiredDefaults',
          })
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
        expect(getDefaultFormState(testValidator, schema, { name: 'Name' })).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, { test: { b: 'b' } })).toEqual({
          test: { b: 'b' },
        });
      });
    });
    describe('defaults with anyOf', () => {
      it('should not populate defaults for empty oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              anyOf: [],
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({});
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          name: 'a',
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
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
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
          getDefaultFormState(testValidator, schema, {}, undefined, undefined, {
            emptyObjectFields: 'populateRequiredDefaults',
          })
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
          getDefaultFormState(testValidator, schema, {}, undefined, undefined, {
            emptyObjectFields: 'populateRequiredDefaults',
          })
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
          getDefaultFormState(testValidator, schema, {}, undefined, undefined, {
            emptyObjectFields: 'populateRequiredDefaults',
          })
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
        expect(getDefaultFormState(testValidator, schema, { name: 'Name' })).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, { test: { b: 'b' } })).toEqual({
          test: { b: 'b' },
        });
      });
    });
    describe('with dependencies', () => {
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
        expect(getDefaultFormState(testValidator, schema, { name: 'Name' })).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, { foo: { name: 'Name' } })).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, [{ foo: { name: 'Name' } }])).toEqual([
          {
            foo: {
              name: 'Name',
              grade: 'A',
            },
          },
        ]);
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
          getDefaultFormState(testValidator, schema, [
            { foo: { name: 'first' } },
            { foo: { name: 'second' } },
            { foo: { name: 'third' } },
          ])
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
          "ignoring oneOf in dependencies because there isn't exactly one subschema that is valid"
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
        expect(getDefaultFormState(testValidator, schema, { foo: { name: 'Name' } })).toEqual({
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
        expect(getDefaultFormState(testValidator, schema)).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, undefined)).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, { can_1: { phy: null } })).toEqual({
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
        expect(getDefaultFormState(testValidator, schema, formData)).toEqual(result);
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
        expect(getDefaultFormState(testValidator, schema, formData)).toEqual(defaultedFormData);
      });
      it('returns field value of undefined when formData has undefined for field', () => {
        const formData = { field: undefined };
        expect(getDefaultFormState(testValidator, schema, formData)).toEqual(formData);
      });
      it('returns field value of default when formData has undefined for field and `useDefaultIfFormDataUndefined`', () => {
        const formData = { field: undefined };
        expect(
          getDefaultFormState(testValidator, schema, formData, undefined, undefined, {
            mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
          })
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
      expect(getDefaultFormState(testValidator, schema, undefined, schema, false)).toEqual({
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
      expect(getDefaultFormState(testValidator, schema, { requiredArray: ['raw0'] }, schema, false)).toEqual({
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
        getDefaultFormState(testValidator, schema, { requiredArray: ['raw0'] }, schema, false, {
          arrayMinItems: { mergeExtraDefaults: true },
        })
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
        getDefaultFormState(testValidator, schema, undefined, schema, false, {
          arrayMinItems: { populate: 'requiredOnly' },
        })
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
        getDefaultFormState(testValidator, schema, { requiredArray: ['raw0'] }, schema, false, {
          arrayMinItems: { populate: 'requiredOnly' },
        })
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
        getDefaultFormState(testValidator, schema, { requiredArray: ['raw0'] }, schema, false, {
          arrayMinItems: { populate: 'requiredOnly', mergeExtraDefaults: true },
        })
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
        getDefaultFormState(testValidator, schema, {}, schema, false, {
          arrayMinItems: {
            computeSkipPopulate: (_, schema) =>
              !Array.isArray(schema?.items) && typeof schema?.items !== 'boolean' && schema?.items?.type === 'number',
          },
        })
      ).toEqual({ stringArray: [undefined], numberArray: [] });
    });
  });
}
