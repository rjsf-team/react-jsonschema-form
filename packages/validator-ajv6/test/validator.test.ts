import {
  ErrorSchema,
  ErrorSchemaBuilder,
  FormValidation,
  RJSFSchema,
  RJSFValidationError,
  UiSchema,
  ValidatorType,
} from '@rjsf/utils';

import AJV6Validator from '../src/validator';

const illFormedKey = "bar.`'[]()=+*&^%$#@!";
const metaSchemaDraft4 = require('ajv/lib/refs/json-schema-draft-04.json');
const metaSchemaDraft6 = require('ajv/lib/refs/json-schema-draft-06.json');

describe('AJV6Validator', () => {
  let builder: ErrorSchemaBuilder;
  beforeAll(() => {
    builder = new ErrorSchemaBuilder();
  });
  afterEach(() => {
    builder.resetAllErrors();
  });
  describe('default options', () => {
    // Use the AJV6Validator to access the `withIdRefPrefix` function
    let validator: AJV6Validator;
    beforeAll(() => {
      validator = new AJV6Validator({});
    });
    describe('validator.isValid()', () => {
      it('should return true if the data is valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        };

        expect(validator.isValid(schema, { foo: 'bar' }, schema)).toBe(true);
      });
      it('should return false if the data is not valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        };

        expect(validator.isValid(schema, { foo: 12345 }, schema)).toBe(false);
      });
      it('should return false if the schema is invalid', () => {
        const schema: RJSFSchema = 'foobarbaz' as unknown as RJSFSchema;

        expect(validator.isValid(schema, { foo: 'bar' }, schema)).toBe(false);
      });
      it('should return true if the data is valid against the schema including refs to rootSchema', () => {
        const schema: RJSFSchema = {
          anyOf: [{ $ref: '#/definitions/foo' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            foo: {
              properties: {
                name: { type: 'string' },
              },
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        expect(validator.isValid(schema, formData, rootSchema)).toBe(true);
      });
    });
    describe('validator.toErrorList()', () => {
      it('should return empty list for unspecified errorSchema', () => {
        expect(validator.toErrorList()).toEqual([]);
      });
      it('should convert an errorSchema into a flat list', () => {
        const errorSchema = builder
          .addErrors(['err1', 'err2'])
          .addErrors(['err3', 'err4'], 'a.b')
          .addErrors(['err5'], 'c').ErrorSchema;
        expect(validator.toErrorList(errorSchema)).toEqual([
          { property: '.', message: 'err1', stack: '. err1' },
          { property: '.', message: 'err2', stack: '. err2' },
          { property: '.a.b', message: 'err3', stack: '.a.b err3' },
          { property: '.a.b', message: 'err4', stack: '.a.b err4' },
          { property: '.c', message: 'err5', stack: '.c err5' },
        ]);
      });
    });
    describe('validator.validateFormData()', () => {
      describe('No custom validate function, single value', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              [illFormedKey]: { type: 'string' },
            },
          };
          const result = validator.validateFormData({ foo: 42, [illFormedKey]: 41 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });

        it('should return an error list', () => {
          expect(errors).toHaveLength(2);
          expect(errors[0].message).toEqual('should be string');
          expect(errors[1].message).toEqual('should be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('should be string');
          expect(errorSchema[illFormedKey]!.__errors).toHaveLength(1);
          expect(errorSchema[illFormedKey]!.__errors![0]).toEqual('should be string');
        });
      });
      describe('Validating multipleOf with a float', () => {
        let errors: RJSFValidationError[];
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              price: {
                title: 'Price per task ($)',
                type: 'number',
                multipleOf: 0.01,
                minimum: 0,
              },
            },
          };
          const result = validator.validateFormData({ price: 0.14 }, schema);
          errors = result.errors;
        });
        it('should not return an error', () => {
          expect(errors).toHaveLength(0);
        });
      });
      describe('Validating multipleOf with a float, with multiple errors', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              price: {
                title: 'Price per task ($)',
                type: 'number',
                multipleOf: 0.03,
                minimum: 1,
              },
            },
          };
          const result = validator.validateFormData({ price: 0.14 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it('should have 2 errors', () => {
          expect(errors).toHaveLength(2);
        });
        it('first error is for minimum', () => {
          expect(errors[0].message).toEqual('should be >= 1');
        });
        it('first error is for multipleOf', () => {
          expect(errors[1].message).toEqual('should be multiple of 0.03');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.price!.__errors).toHaveLength(2);
          expect(errorSchema.price!.__errors).toEqual(['should be >= 1', 'should be multiple of 0.03']);
        });
      });
      describe('Validating required fields', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        describe('formData is not provided at top level', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1', 'pass2'],
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
              },
            };

            const formData = { pass1: 'a' };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.pass2 is a required property');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual('is a required property');
          });
        });
        describe('formData is not provided for nested child', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                nested: {
                  type: 'object',
                  required: ['pass1', 'pass2'],
                  properties: {
                    pass1: { type: 'string' },
                    pass2: { type: 'string' },
                  },
                },
              },
            };

            const formData = { nested: { pass1: 'a' } };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.nested.pass2 is a required property');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.pass2!.__errors![0]).toEqual('is a required property');
          });
        });
      });
      describe('No custom validate function, single additionalProperties value', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          };
          const result = validator.validateFormData({ foo: 42 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });

        it('should return an error list', () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].message).toEqual('should be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('should be string');
        });
      });
      describe('TransformErrors', () => {
        let errors: RJSFValidationError[];
        let newErrorMessage: string;
        let transformErrors: jest.Mock;
        let uiSchema: UiSchema;
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              [illFormedKey]: { type: 'string' },
            },
          };
          uiSchema = {
            foo: { 'ui:label': false },
          };
          newErrorMessage = 'Better error message';
          transformErrors = jest.fn((errors: RJSFValidationError[]) => {
            return [Object.assign({}, errors[0], { message: newErrorMessage })];
          });
          const result = validator.validateFormData(
            { foo: 42, [illFormedKey]: 41 },
            schema,
            undefined,
            transformErrors,
            uiSchema
          );
          errors = result.errors;
        });

        it('should use transformErrors function', () => {
          expect(errors).not.toHaveLength(0);
          expect(errors[0].message).toEqual(newErrorMessage);
        });
        it('transformErrors function was called with uiSchema', () => {
          expect(transformErrors).toHaveBeenCalledWith(expect.any(Array), uiSchema);
        });
      });
      describe('Custom validate function', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        let validate: jest.Mock;
        let uiSchema: UiSchema;
        beforeAll(() => {
          uiSchema = {
            foo: { 'ui:label': false },
          };

          validate = jest.fn((formData: any, errors: FormValidation<any>) => {
            if (formData.pass1 !== formData.pass2) {
              errors.pass2!.addError('passwords don`t match.');
            }
            return errors;
          });
        });
        describe('formData is provided', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1', 'pass2'],
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
                foo: { type: 'array', items: { type: 'string' } }, // Adding an array for test coverage
              },
            };
            const formData = { pass1: 'a', pass2: 'b', foo: ['a'] };
            const result = validator.validateFormData(formData, schema, validate, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual('passwords don`t match.');
          });
          it('validate function was called with uiSchema', () => {
            expect(validate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), uiSchema);
          });
        });
        describe('formData is missing data', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
              },
            };
            const formData = { pass1: 'a' };
            const result = validator.validateFormData(formData, schema, validate);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual('passwords don`t match.');
          });
          it('validate function was called with undefined uiSchema', () => {
            expect(validate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), undefined);
          });
        });
      });
      describe('Data-Url validation', () => {
        let schema: RJSFSchema;
        beforeAll(() => {
          schema = {
            type: 'object',
            properties: {
              dataUrlWithName: { type: 'string', format: 'data-url' },
              dataUrlWithoutName: { type: 'string', format: 'data-url' },
            },
          };
        });
        it('Data-Url with name is accepted', () => {
          const formData = {
            dataUrlWithName: 'data:text/plain;name=file1.txt;base64,x=',
          };
          const result = validator.validateFormData(formData, schema);
          expect(result.errors).toHaveLength(0);
        });
        it('Data-Url without name is accepted', () => {
          const formData = {
            dataUrlWithoutName: 'data:text/plain;base64,x=',
          };
          const result = validator.validateFormData(formData, schema);
          expect(result.errors).toHaveLength(0);
        });
      });
      describe('Invalid schema', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: {
                type: 'string',
                required: 'invalid_type_non_array' as unknown as string[],
              },
            },
          };
          const result = validator.validateFormData({ foo: 42 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it('should return an error list', () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].name).toEqual('type');
          expect(errors[0].property).toEqual(".properties['foo'].required");
          // TODO: This schema path is wrong due to a bug in ajv; change this test when https://github.com/ajv-validator/ajv/issues/512 is fixed.
          expect(errors[0].schemaPath).toEqual('#/definitions/stringArray/type');
          expect(errors[0].message).toEqual('should be array');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.properties!.foo!.required!.__errors).toHaveLength(1);
          expect(errorSchema.properties!.foo!.required!.__errors![0]).toEqual('should be array');
        });
      });
    });
  });
  describe('validator.validateFormData(), custom options', () => {
    let validator: AJV6Validator;
    let schema: RJSFSchema;
    beforeAll(() => {
      validator = new AJV6Validator({});
      schema = {
        $ref: '#/definitions/Dataset',
        $schema: 'http://json-schema.org/draft-04/schema#',
        definitions: {
          Dataset: {
            properties: {
              datasetId: {
                pattern: '\\d+',
                type: 'string',
              },
            },
            required: ['datasetId'],
            type: 'object',
          },
        },
      };
    });
    it('should return a validation error about meta schema when meta schema is not defined', () => {
      const errors = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
      const errMessage = 'no schema with key or ref "http://json-schema.org/draft-04/schema#"';
      expect(errors.errors).toEqual([{ stack: errMessage }]);
      expect(errors.errorSchema).toEqual({
        $schema: { __errors: [errMessage] },
      });
    });
    describe('validating using single custom meta schema', () => {
      let errors: RJSFValidationError[];
      beforeAll(() => {
        validator = new AJV6Validator({
          additionalMetaSchemas: [metaSchemaDraft4],
        });
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId should match pattern "\\d+"');
      });
    });
    describe('validating using several custom meta schemas', () => {
      let errors: RJSFValidationError[];

      beforeAll(() => {
        validator = new AJV6Validator({
          additionalMetaSchemas: [metaSchemaDraft4, metaSchemaDraft6],
        });
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId should match pattern "\\d+"');
      });
    });
    describe('validating using custom string formats', () => {
      let validator: ValidatorType;
      let schema: RJSFSchema;
      beforeAll(() => {
        validator = new AJV6Validator({});
        schema = {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              format: 'phone-us',
            },
          },
        };
      });
      it('should not return a validation error if unknown string format is used', () => {
        const result = validator.validateFormData({ phone: '800.555.2368' }, schema);
        expect(result.errors.length).toEqual(0);
      });
      describe('validating using a custom formats', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          validator = new AJV6Validator({
            customFormats: {
              'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
              'area-code': /\d{3}/,
            },
          });
          const result = validator.validateFormData({ phone: '800.555.2368' }, schema);
          errors = result.errors;
        });
        it('should return 1 error about formData', () => {
          expect(errors).toHaveLength(1);
        });
        it('should return a validation error about formData', () => {
          expect(errors[0].stack).toEqual('.phone should match format "phone-us"');
        });
        describe('prop updates with new custom formats are accepted', () => {
          beforeAll(() => {
            const result = validator.validateFormData(
              { phone: 'abc' },
              {
                type: 'object',
                properties: {
                  phone: {
                    type: 'string',
                    format: 'area-code',
                  },
                },
              }
            );
            errors = result.errors;
          });

          it('should return 1 error about formData', () => {
            expect(errors).toHaveLength(1);
          });
          it('should return a validation error about formData', () => {
            expect(errors[0].stack).toEqual('.phone should match format "area-code"');
          });
        });
      });
    });
  });
});
