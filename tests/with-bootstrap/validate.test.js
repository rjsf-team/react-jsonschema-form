import React from 'react';
import { Simulate } from 'react-dom/test-utils';

import validateFormData, {
  toErrorList
} from 'react-jsonschema-form/src/validate';
import { createFormComponent } from './test_utils';

describe('Validation', () => {
  describe('validate.validateFormData()', () => {
    describe('No custom validate function', () => {
      const illFormedKey = 'bar.\'"[]()=+*&^%$#@!';
      const schema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
          [illFormedKey]: { type: 'string' }
        }
      };

      let errors, errorSchema;

      beforeEach(() => {
        const result = validateFormData(
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
        expect(errorSchema.foo.__errors).toHaveLength(1);
        expect(errorSchema.foo.__errors[0]).toEqual('should be string');
        expect(errorSchema[illFormedKey].__errors).toHaveLength(1);
        expect(errorSchema[illFormedKey].__errors[0]).toEqual(
          'should be string'
        );
      });
    });

    describe('Custom validate function', () => {
      let errors, errorSchema;

      const schema = {
        type: 'object',
        required: ['pass1', 'pass2'],
        properties: {
          pass1: { type: 'string' },
          pass2: { type: 'string' }
        }
      };

      beforeEach(() => {
        const validate = (formData, errors) => {
          if (formData.pass1 !== formData.pass2) {
            errors.pass2.addError('passwords don\'t match.');
          }
          return errors;
        };
        const formData = { pass1: 'a', pass2: 'b' };
        const result = validateFormData(formData, schema, validate);
        errors = result.errors;
        errorSchema = result.errorSchema;
      });

      it('should return an error list', () => {
        expect(errors).toHaveLength(1);
        expect(errors[0].stack).toEqual('pass2: passwords don\'t match.');
      });

      it('should return an errorSchema', () => {
        expect(errorSchema.pass2.__errors).toHaveLength(1);
        expect(errorSchema.pass2.__errors[0]).toEqual('passwords don\'t match.');
      });
    });

    describe('toErrorList()', () => {
      it('should convert an errorSchema into a flat list', () => {
        expect(
          toErrorList({
            __errors: ['err1', 'err2'],
            a: {
              b: {
                __errors: ['err3', 'err4']
              }
            },
            c: {
              __errors: ['err5']
            }
          })
        ).toEqual([
          { stack: 'root: err1' },
          { stack: 'root: err2' },
          { stack: 'b: err3' },
          { stack: 'b: err4' },
          { stack: 'c: err5' }
        ]);
      });
    });

    describe('transformErrors', () => {
      it('should use transformErrors function', () => {
        const illFormedKey = 'bar.\'"[]()=+*&^%$#@!';
        const schema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            [illFormedKey]: { type: 'string' }
          }
        };
        const newErrorMessage = 'Better error message';
        const transformErrors = errors => {
          return [Object.assign({}, errors[0], { message: newErrorMessage })];
        };
        const result = validateFormData(
          { foo: 42, [illFormedKey]: 41 },
          schema,
          undefined,
          transformErrors
        );
        const errors = result.errors;

        expect(Object.keys(errors)).not.toHaveLength(0);
        expect(errors[0].message).toBe(newErrorMessage);
      });
    });

    describe('Invalid schema', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            required: 'invalid_type_non_array'
          }
        }
      };

      let errors, errorSchema;

      beforeEach(() => {
        const result = validateFormData({ foo: 42 }, schema);
        errors = result.errors;
        errorSchema = result.errorSchema;
      });

      it('should return an error list', () => {
        expect(errors).toHaveLength(1);
        expect(errors[0].name).toEqual('type');
        expect(errors[0].property).toEqual('.properties[\'foo\'].required');
        expect(errors[0].message).toEqual('should be array');
      });

      it('should return an errorSchema', () => {
        expect(errorSchema.properties.foo.required.__errors).toHaveLength(1);
        expect(errorSchema.properties.foo.required.__errors[0]).toEqual(
          'should be array'
        );
      });
    });
  });

  describe('Form integration', () => {
    describe('JSONSchema validation', () => {
      describe('Required fields', () => {
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' }
          }
        };

        var getInstance, node, onError;

        beforeEach(() => {
          onError = jest.fn();
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined
            },
            onError
          });
          getInstance = compInfo.getInstance;
          node = compInfo.node;

          Simulate.submit(node);
        });

        it('should validate a required field', () => {
          expect(getInstance().state.errors).toHaveLength(1);
          expect(getInstance().state.errors[0].message).toEqual(
            'is a required property'
          );
        });

        it('should render errors', () => {
          expect(node.querySelectorAll('.errors li')).toHaveLength(1);
          expect(node.querySelector('.errors li').textContent).toEqual(
            '.foo is a required property'
          );
        });

        it('should trigger the onError handler', () => {
          expect(onError).toHaveBeenCalledWith([
            expect.objectContaining({ message: 'is a required property' })
          ]);
        });
      });

      describe('Min length', () => {
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: {
              type: 'string',
              minLength: 10
            }
          }
        };

        var getInstance, node, onError;

        beforeEach(() => {
          onError = jest.fn();
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: '123456789'
            },
            onError
          });
          getInstance = compInfo.getInstance;
          node = compInfo.node;

          Simulate.submit(node);
        });

        it('should validate a minLength field', () => {
          expect(getInstance().state.errors).toHaveLength(1);
          expect(getInstance().state.errors[0].message).toEqual(
            'should NOT be shorter than 10 characters'
          );
        });

        it('should render errors', () => {
          expect(node.querySelectorAll('.errors li')).toHaveLength(1);
          expect(node.querySelector('.errors li').textContent).toEqual(
            '.foo should NOT be shorter than 10 characters'
          );
        });

        it('should trigger the onError handler', () => {
          expect(onError).toHaveBeenCalledWith([
            expect.objectContaining({
              message: 'should NOT be shorter than 10 characters'
            })
          ]);
        });
      });
    });

    describe('Custom Form validation', () => {
      it('should validate a simple string value', () => {
        const schema = { type: 'string' };
        const formData = 'a';

        function validate(formData, errors) {
          if (formData !== 'hello') {
            errors.addError('Invalid');
          }
          return errors;
        }

        const { getInstance } = createFormComponent({
          schema,
          validate,
          liveValidate: true
        });
        getInstance().componentWillReceiveProps({ formData });

        expect(getInstance().state.errorSchema).toEqual({
          __errors: ['Invalid']
        });
      });

      it('should submit form on valid data', () => {
        const schema = { type: 'string' };
        const formData = 'hello';
        const onSubmit = jest.fn();

        function validate(formData, errors) {
          if (formData !== 'hello') {
            errors.addError('Invalid');
          }
          return errors;
        }

        const { node } = createFormComponent({
          schema,
          formData,
          validate,
          onSubmit
        });

        Simulate.submit(node);

        expect(onSubmit).toHaveBeenCalled();
      });

      it('should prevent form submission on invalid data', () => {
        const schema = { type: 'string' };
        const formData = 'a';
        const onSubmit = jest.fn();
        const onError = jest.fn();

        function validate(formData, errors) {
          if (formData !== 'hello') {
            errors.addError('Invalid');
          }
          return errors;
        }

        const { node } = createFormComponent({
          schema,
          formData,
          validate,
          onSubmit,
          onError
        });

        Simulate.submit(node);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalled();
      });

      it('should validate a simple object', () => {
        const schema = {
          type: 'object',
          properties: {
            pass1: { type: 'string', minLength: 3 },
            pass2: { type: 'string', minLength: 3 }
          }
        };

        const formData = { pass1: 'aaa', pass2: 'b' };

        function validate(formData, errors) {
          const { pass1, pass2 } = formData;
          if (pass1 !== pass2) {
            errors.pass2.addError('Passwords don\'t match');
          }
          return errors;
        }

        const { getInstance } = createFormComponent({
          schema,
          validate,
          liveValidate: true
        });
        getInstance().componentWillReceiveProps({ formData });

        expect(getInstance().state.errorSchema).toEqual({
          __errors: [],
          pass1: {
            __errors: []
          },
          pass2: {
            __errors: [
              'should NOT be shorter than 3 characters',
              'Passwords don\'t match'
            ]
          }
        });
      });

      it('should validate an array of object', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pass1: { type: 'string' },
              pass2: { type: 'string' }
            }
          }
        };

        const formData = [
          { pass1: 'a', pass2: 'b' },
          { pass1: 'a', pass2: 'a' }
        ];

        function validate(formData, errors) {
          formData.forEach(({ pass1, pass2 }, i) => {
            if (pass1 !== pass2) {
              errors[i].pass2.addError('Passwords don\'t match');
            }
          });
          return errors;
        }

        const { getInstance } = createFormComponent({
          schema,
          validate,
          liveValidate: true
        });
        getInstance().componentWillReceiveProps({ formData });

        expect(getInstance().state.errorSchema).toEqual({
          0: {
            pass1: {
              __errors: []
            },
            pass2: {
              __errors: ['Passwords don\'t match']
            },
            __errors: []
          },
          1: {
            pass1: {
              __errors: []
            },
            pass2: {
              __errors: []
            },
            __errors: []
          },
          __errors: []
        });
      });

      it('should validate a simple array', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'string'
          }
        };

        const formData = ['aaa', 'bbb', 'ccc'];

        function validate(formData, errors) {
          if (formData.indexOf('bbb') !== -1) {
            errors.addError('Forbidden value: bbb');
          }
          return errors;
        }

        const { getInstance } = createFormComponent({
          schema,
          validate,
          liveValidate: true
        });
        getInstance().componentWillReceiveProps({ formData });

        expect(getInstance().state.errorSchema).toEqual({
          0: { __errors: [] },
          1: { __errors: [] },
          2: { __errors: [] },
          __errors: ['Forbidden value: bbb']
        });
      });
    });

    describe('showErrorList prop validation', () => {
      describe('Required fields', () => {
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' }
          }
        };

        var getInstance, node, onError;

        beforeEach(() => {
          onError = jest.fn();
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined
            },
            onError,
            showErrorList: false
          });
          getInstance = compInfo.getInstance;
          node = compInfo.node;

          Simulate.submit(node);
        });

        it('should validate a required field', () => {
          expect(getInstance().state.errors).toHaveLength(1);
          expect(getInstance().state.errors[0].message).toEqual(
            'is a required property'
          );
        });

        it('should not render error list if showErrorList prop true', () => {
          expect(node.querySelectorAll('.errors li')).toHaveLength(0);
        });

        it('should trigger the onError handler', () => {
          expect(onError).toHaveBeenCalledWith([
            expect.objectContaining({
              message: 'is a required property'
            })
          ]);
        });
      });
    });

    describe('Custom ErrorList', () => {
      const schema = {
        type: 'string',
        minLength: 1
      };

      const uiSchema = {
        foo: 'bar'
      };

      const formData = 0;

      const CustomErrorList = ({
        errors,
        errorSchema,
        schema,
        uiSchema,
        formContext: { className }
      }) => (
        <div>
          <div className="CustomErrorList">{errors.length} custom</div>
          <div className={'ErrorSchema'}>{errorSchema.__errors[0]}</div>
          <div className={'Schema'}>{schema.type}</div>
          <div className={'UiSchema'}>{uiSchema.foo}</div>
          <div className={className} />
        </div>
      );

      it('should use CustomErrorList', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          liveValidate: true,
          formData,
          ErrorList: CustomErrorList,
          formContext: { className: 'foo' }
        });
        expect(node.querySelectorAll('.CustomErrorList')).toHaveLength(1);
        expect(node.querySelector('.CustomErrorList').textContent).toEqual(
          '1 custom'
        );
        expect(node.querySelectorAll('.ErrorSchema')).toHaveLength(1);
        expect(node.querySelector('.ErrorSchema').textContent).toEqual(
          'should be string'
        );
        expect(node.querySelectorAll('.Schema')).toHaveLength(1);
        expect(node.querySelector('.Schema').textContent).toEqual('string');
        expect(node.querySelectorAll('.UiSchema')).toHaveLength(1);
        expect(node.querySelector('.UiSchema').textContent).toEqual('bar');
        expect(node.querySelectorAll('.foo')).toHaveLength(1);
      });
    });
  });
});
