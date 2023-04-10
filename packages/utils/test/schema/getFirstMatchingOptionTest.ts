import { createSchemaUtils, getFirstMatchingOption, RJSFSchema } from '../../src';
import { TestValidatorType } from './types';

// Since getFirstMatchingOption() simply calls getMatchingOption() there is no need to have tests for that
export default function getFirstMatchingOptionTest(testValidator: TestValidatorType) {
  describe('getFirstMatchingOption()', () => {
    let rootSchema: RJSFSchema;
    beforeAll(() => {
      rootSchema = {
        definitions: {
          a: { type: 'object', properties: { id: { enum: ['a'] } } },
          nested: {
            type: 'object',
            properties: {
              id: { enum: ['nested'] },
              child: { $ref: '#/definitions/any' },
            },
          },
          any: {
            anyOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/nested' }],
          },
        },
        $ref: '#/definitions/any',
      };
    });
    it('should infer correct anyOf schema based on data if passing undefined', () => {
      const options: RJSFSchema[] = [
        { type: 'object', properties: { id: { enum: ['a'] } } },
        {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/definitions/any' },
          },
        },
      ];
      expect(getFirstMatchingOption(testValidator, undefined, options, rootSchema)).toEqual(0);
    });
    it('should infer correct anyOf schema with properties also having anyOf/allOf', () => {
      // Mock isValid to iterate through both options by failing the first
      testValidator.setReturnValues({ isValid: [false, false] });
      const options: RJSFSchema[] = [
        {
          type: 'object',
          properties: { id: { enum: ['a'] } },
          anyOf: [{ type: 'string' }, { type: 'boolean' }],
        },
        {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/definitions/any' },
          },
          anyOf: [{ type: 'number' }, { type: 'boolean' }],
          allOf: [{ type: 'string' }],
        },
      ];
      expect(getFirstMatchingOption(testValidator, null, options, rootSchema)).toEqual(0);
    });
    it('returns 0 if no options match', () => {
      // Mock isValid fail all the tests to trigger the fall-through
      testValidator.setReturnValues({ isValid: [false, false, false] });
      const options: RJSFSchema[] = [{ type: 'string' }, { type: 'string' }, { type: 'null' }];
      expect(getFirstMatchingOption(testValidator, undefined, options, rootSchema)).toEqual(0);
    });
    it('should infer correct anyOf schema based on data if passing null and option 2 is {type: null}', () => {
      // Mock isValid fail the first two, non-null values
      testValidator.setReturnValues({ isValid: [false, false, true] });
      const options: RJSFSchema[] = [{ type: 'string' }, { type: 'string' }, { type: 'null' }];
      expect(getFirstMatchingOption(testValidator, null, options, rootSchema)).toEqual(2);
    });
    it('should infer correct anyOf schema based on data', () => {
      // Mock isValid to fail the first non-nested value
      testValidator.setReturnValues({ isValid: [false, true] });
      const options: RJSFSchema[] = [
        { type: 'object', properties: { id: { enum: ['a'] } } },
        {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/definitions/any' },
          },
        },
      ];
      const formData = {
        id: 'nested',
        child: {
          id: 'nested',
          child: {
            id: 'a',
          },
        },
      };
      const schemaUtils = createSchemaUtils(testValidator, rootSchema);
      expect(schemaUtils.getFirstMatchingOption(formData, options)).toEqual(1);
      // Mock again isValid fail the first non-nested value
      testValidator.setReturnValues({ isValid: [false, true] });
      // Test getMatchingOption call from `schemaUtils` to maintain coverage, delete when getMatchingOption is removed
      expect(schemaUtils.getMatchingOption(formData, options)).toEqual(1);
    });
    it('should return 0 when schema has discriminator but no matching data', () => {
      // Mock isValid to fail both values
      testValidator.setReturnValues({ isValid: [false, false] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: { title: 'Code', default: 'foo_coding', enum: ['foo_coding'], type: 'string' },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: { title: 'Code', default: 'bar_coding', enum: ['bar_coding'], type: 'string' },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
          mapping: {
            foo_coding: '#/definitions/Foo',
            bar_coding: '#/definitions/Bar',
          },
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
      };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      expect(getFirstMatchingOption(testValidator, null, options, schema, 'code')).toEqual(0);
    });
    it('should return Bar when schema has discriminator for bar', () => {
      // Mock isValid to pass the second value
      testValidator.setReturnValues({ isValid: [false, true] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: { title: 'Code', default: 'foo_coding', enum: ['foo_coding'], type: 'string' },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: { title: 'Code', default: 'bar_coding', enum: ['bar_coding'], type: 'string' },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
          mapping: {
            foo_coding: '#/definitions/Foo',
            bar_coding: '#/definitions/Bar',
          },
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
      };
      const formData = { code: 'bar_coding' };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      // Use the schemaUtils to verify the discriminator prop gets passed
      const schemaUtils = createSchemaUtils(testValidator, schema);
      expect(schemaUtils.getFirstMatchingOption(formData, options, 'code')).toEqual(1);
    });
  });
}
