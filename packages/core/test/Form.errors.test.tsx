import { createRef } from 'react';
import type {
  ErrorListProps,
  ErrorSchema,
  FieldProps,
  FormValidation,
  RJSFSchema,
  RJSFValidationError,
  WidgetProps,
} from '@rjsf/utils';
import { noop, toFieldPath } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormProps } from '../src/index.ts';
import {
  AcceptingParent,
  createFormComponent,
  createFormRef,
  describeRepeated,
  elementOf,
  errorListMessages,
  expectToHaveBeenCalledWithFormData,
  fieldErrorsById,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

function ErrorSchemaOutput({ errorSchema }: ErrorListProps) {
  return <output data-testid='error-schema'>{JSON.stringify(errorSchema)}</output>;
}

function renderedErrorSchema(): unknown {
  return JSON.parse(screen.getByTestId('error-schema').textContent);
}

describeRepeated('Form common: error contextualization', (createFormComponent) => {
  describe('Error contextualization', () => {
    describe('on form state updated', () => {
      const schema: RJSFSchema = {
        type: 'string',
        minLength: 8,
      };

      describe('Lazy validation', () => {
        it('should not update the errorSchema when the formData changes', async () => {
          const { node, onChange } = createFormComponent({ schema });

          await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');
          expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ errorSchema: {} }), 'root');
        });

        it('should not denote an error in the field', async () => {
          const { node } = createFormComponent({ schema });

          await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');

          expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);
        });

        it("should clean contextualized errors up when they're fixed", async () => {
          const altSchema: RJSFSchema = {
            type: 'object',
            properties: {
              field1: { type: 'string', minLength: 8 },
              field2: { type: 'string', minLength: 8 },
            },
          };
          const { node } = createFormComponent({
            schema: altSchema,
            initialFormData: {
              field1: 'short',
              field2: 'short',
            },
          });

          await submitForm(node, user);

          // Fix the first field
          await user.clear(node.querySelectorAll('input[type=text]')[0]);
          await user.type(node.querySelectorAll('input[type=text]')[0], 'fixed error');
          await submitForm(node, user);

          expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(1);

          // Fix the second field
          await user.clear(node.querySelectorAll('input[type=text]')[1]);
          await user.type(node.querySelectorAll('input[type=text]')[1], 'fixed error too');
          await submitForm(node, user);

          // No error remaining, shouldn't throw.
          await submitForm(node, user);

          expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);
        });

        it('should only clear the error of the field that changed inside an array item (#5197)', async () => {
          const altSchema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
              baz: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    qux: { type: 'string' },
                    corge: { type: 'string' },
                  },
                  required: ['qux', 'corge'],
                },
              },
            },
            required: ['foo', 'bar'],
          };

          const { container } = render(
            <AcceptingParent<Record<string, unknown>>
              schema={altSchema}
              initialValue={{ baz: [{}] }}
              noHtml5Validate
            />,
          );
          const node = container.firstElementChild!;
          const shownErrors = () => Array.from(node.querySelectorAll('.error-detail')).map((e) => e.textContent);

          await submitForm(node, user);
          expect(shownErrors()).toEqual([
            "must have required property 'foo'",
            "must have required property 'bar'",
            "must have required property 'qux'",
            "must have required property 'corge'",
          ]);

          // A top-level field clears only itself, which already worked
          await user.type(node.querySelector('#root_foo')!, 'a');
          expect(shownErrors()).toEqual([
            "must have required property 'bar'",
            "must have required property 'qux'",
            "must have required property 'corge'",
          ]);

          // and so should a field inside an array item
          await user.type(node.querySelector('#root_baz_0_qux')!, 'a');
          expect(shownErrors()).toEqual(["must have required property 'bar'", "must have required property 'corge'"]);
        });

        // A field named with a dot looks its errors up by name while `toErrorSchema` nests them by path, so they never
        // reach the field's own markup; the `ErrorListTemplate` is what gets handed the whole `errorSchema`. The form
        // renders it only while it has errors, which is why each test leaves one field's error standing.
        it('should clear the error of a field whose name contains a dot', async () => {
          const altSchema: RJSFSchema = {
            type: 'object',
            properties: {
              'foo.bar': { type: 'string' },
              baz: { type: 'string' },
            },
            required: ['foo.bar', 'baz'],
          };

          const { container } = render(
            <AcceptingParent<Record<string, unknown>>
              schema={altSchema}
              initialValue={{}}
              noHtml5Validate
              templates={{ ErrorListTemplate: ErrorSchemaOutput }}
            />,
          );
          const node = container.firstElementChild!;

          await submitForm(node, user);
          // `toErrorSchema` runs the property name through `toPath`, so the error of a name holding a dot lands at
          // the path that name spells out, not under the name itself
          expect(renderedErrorSchema()).toEqual({
            foo: { bar: { __errors: ["must have required property 'foo.bar'"] } },
            baz: { __errors: ["must have required property 'baz'"] },
          });

          await user.type(screen.getByLabelText(/^foo\.bar/), 'a');
          // Clearing has to reach the same place, and leave the field that was not touched alone
          expect(renderedErrorSchema()).toEqual({
            baz: { __errors: ["must have required property 'baz'"] },
          });
        });

        it('should only clear the error of the field that changed under a name containing a dot', async () => {
          const altSchema: RJSFSchema = {
            type: 'object',
            properties: {
              'has.dot': {
                type: 'object',
                properties: {
                  inner: { type: 'string' },
                  other: { type: 'string' },
                },
                required: ['inner', 'other'],
              },
            },
          };

          const { container } = render(
            <AcceptingParent<Record<string, unknown>>
              schema={altSchema}
              initialValue={{ 'has.dot': {} }}
              noHtml5Validate
              templates={{ ErrorListTemplate: ErrorSchemaOutput }}
            />,
          );
          const node = container.firstElementChild!;

          await submitForm(node, user);
          // The name is spelled out as a path here too, so the errors of the two fields it holds sit side by side
          // under it and clearing one has to leave the other where it is
          expect(renderedErrorSchema()).toEqual({
            has: {
              dot: {
                inner: { __errors: ["must have required property 'inner'"] },
                other: { __errors: ["must have required property 'other'"] },
              },
            },
          });

          await user.type(screen.getByLabelText(/^inner/), 'a');
          expect(renderedErrorSchema()).toEqual({
            has: {
              dot: {
                other: { __errors: ["must have required property 'other'"] },
              },
            },
          });
        });

        it('should clear the error of the container holding the field that changed', async () => {
          const altSchema: RJSFSchema = {
            type: 'object',
            properties: {
              tags: { type: 'array', uniqueItems: true, items: { type: 'string' } },
            },
          };

          const { container } = render(
            <AcceptingParent<Record<string, unknown>>
              schema={altSchema}
              initialValue={{ tags: ['a', 'a'] }}
              noHtml5Validate
            />,
          );
          const node = container.firstElementChild!;
          const shownErrors = () => Array.from(node.querySelectorAll('.error-detail')).map((e) => e.textContent);

          await submitForm(node, user);
          expect(shownErrors()).toEqual(['must NOT have duplicate items (items ## 1 and 0 are identical)']);

          // The error belongs to the array rather than to the item that was edited, and the array changed too
          await user.type(node.querySelectorAll('input[type=text]')[1], 'b');
          expect(shownErrors()).toEqual([]);
        });

        it('should keep the errors that a reorder of the array items left standing', async () => {
          const altSchema: RJSFSchema = {
            type: 'object',
            properties: {
              baz: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    qux: { type: 'string' },
                    corge: { type: 'string' },
                  },
                  required: ['qux', 'corge'],
                },
              },
            },
          };

          const { container } = render(
            <AcceptingParent<Record<string, unknown>>
              schema={altSchema}
              initialValue={{ baz: [{}, { corge: 'z' }] }}
              noHtml5Validate
            />,
          );
          const node = container.firstElementChild!;
          const shownErrors = () => Array.from(node.querySelectorAll('.error-detail')).map((e) => e.textContent);

          await submitForm(node, user);
          expect(shownErrors()).toEqual([
            "must have required property 'qux'",
            "must have required property 'corge'",
            "must have required property 'qux'",
          ]);

          // The errors follow the items they describe: the item lacking both moved down, and its two errors with it
          await user.click(node.querySelector<HTMLButtonElement>('.rjsf-array-item-move-down')!);
          expect(shownErrors()).toEqual([
            "must have required property 'qux'",
            "must have required property 'qux'",
            "must have required property 'corge'",
          ]);
        });
      });

      describe('Live validation', () => {
        it('should update the errorSchema when the formData changes', async () => {
          const { node, onChange } = createFormComponent({
            schema,
            liveValidate: 'onChange',
          });

          await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');

          expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
              errorSchema: {
                __errors: ['must NOT have fewer than 8 characters'],
              },
            }),
            'root',
          );
        });

        it('should denote the new error in the field', async () => {
          const { node } = createFormComponent({
            schema,
            liveValidate: 'onChange',
          });

          await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');

          expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(1);
          expect(node.querySelector('.rjsf-field-string .error-detail')).toHaveTextContent(
            'must NOT have fewer than 8 characters',
          );
        });
      });

      describe('Disable validation onChange event', () => {
        it('should not update errorSchema when the formData changes', async () => {
          const { node, onChange } = createFormComponent({
            schema,
            // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
            noValidate: true,
            liveValidate: 'onChange',
          });

          await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');

          expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ errorSchema: {} }), 'root');
        });
      });

      describe('Disable validation onSubmit event', () => {
        it('should not update errorSchema when the formData changes', async () => {
          const { node, onSubmit } = createFormComponent({
            schema,
            // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
            noValidate: true,
          });

          await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');
          await submitForm(node, user);

          expect(onSubmit).toHaveBeenLastCalledWith(
            expect.objectContaining({ errorSchema: {} }),
            expect.objectContaining({ type: 'submit' }),
          );
        });
      });
    });

    describe('on form submitted', () => {
      const schema: RJSFSchema = {
        type: 'string',
        minLength: 8,
      };

      it('should call the onError handler and focus on the error', async () => {
        const onError = vi.fn();
        const { node } = createFormComponent({
          schema,
          onError,
          focusOnFirstError: true,
        });

        const input = node.querySelector<HTMLInputElement>('input[type=text]')!;
        await user.type(input, 'short');
        const focusSpy = vi.fn();
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        // Set up AFTER user.type so typing works (focus spy would prevent element from receiving focus)
        Object.defineProperty(input, 'focus', {
          configurable: true,
          value: focusSpy,
        });
        await submitForm(node, user);

        expect(onError).toHaveBeenLastCalledWith(expect.any(Array));
        const callArg = vi.mocked(onError).mock.calls[0][0];
        expect(callArg.length).toBe(1);
        expect(callArg[0].message).toBe('must NOT have fewer than 8 characters');
        expect(focusSpy).toHaveBeenCalledTimes(1);
      });

      it('focuses the element carrying the field id ahead of a hidden input named after the field', async () => {
        // As a slider library renders its thumb, keeping the value in a hidden input named after the field
        const SliderWidget = ({ id }: WidgetProps) => (
          <>
            <div role='slider' tabIndex={0} id={id} aria-label='Value' aria-valuenow={0} />
            <input hidden name={id} readOnly value='' />
          </>
        );
        const { node } = createFormComponent({
          schema: { type: 'number', minimum: 5 },
          uiSchema: { 'ui:widget': 'SliderWidget' },
          widgets: { SliderWidget },
          initialFormData: 1,
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(screen.getByRole('slider')).toHaveFocus();
      });

      it('focuses the focusable element inside a wrapper carrying the field id that names no form control', async () => {
        // As a slider library renders its handle inside a root carrying the id, with no input named after the field
        const SliderWidget = ({ id }: WidgetProps) => (
          <div id={id}>
            <div role='slider' tabIndex={0} aria-label='Value' aria-valuenow={0} />
          </div>
        );
        const { node } = createFormComponent({
          schema: { type: 'number', minimum: 5 },
          uiSchema: { 'ui:widget': 'SliderWidget' },
          widgets: { SliderWidget },
          initialFormData: 1,
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(screen.getByRole('slider')).toHaveFocus();
      });

      it("focuses nothing inside an empty array's fieldset for its own minItems error", async () => {
        const { node } = createFormComponent({
          schema: { type: 'array', items: { type: 'string' }, minItems: 1 },
          initialFormData: [],
          focusOnFirstError: true,
        });

        // Submitting without clicking the button, which would take focus itself, so focus left in place stays on the body
        await submitForm(node, user, true);

        expect(screen.getByRole('button', { name: 'Add' })).not.toHaveFocus();
        expect(document.body).toHaveFocus();
      });

      it("focuses nothing inside an optional object's fieldset for its own minProperties error", async () => {
        const { node } = createFormComponent({
          schema: {
            type: 'object',
            properties: {
              pet: {
                type: 'object',
                minProperties: 2,
                properties: { name: { type: 'string' }, age: { type: 'number' } },
              },
            },
          },
          uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
          initialFormData: { pet: { name: 'Rex' } },
          focusOnFirstError: true,
        });

        // Submitting without clicking the button, which would take focus itself, so focus left in place stays on the body
        await submitForm(node, user, true);

        expect(node.querySelector('#root_pet__optionalRemove')).not.toHaveFocus();
        expect(document.body).toHaveFocus();
      });

      it("focuses a group's first focusable control ahead of the unfocusable inputs named after the field", async () => {
        // As a checkbox library renders each checkbox as a button, keeping its value in an input named after the field
        const ChecksWidget = ({ id }: WidgetProps) => (
          <div id={id} role='group' aria-label='Checks'>
            {['a', 'b'].map((value, index) => (
              <span key={value}>
                <button type='button' role='checkbox' aria-checked='false' id={`${id}-${index}`} aria-label={value} />
                <input type='checkbox' aria-hidden tabIndex={-1} name={id} value={value} readOnly />
              </span>
            ))}
          </div>
        );
        const { node } = createFormComponent({
          schema: { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, minItems: 1, uniqueItems: true },
          uiSchema: { 'ui:widget': 'ChecksWidget' },
          widgets: { ChecksWidget },
          initialFormData: [],
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(screen.getByRole('checkbox', { name: 'a' })).toHaveFocus();
      });

      it('passes over a hidden input, a disabled control and a link with no href inside a wrapper carrying the field id', async () => {
        // Each reports a tabIndex of 0 yet can't take focus
        const SliderWidget = ({ id }: WidgetProps) => (
          <div id={id}>
            <input type='hidden' name='slider-value' value='' />
            <button type='button' disabled>
              Reset
            </button>
            {/* oxlint-disable-next-line jsx-a11y/anchor-is-valid -- a link with no href is what the lookup passes over */}
            <a>Help</a>
            <div role='slider' tabIndex={0} aria-label='Value' aria-valuenow={0} />
          </div>
        );
        const { node } = createFormComponent({
          schema: { type: 'number', minimum: 5 },
          uiSchema: { 'ui:widget': 'SliderWidget' },
          widgets: { SliderWidget },
          initialFormData: 1,
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(screen.getByRole('slider')).toHaveFocus();
      });

      it('passes over an input named after the field that the hidden attribute hides', async () => {
        // As zag's slider, under Ark and Chakra, keeps its value in a text input with the `hidden` attribute
        const SliderWidget = ({ id }: WidgetProps) => (
          <div id={id}>
            <input type='text' hidden name={id} readOnly value='' />
            <div role='slider' tabIndex={0} aria-label='Value' aria-valuenow={0} />
          </div>
        );
        const { node } = createFormComponent({
          schema: { type: 'number', minimum: 5 },
          uiSchema: { 'ui:widget': 'SliderWidget' },
          widgets: { SliderWidget },
          initialFormData: 1,
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(screen.getByRole('slider')).toHaveFocus();
      });

      it("focuses the first star of a RatingWidget's radiogroup", async () => {
        const { node } = createFormComponent({
          schema: { type: 'integer', minimum: 3, maximum: 5 },
          uiSchema: { 'ui:widget': 'RatingWidget' },
          initialFormData: 1,
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(screen.getAllByRole('radio')[0]).toHaveFocus();
      });

      it.each(['alt-date', 'alt-datetime'])("focuses the first part of an %s's group", async (widget) => {
        const { node } = createFormComponent({
          schema: { type: 'string', minLength: 100 },
          uiSchema: { 'ui:widget': widget },
          initialFormData: '2020-01-01',
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(screen.getAllByRole('combobox')[0]).toHaveFocus();
      });

      it('passes over an unfocusable input whose id starts with the field id for a focusable one after it', async () => {
        const ChoiceWidget = ({ id }: WidgetProps) => (
          <div>
            <input type='hidden' id={`${id}-value`} value='' />
            <button type='button' id={`${id}-0`}>
              Choose
            </button>
          </div>
        );
        const { node } = createFormComponent({
          schema: { type: 'number', minimum: 5 },
          uiSchema: { 'ui:widget': 'ChoiceWidget' },
          widgets: { ChoiceWidget },
          initialFormData: 1,
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(screen.getByRole('button', { name: 'Choose' })).toHaveFocus();
      });

      it.each([
        ['disabled', { 'ui:disabled': true }],
        ['hidden', { 'ui:widget': 'hidden' }],
      ])(
        'leaves focus off a sibling whose id starts with the id of a %s field it cannot focus',
        async (_, nameUiSchema) => {
          const { node } = createFormComponent({
            schema: {
              type: 'object',
              required: ['name'],
              properties: { name: { type: 'string' }, nameSuffix: { type: 'string' } },
            },
            uiSchema: { name: nameUiSchema },
            focusOnFirstError: true,
          });

          await submitForm(node, user);

          expect(node.querySelector('#root_nameSuffix')).not.toHaveFocus();
        },
      );

      it('focuses the field in a DOM with no CSS namespace', async () => {
        vi.stubGlobal('CSS', undefined);
        try {
          const { node } = createFormComponent({
            schema: { type: 'string', minLength: 5 },
            initialFormData: 'a',
            focusOnFirstError: true,
          });

          await submitForm(node, user);

          expect(node.querySelector('#root')).toHaveFocus();
        } finally {
          vi.unstubAllGlobals();
        }
      });

      it('focuses the field whose property name holds characters a CSS selector would read as syntax', async () => {
        const { node } = createFormComponent({
          schema: { type: 'object', properties: { 'say "hi"\\': { type: 'string', minLength: 5 } } },
          initialFormData: { 'say "hi"\\': 'a' },
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(screen.getByRole('textbox')).toHaveFocus();
      });

      it('should call the onError handler and call the provided focusOnFirstError callback function', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(noop);
        const onError = vi.fn();

        const focusCallback = () => {
          // oxlint-disable-next-line no-console
          console.log('focusCallback called');
        };

        const focusOnFirstError = vi.fn(focusCallback);
        const { node } = createFormComponent({
          schema,
          onError,
          focusOnFirstError,
        });

        const input = node.querySelector<HTMLInputElement>('input[type=text]')!;
        await user.type(input, 'short');
        const focusSpy = vi.fn();
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        // Set up AFTER user.type so typing works (focus spy would prevent element from receiving focus)
        Object.defineProperty(input, 'focus', {
          configurable: true,
          value: focusSpy,
        });
        await submitForm(node, user);

        expect(onError).toHaveBeenLastCalledWith(expect.any(Array));
        const callArg = vi.mocked(onError).mock.calls[0][0];
        expect(callArg.length).toBe(1);
        expect(callArg[0].message).toBe('must NOT have fewer than 8 characters');

        expect(focusSpy).not.toHaveBeenCalled();
        expect(focusOnFirstError).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith('focusCallback called');
        consoleLogSpy.mockRestore();
      });

      it('should call the onError handler and call the provided focusOnFirstError callback function', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(noop);
        const onError = vi.fn();

        const focusCallback = () => {
          // oxlint-disable-next-line no-console
          console.log('focusCallback called');
        };
        const extraErrors = {
          __errors: ['foo'],
        } as ErrorSchema;

        const focusOnFirstError = vi.fn(focusCallback);
        const { node } = createFormComponent({
          schema,
          onError,
          focusOnFirstError,
          extraErrors,
          extraErrorsAreWarnings: false,
        });

        const input = node.querySelector<HTMLInputElement>('input[type=text]')!;
        await user.type(input, 'valid string');
        const focusSpy = vi.fn();
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        // Set up AFTER user.type so typing works (focus spy would prevent element from receiving focus)
        Object.defineProperty(input, 'focus', {
          configurable: true,
          value: focusSpy,
        });
        await submitForm(node, user);

        expect(onError).toHaveBeenLastCalledWith(expect.any(Array));
        const callArg = vi.mocked(onError).mock.calls[0][0];
        expect(callArg.length).toBe(1);
        expect(callArg[0].message).toBe('foo');

        expect(focusSpy).not.toHaveBeenCalled();
        expect(focusOnFirstError).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith('focusCallback called');
        consoleLogSpy.mockRestore();
      });

      it('should reset errors and errorSchema state to initial state after correction and resubmission', async () => {
        const { node, onError, onSubmit } = createFormComponent({
          schema,
        });

        await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');
        await submitForm(node, user);

        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must NOT have fewer than 8 characters',
            name: 'minLength',
            params: { limit: 8 },
            property: '',
            schemaPath: '#/minLength',
            stack: 'must NOT have fewer than 8 characters',
            title: '',
          },
        ]);
        expect(onError).toHaveBeenCalledTimes(1);
        onError.mockClear();

        await user.clear(node.querySelector<HTMLInputElement>('input[type=text]')!);
        await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'long enough');
        await submitForm(node, user);
        expect(onError).not.toHaveBeenCalled();
        expect(onSubmit).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errors: [],
            errorSchema: {},
          }),
          expect.objectContaining({ type: 'submit' }),
        );
      });

      it('should reset errors from UI after correction and resubmission', async () => {
        const { node } = createFormComponent({
          schema,
        });

        await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');
        await submitForm(node, user);

        const errorListHTML = '<li class="text-danger">must NOT have fewer than 8 characters</li>';
        const errors = node.querySelectorAll('.error-detail');
        // Check for errors attached to the field
        expect(errors).toHaveLength(1);
        expect(errors[0].innerHTML).toEqual(errorListHTML);

        await user.clear(node.querySelector<HTMLInputElement>('input[type=text]')!);
        await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'long enough');
        await submitForm(node, user);
        expect(node.querySelectorAll('.error-detail')).toHaveLength(0);
      });
    });

    describe('root level, live validation', () => {
      const formProps: Omit<FormProps, 'validator'> = {
        liveValidate: 'onChange',
        schema: {
          type: 'string',
          minLength: 8,
        },
        initialFormData: 'short',
      };

      it('should reflect the contextualized error in state', async () => {
        const { node, onError } = createFormComponent(formProps);
        await submitForm(node, user);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must NOT have fewer than 8 characters',
            name: 'minLength',
            params: { limit: 8 },
            property: '',
            schemaPath: '#/minLength',
            stack: 'must NOT have fewer than 8 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the field', async () => {
        const { node } = createFormComponent(formProps);

        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);

        await user.clear(node.querySelector<HTMLInputElement>('input')!);
        await user.type(node.querySelector<HTMLInputElement>('input')!, 'shorts');

        expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(1);
        expect(node.querySelector('.rjsf-field-string .error-detail')).toHaveTextContent(
          'must NOT have fewer than 8 characters',
        );
      });
    });

    describe('root level with multiple errors, live validation', () => {
      const formProps: Omit<FormProps, 'validator'> = {
        liveValidate: 'onChange',
        schema: {
          type: 'string',
          minLength: 8,
          pattern: 'd+',
        },
        initialFormData: 'short',
      };

      it('should reflect the contextualized error in state', async () => {
        const { node, onError } = createFormComponent(formProps);
        await submitForm(node, user);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must NOT have fewer than 8 characters',
            name: 'minLength',
            params: { limit: 8 },
            property: '',
            schemaPath: '#/minLength',
            stack: 'must NOT have fewer than 8 characters',
            title: '',
          },
          {
            message: 'must match pattern "d+"',
            name: 'pattern',
            params: { pattern: 'd+' },
            property: '',
            schemaPath: '#/pattern',
            stack: 'must match pattern "d+"',
            title: '',
          },
        ]);
      });

      it('should denote the error in the field', async () => {
        const { node } = createFormComponent(formProps);

        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);

        await user.clear(node.querySelector<HTMLInputElement>('input')!);
        await user.type(node.querySelector<HTMLInputElement>('input')!, 'shorts');
        const liNodes = node.querySelectorAll('.rjsf-field-string .error-detail li');
        const errors = [].map.call(liNodes, (li: Element) => li.textContent);

        expect(errors).toEqual(['must NOT have fewer than 8 characters', 'must match pattern "d+"']);
      });
    });

    describe('nested field level, live validation', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'string',
                minLength: 8,
              },
            },
          },
        },
      };

      const formProps: Omit<FormProps, 'validator'> = {
        schema,
        liveValidate: 'onChange',
        initialFormData: {
          level1: {
            level2: 'short',
          },
        },
      };

      it('should reflect the contextualized error in state', async () => {
        const { node, onError } = createFormComponent(formProps);

        await submitForm(node, user);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must NOT have fewer than 8 characters',
            name: 'minLength',
            params: { limit: 8 },
            property: '.level1.level2',
            schemaPath: '#/properties/level1/properties/level2/minLength',
            stack: '.level1.level2 must NOT have fewer than 8 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the field', async () => {
        const { node } = createFormComponent(formProps);
        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);

        await user.clear(node.querySelector<HTMLInputElement>('input')!);
        await user.type(node.querySelector<HTMLInputElement>('input')!, 'shorts');
        const errorDetail = node.querySelector('.rjsf-field-object .rjsf-field-string .error-detail');

        expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(1);
        expect(errorDetail).toHaveTextContent('must NOT have fewer than 8 characters');
      });
    });

    describe('array indices, live validation', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          minLength: 4,
        },
      };

      const formProps: Omit<FormProps, 'validator'> = {
        schema,
        liveValidate: 'onChange',
        initialFormData: ['good', 'ba', 'good'],
      };

      it('should contextualize the error for array indices', async () => {
        const { node, onError } = createFormComponent(formProps);

        await submitForm(node, user);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.1',
            schemaPath: '#/items/minLength',
            stack: '.1 must NOT have fewer than 4 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the item field in error', async () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.rjsf-field-string');

        // live validate does not run on initial render anymore
        expect(fieldNodes[1].classList.contains('rjsf-field-error')).toBe(false);

        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        await user.clear(fieldNodes[1].querySelector('input')!);
        await user.type(fieldNodes[1].querySelector('input')!, 'bad');

        const liNodes = fieldNodes[1].querySelectorAll(':scope .error-detail li');
        const errors = [].map.call(liNodes, (li: Element) => li.textContent);

        expect(errors).toEqual(['must NOT have fewer than 4 characters']);
      });

      it('should not denote errors on non impacted fields', () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.rjsf-field-string');

        expect(fieldNodes[0].classList.contains('rjsf-field-error')).toBe(false);
        expect(fieldNodes[2].classList.contains('rjsf-field-error')).toBe(false);
      });
    });

    describe('nested array indices, live validation', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          level1: {
            type: 'array',
            items: {
              type: 'string',
              minLength: 4,
            },
          },
        },
      };

      const formProps: Omit<FormProps, 'validator'> = { schema, liveValidate: 'onChange' };

      it('should contextualize the error for nested array indices', async () => {
        const { node, onError } = createFormComponent({
          ...formProps,
          initialFormData: {
            level1: ['good', 'bad', 'good', 'bad'],
          },
        });
        await submitForm(node, user);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.level1.1',
            schemaPath: '#/properties/level1/items/minLength',
            stack: '.level1.1 must NOT have fewer than 4 characters',
            title: '',
          },
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.level1.3',
            schemaPath: '#/properties/level1/items/minLength',
            stack: '.level1.3 must NOT have fewer than 4 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the nested item field in error', async () => {
        const { node } = createFormComponent({
          ...formProps,
          initialFormData: {
            level1: ['good', 'ba', 'good'],
          },
        });

        const fields = node.querySelectorAll('.rjsf-field-string');
        let liNodes = node.querySelectorAll('.rjsf-field-string .error-detail li');
        let errors = [].map.call(liNodes, (li: Element) => li.textContent);

        // live validate does not run on initial render anymore
        expect(errors).toEqual([]);

        await user.clear(fields[1].querySelector('input')!);
        await user.type(fields[1].querySelector('input')!, 'bad');

        liNodes = node.querySelectorAll('.rjsf-field-string .error-detail li');
        errors = [].map.call(liNodes, (li: Element) => li.textContent);
        expect(errors).toEqual(['must NOT have fewer than 4 characters']);
      });
    });

    describe('nested arrays, live validation', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          outer: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'string',
                minLength: 4,
              },
            },
          },
        },
      };

      const formData = {
        outer: [
          ['good', 'bad'],
          ['bad', 'good'],
        ],
      };

      const formProps: Omit<FormProps, 'validator'> = { schema, initialFormData: formData, liveValidate: 'onChange' };

      it('should contextualize the error for nested array indices, focusing on first error', async () => {
        const { node, onError } = createFormComponent({
          ...formProps,
          focusOnFirstError: true,
        });

        const focusSpy = vi.fn();
        const input = node.querySelector<HTMLInputElement>('input[id=root_outer_0_1]')!;
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        Object.defineProperty(input, 'focus', {
          configurable: true,
          value: focusSpy,
        });

        await submitForm(node, user);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.outer.0.1',
            schemaPath: '#/properties/outer/items/items/minLength',
            stack: '.outer.0.1 must NOT have fewer than 4 characters',
            title: '',
          },
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.outer.1.0',
            schemaPath: '#/properties/outer/items/items/minLength',
            stack: '.outer.1.0 must NOT have fewer than 4 characters',
            title: '',
          },
        ]);
        expect(focusSpy).toHaveBeenCalledTimes(1);
      });

      it('should denote the error in the nested item field in error', async () => {
        const { node } = createFormComponent(formProps);

        const fields = node.querySelectorAll('.rjsf-field-string');
        let errors = [].map.call(fields, (field: Element) => {
          const li = field.querySelector('.error-detail li');
          return li && li.textContent;
        });

        // live validate does not run on initial render anymore
        expect(errors).toEqual([null, null, null, null]);

        await user.clear(fields[0].querySelector('input')!);
        await user.type(fields[0].querySelector('input')!, 'bad');
        errors = [].map.call(fields, (field: Element) => {
          const li = field.querySelector('.error-detail li');
          return li && li.textContent;
        });

        expect(errors).toEqual([
          'must NOT have fewer than 4 characters',
          'must NOT have fewer than 4 characters',
          'must NOT have fewer than 4 characters',
          null,
        ]);
      });
    });

    describe('array nested items, live validation', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
              minLength: 4,
            },
          },
        },
      };

      const formProps: Omit<FormProps, 'validator'> = {
        schema,
        liveValidate: 'onChange',
        initialFormData: [{ foo: 'good' }, { foo: 'ba' }, { foo: 'good' }],
      };

      it('should contextualize the error for array nested items', async () => {
        const { node, onError } = createFormComponent(formProps);

        await submitForm(node, user);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.1.foo',
            schemaPath: '#/items/properties/foo/minLength',
            stack: '.1.foo must NOT have fewer than 4 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the array nested item', async () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.rjsf-field-string');

        // Initial render no longer does live validation
        expect(fieldNodes[1].classList.contains('rjsf-field-error')).toBe(false);
        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        await user.clear(fieldNodes[1].querySelector('input')!);
        await user.type(fieldNodes[1].querySelector('input')!, 'bad');

        const liNodes = fieldNodes[1].querySelectorAll('.error-detail li');
        const errors = [].map.call(liNodes, (li: Element) => li.textContent);
        expect(fieldNodes[1].classList.contains('rjsf-field-error')).toEqual(true);
        expect(errors).toEqual(['must NOT have fewer than 4 characters']);
      });
    });

    describe('schema dependencies, live validation', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          branch: {
            type: 'number',
            enum: [1, 2, 3],
            default: 1,
          },
        },
        required: ['branch'],
        dependencies: {
          branch: {
            oneOf: [
              {
                properties: {
                  branch: {
                    enum: [1],
                  },
                  field1: {
                    type: 'number',
                  },
                },
                required: ['field1'],
              },
              {
                properties: {
                  branch: {
                    enum: [2],
                  },
                  field1: {
                    type: 'number',
                  },
                  field2: {
                    type: 'number',
                  },
                },
                required: ['field1', 'field2'],
              },
            ],
          },
        },
      };

      it('should only show error for property in selected branch', async () => {
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: 'onChange',
        });

        const input = node.querySelector<HTMLInputElement>('input[inputmode=decimal]');
        expect(input).toBeInTheDocument();
        await user.type(input!, '0');
        await user.clear(input!);

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errorSchema: { field1: { __errors: ["must have required property 'field1'"] } },
          }),
          'root_field1',
        );
      });

      it('should only show errors for properties in selected branch', async () => {
        const { node, onChange } = createFormComponent({
          ref: createRef(),
          schema,
          liveValidate: 'onChange',
          initialFormData: { branch: 2 },
        });

        await user.type(node.querySelectorAll<HTMLInputElement>('input[inputmode=decimal]')[0], '0');

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errorSchema: {
              field2: {
                __errors: ["must have required property 'field2'"],
              },
            },
          }),
          'root_field1',
        );
      });

      it('should not show any errors when branch is empty', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
        const { node, onChange } = createFormComponent({
          ref: createRef(),
          schema,
          liveValidate: 'onChange',
          initialFormData: { branch: 3 },
        });

        await user.selectOptions(node.querySelector('select')!, '3'); // Select by label/text since selectOptions matches text before value attribute

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errorSchema: {},
          }),
          'root_branch',
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          `ignoring oneOf in dependencies of "branch" because there isn't exactly one subschema that is valid`,
        );
        consoleWarnSpy.mockRestore();
      });

      it('should sanitize stale enum data and persist the retrieved dependency schema', async () => {
        const dependentEnumSchema: RJSFSchema = {
          type: 'object',
          properties: {
            animal: {
              type: 'string',
              enum: ['Cat', 'Fish'],
            },
          },
          dependencies: {
            animal: {
              oneOf: [
                {
                  properties: {
                    animal: {
                      enum: ['Cat'],
                    },
                    food: {
                      type: 'string',
                      enum: ['meat'],
                    },
                  },
                },
                {
                  properties: {
                    animal: {
                      enum: ['Fish'],
                    },
                    food: {
                      type: 'string',
                      enum: ['worms'],
                    },
                    water: {
                      type: 'string',
                      enum: ['lake'],
                    },
                  },
                },
              ],
            },
          },
        };
        const { node, onChange } = createFormComponent({
          schema: dependentEnumSchema,
          initialFormData: { animal: 'Fish', food: 'worms', water: 'lake' },
        });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_animal')!, '0');

        expectToHaveBeenCalledWithFormData(onChange, { animal: 'Cat', food: 'meat', water: undefined }, 'root_animal');
        // The resolved schema the fields render from has moved to the Cat branch: `food` offers only that branch's
        // options and `water`, which only the Fish branch declares, is gone
        const foodOptions = () =>
          Array.from(node.querySelectorAll<HTMLOptionElement>('#root_food option'), (option) => option.textContent);
        expect(foodOptions()).toContain('meat');
        expect(foodOptions()).not.toContain('worms');
        expect(node.querySelector('#root_water')).toBeNull();

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_food')!, '0');
        expect(node.querySelector('#root_water')).toBeNull();
      });

      it('should sanitize stale enum data for a dependency nested inside an object (#5250)', async () => {
        const nestedDependentEnumSchema: RJSFSchema = {
          type: 'object',
          properties: {
            m: {
              type: 'object',
              properties: {
                animal: {
                  type: 'string',
                  enum: ['Cat', 'Fish'],
                },
              },
              dependencies: {
                animal: {
                  oneOf: [
                    {
                      properties: {
                        animal: { enum: ['Cat'] },
                        food: { type: 'string', enum: ['meat'] },
                      },
                    },
                    {
                      properties: {
                        animal: { enum: ['Fish'] },
                        food: { type: 'string', enum: ['worms'] },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        const { node, onChange } = createFormComponent({
          schema: nestedDependentEnumSchema,
          initialFormData: { m: { animal: 'Fish', food: 'worms' } },
        });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_m_animal')!, '0');

        expectToHaveBeenCalledWithFormData(onChange, { m: { animal: 'Cat', food: 'meat' } }, 'root_m_animal');
      });

      it('should sanitize stale enum data for a dependency nested behind a $ref (#5250)', async () => {
        const refDependentEnumSchema: RJSFSchema = {
          type: 'object',
          definitions: {
            Animal: {
              type: 'object',
              properties: {
                animal: {
                  type: 'string',
                  enum: ['Cat', 'Fish'],
                },
              },
              dependencies: {
                animal: {
                  oneOf: [
                    {
                      properties: {
                        animal: { enum: ['Cat'] },
                        food: { type: 'string', enum: ['meat'] },
                      },
                    },
                    {
                      properties: {
                        animal: { enum: ['Fish'] },
                        food: { type: 'string', enum: ['worms'] },
                      },
                    },
                  ],
                },
              },
            },
          },
          properties: {
            m: { $ref: '#/definitions/Animal' },
          },
        };
        const { node, onChange } = createFormComponent({
          schema: refDependentEnumSchema,
          initialFormData: { m: { animal: 'Fish', food: 'worms' } },
        });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_m_animal')!, '0');

        expectToHaveBeenCalledWithFormData(onChange, { m: { animal: 'Cat', food: 'meat' } }, 'root_m_animal');
      });

      it('should keep the empty minItems placeholders of a scalar enum array on an unrelated edit (#5451)', async () => {
        const conditionalSiblingSchema: RJSFSchema = {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              minItems: 2,
              items: { type: 'string', enum: ['a', 'b'] },
            },
            pick: { type: 'string', enum: ['x', 'y'] },
          },
          allOf: [
            {
              if: { properties: { pick: { const: 'y' } }, required: ['pick'] },
              then: { properties: { extra: { type: 'string' } } },
            },
          ],
        };
        const { node, onChange } = createFormComponent({
          schema: conditionalSiblingSchema,
          initialFormData: { list: [null, null] },
        });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_pick')!, '0');

        expectToHaveBeenCalledWithFormData(onChange, { list: [null, null], pick: 'x' }, 'root_pick');
      });

      it('should sanitize what an array write flips', async () => {
        // Adding a row flips the `then` onto `color`, so the write's own sanitize judges `color` against it
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            pet: {
              type: 'object',
              properties: {
                list: { type: 'array', items: { type: 'string' } },
                color: { type: 'string', enum: ['r', 'g'] },
              },
              allOf: [
                {
                  if: { properties: { list: { minItems: 2 } }, required: ['list'] },
                  then: { properties: { color: { type: 'string', enum: ['r'] } } },
                },
              ],
            },
            name: { type: 'string' },
          },
        };
        const { node, getFormData } = createFormComponent({
          schema,
          initialFormData: { pet: { color: 'g', list: ['x'] } },
        });

        await user.click(node.querySelector<HTMLButtonElement>('button[title="Add"]')!);

        expect(getFormData()).toEqual({ pet: { color: 'r', list: ['x', undefined] } });
      });

      it('should keep prior data available when only the validator instance changed', async () => {
        // Rebuilding the schema utilities from an inline prop changes no field's constraints, so the placeholders the
        // unchanged enum rejects survive the next edit
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            list: { type: 'array', minItems: 2, items: { type: 'string', enum: ['a'] } },
            name: { type: 'string' },
          },
          allOf: [
            {
              if: { properties: { name: { const: 'z' } }, required: ['name'] },
              then: { properties: { extra: { type: 'string' } } },
            },
          ],
        };
        const { node, rerender, getFormData } = createFormComponent({
          schema,
          initialFormData: { list: [null, null] },
        });

        rerender({ schema }, customizeValidator({}));
        await user.type(node.querySelector<HTMLInputElement>('#root_name')!, 'n');

        expect(getFormData()).toEqual({ list: [null, null], name: 'n' });
      });

      const placeholdersSchema: RJSFSchema = {
        type: 'object',
        properties: {
          list: {
            type: 'array',
            minItems: 2,
            items: { type: 'string', enum: ['a'] },
          },
          name: { type: 'string' },
        },
        allOf: [
          {
            if: { properties: { name: { const: 'z' } }, required: ['name'] },
            then: { properties: { extra: { type: 'string' } } },
          },
        ],
      };

      it('should keep placeholders through two sibling keystrokes', async () => {
        const { node, getFormData } = createFormComponent({
          schema: placeholdersSchema,
          initialFormData: { list: [null, null] },
        });

        await user.type(node.querySelector<HTMLInputElement>('#root_name')!, 'nm');

        expect(getFormData()).toEqual({ list: [null, null], name: 'nm' });
      });

      it('should keep placeholders through an array write and a sibling edit', async () => {
        const { node, getFormData } = createFormComponent({
          schema: placeholdersSchema,
          initialFormData: { list: [null, null] },
        });

        // The array write changes nothing a conditional reads, so no field's constraints change
        await user.click(node.querySelector<HTMLButtonElement>('button[title="Add"]')!);
        await user.type(node.querySelector<HTMLInputElement>('#root_name')!, 'n');

        expect(getFormData()).toEqual({ list: [null, null, undefined], name: 'n' });
      });

      it('should keep placeholders through a reset and a sibling edit', async () => {
        const formRef = createFormRef();
        const { node, getFormData } = createFormComponent({
          ref: formRef,
          schema: placeholdersSchema,
          initialFormData: { list: [null, null] },
        });

        act(() => {
          formRef.current!.reset();
        });
        await user.type(node.querySelector<HTMLInputElement>('#root_name')!, 'n');

        expect(getFormData()).toEqual({ list: [null, null], name: 'n' });
      });

      /** The branch payload every #5349 case below swaps between, declared on the nested object's own property */
      const dietFor = (food: string): RJSFSchema => ({
        type: 'object',
        default: { food },
        properties: { food: { type: 'string' } },
      });

      // The root retrieved schema is the same object either side of this swap, since `retrieveSchema()` resolves only
      // the conditionals declared on the schema it is given, so the swapped subschema is only reachable by walking in
      it("should apply a nested dependency's new branch defaults over the old branch's (#5349)", async () => {
        const nestedDependentDefaultSchema: RJSFSchema = {
          type: 'object',
          properties: {
            keep: { type: 'string', default: 'untouched' },
            m: {
              type: 'object',
              properties: { animal: { type: 'string', enum: ['Cat', 'Fish'], default: 'Fish' } },
              dependencies: {
                animal: {
                  oneOf: [
                    { properties: { animal: { const: 'Cat' }, diet: dietFor('meat') } },
                    { properties: { animal: { const: 'Fish' }, diet: dietFor('worms') } },
                  ],
                },
              },
            },
          },
        };
        const { node, onChange } = createFormComponent({ schema: nestedDependentDefaultSchema });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_m_animal')!, 'Cat');

        expectToHaveBeenCalledWithFormData(
          onChange,
          { keep: 'untouched', m: { animal: 'Cat', diet: { food: 'meat' } } },
          'root_m_animal',
        );
      });

      // Live validation runs against the `retrievedSchema` the derivation commits. The key's declaration lives in a
      // dependency keyed on its presence, and the replacement is written in place, so the schema committed still
      // declares the key and validates the value written for it
      it('validates a replaced key against a schema that still declares it (#5349)', async () => {
        const cfgMin = (name: string, minLength?: number): RJSFSchema => ({
          type: 'object',
          default: { name },
          properties: { name: { type: 'string', ...(minLength !== undefined && { minLength }) } },
        });
        const withCfg = (name: string, minLength?: number): RJSFSchema => ({
          dependencies: { cfg: { properties: { cfg: cfgMin(name, minLength) } } },
        });
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'object',
            properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' } },
            if: { properties: { mode: { const: 'a' } } },
            then: withCfg('a'),
            else: withCfg('b', 5),
          },
          initialFormData: { mode: 'a', cfg: { name: 'a' } },
          liveValidate: 'onChange',
        });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_mode')!, 'b');

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            formData: { mode: 'b', cfg: { name: 'b' } },
            errors: [expect.objectContaining({ message: 'must NOT have fewer than 5 characters' })],
          }),
          'root_mode',
        );
      });

      // One level deeper again. `outer` resolves to the same schema on both sides, since the conditional that swapped
      // is declared on `m`, so only descending the changed path whether or not it resolved differently reaches it
      it("should apply a new branch's defaults for a dependency two object levels down (#5349)", async () => {
        const twiceNestedSchema: RJSFSchema = {
          type: 'object',
          properties: {
            outer: {
              type: 'object',
              properties: {
                m: {
                  type: 'object',
                  properties: { animal: { type: 'string', enum: ['Cat', 'Fish'], default: 'Fish' } },
                  dependencies: {
                    animal: {
                      oneOf: [
                        { properties: { animal: { const: 'Cat' }, diet: dietFor('meat') } },
                        { properties: { animal: { const: 'Fish' }, diet: dietFor('worms') } },
                      ],
                    },
                  },
                },
              },
            },
          },
        };
        const { node, onChange } = createFormComponent({ schema: twiceNestedSchema });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_outer_m_animal')!, 'Cat');

        expectToHaveBeenCalledWithFormData(
          onChange,
          { outer: { m: { animal: 'Cat', diet: { food: 'meat' } } } },
          'root_outer_m_animal',
        );
      });

      it("should apply a new branch's defaults for a dependency nested behind a $ref (#5349)", async () => {
        const refDependentDefaultSchema: RJSFSchema = {
          type: 'object',
          definitions: {
            Animal: {
              type: 'object',
              properties: { animal: { type: 'string', enum: ['Cat', 'Fish'], default: 'Fish' } },
              dependencies: {
                animal: {
                  oneOf: [
                    { properties: { animal: { const: 'Cat' }, diet: dietFor('meat') } },
                    { properties: { animal: { const: 'Fish' }, diet: dietFor('worms') } },
                  ],
                },
              },
            },
          },
          properties: { m: { $ref: '#/definitions/Animal' } },
        };
        const { node, onChange } = createFormComponent({ schema: refDependentDefaultSchema });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_m_animal')!, 'Cat');

        expectToHaveBeenCalledWithFormData(onChange, { m: { animal: 'Cat', diet: { food: 'meat' } } }, 'root_m_animal');
      });
    });

    describe('customValidate errors, live validation', () => {
      it('customValidate should raise an error when End is larger than Start field.', async () => {
        const schema: RJSFSchema = {
          required: ['Start', 'End'],
          properties: {
            Start: {
              type: 'number',
            },
            End: {
              type: 'number',
            },
          },
          type: 'object',
        };

        // customValidate method to raise an error when Start is larger than End field.
        interface StartEnd {
          Start?: number;
          End?: number;
        }
        const customValidate = (formData: unknown, errors: FormValidation<StartEnd>) => {
          const { Start, End } = (formData ?? {}) as StartEnd;
          if (Start !== undefined && End !== undefined && Start > End) {
            errors.Start?.addError('Validate error: Test should be LE than End');
          }
          return errors;
        };

        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: 'onChange',
          initialFormData: { Start: 2, End: 0 },
          customValidate,
        });

        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('#root_Start__error')).toHaveLength(0);

        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        const endInput = node.querySelector<HTMLInputElement>('#root_End')!;
        await user.clear(endInput);
        await user.type(endInput, '1');
        expect(node.querySelectorAll('#root_Start__error')).toHaveLength(1);
        let errorMessageContent = node.querySelector('#root_Start__error .text-danger');
        expect(errorMessageContent).toHaveTextContent('Validate error: Test should be LE than End');

        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        await user.clear(endInput);
        await user.type(endInput, '3');

        expect(node.querySelectorAll('#root_Start__error')).toHaveLength(0);
        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errors: [],
          }),
          'root_End',
        );

        // Change the End field to a lesser value than Start field to raise customValidate errors.
        await user.clear(endInput);
        await user.type(endInput, '0');

        expect(node.querySelectorAll('#root_Start__error')).toHaveLength(1);
        errorMessageContent = node.querySelector('#root_Start__error .text-danger');
        expect(errorMessageContent).toHaveTextContent('Validate error: Test should be LE than End');
        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errorSchema: expect.objectContaining({
              Start: {
                __errors: ['Validate error: Test should be LE than End'],
              },
            }),
          }),
          'root_End',
        );
      });
    });
    describe('validationDataMerge no-op when getUiRequiredErrorSchema finds nothing', () => {
      it('does not discard a message-less validator error merged with an empty ui:required result', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string' } },
        };
        // Strips the message from AJV's own error so toErrorSchema() (which only adds entries with a truthy
        // `message`) produces an empty `errorSchema`, while `errors` (the flat list) still carries the entry. With no
        // ui:required anywhere in the uiSchema, getUiRequiredErrorSchema() also returns `{}` — an empty-but-truthy
        // object that must not be treated the same as "nothing to merge".
        const transformErrors = (errors: RJSFValidationError[]) => errors.map((error) => ({ ...error, message: '' }));
        const { node, onError } = createFormComponent({ schema, initialFormData: {}, transformErrors });
        await submitForm(node, user, true);
        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[0][0]).toHaveLength(1);
      });
    });

    describe('extraErrors identical to a validator error', () => {
      const message = 'must NOT have fewer than 3 characters';
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          addr: { type: 'object', properties: { street: { type: 'string', minLength: 3 } } },
        },
      };
      const extraErrors: ErrorSchema = { addr: { street: { __errors: [message] } } };

      it.each([undefined, true])(
        'lists the message once in the top ErrorList, on the field and to onError after submit, with extraErrorsAreWarnings %s',
        async (extraErrorsAreWarnings) => {
          const { node, onError } = createFormComponent({ schema, extraErrors, extraErrorsAreWarnings });

          await user.type(node.querySelector<HTMLInputElement>('input')!, 'a');
          await submitForm(node, user);

          expect(fieldErrorsById(node)).toEqual({ root_addr_street: [message] });
          expect(errorListMessages(node)).toEqual([`.addr.street ${message}`]);
          expect(onError).toHaveBeenLastCalledWith([expect.objectContaining({ property: '.addr.street', message })]);
        },
      );

      it('keeps listing the message once after the validator stops reporting it', async () => {
        const { node, onError } = createFormComponent({ schema, extraErrors });
        const input = node.querySelector<HTMLInputElement>('input')!;

        await user.type(input, 'a');
        await submitForm(node, user);
        await user.type(input, 'bc');
        await submitForm(node, user);

        expect(input.value).toBe('abc');
        expect(fieldErrorsById(node)).toEqual({ root_addr_street: [message] });
        expect(errorListMessages(node)).toEqual([`.addr.street ${message}`]);
        expect(onError).toHaveBeenCalledTimes(2);
        expect(onError).toHaveBeenLastCalledWith([expect.objectContaining({ property: '.addr.street', message })]);
      });

      it('passes the message once to onChange under live validation', async () => {
        const { node, onChange } = createFormComponent({ schema, extraErrors, liveValidate: 'onChange' });

        await user.type(node.querySelector<HTMLInputElement>('input')!, 'a');

        expect(onChange.mock.lastCall![0].errors).toEqual([
          expect.objectContaining({ property: '.addr.street', message }),
        ]);
      });
    });

    describe('errors held in arrays for the items of an array field', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          list: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string', minLength: 3 } } },
          },
        },
      };
      const formData = { list: [{ name: 'abc' }, { name: 'abc' }] };
      const extraErrors: ErrorSchema = { list: [{ name: { __errors: ['taken'] } }] };

      it('blocks the submit, shows and lists the error and passes it to onError', async () => {
        const { node, onError, onSubmit } = createFormComponent({ schema, initialFormData: formData, extraErrors });

        await submitForm(node, user);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(onError).toHaveBeenLastCalledWith([
          expect.objectContaining({ property: '.list.0.name', message: 'taken' }),
        ]);
        expect(fieldErrorsById(node)).toEqual({ root_list_0_name: ['taken'] });
        expect(errorListMessages(node)).toEqual(['.list.0.name taken']);
      });

      it("focuses the item's field on submit with focusOnFirstError", async () => {
        const { node } = createFormComponent({
          schema,
          initialFormData: formData,
          extraErrors,
          focusOnFirstError: true,
        });

        await submitForm(node, user);

        expect(node.querySelector('#root_list_0_name')).toHaveFocus();
      });

      it('passes the error to a focusOnFirstError callback', async () => {
        const focusOnFirstError = vi.fn();
        const { node } = createFormComponent({ schema, initialFormData: formData, extraErrors, focusOnFirstError });

        await submitForm(node, user);

        expect(focusOnFirstError).toHaveBeenCalledWith(
          expect.objectContaining({ property: '.list.0.name', message: 'taken' }),
        );
      });

      it("keeps the validator's errors for the other items", async () => {
        const { node } = createFormComponent({
          schema,
          initialFormData: { list: [{ name: 'abc' }, { name: 'a' }] },
          extraErrors,
        });

        await submitForm(node, user);

        expect(fieldErrorsById(node)).toEqual({
          root_list_0_name: ['taken'],
          root_list_1_name: ['must NOT have fewer than 3 characters'],
        });
      });

      it('passes the error keyed by index to onSubmit when it does not block', async () => {
        const { node, onSubmit } = createFormComponent({
          schema,
          initialFormData: formData,
          extraErrors,
          extraErrorsAreWarnings: true,
        });

        await submitForm(node, user);

        expect(onSubmit).toHaveBeenCalledTimes(1);
        const { errors, errorSchema } = onSubmit.mock.lastCall![0];
        expect(errors).toEqual([expect.objectContaining({ property: '.list.0.name', message: 'taken' })]);
        expect(errorSchema).toStrictEqual({ list: { 0: { name: { __errors: ['taken'] } } } });
      });

      it('drops an error a field raised in an array once the item it describes changes', async () => {
        function RaisingField(props: FieldProps) {
          const { ObjectField } = props.registry.fields;
          return (
            <>
              <button
                type='button'
                onClick={() => props.onChange(props.formData, props.fieldPath, { list: [{ __errors: ['custom!'] }] })}
              >
                Raise
              </button>
              <ObjectField {...props} />
            </>
          );
        }
        const { node, onError, onSubmit } = createFormComponent({
          schema: { type: 'object', properties: { list: { type: 'array', items: { type: 'string' } } } },
          initialFormData: { list: ['a'] },
          uiSchema: { 'ui:field': RaisingField },
        });

        await user.click(screen.getByRole('button', { name: 'Raise' }));
        await submitForm(node, user);

        expect(onError).toHaveBeenLastCalledWith([
          expect.objectContaining({ property: '.list.0', message: 'custom!' }),
        ]);

        await user.type(node.querySelector<HTMLInputElement>('#root_list_0')!, 'b');
        await submitForm(node, user);

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledTimes(1);
      });
    });
  });
});

describe('the errors a field raises for the items of an array', () => {
  /** A field that raises `errorSchema` for its own data through the Raise button, and renders the object below it */
  function raisingField(errorSchema: ErrorSchema) {
    return function RaisingField(props: FieldProps) {
      const { ObjectField } = props.registry.fields;
      return (
        <>
          <button type='button' onClick={() => props.onChange(props.formData, props.fieldPath, errorSchema)}>
            Raise
          </button>
          <ObjectField {...props} />
        </>
      );
    };
  }

  it('leave no node behind for the items a raised array holds nothing for, once the rest are dropped', async () => {
    const { node, onChange } = createFormComponent({
      schema: { type: 'object', properties: { list: { type: 'array', items: { type: 'string' } } } },
      initialFormData: { list: ['a', 'b'] },
      uiSchema: { 'ui:field': raisingField({ list: [undefined, { __errors: ['taken'] }] }) },
    });

    await user.click(screen.getByRole('button', { name: 'Raise' }));
    expect(onChange.mock.lastCall?.[0].errorSchema).toEqual({ list: { 1: { __errors: ['taken'] } } });
    await user.type(elementOf(node, '#root_list_1'), 'c');

    expect(onChange.mock.lastCall?.[0].errorSchema).toEqual({});
  });

  it('keep the errors of a property named __proto__ in a raised array as that property', async () => {
    const { onChange } = createFormComponent({
      schema: { type: 'object', properties: { list: { type: 'array', items: { type: 'object' } } } },
      initialFormData: { list: [{}] },
      uiSchema: { 'ui:field': raisingField({ list: [JSON.parse('{"__proto__": {"__errors": ["taken"]}}')] }) },
    });

    await user.click(screen.getByRole('button', { name: 'Raise' }));

    const [event] = onChange.mock.lastCall ?? [];
    expect(Object.getPrototypeOf(event?.errorSchema.list[0])).toBe(Object.prototype);
    expect(event?.errors).toEqual([
      { property: '.list.0.__proto__', message: 'taken', stack: '.list.0.__proto__ taken' },
    ]);
  });

  it('keep the errors of a property named __proto__ as that property when a sibling is renamed', async () => {
    const { node, onChange } = createFormComponent({
      schema: { type: 'object', properties: { obj: { type: 'object', additionalProperties: { type: 'string' } } } },
      initialFormData: { obj: { a: 'x' } },
      uiSchema: {
        'ui:field': raisingField({
          obj: JSON.parse('{"__proto__": {"__errors": ["proto"]}, "a": {"__errors": ["renamed"]}}'),
        }),
      },
    });

    await user.click(screen.getByRole('button', { name: 'Raise' }));
    const keyInput = elementOf(node, '#root_obj_a-key');
    await user.clear(keyInput);
    await user.type(keyInput, 'c');
    await user.tab();

    const [event] = onChange.mock.lastCall ?? [];
    expect(Object.getPrototypeOf(event?.errorSchema.obj)).toBe(Object.prototype);
    expect(event?.errors).toEqual([
      { property: '.obj.__proto__', message: 'proto', stack: '.obj.__proto__ proto' },
      { property: '.obj.c', message: 'renamed', stack: '.obj.c renamed' },
    ]);
  });

  it('keep the validation error of a property named __proto__, and its value, when a sibling is renamed', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        properties: { obj: { type: 'object', additionalProperties: { type: 'string', minLength: 3 } } },
      },
      initialFormData: JSON.parse('{"obj": {"__proto__": "x", "a": "yyyy"}}'),
    });

    await submitForm(node, user);
    const keyInput = elementOf(node, '#root_obj_a-key');
    await user.clear(keyInput);
    await user.type(keyInput, 'c');
    await user.tab();

    const [event] = onChange.mock.lastCall ?? [];
    expect(Object.keys(event?.formData.obj)).toEqual(['__proto__', 'c']);
    expect(Object.getOwnPropertyDescriptor(event?.formData.obj, '__proto__')?.value).toBe('x');
    expect(Object.getPrototypeOf(event?.errorSchema.obj)).toBe(Object.prototype);
    expect(event?.errors).toEqual([expect.objectContaining({ property: '.obj.__proto__', name: 'minLength' })]);
  });

  it('keep the errors raised under a property named __proto__ as that property of an object that already holds errors', async () => {
    function RaisingTwiceField(props: FieldProps) {
      const objPath = toFieldPath('obj', props.fieldPath);
      return (
        <>
          <button type='button' onClick={() => props.onChange(props.formData, objPath, { __errors: ['whole'] })}>
            Raise
          </button>
          <button
            type='button'
            onClick={() =>
              props.onChange('y', toFieldPath('a', toFieldPath('__proto__', objPath)), { __errors: ['taken'] })
            }
          >
            Raise nested
          </button>
        </>
      );
    }
    const { onChange } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          obj: { type: 'object', additionalProperties: { type: 'object', properties: { a: { type: 'string' } } } },
        },
      },
      initialFormData: JSON.parse('{"obj": {"__proto__": {"a": "x"}}}'),
      uiSchema: { 'ui:field': RaisingTwiceField },
    });

    await user.click(screen.getByRole('button', { name: 'Raise' }));
    await user.click(screen.getByRole('button', { name: 'Raise nested' }));

    const [event] = onChange.mock.lastCall ?? [];
    expect(Object.getPrototypeOf(event?.errorSchema.obj)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(event?.errorSchema.obj, '__proto__')?.value).toEqual({
      a: { __errors: ['taken'] },
    });
    expect(event?.errors).toEqual([
      { property: '.obj', message: 'whole', stack: '.obj whole' },
      { property: '.obj.__proto__.a', message: 'taken', stack: '.obj.__proto__.a taken' },
    ]);
  });
});
