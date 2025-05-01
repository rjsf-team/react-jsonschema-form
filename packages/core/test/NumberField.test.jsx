import * as React from 'react';
import { expect } from 'chai';
import { fireEvent, act } from '@testing-library/react';
import sinon from 'sinon';

import { createFormComponent, createSandbox, getSelectedOptionValue, setProps, submitForm } from './test_utils';

describe('NumberField', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Number widget', () => {
    it('should use step to represent the multipleOf keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          multipleOf: 5,
        },
      });

      expect(node.querySelector('input').step).to.eql('5');
    });

    it('should use min to represent the minimum keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          minimum: 0,
        },
      });

      expect(node.querySelector('input').min).to.eql('0');
    });

    it('should use max to represent the maximum keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          maximum: 100,
        },
      });

      expect(node.querySelector('input').max).to.eql('100');
    });

    it('should use step to represent the multipleOf keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          multipleOf: 5,
        },
      });

      expect(node.querySelector('input').step).to.eql('5');
    });

    it('should use min to represent the minimum keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          minimum: 0,
        },
      });

      expect(node.querySelector('input').min).to.eql('0');
    });

    it('should use max to represent the maximum keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          maximum: 100,
        },
      });

      expect(node.querySelector('input').max).to.eql('100');
    });
  });
  describe('Number and text widget', () => {
    let uiSchemas = [
      {},
      {
        'ui:options': {
          inputType: 'text',
        },
      },
    ];
    for (let uiSchema of uiSchemas) {
      it('should render a string field with a label', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
            title: 'foo',
          },
          uiSchema,
        });

        expect(node.querySelector('.rjsf-field label').textContent).eql('foo');
      });

      it('should render a string field with a description', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
            description: 'bar',
          },
          uiSchema,
        });

        expect(node.querySelector('.field-description').textContent).eql('bar');
      });

      it('formData should default to undefined', () => {
        const { node, onSubmit } = createFormComponent({
          schema: { type: 'number' },
          uiSchema,
          noValidate: true,
        });

        submitForm(node);
        sinon.assert.calledWithMatch(onSubmit.lastCall, {
          formData: undefined,
        });
      });

      it('should assign a default value', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
            default: 2,
          },
          uiSchema,
        });

        expect(node.querySelector('.rjsf-field input').value).eql('2');
      });

      it('should handle a change event', () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: '2' },
          });
        });

        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            formData: 2,
          },
          'root',
        );
      });

      it('should handle a blur event', () => {
        const onBlur = sandbox.spy();
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
          onBlur,
        });

        const input = node.querySelector('input');
        fireEvent.blur(input, {
          target: { value: '2' },
        });

        expect(onBlur.calledWith(input.id, 2));
      });

      it('should handle a focus event', () => {
        const onFocus = sandbox.spy();
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
          onFocus,
        });

        const input = node.querySelector('input');
        fireEvent.focus(input, {
          target: { value: '2' },
        });

        expect(onFocus.calledWith(input.id, 2));
      });

      it('should fill field with data', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
          formData: 2,
        });

        expect(node.querySelector('.rjsf-field input').value).eql('2');
      });

      describe('when inputting a number that ends with a dot and/or zero it should normalize it, without changing the input value', () => {
        const tests = [
          {
            input: '2.',
            output: 2,
          },
          {
            input: '2.0',
            output: 2,
          },
          {
            input: '2.3',
            output: 2.3,
          },
          {
            input: '2.30',
            output: 2.3,
          },
          {
            input: '2.300',
            output: 2.3,
          },
          {
            input: '2.3001',
            output: 2.3001,
          },
          {
            input: '2.03',
            output: 2.03,
          },
          {
            input: '2.003',
            output: 2.003,
          },
          {
            input: '2.00300',
            output: 2.003,
          },
          {
            input: '200300',
            output: 200300,
          },
        ];

        tests.forEach((test) => {
          it(`should work with an input value of ${test.input}`, () => {
            const { node, onChange } = createFormComponent({
              schema: {
                type: 'number',
              },
              uiSchema,
            });

            const $input = node.querySelector('input');

            act(() => {
              fireEvent.change($input, {
                target: { value: test.input },
              });
            });

            setTimeout(() => {
              sinon.assert.calledWithMatch(
                onChange.lastCall,
                {
                  formData: test.output,
                },
                'root',
              );
              // "2." is not really a valid number in a input field of type number
              // so we need to use getAttribute("value") instead since .value outputs the empty string
              expect($input.getAttribute('value')).eql(test.input);
            }, 0);
          });
        });
      });

      it('should normalize values beginning with a decimal point', () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        const $input = node.querySelector('input');

        act(() => {
          fireEvent.change($input, {
            target: { value: '.00' },
          });
        });

        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            formData: 0,
          },
          'root',
        );
        expect($input.value).eql('.00');
      });

      it('should update input values correctly when formData prop changes', () => {
        const schema = {
          type: 'number',
        };

        const { comp, node } = createFormComponent({
          ref: React.createRef(),
          schema,
          uiSchema,
          formData: 2.03,
        });

        const $input = node.querySelector('input');

        expect($input.value).eql('2.03');

        setProps(comp, {
          schema,
          formData: 203,
        });

        expect($input.value).eql('203');
      });

      it('form reset should work for a default value', () => {
        const onChangeSpy = sinon.spy();
        const schema = {
          type: 'number',
          default: 1,
        };

        const ref = React.createRef();

        const { node } = createFormComponent({
          ref: ref,
          schema,
          uiSchema,
          onChange: onChangeSpy,
        });

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: '231' },
          });
        });

        const $input = node.querySelector('input');
        expect($input.value).eql('231');
        sinon.assert.calledWithMatch(onChangeSpy.lastCall, { formData: 231 });

        act(() => {
          ref.current.reset();
        });

        expect($input.value).eql('1');
        sinon.assert.calledWithMatch(onChangeSpy.lastCall, { formData: 1 });
      });

      it('should render the widget with the expected id', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        expect(node.querySelector('input').id).eql('root');
      });

      it('should render with trailing zeroes', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: '2.' },
          });
        });

        // "2." is not really a valid number in a input field of type number
        // so we need to use getAttribute("value") instead since .value outputs the empty string
        setTimeout(() => {
          expect(node.querySelector('.rjsf-field input').getAttribute('value')).eql('2.');
        });

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: '2.0' },
          });
        });
        expect(node.querySelector('.rjsf-field input').value).eql('2.0');

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: '2.00' },
          });
        });
        expect(node.querySelector('.rjsf-field input').value).eql('2.00');

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: '2.000' },
          });
        });
        expect(node.querySelector('.rjsf-field input').value).eql('2.000');
      });

      it('should allow a zero to be input', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: '0' },
          });
        });
        expect(node.querySelector('.rjsf-field input').value).eql('0');
      });

      it('should render customized StringField', () => {
        const CustomStringField = () => <div id='custom' />;

        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
          fields: {
            StringField: CustomStringField,
          },
        });

        expect(node.querySelector('#custom')).to.exist;
      });
    }
  });

  describe('SelectWidget', () => {
    it('should render a number field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
        },
      });

      expect(node.querySelectorAll('.rjsf-field select')).to.have.length.of(1);
    });

    it('should infer the value from an enum on change', () => {
      const spy = sinon.spy();
      const { node } = createFormComponent({
        schema: {
          enum: [1, 2],
        },
        onChange: spy,
      });

      expect(node.querySelectorAll('.rjsf-field select')).to.have.length.of(1);
      const $select = node.querySelector('.rjsf-field select');
      expect($select.value).eql('');

      act(() => {
        fireEvent.change(node.querySelector('.rjsf-field select'), {
          target: { value: 0 }, // use index
        });
      });
      expect(getSelectedOptionValue($select)).eql('1');
      expect(spy.lastCall.args[0].formData).eql(1);
      expect(spy.lastCall.args[1]).eql('root');
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
          title: 'foo',
        },
      });

      expect(node.querySelector('.rjsf-field label').textContent).eql('foo');
    });

    it('should assign a default value', () => {
      const { onChange } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
          default: 1,
        },
        noValidate: true,
      });

      sinon.assert.calledWithMatch(onChange.lastCall, { formData: 1 });
    });

    it('should handle a change event', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
        },
      });

      act(() => {
        fireEvent.change(node.querySelector('select'), {
          target: { value: 1 }, // useIndex
        });
      });

      sinon.assert.calledWithMatch(onChange.lastCall, { formData: 2 }, 'root');
    });

    it('should fill field with data', () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
        },
        formData: 2,
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, { formData: 2 });
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
        },
      });

      expect(node.querySelector('select').id).eql('root');
    });

    it('should render a select element with a blank option, when default value is not set.', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'number',
            enum: [0],
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const selects = node.querySelectorAll('select');
      expect(selects[0].value).eql('');

      const options = node.querySelectorAll('option');
      expect(options.length).eql(2);
      expect(options[0].innerHTML).eql('');
    });

    it('should render a select element without a blank option, if a default value is set.', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'number',
            enum: [2],
            default: 2,
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const selects = node.querySelectorAll('select');
      expect(getSelectedOptionValue(selects[0])).eql('2');

      const options = node.querySelectorAll('option');
      expect(options.length).eql(1);
      expect(options[0].innerHTML).eql('2');
    });

    it('should render a select element without a blank option, if the default value is 0.', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'number',
            enum: [0],
            default: 0,
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const selects = node.querySelectorAll('select');
      expect(selects[0].value).eql('0');

      const options = node.querySelectorAll('option');
      expect(options.length).eql(1);
      expect(options[0].innerHTML).eql('0');
    });
  });
});
