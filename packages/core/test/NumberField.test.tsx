import { createRef } from 'react';
import type { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type Form from '../src/index.ts';
import {
  createFormComponent,
  expectToHaveBeenCalledWithFormData,
  getSelectedOptionValue,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

describe('NumberField', () => {
  describe('Number widget', () => {
    describe('with a native number input (ui:options.inputType is number)', () => {
      const uiSchema: UiSchema = { 'ui:options': { inputType: 'number' } };

      it('should use step to represent the multipleOf keyword', () => {
        const { node } = createFormComponent({ schema: { type: 'number', multipleOf: 5 }, uiSchema });

        expect(node.querySelector('input')).toHaveAttribute('step', '5');
      });

      it('should use min to represent the minimum keyword', () => {
        const { node } = createFormComponent({ schema: { type: 'number', minimum: 0 }, uiSchema });

        expect(node.querySelector('input')).toHaveAttribute('min', '0');
      });

      it('should use max to represent the maximum keyword', () => {
        const { node } = createFormComponent({ schema: { type: 'number', maximum: 100 }, uiSchema });

        expect(node.querySelector('input')).toHaveAttribute('max', '100');
      });
    });

    it('should render a nullable number like a number, since it renders through the same NumberField', () => {
      const { node } = createFormComponent({
        schema: { type: ['number', 'null'], multipleOf: 0.5, minimum: 0, maximum: 10 },
      });

      const input = node.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('inputmode', 'decimal');
      expect(input).toHaveAttribute('pattern');
      expect(input).toHaveAttribute('title', 'Enter a number');
      expect(input).not.toHaveAttribute('step');
      expect(input).not.toHaveAttribute('min');
      expect(input).not.toHaveAttribute('max');
    });

    it('should render a nullable integer like an integer, since it renders through the same NumberField', () => {
      const { node } = createFormComponent({ schema: { type: ['integer', 'null'], minimum: 0, maximum: 10 } });

      const input = node.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('title', 'Enter a whole number');
      expect(input).not.toHaveAttribute('min');
      expect(input).not.toHaveAttribute('max');
    });

    it('should title the default text input so the browser names the format its pattern rejects', () => {
      const { node } = createFormComponent({ schema: { type: 'number' } });

      expect(node.querySelector('input')).toHaveAttribute('title', 'Enter a number');
    });

    it('should not title a native number input, which has no pattern to explain', () => {
      const { node } = createFormComponent({
        schema: { type: 'number' },
        uiSchema: { 'ui:options': { inputType: 'number' } },
      });

      expect(node.querySelector('input')).not.toHaveAttribute('title');
    });

    const pendingSeparatorTests = [
      { typed: '.', display: '.', output: 0 },
      { typed: '-.', display: '-.', output: -0 },
      { typed: '+.', display: '+.', output: 0 },
    ];

    pendingSeparatorTests.forEach(({ typed, display, output }) => {
      it(`should leave the default text input submittable while it shows the ${typed} it reports as ${output}`, async () => {
        const { node, onChange } = createFormComponent({ schema: { type: 'number' } });

        const $input = node.querySelector('input')!;
        await user.type($input, typed);

        // The pattern has to accept every spelling the field itself produces, or native validation blocks a submit
        // of form data rjsf considers valid — the same 0 typed as '.00' goes through
        expectToHaveBeenCalledWithFormData(onChange, output, 'root');
        expect($input).toHaveValue(display);
        expect($input.checkValidity()).toBe(true);
      });
    });

    const integerSpellingTests = [
      { typed: '.', output: 0 },
      { typed: '5.', output: 5 },
      { typed: '5.0', output: 5 },
      { typed: '-5.', output: -5 },
    ];

    integerSpellingTests.forEach(({ typed, output }) => {
      it(`should leave an integer field submittable while it shows the ${typed} it reports as ${output}`, async () => {
        const { node, onChange } = createFormComponent({ schema: { type: 'integer' } });

        const $input = node.querySelector('input')!;
        await user.type($input, typed);

        expectToHaveBeenCalledWithFormData(onChange, output, 'root');
        expect($input).toHaveValue(typed);
        expect($input.checkValidity()).toBe(true);
      });
    });

    it('should keep an integer field unsubmittable while it shows a fraction, which is no whole number', async () => {
      const { node, onChange } = createFormComponent({ schema: { type: 'integer' } });

      const $input = node.querySelector('input')!;
      await user.type($input, '5.5');

      expectToHaveBeenCalledWithFormData(onChange, 5.5, 'root');
      expect($input.checkValidity()).toBe(false);
    });

    it('should keep the default text input unsubmittable while it shows a lone sign, which is no number at all', async () => {
      const { node, onChange } = createFormComponent({ schema: { type: 'number' } });

      const $input = node.querySelector('input')!;
      await user.type($input, '-');

      // `asNumber()` leaves this in formData as a string, so blocking the submit is the point of the pattern
      expectToHaveBeenCalledWithFormData(onChange, '-', 'root');
      expect($input.checkValidity()).toBe(false);
    });

    it('should not put step, min or max, which only a native number input honors, on the default text input', () => {
      const { node } = createFormComponent({
        schema: { type: 'integer', multipleOf: 5, minimum: 0, maximum: 100 },
      });

      const input = node.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');
      expect(input).not.toHaveAttribute('step');
      expect(input).not.toHaveAttribute('min');
      expect(input).not.toHaveAttribute('max');
    });

    it.each([
      ['a very small number', 'number', 0.0000001, '1e-7'],
      ['a very large number', 'number', 1e21, '1e+21'],
      ['a small negative number with a fraction', 'number', -1.5e-9, '-1.5e-9'],
      ['a very large integer', 'integer', 1e21, '1e+21'],
    ])('should let the browser accept %s that JavaScript renders with an exponent', (_, type, formData, rendered) => {
      const { node } = createFormComponent({ schema: { type: type as 'number' | 'integer' }, formData });

      const input = node.querySelector('input')!;
      expect(input).toHaveValue(rendered);
      expect(input.checkValidity()).toBe(true);
    });

    it('should handle the allowClearTextInputs clear button the same as an empty string change event, not storing "" in a number slot', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'number' },
        uiSchema: { 'ui:allowClearTextInputs': true },
        formData: 3,
      });

      await user.click(node.querySelector('button.btn-clear')!);

      expectToHaveBeenCalledWithFormData(onChange, undefined, 'root');
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

      it('formData should default to undefined', async () => {
        const { node, onSubmit } = createFormComponent({
          schema: { type: 'number' },
          uiSchema,
          noValidate: true,
        });

        await submitForm(node, user);
        expectToHaveBeenCalledWithFormData(onSubmit, undefined, true);
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

        expectToHaveBeenCalledWithFormData(onChange, 2, 'root');
      });

      it('should handle a blur event', async () => {
        const onBlur = vi.fn();
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
          onBlur,
        });

        const input = node.querySelector('input')!;
        await user.type(input, '2');
        await user.tab();

        expect(onBlur).toHaveBeenCalledWith(input.id, '2');
      });

      it('should handle a focus event', async () => {
        const onFocus = vi.fn();
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
          onFocus,
          formData: 2,
        });

        const input = node.querySelector('input')!;
        await user.click(input);

        expect(onFocus).toHaveBeenCalledWith(input.id, '2');
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

            expectToHaveBeenCalledWithFormData(onChange, test.output, 'root');
            expect($input).toHaveValue(test.input);
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

        expectToHaveBeenCalledWithFormData(onChange, 0, 'root');
        expect($input).toHaveValue('.00');
      });

      describe('signed values', () => {
        const signedTests = [
          { input: '-0.5', output: -0.5, display: '-0.5' },
          { input: '-1.50', output: -1.5, display: '-1.50' },
          { input: '+5', output: 5, display: '+5' },
          { input: '-.5', output: -0.5, display: '-0.5' },
          { input: '+.5', output: 0.5, display: '0.5' },
          { input: '-.', output: -0, display: '-.' },
        ];

        signedTests.forEach(({ input, output, display }) => {
          it(`should keep the sign of an input value of ${input}`, async () => {
            const { node, onChange } = createFormComponent({
              schema: {
                type: 'number',
              },
              uiSchema,
            });

            const $input = node.querySelector('input');

            await user.type($input!, input);

            expectToHaveBeenCalledWithFormData(onChange, output, 'root');
            expect($input).toHaveValue(display);
          });
        });

        const staleTests = [
          { typed: '-', formData: 7, display: '7' },
          { typed: '+', formData: 7, display: '7' },
          { typed: '-5', formData: 5, display: '5' },
          { typed: '-0.5', formData: 0.5, display: '0.5' },
          { typed: '5', formData: -5, display: '-5' },
          { typed: '+5', formData: -5, display: '-5' },
          { typed: '-0', formData: 5, display: '5' },
          { typed: '0', formData: 7, display: '7' },
          { typed: '.', formData: 7, display: '7' },
          { typed: '00', formData: 7, display: '7' },
          { typed: '.0', formData: 7, display: '7' },
        ];

        staleTests.forEach(({ typed, formData, display }) => {
          it(`should show a formData of ${formData} set from outside instead of the typed ${typed}`, async () => {
            const schema: RJSFSchema = {
              type: 'number',
            };
            const { rerender, node } = createFormComponent({
              schema,
              uiSchema,
            });

            const $input = node.querySelector('input')!;
            await user.type($input, typed);

            rerender({ schema, uiSchema, formData });

            expect($input).toHaveValue(display);
          });
        });

        it('should keep the minus sign of a negative zero on an integer', async () => {
          const { node } = createFormComponent({
            schema: {
              type: 'integer',
            },
            uiSchema,
          });

          const $input = node.querySelector('input');

          await user.type($input!, '-0');

          expect($input).toHaveValue('-0');
        });
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

        expect($input).toHaveValue('231');
        expectToHaveBeenCalledWithFormData(onChange, 231, 'root');

        act(() => {
          ref.current?.reset();
        });

        expect($input).toHaveValue('1');
        // No id on programmatic change
        expectToHaveBeenCalledWithFormData(onChange, 1);
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
        await user.type(node.querySelector('input')!, '2.');
        expect(node.querySelector('.rjsf-field input')).toHaveValue('2.');

        await user.type(node.querySelector('input')!, '0');
        expect(node.querySelector('.rjsf-field input')).toHaveValue('2.0');

        await user.type(node.querySelector('input')!, '0');
        expect(node.querySelector('.rjsf-field input')).toHaveValue('2.00');

        await user.type(node.querySelector('input')!, '0');
        expect(node.querySelector('.rjsf-field input')).toHaveValue('2.000');
      });

      it('should allow a zero to be input', async () => {
        const { node } = createFormComponent({
          schema: {
            type: 'number',
          },
          uiSchema,
        });

        await user.type(node.querySelector('input')!, '0');
        expect(node.querySelector('.rjsf-field input')).toHaveValue('0');
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

    it('should infer the value from an enum on change', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          enum: [1, 2],
        },
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(1);
      const $select = node.querySelector<HTMLSelectElement>('.rjsf-field select')!;
      expect($select).not.toHaveAttribute('value');
      const options = $select.querySelectorAll('option');

      await user.selectOptions($select, options[1]); // skip blank option, select enum[0] = 1

      expect(getSelectedOptionValue($select)).toEqual('1');
      expectToHaveBeenCalledWithFormData(onChange, 1, 'root');
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
      expectToHaveBeenCalledWithFormData(onChange, 1);
    });

    it('should handle a change event', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
        },
      });

      const $select = node.querySelector<HTMLSelectElement>('select')!;
      const options = $select.querySelectorAll('option');
      await user.selectOptions($select, options[2]); // skip blank option, select enum[1] = 2

      expectToHaveBeenCalledWithFormData(onChange, 2, 'root');
    });

    it('should fill field with data', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
        },
        formData: 2,
      });
      await submitForm(node, user);
      expectToHaveBeenCalledWithFormData(onSubmit, 2, true);
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

      const selects = node.querySelectorAll('select');
      expect(selects[0]).not.toHaveAttribute('value');

      const options = node.querySelectorAll('option');
      expect(options.length).toEqual(1);
      expect(options[0].innerHTML).toEqual('0');
    });
  });

  describe('Comma decimal separator locales (e.g., Polish, German)', () => {
    beforeEach(() => {
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['pl']);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should assign a default value formatted with comma', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          default: 2.3,
        },
        uiSchema: {
          'ui:options': {
            inputType: 'text',
          },
        },
      });

      expect(node.querySelector('.rjsf-field input')).toHaveAttribute('value', '2,3');
    });

    it('should render a text input by default when the locale decimal separator is not "."', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
        },
      });

      expect(node.querySelector('.rjsf-field input')).toHaveAttribute('type', 'text');
    });

    it('should not comma-format the display value when an explicit inputType overrides the resolved text widget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
        },
        uiSchema: {
          'ui:options': {
            inputType: 'number',
          },
        },
        formData: 2.3,
      });

      // getInputProps() gives the explicit inputType priority over the locale detection, so
      // this renders a native <input type="number">, which rejects/blanks a comma-formatted
      // value like "2,3". The display value must stay dot-formatted to match.
      const $input = node.querySelector('.rjsf-field input')!;
      expect($input).toHaveAttribute('type', 'number');
      expect($input).toHaveValue(2.3);
    });

    it('should handle a change event using comma decimal separator', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'number',
        },
        uiSchema: {
          'ui:options': {
            inputType: 'text',
          },
        },
      });

      await user.type(node.querySelector('input')!, '2,5');

      expectToHaveBeenCalledWithFormData(onChange, 2.5, 'root');
    });

    it('should handle a change event using comma decimal separator with the default input', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'number',
        },
      });

      await user.type(node.querySelector('input')!, '2,5');

      expectToHaveBeenCalledWithFormData(onChange, 2.5, 'root');
    });

    it('should render with trailing zeroes using comma', async () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
        },
        uiSchema: {
          'ui:options': {
            inputType: 'text',
          },
        },
      });

      const $input = node.querySelector('input')!;
      await user.type($input, '2,');
      expect($input).toHaveValue('2,');

      await user.type($input, '0');
      expect($input).toHaveValue('2,0');

      await user.type($input, '0');
      expect($input).toHaveValue('2,00');
    });

    it('should preserve a typed "." as a pending decimal point instead of snapping to the locale separator', async () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
        },
      });

      const $input = node.querySelector('input')!;
      await user.type($input, '2.');
      expect($input).toHaveValue('2.');

      await user.type($input, '0');
      expect($input).toHaveValue('2.0');

      await user.type($input, '0');
      expect($input).toHaveValue('2.00');
    });

    it('should commit the correct numeric value when "." is typed instead of the locale separator', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'number',
        },
      });

      await user.type(node.querySelector('input')!, '2.1');

      expectToHaveBeenCalledWithFormData(onChange, 2.1, 'root');
    });

    it('should not treat a stale cached input containing "." as a wildcard match for an unrelated value', async () => {
      const schema: RJSFSchema = {
        type: 'number',
      };
      const uiSchema: UiSchema = {
        'ui:options': {
          inputType: 'text',
        },
      };

      const { rerender, node } = createFormComponent({
        ref: createRef(),
        schema,
        uiSchema,
      });

      const $input = node.querySelector('input')!;
      // Poison the component's cached "last typed value" with a string that isn't a number
      // but shares every character with '2.5' except the position where '.' would be.
      await user.type($input, '2x5');

      // An unrelated, externally-provided value comes in (e.g. a programmatic reset).
      rerender({ schema, formData: 2.5 });

      // A regex built from '2.5' without escaping the '.' treats it as "any character" and
      // wrongly matches the stale '2x5', redisplaying garbage instead of the locale-formatted number.
      expect($input).toHaveValue('2,5');
    });

    it('should normalize values beginning with a comma', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'number',
        },
        uiSchema: {
          'ui:options': {
            inputType: 'text',
          },
        },
      });

      const $input = node.querySelector('input')!;
      await user.type($input, ',05');

      expectToHaveBeenCalledWithFormData(onChange, 0.05, 'root');
      expect($input).toHaveValue('0,05');
    });

    it('should keep the sign of a negative value beginning with a comma', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'number',
        },
        uiSchema: {
          'ui:options': {
            inputType: 'text',
          },
        },
      });

      const $input = node.querySelector('input')!;
      await user.type($input, '-,05');

      expectToHaveBeenCalledWithFormData(onChange, -0.05, 'root');
      expect($input).toHaveValue('-0,05');
    });

    it('should not format select widget options with comma (keep dot)', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [2.3, 4.5],
        },
        formData: 2.3,
      });

      const $select = node.querySelector<HTMLSelectElement>('select')!;
      expect(getSelectedOptionValue($select)).toEqual('2.3');
    });

    it('should not format radio widget options with comma (keep dot)', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [2.3, 4.5],
        },
        uiSchema: {
          'ui:widget': 'radio',
        },
        formData: 2.3,
      });

      const inputs = node.querySelectorAll<HTMLInputElement>('input[type="radio"]');
      expect(inputs[0].checked).toBe(true);
      expect(inputs[1].checked).toBe(false);
    });

    it('should not format hidden widget options with comma (keep dot)', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
        },
        uiSchema: {
          'ui:widget': 'hidden',
        },
        formData: 2.3,
      });

      const input = node.querySelector<HTMLInputElement>('input[type="hidden"]')!;
      expect(input).toHaveAttribute('value', '2.3');
    });

    it('should pass a number, not a string, to a custom widget', () => {
      let receivedValue: unknown;
      const CustomWidget = (props: WidgetProps) => {
        receivedValue = props.value;
        return <div id='custom-widget' />;
      };

      const { node } = createFormComponent({
        schema: {
          type: 'number',
        },
        uiSchema: {
          'ui:widget': 'custom',
        },
        widgets: {
          custom: CustomWidget,
        },
        formData: 2.3,
      });

      expect(node.querySelector('#custom-widget')).toBeInTheDocument();
      expect(receivedValue).toBe(2.3);
    });

    it('should pass a number, not a string, to a format-registered widget', () => {
      let receivedValue: unknown;
      const CustomFormatWidget = (props: WidgetProps) => {
        receivedValue = props.value;
        return <div id='custom-format-widget' />;
      };

      const { node } = createFormComponent({
        schema: {
          type: 'number',
          format: 'custom-format',
        },
        widgets: {
          'custom-format': CustomFormatWidget,
        },
        formData: 2.3,
      });

      expect(node.querySelector('#custom-format-widget')).toBeInTheDocument();
      expect(receivedValue).toBe(2.3);
    });

    it('should let the browser accept the "." formatted value a custom widget renders through BaseInputTemplate', () => {
      const CustomWidget = ({ registry, ...props }: WidgetProps) => (
        <registry.templates.BaseInputTemplate {...props} registry={registry} />
      );

      const { node } = createFormComponent({
        schema: {
          type: 'number',
        },
        uiSchema: {
          'ui:widget': 'custom',
        },
        widgets: {
          custom: CustomWidget,
        },
        formData: 2.3,
      });

      // NumberField only comma-formats the value for the built-in text widget, so this input keeps "2.3"
      const input = node.querySelector('input')!;
      expect(input).toHaveValue('2.3');
      expect(input.checkValidity()).toBe(true);
    });

    it('should let a custom widget keep the pattern and inputMode it passes to BaseInputTemplate', () => {
      const CustomWidget = ({ registry, ...props }: WidgetProps) => (
        <registry.templates.BaseInputTemplate
          {...props}
          registry={registry}
          pattern='[0-9]*[.]?[0-9]{0,2}'
          inputMode='tel'
        />
      );

      const { node } = createFormComponent({
        schema: { type: 'number' },
        uiSchema: { 'ui:widget': 'custom' },
        widgets: { custom: CustomWidget },
      });

      const input = node.querySelector('input')!;
      expect(input).toHaveAttribute('pattern', '[0-9]*[.]?[0-9]{0,2}');
      expect(input).toHaveAttribute('inputmode', 'tel');
      // The title names the constraint the derived pattern imposes, so it goes when that pattern is replaced
      expect(input).not.toHaveAttribute('title');
    });
  });
});
