import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
import {
  ErrorSchema,
  ErrorSchemaBuilder,
  FormValidation,
  RJSFSchema,
  RJSFValidationError,
  UiSchema,
  ValidatorType,
} from '@rjsf/utils';

import AJV8Validator from '../src/validator';
import { Localizer } from '../src';

const illFormedKey = "bar`'()=+*&^%$#@!";
const metaSchemaDraft6 = require('ajv/lib/refs/json-schema-draft-06.json');

describe('AJV8Validator', () => {
  let builder: ErrorSchemaBuilder;
  beforeAll(() => {
    builder = new ErrorSchemaBuilder();
  });
  afterEach(() => {
    builder.resetAllErrors();
  });
  describe('default options', () => {
    let validator: AJV8Validator;
    beforeAll(() => {
      validator = new AJV8Validator({});
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
      it('Only compiles the schema once', () => {
        const schema: RJSFSchema = {
          $id: 'schema-id',
        };

        const rootSchema: RJSFSchema = {
          $id: 'root-schema-id',
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        // @ts-expect-error - accessing private Ajv instance to verify compilation happens once
        const addSchemaSpy = jest.spyOn(validator.ajv, 'addSchema');
        addSchemaSpy.mockClear();

        // Call isValid twice with the same schema
        validator.isValid(schema, formData, rootSchema);
        validator.isValid(schema, formData, rootSchema);

        // Root schema is added twice
        expect(addSchemaSpy).toHaveBeenCalledTimes(3);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(1, expect.objectContaining(rootSchema), rootSchema.$id);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(2, expect.objectContaining(schema), schema.$id);
        expect(addSchemaSpy).toHaveBeenLastCalledWith(expect.objectContaining(rootSchema), rootSchema.$id);
      });
      it('should fallback to using compile', () => {
        const schema: RJSFSchema = {
          $id: 'schema-id-2',
        };

        const rootSchema: RJSFSchema = {
          $id: 'root-schema-id',
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        // @ts-expect-error - accessing private Ajv instance to verify compilation happens once
        const ajvInstance = validator.ajv;
        const originalGetSchema = ajvInstance.getSchema.bind(ajvInstance);
        const getSchemaSpy = jest.spyOn(ajvInstance, 'getSchema');
        getSchemaSpy.mockClear();
        getSchemaSpy.mockImplementation((schemaId) => {
          if (schemaId === schema.$id) {
            return undefined;
          }

          return originalGetSchema(schemaId);
        });

        const compileSpy = jest.spyOn(ajvInstance, 'compile');
        compileSpy.mockClear();

        // Call isValid twice with the same schema
        validator.isValid(schema, formData, rootSchema);
        validator.isValid(schema, formData, rootSchema);

        getSchemaSpy.mockRestore();
        expect(compileSpy).toHaveBeenCalledTimes(1);
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
          expect(errors[0].message).toEqual('must be string');
          expect(errors[1].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
          expect(errorSchema[illFormedKey]!.__errors).toHaveLength(1);
          expect(errorSchema[illFormedKey]!.__errors![0]).toEqual('must be string');
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
          expect(errors[0].message).toEqual('must be >= 1');
        });
        it('first error is for multipleOf', () => {
          expect(errors[1].message).toEqual('must be multiple of 0.03');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.price!.__errors).toHaveLength(2);
          expect(errorSchema.price!.__errors).toEqual(['must be >= 1', 'must be multiple of 0.03']);
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
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
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
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
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
          expect(errors[0].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
        });
      });
      describe("Doesn't recompile a schema with a specified ID", () => {
        it('Only compiles the schema once', () => {
          const schema: RJSFSchema = {
            $id: 'this-schema-has-an-id',
            type: 'object',
            properties: {
              string: {
                type: 'string',
              },
            },
          };

          // @ts-expect-error - accessing private Ajv instance to verify compilation happens once
          const compileSpy = jest.spyOn(validator.ajv, 'compile');
          compileSpy.mockClear();

          // Call validateFormData twice with the same schema
          validator.validateFormData({ string: 'a' }, schema);
          validator.validateFormData({ string: 'b' }, schema);

          expect(compileSpy).toHaveBeenCalledTimes(1);
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
          expect(errors[0].stack).toEqual('schema is invalid: data/properties/foo/required must be array');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema).toEqual({
            $schema: {
              __errors: ['schema is invalid: data/properties/foo/required must be array'],
            },
          });
        });
      });
    });
  });
  describe('default options, with Ajv2019', () => {
    let validator: AJV8Validator;
    beforeAll(() => {
      validator = new AJV8Validator({ AjvClass: Ajv2019 });
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
      it('Only compiles the schema once', () => {
        const schema: RJSFSchema = {
          $id: 'schema-id',
        };

        const rootSchema: RJSFSchema = {
          $id: 'root-schema-id',
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        // @ts-expect-error - accessing private Ajv instance to verify compilation happens once
        const addSchemaSpy = jest.spyOn(validator.ajv, 'addSchema');
        addSchemaSpy.mockClear();

        // Call isValid twice with the same schema
        validator.isValid(schema, formData, rootSchema);
        validator.isValid(schema, formData, rootSchema);

        // Root schema is added twice
        expect(addSchemaSpy).toHaveBeenCalledTimes(3);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(1, expect.objectContaining(rootSchema), rootSchema.$id);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(2, expect.objectContaining(schema), schema.$id);
        expect(addSchemaSpy).toHaveBeenLastCalledWith(expect.objectContaining(rootSchema), rootSchema.$id);
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
          expect(errors[0].message).toEqual('must be string');
          expect(errors[1].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
          expect(errorSchema[illFormedKey]!.__errors).toHaveLength(1);
          expect(errorSchema[illFormedKey]!.__errors![0]).toEqual('must be string');
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
          expect(errors[0].message).toEqual('must be >= 1');
        });
        it('first error is for multipleOf', () => {
          expect(errors[1].message).toEqual('must be multiple of 0.03');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.price!.__errors).toHaveLength(2);
          expect(errorSchema.price!.__errors).toEqual(['must be >= 1', 'must be multiple of 0.03']);
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
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
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
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
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
          expect(errors[0].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
        });
      });
      describe("Doesn't recompile a schema with a specified ID", () => {
        it('Only compiles the schema once', () => {
          const schema: RJSFSchema = {
            $id: 'this-schema-has-an-id',
            type: 'object',
            properties: {
              string: {
                title: 'String field',
                type: 'string',
              },
            },
          };

          // @ts-expect-error - accessing private Ajv instance to verify compilation happens once
          const compileSpy = jest.spyOn(validator.ajv, 'compile');
          compileSpy.mockClear();

          // Call validateFormData twice with the same schema
          validator.validateFormData({ string: 'a' }, schema);
          validator.validateFormData({ string: 'b' }, schema);

          expect(compileSpy).toHaveBeenCalledTimes(1);
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
          expect(errors[0].stack).toEqual('schema is invalid: data/properties/foo/required must be array');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema).toEqual({
            $schema: {
              __errors: ['schema is invalid: data/properties/foo/required must be array'],
            },
          });
        });
      });
    });
  });
  describe('default options, with Ajv2020', () => {
    let validator: AJV8Validator;
    beforeAll(() => {
      validator = new AJV8Validator({ AjvClass: Ajv2020 });
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
      it('Only compiles the schema once', () => {
        const schema: RJSFSchema = {
          $id: 'schema-id',
        };

        const rootSchema: RJSFSchema = {
          $id: 'root-schema-id',
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        // @ts-expect-error - accessing private Ajv instance to verify compilation happens once
        const addSchemaSpy = jest.spyOn(validator.ajv, 'addSchema');
        addSchemaSpy.mockClear();

        // Call isValid twice with the same schema
        validator.isValid(schema, formData, rootSchema);
        validator.isValid(schema, formData, rootSchema);

        // Root schema is added twice
        expect(addSchemaSpy).toHaveBeenCalledTimes(3);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(1, expect.objectContaining(rootSchema), rootSchema.$id);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(2, expect.objectContaining(schema), schema.$id);
        expect(addSchemaSpy).toHaveBeenLastCalledWith(expect.objectContaining(rootSchema), rootSchema.$id);
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
          expect(errors[0].message).toEqual('must be string');
          expect(errors[1].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
          expect(errorSchema[illFormedKey]!.__errors).toHaveLength(1);
          expect(errorSchema[illFormedKey]!.__errors![0]).toEqual('must be string');
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
          expect(errors[0].message).toEqual('must be >= 1');
        });
        it('first error is for multipleOf', () => {
          expect(errors[1].message).toEqual('must be multiple of 0.03');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.price!.__errors).toHaveLength(2);
          expect(errorSchema.price!.__errors).toEqual(['must be >= 1', 'must be multiple of 0.03']);
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
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
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
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
          });
        });
        describe('title is in validation messages at the top level', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['firstName', 'lastName'],
              properties: {
                firstName: { title: 'First Name', type: 'string' },
                lastName: { title: 'Last Name', type: 'string' },
                numberOfChildren: {
                  title: 'Number of children',
                  type: 'string',
                  pattern: '\\d+',
                },
              },
            };

            const formData = { firstName: 'a', numberOfChildren: 'aa' };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'Last Name'",
              '\'Number of children\' must match pattern "\\d+"',
            ]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.lastName!.__errors![0]).toEqual("must have required property 'Last Name'");

            expect(errorSchema.numberOfChildren!.__errors).toHaveLength(1);
            expect(errorSchema.numberOfChildren!.__errors![0]).toEqual('must match pattern "\\d+"');
          });
        });
        describe('title is in validation message with a nested child', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                nested: {
                  type: 'object',
                  required: ['firstName', 'lastName'],
                  properties: {
                    firstName: { type: 'string', title: 'First Name' },
                    lastName: { type: 'string', title: 'Last Name' },
                    numberOfChildren: {
                      title: 'Number of children',
                      type: 'string',
                      pattern: '\\d+',
                    },
                  },
                },
              },
            };

            const formData = {
              nested: { firstName: 'a', numberOfChildren: 'aa' },
            };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);
            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'Last Name'",
              '\'Number of children\' must match pattern "\\d+"',
            ]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.lastName!.__errors![0]).toEqual("must have required property 'Last Name'");

            expect(errorSchema.nested!.numberOfChildren!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.numberOfChildren!.__errors![0]).toEqual('must match pattern "\\d+"');
          });
        });
        describe('title is in validation message when it is in the uiSchema ui:title field', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['firstName', 'lastName'],
              properties: {
                firstName: { title: 'First Name', type: 'string' },
                lastName: { title: 'Last Name', type: 'string' },
                numberOfChildren: {
                  title: 'Number of children',
                  type: 'string',
                  pattern: '\\d+',
                },
              },
            };
            const uiSchema: UiSchema = {
              lastName: {
                'ui:title': 'uiSchema Last Name',
              },
              numberOfChildren: {
                'ui:title': 'uiSchema Number of children',
              },
            };

            const formData = { firstName: 'a', numberOfChildren: 'aa' };
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'uiSchema Last Name'",
              '\'uiSchema Number of children\' must match pattern "\\d+"',
            ]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.lastName!.__errors![0]).toEqual("must have required property 'uiSchema Last Name'");

            expect(errorSchema.numberOfChildren!.__errors).toHaveLength(1);
            expect(errorSchema.numberOfChildren!.__errors![0]).toEqual('must match pattern "\\d+"');
          });
        });
        describe('uiSchema title in validation when defined in nested field', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                nested: {
                  type: 'object',
                  required: ['firstName', 'lastName'],
                  properties: {
                    firstName: { type: 'string', title: 'First Name' },
                    lastName: { type: 'string', title: 'Last Name' },
                    numberOfChildren: {
                      title: 'Number of children',
                      type: 'string',
                      pattern: '\\d+',
                    },
                  },
                },
              },
            };
            const uiSchema: UiSchema = {
              nested: {
                lastName: {
                  'ui:title': 'uiSchema Last Name',
                },
                numberOfChildren: {
                  'ui:title': 'uiSchema Number of children',
                },
              },
            };

            const formData = {
              nested: { firstName: 'a', numberOfChildren: 'aa' },
            };
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);
            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'uiSchema Last Name'",
              '\'uiSchema Number of children\' must match pattern "\\d+"',
            ]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.lastName!.__errors![0]).toEqual(
              "must have required property 'uiSchema Last Name'"
            );

            expect(errorSchema.nested!.numberOfChildren!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.numberOfChildren!.__errors![0]).toEqual('must match pattern "\\d+"');
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
          expect(errors[0].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
        });
      });
      describe("Doesn't recompile a schema with a specified ID", () => {
        it('Only compiles the schema once', () => {
          const schema: RJSFSchema = {
            $id: 'this-schema-has-an-id',
            type: 'object',
            properties: {
              string: {
                title: 'String field',
                type: 'string',
              },
            },
          };

          // @ts-expect-error - accessing private Ajv instance to verify compilation happens once
          const compileSpy = jest.spyOn(validator.ajv, 'compile');
          compileSpy.mockClear();

          // Call validateFormData twice with the same schema
          validator.validateFormData({ string: 'a' }, schema);
          validator.validateFormData({ string: 'b' }, schema);

          expect(compileSpy).toHaveBeenCalledTimes(1);
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
          expect(errors[0].stack).toEqual('schema is invalid: data/properties/foo/required must be array');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema).toEqual({
            $schema: {
              __errors: ['schema is invalid: data/properties/foo/required must be array'],
            },
          });
        });
      });
    });
  });
  describe('validator.validateFormData(), custom options, and localizer', () => {
    let validator: AJV8Validator;
    let schema: RJSFSchema;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = jest.fn().mockImplementation();
      validator = new AJV8Validator({}, localizer);
      schema = {
        $ref: '#/definitions/Dataset',
        $schema: 'http://json-schema.org/draft-06/schema#',
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
      const errMessage = 'no schema with key or ref "http://json-schema.org/draft-06/schema#"';
      expect(errors.errors).toEqual([{ stack: errMessage }]);
      expect(errors.errorSchema).toEqual({
        $schema: { __errors: [errMessage] },
      });
      expect(localizer).not.toHaveBeenCalled();
    });
    describe('validating using single custom meta schema', () => {
      let errors: RJSFValidationError[];
      beforeAll(() => {
        (localizer as jest.Mock).mockClear();
        validator = new AJV8Validator(
          {
            additionalMetaSchemas: [metaSchemaDraft6],
          },
          localizer
        );
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
      it('localizer was called with the errors', () => {
        expect(localizer).toHaveBeenCalledWith([
          {
            data: 'some kind of text',
            instancePath: '/datasetId',
            keyword: 'pattern',
            message: 'must match pattern "\\d+"',
            params: { pattern: '\\d+' },
            parentSchema: {
              pattern: '\\d+',
              type: 'string',
            },
            schema: '\\d+',
            schemaPath: '#/definitions/Dataset/properties/datasetId/pattern',
          },
        ]);
      });
    });
    describe('validating using several custom meta schemas', () => {
      let errors: RJSFValidationError[];

      beforeAll(() => {
        validator = new AJV8Validator({
          additionalMetaSchemas: [metaSchemaDraft6],
        });
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
    });
    describe('validating using custom string formats', () => {
      let validator: ValidatorType;
      let schema: RJSFSchema;
      beforeAll(() => {
        validator = new AJV8Validator({});
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
        expect(result.errors).toHaveLength(0);
      });
      describe('validating using a custom formats', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          validator = new AJV8Validator({
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
          expect(errors[0].stack).toEqual('.phone must match format "phone-us"');
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
            expect(errors[0].stack).toEqual('.phone must match format "area-code"');
          });
        });
      });
    });
  });
  describe('validator.validateFormData(), custom options, localizer and Ajv2019', () => {
    let validator: AJV8Validator;
    let schema: RJSFSchema;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = jest.fn().mockImplementation();
      validator = new AJV8Validator({ AjvClass: Ajv2019 }, localizer);
      schema = {
        $ref: '#/definitions/Dataset',
        $schema: 'http://json-schema.org/draft-06/schema#',
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
      const errMessage = 'no schema with key or ref "http://json-schema.org/draft-06/schema#"';
      expect(errors.errors).toEqual([{ stack: errMessage }]);
      expect(errors.errorSchema).toEqual({
        $schema: { __errors: [errMessage] },
      });
      expect(localizer).not.toHaveBeenCalled();
    });
    describe('validating using single custom meta schema', () => {
      let errors: RJSFValidationError[];
      beforeAll(() => {
        (localizer as jest.Mock).mockClear();
        validator = new AJV8Validator(
          {
            additionalMetaSchemas: [metaSchemaDraft6],
            AjvClass: Ajv2019,
          },
          localizer
        );
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
      it('localizer was called with the errors', () => {
        expect(localizer).toHaveBeenCalledWith([
          {
            data: 'some kind of text',
            instancePath: '/datasetId',
            keyword: 'pattern',
            message: 'must match pattern "\\d+"',
            params: { pattern: '\\d+' },
            parentSchema: {
              pattern: '\\d+',
              type: 'string',
            },
            schema: '\\d+',
            schemaPath: '#/definitions/Dataset/properties/datasetId/pattern',
          },
        ]);
      });
    });
    describe('validating using several custom meta schemas', () => {
      let errors: RJSFValidationError[];

      beforeAll(() => {
        validator = new AJV8Validator({
          additionalMetaSchemas: [metaSchemaDraft6],
          AjvClass: Ajv2019,
        });
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
    });
    describe('validating using custom string formats', () => {
      let validator: ValidatorType;
      let schema: RJSFSchema;
      beforeAll(() => {
        validator = new AJV8Validator({ AjvClass: Ajv2019 });
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
        expect(result.errors).toHaveLength(0);
      });
      describe('validating using a custom formats', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          validator = new AJV8Validator({
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
          expect(errors[0].stack).toEqual('.phone must match format "phone-us"');
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
            expect(errors[0].stack).toEqual('.phone must match format "area-code"');
          });
        });
      });
    });
  });
  describe('validator.validateFormData(), custom options, localizer and Ajv2020', () => {
    let validator: AJV8Validator;
    let schema: RJSFSchema;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = jest.fn().mockImplementation();
      validator = new AJV8Validator({ AjvClass: Ajv2020 }, localizer);
      schema = {
        $ref: '#/definitions/Dataset',
        $schema: 'http://json-schema.org/draft-06/schema#',
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
      const errMessage = 'no schema with key or ref "http://json-schema.org/draft-06/schema#"';
      expect(errors.errors).toEqual([{ stack: errMessage }]);
      expect(errors.errorSchema).toEqual({
        $schema: { __errors: [errMessage] },
      });
      expect(localizer).not.toHaveBeenCalled();
    });
    describe('validating using single custom meta schema', () => {
      let errors: RJSFValidationError[];
      beforeAll(() => {
        (localizer as jest.Mock).mockClear();
        validator = new AJV8Validator(
          {
            additionalMetaSchemas: [metaSchemaDraft6],
            AjvClass: Ajv2020,
          },
          localizer
        );
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
      it('localizer was called with the errors', () => {
        expect(localizer).toHaveBeenCalledWith([
          {
            data: 'some kind of text',
            instancePath: '/datasetId',
            keyword: 'pattern',
            message: 'must match pattern "\\d+"',
            params: { pattern: '\\d+' },
            parentSchema: {
              pattern: '\\d+',
              type: 'string',
            },
            schema: '\\d+',
            schemaPath: '#/definitions/Dataset/properties/datasetId/pattern',
          },
        ]);
      });
    });
    describe('validating using several custom meta schemas', () => {
      let errors: RJSFValidationError[];

      beforeAll(() => {
        validator = new AJV8Validator({
          additionalMetaSchemas: [metaSchemaDraft6],
          AjvClass: Ajv2020,
        });
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
    });
    describe('validating using custom string formats', () => {
      let validator: ValidatorType;
      let schema: RJSFSchema;
      beforeAll(() => {
        validator = new AJV8Validator({ AjvClass: Ajv2020 });
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
        expect(result.errors).toHaveLength(0);
      });
      describe('validating using a custom formats', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          validator = new AJV8Validator({
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
          expect(errors[0].stack).toEqual('.phone must match format "phone-us"');
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
            expect(errors[0].stack).toEqual('.phone must match format "area-code"');
          });
        });
      });
    });
  });
});
