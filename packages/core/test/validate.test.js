import { expect } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';

import { createFormComponent, submitForm } from './test_utils';
import v6Validator, { customizeValidator as customizeV6Validator } from '@rjsf/validator-ajv6';
import { customizeValidator as customizeV8Validator } from '@rjsf/validator-ajv8';

describe('Validation', () => {
  describe('Form integration, v6 validator', () => {
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('JSONSchema validation', () => {
      describe('ShowErrorList prop top', () => {
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };

        let node;
        const compInfo = createFormComponent({
          schema,
          formData: {
            foo: undefined,
          },
        });
        node = compInfo.node;
        submitForm(node);

        it('should render errors at the top', () => {
          expect(node.querySelectorAll('.errors li')).to.have.length.of(1);
          expect(node.querySelector('.errors li').textContent).eql("must have required property 'foo'");
          expect(node.childNodes[0].className).to.eql('panel panel-danger errors');
        });
      });

      describe('ShowErrorList prop bottom', () => {
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };

        let node;
        const compInfo = createFormComponent({
          showErrorList: 'bottom',
          schema,
          formData: {
            foo: undefined,
          },
        });
        node = compInfo.node;
        submitForm(node);

        it('should render errors at the bottom', () => {
          expect(node.querySelectorAll('.errors li')).to.have.length.of(1);
          expect(node.querySelector('.errors li').textContent).eql("must have required property 'foo'");

          // The last child node is the submit button so the one before it will be the error list
          expect(node.childNodes[2].className).to.eql('panel panel-danger errors');
        });
      });

      describe('Required fields', () => {
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };

        let onError, node;
        beforeEach(() => {
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined,
            },
            validator: v6Validator,
          });
          onError = compInfo.onError;
          node = compInfo.node;
          submitForm(node);
        });

        it('should trigger onError call', () => {
          sinon.assert.calledWithMatch(onError.lastCall, [
            {
              message: 'is a required property',
              name: 'required',
              params: { missingProperty: 'foo' },
              property: '.foo',
              schemaPath: '#/required',
              stack: '.foo is a required property',
            },
          ]);
        });

        it('should render errors', () => {
          expect(node.querySelectorAll('.errors li')).to.have.length.of(1);
          expect(node.querySelector('.errors li').textContent).eql('.foo is a required property');
          expect(node.childNodes[0].className).to.eql('panel panel-danger errors');
        });
      });

      describe('Min length', () => {
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: {
              type: 'string',
              minLength: 10,
            },
          },
        };

        let node, onError;

        beforeEach(() => {
          onError = sandbox.spy();
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: '123456789',
            },
            onError,
            validator: v6Validator,
          });
          node = compInfo.node;

          submitForm(node);
        });

        it('should render errors', () => {
          expect(node.querySelectorAll('.errors li')).to.have.length.of(1);
          expect(node.querySelector('.errors li').textContent).eql('.foo should NOT be shorter than 10 characters');
        });

        it('should trigger the onError handler', () => {
          sinon.assert.calledWithMatch(onError.lastCall, [
            {
              message: 'should NOT be shorter than 10 characters',
              name: 'minLength',
              params: { limit: 10 },
              property: '.foo',
              schemaPath: '#/properties/foo/minLength',
              stack: '.foo should NOT be shorter than 10 characters',
            },
          ]);
        });
      });
    });

    describe('Custom Form validation', () => {
      it('should validate a simple string value', () => {
        const schema = { type: 'string' };
        const formData = 'a';

        function customValidate(formData, errors) {
          if (formData !== 'hello') {
            errors.addError('Invalid');
          }
          return errors;
        }

        const { onError, node } = createFormComponent({
          schema,
          customValidate,
          formData,
          validator: v6Validator,
        });

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [{ property: '.', message: 'Invalid', stack: '. Invalid' }]);
      });

      it('should live validate a simple string value when liveValidate is set to true', () => {
        const schema = { type: 'string' };
        const formData = 'a';

        function customValidate(formData, errors) {
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
          validator: v6Validator,
        });
        Simulate.change(node.querySelector('input'), {
          target: { value: '1234' },
        });

        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            errorSchema: { __errors: ['Invalid'] },
            errors: [{ property: '.', message: 'Invalid', stack: '. Invalid' }],
            formData: '1234',
          },
          'root'
        );
      });

      it('should submit form on valid data', () => {
        const schema = { type: 'string' };
        const formData = 'hello';
        const onSubmit = sandbox.spy();

        function customValidate(formData, errors) {
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
          validator: v6Validator,
        });

        submitForm(node);

        sinon.assert.called(onSubmit);
      });

      it('should prevent form submission on invalid data', () => {
        const schema = { type: 'string' };
        const formData = 'a';
        const onSubmit = sandbox.spy();
        const onError = sandbox.spy();

        function customValidate(formData, errors) {
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
          validator: v6Validator,
        });

        submitForm(node);

        sinon.assert.notCalled(onSubmit);
        sinon.assert.called(onError);
      });

      it('should validate a simple object', () => {
        const schema = {
          type: 'object',
          properties: {
            pass1: { type: 'string', minLength: 3 },
            pass2: { type: 'string', minLength: 3 },
          },
        };

        const formData = { pass1: 'aaa', pass2: 'b' };

        function customValidate(formData, errors) {
          const { pass1, pass2 } = formData;
          if (pass1 !== pass2) {
            errors.pass2.addError("Passwords don't match");
          }
          return errors;
        }

        const { node, onError } = createFormComponent({
          schema,
          customValidate,
          formData,
          validator: v6Validator,
        });
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'should NOT be shorter than 3 characters',
            name: 'minLength',
            params: { limit: 3 },
            property: '.pass2',
            schemaPath: '#/properties/pass2/minLength',
            stack: '.pass2 should NOT be shorter than 3 characters',
          },
          {
            property: '.pass2',
            message: "Passwords don't match",
            stack: ".pass2 Passwords don't match",
          },
        ]);
      });

      it('should validate an array of object', () => {
        const schema = {
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

        function customValidate(formData, errors) {
          formData.forEach(({ pass1, pass2 }, i) => {
            if (pass1 !== pass2) {
              errors[i].pass2.addError("Passwords don't match");
            }
          });
          return errors;
        }

        const { node, onError } = createFormComponent({
          schema,
          customValidate,
          formData,
          validator: v6Validator,
        });

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            property: '.0.pass2',
            message: "Passwords don't match",
            stack: ".0.pass2 Passwords don't match",
          },
        ]);
      });

      it('should validate a simple array', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'string',
          },
        };

        const formData = ['aaa', 'bbb', 'ccc'];

        function customValidate(formData, errors) {
          if (formData.indexOf('bbb') !== -1) {
            errors.addError('Forbidden value: bbb');
          }
          return errors;
        }

        const { node, onError } = createFormComponent({
          schema,
          customValidate,
          formData,
          validator: v6Validator,
        });
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
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
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };

        let node, onError;
        beforeEach(() => {
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined,
            },
            showErrorList: false,
            validator: v6Validator,
          });
          node = compInfo.node;
          onError = compInfo.onError;

          submitForm(node);
        });

        it('should not render error list if showErrorList prop true', () => {
          expect(node.querySelectorAll('.errors li')).to.have.length.of(0);
        });

        it('should trigger onError call', () => {
          sinon.assert.calledWithMatch(onError.lastCall, [
            {
              message: 'is a required property',
              name: 'required',
              params: { missingProperty: 'foo' },
              property: '.foo',
              schemaPath: '#/required',
              stack: '.foo is a required property',
            },
          ]);
        });
      });
    });

    describe('Custom ErrorList', () => {
      const schema = {
        type: 'string',
        minLength: 1,
      };

      const uiSchema = {
        foo: 'bar',
      };

      const formData = 0;

      const CustomErrorList = ({ errors, errorSchema, schema, uiSchema, formContext: { className } }) => (
        <div>
          <div className='CustomErrorList'>{errors.length} custom</div>
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
          templates: { ErrorListTemplate: CustomErrorList },
          formContext: { className: 'foo' },
          validator: v6Validator,
        });
        expect(node.querySelectorAll('.CustomErrorList')).to.have.length.of(1);
        expect(node.querySelector('.CustomErrorList').textContent).eql('1 custom');
        expect(node.querySelectorAll('.ErrorSchema')).to.have.length.of(1);
        expect(node.querySelector('.ErrorSchema').textContent).eql('should be string');
        expect(node.querySelectorAll('.Schema')).to.have.length.of(1);
        expect(node.querySelector('.Schema').textContent).eql('string');
        expect(node.querySelectorAll('.UiSchema')).to.have.length.of(1);
        expect(node.querySelector('.UiSchema').textContent).eql('bar');
        expect(node.querySelectorAll('.foo')).to.have.length.of(1);
      });
    });
    describe('Custom meta schema', () => {
      let onError, node;
      const formData = {
        datasetId: 'no err',
      };

      const schema = {
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

      beforeEach(() => {
        const validator = customizeV6Validator({
          additionalMetaSchemas: [require('ajv/lib/refs/json-schema-draft-04.json')],
        });
        const withMetaSchema = createFormComponent({
          schema,
          formData,
          liveValidate: true,
          validator,
        });
        node = withMetaSchema.node;
        onError = withMetaSchema.onError;
        submitForm(node);
      });
      it('should be used to validate schema', () => {
        expect(node.querySelectorAll('.errors li')).to.have.length.of(1);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'should match pattern "\\d+"',
            name: 'pattern',
            params: { pattern: '\\d+' },
            property: '.datasetId',
            schemaPath: '#/properties/datasetId/pattern',
            stack: '.datasetId should match pattern "\\d+"',
          },
        ]);
        onError.resetHistory();

        Simulate.change(node.querySelector('input'), {
          target: { value: '1234' },
        });
        expect(node.querySelectorAll('.errors li')).to.have.length.of(0);
        sinon.assert.notCalled(onError);
      });
    });
  });
  describe('Form integration, v8 validator', () => {
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('JSONSchema validation', () => {
      describe('Required fields', () => {
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };

        let onError, node;
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
          sinon.assert.calledWithMatch(onError.lastCall, [
            {
              message: "must have required property 'foo'",
              name: 'required',
              params: { missingProperty: 'foo' },
              property: 'foo',
              schemaPath: '#/required',
              stack: "must have required property 'foo'",
            },
          ]);
        });

        it('should render errors', () => {
          expect(node.querySelectorAll('.errors li')).to.have.length.of(1);
          expect(node.querySelector('.errors li').textContent).eql("must have required property 'foo'");
        });
      });

      describe('Min length', () => {
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: {
              type: 'string',
              minLength: 10,
            },
          },
        };

        let node, onError;

        beforeEach(() => {
          onError = sandbox.spy();
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: '123456789',
            },
            onError,
          });
          node = compInfo.node;

          submitForm(node);
        });

        it('should render errors', () => {
          expect(node.querySelectorAll('.errors li')).to.have.length.of(1);
          expect(node.querySelector('.errors li').textContent).eql('.foo must NOT have fewer than 10 characters');
        });

        it('should trigger the onError handler', () => {
          sinon.assert.calledWithMatch(onError.lastCall, [
            {
              message: 'must NOT have fewer than 10 characters',
              name: 'minLength',
              params: { limit: 10 },
              property: '.foo',
              schemaPath: '#/properties/foo/minLength',
              stack: '.foo must NOT have fewer than 10 characters',
            },
          ]);
        });
      });
    });

    describe('Custom Form validation', () => {
      it('should validate a simple string value', () => {
        const schema = { type: 'string' };
        const formData = 'a';

        function customValidate(formData, errors) {
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
        sinon.assert.calledWithMatch(onError.lastCall, [{ property: '.', message: 'Invalid', stack: '. Invalid' }]);
      });

      it('should live validate a simple string value when liveValidate is set to true', () => {
        const schema = { type: 'string' };
        const formData = 'a';

        function customValidate(formData, errors) {
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
        Simulate.change(node.querySelector('input'), {
          target: { value: '1234' },
        });

        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            errorSchema: { __errors: ['Invalid'] },
            errors: [{ property: '.', message: 'Invalid', stack: '. Invalid' }],
            formData: '1234',
          },
          'root'
        );
      });

      it('should submit form on valid data', () => {
        const schema = { type: 'string' };
        const formData = 'hello';
        const onSubmit = sandbox.spy();

        function customValidate(formData, errors) {
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

        sinon.assert.called(onSubmit);
      });

      it('should prevent form submission on invalid data', () => {
        const schema = { type: 'string' };
        const formData = 'a';
        const onSubmit = sandbox.spy();
        const onError = sandbox.spy();

        function customValidate(formData, errors) {
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

        sinon.assert.notCalled(onSubmit);
        sinon.assert.called(onError);
      });

      it('should validate a simple object', () => {
        const schema = {
          type: 'object',
          properties: {
            pass1: { type: 'string', minLength: 3 },
            pass2: { type: 'string', minLength: 3 },
          },
        };

        const formData = { pass1: 'aaa', pass2: 'b' };

        function customValidate(formData, errors) {
          const { pass1, pass2 } = formData;
          if (pass1 !== pass2) {
            errors.pass2.addError("Passwords don't match");
          }
          return errors;
        }

        const { node, onError } = createFormComponent({
          schema,
          customValidate,
          formData,
        });
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must NOT have fewer than 3 characters',
            name: 'minLength',
            params: { limit: 3 },
            property: '.pass2',
            schemaPath: '#/properties/pass2/minLength',
            stack: '.pass2 must NOT have fewer than 3 characters',
          },
          {
            property: '.pass2',
            message: "Passwords don't match",
            stack: ".pass2 Passwords don't match",
          },
        ]);
      });

      it('should validate an array of object', () => {
        const schema = {
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

        function customValidate(formData, errors) {
          formData.forEach(({ pass1, pass2 }, i) => {
            if (pass1 !== pass2) {
              errors[i].pass2.addError("Passwords don't match");
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
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            property: '.0.pass2',
            message: "Passwords don't match",
            stack: ".0.pass2 Passwords don't match",
          },
        ]);
      });

      it('should validate a simple array', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'string',
          },
        };

        const formData = ['aaa', 'bbb', 'ccc'];

        function customValidate(formData, errors) {
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
        sinon.assert.calledWithMatch(onError.lastCall, [
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
        const schema = {
          type: 'object',
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };

        let node, onError;
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
          expect(node.querySelectorAll('.errors li')).to.have.length.of(0);
        });

        it('should trigger onError call', () => {
          sinon.assert.calledWithMatch(onError.lastCall, [
            {
              message: "must have required property 'foo'",
              name: 'required',
              params: { missingProperty: 'foo' },
              property: 'foo',
              schemaPath: '#/required',
              stack: "must have required property 'foo'",
            },
          ]);
        });
      });
    });

    describe('Custom ErrorList', () => {
      const schema = {
        type: 'string',
        minLength: 1,
      };

      const uiSchema = {
        foo: 'bar',
      };

      const formData = 0;

      const CustomErrorList = ({ errors, errorSchema, schema, uiSchema, formContext: { className } }) => (
        <div>
          <div className='CustomErrorList'>{errors.length} custom</div>
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
          templates: { ErrorListTemplate: CustomErrorList },
          formContext: { className: 'foo' },
        });
        expect(node.querySelectorAll('.CustomErrorList')).to.have.length.of(1);
        expect(node.querySelector('.CustomErrorList').textContent).eql('1 custom');
        expect(node.querySelectorAll('.ErrorSchema')).to.have.length.of(1);
        expect(node.querySelector('.ErrorSchema').textContent).eql('must be string');
        expect(node.querySelectorAll('.Schema')).to.have.length.of(1);
        expect(node.querySelector('.Schema').textContent).eql('string');
        expect(node.querySelectorAll('.UiSchema')).to.have.length.of(1);
        expect(node.querySelector('.UiSchema').textContent).eql('bar');
        expect(node.querySelectorAll('.foo')).to.have.length.of(1);
      });
    });
    describe('Custom meta schema', () => {
      let onError, node;
      const formData = {
        datasetId: 'no err',
      };

      const schema = {
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
        const withMetaSchema = createFormComponent({
          schema,
          formData,
          liveValidate: true,
          validator,
        });
        node = withMetaSchema.node;
        onError = withMetaSchema.onError;
        submitForm(node);
      });
      it('should be used to validate schema', () => {
        expect(node.querySelectorAll('.errors li')).to.have.length.of(1);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must match pattern "\\d+"',
            name: 'pattern',
            params: { pattern: '\\d+' },
            property: '.datasetId',
            schemaPath: '#/properties/datasetId/pattern',
            stack: '.datasetId must match pattern "\\d+"',
          },
        ]);
        onError.resetHistory();

        Simulate.change(node.querySelector('input'), {
          target: { value: '1234' },
        });
        expect(node.querySelectorAll('.errors li')).to.have.length.of(0);
        sinon.assert.notCalled(onError);
      });
    });
  });
});
