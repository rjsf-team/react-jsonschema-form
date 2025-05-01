import { createSchemaUtils, getFirstMatchingOption, RJSFSchema } from '../../src';
import { TestValidatorType } from './types';

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
      expect(schemaUtils.getFirstMatchingOption(formData, options)).toEqual(1);
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
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
        required: ['code'],
      };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      expect(getFirstMatchingOption(testValidator, null, options, schema, 'code')).toEqual(0);
    });

    // simple in the sense of getOptionMatchingSimpleDiscriminator
    it('should return Bar when schema has simple discriminator for bar', () => {
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
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
        required: ['code'],
      };
      const formData = { code: 'bar_coding' };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      // Use the schemaUtils to verify the discriminator prop gets passed
      const schemaUtils = createSchemaUtils(testValidator, schema);
      expect(schemaUtils.getFirstMatchingOption(formData, options, 'code')).toEqual(1);
    });

    // simple in the sense of getOptionMatchingSimpleDiscriminator
    it('should return Bar when schema has non-simple discriminator for bar', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      // Mock isValid to pass the second value
      testValidator.setReturnValues({ isValid: [false, true] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: { title: 'Code', type: 'array', items: { type: 'string', enum: ['foo_coding'] } },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: { title: 'Code', type: 'array', items: { type: 'string', enum: ['bar_coding'] } },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
        required: ['code'],
      };
      const formData = { code: ['bar_coding'] };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      // Use the schemaUtils to verify the discriminator prop gets passed
      const schemaUtils = createSchemaUtils(testValidator, schema);
      const result = schemaUtils.getFirstMatchingOption(formData, options, 'code');
      const wasWarned = consoleWarnSpy.mock.calls.length > 0;
      if (wasWarned) {
        // According to the docs https://ajv.js.org/json-schema.html#discriminator, with ajv8 discrimator turned on the
        // schema in this test will fail because of the limitations of AJV implementation
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Error encountered compiling schema:',
          expect.objectContaining({
            message: 'discriminator: "properties/code" must have "const" or "enum"',
          }),
        );
        expect(result).toEqual(0);
      } else {
        expect(result).toEqual(1);
      }
      consoleWarnSpy.mockRestore();
    });
  });
}
