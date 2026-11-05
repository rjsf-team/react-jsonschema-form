import type { ReactNode } from 'react';
import { Component, StrictMode, createRef, startTransition, useEffect, useLayoutEffect, useState } from 'react';
import type { ErrorSchema, GenericObjectType, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { getTemplate, getUiOptions } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Ajv2020 from 'ajv/dist/2020';

import type { FormProps, IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';
import { expectToHaveBeenCalledWithFormData, submitForm, describeRepeated } from './testUtils.tsx';

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
        formData,
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
        formData,
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
        schema: { type } as RJSFSchema,
        formData,
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
        formData: 0 as unknown as boolean,
      });

      await submitForm(node, user);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Change handler', () => {
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
        formData,
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

      const { onChange, rerender } = createFormComponent({ ref: createRef(), schema, formData: { foo: 'bar1' } });

      rerender({ schema, formData: {}, onChange });

      expect(onChange).toHaveBeenCalledTimes(1);

      rerender({ schema, formData: { foo: 'bar2' } });

      rerender({ schema, formData: {}, onChange: secondOnChange });

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
        const BaseInputTemplate = getTemplate('BaseInputTemplate', registry, uiOptions);
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
        const BaseInputTemplate = getTemplate('BaseInputTemplate', registry, uiOptions);
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
        formData = { ...formData, ...fd };
        ids.push(id);
      };
      createFormComponent({
        schema,
        formData,
        onChange,
        uiSchema,
      });

      await waitFor(() => {
        expect(ids).toHaveLength(3);
      });

      expect(formData).toEqual({ foo: 'bar2', baz: 'blah2' });
      // There will be 3 ids, undefined for the setting of the defaults and then the two updated components
      expect(ids).toEqual([undefined, 'root_foo', 'root_baz']);
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

        // fireEvent, since user-event finishes a click asynchronously and this checks the burst lands before it returns
        fireEvent.click(node.querySelector('button')!);

        expect(onChange).toHaveBeenCalledTimes(40);
        expectToHaveBeenCalledWithFormData(onChange, { foo: 'value 40' }, 'root_foo');
      });
      it('should not throw and should report every change after many changes to different fields', async () => {
        const ref = createRef<Form>();
        const { onChange } = createFormComponent({ ref, schema });
        onChange.mockClear();

        await act(async () => {
          for (let i = 1; i <= 60; i++) {
            ref.current!.setFieldValue(i % 2 ? 'foo' : 'baz', `value ${i}`);
          }
        });

        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(60));
        expect(onChange.mock.calls.map(([, id]) => id)).toEqual(
          Array.from({ length: 60 }, (_, i) => (i % 2 ? 'root_baz' : 'root_foo')),
        );
        expectToHaveBeenCalledWithFormData(onChange, { foo: 'value 59', baz: 'value 60' }, 'root_baz');
      });
      it('should live validate the last value of a burst', async () => {
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
        const errorsAfter = async (values: string[]) => {
          const { node, onChange } = createFormComponent({
            schema: minLengthSchema,
            liveValidate: true,
            uiSchema: { foo: { 'ui:widget': sendWidget(values) } },
          });
          onChange.mockClear();
          await user.click(node.querySelector('button')!);
          expect(onChange).toHaveBeenCalledTimes(values.length);
          return onChange.mock.lastCall![0].errors.map(({ property }: { property: string }) => property);
        };

        expect(await errorsAfter(shortLast)).toEqual(['.foo']);
        expect(await errorsAfter(longLast)).toEqual([]);
      });
    });
    it('should keep the form mounted and taking changes when a change throws', () => {
      vi.useFakeTimers();
      try {
        const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
          customValidate: (formData, errors) => {
            if (formData?.foo === 'boom') {
              throw new Error('customValidate failed');
            }
            return errors;
          },
        });
        onChange.mockClear();

        // fireEvent throughout, since user-event waits on timers, which hang under the fake timers flushing the rethrow
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
          liveValidate: true,
          uiSchema: { foo: { 'ui:widget': SendWidget } },
          customValidate: (formData, errors) => {
            if (formData?.foo === 'boom') {
              throw new Error('customValidate failed');
            }
            return errors;
          },
        });
        onChange.mockClear();

        // fireEvent, since user-event waits on timers, which hang under the fake timers flushing the rethrow
        fireEvent.click(node.querySelector('button')!);

        expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
        expect(onChange.mock.calls.map(([event]) => event.formData.foo)).toEqual(['value 1', 'value 2']);
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
              <button
                type='button'
                id={`${id}_raise`}
                onClick={() => onChange(value, { __errors: [error] } as ErrorSchema)}
              >
                raise
              </button>
            );
          };
        let isTransformFailing = false;
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
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

        // fireEvent throughout, since user-event waits on timers, which hang under the fake timers flushing the rethrow
        fireEvent.click(node.querySelector('#root_baz_raise')!);
        isTransformFailing = true;
        fireEvent.click(node.querySelector('#root_foo_raise')!);
        expect(() => vi.runOnlyPendingTimers()).toThrow('transformErrors failed');
        isTransformFailing = false;
        onChange.mockClear();
        fireEvent.change(node.querySelector('#root_qux')!, { target: { value: 'fine' } });

        expectToHaveBeenCalledWithFormData(onChange, { baz: 'kept', qux: 'fine' }, 'root_qux');
        expect(onChange.mock.lastCall![0].errors.map(({ message }: { message: string }) => message)).toEqual([
          'raised on baz',
        ]);
      } finally {
        vi.useRealTimers();
      }
    });
    it('should keep a custom error when the change clearing it throws', () => {
      vi.useFakeTimers();
      try {
        const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, qux: { type: 'string' } } };
        const FooWidget = ({ onChange }: WidgetProps) => (
          <>
            <button
              type='button'
              id='raise'
              onClick={() => onChange('raised', { __errors: ['raised on foo'] } as ErrorSchema)}
            >
              raise
            </button>
            <button type='button' id='edit' onClick={() => onChange('boom')}>
              edit
            </button>
          </>
        );
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
          uiSchema: { foo: { 'ui:widget': FooWidget } },
          customValidate: (formData, errors) => {
            if (formData?.foo === 'boom') {
              throw new Error('customValidate failed');
            }
            return errors;
          },
        });

        // fireEvent throughout, since user-event waits on timers, which hang under the fake timers flushing the rethrow
        fireEvent.click(node.querySelector('#raise')!);
        fireEvent.click(node.querySelector('#edit')!);
        expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
        onChange.mockClear();
        fireEvent.change(node.querySelector('#root_qux')!, { target: { value: 'fine' } });

        expectToHaveBeenCalledWithFormData(onChange, { foo: 'raised', qux: 'fine' }, 'root_qux');
        expect(onChange.mock.lastCall![0].errors.map(({ message }: { message: string }) => message)).toEqual([
          'raised on foo',
        ]);
      } finally {
        vi.useRealTimers();
      }
    });
    it('should live validate the changes before the last change of a burst when that change throws', () => {
      vi.useFakeTimers();
      try {
        const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
        const SendWidget = ({ onChange }: WidgetProps) => (
          <button type='button' onClick={() => ['a', 'boom'].forEach((v) => onChange(v))}>
            send
          </button>
        );
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
          uiSchema: { foo: { 'ui:widget': SendWidget } },
          customValidate: (formData, errors) => {
            if (formData?.foo === 'boom') {
              throw new Error('customValidate failed');
            }
            return errors;
          },
        });
        onChange.mockClear();

        // fireEvent, since user-event waits on timers, which hang under the fake timers flushing the rethrow
        fireEvent.click(node.querySelector('button')!);

        expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
        const [lastEvent, lastId] = onChange.mock.lastCall!;
        expect(lastId).toBeUndefined();
        expect(lastEvent.formData).toEqual({ foo: 'a' });
        expect(lastEvent.errors.map(({ property }: { property: string }) => property)).toEqual(['.foo']);
        expect(node.querySelectorAll('#root_foo__error li')).toHaveLength(1);
      } finally {
        vi.useRealTimers();
      }
    });
    it('should last report both changes when a change in a transition commits after a later urgent one', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, baz: { type: 'string' } } };
      const ref = createRef<Form>();
      const { onChange } = createFormComponent({ ref, schema });
      onChange.mockClear();

      await act(async () => {
        startTransition(() => ref.current!.setFieldValue('foo', 'in transition'));
        ref.current!.setFieldValue('baz', 'urgent');
      });

      expect(onChange.mock.calls.map(([event]) => event.formData)).toEqual([
        { baz: 'urgent' },
        { foo: 'in transition', baz: 'urgent' },
      ]);
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
        experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' },
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
      const lastFormData = onChangeCalls[onChangeCalls.length - 1].event.formData;
      expect(lastFormData.types).toEqual('advanced');
      expect(lastFormData.content).toEqual('placeholder');
    });
    it('should allow switching to null option in oneOf', async () => {
      // This test verifies that switching to a null option in oneOf works correctly.
      // Without the fix, the form would revert back to the previous option.
      // NOTE: This bug only manifests in controlled forms where parent updates formData prop.
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
        experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' },
      });

      // Should start with "Advanced Configuration" (index 1)
      expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')!.value).toEqual('1');
      expect(node.querySelector('#root_content')).toBeInTheDocument();

      // Switch to "No Configuration" (null option, index 2)
      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '2');

      // Simulate controlled form behavior by re-rendering with new formData
      rerender({
        ref: createRef(),
        schema,
        formData: currentFormData,
        experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' },
      });

      // BUG: Without the fix, the form would revert back to index 1
      expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')!.value).toEqual('2');
      // Content field should not exist for null option
      expect(node.querySelector('#root_content')).not.toBeInTheDocument();

      // Verify formData is null or undefined (both valid for null option)
      const lastFormData = onChangeCalls[onChangeCalls.length - 1].event.formData;
      expect(lastFormData == null).toBe(true);
    });
    it('should apply a schema derived from the changed formData when it adds a property with a default', async () => {
      const getSchema = (formData?: { trigger?: string }): RJSFSchema => ({
        type: 'object',
        properties: {
          trigger: { type: 'string', title: 'Trigger' },
          ...(formData?.trigger === 'show' ? { extra: { type: 'string', title: 'Extra', default: 'preset' } } : {}),
        },
      });
      let currentFormData: { trigger?: string } = {};

      const { node, rerender } = createFormComponent({
        schema: getSchema(currentFormData),
        formData: currentFormData,
        onChange: (event: IChangeEvent) => {
          currentFormData = event.formData;
        },
      });

      await user.type(node.querySelector<HTMLInputElement>('#root_trigger')!, 'show');
      rerender({ schema: getSchema(currentFormData), formData: currentFormData });

      expect(node.querySelector<HTMLInputElement>('#root_extra')).toHaveValue('preset');
    });
    it('should apply a schema change that adds a property with a default after a change to an uncontrolled form', async () => {
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
      const experimental_defaultFormStateBehavior = { emptyObjectFields: 'populateAllDefaults' } as const;
      const uiSchema: UiSchema = { 'ui:disabled': true };

      it('uncontrolled', async () => {
        const { node, rerender } = createFormComponent({ schema, experimental_defaultFormStateBehavior });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');
        rerender({ schema, experimental_defaultFormStateBehavior, uiSchema });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toBeDisabled();
        expect(node.querySelector('#root_content')).not.toBeInTheDocument();
      });
      it('controlled', async () => {
        let currentFormData: unknown;
        const onChange = (event: IChangeEvent) => {
          currentFormData = event.formData;
        };
        const { node, rerender } = createFormComponent({ schema, experimental_defaultFormStateBehavior, onChange });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');
        rerender({ schema, formData: currentFormData, experimental_defaultFormStateBehavior, onChange });
        rerender({ schema, formData: currentFormData, experimental_defaultFormStateBehavior, onChange, uiSchema });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toBeDisabled();
      });
      it('controlled, with the parent storing the emitted undefined as null', async () => {
        let currentFormData: unknown;
        const onChange = (event: IChangeEvent) => {
          currentFormData = event.formData ?? null;
        };
        const { node, rerender } = createFormComponent({ schema, experimental_defaultFormStateBehavior, onChange });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');
        rerender({ schema, formData: currentFormData, experimental_defaultFormStateBehavior, onChange });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
        expect(node.querySelector('#root_content')).not.toBeInTheDocument();
      });
      it('controlled, with the parent spreading the emitted formData into a new object', async () => {
        let currentFormData: unknown;
        const onChange = (event: IChangeEvent) => {
          currentFormData = { ...event.formData };
        };
        const { node, rerender } = createFormComponent({ schema, experimental_defaultFormStateBehavior, onChange });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');
        rerender({ schema, formData: currentFormData, experimental_defaultFormStateBehavior, onChange });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
        expect(node.querySelector('#root_content')).not.toBeInTheDocument();
      });
      it('controlled, with the parent deferring its reply past an unrelated prop change', async () => {
        let currentFormData: unknown;
        const onChange = (event: IChangeEvent) => {
          currentFormData = { ...event.formData };
        };
        const { node, rerender } = createFormComponent({ schema, experimental_defaultFormStateBehavior, onChange });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');
        rerender({ schema, experimental_defaultFormStateBehavior, onChange, uiSchema });
        rerender({ schema, formData: currentFormData, experimental_defaultFormStateBehavior, onChange, uiSchema });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toBeDisabled();
        expect(node.querySelector('#root_content')).not.toBeInTheDocument();
      });
      it('uncontrolled, nested with sibling data', async () => {
        const nestedSchema: RJSFSchema = {
          type: 'object',
          properties: { other: { type: 'string', title: 'Other' }, cfg: schema },
        };
        const { node, rerender } = createFormComponent({ schema: nestedSchema, experimental_defaultFormStateBehavior });

        await user.type(node.querySelector<HTMLInputElement>('#root_other')!, 'x');
        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_cfg__oneof_select')!, '1');
        rerender({ schema: nestedSchema, experimental_defaultFormStateBehavior, uiSchema: { cfg: uiSchema } });

        expect(node.querySelector<HTMLSelectElement>('#root_cfg__oneof_select')).toHaveValue('1');
        expect(node.querySelector<HTMLSelectElement>('#root_cfg__oneof_select')).toBeDisabled();
        expect(node.querySelector('#root_cfg_content')).not.toBeInTheDocument();
        expect(node.querySelector<HTMLInputElement>('#root_other')).toHaveValue('x');
      });
      it('controlled, with liveValidate and the parent storing the emitted undefined as null', async () => {
        const invalidDefaultSchema: RJSFSchema = {
          ...schema,
          oneOf: [
            {
              type: 'object',
              properties: { types: { const: 'advanced' }, content: { type: 'string', minLength: 50 } },
              required: ['types'],
            },
            { title: 'No Configuration', type: 'null' },
          ],
        };
        let currentFormData: unknown;
        const onChange = (event: IChangeEvent) => {
          currentFormData = event.formData ?? null;
        };
        const ref = createRef<Form>();
        const props = {
          schema: invalidDefaultSchema,
          experimental_defaultFormStateBehavior,
          liveValidate: true,
          onChange,
          ref,
        };
        const { node, rerender } = createFormComponent(props);

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');
        const errorsBeforeReply = ref.current!.state.errors;
        rerender({ ...props, formData: currentFormData });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
        expect(ref.current!.state.errors).toEqual(errorsBeforeReply);
      });
    });
    it('should keep a form value set in the same render as an unrelated prop change', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const ref = createRef<Form>();
      const { node, rerender } = createFormComponent({ schema, ref });

      await user.type(node.querySelector<HTMLInputElement>('#root_name')!, 'a');
      act(() => {
        ref.current!.setFieldValue('name', 'x');
        rerender({ schema, ref, disabled: true });
      });

      expect(node.querySelector<HTMLInputElement>('#root_name')).toHaveValue('x');
    });
    it('should apply a formData prop change from a parent that ignores onChange', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' }, other: { type: 'string', default: 'defaulted' } },
      };
      const { node, rerender } = createFormComponent({ schema, formData: { name: 'a' }, onChange: () => {} });

      await user.type(node.querySelector<HTMLInputElement>('#root_name')!, 'x');
      rerender({ schema, formData: { name: 'loaded' }, onChange: () => {} });

      expect(node.querySelector<HTMLInputElement>('#root_name')).toHaveValue('loaded');
    });
    it('should apply a formData prop change matching data reported before the parent took over', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          other: { type: 'string', title: 'Other' },
          cfg: {
            type: 'object',
            oneOf: [
              { title: 'Advanced Configuration', type: 'object', properties: { types: { const: 'advanced' } } },
              { title: 'No Configuration', type: 'null' },
            ],
            default: { types: 'advanced' },
          },
        },
      };
      const props = {
        schema,
        experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' } as const,
        onChange: () => {},
      };
      const { node, rerender } = createFormComponent({
        ...props,
        formData: { other: 'A', cfg: { types: 'advanced' } },
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_cfg__oneof_select')!, '1');
      rerender({ ...props, formData: { other: 'B', cfg: { types: 'advanced' } } });
      rerender({ ...props, formData: { other: 'A' } });

      expect(node.querySelector<HTMLInputElement>('#root_other')).toHaveValue('A');
    });
    it('should apply a formData prop change that fills a subsection the form reported as absent', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          other: { type: 'string', title: 'Other' },
          cfg: {
            type: 'object',
            oneOf: [
              { title: 'Advanced Configuration', type: 'object', properties: { types: { const: 'advanced' } } },
              { title: 'No Configuration', type: 'null' },
            ],
            default: { types: 'advanced' },
          },
        },
      };
      let currentFormData: unknown;
      const props = {
        schema,
        experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' } as const,
        onChange: (event: IChangeEvent) => {
          currentFormData = event.formData;
        },
      };
      const { node, rerender } = createFormComponent({ ...props, formData: { other: 'A' } });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_cfg__oneof_select')!, '1');
      rerender({ ...props, formData: currentFormData });
      rerender({ ...props, formData: { other: 'A', cfg: {} } });

      expect(node.querySelector<HTMLSelectElement>('#root_cfg__oneof_select')).toHaveValue('0');
    });
    it('should apply a formData prop change made after the parent replied with the reported undefined', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        oneOf: [
          {
            title: 'Advanced Configuration',
            type: 'object',
            properties: { types: { const: 'advanced' } },
            required: ['types'],
          },
          { title: 'No Configuration', type: 'null' },
        ],
        default: { types: 'advanced' },
      };
      let currentFormData: unknown;
      const props = {
        schema,
        experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' } as const,
        onChange: (event: IChangeEvent) => {
          currentFormData = event.formData;
        },
      };
      const { node, rerender } = createFormComponent(props);

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');
      rerender({ ...props, formData: currentFormData });
      rerender({ ...props, formData: {} });

      expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('0');
    });
    it('should clear the errors of an uncontrolled form when noValidate is turned on', () => {
      const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
      const ref = createRef<Form>();
      const { rerender } = createFormComponent({ schema, ref });
      act(() => {
        ref.current!.validateForm();
      });
      expect(ref.current!.state.errors).toHaveLength(1);

      rerender({ schema, ref, noValidate: true });

      expect(ref.current!.state.errors).toHaveLength(0);
    });
    it('should apply the defaults of a changed experimental_defaultFormStateBehavior to echoed formData', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { nested: { type: 'object', properties: { foo: { type: 'string', default: 'bar' } } } },
      };
      const { node, rerender } = createFormComponent({
        schema,
        formData: {},
        experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
      });
      expect(node.querySelector<HTMLInputElement>('#root_nested_foo')).toHaveValue('');

      rerender({
        schema,
        formData: {},
        experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' },
      });

      expect(node.querySelector<HTMLInputElement>('#root_nested_foo')).toHaveValue('bar');
    });
    describe('should keep a switch to a null oneOf option when the echo recreates an identity-compared prop', () => {
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
      const experimental_defaultFormStateBehavior = { emptyObjectFields: 'populateAllDefaults' } as const;

      it('validator', async () => {
        let currentFormData: unknown;
        const { node, rerender } = createFormComponent({
          schema,
          experimental_defaultFormStateBehavior,
          onChange: (event: IChangeEvent) => {
            currentFormData = event.formData;
          },
        });
        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

        rerender({ schema, formData: currentFormData, experimental_defaultFormStateBehavior }, customizeValidator());

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
      });
      it('experimental_customMergeAllOf', async () => {
        let currentFormData: unknown;
        const { node, rerender } = createFormComponent({
          schema,
          experimental_defaultFormStateBehavior,
          experimental_customMergeAllOf: (allOfSchema: RJSFSchema) => allOfSchema,
          onChange: (event: IChangeEvent) => {
            currentFormData = event.formData;
          },
        });
        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

        rerender({
          schema,
          formData: currentFormData,
          experimental_defaultFormStateBehavior,
          experimental_customMergeAllOf: (allOfSchema: RJSFSchema) => allOfSchema,
        });

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
          experimental_defaultFormStateBehavior: {
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
      const { node } = createFormComponent({ schema, formData, onBlur });

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
      const { node } = createFormComponent({ schema, formData, onFocus });

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
      const { node, onError } = createFormComponent({ schema, formData });

      await submitForm(node, user);

      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});

// Each of these renders `Form` itself, through a parent, so the variants `describeRepeated` adds would not apply
describe('Form change handler under a parent', () => {
  it('should report the errors it shows when a StrictMode rerun of a change gets different errors', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    let runs = 0;
    const onChange = vi.fn();
    const { container } = render(
      <StrictMode>
        <Form
          schema={schema}
          validator={customizeValidator<GenericObjectType>()}
          liveValidate
          showErrorList={false}
          customValidate={(_, errors) => {
            runs += 1;
            errors.foo?.addError(`run ${runs}`);
            return errors;
          }}
          onChange={onChange}
        />
      </StrictMode>,
    );

    await user.type(container.querySelector('#root_foo')!, 'x');

    const shown = Array.from(container.querySelectorAll('#root_foo__error li'), (item) => item.textContent);
    expect(onChange.mock.lastCall![0].errors.map(({ message }: { message: string }) => message)).toEqual(shown);
  });
  it.each([
    ['clears its custom error', false],
    ['whose custom error was cleared changes again', true],
  ])('should keep the custom error another field raised when a field %s', async (_, isClearedFirst) => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string', minLength: 3 }, baz: { type: 'string' } },
    };
    const ReplaceWidget = ({ onChange }: WidgetProps) => (
      <button type='button' id='replace' onClick={() => onChange('a', { __errors: ['custom on foo'] } as ErrorSchema)}>
        replace
      </button>
    );
    const RaiseWidget = ({ onChange }: WidgetProps) => (
      <>
        <button type='button' id='raise' onClick={() => onChange('x', { __errors: ['custom on baz'] } as ErrorSchema)}>
          raise
        </button>
        <button type='button' id='edit' onClick={() => onChange('y')}>
          edit
        </button>
      </>
    );
    const onChange = vi.fn();
    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ foo: { 'ui:widget': ReplaceWidget }, baz: { 'ui:widget': RaiseWidget } }}
        validator={customizeValidator<GenericObjectType>()}
        formData={{ foo: 'a' }}
        onChange={onChange}
      />,
    );

    await submitForm(container, user);
    await user.click(container.querySelector('#raise')!);
    if (isClearedFirst) {
      await user.click(container.querySelector('#edit')!);
    }
    await user.click(container.querySelector('#replace')!);
    await user.click(container.querySelector('#edit')!);

    expect(onChange.mock.lastCall![0].errorSchema.foo.__errors).toEqual(['custom on foo']);
  });
  it('should merge in the custom errors a change raised under noValidate once validation is turned on', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, baz: { type: 'string' } } };
    const RaiseWidget = ({ onChange }: WidgetProps) => (
      <button type='button' id='raise' onClick={() => onChange('x', { __errors: ['custom on foo'] } as ErrorSchema)}>
        raise
      </button>
    );
    const onChange = vi.fn();
    const props = {
      schema,
      uiSchema: { foo: { 'ui:widget': RaiseWidget } },
      validator: customizeValidator<GenericObjectType>(),
      onChange,
    };
    // oxlint-disable-next-line typescript/no-deprecated -- `noValidate` is what the custom errors must survive
    const { container, rerender } = render(<Form {...props} noValidate />);

    await user.click(container.querySelector('#raise')!);
    rerender(<Form {...props} />);
    await user.type(container.querySelector('#root_baz')!, 'fine');

    expect(onChange.mock.lastCall![0].errors.map(({ message }: { message: string }) => message)).toEqual([
      'custom on foo',
    ]);
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
          liveValidate
          formData={formData}
          onChange={(e) => {
            reported.push(e.formData!.foo);
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
  it('should apply a change with the props the parent set in the same event', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
    const TypeWidget = ({ onChange, registry }: WidgetProps) => (
      <button
        type='button'
        onClick={() => {
          registry.formContext.enableLiveValidate();
          onChange('a');
        }}
      >
        type
      </button>
    );
    const onChange = vi.fn();
    function Parent() {
      const [liveValidate, setLiveValidate] = useState(false);
      return (
        <Form
          schema={schema}
          uiSchema={{ foo: { 'ui:widget': TypeWidget } }}
          validator={customizeValidator<GenericObjectType>()}
          formContext={{ enableLiveValidate: () => setLiveValidate(true) }}
          liveValidate={liveValidate}
          onChange={onChange}
        />
      );
    }
    const { container } = render(<Parent />);

    await user.click(container.querySelector('button')!);

    expect(onChange.mock.lastCall![0].errors.map(({ property }: { property: string }) => property)).toEqual(['.foo']);
  });
  it('should apply a change with the schema the parent set in the same event', async () => {
    const fooSchema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const barSchema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' }, bar: { type: 'string', default: 'bar default', minLength: 20 } },
    };
    const TypeWidget = ({ onChange, registry }: WidgetProps) => (
      <button
        type='button'
        onClick={() => {
          registry.formContext.addBar();
          onChange('a');
        }}
      >
        type
      </button>
    );
    const onChange = vi.fn();
    function Parent() {
      const [schema, setSchema] = useState(fooSchema);
      return (
        <Form
          schema={schema}
          uiSchema={{ foo: { 'ui:widget': TypeWidget } }}
          validator={customizeValidator<GenericObjectType>()}
          formContext={{ addBar: () => setSchema(barSchema) }}
          omitExtraData
          liveOmit
          liveValidate
          onChange={onChange}
        />
      );
    }
    const { container } = render(<Parent />);

    await user.click(container.querySelector('button')!);

    const changeEvent = onChange.mock.calls.find(([, id]) => id === 'root_foo');
    expect(changeEvent).toBeDefined();
    const [event] = changeEvent!;
    expect(event.formData).toEqual({ foo: 'a', bar: 'bar default' });
    expect(event.schema).toEqual(barSchema);
    expect(event.errors.map(({ property }: { property: string }) => property)).toEqual(['.bar']);
  });
  it('should not show a custom error raised under noValidate when the parent passes the data back', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const RaiseWidget = ({ onChange }: WidgetProps) => (
      <button type='button' onClick={() => onChange('x', { __errors: ['custom on foo'] } as ErrorSchema)}>
        raise
      </button>
    );
    function Parent() {
      const [formData, setFormData] = useState<GenericObjectType | undefined>({});
      return (
        <Form
          schema={schema}
          uiSchema={{ foo: { 'ui:widget': RaiseWidget } }}
          validator={customizeValidator<GenericObjectType>()}
          // oxlint-disable-next-line typescript/no-deprecated -- `noValidate` is what must hide the custom error
          noValidate
          formData={formData}
          onChange={(e) => setFormData(e.formData)}
        />
      );
    }
    const { container } = render(<Parent />);

    await user.click(container.querySelector('button')!);

    expect(container.querySelectorAll('.error-detail li, .panel.errors li')).toHaveLength(0);
  });
  it('should report the extraErrors the parent set in the same event as a change', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const TypeWidget = ({ onChange, registry }: WidgetProps) => (
      <button
        type='button'
        onClick={() => {
          registry.formContext.raiseExtra();
          onChange('a');
        }}
      >
        type
      </button>
    );
    const onChange = vi.fn();
    function Parent() {
      const [extraErrors, setExtraErrors] = useState<ErrorSchema | undefined>(undefined);
      return (
        <Form
          schema={schema}
          uiSchema={{ foo: { 'ui:widget': TypeWidget } }}
          validator={customizeValidator<GenericObjectType>()}
          formContext={{
            raiseExtra: () => setExtraErrors({ foo: { __errors: ['extra on foo'] } } as unknown as ErrorSchema),
          }}
          extraErrors={extraErrors}
          onChange={onChange}
        />
      );
    }
    const { container } = render(<Parent />);

    await user.click(container.querySelector('button')!);

    const changeEvent = onChange.mock.calls.find(([, id]) => id === 'root_foo');
    expect(changeEvent).toBeDefined();
    expect(changeEvent![0].errors.map(({ message }: { message: string }) => message)).toEqual(['extra on foo']);
  });
  it('should report each change of a burst with the errors from before the burst, not those of a later change', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
    const SendWidget = ({ onChange }: WidgetProps) => (
      <button type='button' onClick={() => ['abcd', 'a'].forEach((v) => onChange(v))}>
        send
      </button>
    );
    const onChange = vi.fn();
    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ foo: { 'ui:widget': SendWidget } }}
        validator={customizeValidator<GenericObjectType>()}
        liveValidate
        onChange={onChange}
      />,
    );
    onChange.mockClear();

    await user.click(container.querySelector('button')!);

    const reported = onChange.mock.calls.map(([event]) => [
      event.formData.foo,
      event.errors.map(({ property }: { property: string }) => property),
    ]);
    expect(reported).toEqual([
      ['abcd', []],
      ['a', ['.foo']],
    ]);
  });
  it('should not show a custom error raised under noValidate on blur or when extraErrors change', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const RaiseWidget = ({ id, onChange, onBlur }: WidgetProps) => (
      <>
        <button type='button' id='raise' onClick={() => onChange('x', { __errors: ['custom on foo'] } as ErrorSchema)}>
          raise
        </button>
        <button type='button' id='blur' onClick={() => onBlur(id, 'x')}>
          blur
        </button>
      </>
    );
    const props = {
      schema,
      uiSchema: { foo: { 'ui:widget': RaiseWidget } },
      validator: customizeValidator<GenericObjectType>(),
      liveValidate: 'onBlur' as const,
    };
    // oxlint-disable-next-line typescript/no-deprecated -- `noValidate` is what must hide the custom error
    const { container, rerender } = render(<Form {...props} noValidate />);

    await user.click(container.querySelector('#raise')!);
    await user.click(container.querySelector('#blur')!);
    expect(container).not.toHaveTextContent('custom on foo');

    const extraErrors = { foo: { __errors: ['extra on foo'] } } as unknown as ErrorSchema;
    // oxlint-disable-next-line typescript/no-deprecated -- `noValidate` is what must hide the custom error
    rerender(<Form {...props} noValidate extraErrors={extraErrors} />);
    expect(container).toHaveTextContent('extra on foo');
    expect(container).not.toHaveTextContent('custom on foo');
  });
  it.each([
    ['after the item with the error', ['a', 'b'], 0, 1],
    ['before the item with the error, which shifts it', ['a', 'b', 'c'], 1, 0],
  ])(
    'should drop extraErrors an array passed back on removing an item %s once the parent removes them',
    async (_, list, errorIndex, removeIndex) => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { list: { type: 'array', items: { type: 'string', minLength: 3 } } },
      };
      const validator = customizeValidator<GenericObjectType>();
      const extraErrors = { list: { [errorIndex]: { __errors: ['server'] } } } as unknown as ErrorSchema;
      const props = { schema, validator, formData: { list } };
      const { container, rerender } = render(<Form {...props} extraErrors={extraErrors} />);

      await submitForm(container, user);
      await user.click(container.querySelectorAll('.rjsf-array-item-remove')[removeIndex]);
      rerender(<Form {...props} extraErrors={undefined} />);

      expect(container).not.toHaveTextContent('server');
    },
  );
  it('should leave the errors as they were when a lone change throws', () => {
    vi.useFakeTimers();
    try {
      const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
      const onChange = vi.fn();
      const { container } = render(
        <Form
          schema={schema}
          validator={customizeValidator<GenericObjectType>()}
          formData={{ foo: 'a' }}
          liveValidate
          customValidate={(formData, errors) => {
            if (formData?.foo === 'boom') {
              throw new Error('customValidate failed');
            }
            return errors;
          }}
          onChange={onChange}
        />,
      );
      onChange.mockClear();

      // fireEvent, since user-event waits on timers, which hang under the fake timers flushing the rethrow
      fireEvent.change(container.querySelector('#root_foo')!, { target: { value: 'boom' } });

      expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
      expect(onChange).not.toHaveBeenCalled();
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it.each([
    ['the only change after it', []],
    ['the change after it, which follows a change before it', ['a']],
  ])('should not validate the data a reset put back when %s throws', (_, before: string[]) => {
    vi.useFakeTimers();
    try {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'string', minLength: 3, default: 'a' } },
      };
      const ref = createRef<Form>();
      const onChange = vi.fn();
      const { container } = render(
        <Form
          ref={ref}
          schema={schema}
          validator={customizeValidator<GenericObjectType>()}
          liveValidate
          customValidate={(formData, errors) => {
            if (formData?.foo === 'boom') {
              throw new Error('customValidate failed');
            }
            return errors;
          }}
          onChange={onChange}
        />,
      );
      onChange.mockClear();

      act(() => {
        before.forEach((value) => ref.current!.setFieldValue('foo', value));
        ref.current!.reset();
        ref.current!.setFieldValue('foo', 'boom');
      });

      expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
      // The changes before the reset and the reset itself, and no event validating what the reset put back
      expect(onChange).toHaveBeenCalledTimes(before.length + 1);
      expect(onChange.mock.lastCall![0].errors).toEqual([]);
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it.each([
    ['a burst, with liveValidate on blur', { liveValidate: 'onBlur' }, ['a', 'b']],
    ['a burst, with liveOmit on blur', { omitExtraData: true, liveOmit: 'onBlur' }, ['a', 'b']],
    ['a single change, with liveValidate on blur', { liveValidate: 'onBlur' }, ['b']],
  ] as const)('should keep %s made in the same event as a blur', async (_, props, values) => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
    const PickWidget = ({ id, onChange, onBlur, value }: WidgetProps) => (
      <>
        <output>{String(value)}</output>
        <button
          type='button'
          onClick={() => {
            values.forEach((picked) => onChange(picked));
            onBlur(id, values[values.length - 1]);
          }}
        >
          pick
        </button>
      </>
    );
    const { container } = render(
      <Form
        schema={schema}
        validator={customizeValidator<GenericObjectType>()}
        uiSchema={{ foo: { 'ui:widget': PickWidget } }}
        {...props}
      />,
    );

    await user.click(container.querySelector('button')!);

    expect(container.querySelector('output')).toHaveTextContent('b');
    if ('liveValidate' in props) {
      expect(container.querySelectorAll('#root_foo__error li')).toHaveLength(1);
    }
  });
  it('should validate the changes before a throwing change when a blur in the same event rebuilt the data', () => {
    vi.useFakeTimers();
    try {
      const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
      const ref = createRef<Form>();
      const { container } = render(
        <Form
          ref={ref}
          schema={schema}
          validator={customizeValidator<GenericObjectType>()}
          formData={{ foo: 'abcd', extra: 'dropped' }}
          liveValidate
          omitExtraData
          liveOmit='onBlur'
          customValidate={(formData, errors) => {
            if (formData?.foo === 'boom') {
              throw new Error('customValidate failed');
            }
            return errors;
          }}
        />,
      );

      act(() => {
        ref.current!.setFieldValue('foo', 'a');
        ref.current!.onBlur('root_foo', 'a');
        ref.current!.setFieldValue('foo', 'boom');
      });

      expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
      expect(container.querySelector('#root_foo')).toHaveValue('a');
      expect(container.querySelectorAll('#root_foo__error li')).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
  it('should omit extra data on blur with the schema the parent set in the same event', async () => {
    const narrow: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const wide: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'string' } } };
    const ref = createRef<Form>();
    const onChange = vi.fn();
    const Parent = () => {
      const [schema, setSchema] = useState(narrow);
      return (
        <>
          <button
            type='button'
            id='widen'
            onClick={() => {
              setSchema(wide);
              ref.current!.setFieldValue('bar', 'kept');
              ref.current!.onBlur('root_bar', 'kept');
            }}
          >
            widen
          </button>
          <Form
            ref={ref}
            schema={schema}
            validator={customizeValidator<GenericObjectType>()}
            omitExtraData
            liveOmit='onBlur'
            onChange={onChange}
          />
        </>
      );
    };
    const { container } = render(<Parent />);

    await user.click(container.querySelector('#widen')!);

    expect(container.querySelector('#root_bar')).toHaveValue('kept');
    expect(onChange.mock.lastCall![0].formData).toEqual({ bar: 'kept' });
  });
  it('should live validate a blur once under StrictMode, reporting the committed data', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
    const customValidate = vi.fn((_formData, errors) => errors);
    const ref = createRef<Form>();
    const onChange = vi.fn();
    render(
      <StrictMode>
        <Form
          ref={ref}
          schema={schema}
          validator={customizeValidator<GenericObjectType>()}
          formData={{ foo: 'a', extra: 'dropped' }}
          liveValidate='onBlur'
          omitExtraData
          liveOmit='onBlur'
          customValidate={customValidate}
          onChange={onChange}
        />
      </StrictMode>,
    );
    customValidate.mockClear();
    onChange.mockClear();

    act(() => ref.current!.onBlur('root_foo', 'a'));

    expect(customValidate).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.lastCall![0].formData).toBe(ref.current!.state.formData);
  });
  it.each([
    [
      'keeps the errors in their order',
      { foo: { __errors: ['foo server'] }, bar: { __errors: ['bar server'] } },
      false,
    ],
    ['adds no empty node where nothing was shown', undefined, true],
  ])(
    'should rebuild the errors at the path of a custom error an edit clears, and %s',
    async (_, extraErrors, toggle) => {
      const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'string' } } };
      const RaiseWidget = ({ onChange }: WidgetProps) => (
        <>
          <button type='button' id='raise' onClick={() => onChange('x', { __errors: ['custom'] } as ErrorSchema)}>
            raise
          </button>
          <button type='button' id='edit' onClick={() => onChange('xy')}>
            edit
          </button>
        </>
      );
      const onChange = vi.fn();
      const props = {
        schema,
        uiSchema: { foo: { 'ui:widget': RaiseWidget } },
        validator: customizeValidator<GenericObjectType>(),
        extraErrors: extraErrors as ErrorSchema | undefined,
        onChange,
      };
      // oxlint-disable-next-line typescript/no-deprecated -- `noValidate` is what hides the custom error
      const { container, rerender } = render(<Form {...props} noValidate={toggle} />);

      await user.click(container.querySelector('#raise')!);
      if (toggle) {
        // oxlint-disable-next-line typescript/no-deprecated -- `noValidate` is what hides the custom error
        rerender(<Form {...props} noValidate={false} />);
      }
      await user.click(container.querySelector('#edit')!);

      const [{ errorSchema, errors }] = onChange.mock.lastCall!;
      if (extraErrors) {
        expect(errors.map((error: { message: string }) => error.message)).toEqual(['foo server', 'bar server']);
      } else {
        expect(errors).toEqual([]);
        expect(errorSchema).toEqual({});
      }
    },
  );
  it.each([
    ['without', {}],
    ['with', { $id: 'https://example.com/kind.json' }],
  ])('should sanitize the data a change switches out of a 2020-12 schema %s an `$id`', (_, idProps) => {
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      ...idProps,
      type: 'object',
      $defs: { kind: { type: 'string', enum: ['a', 'b'] } },
      properties: { kind: { $ref: '#/$defs/kind' } },
      if: { properties: { kind: { const: 'a' } } },
      then: { properties: { x: { type: 'string' } } },
      else: { properties: { x: { type: 'number' } } },
    } as RJSFSchema;
    const ref = createRef<Form>();
    const onChange = vi.fn();
    render(
      <Form
        ref={ref}
        schema={schema}
        validator={customizeValidator<GenericObjectType>({ AjvClass: Ajv2020 })}
        formData={{ kind: 'a', x: 'hello' }}
        onChange={onChange}
      />,
    );

    act(() => ref.current!.setFieldValue('kind', 'b'));

    expect(onChange.mock.lastCall![0].formData).toEqual({ kind: 'b' });
  });
  it('should keep the errors a change reported when it was applied with a schema with an `$id` the parent set in the same event', async () => {
    const draft = 'https://json-schema.org/draft/2020-12/schema';
    const fooSchema = {
      $schema: draft,
      $id: 'https://example.com/foo.json',
      type: 'object',
      $defs: { text: { type: 'string' } },
      properties: { foo: { $ref: '#/$defs/text' } },
    } as RJSFSchema;
    const barSchema = {
      $schema: draft,
      $id: 'https://example.com/bar.json',
      type: 'object',
      $defs: { text: { type: 'string' } },
      properties: { foo: { $ref: '#/$defs/text' }, bar: { type: 'string', default: 'bar default', minLength: 20 } },
    } as RJSFSchema;
    const ref = createRef<Form>();
    const onChange = vi.fn();
    function Parent() {
      const [schema, setSchema] = useState(fooSchema);
      return (
        <>
          <button
            type='button'
            id='add-bar'
            onClick={() => {
              setSchema(barSchema);
              ref.current!.setFieldValue('foo', 'a');
            }}
          >
            add bar
          </button>
          <Form
            ref={ref}
            schema={schema}
            validator={customizeValidator<GenericObjectType>({ AjvClass: Ajv2020 })}
            liveValidate
            onChange={onChange}
          />
        </>
      );
    }
    const { container } = render(<Parent />);

    await user.click(container.querySelector('#add-bar')!);

    const [event] = onChange.mock.lastCall!;
    expect(event.errors.map(({ property }: { property: string }) => property)).toEqual(['.bar']);
    expect(ref.current!.state.errors.map(({ property }) => property)).toEqual(['.bar']);
    expect(container.querySelectorAll('#root_bar__error li')).toHaveLength(1);
  });
  it('should merge the extraErrors once when a change is applied with the schema the parent set in the same event', async () => {
    const narrow: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const wide: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'string' } } };
    const ref = createRef<Form>();
    function Parent() {
      const [schema, setSchema] = useState(narrow);
      return (
        <>
          <button
            type='button'
            id='widen'
            onClick={() => {
              setSchema(wide);
              ref.current!.setFieldValue('bar', 'y');
            }}
          >
            widen
          </button>
          <Form
            ref={ref}
            schema={schema}
            validator={customizeValidator<GenericObjectType>()}
            liveValidate
            extraErrors={{ bar: { __errors: ['server'] } } as unknown as ErrorSchema}
          />
        </>
      );
    }
    const { container } = render(<Parent />);

    await user.click(container.querySelector('#widen')!);

    expect(ref.current!.state.errors.map(({ message }) => message)).toEqual(['server']);
    expect(container.querySelectorAll('#root_bar__error li')).toHaveLength(1);
  });
  describe('errors reset by a new schema or noValidate', () => {
    const strict: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
    const loose: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    let parent: {
      setSchema: (schema: RJSFSchema) => void;
      setNoValidate: (noValidate: boolean) => void;
      setHelp: (help: string) => void;
    };
    function Parent({ liveValidate, initial }: { liveValidate: FormProps['liveValidate']; initial: string }) {
      const [schema, setSchema] = useState(strict);
      const [noValidate, setNoValidate] = useState(false);
      const [help, setHelp] = useState('before');
      const [formData, setFormData] = useState<GenericObjectType | undefined>({ foo: initial });
      parent = { setSchema, setNoValidate, setHelp };
      return (
        <Form
          schema={schema}
          uiSchema={{ foo: { 'ui:help': help } }}
          validator={customizeValidator<GenericObjectType>()}
          liveValidate={liveValidate}
          // oxlint-disable-next-line typescript/no-deprecated
          noValidate={noValidate}
          noHtml5Validate
          formData={formData}
          onChange={(event) => setFormData(event.formData)}
        />
      );
    }
    const shownErrors = (container: HTMLElement) => ({
      list: container.querySelectorAll('.panel-danger li').length,
      field: container.querySelectorAll('#root_foo__error li').length,
    });
    // Raises the `minLength` error the way each `liveValidate` value does: on the change, on a blur or on a submit
    const raiseError = async (container: HTMLElement, liveValidate: FormProps['liveValidate']) => {
      if (liveValidate === false) {
        await submitForm(container.querySelector('form')!, user);
      } else {
        await user.click(container.querySelector('#root_foo')!);
        await user.paste('b');
        await user.tab();
      }
      expect(shownErrors(container)).toEqual({ list: 1, field: 1 });
    };

    it.each<[FormProps['liveValidate']]>([[true], ['onBlur'], [false]])(
      'should not bring back the errors of the old schema when another prop changes, with liveValidate %s',
      async (liveValidate) => {
        const { container } = render(<Parent liveValidate={liveValidate} initial='a' />);
        await raiseError(container, liveValidate);

        act(() => parent.setSchema(loose));
        expect(shownErrors(container)).toEqual({ list: 0, field: 0 });

        act(() => parent.setHelp('after'));
        expect(shownErrors(container)).toEqual({ list: 0, field: 0 });
      },
    );

    it('should not bring back the error of a value fixed under noValidate when it is turned off', async () => {
      const { container } = render(<Parent liveValidate initial='a' />);
      await raiseError(container, true);

      act(() => parent.setNoValidate(true));
      await user.click(container.querySelector('#root_foo')!);
      await user.paste('cd');
      act(() => parent.setNoValidate(false));

      expect(shownErrors(container)).toEqual({ list: 0, field: 0 });
    });

    it('should bring back the errors of a submit when noValidate is turned off, with live validation off', async () => {
      const { container } = render(<Parent liveValidate={false} initial='a' />);
      await raiseError(container, false);

      act(() => parent.setNoValidate(true));
      expect(shownErrors(container)).toEqual({ list: 0, field: 0 });

      act(() => parent.setNoValidate(false));
      expect(shownErrors(container)).toEqual({ list: 1, field: 1 });
    });
  });
  it('should show the errors of a validateForm() a parent calls from an effect after a prop change, with liveValidate', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
    const ref = createRef<Form>();
    function Parent() {
      const [help, setHelp] = useState('before');
      const [formData, setFormData] = useState<GenericObjectType | undefined>({ foo: 'a' });
      useEffect(() => {
        if (help === 'after') {
          ref.current!.validateForm();
        }
      }, [help]);
      return (
        <>
          <button type='button' id='validate' onClick={() => setHelp('after')}>
            validate
          </button>
          <Form
            ref={ref}
            schema={schema}
            uiSchema={{ foo: { 'ui:help': help } }}
            validator={customizeValidator<GenericObjectType>()}
            liveValidate
            formData={formData}
            onChange={(event) => setFormData(event.formData)}
          />
        </>
      );
    }
    const { container } = render(<Parent />);

    await user.click(container.querySelector('#validate')!);

    expect(container.querySelectorAll('.panel-danger li')).toHaveLength(1);
    expect(container.querySelectorAll('#root_foo__error li')).toHaveLength(1);
  });
  it('should report a custom error to onSubmit when the parent sets extraErrors in the same event', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'string' } } };
    const RaiseWidget = ({ onChange }: WidgetProps) => (
      <button type='button' id='raise' onClick={() => onChange('x', { __errors: ['custom'] } as ErrorSchema)}>
        raise
      </button>
    );
    const ref = createRef<Form>();
    const onSubmit = vi.fn();
    function Parent() {
      const [extraErrors, setExtraErrors] = useState<ErrorSchema | undefined>();
      return (
        <>
          <button
            type='button'
            id='submit'
            onClick={() => {
              setExtraErrors({ bar: { __errors: ['server'] } } as unknown as ErrorSchema);
              ref.current!.submit();
            }}
          >
            submit
          </button>
          <Form
            ref={ref}
            schema={schema}
            uiSchema={{ foo: { 'ui:widget': RaiseWidget } }}
            validator={customizeValidator<GenericObjectType>()}
            extraErrors={extraErrors}
            onSubmit={onSubmit}
          />
        </>
      );
    }
    const { container } = render(<Parent />);

    await user.click(container.querySelector('#raise')!);
    await user.click(container.querySelector('#submit')!);

    const [{ errors }] = onSubmit.mock.lastCall!;
    expect(errors.map(({ message }: { message: string }) => message).sort()).toEqual(['custom', 'server']);
  });
  it('should keep the form mounted and still call onError when focusOnFirstError throws on submit', () => {
    vi.useFakeTimers();
    class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
      constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { failed: false };
      }

      static getDerivedStateFromError() {
        return { failed: true };
      }

      render() {
        const { failed } = this.state;
        const { children } = this.props;
        return failed ? <p id='failed'>failed</p> : children;
      }
    }
    try {
      const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
      const onError = vi.fn();
      const { container } = render(
        <Boundary>
          <Form
            schema={schema}
            validator={customizeValidator<GenericObjectType>()}
            formData={{ foo: 'a' }}
            focusOnFirstError={() => {
              throw new Error('focus failed');
            }}
            onError={onError}
          />
        </Boundary>,
      );

      // fireEvent, since user-event waits on timers, which hang under the fake timers flushing the rethrow
      fireEvent.submit(container.querySelector('form')!);

      expect(() => vi.runOnlyPendingTimers()).toThrow('focus failed');
      expect(container.querySelector('#failed')).not.toBeInTheDocument();
      expect(container.querySelector('#root_foo')).toBeInTheDocument();
      expect(onError).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
  it('should rethrow a throw from the rerun React makes when it rebases a change onto a transition', () => {
    vi.useFakeTimers();
    try {
      const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, baz: { type: 'string' } } };
      const ref = createRef<Form>();
      render(
        <Form
          ref={ref}
          schema={schema}
          validator={customizeValidator<GenericObjectType>()}
          liveValidate
          customValidate={(formData, errors) => {
            if (formData?.foo && formData?.baz) {
              throw new Error('customValidate failed');
            }
            return errors;
          }}
        />,
      );

      act(() => {
        startTransition(() => ref.current!.setFieldValue('foo', 'in transition'));
        ref.current!.setFieldValue('baz', 'urgent');
      });

      expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
    } finally {
      vi.useRealTimers();
    }
  });
  it('should keep the form mounted when the live validation of a blur throws', () => {
    vi.useFakeTimers();
    try {
      const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
      const { container } = render(
        <Form
          schema={schema}
          validator={customizeValidator<GenericObjectType>()}
          liveValidate='onBlur'
          customValidate={() => {
            throw new Error('customValidate failed');
          }}
        />,
      );

      // fireEvent, since user-event waits on timers, which hang under the fake timers flushing the rethrow
      fireEvent.blur(container.querySelector('#root_foo')!);

      expect(() => vi.runOnlyPendingTimers()).toThrow('customValidate failed');
      expect(container.querySelector('#root_foo')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
  it('should keep the changes made in the same event as a submit, and the errors they were live validated with', async () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
    const ref = createRef<Form>();
    const { container } = render(
      <Form ref={ref} schema={schema} validator={customizeValidator<GenericObjectType>()} liveValidate />,
    );

    await act(async () => {
      ref.current!.setFieldValue('foo', 'a');
      ref.current!.setFieldValue('foo', 'ab');
      ref.current!.submit();
    });

    expect(container.querySelector('#root_foo')).toHaveValue('ab');
    expect(container.querySelectorAll('#root_foo__error li')).toHaveLength(1);
  });
  it.each([
    ['an extraErrors message', 'Name taken', { foo: { __errors: ['Name taken'] } }, false],
    ['an AJV message', 'must NOT have fewer than 3 characters', undefined, true],
  ])(
    'should keep %s with the same text as a custom error an edit clears',
    async (_, message, extraErrors, isSubmitted) => {
      const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
      const RaiseWidget = ({ onChange }: WidgetProps) => (
        <>
          <button type='button' id='raise' onClick={() => onChange('x', { __errors: [message] } as ErrorSchema)}>
            raise
          </button>
          <button type='button' id='edit' onClick={() => onChange('xy')}>
            edit
          </button>
        </>
      );
      const onChange = vi.fn();
      const { container } = render(
        <Form
          schema={schema}
          uiSchema={{ foo: { 'ui:widget': RaiseWidget } }}
          validator={customizeValidator<GenericObjectType>()}
          extraErrors={extraErrors as ErrorSchema | undefined}
          onChange={onChange}
        />,
      );

      await user.click(container.querySelector('#raise')!);
      if (isSubmitted) {
        await submitForm(container, user);
      }
      await user.click(container.querySelector('#edit')!);

      const [{ errorSchema, errors }] = onChange.mock.lastCall!;
      expect(errorSchema.foo.__errors).toEqual([message]);
      expect(errors.map((error: { message: string }) => error.message)).toEqual([message]);
    },
  );
  it.each([
    ['submits a change that makes the data valid', true, ['ab', 'abcd']],
    ['submits a change that makes the data valid, without live validation', false, ['ab', 'abcd']],
    ['fails on a change that makes the data invalid', true, ['abcd', 'ab']],
    ['fails on a change that makes the data invalid, without live validation', false, ['abcd', 'ab']],
  ])('should validate the changes made in the same event as a submit, and %s', async (_, liveValidate, values) => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
    const ref = createRef<Form>();
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <>
        <button
          type='button'
          onClick={() => {
            values.forEach((value) => ref.current!.setFieldValue('foo', value));
            ref.current!.submit();
          }}
        >
          change and submit
        </button>
        <Form
          ref={ref}
          schema={schema}
          validator={customizeValidator<GenericObjectType>()}
          formData={{ foo: 'x', extra: 'dropped' }}
          omitExtraData
          liveValidate={liveValidate}
          onSubmit={onSubmit}
          onError={onError}
        />
      </>,
    );

    // From a click, since outside a browser event the changes have a lower priority than the submit event
    await user.click(container.querySelector('button[type="button"]')!);

    const last = values[values.length - 1];
    const isValid = last.length >= 3;
    expect(container.querySelector('#root_foo')).toHaveValue(last);
    expect(container.querySelectorAll('#root_foo__error li')).toHaveLength(isValid ? 0 : 1);
    expect(onSubmit).toHaveBeenCalledTimes(isValid ? 1 : 0);
    expect(onError).toHaveBeenCalledTimes(isValid ? 0 : 1);
    if (isValid) {
      const [event] = onSubmit.mock.lastCall!;
      expect(event.formData).toEqual({ foo: last });
      expect(event.errors).toEqual([]);
      expect(event.status).toBe('submitted');
    } else {
      expect(onError.mock.lastCall![0]).toHaveLength(1);
      expect(onError.mock.lastCall![0][0].property).toBe('.foo');
    }
  });
  it('should validate a submit with the schema the parent set in the same event', async () => {
    const strict: RJSFSchema = { type: 'object', properties: { foo: { type: 'string', minLength: 3 } } };
    const loose: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'string' } } };
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const ref = createRef<Form>();
    const Parent = () => {
      const [schema, setSchema] = useState(strict);
      return (
        <>
          <button
            type='button'
            onClick={() => {
              setSchema(loose);
              ref.current!.setFieldValue('foo', 'y');
              ref.current!.submit();
            }}
          >
            loosen
          </button>
          <Form
            ref={ref}
            schema={schema}
            validator={customizeValidator<GenericObjectType>()}
            formData={{ foo: 'x', bar: 'kept' }}
            omitExtraData
            onSubmit={onSubmit}
            onError={onError}
          />
        </>
      );
    };
    const { container } = render(<Parent />);

    await user.click(container.querySelector('button[type="button"]')!);

    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.lastCall![0].formData).toEqual({ foo: 'y', bar: 'kept' });
  });
  it.each([
    ['changes the type of', { bar: { type: 'number' } }],
    ['removes', {}],
  ] as const)(
    'should keep unrelated data in a change made in the same event as a schema that %s it',
    async (_, barProperties) => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      };
      const newSchema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, ...barProperties } };
      const TypeWidget = ({ onChange, registry }: WidgetProps) => (
        <button
          type='button'
          onClick={() => {
            registry.formContext.changeSchema();
            onChange('b');
          }}
        >
          type
        </button>
      );
      const onChange = vi.fn();
      function Parent() {
        const [schema, setSchema] = useState(oldSchema);
        const [formData, setFormData] = useState<GenericObjectType | undefined>({ foo: 'a', bar: 'x' });
        return (
          <Form
            schema={schema}
            uiSchema={{ foo: { 'ui:widget': TypeWidget } }}
            validator={customizeValidator<GenericObjectType>()}
            formContext={{ changeSchema: () => setSchema(newSchema) }}
            formData={formData}
            onChange={(event, id) => {
              onChange(event, id);
              setFormData(event.formData);
            }}
          />
        );
      }
      const { container } = render(<Parent />);

      await user.click(container.querySelector('button')!);

      const changeEvent = onChange.mock.calls.find(([, id]) => id === 'root_foo');
      expect(changeEvent).toBeDefined();
      expect(changeEvent![0].formData).toEqual({ foo: 'b', bar: 'x' });
    },
  );
  it('should keep the errors a change reported when it was applied with the schema the parent set in the same event', async () => {
    const fooSchema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const barSchema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' }, bar: { type: 'string', default: 'bar default', minLength: 20 } },
    };
    const TypeWidget = ({ onChange, registry }: WidgetProps) => (
      <button
        type='button'
        onClick={() => {
          registry.formContext.addBar();
          onChange('a');
        }}
      >
        type
      </button>
    );
    const onChange = vi.fn();
    function Parent() {
      const [schema, setSchema] = useState(fooSchema);
      return (
        <Form
          schema={schema}
          uiSchema={{ foo: { 'ui:widget': TypeWidget } }}
          validator={customizeValidator<GenericObjectType>()}
          formContext={{ addBar: () => setSchema(barSchema) }}
          liveValidate
          onChange={onChange}
        />
      );
    }
    const { container } = render(<Parent />);

    await user.click(container.querySelector('button')!);

    const [event] = onChange.mock.lastCall!;
    expect(event.errors.map(({ property }: { property: string }) => property)).toEqual(['.bar']);
    expect(container.querySelectorAll('#root_bar__error li')).toHaveLength(1);
  });
});
