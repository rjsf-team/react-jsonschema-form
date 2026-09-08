import { createRef, useState } from 'react';
import type { ErrorSchema, FormValidation, RJSFSchema } from '@rjsf/utils';
import { noop } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FormProps } from '../src/index.ts';
import Form from '../src/index.ts';
import { expectToHaveBeenCalledWithFormData, submitForm, describeRepeated } from './testUtils.tsx';

const user = userEvent.setup();

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
            formData: {
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

          // The form has to be controlled, since the errors are cleared by comparing the incoming
          // `formData` prop against the previous one.
          function Controlled() {
            const [formData, setFormData] = useState<any>({ baz: [{}] });
            return (
              <Form
                schema={altSchema}
                validator={validator}
                formData={formData}
                noHtml5Validate
                onChange={(e) => setFormData(e.formData)}
              />
            );
          }

          const { container } = render(<Controlled />);
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

        it('should clear the error of a field whose name contains a dot', async () => {
          const altSchema: RJSFSchema = {
            type: 'object',
            properties: {
              'foo.bar': { type: 'string' },
              baz: { type: 'string' },
            },
            required: ['foo.bar', 'baz'],
          };
          const formRef = createRef<Form>();

          function Controlled() {
            const [formData, setFormData] = useState<any>({});
            return (
              <Form
                ref={formRef}
                schema={altSchema}
                validator={validator}
                formData={formData}
                noHtml5Validate
                onChange={(e) => setFormData(e.formData)}
              />
            );
          }

          const { container } = render(<Controlled />);
          const node = container.firstElementChild!;

          await submitForm(node, user);
          // `toErrorSchema` runs the property name through `toPath`, so the error of a name holding a dot lands at
          // the path that name spells out, not under the name itself
          expect(formRef.current!.state.errorSchema).toEqual({
            foo: { bar: { __errors: ["must have required property 'foo.bar'"] } },
            baz: { __errors: ["must have required property 'baz'"] },
          });

          // Clearing has to reach the same place, and leave the field that was not touched alone
          await user.type(node.querySelector('[id="root_foo.bar"]')!, 'a');
          expect(formRef.current!.state.errorSchema).toEqual({
            foo: { bar: undefined },
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
          const formRef = createRef<Form>();

          function Controlled() {
            const [formData, setFormData] = useState<any>({ 'has.dot': {} });
            return (
              <Form
                ref={formRef}
                schema={altSchema}
                validator={validator}
                formData={formData}
                noHtml5Validate
                onChange={(e) => setFormData(e.formData)}
              />
            );
          }

          const { container } = render(<Controlled />);
          const node = container.firstElementChild!;

          await submitForm(node, user);
          // The name is spelled out as a path here too, so the errors of the two fields it holds sit side by side
          // under it and clearing one has to leave the other where it is
          expect(formRef.current!.state.errorSchema).toEqual({
            has: {
              dot: {
                inner: { __errors: ["must have required property 'inner'"] },
                other: { __errors: ["must have required property 'other'"] },
              },
            },
          });

          await user.type(node.querySelector('[id="root_has.dot_inner"]')!, 'a');
          expect(formRef.current!.state.errorSchema).toEqual({
            has: {
              dot: {
                inner: undefined,
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

          function Controlled() {
            const [formData, setFormData] = useState<any>({ tags: ['a', 'a'] });
            return (
              <Form
                schema={altSchema}
                validator={validator}
                formData={formData}
                noHtml5Validate
                onChange={(e) => setFormData(e.formData)}
              />
            );
          }

          const { container } = render(<Controlled />);
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

          function Controlled() {
            const [formData, setFormData] = useState<any>({ baz: [{}, { corge: 'z' }] });
            return (
              <Form
                schema={altSchema}
                validator={validator}
                formData={formData}
                noHtml5Validate
                onChange={(e) => setFormData(e.formData)}
              />
            );
          }

          const { container } = render(<Controlled />);
          const node = container.firstElementChild!;
          const shownErrors = () => Array.from(node.querySelectorAll('.error-detail')).map((e) => e.textContent);

          await submitForm(node, user);
          expect(shownErrors()).toEqual([
            "must have required property 'qux'",
            "must have required property 'corge'",
            "must have required property 'qux'",
          ]);

          // Moving the first item down leaves neither item holding a `qux`, so both of those errors are still the
          // errors of the values sitting at those paths and only the `corge` that moved loses its own
          await user.click(node.querySelector<HTMLButtonElement>('.rjsf-array-item-move-down')!);
          expect(shownErrors()).toEqual(["must have required property 'qux'", "must have required property 'qux'"]);
        });
      });

      describe('Live validation', () => {
        it('should update the errorSchema when the formData changes', async () => {
          const { node, onChange } = createFormComponent({
            schema,
            liveValidate: true,
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
            liveValidate: true,
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
            noValidate: true,
            liveValidate: true,
          });

          await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');

          expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ errorSchema: {} }), 'root');
        });
      });

      describe('Disable validation onSubmit event', () => {
        it('should not update errorSchema when the formData changes', async () => {
          const { node, onSubmit } = createFormComponent({
            schema,
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
          extraErrorsBlockSubmit: true,
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
        liveValidate: true,
        schema: {
          type: 'string',
          minLength: 8,
        },
        formData: 'short',
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
        liveValidate: true,
        schema: {
          type: 'string',
          minLength: 8,
          pattern: 'd+',
        },
        formData: 'short',
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
        liveValidate: true,
        formData: {
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
        liveValidate: true,
        formData: ['good', 'ba', 'good'],
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

      const formProps: Omit<FormProps, 'validator'> = { schema, liveValidate: true };

      it('should contextualize the error for nested array indices', async () => {
        const { node, onError } = createFormComponent({
          ...formProps,
          formData: {
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
          formData: {
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

      const formProps: Omit<FormProps, 'validator'> = { schema, formData, liveValidate: true };

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
        liveValidate: true,
        formData: [{ foo: 'good' }, { foo: 'ba' }, { foo: 'good' }],
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
          liveValidate: true,
        });

        const input = node.querySelector<HTMLInputElement>('input[type=number]');
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
          liveValidate: true,
          formData: { branch: 2 },
        });

        await user.type(node.querySelectorAll<HTMLInputElement>('input[type=number]')[0], '0');

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
          liveValidate: true,
          formData: { branch: 3 },
        });

        await user.selectOptions(node.querySelector('select')!, '3'); // Select by label/text since selectOptions matches text before value attribute

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errorSchema: {},
          }),
          'root_branch',
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "ignoring oneOf in dependencies because there isn't exactly one subschema that is valid",
        );
        consoleWarnSpy.mockRestore();
      });

      it('should sanitize stale enum data and persist the retrieved dependency schema', async () => {
        const formRef = createRef<Form>();
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
          ref: formRef,
          schema: dependentEnumSchema,
          formData: { animal: 'Fish', food: 'worms', water: 'lake' },
        });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_animal')!, '0');

        expectToHaveBeenCalledWithFormData(onChange, { animal: 'Cat', food: 'meat', water: undefined }, 'root_animal');
        const { retrievedSchema } = formRef.current!.state;
        expect(retrievedSchema.properties).toEqual(
          expect.objectContaining({
            food: expect.objectContaining({ enum: ['meat'] }),
          }),
        );
        expect(retrievedSchema.properties).not.toHaveProperty('water');

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_food')!, '0');
        expect(formRef.current!.state.retrievedSchema.properties).not.toHaveProperty('water');
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
        const customValidate = (formData: any, errors: FormValidation) => {
          if (formData.Start > formData.End) {
            errors.Start?.addError('Validate error: Test should be LE than End');
          }
          return errors;
        };

        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
          formData: { Start: 2, End: 0 },
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
  });
});
