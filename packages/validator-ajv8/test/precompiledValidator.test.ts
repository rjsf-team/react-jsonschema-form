import {
  ErrorSchema,
  ErrorSchemaBuilder,
  FormValidation,
  hashForSchema,
  RJSFSchema,
  RJSFValidationError,
  UiSchema,
  JUNK_OPTION_ID,
} from '@rjsf/utils';

import AJV8PrecompiledValidator from '../src/precompiledValidator';
import { Localizer, ValidatorFunctions } from '../src';
import * as superSchemaFns from './harness/superSchema';
import * as superSchemaOptionsFns from './harness/superSchemaOptions';
import superSchema from './harness/superSchema.json';

const validateFns = superSchemaFns as ValidatorFunctions;
const validateOptionsFns = superSchemaOptionsFns as ValidatorFunctions;
const rootSchema = superSchema as RJSFSchema;

describe('AJV8PrecompiledValidator', () => {
  let builder: ErrorSchemaBuilder;
  beforeAll(() => {
    builder = new ErrorSchemaBuilder();
  });
  afterEach(() => {
    builder.resetAllErrors();
  });
  describe('default options', () => {
    // Use the AJV8PrecompiledValidator
    let validator: AJV8PrecompiledValidator;
    beforeAll(() => {
      validator = new AJV8PrecompiledValidator(validateFns, rootSchema);
    });
    describe('validator.isValid()', () => {
      it('should return true if the data is valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          anyOf: [
            {
              required: ['name'],
            },
          ],
        };

        expect(validator.isValid(schema, { name: 'bar' }, rootSchema)).toBe(true);
      });
      it('should return false if the data is not valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          anyOf: [
            {
              required: ['name'],
            },
          ],
        };

        expect(validator.isValid(schema, { name: 12345 }, rootSchema)).toBe(false);
      });
      it('should return false if junk option id is passed', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          $id: JUNK_OPTION_ID,
        };
        expect(validator.isValid(schema, { name: 'foo' }, rootSchema)).toBe(false);
      });
      it('should throw if the schema is not recognized', () => {
        const schema: RJSFSchema = 'foobarbaz' as unknown as RJSFSchema;
        const hash = hashForSchema(schema);
        expect(() => validator.isValid(schema, { name: 'bar' }, rootSchema)).toThrowError(
          new Error(`No precompiled validator function was found for the given schema for "${hash}"`)
        );
      });
      it('should throw if the rootSchema is different than the one the validator was constructed with', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        expect(() => validator.isValid(schema, { foo: { name: 'bar' } }, schema)).toThrowError(
          new Error(
            'The schema associated with the precompiled validator differs from the rootSchema provided for validation'
          )
        );
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
      it('throws an error when the schemas differ', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        expect(() => validator.validateFormData({}, schema)).toThrowError(
          new Error('The schema associated with the precompiled schema differs from the schema provided for validation')
        );
      });
      describe('No custom validate function, single value of correct type generates no errors', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          const result = validator.validateFormData({ foo: '42' }, rootSchema);
          errors = result.errors;
        });

        it('should return an empty error list', () => {
          expect(errors).toHaveLength(0);
        });
      });
      describe('No custom validate function, single value of wrong type generates error', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const result = validator.validateFormData({ foo: 42 }, rootSchema);
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
      describe('Validating multipleOf with a float', () => {
        let errors: RJSFValidationError[];
        beforeAll(() => {
          const result = validator.validateFormData({ price: 1.05 }, rootSchema);
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
          const result = validator.validateFormData({ price: 0.14 }, rootSchema);
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
        describe('formData is provided at top level', () => {
          beforeAll(() => {
            const formData = { passwords: { pass1: 'a', pass2: 'b' } };
            const result = validator.validateFormData(formData, rootSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an empty error list', () => {
            expect(errors).toHaveLength(0);
          });
        });
        describe('formData is not provided at top level', () => {
          beforeAll(() => {
            const formData = { passwords: { pass1: 'a' } };
            const result = validator.validateFormData(formData, rootSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.passwords!.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.passwords!.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
          });
        });
      });
      describe('No custom validate function, single additionalProperties value of correct type', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          const result = validator.validateFormData({ anything: { foo: '42' } }, rootSchema);
          errors = result.errors;
        });

        it('should return an empty error list', () => {
          expect(errors).toHaveLength(0);
        });
      });
      describe('No custom validate function, single additionalProperties value of wrong type', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const result = validator.validateFormData({ anything: { foo: 42 } }, rootSchema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });

        it('should return an error list', () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.anything!.foo!.__errors).toHaveLength(1);
          expect(errorSchema.anything!.foo!.__errors![0]).toEqual('must be string');
        });
      });
      describe('TransformErrors', () => {
        let errors: RJSFValidationError[];
        let newErrorMessage: string;
        let transformErrors: jest.Mock;
        let uiSchema: UiSchema;
        beforeAll(() => {
          uiSchema = {
            name: { 'ui:label': false },
          };
          newErrorMessage = 'Better error message';
          transformErrors = jest.fn((errors: RJSFValidationError[]) => {
            return [Object.assign({}, errors[0], { message: newErrorMessage })];
          });
          const result = validator.validateFormData({ name: 42 }, rootSchema, undefined, transformErrors, uiSchema);
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
            name: { 'ui:label': false },
          };

          validate = jest.fn((formData: any, errors: FormValidation<any>) => {
            if (formData.passwords.pass1 !== formData.passwords.pass2) {
              errors.passwords!.pass2!.addError('passwords don`t match.');
            }
            return errors;
          });
        });
        describe('formData is provided and passes custom validation', () => {
          beforeAll(() => {
            const formData = { passwords: { pass1: 'a', pass2: 'a' } };
            const result = validator.validateFormData(formData, rootSchema, validate, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an empty error list', () => {
            expect(errors).toHaveLength(0);
          });
          it('validate function was called with uiSchema', () => {
            expect(validate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), uiSchema);
          });
        });
        describe('formData is provided, but fails custom validation', () => {
          beforeAll(() => {
            const formData = { passwords: { pass1: 'a', pass2: 'b' } };
            const result = validator.validateFormData(formData, rootSchema, validate, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.passwords.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.passwords!.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.passwords!.pass2!.__errors![0]).toEqual('passwords don`t match.');
          });
          it('validate function was called with uiSchema', () => {
            expect(validate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), uiSchema);
          });
        });
        describe('formData is missing data', () => {
          beforeAll(() => {
            const formData = { passwords: { pass1: 'a' } };
            const result = validator.validateFormData(formData, rootSchema, validate);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
            expect(errors[1].stack).toEqual('.passwords.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.passwords!.pass2!.__errors).toHaveLength(2);
            expect(errorSchema.passwords!.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
            expect(errorSchema.passwords!.pass2!.__errors![1]).toEqual('passwords don`t match.');
          });
        });
      });
      describe('Data-Url validation', () => {
        it('Data-Url with name is accepted', () => {
          const formData = {
            dataUrlWithName: 'data:text/plain;name=file1.txt;base64,x=',
          };
          const result = validator.validateFormData(formData, rootSchema);
          expect(result.errors).toHaveLength(0);
        });
        it('Data-Url without name is accepted', () => {
          const formData = {
            dataUrlWithName: 'data:text/plain;base64,x=',
          };
          const result = validator.validateFormData(formData, rootSchema);
          expect(result.errors).toHaveLength(0);
        });
        it('Data-Url with bad data generates error', () => {
          const formData = {
            dataUrlWithName: 'x=',
          };
          const result = validator.validateFormData(formData, rootSchema);
          expect(result.errors).toHaveLength(1);
          expect(result.errorSchema.dataUrlWithName!.__errors).toHaveLength(1);
          expect(result.errorSchema.dataUrlWithName!.__errors![0]).toEqual('must match format "data-url"');
        });
      });
    });
  });
  describe('validator.validateFormData(), custom options, and localizer', () => {
    let validator: AJV8PrecompiledValidator;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = jest.fn().mockImplementation();
      validator = new AJV8PrecompiledValidator(validateOptionsFns, rootSchema, localizer);
    });
    describe('validating using single custom meta schema', () => {
      let errors: RJSFValidationError[];
      beforeAll(() => {
        (localizer as jest.Mock).mockClear();
        const result = validator.validateFormData({ foo: 42 }, rootSchema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.foo must be string');
      });
      it('localizer was called with the errors', () => {
        expect(localizer).toHaveBeenCalledWith([
          {
            data: 42,
            instancePath: '/foo',
            keyword: 'type',
            message: 'must be string',
            params: {
              type: 'string',
            },
            parentSchema: {
              type: 'string',
            },
            schema: 'string',
            schemaPath: '#/properties/foo/type',
          },
        ]);
      });
    });
    describe('validating using custom string formats', () => {
      it('should not return a validation error if proper string format is used', () => {
        const result = validator.validateFormData({ phone: '800-555-2368' }, rootSchema);
        expect(result.errors).toHaveLength(0);
      });
      describe('validating using a custom formats', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          const result = validator.validateFormData({ phone: '800.555.2368' }, rootSchema);
          errors = result.errors;
        });
        it('should return 1 error about formData', () => {
          expect(errors).toHaveLength(1);
        });
        it('should return a validation error about formData', () => {
          expect(errors[0].stack).toEqual('.phone must match format "phone-us"');
        });
      });
    });
  });
});
