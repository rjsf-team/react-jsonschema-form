import { createRef } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { noop } from '@rjsf/utils';
import validator, { customizeValidator } from '@rjsf/validator-ajv8';
import userEvent from '@testing-library/user-event';
import draft06 from 'ajv/lib/refs/json-schema-draft-06.json';
import { createPortal } from 'react-dom';

import type { FormProps } from '../src/index.ts';
import Form from '../src/index.ts';
import {
  expectToHaveBeenCalledWithFormData,
  setupConsoleErrorSuppression,
  submitForm,
  describeRepeated,
} from './testUtils.tsx';

const user = userEvent.setup();
const renderErrorSuppression = setupConsoleErrorSuppression();

describeRepeated('Form common: form props and updates', (createFormComponent) => {
  describe('Schema and formData updates', () => {
    // https://github.com/rjsf-team/react-jsonschema-form/issues/231
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };

    it('should replace state when props remove formData keys', async () => {
      const formData = { foo: 'foo', bar: 'bar' };
      const { node, onChange, rerender } = createFormComponent({
        ref: createRef(),
        schema,
        formData,
      });

      rerender({
        onChange,
        schema: {
          type: 'object',
          properties: {
            bar: { type: 'string' },
          },
        },
        formData: { bar: 'bar' },
      });

      await user.clear(node.querySelector('#root_bar')!);
      await user.type(node.querySelector('#root_bar')!, 'baz');

      expectToHaveBeenCalledWithFormData(onChange, { bar: 'baz' }, 'root_bar');
    });

    it('should replace state when props change formData keys', async () => {
      const formData = { foo: 'foo', bar: 'bar' };
      const { node, onChange, rerender } = createFormComponent({
        ref: createRef(),
        schema,
        formData,
      });

      rerender({
        onChange,
        schema: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            baz: { type: 'string' },
          },
        },
        formData: { foo: 'foo', baz: 'bar' },
      });

      await user.clear(node.querySelector('#root_baz')!);
      await user.type(node.querySelector('#root_baz')!, 'baz');

      expectToHaveBeenCalledWithFormData(onChange, { foo: 'foo', baz: 'baz' }, 'root_baz');
    });
  });
  describe('Form disable prop', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', bar: 'bar' };

    it('should enable all items', () => {
      const { node } = createFormComponent({ schema, formData });

      expect(node.querySelectorAll('input:disabled')).toHaveLength(0);
    });

    it('should disable all items', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        disabled: true,
      });

      expect(node.querySelectorAll('input:disabled')).toHaveLength(2);
    });

    it('should disable the submit button', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        disabled: true,
      });

      expect(node.querySelector("button[type='submit']")).toBeInTheDocument();
      expect(node.querySelector("button[type='submit']:disabled")).toBeInTheDocument();
    });

    it('disabling the submit button via ui:schema - ui:submitButtonOptions props is still possible', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        uiSchema: { 'ui:submitButtonOptions': { props: { disabled: true } } },
      });

      expect(node.querySelector("button[type='submit']")).toBeInTheDocument();
      expect(node.querySelector("button[type='submit']:disabled")).toBeInTheDocument();
    });

    it('disabling the submit button via ui:schema - ui:options, submitButtonOptions props is still possible', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        uiSchema: { 'ui:options': { submitButtonOptions: { submitText: 'hello', props: { disabled: true } } } },
      });

      expect(node.querySelector("button[type='submit']")).toBeInTheDocument();
      expect(node.querySelector("button[type='submit']")).toHaveTextContent('hello');
      expect(node.querySelector("button[type='submit']:disabled")).toBeInTheDocument();
    });

    it('if both ui:submitButtonProps and the main form disabled props are provided, and either of them are true, the button will be disabled', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        uiSchema: { 'ui:submitButtonOptions': { props: { disabled: false } } },
        disabled: true,
      });

      expect(node.querySelector("button[type='submit']")).toBeInTheDocument();
      expect(node.querySelector("button[type='submit']:disabled")).toBeInTheDocument();
    });

    it('if both ui:submitButtonProps and the main form disabled props are provided, but false, then submit button will not be disabled', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        uiSchema: { 'ui:submitButtonOptions': { props: { disabled: false } } },
        disabled: false,
      });

      expect(node.querySelector("button[type='submit']")).toBeInTheDocument();
      expect(node.querySelector("button[type='submit']:disabled")).not.toBeInTheDocument();
    });
  });

  describe('Form readonly prop', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'object', properties: { baz: { type: 'string' } } },
      },
    };
    const formData = { foo: 'foo', bar: { baz: 'baz' } };

    it('should not have any readonly items', () => {
      const { node } = createFormComponent({ schema, formData });

      expect(node.querySelectorAll('input:read-only')).toHaveLength(0);
    });

    it('should readonly all items', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        readonly: true,
      });

      expect(node.querySelectorAll('input:read-only')).toHaveLength(2);
    });
  });

  describe('Attributes', () => {
    const formProps: Omit<FormProps, 'validator'> = {
      schema: {},
      id: 'test-form',
      className: 'test-class other-class',
      name: 'testName',
      method: 'post',
      target: '_blank',
      action: '/users/list',
      autoComplete: 'off',
      enctype: 'multipart/form-data',
      acceptCharset: 'ISO-8859-1',
      noHtml5Validate: true,
    };

    let node: Element;

    beforeEach(() => {
      node = createFormComponent(formProps).node;
    });

    it('should set attr id of form', () => {
      expect(node.getAttribute('id')).toEqual(formProps.id);
    });

    it('should set attr class of form', () => {
      expect(node.getAttribute('class')).toEqual(formProps.className);
    });

    it('should set attr name of form', () => {
      expect(node).toHaveAttribute('name', formProps.name);
    });

    it('should set attr method of form', () => {
      expect(node.getAttribute('method')).toEqual(formProps.method);
    });

    it('should set attr target of form', () => {
      expect(node.getAttribute('target')).toEqual(formProps.target);
    });

    it('should set attr action of form', () => {
      expect(node.getAttribute('action')).toEqual(formProps.action);
    });

    it('should set attr enctype of form', () => {
      expect(node.getAttribute('enctype')).toEqual(formProps.enctype);
    });

    it('should set attr acceptCharset of form', () => {
      expect(node.getAttribute('accept-charset')).toEqual(formProps.acceptCharset);
    });

    it('should set attr novalidate of form', () => {
      expect(node.getAttribute('novalidate')).not.toBeNull();
    });
  });

  describe('Custom format updates, live validation', () => {
    it('Should update custom formats when customFormats is changed', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
      const formProps: Omit<FormProps, 'validator'> = {
        ref: createRef(),
        liveValidate: true,
        formData: {
          areaCode: '123455',
        },
        schema: {
          type: 'object',
          properties: {
            areaCode: {
              type: 'string',
              format: 'area-code',
            },
          },
        },
        uiSchema: {
          areaCode: {
            'ui:widget': 'area-code',
          },
        },
        widgets: {
          'area-code': () => <div id='custom' />,
        },
      };

      const customValidator = customizeValidator({
        customFormats: {
          'area-code': /^\d{3}$/,
        },
      });

      const { node, onError, rerender } = createFormComponent(formProps);

      await submitForm(node, user);
      expect(onError).not.toHaveBeenCalled();

      rerender(
        {
          ...formProps,
          onError,
        },
        customValidator,
      );

      await submitForm(node, user);
      expect(onError).toHaveBeenLastCalledWith([
        {
          message: 'must match format "area-code"',
          name: 'format',
          params: { format: 'area-code' },
          property: '.areaCode',
          schemaPath: '#/properties/areaCode/format',
          stack: '.areaCode must match format "area-code"',
          title: '',
        },
      ]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown format "area-code" ignored in schema at path "#/properties/areaCode"'),
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Meta schema updates', () => {
    it('Should update allowed meta schemas when additionalMetaSchemas is changed', async () => {
      const formProps: Omit<FormProps, 'validator'> = {
        ref: createRef(),
        schema: {
          $schema: 'http://json-schema.org/draft-06/schema#',
          type: 'string',
          minLength: 8,
          pattern: 'd+',
        },
        formData: 'short',
      };

      const { node, onError, rerender } = createFormComponent(formProps);

      await submitForm(node, user);
      expect(onError).toHaveBeenLastCalledWith([
        {
          stack: 'no schema with key or ref "http://json-schema.org/draft-06/schema#"',
        },
      ]);

      const customValidator = customizeValidator({
        additionalMetaSchemas: [draft06],
      });

      rerender(
        {
          ...formProps,
          onError,
        },
        customValidator,
      );

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
  });

  describe('Changing the tagName', () => {
    it('should render the component using the custom tag name', () => {
      const tagName = 'span';
      const { node } = createFormComponent({ schema: {}, tagName });
      expect(node.tagName).toEqual(tagName.toUpperCase());
    });

    it('should render the component using a ComponentType', () => {
      const Component = (props: any) => <div {...props} id='test' />;
      const { node } = createFormComponent({ schema: {}, tagName: Component });
      expect(node.id).toEqual('test');
      // React deduplicates this warning per component name — only fires on the first test iteration
      if (renderErrorSuppression.consoleSpy.mock.calls.length > 0) {
        expect(renderErrorSuppression.consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Function components cannot be given refs'),
          expect.any(String),
          expect.any(String),
        );
      }
    });
  });

  describe('Nested forms', () => {
    it('should call provided submit handler with form state', async () => {
      const innerOnSubmit = vi.fn();
      const outerOnSubmit = vi.fn();
      const innerRef = createRef<HTMLDivElement>();

      const ArrayTemplateWithForm = (_props: FormProps) => {
        const innerFormProps = {
          validator,
          schema: {},
          onSubmit: innerOnSubmit,
        };

        return createPortal(
          <div className='array' ref={innerRef}>
            <Form {...innerFormProps}>
              <button className='array-form-submit' type='submit'>
                Submit
              </button>
            </Form>
          </div>,
          document.body,
        );
      };

      createFormComponent({
        schema: {
          type: 'array',
          title: 'my list',
          description: 'my description',
          items: { type: 'string' },
        },
        formData: ['foo', 'bar'],
        templates: { ArrayFieldTemplate: ArrayTemplateWithForm },
        onSubmit: outerOnSubmit,
      });
      expect(innerRef).toBeDefined();
      expect(innerRef.current).not.toBeNull();
      const arrayForm = innerRef.current!.querySelector('form')!;
      const arraySubmit = arrayForm.querySelector<HTMLButtonElement>('.array-form-submit')!;

      await user.click(arraySubmit);

      expect(innerOnSubmit).toHaveBeenCalledTimes(1);
      expect(outerOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Dependencies', () => {
    it('should not give a validation error by duplicating enum values in dependencies', async () => {
      const schema: RJSFSchema = {
        title: 'A registration form',
        description: 'A simple form example.',
        type: 'object',
        properties: {
          type1: {
            type: 'string',
            title: 'Type 1',
            enum: ['FOO', 'BAR', 'BAZ'],
          },
          type2: {
            type: 'string',
            title: 'Type 2',
            enum: ['GREEN', 'BLUE', 'RED'],
          },
        },
        dependencies: {
          type1: {
            properties: {
              type1: {
                enum: ['FOO'],
              },
              type2: {
                enum: ['GREEN'],
              },
            },
          },
        },
      };
      const formData = {
        type1: 'FOO',
      };
      const { node, onError } = createFormComponent({ schema, formData });
      await submitForm(node, user);
      expect(onError).not.toHaveBeenCalled();
    });
    it('should show dependency defaults for uncontrolled components', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
        },
        dependencies: {
          firstName: {
            properties: {
              lastName: { type: 'string', default: 'Norris' },
            },
          },
        },
      };
      const { node } = createFormComponent({ schema });

      await user.type(node.querySelector('#root_firstName')!, 'Chuck');
      expect(node.querySelector('#root_lastName')).toHaveValue('Norris');
    });
  });
});
