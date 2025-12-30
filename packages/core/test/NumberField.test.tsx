import { createRef } from 'react';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import isEmpty from 'lodash/isEmpty';

import Form from '../src';
import { createFormComponent, getSelectedOptionValue, submitForm } from './testUtils';

const user = userEvent.setup();

describe('NumberField', () => {
  describe('Number widget', () => {
    it('should use step to represent the multipleOf keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          multipleOf: 5,
        },
      });

      expect(node.querySelector('input')).toHaveAttribute('step', '5');
    });

    it('should use min to represent the minimum keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          minimum: 0,
        },
      });

      expect(node.querySelector('input')).toHaveAttribute('min', '0');
    });

    it('should use max to represent the maximum keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          maximum: 100,
        },
      });

      expect(node.querySelector('input')).toHaveAttribute('max', '100');
    });

    it('should use step to represent the multipleOf keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          multipleOf: 5,
        },
      });

      expect(node.querySelector('input')).toHaveAttribute('step', '5');
    });

    it('should use min to represent the minimum keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          minimum: 0,
        },
      });

      expect(node.querySelector('input')).toHaveAttribute('min', '0');
    });

    it('should use max to represent the maximum keyword', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          maximum: 100,
        },
      });

      expect(node.querySelector('input')).toHaveAttribute('max', '100');
    });
  });
  describe('Number and text widget', () => {
    const uiSchemas: UiSchema[] = [
      {},
      {
        'ui:options': {
          inputType: 'text',
        },
      },
    ];
    for (const uiSchema of uiSchemas) {
      it('should render a string field with a label', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
            title: 'foo',
          },
          uiSchema,
        });

        expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
      });

      it('should render a string field with a description', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
            description: 'bar',
          },
          uiSchema,
        });

        expect(node.querySelector('.field-description')).toHaveTextContent('bar');
      });

      it('formData should default to undefined', () => {
        const { node, onSubmit } = createFormComponent({
          schema: { type: 'number' },
          uiSchema,
          noValidate: true,
        });

        submitForm(node);
        expect(onSubmit).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: undefined }),
          expect.objectContaining({ type: 'submit' }),
        );
      });

      it('should assign a default value', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
            default: 2,
          },
          uiSchema,
        });

        expect(node.querySelector('.rjsf-field input')).toHaveAttribute('value', '2');
      });

      it('should handle a change event', async () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        await user.type(node.querySelector('input')!, '2');

        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 2 }), 'root');
      });

      it('should handle a blur event', () => {
        const onBlur = jest.fn();
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
          onBlur,
        });

        const input = node.querySelector('input');
        fireEvent.blur(input!, {
          target: { value: '2' },
        });

        expect(onBlur).toHaveBeenCalledWith(input?.id, '2');
      });

      it('should handle a focus event', () => {
        const onFocus = jest.fn();
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
          onFocus,
        });

        const input = node.querySelector('input');
        fireEvent.focus(input!, {
          target: { value: '2' },
        });

        expect(onFocus).toHaveBeenCalledWith(input?.id, '2');
      });

      it('should fill field with data', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
          formData: 2,
        });

        expect(node.querySelector('.rjsf-field input')).toHaveAttribute('value', '2');
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
          it(`should work with an input value of ${test.input}`, async () => {
            const { node, onChange } = createFormComponent({
              schema: {
                type: 'number',
              },
              uiSchema,
            });

            const $input = node.querySelector('input');

            await user.type($input!, test.input);

            expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: test.output }), 'root');
            // "2." is not really a valid number in a input field of type number
            // so we need to use getAttribute("value") instead since .value outputs the empty string
            expect($input).toHaveValue(isEmpty(uiSchema) ? test.output : test.input);
          });
        });
      });

      it('should normalize values beginning with a decimal point', async () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        const $input = node.querySelector('input');

        await user.type($input!, '.00');

        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 0 }), 'root');
        const expected = isEmpty(uiSchema) ? 0 : '.00';
        expect($input).toHaveValue(expected);
      });

      it('should update input values correctly when formData prop changes', () => {
        const schema: RJSFSchema = {
          type: 'number',
        };

        const { rerender, node } = createFormComponent({
          ref: createRef(),
          schema,
          uiSchema,
          formData: 2.03,
        });

        const $input = node.querySelector('input');

        expect($input).toHaveAttribute('value', '2.03');

        rerender({ schema, formData: 203 });

        expect($input).toHaveAttribute('value', '203');
      });

      it('form reset should work for a default value', async () => {
        const schema: RJSFSchema = {
          type: 'number',
          default: 1,
        };

        const ref = createRef<Form>();

        const { node, onChange } = createFormComponent({
          ref,
          schema,
          uiSchema,
        });

        const $input = node.querySelector('input');

        await user.type($input!, '231', { initialSelectionStart: 0, initialSelectionEnd: 1 });

        expect($input).toHaveValue(isEmpty(uiSchema) ? 231 : '231');
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 231 }), 'root');

        act(() => {
          ref.current?.reset();
        });

        expect($input).toHaveValue(isEmpty(uiSchema) ? 1 : '1');
        // No id on programmatic change
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 1 }));
      });

      it('should render the widget with the expected id', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        expect(node.querySelector('input')).toHaveAttribute('id', 'root');
      });

      it('should render with trailing zeroes', async () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });
        const isNumber = isEmpty(uiSchema);
        await user.type(node.querySelector('input')!, '2.');

        if (isNumber) {
          // "2." is not really a valid number in a input field of type number
          // so we need to use getAttribute("value") instead since .value outputs the empty string
          expect(node.querySelector('.rjsf-field input')).toHaveValue(2);
        } else {
          expect(node.querySelector('.rjsf-field input')).toHaveValue('2.');
        }

        await user.type(node.querySelector('input')!, '0');
        if (isNumber) {
          expect(node.querySelector('.rjsf-field input')).toHaveValue(2.0);
        } else {
          expect(node.querySelector('.rjsf-field input')).toHaveValue('2.0');
        }

        await user.type(node.querySelector('input')!, '0');
        if (isNumber) {
          expect(node.querySelector('.rjsf-field input')).toHaveValue(2.0);
        } else {
          expect(node.querySelector('.rjsf-field input')).toHaveValue('2.00');
        }

        await user.type(node.querySelector('input')!, '0');
        if (isNumber) {
          expect(node.querySelector('.rjsf-field input')).toHaveValue(2.0);
        } else {
          expect(node.querySelector('.rjsf-field input')).toHaveValue('2.000');
        }
      });

      it('should allow a zero to be input', async () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        await user.type(node.querySelector('input')!, '0');
        const expected = isEmpty(uiSchema) ? 0 : '0';
        expect(node.querySelector('.rjsf-field input')).toHaveValue(expected);
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

        expect(node.querySelector('#custom')).toBeInTheDocument();
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

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(1);
    });

    it('should infer the value from an enum on change', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          enum: [1, 2],
        },
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(1);
      const $select = node.querySelector<HTMLSelectElement>('.rjsf-field select');
      expect($select).not.toHaveAttribute('value');

      act(() => {
        fireEvent.change(node.querySelector('.rjsf-field select')!, {
          target: { value: 0 }, // use index
        });
      });
      expect(getSelectedOptionValue($select!)).toEqual('1');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 1 }), 'root');
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
          title: 'foo',
        },
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
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

      // No id on initial onChange
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 1 }));
    });

    it('should handle a change event', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
        },
      });

      act(() => {
        fireEvent.change(node.querySelector('select')!, {
          target: { value: 1 }, // useIndex
        });
      });

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 2 }), 'root');
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
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: 2 }),
        expect.objectContaining({ type: 'submit' }),
      );
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
        },
      });

      expect(node.querySelector('select')).toHaveAttribute('id', 'root');
    });

    it('should render a select element with a blank option, when default value is not set.', () => {
      const schema: RJSFSchema = {
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
      expect(selects[0]).not.toHaveAttribute('value');

      const options = node.querySelectorAll('option');
      expect(options.length).toEqual(2);
      expect(options[0].innerHTML).toEqual('');
    });

    it('should render a select element without a blank option, if a default value is set.', () => {
      const schema: RJSFSchema = {
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
      expect(getSelectedOptionValue(selects[0])).toEqual('2');

      const options = node.querySelectorAll('option');
      expect(options.length).toEqual(1);
      expect(options[0].innerHTML).toEqual('2');
    });

    it('should render a select element without a blank option, if the default value is 0.', () => {
      const schema: RJSFSchema = {
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

      console.log(node.innerHTML);
      const selects = node.querySelectorAll('select');
      expect(selects[0]).not.toHaveAttribute('value');

      const options = node.querySelectorAll('option');
      expect(options.length).toEqual(1);
      expect(options[0].innerHTML).toEqual('0');
    });
  });
});
