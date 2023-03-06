import get from 'lodash/get';

import { TestValidatorType } from './types';
import {
  createSchemaUtils,
  getClosestMatchingOption,
  RJSFSchema,
  SchemaUtilsType,
} from '../../src';
import { calculateIndexScore } from '../../src/schema/getClosestMatchingOption';
import {
  oneOfData,
  oneOfSchema,
  ONE_OF_SCHEMA_DATA,
  OPTIONAL_ONE_OF_DATA,
  OPTIONAL_ONE_OF_SCHEMA,
  ONE_OF_SCHEMA_OPTIONS,
  OPTIONAL_ONE_OF_SCHEMA_ONEOF,
} from '../testUtils/testData';

const firstOption = oneOfSchema.definitions!.first_option_def as RJSFSchema;
const secondOption = oneOfSchema.definitions!.second_option_def as RJSFSchema;

export default function getClosestMatchingOptionTest(
  testValidator: TestValidatorType
) {
  let schemaUtils: SchemaUtilsType;
  beforeAll(() => {
    schemaUtils = createSchemaUtils(testValidator, oneOfSchema);
  });
  describe('calculateIndexScore', () => {
    it('returns 0 when schema is not specified', () => {
      expect(
        calculateIndexScore(testValidator, OPTIONAL_ONE_OF_SCHEMA)
      ).toEqual(0);
    });
    it('returns 0 when schema.properties is undefined', () => {
      expect(
        calculateIndexScore(testValidator, OPTIONAL_ONE_OF_SCHEMA, {})
      ).toEqual(0);
    });
    it('returns 0 when schema.properties is not an object', () => {
      expect(
        calculateIndexScore(testValidator, OPTIONAL_ONE_OF_SCHEMA, {
          properties: 'foo',
        } as unknown as RJSFSchema)
      ).toEqual(0);
    });
    it('returns 0 when properties type is boolean', () => {
      expect(
        calculateIndexScore(testValidator, OPTIONAL_ONE_OF_SCHEMA, {
          properties: { foo: true },
        })
      ).toEqual(0);
    });
    it('returns 0 when formData is empty object', () => {
      expect(
        calculateIndexScore(testValidator, oneOfSchema, firstOption, {})
      ).toEqual(0);
    });
    it('returns 1 for first option in oneOf schema', () => {
      expect(
        calculateIndexScore(
          testValidator,
          oneOfSchema,
          firstOption,
          ONE_OF_SCHEMA_DATA
        )
      ).toEqual(1);
    });
    it('returns 8 for second option in oneOf schema', () => {
      expect(
        calculateIndexScore(
          testValidator,
          oneOfSchema,
          secondOption,
          ONE_OF_SCHEMA_DATA
        )
      ).toEqual(8);
    });
    it('returns 1 for a schema that has a type matching the formData type', () => {
      expect(
        calculateIndexScore(
          testValidator,
          oneOfSchema,
          { type: 'boolean' },
          true
        )
      ).toEqual(1);
    });
    it('returns 2 for a schema that has a const matching the formData value', () => {
      expect(
        calculateIndexScore(
          testValidator,
          oneOfSchema,
          { properties: { foo: { type: 'string', const: 'constValue' } } },
          { foo: 'constValue' }
        )
      ).toEqual(2);
    });
    it('returns 0 for a schema that has a const that does not match the formData value', () => {
      expect(
        calculateIndexScore(
          testValidator,
          oneOfSchema,
          { properties: { foo: { type: 'string', const: 'constValue' } } },
          { foo: 'aValue' }
        )
      ).toEqual(0);
    });
  });
  describe('oneOfMatchingOption', () => {
    it('oneOfSchema, oneOfData data, no options, returns -1', () => {
      expect(schemaUtils.getClosestMatchingOption(oneOfData, [])).toEqual(-1);
    });
    it('oneOfSchema, no data, 2 options, returns -1', () => {
      expect(
        schemaUtils.getClosestMatchingOption(undefined, [
          { type: 'string' },
          { type: 'number' },
        ])
      ).toEqual(-1);
    });
    it('oneOfSchema, oneOfData, no options, selectedOption 2, returns 2', () => {
      expect(schemaUtils.getClosestMatchingOption(oneOfData, [], 2)).toEqual(2);
    });
    it('oneOfSchema, no data, 2 options, returns -1', () => {
      expect(
        schemaUtils.getClosestMatchingOption(
          undefined,
          [{ type: 'string' }, { type: 'number' }],
          2
        )
      ).toEqual(2);
    });
    it('returns the first option, which kind of matches the data', () => {
      expect(
        getClosestMatchingOption(
          testValidator,
          oneOfSchema,
          { flag: true },
          ONE_OF_SCHEMA_OPTIONS
        )
      ).toEqual(0);
    });
    it('returns the second option, which exactly matches the data', () => {
      // First 3 are mocked false, with the fourth being true for the real second option
      testValidator.setReturnValues({ isValid: [false, false, false, true] });
      expect(
        getClosestMatchingOption(
          testValidator,
          oneOfSchema,
          ONE_OF_SCHEMA_DATA,
          ONE_OF_SCHEMA_OPTIONS
        )
      ).toEqual(1);
    });
    it('returns the first matching option (i.e. second index) when data is ambiguous', () => {
      testValidator.setReturnValues({
        isValid: [false, false, false, true, false, true],
      });
      const formData = { flag: false };
      expect(
        getClosestMatchingOption(
          testValidator,
          OPTIONAL_ONE_OF_SCHEMA,
          formData,
          OPTIONAL_ONE_OF_SCHEMA_ONEOF
        )
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
          OPTIONAL_ONE_OF_SCHEMA_ONEOF
        )
      ).toEqual(2);
    });
    it('returns the second option when data matches', () => {
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
        getClosestMatchingOption(
          testValidator,
          schema,
          formData,
          get(schema, 'items.oneOf')
        )
      ).toEqual(1);
    });
  });
}
