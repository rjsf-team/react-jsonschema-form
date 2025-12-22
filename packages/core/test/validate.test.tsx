import { fireEvent, act } from '@testing-library/react';
import { ErrorListProps, FormValidation, GenericObjectType, RJSFSchema } from '@rjsf/utils';
import { customizeValidator as customizeV8Validator } from '@rjsf/validator-ajv8';

import { FormProps } from '../src';
import { createFormComponent, submitForm } from './testUtils';

describe('Validation', () => {
  describe('Form integration, v8 validator', () => {
    describe('JSONSchema validation', () => {
      describe('Required fields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };

        let onError: jest.Mock;
        let node: Element;
        beforeEach(() => {
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined,
            },
          });
          onError = compInfo.onError;
          node = compInfo.node;
          submitForm(node);
        });

        it('should trigger onError call', () => {
          expect(onError).toHaveBeenLastCalledWith([
            {
              message: "must have required property 'foo'",
              name: 'required',
              params: { missingProperty: 'foo' },
              property: 'foo',
              schemaPath: '#/required',
              stack: "must have required property 'foo'",
              title: '',
            },
          ]);
        });

        it('should render errors', () => {
          expect(node.querySelectorAll('.errors li')).toHaveLength(1);
          expect(node.querySelector('.errors li')).toHaveTextContent("must have required property 'foo'");
        });
      });

      describe('Min length', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: {
              type: 'string',
              minLength: 10,
            },
          },
        };

        let onError: jest.Mock;
        let node: Element;

        beforeEach(() => {
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: '123456789',
            },
          });
          node = compInfo.node;
          onError = compInfo.onError;

          submitForm(node);
        });

        it('should render errors', () => {
          expect(node.querySelectorAll('.errors li')).toHaveLength(1);
          expect(node.querySelector('.errors li')).toHaveTextContent('.foo must NOT have fewer than 10 characters');
        });

        it('should trigger the onError handler', () => {
          expect(onError).toHaveBeenLastCalledWith([
            {
              message: 'must NOT have fewer than 10 characters',
              name: 'minLength',
              params: { limit: 10 },
              property: '.foo',
              schemaPath: '#/properties/foo/minLength',
              stack: '.foo must NOT have fewer than 10 characters',
              title: '',
            },
          ]);
        });
      });
    });

    describe('Custom Form validation', () => {
      it('should validate a simple string value', () => {
        const schema: RJSFSchema = { type: 'string' };
        const formData = 'a';

        function customValidate(formData: FormProps['formData'], errors: FormValidation) {
          if (formData !== 'hello') {
            errors.addError('Invalid');
          }
          return errors;
        }

        const { onError, node } = createFormComponent({
          schema,
          customValidate,
          formData,
        });

        submitForm(node);
        expect(onError).toHaveBeenLastCalledWith([{ property: '.', message: 'Invalid', stack: '. Invalid' }]);
      });

      it('should live validate a simple string value when liveValidate is set to true', () => {
        const schema: RJSFSchema = { type: 'string' };
        const formData = 'a';

        function customValidate(formData: FormProps['formData'], errors: FormValidation) {
          if (formData !== 'hello') {
            errors.addError('Invalid');
          }
          return errors;
        }

        const { onChange, node } = createFormComponent({
          schema,
          customValidate,
          formData,
          liveValidate: true,
        });

        act(() => {
          fireEvent.change(node.querySelector('input')!, {
            target: { value: '1234' },
          });
        });

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errorSchema: { __errors: ['Invalid'] },
            errors: [{ property: '.', message: 'Invalid', stack: '. Invalid' }],
            formData: '1234',
          }),
          'root',
        );
      });

      it('should submit form on valid data', () => {
        const schema: RJSFSchema = { type: 'string' };
        const formData = 'hello';
        const onSubmit = jest.fn();

        function customValidate(formData: FormProps['formData'], errors: FormValidation) {
          if (formData !== 'hello') {
            errors.addError('Invalid');
          }
          return errors;
        }

        const { node } = createFormComponent({
          schema,
          formData,
          customValidate,
          onSubmit,
        });

        submitForm(node);

        expect(onSubmit).toHaveBeenCalled();
      });

      it('should prevent form submission on invalid data', () => {
        const schema: RJSFSchema = { type: 'string' };
        const formData = 'a';
        const onSubmit = jest.fn();
        const onError = jest.fn();

        function customValidate(formData: FormProps['formData'], errors: FormValidation) {
          if (formData !== 'hello') {
            errors.addError('Invalid');
          }
          return errors;
        }

        const { node } = createFormComponent({
          schema,
          formData,
          customValidate,
          onSubmit,
          onError,
        });

        submitForm(node);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalled();
      });

      it('should validate a simple object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            pass1: { type: 'string', minLength: 3 },
            pass2: { type: 'string', minLength: 3 },
          },
        };

        const formData = { pass1: 'aaa', pass2: 'b' };

        function customValidate(formData: FormProps['formData'], errors: FormValidation) {
          const { pass1, pass2 } = formData;
          if (pass1 !== pass2) {
            (errors.pass2 as FormValidation).addError("Passwords don't match");
          }
          return errors;
        }

        const { node, onError } = createFormComponent({
          schema,
          customValidate,
          formData,
        });
        submitForm(node);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must NOT have fewer than 3 characters',
            name: 'minLength',
            params: { limit: 3 },
            property: '.pass2',
            schemaPath: '#/properties/pass2/minLength',
            stack: '.pass2 must NOT have fewer than 3 characters',
            title: '',
          },
          {
            property: '.pass2',
            message: "Passwords don't match",
            stack: ".pass2 Passwords don't match",
          },
        ]);
      });

      it('should validate an array of object', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pass1: { type: 'string' },
              pass2: { type: 'string' },
            },
          },
        };

        const formData = [
          { pass1: 'a', pass2: 'b' },
          { pass1: 'a', pass2: 'a' },
        ];

        function customValidate(formData: FormProps['formData'], errors: FormValidation) {
          formData.forEach(({ pass1, pass2 }: GenericObjectType, i: number) => {
            console.log(pass1, pass2, errors);
            if (pass1 !== pass2) {
              (errors as GenericObjectType)[i].pass2.addError("Passwords don't match");
            }
          });
          return errors;
        }

        const { node, onError } = createFormComponent({
          schema,
          customValidate,
          formData,
        });

        submitForm(node);
        expect(onError).toHaveBeenLastCalledWith([
          {
            property: '.0.pass2',
            message: "Passwords don't match",
            stack: ".0.pass2 Passwords don't match",
          },
        ]);
      });

      it('should validate a simple array', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'string',
          },
        };

        const formData = ['aaa', 'bbb', 'ccc'];

        function customValidate(formData: FormProps['formData'], errors: FormValidation) {
          if (formData.indexOf('bbb') !== -1) {
            errors.addError('Forbidden value: bbb');
          }
          return errors;
        }

        const { node, onError } = createFormComponent({
          schema,
          customValidate,
          formData,
        });
        submitForm(node);
        expect(onError).toHaveBeenLastCalledWith([
          {
            property: '.',
            message: 'Forbidden value: bbb',
            stack: '. Forbidden value: bbb',
          },
        ]);
      });
    });

    describe('showErrorList prop validation', () => {
      describe('Required fields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };

        let onError: jest.Mock;
        let node: Element;
        beforeEach(() => {
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined,
            },
            showErrorList: false,
          });
          node = compInfo.node;
          onError = compInfo.onError;

          submitForm(node);
        });

        it('should not render error list if showErrorList prop true', () => {
          expect(node.querySelectorAll('.errors li')).toHaveLength(0);
        });

        it('should trigger onError call', () => {
          expect(onError).toHaveBeenLastCalledWith([
            {
              message: "must have required property 'foo'",
              name: 'required',
              params: { missingProperty: 'foo' },
              property: 'foo',
              schemaPath: '#/required',
              stack: "must have required property 'foo'",
              title: '',
            },
          ]);
        });
      });
    });

    describe('Custom ErrorList', () => {
      const schema: RJSFSchema = {
        type: 'string',
        minLength: 1,
      };

      const uiSchema = {
        foo: 'bar',
      };

      const formData = 0;

      const CustomErrorList = ({
        errors,
        errorSchema,
        schema,
        uiSchema,
        registry: {
          formContext: { className },
        },
      }: ErrorListProps) => (
        <div>
          <div className='CustomErrorList'>{errors.length} custom</div>
          <div className={'ErrorSchema'}>{errorSchema.__errors?.[0]}</div>
          <div className={'Schema'}>{schema.type}</div>
          <div className={'UiSchema'}>{uiSchema?.foo}</div>
          <div className={className} />
        </div>
      );

      it('should use CustomErrorList', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          liveValidate: true,
          formData,
          templates: { ErrorListTemplate: CustomErrorList },
          formContext: { className: 'foo' },
        });

        // trigger the errors by submitting the form since initial render no longer shows them
        submitForm(node);
        expect(node.querySelectorAll('.CustomErrorList')).toHaveLength(1);
        expect(node.querySelector('.CustomErrorList')).toHaveTextContent('1 custom');
        expect(node.querySelectorAll('.ErrorSchema')).toHaveLength(1);
        expect(node.querySelector('.ErrorSchema')).toHaveTextContent('must be string');
        expect(node.querySelectorAll('.Schema')).toHaveLength(1);
        expect(node.querySelector('.Schema')).toHaveTextContent('string');
        expect(node.querySelectorAll('.UiSchema')).toHaveLength(1);
        expect(node.querySelector('.UiSchema')).toHaveTextContent('bar');
        expect(node.querySelectorAll('.foo')).toHaveLength(1);
      });
    });
    describe('Custom meta schema', () => {
      let onError: jest.Mock;
      let node: Element;
      const formData = {
        datasetId: 'no err',
      };

      const schema: RJSFSchema = {
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

      beforeEach(() => {
        const validator = customizeV8Validator({
          additionalMetaSchemas: [require('ajv/lib/refs/json-schema-draft-06.json')],
        });
        const withMetaSchema = createFormComponent(
          {
            schema,
            formData,
            liveValidate: true,
          },
          validator,
        );
        node = withMetaSchema.node;
        onError = withMetaSchema.onError;
        submitForm(node);
      });
      it('should be used to validate schema', () => {
        expect(node.querySelectorAll('.errors li')).toHaveLength(1);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must match pattern "\\d+"',
            name: 'pattern',
            params: { pattern: '\\d+' },
            property: '.datasetId',
            schemaPath: '#/properties/datasetId/pattern',
            stack: '.datasetId must match pattern "\\d+"',
            title: '',
          },
        ]);
        onError.mockClear();

        act(() => {
          fireEvent.change(node.querySelector('input')!, {
            target: { value: '1234' },
          });
        });
        expect(node.querySelectorAll('.errors li')).toHaveLength(0);
        expect(onError).not.toHaveBeenCalled();
      });
    });
  });
});
