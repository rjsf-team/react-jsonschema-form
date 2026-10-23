import { createRef, useEffect, useLayoutEffect, useState } from 'react';
import type { DefaultFormStateBehavior, GenericObjectType, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { getTemplates, getUiOptions } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormProps, IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';
import {
  createFormComponent,
  describeRepeated,
  errorListMessages,
  expectToHaveBeenCalledWithFormData,
  fieldErrorsById,
  submitForm,
  createFormRef,
  input,
  setupConsoleWarnSuppression,
} from './testUtils.tsx';

const user = userEvent.setup();

describeRepeated('Form common: event handlers', (createFormComponent) => {
  describe('Submit handler', () => {
    it('should call provided submit handler with form state', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      };
      const formData = {
        foo: 'bar',
      };
      const { node, onSubmit } = createFormComponent({
        ref: createRef(),
        schema,
        initialFormData: formData,
      });

      await submitForm(node, user);
      expectToHaveBeenCalledWithFormData(onSubmit, formData, true);
    });

    it('should not call provided submit handler on validation errors', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            minLength: 1,
          },
        },
      };
      const formData = {
        foo: '',
      };
      const { node, onSubmit, onError } = createFormComponent({
        ref: createRef(),
        schema,
        initialFormData: formData,
      });

      await submitForm(node, user);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });

    it.each([
      ['boolean', false],
      ['boolean', true],
      ['number', 0],
      ['integer', 0],
      ['string', ''],
    ] as const)('should submit a root %s schema with falsy-or-simple value %j (#5404)', async (type, formData) => {
      const { node, onSubmit, onError } = createFormComponent({
        ref: createRef(),
        schema: { type },
        initialFormData: formData,
      });

      await submitForm(node, user);

      expect(onError).not.toHaveBeenCalled();
      expect(onSubmit).toHaveBeenCalled();
      expectToHaveBeenCalledWithFormData(onSubmit, formData, true);
    });

    it('should still report an error for a root value of the wrong type', async () => {
      const { node, onSubmit, onError } = createFormComponent({
        ref: createRef(),
        schema: { type: 'boolean' },
        initialFormData: 0,
      });

      await submitForm(node, user);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Change handler', () => {
    const warnings = setupConsoleWarnSuppression();
    it('should call provided change handler on form state change with schema and uiSchema', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      };
      const uiSchema: UiSchema = {
        foo: { 'ui:field': 'textarea' },
      };

      const formData = {
        foo: '',
      };
      const { node, onChange } = createFormComponent({
        ref: createRef(),
        schema,
        uiSchema,
        initialFormData: formData,
      });

      await user.type(node.querySelector('[type=text]')!, 'new');

      expectToHaveBeenCalledWithFormData(onChange, { foo: 'new' }, 'root_foo');
    });
    it('should call last provided change handler', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            default: 'bar',
          },
        },
      };

      const secondOnChange = vi.fn();
      const ref = createFormRef();

      const { onChange, rerender } = createFormComponent({ ref, schema, initialFormData: { foo: 'bar1' } });

      act(() => {
        ref.current!.setFieldValue('foo', 'bar2');
      });

      expect(onChange).toHaveBeenCalledTimes(1);

      rerender({ ref, schema, initialFormData: { foo: 'bar1' }, onChange: secondOnChange });

      act(() => {
        ref.current!.setFieldValue('foo', 'bar3');
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(secondOnChange).toHaveBeenCalledTimes(1);
    });
    it('should call change handler with proper data after two near simultaneous changes', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            default: 'bar',
          },
          baz: {
            type: 'string',
            default: 'blah',
          },
        },
      };
      function FooWidget(props: WidgetProps) {
        const { value, id, onChange, uiSchema, registry } = props;
        const uiOptions = getUiOptions(uiSchema);
        const { BaseInputTemplate } = getTemplates(registry, uiOptions);
        useEffect(() => {
          if (value === 'bar') {
            onChange('bar2', undefined, id);
          }
        }, [value, onChange, id]);
        return <BaseInputTemplate {...props} />;
      }
      function BazWidget(props: WidgetProps) {
        const { value, id, onChange, uiSchema, registry } = props;
        const uiOptions = getUiOptions(uiSchema);
        const { BaseInputTemplate } = getTemplates(registry, uiOptions);
        useEffect(() => {
          if (value === 'blah') {
            onChange('blah2', undefined, id);
          }
        }, [value, onChange, id]);
        return <BaseInputTemplate {...props} />;
      }
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': FooWidget,
        },
        baz: {
          'ui:widget': BazWidget,
        },
      };

      let formData = {};
      const ids: (string | undefined)[] = [];
      const onChange: FormProps['onChange'] = (data, id) => {
        const { formData: fd } = data;
        formData = { ...formData, ...(fd as GenericObjectType) };
        ids.push(id);
      };
      createFormComponent({
        schema,
        initialFormData: formData,
        onChange,
        uiSchema,
      });

      await waitFor(() => {
        expect(ids).toHaveLength(2);
      });

      // The second edit builds on the first
      expect(formData).toEqual({ foo: 'bar2', baz: 'blah2' });
      // One id per updated component; the defaults the seed was given are not reported
      expect(ids).toEqual(['root_foo', 'root_baz']);
    });
    describe('many changes in one event', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
          baz: { type: 'string' },
        },
      };
      const burstWidget = (count: number) =>
        function BurstWidget({ onChange }: WidgetProps) {
          return (
            <button
              type='button'
              onClick={() => {
                for (let i = 1; i <= count; i++) {
                  onChange(`value ${i}`);
                }
              }}
            >
              burst
            </button>
          );
        };

      it('should not throw and should keep the last value after many changes to one field', async () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema: { foo: { 'ui:widget': burstWidget(200) } },
        });

        onChange.mockClear();

        await user.click(node.querySelector('button')!);

        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(200));
        expectToHaveBeenCalledWithFormData(onChange, { foo: 'value 200' }, 'root_foo');
      });
      it('should still report a burst of 40 changes before the event returns', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema: { foo: { 'ui:widget': burstWidget(40) } },
        });

        onChange.mockClear();

        fireEvent.click(node.querySelector('button')!);

        expect(onChange).toHaveBeenCalledTimes(40);
        expectToHaveBeenCalledWithFormData(onChange, { foo: 'value 40' }, 'root_foo');
      });
      it('should not throw and should report every change after many changes to different fields', async () => {
        const ref = createFormRef();
        const { onChange } = createFormComponent({ ref, schema });
        onChange.mockClear();

        await act(async () => {
          for (let i = 1; i <= 60; i++) {
            ref.current!.setFieldValue(i % 2 ? 'foo' : 'baz', `value ${i}`);
          }
        });

        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(60));
        expect(onChange.mock.calls.map(([, id]: unknown[]) => id)).toEqual(
          Array.from({ length: 60 }, (_, i) => (i % 2 ? 'root_baz' : 'root_foo')),
        );
        expectToHaveBeenCalledWithFormData(onChange, { foo: 'value 59', baz: 'value 60' }, 'root_baz');
      });
      it('should live validate the last value of a burst', () => {
        const shortLast = Array.from({ length: 60 }, (_, i) => (i === 59 ? 'a' : 'abc'));
        const longLast = Array.from({ length: 60 }, (_, i) => (i === 59 ? 'abc' : 'a'));
        const sendWidget = (values: string[]) =>
          function SendWidget({ onChange }: WidgetProps) {
            return (
              <button type='button' onClick={() => values.forEach((value) => onChange(value))}>
                send
              </button>
            );
          };
        const minLengthSchema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
        const errorsAfter = (values: string[]) => {
          const { node, onChange } = createFormComponent({
            schema: minLengthSchema,
            liveValidate: 'onChange',
            uiSchema: { foo: { 'ui:widget': sendWidget(values) } },
          });
          onChange.mockClear();
          fireEvent.click(node.querySelector('button')!);
          expect(onChange).toHaveBeenCalledTimes(values.length);
          const event: IChangeEvent = onChange.mock.lastCall![0];
          return event.errors.map(({ property }) => property);
        };

        expect(errorsAfter(shortLast)).toEqual(['.foo']);
        expect(errorsAfter(longLast)).toEqual([]);
      });
    });
    it('should report every change of a burst to a form controlled by its parent and a widget that copies its value', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string', default: 'foo' },
          baz: { type: 'string', default: 'baz' },
        },
      };
      const reported: string[] = [];
      function BurstWidget({ onChange, value }: WidgetProps) {
        const [, setCopy] = useState(value);
        useLayoutEffect(() => {
          // oxlint-disable-next-line react/set-state-in-effect -- the commit-phase update is what the burst must survive
          setCopy(value);
        }, [value]);
        return (
          <button
            type='button'
            onClick={() => {
              for (let i = 1; i <= 300; i++) {
                onChange(`value ${i}`);
              }
            }}
          >
            burst
          </button>
        );
      }
      function Parent() {
        const [formData, setFormData] = useState<GenericObjectType | undefined>({});
        return (
          <Form
            schema={schema}
            uiSchema={{ foo: { 'ui:widget': BurstWidget } }}
            validator={customizeValidator<GenericObjectType>()}
            liveValidate='onChange'
            // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
            formData={formData}
            onChange={(e) => {
              reported.push(e.formData.foo);
              setFormData(e.formData);
            }}
          />
        );
      }
      const { container } = render(<Parent />);
      reported.length = 0;

      await user.click(container.querySelector('button')!);

      await waitFor(() => {
        expect(reported).toHaveLength(300);
      });
      expect(reported[299]).toBe('value 300');
    });
    it('should keep the form mounted and taking changes when a change throws', () => {
      vi.useFakeTimers();
      try {
        const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: 'onChange',
          customValidate: (formData: unknown, errors) => {
            if (typeof formData === 'object' && formData !== null && 'foo' in formData && formData.foo === 'boom') {
              throw new Error('customValidate failed');
            }
            return errors;
          },
        });
        onChange.mockClear();

        fireEvent.change(node.querySelector('#root_foo')!, { target: { value: 'boom' } });

        expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.change(node.querySelector('#root_foo')!, { target: { value: 'fine' } });

        expect(node.isConnected).toBe(true);
        expectToHaveBeenCalledWithFormData(onChange, { foo: 'fine' }, 'root_foo');
      } finally {
        vi.useRealTimers();
      }
    });
    it('should keep the changes before the last change of a burst when that change throws', () => {
      vi.useFakeTimers();
      try {
        const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
        const SendWidget = ({ onChange, value }: WidgetProps) => (
          <>
            <output>{value}</output>
            <button type='button' onClick={() => ['value 1', 'value 2', 'boom'].forEach((v) => onChange(v))}>
              send
            </button>
          </>
        );
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: 'onChange',
          uiSchema: { foo: { 'ui:widget': SendWidget } },
          customValidate: (formData: unknown, errors) => {
            if (typeof formData === 'object' && formData !== null && 'foo' in formData && formData.foo === 'boom') {
              throw new Error('customValidate failed');
            }
            return errors;
          },
        });
        onChange.mockClear();

        fireEvent.click(node.querySelector('button')!);

        expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
        expect(onChange.mock.calls.map(([event]: IChangeEvent[]) => event.formData)).toEqual([
          { foo: 'value 1' },
          { foo: 'value 2' },
        ]);
        expect(node.querySelector('output')!.textContent).toBe('value 2');
      } finally {
        vi.useRealTimers();
      }
    });
    it('should not keep the custom errors of a change that throws', () => {
      vi.useFakeTimers();
      try {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { foo: { type: 'string' }, baz: { type: 'string' }, qux: { type: 'string' } },
        };
        const raisingWidget = (value: string, error: string) =>
          function RaisingWidget({ onChange, id }: WidgetProps) {
            return (
              <button type='button' id={`${id}_raise`} onClick={() => onChange(value, { __errors: [error] })}>
                raise
              </button>
            );
          };
        let isTransformFailing = false;
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: 'onChange',
          uiSchema: {
            foo: { 'ui:widget': raisingWidget('boom', 'raised on foo') },
            baz: { 'ui:widget': raisingWidget('kept', 'raised on baz') },
          },
          transformErrors: (errors) => {
            if (isTransformFailing) {
              throw new Error('transformErrors failed');
            }
            return errors;
          },
        });

        fireEvent.click(node.querySelector('#root_baz_raise')!);
        isTransformFailing = true;
        fireEvent.click(node.querySelector('#root_foo_raise')!);
        expect(() => vi.runOnlyPendingTimers()).toThrow('transformErrors failed');
        isTransformFailing = false;
        onChange.mockClear();
        fireEvent.change(node.querySelector('#root_qux')!, { target: { value: 'fine' } });

        expectToHaveBeenCalledWithFormData(onChange, { baz: 'kept', qux: 'fine' }, 'root_qux');
        const event: IChangeEvent = onChange.mock.lastCall![0];
        expect(event.errors.map(({ message }) => message)).toEqual(['raised on baz']);
      } finally {
        vi.useRealTimers();
      }
    });
    it('should modify an allOf field when the defaults are set', async () => {
      const schema: RJSFSchema = {
        properties: {
          all_of_field: {
            allOf: [
              {
                properties: {
                  first: {
                    type: 'string',
                  },
                },
              },
              {
                properties: {
                  second: {
                    type: 'string',
                  },
                },
              },
            ],
            default: {
              second: 'second!',
            },
          },
        },
        type: 'object',
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const secondInputID = '#root_all_of_field_second';
      expect(node.querySelector(secondInputID)).toHaveAttribute('value', 'second!');

      await user.clear(node.querySelector(secondInputID)!);
      await user.type(node.querySelector(secondInputID)!, 'changed!');

      expectToHaveBeenCalledWithFormData(
        onChange,
        {
          all_of_field: {
            second: 'changed!',
          },
        },
        'root_all_of_field_second',
      );

      expect(node.querySelector(secondInputID)).toHaveAttribute('value', 'changed!');
    });
    it('should modify an oneOf field when the defaults are set', async () => {
      const schema: RJSFSchema = {
        properties: {
          one_of_field: {
            oneOf: [
              {
                properties: {
                  first: {
                    type: 'string',
                  },
                },
              },
              {
                properties: {
                  second: {
                    type: 'string',
                  },
                },
              },
            ],
            default: {
              second: 'second!',
            },
          },
        },
        type: 'object',
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const secondInputID = '#root_one_of_field_second';
      expect(node.querySelector(secondInputID)).toHaveAttribute('value', 'second!');

      await user.clear(node.querySelector(secondInputID)!);
      await user.type(node.querySelector(secondInputID)!, 'changed!');

      expectToHaveBeenCalledWithFormData(
        onChange,
        {
          one_of_field: {
            second: 'changed!',
          },
        },
        'root_one_of_field_second',
      );

      expect(node.querySelector(secondInputID)).toHaveAttribute('value', 'changed!');
    });
    it('should modify an anyOf field when the defaults are set', async () => {
      const schema: RJSFSchema = {
        properties: {
          any_of_field: {
            anyOf: [
              {
                properties: {
                  first: {
                    type: 'string',
                  },
                },
              },
              {
                properties: {
                  second: {
                    type: 'string',
                  },
                },
              },
            ],
            default: {
              second: 'second!',
            },
          },
        },
        type: 'object',
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const secondInputID = '#root_any_of_field_second';
      expect(node.querySelector(secondInputID)).toHaveAttribute('value', 'second!');

      await user.clear(node.querySelector(secondInputID)!);
      await user.type(node.querySelector(secondInputID)!, 'changed!');

      expectToHaveBeenCalledWithFormData(
        onChange,
        {
          any_of_field: {
            second: 'changed!',
          },
        },
        'root_any_of_field_second',
      );

      expect(node.querySelector(secondInputID)).toHaveAttribute('value', 'changed!');
    });
    it('should restore defaults when switching from null back to object option in oneOf', async () => {
      // This test verifies that when switching from a null oneOf option back to an object option,
      // the defaults are correctly restored. Without the fix, the form would show empty/undefined values.
      const schema: RJSFSchema = {
        type: 'object',
        title: 'Configuration',
        oneOf: [
          {
            title: 'Default Configuration',
            type: 'object',
            properties: {
              types: { const: 'default', title: 'Types' },
              content: { type: 'string', title: 'Content' },
            },
            required: ['types'],
          },
          {
            title: 'Advanced Configuration',
            type: 'object',
            properties: {
              types: { const: 'advanced', title: 'Types' },
              content: { type: 'string', title: 'Content' },
            },
            required: ['types'],
          },
          { title: 'No Configuration', type: 'null' },
        ],
        default: { types: 'advanced', content: 'placeholder' },
      };

      const onChangeCalls: { event: IChangeEvent; id?: string }[] = [];

      const { node } = createFormComponent({
        schema,
        onChange: (event: IChangeEvent, id?: string) => onChangeCalls.push({ event, id }),
        defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' },
      });

      // Should start with "Advanced Configuration" (index 1) based on default
      const oneOfSelect = node.querySelector<HTMLSelectElement>('#root__oneof_select');
      expect(oneOfSelect).toBeInTheDocument();
      expect(oneOfSelect!.value).toEqual('1');

      // The content field should have the default value
      let contentInput = node.querySelector<HTMLInputElement>('#root_content');
      expect(contentInput).toBeInTheDocument();
      expect(contentInput!.value).toEqual('placeholder');

      // Switch to "No Configuration" (null option, index 2)
      await user.selectOptions(oneOfSelect!, '2');

      // Verify we're now on null option - content field should not exist
      expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')!.value).toEqual('2');
      expect(node.querySelector('#root_content')).not.toBeInTheDocument();

      // Switch back to "Advanced Configuration" (index 1)
      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      // The content field should be restored with defaults
      expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')!.value).toEqual('1');
      contentInput = node.querySelector<HTMLInputElement>('#root_content');
      expect(contentInput).toBeInTheDocument();
      // BUG: Without the fix, this would be empty string or undefined
      expect(contentInput!.value).toEqual('placeholder');

      // Also verify the final formData has correct values
      const lastFormData = onChangeCalls[onChangeCalls.length - 1].event.formData as GenericObjectType;
      expect(lastFormData.types).toEqual('advanced');
      expect(lastFormData.content).toEqual('placeholder');
    });
    it('should allow switching to null option in oneOf', async () => {
      // This test verifies that switching to a null option in oneOf works correctly.
      // Without the fix, the form would revert back to the previous option.
      const schema: RJSFSchema = {
        type: 'object',
        title: 'Configuration',
        oneOf: [
          {
            title: 'Default Configuration',
            type: 'object',
            properties: {
              types: { const: 'default', title: 'Types' },
              content: { type: 'string', title: 'Content' },
            },
            required: ['types'],
          },
          {
            title: 'Advanced Configuration',
            type: 'object',
            properties: {
              types: { const: 'advanced', title: 'Types' },
              content: { type: 'string', title: 'Content' },
            },
            required: ['types'],
          },
          { title: 'No Configuration', type: 'null' },
        ],
        default: { types: 'advanced', content: 'placeholder' },
      };

      const onChangeCalls: { event: IChangeEvent; id?: string }[] = [];
      let currentFormData: unknown = undefined;

      const { node, rerender } = createFormComponent({
        ref: createRef(),
        schema,
        onChange: (event: IChangeEvent, id?: string) => {
          onChangeCalls.push({ event, id });
          currentFormData = event.formData;
        },
        defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' },
      });

      // Should start with "Advanced Configuration" (index 1)
      expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')!.value).toEqual('1');
      expect(node.querySelector('#root_content')).toBeInTheDocument();

      // Switch to "No Configuration" (null option, index 2)
      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '2');

      rerender({
        ref: createRef(),
        schema,
        initialFormData: currentFormData,
        defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' },
      });

      // BUG: Without the fix, the form would revert back to index 1
      expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')!.value).toEqual('2');
      // Content field should not exist for null option
      expect(node.querySelector('#root_content')).not.toBeInTheDocument();

      // Verify formData is null or undefined (both valid for null option)
      const lastFormData = onChangeCalls[onChangeCalls.length - 1].event.formData;
      expect(lastFormData == null).toBe(true);
    });
    describe('should keep a switch to a null oneOf option while applying an unrelated prop change', () => {
      const schema: RJSFSchema = {
        type: 'object',
        oneOf: [
          {
            title: 'Advanced Configuration',
            type: 'object',
            properties: { types: { const: 'advanced', title: 'Types' }, content: { type: 'string', title: 'Content' } },
            required: ['types'],
          },
          { title: 'No Configuration', type: 'null' },
        ],
        default: { types: 'advanced', content: 'placeholder' },
      };
      const defaultFormStateBehavior = { emptyObjectFields: 'populateAllDefaults' } as const;

      it('at the root', async () => {
        const { node, rerender } = createFormComponent({ schema, defaultFormStateBehavior });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');
        rerender({ schema, defaultFormStateBehavior, uiSchema: { 'ui:disabled': true } });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toBeDisabled();
        expect(node.querySelector('#root_content')).not.toBeInTheDocument();
      });
      it('nested with sibling data', async () => {
        const nestedSchema: RJSFSchema = {
          type: 'object',
          properties: { other: { type: 'string', title: 'Other' }, cfg: schema },
        };
        const { node, rerender } = createFormComponent({ schema: nestedSchema, defaultFormStateBehavior });

        await user.type(node.querySelector<HTMLInputElement>('#root_other')!, 'x');
        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_cfg__oneof_select')!, '1');
        rerender({ schema: nestedSchema, defaultFormStateBehavior, uiSchema: { 'ui:disabled': true } });

        expect(node.querySelector<HTMLSelectElement>('#root_cfg__oneof_select')).toHaveValue('1');
        expect(node.querySelector<HTMLSelectElement>('#root_cfg__oneof_select')).toBeDisabled();
        expect(node.querySelector('#root_cfg_content')).not.toBeInTheDocument();
        expect(node.querySelector<HTMLInputElement>('#root_other')).toHaveValue('x');
      });
      it('keeping the errors the option it switched to earned', async () => {
        // The option sits under a required property so the switch leaves data to validate: at the root it leaves
        // `undefined`, and there would be no errors to keep
        const invalidDefaultSchema: RJSFSchema = {
          type: 'object',
          properties: {
            cfg: {
              ...schema,
              oneOf: [
                {
                  type: 'object',
                  properties: { types: { const: 'advanced' }, content: { type: 'string', minLength: 50 } },
                  required: ['types'],
                },
                { title: 'No Configuration', type: 'null' },
              ],
            },
          },
          required: ['cfg'],
        };
        const props = {
          schema: invalidDefaultSchema,
          defaultFormStateBehavior,
          liveValidate: 'onChange',
        } as const;
        const errorsTheSwitchEarned = ["must have required property 'cfg'"];
        const { node, rerender } = createFormComponent(props);

        await user.selectOptions(screen.getByRole('combobox'), '1');
        expect(errorListMessages(node)).toEqual(errorsTheSwitchEarned);
        rerender({ ...props, uiSchema: { 'ui:disabled': true } });

        expect(screen.getByRole('combobox')).toHaveValue('1');
        expect(errorListMessages(node)).toEqual(errorsTheSwitchEarned);
      });
    });
    it('should keep a form value set in the same render as an unrelated prop change', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const ref = createFormRef();
      const { node, rerender } = createFormComponent({ schema, ref });

      await user.type(node.querySelector<HTMLInputElement>('#root_name')!, 'a');
      act(() => {
        ref.current!.setFieldValue('name', 'x');
        rerender({ schema, ref, disabled: true });
      });

      expect(node.querySelector<HTMLInputElement>('#root_name')).toHaveValue('x');
    });
    it('should keep the edits, and warn, when a parent that ignores onChange passes another formData', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' }, other: { type: 'string', default: 'defaulted' } },
      };
      // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
      const { node, rerender } = createFormComponent({ schema, formData: { name: 'a' }, onChange: () => {} });

      await user.type(input(node, 'root_name'), 'x');
      // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
      rerender({ schema, formData: { name: 'loaded' }, onChange: () => {} });

      expect(input(node, 'root_name')).toHaveValue('ax');
      expect(warnings.consoleSpy).toHaveBeenCalledTimes(1);
      expect(warnings.consoleSpy.mock.lastCall?.[0]).toMatch(/`formData` changed after the form mounted/);
    });
    it('should clear the errors when noValidate is turned on', () => {
      const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
      const ref = createFormRef();
      const { node, rerender } = createFormComponent({ schema, ref });
      act(() => {
        ref.current!.validateForm();
      });
      expect(errorListMessages(node)).toHaveLength(1);
      expect(fieldErrorsById(node)).toEqual({ root_name: ["must have required property 'name'"] });

      // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
      rerender({ schema, ref, noValidate: true });

      expect(errorListMessages(node)).toHaveLength(0);
      expect(fieldErrorsById(node)).toEqual({});
    });
    describe('should keep a switch to a null oneOf option when a recreated prop rebuilds the schema utilities', () => {
      const schema: RJSFSchema = {
        type: 'object',
        oneOf: [
          {
            type: 'object',
            properties: { types: { const: 'advanced' }, content: { type: 'string' } },
            required: ['types'],
          },
          { title: 'No Configuration', type: 'null' },
        ],
        default: { types: 'advanced', content: 'placeholder' },
      };
      const defaultFormStateBehavior = { emptyObjectFields: 'populateAllDefaults' } as const;

      it('validator', async () => {
        const { node, rerender } = createFormComponent({ schema, defaultFormStateBehavior });
        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

        rerender({ schema, defaultFormStateBehavior }, customizeValidator());

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
      });
      it('customMergeAllOf', async () => {
        const { node, rerender } = createFormComponent({
          schema,
          defaultFormStateBehavior,
          customMergeAllOf: (allOfSchema: RJSFSchema) => allOfSchema,
        });
        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

        rerender({
          schema,
          defaultFormStateBehavior,
          customMergeAllOf: (allOfSchema: RJSFSchema) => allOfSchema,
        });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
      });
      it('defaultFormStateBehavior going from unset to empty', async () => {
        const { node, rerender } = createFormComponent({ schema });
        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

        rerender({ schema, defaultFormStateBehavior: {} });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
      });
    });
    it('Should modify anyOf definition references when the defaults are set.', async () => {
      const schema: RJSFSchema = {
        definitions: {
          option1: {
            properties: {
              first: {
                type: 'string',
              },
            },
          },
          option2: {
            properties: {
              second: {
                type: 'string',
              },
            },
          },
        },
        properties: {
          any_of_field: {
            anyOf: [
              {
                $ref: '#/definitions/option1',
              },
              {
                $ref: '#/definitions/option2',
              },
            ],
            default: {
              second: 'second!',
            },
          },
        },
        type: 'object',
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const secondInputID = '#root_any_of_field_second';
      expect(node.querySelector(secondInputID)).toHaveAttribute('value', 'second!');

      await user.clear(node.querySelector(secondInputID)!);
      await user.type(node.querySelector(secondInputID)!, 'changed!');

      expectToHaveBeenCalledWithFormData(
        onChange,
        {
          any_of_field: {
            second: 'changed!',
          },
        },
        'root_any_of_field_second',
      );

      expect(node.querySelector(secondInputID)).toHaveAttribute('value', 'changed!');
    });
    it('Should modify oneOf object with references when the defaults are set.', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        $defs: {
          protocol: {
            type: 'string',
            enum: ['fast', 'balanced', 'stringent'],
            default: 'fast',
          },
        },
        oneOf: [
          {
            properties: {
              protocol: {
                $ref: '#/$defs/protocol',
              },
            },
          },
          {
            properties: {
              something: {
                type: 'number',
              },
            },
          },
        ],
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const protocolInputID = '#root_protocol';
      expect(node.querySelector(protocolInputID)).toHaveValue('0');

      await user.selectOptions(node.querySelector(protocolInputID)!, '1');

      expectToHaveBeenCalledWithFormData(
        onChange,
        {
          protocol: 'balanced',
        },
        'root_protocol',
      );

      expect(node.querySelector(protocolInputID)).toHaveValue('1');
    });
    describe('Should modify oneOf radio button when the defaults are set.', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          a: {
            type: ['boolean', 'null'],
            default: null,
            oneOf: [
              {
                const: false,
                title: 'No',
              },
              {
                const: null,
                title: 'N/A',
              },
            ],
          },
        },
        allOf: [
          {
            if: {
              required: ['a'],
              properties: {
                a: {
                  const: false,
                },
              },
            },
            then: {
              required: ['b'],
              properties: {
                b: {
                  type: 'string',
                },
              },
            },
          },
        ],
      };

      const uiSchema: UiSchema = {
        a: {
          'ui:widget': 'radio',
          'ui:label': false,
        },
      };
      const notApplicableInputID = '#root_a-1';
      const NoInputID = '#root_a-0';

      it('Test with default constAsDefaults', async () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
        });

        expect(node.querySelector(notApplicableInputID)).toBeChecked();

        await user.click(node.querySelector(NoInputID)!);

        expectToHaveBeenCalledWithFormData(onChange, { a: false }, 'root_a');

        expect(node.querySelector(NoInputID)).toBeChecked();
        expect(node.querySelector(notApplicableInputID)).not.toBeChecked();
        expect(node.querySelector('#root_b')).toBeInTheDocument();
      });
      it('Test with constAsDefaults set to "never"', async () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          defaultFormStateBehavior: {
            constAsDefaults: 'never',
          },
        });

        expect(node.querySelector(notApplicableInputID)).toBeChecked();

        await user.click(node.querySelector(NoInputID)!);

        expectToHaveBeenCalledWithFormData(onChange, { a: false }, 'root_a');

        expect(node.querySelector(NoInputID)).toBeChecked();
        expect(node.querySelector(notApplicableInputID)).not.toBeChecked();
        expect(node.querySelector('#root_b')).toBeInTheDocument();
      });
    });
  });

  describe('Blur handler', () => {
    it('should call provided blur handler on form input blur event', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      };
      const formData = {
        foo: '',
      };
      const onBlur = vi.fn();
      const { node } = createFormComponent({ schema, initialFormData: formData, onBlur });

      const input = node.querySelector('[type=text]')!;
      await user.type(input, 'new');
      await user.tab();

      expect(onBlur).toHaveBeenLastCalledWith(input.id, 'new');
    });
  });

  describe('Focus handler', () => {
    it('should call provided focus handler on form input focus event', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      };
      const formData = {
        foo: 'new',
      };
      const onFocus = vi.fn();
      const { node } = createFormComponent({ schema, initialFormData: formData, onFocus });

      const input = node.querySelector('[type=text]')!;
      await user.click(input);

      expect(onFocus).toHaveBeenLastCalledWith(input.id, 'new');
    });
  });

  describe('Error handler', () => {
    it('should call provided error handler on validation errors', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            minLength: 1,
          },
        },
      };
      const formData = {
        foo: '',
      };
      const { node, onError } = createFormComponent({ schema, initialFormData: formData });

      await submitForm(node, user);

      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Form: the prop changes the form re-derives its data for', () => {
  it('should apply a schema change that adds a property with a default after a change', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { trigger: { type: 'string', title: 'Trigger' } },
    };
    const { node, rerender } = createFormComponent({ schema });

    await user.type(node.querySelector<HTMLInputElement>('#root_trigger')!, 'x');
    rerender({
      schema: {
        ...schema,
        properties: { ...schema.properties, extra: { type: 'string', title: 'Extra', default: 'preset' } },
      },
    });

    expect(node.querySelector<HTMLInputElement>('#root_extra')).toHaveValue('preset');
  });
  it('should apply the defaults of a changed defaultFormStateBehavior to the data it holds', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { nested: { type: 'object', properties: { foo: { type: 'string', default: 'bar' } } } },
    };
    const { node, rerender } = createFormComponent({
      schema,
      defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
    });
    expect(node.querySelector<HTMLInputElement>('#root_nested_foo')).toHaveValue('');

    rerender({ schema, defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' } });

    expect(node.querySelector<HTMLInputElement>('#root_nested_foo')).toHaveValue('bar');
  });
  // A re-derive refills the root default a switch to the null option cleared, so the switch shows whether one ran
  const nullOptionSchema: RJSFSchema = {
    type: 'object',
    oneOf: [
      { type: 'object', properties: { types: { const: 'advanced' } }, required: ['types'] },
      { title: 'No Configuration', type: 'null' },
    ],
    default: { types: 'advanced' },
  };
  const switchToNullOption = (node: Element) =>
    user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

  it('should apply a changed ui:emptyValue to the data it holds', () => {
    const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
    const { node, rerender } = createFormComponent({ schema });

    rerender({ schema, uiSchema: { name: { 'ui:emptyValue': 'empty' } } });

    expect(node.querySelector<HTMLInputElement>('#root_name')).toHaveValue('empty');
  });
  it('should apply a changed ui:emptyValue under a property named __proto__', () => {
    const schema = JSON.parse('{"type": "object", "properties": {"__proto__": {"type": "string"}}}') as RJSFSchema;
    const { node, rerender } = createFormComponent({ schema });

    rerender({ schema, uiSchema: JSON.parse('{"__proto__": {"ui:emptyValue": "empty"}}') });

    expect(node.querySelector<HTMLInputElement>('#root___proto__')).toHaveValue('empty');
  });
  it('should not re-derive it for a uiSchema holding a function written inline', async () => {
    const uiSchema = (): UiSchema => ({ 'ui:options': { onSomething: () => undefined } });
    const { node, rerender } = createFormComponent({ schema: nullOptionSchema, uiSchema: uiSchema() });

    await switchToNullOption(node);
    rerender({ schema: nullOptionSchema, uiSchema: uiSchema() });

    expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
  });
  it('should not re-derive it for a defaultFormStateBehavior spelling an unset key out as undefined', async () => {
    const { node, rerender } = createFormComponent({ schema: nullOptionSchema, defaultFormStateBehavior: {} });

    await switchToNullOption(node);
    rerender({ schema: nullOptionSchema, defaultFormStateBehavior: { requiredBooleanDefault: undefined } });

    expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
  });
  it('should not re-derive it for a defaultFormStateBehavior rebuilt with the same settings', async () => {
    // The settings hold a function written inline, which only `deepEquals()` sees as unchanged
    const settings = (): DefaultFormStateBehavior => ({ arrayMinItems: { computeSkipPopulate: () => false } });
    const { node, rerender } = createFormComponent({ schema: nullOptionSchema, defaultFormStateBehavior: settings() });

    await switchToNullOption(node);
    rerender({ schema: nullOptionSchema, defaultFormStateBehavior: settings() });

    expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
  });
});

// Ported from #5043's `toIChangeEvent` cases: an event is built from the form's state, which holds much more than an
// `IChangeEvent` describes, so none of that internal state may leak into it
it('onChange and onSubmit events carry only the public IChangeEvent members', async () => {
  const { node, onChange, onSubmit } = createFormComponent({
    schema: { type: 'object', properties: { name: { type: 'string' } } },
  });

  await user.type(screen.getByRole('textbox'), 'x');
  await submitForm(node, user);

  const members = ['errorSchema', 'errors', 'formData', 'schema', 'schemaUtils', 'uiSchema'];
  expect(Object.keys(onChange.mock.lastCall?.[0] ?? {}).sort()).toEqual(members);
  expect(Object.keys(onSubmit.mock.lastCall?.[0] ?? {}).sort()).toEqual([...members, 'status'].sort());
});
