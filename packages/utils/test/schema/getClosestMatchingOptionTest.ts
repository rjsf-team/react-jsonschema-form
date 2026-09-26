import type { RJSFSchema, SchemaUtilsType } from '../../src/index.ts';
import { createSchemaUtils, getByPath, getClosestMatchingOption } from '../../src/index.ts';
import { calculateIndexScore } from '../../src/schema/getClosestMatchingOption.ts';
import {
  oneOfData,
  oneOfSchema,
  ONE_OF_SCHEMA_DATA,
  OPTIONAL_ONE_OF_DATA,
  OPTIONAL_ONE_OF_SCHEMA,
  ONE_OF_SCHEMA_OPTIONS,
  OPTIONAL_ONE_OF_SCHEMA_ONEOF,
} from '../testUtils/testData.ts';
import type { TestValidatorType } from './types.ts';

const firstOption = oneOfSchema.definitions!.first_option_def as RJSFSchema;
const secondOption = oneOfSchema.definitions!.second_option_def as RJSFSchema;

export default function getClosestMatchingOptionTest(testValidator: TestValidatorType) {
  let schemaUtils: SchemaUtilsType;
  beforeAll(() => {
    schemaUtils = createSchemaUtils(testValidator, oneOfSchema);
  });
  describe('calculateIndexScore', () => {
    it('returns 0 when schema is not specified', () => {
      expect(calculateIndexScore(testValidator, OPTIONAL_ONE_OF_SCHEMA)).toEqual(0);
    });
    it('returns 0 when schema.properties is undefined', () => {
      expect(calculateIndexScore(testValidator, OPTIONAL_ONE_OF_SCHEMA, {})).toEqual(0);
    });
    it('returns 0 when schema.properties is not an object', () => {
      expect(
        calculateIndexScore(testValidator, OPTIONAL_ONE_OF_SCHEMA, {
          properties: 'foo',
        } as unknown as RJSFSchema),
      ).toEqual(0);
    });
    it('returns 0 when properties type is boolean', () => {
      expect(
        calculateIndexScore(testValidator, OPTIONAL_ONE_OF_SCHEMA, {
          properties: { foo: true },
        }),
      ).toEqual(0);
    });
    it('returns 0 when formData is empty object', () => {
      expect(calculateIndexScore(testValidator, oneOfSchema, firstOption, {})).toEqual(0);
    });
    it('returns 1 for first option in oneOf schema', () => {
      expect(calculateIndexScore(testValidator, oneOfSchema, firstOption, ONE_OF_SCHEMA_DATA)).toEqual(1);
    });
    it('returns 8 for second option in oneOf schema', () => {
      expect(calculateIndexScore(testValidator, oneOfSchema, secondOption, ONE_OF_SCHEMA_DATA)).toEqual(9);
    });
    it('returns 1 for a schema that has a type matching the formData type', () => {
      expect(calculateIndexScore(testValidator, oneOfSchema, { type: 'boolean' }, true)).toEqual(1);
    });
    it('returns 2 for a schema that has a const matching the formData value', () => {
      expect(
        calculateIndexScore(
          testValidator,
          oneOfSchema,
          { properties: { foo: { type: 'string', const: 'constValue' } } },
          { foo: 'constValue' },
        ),
      ).toEqual(2);
    });
    it('scores a recursive $ref under a property named for an inherited member', () => {
      // `toString` is a legal property name, but every object has one, so reading it off the data with `.[key]` would
      // make the recursion look like it always had data left to score
      const schema: RJSFSchema = {
        definitions: {
          Node: {
            type: 'object',
            properties: { name: { type: 'string' }, toString: { $ref: '#/definitions/Node' } },
          },
        },
      };
      expect(calculateIndexScore(testValidator, schema, schema.definitions!.Node as RJSFSchema, { name: 'a' })).toEqual(
        1,
      );
    });
    it('returns 0 for a schema that has a const that does not match the formData value', () => {
      expect(
        calculateIndexScore(
          testValidator,
          oneOfSchema,
          { properties: { foo: { type: 'string', const: 'constValue' } } },
          { foo: 'aValue' },
        ),
      ).toEqual(0);
    });
  });
  describe('oneOfMatchingOption', () => {
    it('oneOfSchema, oneOfData data, no options, returns -1', () => {
      expect(schemaUtils.getClosestMatchingOption(oneOfData, [])).toEqual(-1);
    });
    it('oneOfSchema, no data, 2 options, returns -1', () => {
      expect(schemaUtils.getClosestMatchingOption(undefined, [{ type: 'string' }, { type: 'number' }])).toEqual(-1);
    });
    it('oneOfSchema, oneOfData, no options, selectedOption 2, returns 2', () => {
      expect(schemaUtils.getClosestMatchingOption(oneOfData, [], 2)).toEqual(2);
    });
    it('oneOfSchema, no data, 2 options, returns -1', () => {
      expect(schemaUtils.getClosestMatchingOption(undefined, [{ type: 'string' }, { type: 'number' }], 2)).toEqual(2);
    });
    it('returns the first option, which kind of matches the data', () => {
      expect(getClosestMatchingOption(testValidator, oneOfSchema, { flag: true }, ONE_OF_SCHEMA_OPTIONS)).toEqual(0);
    });
    it('returns the second option, which exactly matches the data', () => {
      // First 3 are mocked false, with the fourth being true for the real second option
      testValidator.setReturnValues({ isValid: [false, false, false, true] });
      expect(getClosestMatchingOption(testValidator, oneOfSchema, ONE_OF_SCHEMA_DATA, ONE_OF_SCHEMA_OPTIONS)).toEqual(
        1,
      );
    });
    it('returns the first matching option (i.e. second index) when data is ambiguous', () => {
      testValidator.setReturnValues({
        isValid: [false, false, false, true, false, true],
      });
      const formData = { flag: false };
      expect(
        getClosestMatchingOption(testValidator, OPTIONAL_ONE_OF_SCHEMA, formData, OPTIONAL_ONE_OF_SCHEMA_ONEOF),
      ).toEqual(1);
    });
    it('returns the third index when data is clear', () => {
      testValidator.setReturnValues({
        isValid: [false, false, false, false, false, true],
      });
      expect(
        getClosestMatchingOption(
          testValidator,
          OPTIONAL_ONE_OF_SCHEMA,
          OPTIONAL_ONE_OF_DATA,
          OPTIONAL_ONE_OF_SCHEMA_ONEOF,
        ),
      ).toEqual(2);
    });
    it('returns the second option when data matches for oneOf', () => {
      // From https://github.com/rjsf-team/react-jsonschema-form/issues/2944
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          oneOf: [
            {
              properties: {
                lorem: {
                  type: 'string',
                },
              },
              required: ['lorem'],
            },
            {
              properties: {
                ipsum: {
                  oneOf: [
                    {
                      properties: {
                        day: {
                          type: 'string',
                        },
                      },
                    },
                    {
                      properties: {
                        night: {
                          type: 'string',
                        },
                      },
                    },
                  ],
                },
              },
              required: ['ipsum'],
            },
          ],
        },
      };
      const formData = { ipsum: { night: 'nicht' } };
      // Mock to return true for the last of the second one-ofs
      testValidator.setReturnValues({
        isValid: [false, false, false, false, false, false, false, true],
      });
      expect(
        getClosestMatchingOption(testValidator, schema, formData, getByPath<RJSFSchema[]>(schema, ['items', 'oneOf'])),
      ).toEqual(1);
    });
    it('returns the second option when data matches for anyOf', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          anyOf: [
            {
              properties: {
                lorem: {
                  type: 'string',
                },
              },
              required: ['lorem'],
            },
            {
              properties: {
                ipsum: {
                  anyOf: [
                    {
                      properties: {
                        day: {
                          type: 'string',
                        },
                      },
                    },
                    {
                      properties: {
                        night: {
                          type: 'string',
                        },
                      },
                    },
                  ],
                },
              },
              required: ['ipsum'],
            },
          ],
        },
      };
      const formData = { ipsum: { night: 'nicht' } };
      // Mock to return true for the last of the second anyOfs
      testValidator.setReturnValues({
        isValid: [false, false, false, false, false, false, false, true],
      });
      expect(
        getClosestMatchingOption(testValidator, schema, formData, getByPath<RJSFSchema[]>(schema, ['items', 'anyOf'])),
      ).toEqual(1);
    });
    it('should return 0 when schema has discriminator but no matching data', () => {
      // Mock isValid to fail both values
      testValidator.setReturnValues({ isValid: [false, false, false, false] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: {
                title: 'Code',
                default: 'foo_coding',
                enum: ['foo_coding'],
                type: 'string',
              },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: {
                title: 'Code',
                default: 'bar_coding',
                enum: ['bar_coding'],
                type: 'string',
              },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
      };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      expect(getClosestMatchingOption(testValidator, schema, undefined, options, -1, 'code')).toEqual(-1);
    });
    it('should return Bar when schema has discriminator for bar', () => {
      // Mock isValid to pass the second value
      testValidator.setReturnValues({ isValid: [false, false, false, true] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: {
                title: 'Code',
                default: 'foo_coding',
                enum: ['foo_coding'],
                type: 'string',
              },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: {
                title: 'Code',
                default: 'bar_coding',
                enum: ['bar_coding'],
                type: 'string',
              },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
      };
      const formData = { code: 'bar_coding' };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      // Use the schemaUtils to verify the discriminator prop gets passed
      const schemaUtils = createSchemaUtils(testValidator, schema);
      expect(schemaUtils.getClosestMatchingOption(formData, options, 0, 'code')).toEqual(1);
    });
    describe('recursive $ref in an option, see https://github.com/rjsf-team/react-jsonschema-form/issues/5337', () => {
      const schema: RJSFSchema = {
        definitions: {
          Node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              child: { $ref: '#/definitions/Node' },
            },
          },
        },
      };
      const options: RJSFSchema[] = [
        { $ref: '#/definitions/Node' },
        { type: 'object', properties: { name: { type: 'string' }, other: { type: 'string' } } },
      ];
      beforeEach(() => {
        // Without mocked results every option matches the junk option too, so none is the single match and all of
        // them get scored, which is the only path that reaches the recursive $ref
        testValidator.setReturnValues({ isValid: [] });
      });
      it('terminates when the recursion runs out of form data', () => {
        // Neither option matches `{ child: 5 }` and both score 0, so the tie falls back to the selectedOption
        expect(getClosestMatchingOption(testValidator, schema, { child: 5 }, options)).toEqual(-1);
      });
      it('scores the recursive option as deep as the form data goes', () => {
        // The recursive option scores `name` at both levels, the flat one only at the top
        expect(getClosestMatchingOption(testValidator, schema, { name: 'a', child: { name: 'b' } }, options)).toEqual(
          0,
        );
      });
      it('terminates for a pair of mutually recursive definitions', () => {
        const mutualSchema: RJSFSchema = {
          definitions: {
            A: { type: 'object', properties: { name: { type: 'string' }, b: { $ref: '#/definitions/B' } } },
            B: { type: 'object', properties: { label: { type: 'string' }, a: { $ref: '#/definitions/A' } } },
          },
        };
        const mutualOptions: RJSFSchema[] = [{ $ref: '#/definitions/A' }, options[1]];
        // The recursive option scores `name`, the matching structure of `b` and the nested `label`, the flat one
        // only `name`
        expect(
          getClosestMatchingOption(testValidator, mutualSchema, { name: 'a', b: { label: 'x' } }, mutualOptions),
        ).toEqual(0);
      });
    });
  });
}
