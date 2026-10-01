import { createRef, useEffect } from 'react';
import type { DefaultFormStateBehavior, GenericObjectType, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { getTemplates, getUiOptions } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { act, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormProps, IChangeEvent } from '../src/index.ts';
import type Form from '../src/index.ts';
import { createFormComponent, expectToHaveBeenCalledWithFormData, submitForm, describeRepeated } from './testUtils.tsx';

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
      const ref = createRef<Form>();

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

      expect(formData).toEqual({ foo: 'bar2', baz: 'blah2' });
      // One id per updated component; the defaults the seed was given are not reported
      expect(ids).toEqual(['root_foo', 'root_baz']);
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
        defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' },
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
        const ref = createRef<Form>();
        const props = {
          schema: invalidDefaultSchema,
          defaultFormStateBehavior,
          liveValidate: 'onChange',
          ref,
        } as const;
        const { node, rerender } = createFormComponent(props);

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');
        const errorsBeforeTheChange = ref.current!.state.errors;
        rerender({ ...props, uiSchema: { 'ui:disabled': true } });

        expect(node.querySelector<HTMLSelectElement>('#root__oneof_select')).toHaveValue('1');
        expect(ref.current!.state.errors).toEqual(errorsBeforeTheChange);
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
        defaultFormStateBehavior: { emptyObjectFields: 'populateAllDefaults' } as const,
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
    it('should clear the errors of an uncontrolled form when noValidate is turned on', () => {
      const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
      const ref = createRef<Form>();
      const { rerender } = createFormComponent({ schema, ref });
      act(() => {
        ref.current!.validateForm();
      });
      expect(ref.current!.state.errors).toHaveLength(1);

      // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
      rerender({ schema, ref, noValidate: true });

      expect(ref.current!.state.errors).toHaveLength(0);
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
      const { node, onError } = createFormComponent({ schema, formData });

      await submitForm(node, user);

      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});

// A parent-owned form generates no default, on mount or on any later prop change: the parent owns the value and the
// value includes its defaults, so re-deriving the data is the self-owned form's alone and runs under that owner only
describe('Form: the prop changes a self-owned form re-derives its data for', () => {
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
