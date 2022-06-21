// import { Simulate } from 'react-dom/test-utils';
import { ErrorSchema, FormValidation, RJSFSchema, RJSFValidationError, ValidatorType } from '@rjsf/utils';

import AJV6Validator from '../src/validator';

class TestValidator extends AJV6Validator {
  withIdRefPrefix(schemaNode: RJSFSchema): RJSFSchema {
    return super.withIdRefPrefix(schemaNode);
  }
}

const illFormedKey = 'bar.`\'[]()=+*&^%$#@!';
const metaSchemaDraft4 = require('ajv/lib/refs/json-schema-draft-04.json');
const metaSchemaDraft6 = require('ajv/lib/refs/json-schema-draft-06.json');

describe('AJV6Validator', () => {
  describe('default options', () => {
    // Use the TestValidator to access the `withIdRefPrefix` function
    let validator: TestValidator;
    beforeAll(() => {
      validator = new TestValidator({});
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
        const schema: RJSFSchema = 'foobarbaz' as RJSFSchema;

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
    describe('validator.withIdRefPrefix', () => {
      it('should recursively add id prefix to all refs', () => {
        const schema: RJSFSchema = {
          anyOf: [{ $ref: '#/defs/foo' }],
        };
        const expected = {
          anyOf: [{ $ref: '__rjsf_rootSchema#/defs/foo' }],
        };

        expect(validator.withIdRefPrefix(schema)).toEqual(expected);
      });
      it('shouldn`t mutate the schema', () => {
        const schema: RJSFSchema = {
          anyOf: [{ $ref: '#/defs/foo' }],
        };

        validator.withIdRefPrefix(schema);

        expect(schema).toEqual({
          anyOf: [{ $ref: '#/defs/foo' }],
        });
      });
      it('should not change a property named `$ref`', () => {
        const schema: RJSFSchema = {
          title: 'A registration form',
          description: 'A simple form example.',
          type: 'object',
          properties: {
            $ref: { type: 'string', title: 'First name', default: 'Chuck' },
          },
        };

        expect(validator.withIdRefPrefix(schema)).toEqual(schema);
      });
    });
    describe('No custom validate function', () => {
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
        const result = validator.validateFormData(
          { foo: 42, [illFormedKey]: 41 },
          schema
        );
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
    describe('transformErrors', () => {
      let errors: RJSFValidationError[];
      let newErrorMessage: string;
      beforeAll(() => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            [illFormedKey]: { type: 'string' },
          },
        };
        newErrorMessage = 'Better error message';
        const transformErrors = (errors: RJSFValidationError[]) => {
          return [Object.assign({}, errors[0], { message: newErrorMessage })];
        };
        const result = validator.validateFormData(
          { foo: 42, [illFormedKey]: 41 },
          schema,
          undefined,
          transformErrors
        );
        errors = result.errors;
      });

      it('should use transformErrors function', () => {
        expect(errors).not.toHaveLength(0);
        expect(errors[0].message).toEqual(newErrorMessage);
      });
    });
    describe('toErrorList()', () => {
      it('should convert an errorSchema into a flat list', () => {
        const errorSchema: ErrorSchema = {
          __errors: ['err1', 'err2'],
          a: {
            b: {
              __errors: ['err3', 'err4'],
            } as ErrorSchema,
          },
          c: {
            __errors: ['err5'],
          } as ErrorSchema,
        } as unknown as ErrorSchema;
        expect(validator.toErrorList(errorSchema)).toEqual([
          { stack: 'root: err1' },
          { stack: 'root: err2' },
          { stack: 'b: err3' },
          { stack: 'b: err4' },
          { stack: 'c: err5' },
        ]);
      });
    });
    describe('Custom validate function', () => {
      let errors: RJSFValidationError[];
      let errorSchema: ErrorSchema;

      beforeAll(() => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['pass1', 'pass2'],
          properties: {
            pass1: { type: 'string' },
            pass2: { type: 'string' },
          },
        };

        const validate = (formData: any, errors: FormValidation<any>) => {
          if (formData.pass1 !== formData.pass2) {
            errors.pass2!.addError('passwords don`t match.');
          }
          return errors;
        };
        const formData = { pass1: 'a', pass2: 'b' };
        const result = validator.validateFormData(formData, schema, validate);
        errors = result.errors;
        errorSchema = result.errorSchema;
      });
      it('should return an error list', () => {
        expect(errors).toHaveLength(1);
        expect(errors[0].stack).toEqual('pass2: passwords don`t match.');
      });
      it('should return an errorSchema', () => {
        expect(errorSchema.pass2!.__errors).toHaveLength(1);
        expect(errorSchema.pass2!.__errors![0]).toEqual('passwords don`t match.');
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
        expect(errors[0].property).toEqual('.properties[`foo`].required');
        // TODO: This schema path is wrong due to a bug in ajv; change this test when https://github.com/ajv-validator/ajv/issues/512 is fixed.
        expect(errors[0].schemaPath).toEqual('#/definitions/stringArray/type');
        expect(errors[0].message).toEqual('should be array');
      });
      it('should return an errorSchema', () => {
        expect(errorSchema.properties!.foo!.required!.__errors).toHaveLength(
          1
        );
        expect(errorSchema.properties!.foo!.required!.__errors![0]).toEqual(
          'should be array'
        );
      });
    });
  });
  describe('custom options', () => {
    let validator: ValidatorType;
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
      const errors = validator.validateFormData(
        { datasetId: 'some kind of text' },
        schema
      );
      const errMessage =
        `no schema with key or ref 'http://json-schema.org/draft-04/schema#'`;
      expect(errors.errors).toEqual([
        {
          stack: errMessage,
        },
      ]);
      expect(errors.errorSchema).toEqual({
        $schema: { __errors: [errMessage] },
      });
    });
    describe('validating using single custom meta schema', () => {
      let errors: RJSFValidationError[];
      beforeAll(() => {
        validator = new AJV6Validator({ additionalMetaSchemas: [metaSchemaDraft4] });
        const result = validator.validateFormData(
          { datasetId: 'some kind of text' },
          schema
        );
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual(
          `.datasetId should match pattern '\\d+'`
        );
      });
    });
    describe('validating using several custom meta schemas', () => {
      let errors: RJSFValidationError[];

      beforeAll(() => {
        validator = new AJV6Validator({
          additionalMetaSchemas: [metaSchemaDraft4, metaSchemaDraft6]
        });
        const result = validator.validateFormData(
          { datasetId: 'some kind of text' },
          schema
        );
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual(
          `.datasetId should match pattern '\\d+'`
        );
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
            }
          });
          const result = validator.validateFormData(
            { phone: '800.555.2368' },
            schema
          );
          errors = result.errors;
        });
        it('should return 1 error about formData', () => {
          expect(errors).toHaveLength(1);
        });
        it('should return a validation error about formData', () => {
          expect(errors[0].stack).toEqual(
            `.phone should match format 'phone-us'`
          );
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
            expect(errors[0].stack).toEqual(
              `.phone should match format 'area-code'`
            );
          });
        });
      });
    });
  });
  // describe('Form integration', () => {
  //   let sandbox;
  //
  //   beforeEach(() => {
  //     sandbox = sinon.createSandbox();
  //   });
  //
  //   afterEach(() => {
  //     sandbox.restore();
  //   });
  //
  //   describe('JSONSchema validation', () => {
  //     describe('Required fields', () => {
  //       const schema: RJSFSchema = {
  //         type: 'object',
  //         required: ['foo'],
  //         properties: {
  //           foo: { type: 'string' },
  //           bar: { type: 'string' },
  //         },
  //       };
  //
  //       let onError, node;
  //       beforeEach(() => {
  //         const compInfo = createFormComponent({
  //           schema,
  //           formData: {
  //             foo: undefined,
  //           },
  //         });
  //         onError = compInfo.onError;
  //         node = compInfo.node;
  //         submitForm(node);
  //       });
  //
  //       it('should trigger onError call', () => {
  //         sinon.assert.calledWithMatch(onError.lastCall, [
  //           {
  //             message: 'is a required property',
  //             name: 'required',
  //             params: { missingProperty: 'foo' },
  //             property: '.foo',
  //             schemaPath: '#/required',
  //             stack: '.foo is a required property',
  //           },
  //         ]);
  //       });
  //
  //       it('should render errors', () => {
  //         expect(node.querySelectorAll('.errors li')).toHaveLength(1);
  //         expect(node.querySelector('.errors li').textContent).toEqual(
  //           '.foo is a required property'
  //         );
  //       });
  //     });
  //
  //     describe('Min length', () => {
  //       const schema: RJSFSchema = {
  //         type: 'object',
  //         required: ['foo'],
  //         properties: {
  //           foo: {
  //             type: 'string',
  //             minLength: 10,
  //           },
  //         },
  //       };
  //
  //       let node, onError;
  //
  //       beforeEach(() => {
  //         onError = sandbox.spy();
  //         const compInfo = createFormComponent({
  //           schema,
  //           formData: {
  //             foo: '123456789',
  //           },
  //           onError,
  //         });
  //         node = compInfo.node;
  //
  //         submitForm(node);
  //       });
  //
  //       it('should render errors', () => {
  //         expect(node.querySelectorAll('.errors li')).toHaveLength(1);
  //         expect(node.querySelector('.errors li').textContent).toEqual(
  //           '.foo should NOT be shorter than 10 characters'
  //         );
  //       });
  //
  //       it('should trigger the onError handler', () => {
  //         sinon.assert.calledWithMatch(onError.lastCall, [
  //           {
  //             message: 'should NOT be shorter than 10 characters',
  //             name: 'minLength',
  //             params: { limit: 10 },
  //             property: '.foo',
  //             schemaPath: '#/properties/foo/minLength',
  //             stack: '.foo should NOT be shorter than 10 characters',
  //           },
  //         ]);
  //       });
  //     });
  //   });
  //
  //   describe('Custom Form validation', () => {
  //     it('should validate a simple string value', () => {
  //       const schema: RJSFSchema = { type: 'string' };
  //       const formData = 'a';
  //
  //       function validate(formData, errors) {
  //         if (formData !== 'hello') {
  //           errors.addError('Invalid');
  //         }
  //         return errors;
  //       }
  //
  //       const { onError, node } = createFormComponent({
  //         schema,
  //         validate,
  //         formData,
  //       });
  //
  //       submitForm(node);
  //       sinon.assert.calledWithMatch(onError.lastCall, [
  //         { stack: 'root: Invalid' },
  //       ]);
  //     });
  //
  //     it('should live validate a simple string value when liveValidate is set to true', () => {
  //       const schema: RJSFSchema = { type: 'string' };
  //       const formData = 'a';
  //
  //       function validate(formData, errors) {
  //         if (formData !== 'hello') {
  //           errors.addError('Invalid');
  //         }
  //         return errors;
  //       }
  //
  //       const { onChange, node } = createFormComponent({
  //         schema,
  //         validate,
  //         formData,
  //         liveValidate: true,
  //       });
  //       Simulate.change(node.querySelector('input'), {
  //         target: { value: '1234' },
  //       });
  //
  //       sinon.assert.calledWithMatch(onChange.lastCall, {
  //         errorSchema: { __errors: ['Invalid'] },
  //         errors: [{ stack: 'root: Invalid' }],
  //         formData: '1234',
  //       });
  //     });
  //
  //     it('should submit form on valid data', () => {
  //       const schema: RJSFSchema = { type: 'string' };
  //       const formData = 'hello';
  //       const onSubmit = sandbox.spy();
  //
  //       function validate(formData, errors) {
  //         if (formData !== 'hello') {
  //           errors.addError('Invalid');
  //         }
  //         return errors;
  //       }
  //
  //       const { node } = createFormComponent({
  //         schema,
  //         formData,
  //         validate,
  //         onSubmit,
  //       });
  //
  //       submitForm(node);
  //
  //       sinon.assert.called(onSubmit);
  //     });
  //
  //     it('should prevent form submission on invalid data', () => {
  //       const schema: RJSFSchema = { type: 'string' };
  //       const formData = 'a';
  //       const onSubmit = sandbox.spy();
  //       const onError = sandbox.spy();
  //
  //       function validate(formData, errors) {
  //         if (formData !== 'hello') {
  //           errors.addError('Invalid');
  //         }
  //         return errors;
  //       }
  //
  //       const { node } = createFormComponent({
  //         schema,
  //         formData,
  //         validate,
  //         onSubmit,
  //         onError,
  //       });
  //
  //       submitForm(node);
  //
  //       sinon.assert.notCalled(onSubmit);
  //       sinon.assert.called(onError);
  //     });
  //
  //     it('should validate a simple object', () => {
  //       const schema: RJSFSchema = {
  //         type: 'object',
  //         properties: {
  //           pass1: { type: 'string', minLength: 3 },
  //           pass2: { type: 'string', minLength: 3 },
  //         },
  //       };
  //
  //       const formData = { pass1: 'aaa', pass2: 'b' };
  //
  //       function validate(formData, errors) {
  //         const { pass1, pass2 } = formData;
  //         if (pass1 !== pass2) {
  //           errors.pass2.addError('Passwords don`t match');
  //         }
  //         return errors;
  //       }
  //
  //       const { node, onError } = createFormComponent({
  //         schema,
  //         validate,
  //         formData,
  //       });
  //       submitForm(node);
  //       sinon.assert.calledWithMatch(onError.lastCall, [
  //         { stack: 'pass2: should NOT be shorter than 3 characters' },
  //         { stack: 'pass2: Passwords don`t match' },
  //       ]);
  //     });
  //
  //     it('should validate an array of object', () => {
  //       const schema: RJSFSchema = {
  //         type: 'array',
  //         items: {
  //           type: 'object',
  //           properties: {
  //             pass1: { type: 'string' },
  //             pass2: { type: 'string' },
  //           },
  //         },
  //       };
  //
  //       const formData = [
  //         { pass1: 'a', pass2: 'b' },
  //         { pass1: 'a', pass2: 'a' },
  //       ];
  //
  //       function validate(formData, errors) {
  //         formData.forEach(({ pass1, pass2 }, i) => {
  //           if (pass1 !== pass2) {
  //             errors[i].pass2.addError('Passwords don`t match');
  //           }
  //         });
  //         return errors;
  //       }
  //
  //       const { node, onError } = createFormComponent({
  //         schema,
  //         validate,
  //         formData,
  //       });
  //
  //       submitForm(node);
  //       sinon.assert.calledWithMatch(onError.lastCall, [
  //         { stack: 'pass2: Passwords don`t match' },
  //       ]);
  //     });
  //
  //     it('should validate a simple array', () => {
  //       const schema: RJSFSchema = {
  //         type: 'array',
  //         items: {
  //           type: 'string',
  //         },
  //       };
  //
  //       const formData = ['aaa', 'bbb', 'ccc'];
  //
  //       function validate(formData, errors) {
  //         if (formData.indexOf('bbb') !== -1) {
  //           errors.addError('Forbidden value: bbb');
  //         }
  //         return errors;
  //       }
  //
  //       const { node, onError } = createFormComponent({
  //         schema,
  //         validate,
  //         formData,
  //       });
  //       submitForm(node);
  //       sinon.assert.calledWithMatch(onError.lastCall, [
  //         { stack: 'root: Forbidden value: bbb' },
  //       ]);
  //     });
  //   });
  //
  //   describe('showErrorList prop validation', () => {
  //     describe('Required fields', () => {
  //       const schema: RJSFSchema = {
  //         type: 'object',
  //         required: ['foo'],
  //         properties: {
  //           foo: { type: 'string' },
  //           bar: { type: 'string' },
  //         },
  //       };
  //
  //       let node, onError;
  //       beforeEach(() => {
  //         const compInfo = createFormComponent({
  //           schema,
  //           formData: {
  //             foo: undefined,
  //           },
  //           showErrorList: false,
  //         });
  //         node = compInfo.node;
  //         onError = compInfo.onError;
  //
  //         submitForm(node);
  //       });
  //
  //       it('should not render error list if showErrorList prop true', () => {
  //         expect(node.querySelectorAll('.errors li')).toHaveLength(0);
  //       });
  //
  //       it('should trigger onError call', () => {
  //         sinon.assert.calledWithMatch(onError.lastCall, [
  //           {
  //             message: 'is a required property',
  //             name: 'required',
  //             params: { missingProperty: 'foo' },
  //             property: '.foo',
  //             schemaPath: '#/required',
  //             stack: '.foo is a required property',
  //           },
  //         ]);
  //       });
  //     });
  //   });
  //
  //   describe('Custom ErrorList', () => {
  //     const schema: RJSFSchema = {
  //       type: 'string',
  //       minLength: 1,
  //     };
  //
  //     const uiSchema = {
  //       foo: 'bar',
  //     };
  //
  //     const formData = 0;
  //
  //     const CustomErrorList = ({
  //       errors,
  //       errorSchema,
  //       schema,
  //       uiSchema,
  //       formContext: { className },
  //     }) => (
  //       <div>
  //         <div className='CustomErrorList'>{errors.length} custom</div>
  //         <div className={'ErrorSchema'}>{errorSchema.__errors[0]}</div>
  //         <div className={'Schema'}>{schema.type}</div>
  //         <div className={'UiSchema'}>{uiSchema.foo}</div>
  //         <div className={className} />
  //       </div>
  //     );
  //
  //     it('should use CustomErrorList', () => {
  //       const { node } = createFormComponent({
  //         schema,
  //         uiSchema,
  //         liveValidate: true,
  //         formData,
  //         ErrorList: CustomErrorList,
  //         formContext: { className: 'foo' },
  //       });
  //       expect(node.querySelectorAll('.CustomErrorList')).toHaveLength(1);
  //       expect(node.querySelector('.CustomErrorList').textContent).toEqual(
  //         '1 custom'
  //       );
  //       expect(node.querySelectorAll('.ErrorSchema')).toHaveLength(1);
  //       expect(node.querySelector('.ErrorSchema').textContent).toEqual(
  //         'should be string'
  //       );
  //       expect(node.querySelectorAll('.Schema')).toHaveLength(1);
  //       expect(node.querySelector('.Schema').textContent).toEqual('string');
  //       expect(node.querySelectorAll('.UiSchema')).toHaveLength(1);
  //       expect(node.querySelector('.UiSchema').textContent).toEqual('bar');
  //       expect(node.querySelectorAll('.foo')).toHaveLength(1);
  //     });
  //   });
  //   describe('Custom meta schema', () => {
  //     let onError, node;
  //     const formData = {
  //       datasetId: 'no err',
  //     };
  //
  //     const schema: RJSFSchema = {
  //       $ref: '#/definitions/Dataset',
  //       $schema: 'http://json-schema.org/draft-04/schema#',
  //       definitions: {
  //         Dataset: {
  //           properties: {
  //             datasetId: {
  //               pattern: '\\d+',
  //               type: 'string',
  //             },
  //           },
  //           required: ['datasetId'],
  //           type: 'object',
  //         },
  //       },
  //     };
  //
  //     beforeEach(() => {
  //       const withMetaSchema = createFormComponent({
  //         schema,
  //         formData,
  //         liveValidate: true,
  //         additionalMetaSchemas: [
  //           require('ajv/lib/refs/json-schema-draft-04.json'),
  //         ],
  //       });
  //       node = withMetaSchema.node;
  //       onError = withMetaSchema.onError;
  //       submitForm(node);
  //     });
  //     it('should be used to validate schema', () => {
  //       expect(node.querySelectorAll('.errors li')).toHaveLength(1);
  //       sinon.assert.calledWithMatch(onError.lastCall, [
  //         {
  //           message: `should match pattern '\\d+'`,
  //           name: 'pattern',
  //           params: { pattern: '\\d+' },
  //           property: '.datasetId',
  //           schemaPath: '#/properties/datasetId/pattern',
  //           stack: `.datasetId should match pattern '\\d+'`,
  //         },
  //       ]);
  //       onError.resetHistory();
  //
  //       Simulate.change(node.querySelector('input'), {
  //         target: { value: '1234' },
  //       });
  //       expect(node.querySelectorAll('.errors li')).toHaveLength(0);
  //       sinon.assert.notCalled(onError);
  //     });
  //   });
  // });
});
