import { stubExistingAdditionalProperties, RJSFSchema, ADDITIONAL_PROPERTY_FLAG, createSchemaUtils } from '../../src';
import getTestValidator, { TestValidatorType } from '../testUtils/getTestValidator';

describe('stubExistingAdditionalProperties()', () => {
  let testValidator: TestValidatorType;
  beforeAll(() => {
    testValidator = getTestValidator({});
  });
  it('deals with undefined formData', () => {
    const schema: RJSFSchema = { type: 'string' };
    expect(stubExistingAdditionalProperties(testValidator, schema)).toEqual({
      ...schema,
      properties: {}
    });
  });
  it('deals with non-object formData', () => {
    const schema: RJSFSchema = { type: 'string' };
    expect(stubExistingAdditionalProperties(testValidator, schema, undefined, [])).toEqual({
      ...schema,
      properties: {}
    });
  });
  it('has property keys that match formData, additonalProperties is boolean', () => {
    const schema: RJSFSchema = {
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' }
      },
      additionalProperties: true,
    };
    const formData = { foo: 'blah', bar: 1, baz: true };
    expect(stubExistingAdditionalProperties(testValidator, schema, undefined, formData)).toEqual({
      ...schema,
      properties: {
        ...schema.properties,
        baz: {
          [ADDITIONAL_PROPERTY_FLAG]: true,
        }
      }
    });
  });
  it('has additionalProperties of type number', () => {
    const schema: RJSFSchema = {
      additionalProperties: { type: 'number' },
    };
    const formData = { bar: 1 };
    expect(stubExistingAdditionalProperties(testValidator, schema, undefined, formData)).toEqual({
      ...schema,
      properties: {
        bar: {
          ...(schema.additionalProperties as object),
          [ADDITIONAL_PROPERTY_FLAG]: true,
        }
      }
    });
  });
  it('has additionalProperties of empty object', () => {
    const schema: RJSFSchema = {
      additionalProperties: {},
    };
    const formData = { foo: 'blah', bar: 1, baz: true };
    expect(stubExistingAdditionalProperties(testValidator, schema, undefined, formData)).toEqual({
      ...schema,
      properties: {
        foo: {
          type: 'string',
          [ADDITIONAL_PROPERTY_FLAG]: true
        },
        bar: {
          type: 'number',
          [ADDITIONAL_PROPERTY_FLAG]: true
        },
        baz: {
          type: 'boolean',
          [ADDITIONAL_PROPERTY_FLAG]: true
        }
      }
    });
  });
  it('has additionalProperties with a ref', () => {
    const schema: RJSFSchema = {
      additionalProperties: { $ref: '#/definitions/foo' },
    };
    const rootSchema: RJSFSchema = {
      definitions: {
        foo: { type: 'string' }
      }
    };
    const schemaUtils = createSchemaUtils(testValidator, rootSchema);
    const formData = { bar: 'blah' };
    expect(schemaUtils.stubExistingAdditionalProperties(schema, formData)).toEqual({
      ...schema,
      properties: {
        bar: {
          type: 'string',
          [ADDITIONAL_PROPERTY_FLAG]: true,
        }
      }
    });
  });
});
