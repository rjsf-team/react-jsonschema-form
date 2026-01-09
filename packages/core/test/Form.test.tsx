import { Component, RefObject, createRef, useEffect, useState, useCallback } from 'react';
import { fireEvent, act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Portal } from 'react-portal';
import {
  getTemplate,
  getUiOptions,
  optionalControlsId,
  buttonId,
  bracketNameGenerator,
  dotNotationNameGenerator,
  FieldProps,
  FieldTemplateProps,
  RJSFSchema,
  UiSchema,
  ValidatorType,
  WidgetProps,
  ErrorSchema,
  FormValidation,
  Experimental_DefaultFormStateBehavior,
} from '@rjsf/utils';
import validator, { customizeValidator } from '@rjsf/validator-ajv8';

import Form, { FormProps, IChangeEvent } from '../src';
import {
  createComponent,
  createFormComponent,
  describeRepeated,
  expectToHaveBeenCalledWithFormData,
  NoValFormProps,
  renderNode,
  RerenderType,
  submitForm,
} from './testUtils';
import widgetsSchema from './widgets_schema.json';

const TWO_BUTTONS = (
  <>
    <button type='submit'>Submit</button>
    <button type='submit'>Another submit</button>
  </>
);
const user = userEvent.setup();

describeRepeated('Form common', (createFormComponent) => {
  describe('Empty schema', () => {
    it('Should throw error when Form is missing validator', () => {
      expect(() =>
        createComponent(Form, { ref: createRef(), schema: {}, validator: undefined as unknown as ValidatorType }),
      ).toThrow('A validator is required for Form functionality to work');
    });

    it('should render a form tag', () => {
      const { node } = createFormComponent({ ref: createRef(), schema: {} });

      expect(node.tagName).toEqual('FORM');
    });

    it('should render a submit button', () => {
      const { node } = createFormComponent({ ref: createRef(), schema: {} });

      expect(node.querySelectorAll('button[type=submit]')).toHaveLength(1);
    });

    it('should render children buttons', () => {
      const { node } = createFormComponent({
        ref: createRef(),
        schema: {},
        children: TWO_BUTTONS,
      });
      expect(node.querySelectorAll('button[type=submit]')).toHaveLength(2);
    });

    it("should render errors if schema isn't object", () => {
      const { node } = createFormComponent({
        ref: createRef(),
        schema: {
          type: 'object',
          title: 'object',
          properties: {
            firstName: 'some mame',
            address: {
              $ref: '#/definitions/address',
            },
          },
          definitions: {
            address: {
              street: 'some street',
            },
          },
        } as RJSFSchema,
      });
      expect(node.querySelector('.unsupported-field')).toHaveTextContent('Unknown field type undefined');
    });

    it('will render fallback ui when useFallbackUiForUnsupportedType is true', async () => {
      const schema = {
        type: 'object',
        title: 'object',
        properties: {
          unknownProperty: {
            type: 'someUnsupportedType',
          },
        },
      } as unknown as RJSFSchema;
      const props: NoValFormProps = {
        useFallbackUiForUnsupportedType: true,
        schema,
        formData: {
          unknownProperty: '123456',
        },
      };

      const { node, onChange } = createFormComponent({ ...props });

      expect(node.querySelectorAll('.unsupported-field')).toHaveLength(0);
      expect(node.querySelector('select')).toBeInTheDocument();
      let select = node.querySelector('select')!;
      let options = node.querySelectorAll<HTMLOptionElement>('select option');
      expect(options).toHaveLength(5);
      expect(options[0]).toHaveTextContent('string');
      expect(options[0].selected).toBe(true);
      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveAttribute('value', '123456');

      // Change the fallback type to 'number'
      await user.selectOptions(select, options[1]);
      expect(options[1]).toHaveTextContent('number');
      expect(options[1].selected).toBe(true);
      expect(node.querySelector<HTMLInputElement>('input[type=number]')).toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[type=number]')).toHaveAttribute('value', '123456');

      // Verify formData was casted to number
      expectToHaveBeenCalledWithFormData(onChange, { unknownProperty: 123456 }, 'root_unknownProperty');

      select = node.querySelector('select')!;
      options = node.querySelectorAll<HTMLOptionElement>('select option');
      // Change the fallback type to 'boolean'
      await user.selectOptions(select, options[2]);
      console.log('boolean', node.innerHTML);
      expect(options[2]).toHaveTextContent('boolean');
      expect(options[2].selected).toBe(true);
      expect(node.querySelector<HTMLInputElement>('input[type=checkbox]')).toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[type=checkbox]')).toBeChecked();
      // Verify formData was casted to number
      expectToHaveBeenCalledWithFormData(onChange, { unknownProperty: true }, 'root_unknownProperty');

      select = node.querySelector('select')!;
      options = node.querySelectorAll<HTMLOptionElement>('select option');
      // Change the fallback type to 'object'
      await user.selectOptions(select, options[3]);
      expect(options[3]).toHaveTextContent('object');
      expect(options[3].selected).toBe(true);
      let addButton = node.querySelector<HTMLButtonElement>('.rjsf-object-property-expand button');
      expect(addButton).toBeInTheDocument();
      // click the add button
      act(() => addButton!.click());

      // Verify formData was casted to object
      expectToHaveBeenCalledWithFormData(
        onChange,
        { unknownProperty: { newKey: 'New Value' } },
        'root_unknownProperty',
      );

      select = node.querySelector('select')!;
      options = node.querySelectorAll<HTMLOptionElement>('select option');
      // Change the fallback type to 'array'
      await user.selectOptions(select, options[4]);
      expect(options[4]).toHaveTextContent('array');
      expect(options[4].selected).toBe(true);
      addButton = node.querySelector<HTMLButtonElement>('.rjsf-array-item-add button');
      expect(addButton).toBeInTheDocument();
      // click the add button
      act(() => addButton!.click());

      // Verify formData was casted to array
      expectToHaveBeenCalledWithFormData(onChange, { unknownProperty: [undefined] }, 'root_unknownProperty');
    });
  });

  describe('on component creation', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'root object',
      required: ['count'],
      properties: {
        count: {
          type: 'number',
          default: 789,
        },
      },
    };

    describe('when props.formData does not equal the default values', () => {
      it('should call props.onChange with current state', () => {
        const formData = {
          foo: 123,
        };
        const { onChange } = createFormComponent({ schema, formData });
        expect(onChange).toHaveBeenCalledTimes(1);
        expectToHaveBeenCalledWithFormData(onChange, { ...formData, count: 789 });
      });
    });

    describe('when props.formData equals the default values', () => {
      it('should not call props.onChange', () => {
        const formData = {
          count: 789,
        };
        const { onChange } = createFormComponent({ schema, formData });
        expect(onChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('Option idPrefix', function () {
    it('should change the rendered ids', function () {
      const schema: RJSFSchema = {
        type: 'object',
        title: 'root object',
        required: ['foo'],
        properties: {
          count: {
            type: 'number',
          },
        },
      };
      const { node } = createFormComponent({ schema, idPrefix: 'rjsf' });
      const inputs = node.querySelectorAll('input');
      const ids = [];
      for (let i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).toEqual(['rjsf_count']);
      expect(node.querySelector('fieldset')).toHaveAttribute('id', 'rjsf');
    });
  });

  describe('Changing idPrefix', function () {
    it('should work with simple example', function () {
      const schema: RJSFSchema = {
        type: 'object',
        title: 'root object',
        required: ['foo'],
        properties: {
          count: {
            type: 'number',
          },
        },
      };
      const { node } = createFormComponent({ schema, idPrefix: 'rjsf' });
      const inputs = node.querySelectorAll('input');
      const ids = [];
      for (let i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).toEqual(['rjsf_count']);
      expect(node.querySelector('fieldset')).toHaveAttribute('id', 'rjsf');
    });

    it('should work with oneOf', function () {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          connector: {
            type: 'string',
            enum: ['aws', 'gcp'],
            title: 'Provider',
            default: 'aws',
          },
        },
        dependencies: {
          connector: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  connector: {
                    type: 'string',
                    enum: ['aws'],
                  },
                  key_aws: {
                    type: 'string',
                  },
                },
              },
              {
                type: 'object',
                properties: {
                  connector: {
                    type: 'string',
                    enum: ['gcp'],
                  },
                  key_gcp: {
                    type: 'string',
                  },
                },
              },
            ],
          },
        },
      };

      const { node } = createFormComponent({ schema, idPrefix: 'rjsf' });
      const inputs = node.querySelectorAll('input');
      const ids = [];
      for (let i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).toEqual(['rjsf_key_aws']);
    });
  });

  describe('Option idSeparator', function () {
    it('should change the rendered ids', function () {
      const schema: RJSFSchema = {
        type: 'object',
        title: 'root object',
        required: ['foo'],
        properties: {
          count: {
            type: 'number',
          },
        },
      };
      const { node } = createFormComponent({ schema, idSeparator: '.' });
      const inputs = node.querySelectorAll('input');
      const ids = [];
      for (let i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).toEqual(['root.count']);
    });
  });

  describe('Custom field template', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'root object',
      required: ['foo'],
      properties: {
        foo: {
          type: 'string',
          description: 'this is description',
          minLength: 32,
        },
      },
    };

    const uiSchema: UiSchema = {
      foo: {
        'ui:help': 'this is help',
      },
    };

    const formData = { foo: 'invalid' };

    function CustomFieldTemplate(props: FieldTemplateProps) {
      const {
        id,
        classNames,
        label,
        help,
        rawHelp,
        required,
        description,
        rawDescription,
        errors,
        rawErrors,
        children,
      } = props;
      return (
        <div className={'my-template ' + classNames}>
          <label htmlFor={id}>
            {label}
            {required ? '*' : null}
          </label>
          {description}
          {children}
          {errors}
          {help}
          <span className='raw-help'>{`${rawHelp} rendered from the raw format`}</span>
          <span className='raw-description'>{`${rawDescription} rendered from the raw format`}</span>
          {rawErrors ? (
            <ul>
              {rawErrors.map((error, i) => (
                <li key={i} className='raw-error'>
                  {error}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    let node: Element;

    beforeEach(() => {
      node = createFormComponent({
        schema,
        uiSchema,
        formData,
        templates: {
          FieldTemplate: CustomFieldTemplate,
        },
        liveValidate: true,
      }).node;
    });

    it('should use the provided field template', () => {
      expect(node.querySelector('.my-template')).toBeInTheDocument();
    });

    it('should use the provided template for labels', () => {
      expect(node.querySelector('.my-template > label')).toHaveTextContent('root object');
      expect(node.querySelector('.my-template .rjsf-field-string > label')).toHaveTextContent('foo*');
    });

    it('should pass description as the provided React element', () => {
      expect(node.querySelector('#root_foo__description')).toHaveTextContent('this is description');
    });

    it('should pass rawDescription as a string', () => {
      expect(node.querySelector('.raw-description')).toHaveTextContent(
        'this is description rendered from the raw format',
      );
    });

    it('should pass errors as the provided React component', () => {
      // live validate does not run on initial render anymore
      expect(node.querySelectorAll('.error-detail li')).toHaveLength(0);
      act(() => {
        fireEvent.change(node.querySelector<HTMLInputElement>('input')!, {
          target: { value: 'stillinvalid' },
        });
      });
      expect(node.querySelectorAll('.error-detail li')).toHaveLength(1);
    });

    it('should pass rawErrors as an array of strings', () => {
      // live validate does not run on initial render anymore
      expect(node.querySelectorAll('.raw-error')).toHaveLength(0);
      act(() => {
        fireEvent.change(node.querySelector<HTMLInputElement>('input')!, {
          target: { value: 'stillinvalid' },
        });
      });
      expect(node.querySelectorAll('.raw-error')).toHaveLength(1);
    });

    it('should pass help as a the provided React element', () => {
      expect(node.querySelector('.help-block')).toHaveTextContent('this is help');
    });

    it('should pass rawHelp as a string', () => {
      expect(node.querySelector('.raw-help')).toHaveTextContent('this is help rendered from the raw format');
    });
  });

  describe('ui options submitButtonOptions', () => {
    it('should not render a submit button', () => {
      const props: NoValFormProps = {
        schema: {},
        uiSchema: { 'ui:submitButtonOptions': { norender: true } },
      };
      const { node } = createFormComponent(props);
      expect(node.querySelectorAll('button[type=submit]')).toHaveLength(0);
    });

    it('should render a submit button with text Confirm', () => {
      const props: NoValFormProps = {
        schema: {},
        uiSchema: { 'ui:submitButtonOptions': { submitText: 'Confirm' } },
      };
      const { node } = createFormComponent(props);
      expect(node.querySelector('button[type=submit]')).toHaveTextContent('Confirm');
    });
  });

  describe('Custom submit buttons', () => {
    // Submit events on buttons are not fired on disconnected forms
    // So we need to add the DOM tree to the body in this case.
    // See: https://github.com/jsdom/jsdom/pull/1865
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected
    const domNode = document.createElement('div');
    beforeEach(() => {
      document.body.appendChild(domNode);
    });
    afterEach(() => {
      document.body.removeChild(domNode);
    });
    it('should submit the form when clicked', () => {
      const { node, onSubmit } = createFormComponent({ schema: {}, children: TWO_BUTTONS });
      const buttons = node.querySelectorAll<HTMLButtonElement>('button[type=submit]');
      expect(buttons).toHaveLength(2);
      act(() => buttons[0].click());
      act(() => buttons[1].click());
      expect(onSubmit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Schema definitions', () => {
    it('should use a single schema definition reference', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        $ref: '#/definitions/testdef',
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should handle multiple schema definition references', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef' },
          bar: { $ref: '#/definitions/testdef' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(2);
    });

    it('should handle deeply referenced schema definitions', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            properties: {
              bar: { $ref: '#/definitions/testdef' },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should handle references to deep schema definitions', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef/properties/bar' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should handle referenced definitions for array items', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: { $ref: '#/definitions/testdef' },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          foo: ['blah'],
        },
      });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should not crash with null values for property with additionalProperties', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          data: {
            additionalProperties: {
              type: 'string',
            },
            type: 'object',
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          data: null,
        },
      });

      expect(node).not.toBeNull();
    });

    it('should not crash with non-object values for property with additionalProperties', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          data1: {
            additionalProperties: {
              type: 'string',
            },
            type: 'object',
          },
          data2: {
            additionalProperties: {
              type: 'string',
            },
            type: 'object',
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          data1: 123,
          data2: ['one', 'two', 'three'],
        },
      });

      expect(node).not.toBeNull();
    });

    it('should raise for non-existent definitions referenced', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/nonexistent' },
        },
      };

      expect(() => createFormComponent({ schema })).toThrow(/#\/definitions\/nonexistent/);
    });

    it('should propagate referenced definition defaults', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' },
        },
        $ref: '#/definitions/testdef',
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveValue('hello');
    });

    it('should propagate nested referenced definition defaults', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveValue('hello');
    });

    it('should propagate referenced definition defaults for array items', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' },
        },
        type: 'array',
        items: {
          $ref: '#/definitions/testdef',
        },
      };

      const { node } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);

      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveValue('hello');
    });

    it('should propagate referenced definition defaults in objects with additionalProperties', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        additionalProperties: {
          $ref: '#/definitions/testdef',
        },
      };

      const { node } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.btn-add')!);

      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveValue('newKey');
    });

    it('should propagate referenced definition defaults in objects with additionalProperties that have a type present', () => {
      // Though `additionalProperties` has a `type` present here, it also has a `$ref` so that
      // referenced schema should override it.
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'number' },
        },
        type: 'object',
        additionalProperties: {
          type: 'string',
          $ref: '#/definitions/testdef',
        },
      };

      const { node } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.btn-add')!);

      expect(node.querySelector<HTMLInputElement>('input[type=number]')).toHaveValue(0);
    });

    it('should recursively handle referenced definitions', () => {
      const schema: RJSFSchema = {
        $ref: '#/definitions/node',
        definitions: {
          node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector('#root_children_0_name')).not.toBeInTheDocument();

      fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);

      expect(node.querySelector('#root_children_0_name')).toBeInTheDocument();
    });

    it('should follow recursive references', () => {
      const schema: RJSFSchema = {
        definitions: {
          bar: { $ref: '#/definitions/qux' },
          qux: { type: 'string' },
        },
        type: 'object',
        required: ['foo'],
        properties: {
          foo: { $ref: '#/definitions/bar' },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should follow multiple recursive references', () => {
      const schema: RJSFSchema = {
        definitions: {
          bar: { $ref: '#/definitions/bar2' },
          bar2: { $ref: '#/definitions/qux' },
          qux: { type: 'string' },
        },
        type: 'object',
        required: ['foo'],
        properties: {
          foo: { $ref: '#/definitions/bar' },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should priorize definition over schema type property', () => {
      // Refs bug #140
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          childObj: {
            type: 'object',
            $ref: '#/definitions/childObj',
          },
        },
        definitions: {
          childObj: {
            type: 'object',
            properties: {
              otherName: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(2);
    });

    it('should priorize local properties over definition ones', () => {
      // Refs bug #140
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            title: 'custom title',
            $ref: '#/definitions/objectDef',
          },
        },
        definitions: {
          objectDef: {
            type: 'object',
            title: 'definition title',
            properties: {
              field: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector('legend')).toHaveTextContent('custom title');
    });

    it('should propagate and handle a resolved schema definition', () => {
      const schema: RJSFSchema = {
        definitions: {
          enumDef: { type: 'string', enum: ['a', 'b'] },
        },
        type: 'object',
        properties: {
          name: { $ref: '#/definitions/enumDef' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('option')).toHaveLength(3);
    });
  });

  describe('Default value handling on clear', () => {
    const schema: RJSFSchema = {
      type: 'string',
      default: 'foo',
    };

    it('should not set default when a text field is cleared', () => {
      const { node } = createFormComponent({ schema, formData: 'bar' });

      fireEvent.change(node.querySelector<HTMLInputElement>('input')!, {
        target: { value: '' },
      });

      expect(node.querySelector<HTMLInputElement>('input')).toHaveValue('');
    });
  });

  describe('Defaults array items default propagation', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'lvl 1 obj',
      properties: {
        object: {
          type: 'object',
          title: 'lvl 2 obj',
          properties: {
            array: {
              type: 'array',
              items: {
                type: 'object',
                title: 'lvl 3 obj',
                properties: {
                  bool: {
                    type: 'boolean',
                    default: true,
                  },
                },
              },
            },
          },
        },
      },
    };

    it('should propagate deeply nested defaults to submit handler', () => {
      const { node, onSubmit } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
      fireEvent.submit(node);

      expectToHaveBeenCalledWithFormData(onSubmit, { object: { array: [{ bool: true }] } }, true);
    });
  });

  describe('Defaults additionalProperties propagation', () => {
    it('should submit string string map defaults', () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
        default: {
          foo: 'bar',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      expectToHaveBeenCalledWithFormData(onSubmit, { foo: 'bar' }, true);
    });

    it('should submit a combination of properties and additional properties defaults', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          x: {
            type: 'string',
          },
        },
        additionalProperties: {
          type: 'string',
        },
        default: {
          x: 'x default value',
          y: 'y default value',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      expectToHaveBeenCalledWithFormData(onSubmit, { x: 'x default value', y: 'y default value' }, true);
    });

    it('should submit a properties and additional properties defaults when properties default is nested', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          x: {
            type: 'string',
            default: 'x default value',
          },
        },
        additionalProperties: {
          type: 'string',
        },
        default: {
          y: 'y default value',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      expectToHaveBeenCalledWithFormData(onSubmit, { x: 'x default value', y: 'y default value' }, true);
    });

    it('should submit defaults when nested map has map values', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          x: {
            additionalProperties: {
              $ref: '#/definitions/objectDef',
            },
          },
        },
        definitions: {
          objectDef: {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          },
        },
        default: {
          x: {
            y: {
              z: 'x.y.z default value',
            },
          },
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await act(() => {
        fireEvent.submit(node);
      });

      expectToHaveBeenCalledWithFormData(onSubmit, { x: { y: { z: 'x.y.z default value' } } }, true);
    });

    it('should submit defaults when they are defined in a nested additionalProperties', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          x: {
            additionalProperties: {
              type: 'string',
              default: 'x.y default value',
            },
          },
        },
        default: {
          x: {
            y: {},
          },
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await act(() => {
        fireEvent.submit(node);
      });

      expectToHaveBeenCalledWithFormData(onSubmit, { x: { y: 'x.y default value' } }, true);
    });

    it('should submit defaults when additionalProperties is a boolean value', () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: true,
        default: {
          foo: 'bar',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      expectToHaveBeenCalledWithFormData(onSubmit, { foo: 'bar' }, true);
    });

    it('should NOT submit default values when additionalProperties is false', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
        additionalProperties: false,
        default: {
          foo: "I'm the only one",
          bar: "I don't belong here",
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      expectToHaveBeenCalledWithFormData(onSubmit, { foo: "I'm the only one" }, true);
    });
  });

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
      const event = { type: 'submit' };
      const { node, onSubmit } = createFormComponent({
        ref: createRef(),
        schema,
        formData,
      });

      await act(() => {
        fireEvent.submit(node, event);
      });
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

      await act(() => {
        fireEvent.submit(node);
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Change handler', () => {
    it('should call provided change handler on form state change with schema and uiSchema', () => {
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

      fireEvent.change(node.querySelector('[type=text]')!, {
        target: { value: 'new' },
      });

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

      const secondOnChange = jest.fn();

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
    it('should modify an allOf field when the defaults are set', () => {
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

      act(() => {
        fireEvent.change(node.querySelector(secondInputID)!, {
          target: { value: 'changed!' },
        });
      });

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
    it('should modify an oneOf field when the defaults are set', () => {
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

      act(() => {
        fireEvent.change(node.querySelector(secondInputID)!, {
          target: { value: 'changed!' },
        });
      });

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
    it('should modify an anyOf field when the defaults are set', () => {
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

      act(() => {
        fireEvent.change(node.querySelector(secondInputID)!, {
          target: { value: 'changed!' },
        });
      });

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
    it('Should modify anyOf definition references when the defaults are set.', () => {
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

      act(() => {
        fireEvent.change(node.querySelector(secondInputID)!, {
          target: { value: 'changed!' },
        });
      });

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
    it('Should modify oneOf object with references when the defaults are set.', () => {
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

      act(() => {
        fireEvent.change(node.querySelector(protocolInputID)!, {
          target: { value: '1' },
        });
      });

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

      it('Test with default constAsDefaults', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
        });

        expect(node.querySelector(notApplicableInputID)).toBeChecked();

        act(() => {
          fireEvent.click(node.querySelector(NoInputID)!);
        });

        expectToHaveBeenCalledWithFormData(onChange, { a: false }, 'root_a');

        expect(node.querySelector(NoInputID)).toBeChecked();
        expect(node.querySelector(notApplicableInputID)).not.toBeChecked();
        expect(node.querySelector('#root_b')).toBeInTheDocument();
      });
      it('Test with constAsDefaults set to "never"', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          experimental_defaultFormStateBehavior: {
            constAsDefaults: 'never',
          },
        });

        expect(node.querySelector(notApplicableInputID)).toBeChecked();

        act(() => {
          fireEvent.click(node.querySelector(NoInputID)!);
        });

        expectToHaveBeenCalledWithFormData(onChange, { a: false }, 'root_a');

        expect(node.querySelector(NoInputID)).toBeChecked();
        expect(node.querySelector(notApplicableInputID)).not.toBeChecked();
        expect(node.querySelector('#root_b')).toBeInTheDocument();
      });
    });
  });

  describe('Blur handler', () => {
    it('should call provided blur handler on form input blur event', () => {
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
      const onBlur = jest.fn();
      const { node } = createFormComponent({ schema, formData, onBlur });

      const input = node.querySelector('[type=text]')!;
      fireEvent.blur(input, {
        target: { value: 'new' },
      });

      expect(onBlur).toHaveBeenLastCalledWith(input.id, 'new');
    });
  });

  describe('Focus handler', () => {
    it('should call provided focus handler on form input focus event', () => {
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
      const onFocus = jest.fn();
      const { node } = createFormComponent({ schema, formData, onFocus });

      const input = node.querySelector('[type=text]')!;
      fireEvent.focus(input, {
        target: { value: 'new' },
      });

      expect(onFocus).toHaveBeenLastCalledWith(input.id, 'new');
    });
  });

  describe('Error handler', () => {
    it('should call provided error handler on validation errors', () => {
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

      fireEvent.submit(node);

      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Required and optional fields', () => {
    const schema: RJSFSchema = {
      definitions: {
        address: {
          type: 'object',
          properties: {
            street_address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
          },
          required: ['street_address', 'city', 'state'],
        },
      },
      type: 'object',
      properties: {
        billing_address: {
          title: 'Billing address',
          $ref: '#/definitions/address',
        },
        shipping_address: {
          title: 'Shipping address',
          $ref: '#/definitions/address',
        },
      },
      required: ['shipping_address'],
    };
    it('Errors when shipping address is not filled out, billing address is not needed', () => {
      const { node, onChange, onError } = createFormComponent({ schema });
      expectToHaveBeenCalledWithFormData(onChange, { shipping_address: {} });
      submitForm(node);
      expect(onError).toHaveBeenLastCalledWith([
        {
          message: "must have required property 'street_address'",
          name: 'required',
          params: { missingProperty: 'street_address' },
          property: '.shipping_address.street_address',
          schemaPath: '#/properties/shipping_address/required',
          stack: "must have required property 'street_address'",
          title: '',
        },
        {
          message: "must have required property 'city'",
          name: 'required',
          params: { missingProperty: 'city' },
          property: '.shipping_address.city',
          schemaPath: '#/properties/shipping_address/required',
          stack: "must have required property 'city'",
          title: '',
        },
        {
          message: "must have required property 'state'",
          name: 'required',
          params: { missingProperty: 'state' },
          property: '.shipping_address.state',
          schemaPath: '#/properties/shipping_address/required',
          stack: "must have required property 'state'",
          title: '',
        },
      ]);
    });
    it('Submits when shipping address is filled out, billing address is not needed', () => {
      const { node, onSubmit } = createFormComponent({
        schema,
        formData: {
          shipping_address: {
            street_address: '21, Jump Street',
            city: 'Babel',
            state: 'Neverland',
          },
        },
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(
        onSubmit,
        {
          shipping_address: {
            street_address: '21, Jump Street',
            city: 'Babel',
            state: 'Neverland',
          },
        },
        true,
      );
    });
  });

  describe('Default form state behavior flag', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        albums: {
          type: 'array',
          items: { type: 'string' },
          title: 'Album Titles',
          minItems: 3,
        },
      },
    };
    it('Errors when minItems is set, field is required, and minimum number of items are not present with IgnoreMinItemsUnlessRequired flag set', () => {
      const { node, onError } = createFormComponent({
        schema: { ...schema, required: ['albums'] },
        formData: {
          albums: ['Until We Have Faces'],
        },
        experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
      });
      submitForm(node);
      expect(onError).toHaveBeenLastCalledWith([
        {
          message: 'must NOT have fewer than 3 items',
          name: 'minItems',
          params: { limit: 3 },
          property: '.albums',
          schemaPath: '#/properties/albums/minItems',
          stack: "'Album Titles' must NOT have fewer than 3 items",
          title: 'Album Titles',
        },
      ]);
    });
    it('Submits when minItems is set, field is not required, and no items are present with IgnoreMinItemsUnlessRequired flag set', () => {
      const { node, onSubmit } = createFormComponent({
        schema,
        formData: {},
        experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, {}, true);
    });
  });

  describe('Schema and external formData updates', () => {
    let rerender: RerenderType;
    let onChangeProp: jest.Mock;
    let formProps: NoValFormProps;

    beforeEach(() => {
      formProps = {
        ref: createRef(),
        schema: {
          type: 'string',
          default: 'foobar',
        },
        formData: 'some value',
      };
      const { rerender: rerenderFn, onChange } = createFormComponent(formProps);
      onChangeProp = onChange;
      rerender = rerenderFn;
    });

    describe('when the form data is set to null', () => {
      beforeEach(() =>
        rerender({
          ...formProps,
          formData: null,
        }),
      );

      it('should call onChange', () => {
        expect(onChangeProp).toHaveBeenCalledTimes(1);
        expect(onChangeProp).toHaveBeenLastCalledWith(
          expect.objectContaining({
            edit: true,
            errorSchema: {},
            errors: [],
            formData: 'foobar',
            fieldPathId: { $id: 'root', path: [] },
            schema: formProps.schema,
            uiSchema: {},
            schemaUtils: expect.any(Object),
          }),
        );
      });
    });

    describe('when the schema default is changed but formData is not changed', () => {
      const newSchema: RJSFSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() =>
        rerender({
          ...formProps,
          schema: newSchema,
          formData: 'some value',
        }),
      );

      it('should not call onChange', () => {
        expect(onChangeProp).not.toHaveBeenCalled();
      });
    });

    describe('when the schema default is changed and formData is changed', () => {
      const newSchema: RJSFSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() =>
        rerender({
          ...formProps,
          schema: newSchema,
          formData: 'something else',
        }),
      );

      it('should not call onChange', () => {
        expect(onChangeProp).not.toHaveBeenCalled();
      });
    });

    describe('when the schema default is changed and formData is nulled', () => {
      const newSchema: RJSFSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() =>
        rerender({
          ...formProps,
          schema: newSchema,
          formData: null,
        }),
      );

      it('should call onChange', () => {
        expect(onChangeProp).toHaveBeenCalledTimes(1);
        expect(onChangeProp).toHaveBeenLastCalledWith(
          expect.objectContaining({
            schema: newSchema,
            formData: 'the new default',
          }),
        );
      });
    });

    describe('when the onChange prop sets formData to a falsey value', () => {
      function TestForm(props: { falseyValue: any }) {
        const [formData, setFormData] = useState<any>({});

        const onChange = useCallback(() => {
          setFormData(props.falseyValue);
        }, [props]);
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            value: {
              type: 'string',
            },
          },
        };
        return <Form onChange={onChange} schema={schema} formData={formData} validator={validator} />;
      }

      const falseyValues = [0, false, null, undefined, NaN];

      falseyValues.forEach((falseyValue) => {
        it("Should not crash due to 'Maximum call stack size exceeded...'", () => {
          // It is expected that this will throw an error due to non-matching propTypes,
          // so the error message needs to be inspected
          try {
            renderNode(TestForm, { falseyValue });
          } catch (e) {
            const { message } = e as Error;
            expect(message).not.toEqual('Maximum call stack size exceeded');
          }
        });
      });
    });
  });

  describe('External formData updates', () => {
    describe('root level', () => {
      const formProps: Omit<FormProps, 'validator'> = {
        ref: createRef(),
        schema: { type: 'string' },
      };

      it('should call submit handler with new formData prop value', async () => {
        const { node, onSubmit, rerender } = createFormComponent(formProps);

        rerender({
          ...formProps,
          onSubmit,
          formData: 'yo',
        });
        await act(() => submitForm(node));
        expectToHaveBeenCalledWithFormData(onSubmit, 'yo', true);
      });

      it('should validate formData when the schema is updated', async () => {
        const { node, onError, rerender } = createFormComponent(formProps);

        rerender({
          ...formProps,
          onError,
          formData: 'yo',
          schema: { type: 'number' },
        });
        await act(() => submitForm(node));
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must be number',
            name: 'type',
            params: { type: 'number' },
            property: '',
            schemaPath: '#/type',
            stack: 'must be number',
            title: '',
          },
        ]);
      });
    });

    describe('object level', () => {
      it('should call submit handler with new formData prop value', async () => {
        const formProps: Omit<FormProps, 'validator'> = {
          ref: createRef(),
          schema: { type: 'object', properties: { foo: { type: 'string' } } },
        };
        const { onSubmit, node, rerender } = createFormComponent(formProps);

        rerender({
          ...formProps,
          onSubmit,
          formData: { foo: 'yo' },
        });

        await act(() => submitForm(node));
        expectToHaveBeenCalledWithFormData(onSubmit, { foo: 'yo' }, true);
      });
    });

    describe('array level', () => {
      it('should call submit handler with new formData prop value', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'string',
          },
        };
        const { node, onSubmit, rerender } = createFormComponent({ ref: createRef(), schema });

        rerender({
          schema,
          onSubmit,
          formData: ['yo'],
        });

        await act(() => submitForm(node));
        expectToHaveBeenCalledWithFormData(onSubmit, ['yo'], true);
      });
    });
  });

  describe('Internal formData updates', () => {
    it('root', () => {
      const { node, onChange } = createFormComponent({
        ref: createRef(),
        schema: { type: 'string' },
      });

      fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
        target: { value: 'yo' },
      });

      expectToHaveBeenCalledWithFormData(onChange, 'yo', 'root');
    });
    it('object', () => {
      const { node, onChange } = createFormComponent({
        ref: createRef(),
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
          },
        },
      });

      fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
        target: { value: 'yo' },
      });

      expectToHaveBeenCalledWithFormData(onChange, { foo: 'yo' }, 'root_foo');
    });
    it('array of strings', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const { node, onChange } = createFormComponent({ ref: createRef(), schema });

      fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);

      fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
        target: { value: 'yo' },
      });
      expectToHaveBeenCalledWithFormData(onChange, ['yo'], 'root_0');
    });
    it('array of objects', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };
      const { node, onChange } = createFormComponent({ ref: createRef(), schema });

      fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);

      fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
        target: { value: 'yo' },
      });

      expectToHaveBeenCalledWithFormData(onChange, [{ name: 'yo' }], 'root_0_name');
    });
    it('dependency with array of objects', () => {
      const schema: RJSFSchema = {
        definitions: {},
        type: 'object',
        properties: {
          show: {
            type: 'boolean',
          },
        },
        dependencies: {
          show: {
            oneOf: [
              {
                properties: {
                  show: {
                    const: true,
                  },
                  participants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      };
      const { node, onChange } = createFormComponent({ ref: createRef(), schema });

      const checkbox = node.querySelector('[type=checkbox]');
      fireEvent.click(checkbox!);

      fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);

      fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
        target: { value: 'yo' },
      });

      expectToHaveBeenCalledWithFormData(
        onChange,
        {
          show: true,
          participants: [{ name: 'yo' }],
        },
        'root_participants_0_name',
      );
    });
  });

  describe('Error contextualization', () => {
    describe('on form state updated', () => {
      const schema: RJSFSchema = {
        type: 'string',
        minLength: 8,
      };

      describe('Lazy validation', () => {
        it('should not update the errorSchema when the formData changes', () => {
          const { node, onChange } = createFormComponent({ schema });

          fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
            target: { value: 'short' },
          });
          expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ errorSchema: {} }), 'root');
        });

        it('should not denote an error in the field', () => {
          const { node } = createFormComponent({ schema });

          fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
            target: { value: 'short' },
          });

          expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);
        });

        it("should clean contextualized errors up when they're fixed", () => {
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

          fireEvent.submit(node);

          // Fix the first field
          fireEvent.change(node.querySelectorAll('input[type=text]')[0], {
            target: { value: 'fixed error' },
          });
          fireEvent.submit(node);

          expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(1);

          // Fix the second field
          fireEvent.change(node.querySelectorAll('input[type=text]')[1], {
            target: { value: 'fixed error too' },
          });
          fireEvent.submit(node);

          // No error remaining, shouldn't throw.
          fireEvent.submit(node);

          expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);
        });
      });

      describe('Live validation', () => {
        it('should update the errorSchema when the formData changes', () => {
          const { node, onChange } = createFormComponent({
            schema,
            liveValidate: true,
          });

          fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
            target: { value: 'short' },
          });

          expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
              errorSchema: {
                __errors: ['must NOT have fewer than 8 characters'],
              },
            }),
            'root',
          );
        });

        it('should denote the new error in the field', () => {
          const { node } = createFormComponent({
            schema,
            liveValidate: true,
          });

          fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
            target: { value: 'short' },
          });

          expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(1);
          expect(node.querySelector('.rjsf-field-string .error-detail')).toHaveTextContent(
            'must NOT have fewer than 8 characters',
          );
        });
      });

      describe('Disable validation onChange event', () => {
        it('should not update errorSchema when the formData changes', () => {
          const { node, onChange } = createFormComponent({
            schema,
            noValidate: true,
            liveValidate: true,
          });

          fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
            target: { value: 'short' },
          });

          expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ errorSchema: {} }), 'root');
        });
      });

      describe('Disable validation onSubmit event', () => {
        it('should not update errorSchema when the formData changes', () => {
          const { node, onSubmit } = createFormComponent({
            schema,
            noValidate: true,
          });

          fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
            target: { value: 'short' },
          });
          fireEvent.submit(node);

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

      it('should call the onError handler and focus on the error', () => {
        const onError = jest.fn();
        const { node } = createFormComponent({
          schema,
          onError,
          focusOnFirstError: true,
        });

        const input = node.querySelector<HTMLInputElement>('input[type=text]')!;
        const focusSpy = jest.fn();
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        Object.defineProperty(input, 'focus', {
          configurable: true,
          value: focusSpy,
        });
        fireEvent.change(input, {
          target: { value: 'short' },
        });
        fireEvent.submit(node);

        expect(onError).toHaveBeenLastCalledWith(expect.any(Array));
        const callArg = jest.mocked(onError).mock.calls[0][0];
        expect(callArg.length).toBe(1);
        expect(callArg[0].message).toBe('must NOT have fewer than 8 characters');
        expect(focusSpy).toHaveBeenCalledTimes(1);
      });

      it('should call the onError handler and call the provided focusOnFirstError callback function', () => {
        const onError = jest.fn();

        const focusCallback = () => {
          console.log('focusCallback called');
        };

        const focusOnFirstError = jest.fn(focusCallback);
        const { node } = createFormComponent({
          schema,
          onError,
          focusOnFirstError,
          uiSchema: {
            'ui:disabled': true,
          },
        });

        const input = node.querySelector<HTMLInputElement>('input[type=text]')!;
        const focusSpy = jest.fn();
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        Object.defineProperty(input, 'focus', {
          configurable: true,
          value: focusSpy,
        });

        fireEvent.change(input, {
          target: { value: 'short' },
        });
        fireEvent.submit(node);

        expect(onError).toHaveBeenLastCalledWith(expect.any(Array));
        const callArg = jest.mocked(onError).mock.calls[0][0];
        expect(callArg.length).toBe(1);
        expect(callArg[0].message).toBe('must NOT have fewer than 8 characters');

        expect(focusSpy).not.toHaveBeenCalled();
        expect(focusOnFirstError).toHaveBeenCalledTimes(1);
      });

      it('should call the onError handler and call the provided focusOnFirstError callback function', () => {
        const onError = jest.fn();

        const focusCallback = () => {
          console.log('focusCallback called');
        };
        const extraErrors = {
          __errors: ['foo'],
        } as ErrorSchema;

        const focusOnFirstError = jest.fn(focusCallback);
        const { node } = createFormComponent({
          schema,
          onError,
          focusOnFirstError,
          extraErrors,
          extraErrorsBlockSubmit: true,
        });

        const input = node.querySelector<HTMLInputElement>('input[type=text]')!;
        const focusSpy = jest.fn();
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        Object.defineProperty(input, 'focus', {
          configurable: true,
          value: focusSpy,
        });

        fireEvent.change(input, {
          target: { value: 'valid string' },
        });
        fireEvent.submit(node);

        expect(onError).toHaveBeenLastCalledWith(expect.any(Array));
        const callArg = jest.mocked(onError).mock.calls[0][0];
        expect(callArg.length).toBe(1);
        expect(callArg[0].message).toBe('foo');

        expect(focusSpy).not.toHaveBeenCalled();
        expect(focusOnFirstError).toHaveBeenCalledTimes(1);
      });

      it('should reset errors and errorSchema state to initial state after correction and resubmission', () => {
        const { node, onError, onSubmit } = createFormComponent({
          schema,
        });

        fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
          target: { value: 'short' },
        });
        fireEvent.submit(node);

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

        fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
          target: { value: 'long enough' },
        });
        fireEvent.submit(node);
        expect(onError).not.toHaveBeenCalled();
        expect(onSubmit).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errors: [],
            errorSchema: {},
          }),
          expect.objectContaining({ type: 'submit' }),
        );
      });

      it('should reset errors from UI after correction and resubmission', () => {
        const { node } = createFormComponent({
          schema,
        });

        fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
          target: { value: 'short' },
        });
        fireEvent.submit(node);

        const errorListHTML = '<li class="text-danger">must NOT have fewer than 8 characters</li>';
        const errors = node.querySelectorAll('.error-detail');
        // Check for errors attached to the field
        expect(errors).toHaveLength(1);
        expect(errors[0].innerHTML).toEqual(errorListHTML);

        fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
          target: { value: 'long enough' },
        });
        fireEvent.submit(node);
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

      it('should reflect the contextualized error in state', () => {
        const { node, onError } = createFormComponent(formProps);
        submitForm(node);
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

      it('should denote the error in the field', () => {
        const { node } = createFormComponent(formProps);

        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);

        act(() => {
          fireEvent.change(node.querySelector<HTMLInputElement>('input')!, {
            target: { value: 'shorts' },
          });
        });

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

      it('should reflect the contextualized error in state', () => {
        const { node, onError } = createFormComponent(formProps);
        submitForm(node);
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

      it('should denote the error in the field', () => {
        const { node } = createFormComponent(formProps);

        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);

        act(() => {
          fireEvent.change(node.querySelector<HTMLInputElement>('input')!, {
            target: { value: 'shorts' },
          });
        });
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

      it('should reflect the contextualized error in state', () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
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

      it('should denote the error in the field', () => {
        const { node } = createFormComponent(formProps);
        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(0);

        act(() => {
          fireEvent.change(node.querySelector<HTMLInputElement>('input')!, {
            target: { value: 'shorts' },
          });
        });
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

      it('should contextualize the error for array indices', () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
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

      it('should denote the error in the item field in error', () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.rjsf-field-string');

        // live validate does not run on initial render anymore
        expect(fieldNodes[1].classList.contains('rjsf-field-error')).toBe(false);

        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        act(() => {
          fireEvent.change(fieldNodes[1].querySelector('input')!, {
            target: { value: 'bad' },
          });
        });

        const liNodes = fieldNodes[1].querySelectorAll('.rjsf-field-string .error-detail li');
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

      it('should contextualize the error for nested array indices', () => {
        const { node, onError } = createFormComponent({
          ...formProps,
          formData: {
            level1: ['good', 'bad', 'good', 'bad'],
          },
        });
        submitForm(node);
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

      it('should denote the error in the nested item field in error', () => {
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

        act(() => {
          fireEvent.change(fields[1].querySelector('input')!, {
            target: { value: 'bad' },
          });
        });

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

      it('should contextualize the error for nested array indices, focusing on first error', () => {
        const { node, onError } = createFormComponent({
          ...formProps,
          focusOnFirstError: true,
        });

        const focusSpy = jest.fn();
        const input = node.querySelector<HTMLInputElement>('input[id=root_outer_0_1]')!;
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        Object.defineProperty(input, 'focus', {
          configurable: true,
          value: focusSpy,
        });

        submitForm(node);
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

      it('should denote the error in the nested item field in error', () => {
        const { node } = createFormComponent(formProps);

        const fields = node.querySelectorAll('.rjsf-field-string');
        let errors = [].map.call(fields, (field: Element) => {
          const li = field.querySelector('.error-detail li');
          return li && li.textContent;
        });

        // live validate does not run on initial render anymore
        expect(errors).toEqual([null, null, null, null]);

        act(() => {
          fireEvent.change(fields[0].querySelector('input')!, {
            target: { value: 'bad' },
          });
        });
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

      it('should contextualize the error for array nested items', () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
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

      it('should denote the error in the array nested item', () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.rjsf-field-string');

        // Initial render no longer does live validation
        expect(fieldNodes[1].classList.contains('rjsf-field-error')).toBe(false);
        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        act(() => {
          fireEvent.change(fieldNodes[1].querySelector('input')!, {
            target: { value: 'bad' },
          });
        });

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

      it('should only show errors for properties in selected branch', () => {
        const { node, onChange } = createFormComponent({
          ref: createRef(),
          schema,
          liveValidate: true,
          formData: { branch: 2 },
        });

        act(() => {
          fireEvent.change(node.querySelectorAll<HTMLInputElement>('input[type=number]')[0], {
            target: { value: 0 }, // Enter a value into the first number input
          });
        });

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

      it('should not show any errors when branch is empty', () => {
        const { node, onChange } = createFormComponent({
          ref: createRef(),
          schema,
          liveValidate: true,
          formData: { branch: 3 },
        });

        act(() => {
          fireEvent.change(node.querySelector('select')!, {
            target: { value: 2 }, // The selector uses indexes rather than values so index 2 is branch value 3
          });
        });

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errorSchema: {},
          }),
          'root_branch',
        );
      });
    });

    describe('customValidate errors, live validation', () => {
      it('customValidate should raise an error when End is larger than Start field.', () => {
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
          if (formData['Start'] > formData['End']) {
            errors['Start']?.addError('Validate error: Test should be LE than End');
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
        const endInput = node.querySelector('#root_End');
        act(() => {
          fireEvent.change(endInput!, {
            target: { value: 1 },
          });
        });
        expect(node.querySelectorAll('#root_Start__error')).toHaveLength(1);
        let errorMessageContent = node.querySelector('#root_Start__error .text-danger');
        expect(errorMessageContent).toHaveTextContent('Validate error: Test should be LE than End');

        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        act(() => {
          fireEvent.change(endInput!, {
            target: { value: 3 },
          });
        });

        expect(node.querySelectorAll('#root_Start__error')).toHaveLength(0);
        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            errors: [],
          }),
          'root_End',
        );

        // Change the End field to a lesser value than Start field to raise customValidate errors.
        act(() => {
          fireEvent.change(endInput!, {
            target: { value: 0 },
          });
        });

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

  describe('Schema and formData updates', () => {
    // https://github.com/rjsf-team/react-jsonschema-form/issues/231
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };

    it('should replace state when props remove formData keys', () => {
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

      fireEvent.change(node.querySelector('#root_bar')!, {
        target: { value: 'baz' },
      });

      expectToHaveBeenCalledWithFormData(onChange, { bar: 'baz' }, 'root_bar');
    });

    it('should replace state when props change formData keys', () => {
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

      fireEvent.change(node.querySelector('#root_baz')!, {
        target: { value: 'baz' },
      });

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
    it('Should update custom formats when customFormats is changed', () => {
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

      submitForm(node);
      expect(onError).not.toHaveBeenCalled();

      rerender(
        {
          ...formProps,
          onError,
        },
        customValidator,
      );

      submitForm(node);
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
      // We use setTimeout with a delay of 0ms to allow all asynchronous operations to complete in the React component.
      // Despite this being a workaround, it turned out to be the only effective method to handle this test case.
    });
  });

  describe('Meta schema updates', () => {
    it('Should update allowed meta schemas when additionalMetaSchemas is changed', () => {
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

      submitForm(node);
      expect(onError).toHaveBeenLastCalledWith([
        {
          stack: 'no schema with key or ref "http://json-schema.org/draft-06/schema#"',
        },
      ]);

      const customValidator = customizeValidator({
        additionalMetaSchemas: [require('ajv/lib/refs/json-schema-draft-06.json')],
      });

      rerender(
        {
          ...formProps,
          onError,
        },
        customValidator,
      );

      submitForm(node);
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
    });
  });

  describe('Nested forms', () => {
    it('should call provided submit handler with form state', () => {
      const innerOnSubmit = jest.fn();
      const outerOnSubmit = jest.fn();
      let innerRef: RefObject<HTMLDivElement> | undefined;

      class ArrayTemplateWithForm extends Component<FormProps> {
        constructor(props: FormProps) {
          super(props);
          innerRef = createRef();
        }

        render() {
          const innerFormProps = {
            validator,
            schema: {},
            onSubmit: innerOnSubmit,
          };

          return (
            <Portal>
              <div className='array' ref={innerRef}>
                <Form {...innerFormProps}>
                  <button className='array-form-submit' type='submit'>
                    Submit
                  </button>
                </Form>
              </div>
            </Portal>
          );
        }
      }

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
      expect(innerRef!.current).not.toBeNull();
      const arrayForm = innerRef!.current!.querySelector('form')!;
      const arraySubmit = arrayForm.querySelector<HTMLButtonElement>('.array-form-submit')!;

      act(() => {
        arraySubmit.click();
      });

      expect(innerOnSubmit).toHaveBeenCalledTimes(1);
      expect(outerOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Dependencies', () => {
    it('should not give a validation error by duplicating enum values in dependencies', () => {
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
      fireEvent.submit(node);
      expect(onError).not.toHaveBeenCalled();
    });
    it('should show dependency defaults for uncontrolled components', () => {
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

      fireEvent.change(node.querySelector('#root_firstName')!, {
        target: { value: 'Chuck' },
      });
      expect(node.querySelector('#root_lastName')).toHaveValue('Norris');
    });
  });
});

describe('Live validation onBlur', () => {
  const schema: RJSFSchema = {
    type: 'string',
    minLength: 8,
  };

  it('does not occur during onChange, no errors produced', () => {
    const onBlur = jest.fn();
    const { node, onChange } = createFormComponent({
      schema,
      onBlur,
      liveValidate: 'onBlur',
    });
    fireEvent.change(node.querySelector<HTMLInputElement>('input[type=text]')!, {
      target: { value: 'short' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'short',
        errorSchema: {},
      }),
      'root',
    );

    expect(onBlur).not.toHaveBeenCalled();
  });

  it('occurs during onBlur, onChange not called during blur due to no state update', () => {
    const onBlur = jest.fn();
    const { node, onChange } = createFormComponent({
      schema,
      onBlur,
      liveValidate: 'onBlur',
    });
    const element = node.querySelector<HTMLInputElement>('input[type=text]')!;
    fireEvent.change(element, {
      target: { value: 'longenough' },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'longenough',
        errorSchema: {},
      }),
      'root',
    );

    fireEvent.blur(element);

    expect(onBlur).toHaveBeenLastCalledWith('root', 'longenough');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('occurs during onBlur, onChange called during blur with errors due to a state update', () => {
    const onBlur = jest.fn();
    const { node, onChange } = createFormComponent({
      schema,
      onBlur,
      liveValidate: 'onBlur',
    });
    const element = node.querySelector<HTMLInputElement>('input[type=text]')!;
    fireEvent.change(element, {
      target: { value: 'short' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'short',
        errorSchema: {},
      }),
      'root',
    );
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.blur(element);

    expect(onBlur).toHaveBeenLastCalledWith('root', 'short');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'short',
        errorSchema: {
          __errors: ['must NOT have fewer than 8 characters'],
        },
      }),
      'root',
    );
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('omitExtraData and live omit onBlur', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      bar: { type: 'string' },
    },
  };
  const formData = { foo: 'foo', bar: 'bar' };
  const formData1 = { foo: 'foo', bar: 'bar', baz: 'baz' };

  it('does not occur during onChange, no extra data removed', () => {
    const onBlur = jest.fn();
    const { node, onChange } = createFormComponent({
      schema,
      formData: formData1,
      onBlur,
      omitExtraData: true,
      liveOmit: 'onBlur',
    });

    fireEvent.change(node.querySelector('#root_foo')!, {
      target: { value: '' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { ...formData1, foo: undefined },
      }),
      'root_foo',
    );

    expect(onBlur).not.toHaveBeenCalled();
  });

  it('occurs during onBlur, onChange not called during blur due to no state update', () => {
    const onBlur = jest.fn();
    const { node, onChange } = createFormComponent({
      schema,
      formData, // Use form data with nothing to omit to test case
      onBlur,
      omitExtraData: true,
      liveOmit: 'onBlur',
    });
    const element = node.querySelector<HTMLInputElement>('input[type=text]')!;
    fireEvent.change(node.querySelector('#root_foo')!, {
      target: { value: '' },
    });
    fireEvent.change(node.querySelector('#root_foo')!, {
      target: { value: 'foo' },
    });
    expect(onChange).toHaveBeenCalledTimes(2);

    fireEvent.blur(element);

    expect(onBlur).toHaveBeenLastCalledWith('root_foo', 'foo');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('occurs during onBlur, onChange called during blur due to extra data removal in state', () => {
    const onBlur = jest.fn();
    const { node, onChange } = createFormComponent({
      schema,
      formData: formData1,
      onBlur,
      omitExtraData: true,
      liveOmit: 'onBlur',
    });
    const element = node.querySelector<HTMLInputElement>('input[type=text]')!;
    fireEvent.change(node.querySelector('#root_foo')!, {
      target: { value: '' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { ...formData1, foo: undefined },
      }),
      'root_foo',
    );
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.blur(element);

    expect(onBlur).toHaveBeenLastCalledWith('root_foo', '');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { bar: 'bar', foo: undefined },
      }),
      'root_foo',
    );
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('Form omitExtraData and liveOmit', () => {
  it('should call omitExtraData when the omitExtraData prop is true and liveOmit is true', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
    };
    const formData = {
      foo: 'bar',
    };
    const omitExtraData = true;
    const liveOmit = true;
    const ref = createRef<Form>();

    const { node } = createFormComponent({
      ref,
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    const theSpy = jest.spyOn(ref.current!, 'omitExtraData').mockReturnValue({ foo: '' });

    fireEvent.change(node.querySelector('[type=text]')!, {
      target: { value: 'new' },
    });

    expect(theSpy).toHaveBeenCalledTimes(1);
  });

  it('should not call omitExtraData when the omitExtraData prop is true and liveOmit is unspecified', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
    };
    const formData = {
      foo: 'bar',
    };
    const omitExtraData = true;
    const ref = createRef<Form>();
    const { node } = createFormComponent({
      ref,
      schema,
      formData,
      omitExtraData,
    });

    const theSpy = jest.spyOn(ref.current!, 'omitExtraData').mockReturnValue({ foo: '' });

    fireEvent.change(node.querySelector('[type=text]')!, {
      target: { value: 'new' },
    });

    expect(theSpy).not.toHaveBeenCalled();
  });

  it('should not omit data on change with omitExtraData=false and liveOmit=false', () => {
    const omitExtraData = false;
    const liveOmit = false;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo')!, {
      target: { value: 'foobar' },
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'foobar', baz: 'baz' },
      }),
      'root_foo',
    );
  });

  it('should not omit data on change with omitExtraData=true and liveOmit=false', () => {
    const omitExtraData = true;
    const liveOmit = false;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo')!, {
      target: { value: 'foobar' },
    });

    expectToHaveBeenCalledWithFormData(onChange, { foo: 'foobar', baz: 'baz' }, 'root_foo');
  });

  it('should not omit data on change with omitExtraData=false and liveOmit=true', () => {
    const omitExtraData = false;
    const liveOmit = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo')!, {
      target: { value: 'foobar' },
    });

    expectToHaveBeenCalledWithFormData(onChange, { foo: 'foobar', baz: 'baz' }, 'root_foo');
  });

  it('should omit data on change with omitExtraData=true and liveOmit=true', () => {
    const omitExtraData = true;
    const liveOmit = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo')!, {
      target: { value: 'foobar' },
    });

    expectToHaveBeenCalledWithFormData(onChange, { foo: 'foobar' }, 'root_foo');
  });

  it('should not omit additionalProperties on change with omitExtraData=true and liveOmit=true', () => {
    const omitExtraData = true;
    const liveOmit = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
        add: {
          type: 'object',
          additionalProperties: {},
        },
      },
    };
    const formData = { foo: 'foo', baz: 'baz', add: { prop: 123 } };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo')!, {
      target: { value: 'foobar' },
    });

    expectToHaveBeenCalledWithFormData(onChange, { foo: 'foobar', add: { prop: 123 } }, 'root_foo');
  });

  it('should rename formData key if key input is renamed in a nested object with omitExtraData=true and liveOmit=true', () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          nested: {
            additionalProperties: { type: 'string' },
          },
        },
      },
      formData: { nested: { key1: 'value' } },
      omitExtraData: true,
      liveOmit: true,
    });

    const textNode = node.querySelector('#root_nested_key1-key');
    fireEvent.blur(textNode!, {
      target: { value: 'key1new' },
    });

    expectToHaveBeenCalledWithFormData(onChange, { nested: { key1new: 'value' } }, 'root_nested');
  });

  it('should allow oneOf data entry with omitExtraData=true and liveOmit=true', () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        oneOf: [
          {
            properties: {
              lorem: {
                type: 'string',
              },
            },
            required: ['lorem'],
          },
          {
            properties: {
              ipsum: {
                type: 'string',
              },
            },
            required: ['ipsum'],
          },
        ],
      },
      formData: { lorum: '' },
      omitExtraData: true,
      liveOmit: true,
    });

    const textNode = node.querySelector('#root_lorem');
    fireEvent.change(textNode!, {
      target: { value: '12' },
    });

    expectToHaveBeenCalledWithFormData(onChange, { lorem: '12' }, 'root_lorem');
  });

  it('should allow anyOf data entry with omitExtraData=true and liveOmit=true', () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        anyOf: [
          {
            properties: {
              lorem: {
                type: 'string',
              },
            },
            required: ['lorem'],
          },
          {
            properties: {
              ipsum: {
                type: 'string',
              },
            },
            required: ['ipsum'],
          },
        ],
      },
      formData: { ipsum: '' },
      omitExtraData: true,
      liveOmit: true,
    });

    const textNode = node.querySelector('#root_ipsum');
    fireEvent.change(textNode!, {
      target: { value: '12' },
    });

    expectToHaveBeenCalledWithFormData(onChange, { ipsum: '12' }, 'root_ipsum');
  });

  it('should keep schema errors when extraErrors set after submit and liveValidate is false', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      required: ['foo'],
    };

    const extraErrors = {
      foo: {
        __errors: ['foo'],
      },
    } as unknown as ErrorSchema;

    const onSubmit = jest.fn();

    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      onSubmit,
      liveValidate: false,
    };
    const event = { type: 'submit' };
    const { rerender, node } = createFormComponent(props);
    act(() => {
      fireEvent.submit(node, event);
    });
    expect(node.querySelectorAll('.error-detail li')).toHaveLength(1);

    rerender({
      ...props,
      extraErrors,
    });

    setTimeout(() => {
      expect(node.querySelectorAll('.error-detail li')).toHaveLength(2);
    }, 0);
    // We use setTimeout with a delay of 0ms to allow all asynchronous operations to complete in the React component.
    // Despite this being a workaround, it turned out to be the only effective method to handle this test case.
  });
});

describe('omitExtraData on submit', () => {
  it('should call omitExtraData when the omitExtraData prop is true', () => {
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
    const omitExtraData = true;
    const ref = createRef<Form>();
    const { node } = createFormComponent({
      ref,
      schema,
      formData,
      omitExtraData,
    });

    const theSpy = jest.spyOn(ref.current!, 'omitExtraData').mockReturnValue({ foo: '' });

    fireEvent.submit(node);

    expect(theSpy).toHaveBeenCalledTimes(1);
  });

  it('Should call validateFormWithFormData with the current formData if omitExtraData is false', () => {
    const omitExtraData = false;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData,
      omitExtraData: omitExtraData,
    };
    const { node } = createFormComponent(props);
    const theSpy = jest.spyOn(formRef.current!, 'validateFormWithFormData').mockReturnValue(true);
    fireEvent.submit(node);
    expect(theSpy).toHaveBeenCalledWith(formData);
  });

  it('Should call validateFormWithFormData with a new formData with only used fields if omitExtraData is true', () => {
    const omitExtraData = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData,
      omitExtraData: omitExtraData,
    };
    const { node } = createFormComponent(props);
    const theSpy = jest.spyOn(formRef.current!, 'validateFormWithFormData').mockReturnValue(true);
    fireEvent.submit(node);
    expect(theSpy).toHaveBeenCalledWith({ foo: 'bar' });
  });
});

describe('getUsedFormData', () => {
  it('should just return the single input form value', () => {
    const schema: RJSFSchema = {
      title: 'A single-field form',
      type: 'string',
    };
    const formData = 'foo';
    const ref = createRef<Form>();
    createFormComponent({
      ref,
      schema,
      formData,
    });

    const result = ref.current!.getUsedFormData(formData, []);
    expect(result).toEqual('foo');
  });

  it('should return the root level array', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        type: 'string',
      },
    };
    const formData: any[] = [];
    const ref = createRef<Form>();
    createFormComponent({
      ref,
      schema,
      formData,
    });

    const result = ref.current!.getUsedFormData(formData, []);
    expect(result).toEqual([]);
  });

  it('should call getUsedFormData with data from fields in event', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = {
      foo: 'bar',
    };
    const onSubmit = jest.fn();
    const formRef = createRef<Form>();
    createFormComponent({
      ref: formRef,
      schema,
      formData,
      onSubmit,
    });

    const result = formRef.current!.getUsedFormData(formData, ['foo']);
    expect(result).toEqual({ foo: 'bar' });
  });

  it('unused form values should be omitted', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'string' },
        list: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              details: { type: 'string' },
            },
          },
        },
      },
    };

    const formData = {
      foo: 'bar',
      baz: 'buzz',
      list: [
        { title: 'title0', details: 'details0' },
        { title: 'title1', details: 'details1' },
      ],
    };
    const ref = createRef<Form>();
    createFormComponent({
      ref,
      schema,
      formData,
    });

    const result = ref.current!.getUsedFormData(formData, ['foo', 'list.0.title', 'list.1.details']);
    expect(result).toEqual({
      foo: 'bar',
      list: [{ title: 'title0' }, { details: 'details1' }],
    });
  });
});

describe('getFieldNames()', () => {
  it('should return an empty array for a single input form', () => {
    const schema: RJSFSchema = {
      type: 'string',
    };

    const formData = 'foo';

    const ref = createRef<Form>();
    createFormComponent({
      ref,
      schema,
      formData,
    });

    const pathSchema = {
      $name: '',
    };

    const fieldNames = ref.current!.getFieldNames(pathSchema, formData);
    expect(fieldNames).toEqual([]);
  });

  it('should get field names from pathSchema', () => {
    const schema: RJSFSchema = {};

    const formData = {
      extra: {
        foo: 'bar',
      },
      level1: {
        level2: 'test',
        anotherThing: {
          anotherThingNested: 'abc',
          extra: 'asdf',
          anotherThingNested2: 0,
        },
        stringArray: ['scobochka'],
      },
      level1a: 1.23,
    };

    const ref = createRef<Form>();
    createFormComponent({
      ref,
      schema,
      formData,
    });

    const pathSchema = {
      $name: '',
      level1: {
        $name: 'level1',
        level2: { $name: 'level1.level2' },
        anotherThing: {
          $name: 'level1.anotherThing',
          anotherThingNested: {
            $name: 'level1.anotherThing.anotherThingNested',
          },
          anotherThingNested2: {
            $name: 'level1.anotherThing.anotherThingNested2',
          },
        },
        stringArray: {
          $name: 'level1.stringArray',
        },
      },
      level1a: {
        $name: 'level1a',
      },
    };

    const fieldNames = ref.current!.getFieldNames(pathSchema, formData);
    expect(fieldNames.sort()).toEqual(
      [
        ['level1', 'anotherThing', 'anotherThingNested'],
        ['level1', 'anotherThing', 'anotherThingNested2'],
        ['level1', 'level2'],
        ['level1', 'stringArray'],
        ['level1a'],
      ].sort(),
    );
  });

  it('should get field marked as additionalProperties', () => {
    const schema: RJSFSchema = {};

    const formData = {
      extra: {
        foo: 'bar',
      },
      level1: {
        level2: 'test',
        extra: 'foo',
        mixedMap: {
          namedField: 'foo',
          key1: 'val1',
        },
      },
      level1a: 1.23,
    };

    const ref = createRef<Form>();
    createFormComponent({
      ref,
      schema,
      formData,
    });

    const pathSchema = {
      $name: '',
      level1: {
        $name: 'level1',
        level2: { $name: 'level1.level2' },
        mixedMap: {
          $name: 'level1.mixedMap',
          __rjsf_additionalProperties: true,
          namedField: { $name: 'level1.mixedMap.namedField' }, // this name should not be returned, as the root object paths should be returned for objects marked with additionalProperties
        },
      },
      level1a: {
        $name: 'level1a',
      },
    };

    const fieldNames = ref.current!.getFieldNames(pathSchema, formData);
    expect(fieldNames.sort()).toEqual([['level1', 'level2'], 'level1.mixedMap', ['level1a']].sort());
  });

  it('should get field names from pathSchema with array', () => {
    const schema: RJSFSchema = {};

    const formData = {
      address_list: [
        {
          street_address: '21, Jump Street',
          city: 'Babel',
          state: 'Neverland',
        },
        {
          street_address: '1234 Schema Rd.',
          city: 'New York',
          state: 'Arizona',
        },
      ],
    };

    const ref = createRef<Form>();
    createFormComponent({
      ref,
      schema,
      formData,
    });

    const pathSchema = {
      $name: '',
      address_list: {
        0: {
          $name: 'address_list.0',
          city: {
            $name: 'address_list.0.city',
          },
          state: {
            $name: 'address_list.0.state',
          },
          street_address: {
            $name: 'address_list.0.street_address',
          },
        },
        1: {
          $name: 'address_list.1',
          city: {
            $name: 'address_list.1.city',
          },
          state: {
            $name: 'address_list.1.state',
          },
          street_address: {
            $name: 'address_list.1.street_address',
          },
        },
      },
    };

    const fieldNames = ref.current!.getFieldNames(pathSchema, formData);
    expect(fieldNames.sort()).toEqual(
      [
        ['address_list', '0', 'city'],
        ['address_list', '0', 'state'],
        ['address_list', '0', 'street_address'],
        ['address_list', '1', 'city'],
        ['address_list', '1', 'state'],
        ['address_list', '1', 'street_address'],
      ].sort(),
    );
  });
});

describe('Async errors', () => {
  it('should render the async errors', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        candy: {
          type: 'object',
          properties: {
            bar: { type: 'string' },
          },
        },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['some error that got added as a prop'],
      },
      candy: {
        bar: {
          __errors: ['some other error that got added as a prop'],
        },
      },
    } as unknown as ErrorSchema;

    const { node } = createFormComponent({ schema, extraErrors });

    expect(node.querySelectorAll('.error-detail li')).toHaveLength(2);
  });

  it('should not block form submission', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['some error that got added as a prop'],
      },
    } as unknown as ErrorSchema;

    const { node, onSubmit } = createFormComponent({ schema, extraErrors });
    fireEvent.submit(node);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should reset when props extraErrors changes and noValidate is true', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['foo'],
      },
    } as unknown as ErrorSchema;

    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      noValidate: true,
    };

    const { rerender } = createFormComponent({
      ...props,
      extraErrors,
    });

    rerender({
      ...props,
      extraErrors: {},
    });

    setTimeout(() => {
      expect(formRef.current!.state.errorSchema).toEqual({});
      expect(formRef.current!.state.errors).toEqual([]);
    }, 0);
    // We use setTimeout with a delay of 0ms to allow all asynchronous operations to complete in the React component.
    // Despite this being a workaround, it turned out to be the only effective method to handle this test case.
  });

  it('should reset when props extraErrors changes and liveValidate is false', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['foo'],
      },
    } as unknown as ErrorSchema;

    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      liveValidate: false,
    };
    const { rerender } = createFormComponent({
      ...props,
      extraErrors,
    });

    rerender({
      ...props,
      extraErrors: {},
    });

    setTimeout(() => {
      expect(formRef.current!.state.errorSchema).toEqual({});
      expect(formRef.current!.state.errors).toEqual([]);
    }, 0);
    // We use setTimeout with a delay of 0ms to allow all asynchronous operations to complete in the React component.
    // Despite this being a workaround, it turned out to be the only effective method to handle this test case.
  });

  it('should reset when schema changes', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      required: ['foo'],
    };

    const formRef = createRef<Form>();
    const { rerender, node } = createFormComponent({
      ref: formRef,
      schema,
    });

    act(() => {
      fireEvent.submit(node);
    });

    expect(formRef.current!.state.errorSchema).toEqual({ foo: { __errors: ["must have required property 'foo'"] } });
    expect(formRef.current!.state.errors).toEqual([
      {
        message: "must have required property 'foo'",
        property: 'foo',
        name: 'required',
        params: {
          missingProperty: 'foo',
        },
        schemaPath: '#/required',
        stack: "must have required property 'foo'",
        title: '',
      },
    ]);

    // Changing schema to reset errors state.
    rerender({
      ref: formRef,
      schema: {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      },
    });
    expect(formRef.current!.state.errorSchema).toEqual({});
    expect(formRef.current!.state.errors).toEqual([]);
  });
});

describe('Calling onChange right after updating a Form with props formData', () => {
  const schema: RJSFSchema = {
    type: 'array',
    items: {
      type: 'string',
    },
  };

  let changed = false;
  class ArrayThatTriggersOnChangeRightAfterUpdated extends Component<FieldProps> {
    componentDidUpdate = () => {
      if (changed) {
        return;
      }
      changed = true;
      this.props.onChange('test', [this.props.formData.length]);
    };
    render() {
      const { ArrayField } = this.props.registry.fields;
      return <ArrayField {...this.props} />;
    }
  }

  const uiSchema: UiSchema = {
    'ui:field': ArrayThatTriggersOnChangeRightAfterUpdated,
  };

  const props: FormProps = {
    schema,
    uiSchema,
    validator,
  };

  class Container extends Component<FormProps> {
    constructor(props: FormProps) {
      super(props);
      this.state = {};
    }

    onChange = ({ formData }: IChangeEvent) => {
      this.setState({ formData });
    };

    render() {
      return <Form {...this.props} {...this.state} onChange={this.onChange} />;
    }
  }

  it("doesn't cause a race condition", () => {
    const { node } = createComponent(Container, { ...props });

    fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);

    expect(node.querySelector('#root_0')).toBeInTheDocument();
    expect(node.querySelector('#root_1')).toHaveAttribute('value', 'test');
  });
});

describe('Calling reset from ref object', () => {
  it('Reset API test', () => {
    const schema: RJSFSchema = {
      title: 'Test form',
      type: 'string',
    };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
    };
    const { node } = createFormComponent(props);
    expect(formRef.current!.reset).toBeDefined();
    expect(node.querySelector<HTMLInputElement>('input')).toBeInTheDocument();
    fireEvent.change(node.querySelector<HTMLInputElement>('input')!, { target: { value: 'Some Value' } });
    act(() => {
      formRef.current!.reset();
    });
    expect(node.querySelector<HTMLInputElement>('input')).toHaveAttribute('value', '');
  });

  it('Clear errors', () => {
    const schema: RJSFSchema = {
      title: 'Test form',
      type: 'number',
    };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
    };
    const { node } = createFormComponent(props);
    expect(formRef.current!.reset).toBeDefined();
    expect(node.querySelector<HTMLInputElement>('input')).toBeInTheDocument();
    fireEvent.change(node.querySelector<HTMLInputElement>('input')!, { target: { value: 'Some Value' } });
    expect(formRef.current!.state.errors).toHaveLength(0);
    act(() => {
      fireEvent.submit(node);
    });
    expect(formRef.current!.state.errors).toHaveLength(1);
    expect(node.querySelector('.errors')).toBeInTheDocument();
    act(() => {
      formRef.current!.reset();
    });
    expect(node.querySelector('.errors')).not.toBeInTheDocument();
    expect(node.querySelector<HTMLInputElement>('input')).toHaveAttribute('value', '');
    expect(formRef.current!.state.errors).toHaveLength(0);
  });

  it('Reset button test with default value', () => {
    const schemaWithDefault: RJSFSchema = {
      title: 'Test form',
      type: 'string',
      default: 'Some-Value',
    };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema: schemaWithDefault,
    };
    const { node } = createFormComponent(props);
    const input = node.querySelector<HTMLInputElement>('input');
    expect(formRef.current!.reset).toBeDefined();
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('value', 'Some-Value');
    act(() => {
      formRef.current!.reset();
    });
    expect(input).toHaveAttribute('value', 'Some-Value');
    fireEvent.change(input!, { target: { value: 'Changed value' } });
    act(() => {
      formRef.current!.reset();
    });
    expect(input).toHaveAttribute('value', 'Some-Value');
  });

  it('Reset button test with complex schema', () => {
    const schema = widgetsSchema as RJSFSchema;
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
    };
    const { node } = createFormComponent(props);
    const checkbox = node.querySelector<HTMLInputElement>('input[type="checkbox"]');
    const input = node.querySelector<HTMLInputElement>('input[type="text"]');
    expect(formRef.current!.reset).toBeDefined();
    expect(checkbox).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    expect(input).toHaveAttribute('value', '');
    act(() => {
      formRef.current!.reset();
    });
    expect(checkbox).toBeChecked();
    expect(input).toHaveAttribute('value', '');
    fireEvent.click(checkbox!);
    fireEvent.change(input!, { target: { value: 'Changed value' } });
    expect(checkbox).not.toBeChecked();
    expect(input).toHaveAttribute('value', 'Changed value');
    act(() => {
      formRef.current!.reset();
    });
    expect(input).toHaveAttribute('value', '');
    expect(checkbox).toBeChecked();
  });

  it('Reset button test with initialFormData', () => {
    const schemaWithDefault: RJSFSchema = {
      title: 'Test form',
      type: 'string',
    };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      initialFormData: 'foo',
      schema: schemaWithDefault,
    };
    const { node } = createFormComponent(props);
    const input = node.querySelector<HTMLInputElement>('input');
    expect(formRef.current!.reset).toBeDefined();
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('value', props.initialFormData);
    fireEvent.change(input!, { target: { value: 'Changed value' } });
    expect(input).toHaveAttribute('value', 'Changed value');
    act(() => {
      formRef.current!.reset();
    });
    expect(input).toHaveAttribute('value', props.initialFormData);
  });
});

describe('validateForm()', () => {
  it('Should call validateFormWithFormData with the current formData if omitExtraData is false', () => {
    const omitExtraData = false;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData,
      omitExtraData: omitExtraData,
    };
    createFormComponent(props);
    const theSpy = jest.spyOn(formRef.current!, 'validateFormWithFormData').mockReturnValue(true);
    act(() => {
      formRef.current!.validateForm();
    });
    expect(theSpy).toHaveBeenCalledWith(formData);
  });

  it('Should call validateFormWithFormData with a new formData with only used fields if omitExtraData is true', () => {
    const omitExtraData = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData,
      omitExtraData: omitExtraData,
    };
    createFormComponent(props);
    const theSpy = jest.spyOn(formRef.current!, 'validateFormWithFormData').mockReturnValue(true);
    act(() => {
      formRef.current!.validateForm();
    });
    expect(theSpy).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('Should update state when data updated from invalid to valid', () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'object',
        required: ['input'],
        properties: {
          input: {
            type: 'string',
          },
        },
      },
      formData: {},
      ref,
    };
    const { rerender, node } = createFormComponent(props);
    // trigger programmatic validation and make sure an error appears.
    act(() => {
      expect(ref.current!.validateForm()).toBe(false);
    });

    let errors = node.querySelectorAll('.error-detail');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toHaveTextContent("must have required property 'input'");

    // populate the input and fireEvent a re-render from the parent.
    const textNode = node.querySelector('#root_input');
    fireEvent.change(textNode!, {
      target: { value: 'populated value' },
    });
    rerender({ ...props, formData: { input: 'populated value' } });
    // // error should still be present.
    errors = node.querySelectorAll('.error-detail');
    // screen.debug();
    // change formData and make sure the error disappears.
    expect(errors).toHaveLength(0);

    // trigger programmatic validation again and make sure the error disappears.
    act(() => {
      expect(ref.current!.validateForm()).toEqual(true);
    });
    errors = node.querySelectorAll('.error-detail');
    expect(errors).toHaveLength(0);
  });
});

describe('setFieldValue()', () => {
  it('Sets root to value using ""', () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'string',
      },
      formData: {},
      ref,
    };
    const { onChange, node } = createFormComponent(props);
    // populate the input
    act(() => {
      ref.current!.setFieldValue('', 'populated value');
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'populated value',
      }),
      'root_',
    );

    expect(node.querySelector<HTMLInputElement>('input')).toHaveAttribute('value', 'populated value');
  });
  it('Sets root to value using []', () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'string',
      },
      formData: {},
      ref,
    };
    const { onChange, node } = createFormComponent(props);
    // populate the input
    act(() => {
      ref.current!.setFieldValue([], 'populated value');
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'populated value',
      }),
      'root',
    );

    expect(node.querySelector<HTMLInputElement>('input')).toHaveAttribute('value', 'populated value');
  });
  it('Sets field to new value via dotted path', () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            required: ['input'],
            properties: {
              input: {
                type: 'string',
              },
            },
          },
        },
        required: ['foo'],
      },
      formData: {},
      ref,
      liveValidate: true,
    };
    const { onChange, node } = createFormComponent(props);
    // trigger programmatic validation and make sure an error appears.
    act(() => {
      expect(ref.current!.validateForm()).toBe(false);
    });

    let errors = node.querySelectorAll('.error-detail');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toHaveTextContent("must have required property 'input'");

    // populate the input
    act(() => {
      ref.current!.setFieldValue('foo.input', 'populated value');
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          foo: {
            input: 'populated value',
          },
        },
      }),
      'root_foo_input',
    );

    // error should still be present.
    errors = node.querySelectorAll('.error-detail');
    // screen.debug();
    // change formData and make sure the error disappears.
    expect(errors).toHaveLength(0);
  });
  it('Sets field to new value via field path list', () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            required: ['input'],
            properties: {
              input: {
                type: 'string',
              },
            },
          },
        },
        required: ['foo'],
      },
      formData: {},
      ref,
      liveValidate: true,
    };
    const { onChange, node } = createFormComponent(props);
    // trigger programmatic validation and make sure an error appears.
    act(() => {
      expect(ref.current!.validateForm()).toBe(false);
    });

    let errors = node.querySelectorAll('.error-detail');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toHaveTextContent("must have required property 'input'");

    // populate the input
    act(() => {
      ref.current!.setFieldValue(['foo', 'input'], 'populated value');
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          foo: {
            input: 'populated value',
          },
        },
      }),
      'root_foo_input',
    );

    // error should still be present.
    errors = node.querySelectorAll('.error-detail');
    // screen.debug();
    // change formData and make sure the error disappears.
    expect(errors).toHaveLength(0);
  });
});

describe('optionalDataControls', () => {
  const schema: RJSFSchema = {
    title: 'test',
    properties: {
      nestedObjectOptional: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
          },
        },
      },
      nestedArrayOptional: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  };
  const arrayOnUiSchema: UiSchema = {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['array'],
    },
  };
  const objectOnUiSchema: UiSchema = {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['object'],
    },
  };
  const bothOnUiSchema: UiSchema = {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['object', 'array'],
    },
  };
  const experimental_defaultFormStateBehavior: Experimental_DefaultFormStateBehavior = {
    // Set the emptyObjectFields to only populate required defaults to highlight the code working
    emptyObjectFields: 'populateRequiredDefaults',
  };
  const arrayId = 'root_nestedArrayOptional';
  const objectId = 'root_nestedObjectOptional';
  const arrayControlAddId = optionalControlsId(arrayId, 'Add');
  const arrayControlRemoveId = optionalControlsId(arrayId, 'Remove');
  const arrayControlMsgId = optionalControlsId(arrayId, 'Msg');
  const arrayAddId = buttonId(arrayId, 'add');
  const objectControlAddId = optionalControlsId(objectId, 'Add');
  const objectControlRemoveId = optionalControlsId(objectId, 'Remove');
  const objectControlMsgId = optionalControlsId(objectId, 'Msg');
  it('does not render any optional data control messages when not turned on and readonly and disabled', () => {
    const props: NoValFormProps = {
      schema,
      experimental_defaultFormStateBehavior,
      readonly: true,
      disabled: true,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const msgArrayControlNode = node.querySelector(`#${arrayControlMsgId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const msgObjectControlNode = node.querySelector(`#${objectControlMsgId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(msgArrayControlNode).toEqual(null);
    expect(addArrayBtn).not.toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(msgObjectControlNode).toEqual(null);
    expect(testInput).not.toEqual(null);
  });
  it('renders optional data control messages when turned on and readonly', () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: bothOnUiSchema,
      experimental_defaultFormStateBehavior,
      readonly: true,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const msgArrayControlNode = node.querySelector(`#${arrayControlMsgId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const msgObjectControlNode = node.querySelector(`#${objectControlMsgId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(msgArrayControlNode).not.toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(msgObjectControlNode).not.toEqual(null);
    expect(testInput).toEqual(null);
  });
  it('renders optional data control messages when turned on and readonly', () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: bothOnUiSchema,
      experimental_defaultFormStateBehavior,
      disabled: true,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const msgArrayControlNode = node.querySelector(`#${arrayControlMsgId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const msgObjectControlNode = node.querySelector(`#${objectControlMsgId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(msgArrayControlNode).not.toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(msgObjectControlNode).not.toEqual(null);
    expect(testInput).toEqual(null);
  });
  it('does not render any optional data controls when not turned on', () => {
    const props: NoValFormProps = {
      schema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).not.toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).not.toEqual(null);
  });
  it('only render object optional data controls when only object is turned on', () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: objectOnUiSchema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    let addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    let removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    let testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).not.toEqual(null);
    expect(addObjectControlNode).not.toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).toEqual(null);

    // now click on the add optional data button
    act(() => addObjectControlNode!.click());
    // now check to see if the UI adjusted
    addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).not.toEqual(null);
    expect(testInput).not.toEqual(null);

    // now click on the remove optional data button
    act(() => removeObjectControlNode!.click());
    // now check to see if the UI adjusted
    addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addObjectControlNode).not.toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).toEqual(null);
  });
  it('only render array optional data controls when only array is turned on', () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: arrayOnUiSchema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    let addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    let removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    let addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).not.toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).not.toEqual(null);

    // now click on the add optional data button
    act(() => addArrayControlNode!.click());
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).not.toEqual(null);
    expect(addArrayBtn).not.toEqual(null);

    // now click on the remove optional data button
    act(() => removeArrayControlNode!.click());
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    expect(addArrayControlNode).not.toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).toEqual(null);
  });
  it('render both kinds of optional data controls when only both are turned on', () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: bothOnUiSchema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    let addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    let removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    let addArrayBtn = node.querySelector(`#${arrayAddId}`);
    let addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    let removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    let testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).not.toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).not.toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).toEqual(null);

    // now click on the add optional data button
    act(() => addArrayControlNode!.click());
    act(() => addObjectControlNode!.click());
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).not.toEqual(null);
    expect(addArrayBtn).not.toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).not.toEqual(null);
    expect(testInput).not.toEqual(null);

    // now click on the remove optional data button
    act(() => removeArrayControlNode!.click());
    act(() => removeObjectControlNode!.click());
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addArrayControlNode).not.toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).not.toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).toEqual(null);
  });
});

describe('nameGenerator', () => {
  it('should generate bracket notation names for simple fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const firstNameInput = node.querySelector('#root_firstName');
    const lastNameInput = node.querySelector('#root_lastName');

    expect(firstNameInput).toHaveAttribute('name', 'root[firstName]');
    expect(lastNameInput).toHaveAttribute('name', 'root[lastName]');
  });

  it('should generate dot notation names for simple fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: dotNotationNameGenerator });

    const firstNameInput = node.querySelector('#root_firstName');
    const lastNameInput = node.querySelector('#root_lastName');

    expect(firstNameInput).toHaveAttribute('name', 'root.firstName');
    expect(lastNameInput).toHaveAttribute('name', 'root.lastName');
  });

  it('should generate bracket notation names for nested objects', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const firstNameInput = node.querySelector('#root_person_firstName');
    const streetInput = node.querySelector('#root_person_address_street');
    const cityInput = node.querySelector('#root_person_address_city');

    expect(firstNameInput).toHaveAttribute('name', 'root[person][firstName]');
    expect(streetInput).toHaveAttribute('name', 'root[person][address][street]');
    expect(cityInput).toHaveAttribute('name', 'root[person][address][city]');
  });

  it('should generate bracket notation names for array items', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };
    const formData = {
      tags: ['foo', 'bar'],
    };
    const { node } = createFormComponent({ schema, formData, nameGenerator: bracketNameGenerator });

    const firstTagInput = node.querySelector('#root_tags_0');
    const secondTagInput = node.querySelector('#root_tags_1');

    expect(firstTagInput).toHaveAttribute('name', 'root[tags][0]');
    expect(secondTagInput).toHaveAttribute('name', 'root[tags][1]');
  });

  it('should generate bracket notation names for array of objects', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              done: { type: 'boolean' },
            },
          },
        },
      },
    };
    const formData = {
      tasks: [
        { title: 'Task 1', done: false },
        { title: 'Task 2', done: true },
      ],
    };
    const { node } = createFormComponent({ schema, formData, nameGenerator: bracketNameGenerator });

    const firstTaskTitleInput = node.querySelector('#root_tasks_0_title');
    const firstTaskDoneInput = node.querySelector('#root_tasks_0_done');
    const secondTaskTitleInput = node.querySelector('#root_tasks_1_title');
    const secondTaskDoneInput = node.querySelector('#root_tasks_1_done');

    expect(firstTaskTitleInput).toHaveAttribute('name', 'root[tasks][0][title]');
    expect(firstTaskDoneInput).toHaveAttribute('name', 'root[tasks][0][done]');
    expect(secondTaskTitleInput).toHaveAttribute('name', 'root[tasks][1][title]');
    expect(secondTaskDoneInput).toHaveAttribute('name', 'root[tasks][1][done]');
  });

  it('should generate bracket notation names for select widgets', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          enum: ['red', 'green', 'blue'],
        },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const selectInput = node.querySelector('#root_color');
    expect(selectInput).toHaveAttribute('name', 'root[color]');
  });

  it('should generate bracket notation names for radio widgets', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        option: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
      },
    };
    const uiSchema: UiSchema = {
      option: {
        'ui:widget': 'radio',
      },
    };
    const { node } = createFormComponent({ schema, uiSchema, nameGenerator: bracketNameGenerator });

    const radioInputs = node.querySelectorAll('input[type="radio"]');
    expect(radioInputs[0]).toHaveAttribute('name', 'root[option]');
    expect(radioInputs[1]).toHaveAttribute('name', 'root[option]');
  });

  it('should generate bracket notation names for checkboxes widgets', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        choices: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['foo', 'bar', 'baz'],
          },
          uniqueItems: true,
        },
      },
    };
    const uiSchema: UiSchema = {
      choices: {
        'ui:widget': 'checkboxes',
      },
    };
    const { node } = createFormComponent({ schema, uiSchema, nameGenerator: bracketNameGenerator });

    const checkboxInputs = node.querySelectorAll('input[type="checkbox"]');
    // Checkboxes for multi-value fields have [] appended to indicate multiple values
    expect(checkboxInputs[0]).toHaveAttribute('name', 'root[choices][]');
    expect(checkboxInputs[1]).toHaveAttribute('name', 'root[choices][]');
    expect(checkboxInputs[2]).toHaveAttribute('name', 'root[choices][]');
  });

  it('should generate bracket notation names for textarea widgets', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        description: { type: 'string' },
      },
    };
    const uiSchema: UiSchema = {
      description: {
        'ui:widget': 'textarea',
      },
    };
    const { node } = createFormComponent({ schema, uiSchema, nameGenerator: bracketNameGenerator });

    const textareaInput = node.querySelector('#root_description');
    expect(textareaInput).toHaveAttribute('name', 'root[description]');
  });

  it('should use default id if nameGenerator is not provided', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
      },
    };
    const { node } = createFormComponent({ schema });

    const firstNameInput = node.querySelector('#root_firstName');
    expect(firstNameInput).toHaveAttribute('name', 'root_firstName');
  });

  it('should handle nameGenerator with number fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        age: { type: 'number' },
        count: { type: 'integer' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const ageInput = node.querySelector('#root_age');
    const countInput = node.querySelector('#root_count');

    expect(ageInput).toHaveAttribute('name', 'root[age]');
    expect(countInput).toHaveAttribute('name', 'root[count]');
  });

  it('should handle nameGenerator with boolean fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        active: { type: 'boolean' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const activeInput = node.querySelector('#root_active');
    expect(activeInput).toHaveAttribute('name', 'root[active]');
  });
});

describe('initialFormData feature to prevent form reset', () => {
  const schema: RJSFSchema = {
    title: 'Reset Example',
    properties: {
      name: { type: 'string', title: 'Name' },
    },
  };
  const data = { name: 'initial_id' };
  /** This was adapted from the [example](https://playcode.io/2038613) provided in issue #391
   */
  const FormWrapper = ({ formData, initialFormData }: { formData?: any; initialFormData?: any }) => {
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = () => {
      setIsPending(true);
      setTimeout(() => setIsPending(false), 3000);
    };

    const props: NoValFormProps = {
      schema,
      ...(formData !== undefined && { formData }),
    };

    return (
      <Form
        initialFormData={initialFormData}
        validator={validator}
        onSubmit={handleSubmit}
        disabled={isPending}
        {...props}
      />
    );
  };
  it('show that Form resets without initial data when it is controlled', () => {
    const { container } = render(<FormWrapper formData={data} />);
    let input = container.querySelector('input');
    expect(input).toHaveAttribute('value', data.name);

    fireEvent.change(input!, {
      target: { value: 'new value' },
    });
    input = container.querySelector('input');
    expect(input).toHaveAttribute('value', 'new value');

    const submit = container.querySelector('button');
    act(() => {
      fireEvent.click(submit!);
    });

    input = container.querySelector('input');
    expect(input).toHaveAttribute('value', data.name);
  });
  it('show that Form does not reset with initialFormData when it is uncontrolled', () => {
    const { container } = render(<FormWrapper initialFormData={data} />);
    let input = container.querySelector('input');
    expect(input).toHaveAttribute('value', data.name);

    fireEvent.change(input!, {
      target: { value: 'new value' },
    });
    input = container.querySelector('input');
    expect(input).toHaveAttribute('value', 'new value');

    const submit = container.querySelector('button');
    act(() => {
      fireEvent.click(submit!);
    });

    input = container.querySelector('input');
    expect(input).toHaveAttribute('value', 'new value');
  });
});
