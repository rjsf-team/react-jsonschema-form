import { createRef } from 'react';
import type { FieldTemplateProps, RJSFSchema, UiSchema, ValidatorType } from '@rjsf/utils';
import userEvent from '@testing-library/user-event';

import Form from '../src/index.ts';
import type { NoValFormProps } from './testUtils.tsx';
import {
  createComponent,
  expectToHaveBeenCalledWithFormData,
  setupConsoleErrorSuppression,
  describeRepeated,
} from './testUtils.tsx';

const TWO_BUTTONS = (
  <>
    <button type='submit'>Submit</button>
    <button type='submit'>Another submit</button>
  </>
);
const user = userEvent.setup();
const renderErrorSuppression = setupConsoleErrorSuppression();

describeRepeated('Form common: rendering', (createFormComponent) => {
  describe('Empty schema', () => {
    it('Should throw error when Form is missing validator', () => {
      expect(() =>
        createComponent(Form, { ref: createRef(), schema: {}, validator: undefined as unknown as ValidatorType }),
      ).toThrow('A validator is required for Form functionality to work');
      expect(renderErrorSuppression.consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('The above error occurred in the <Form> component'),
      );
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
      await user.click(addButton!);

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
      await user.click(addButton!);

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

  describe('Option idPrefix', () => {
    it('should change the rendered ids', () => {
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
      for (let i = 0, len = inputs.length; i < len; i += 1) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).toEqual(['rjsf_count']);
      expect(node.querySelector('fieldset')).toHaveAttribute('id', 'rjsf');
    });
  });

  describe('Changing idPrefix', () => {
    it('should work with simple example', () => {
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
      for (let i = 0, len = inputs.length; i < len; i += 1) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).toEqual(['rjsf_count']);
      expect(node.querySelector('fieldset')).toHaveAttribute('id', 'rjsf');
    });

    it('should work with oneOf', () => {
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
      for (let i = 0, len = inputs.length; i < len; i += 1) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).toEqual(['rjsf_key_aws']);
    });
  });

  describe('Option idSeparator', () => {
    it('should change the rendered ids', () => {
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
      for (let i = 0, len = inputs.length; i < len; i += 1) {
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
        <div className={`my-template ${classNames}`}>
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
                // oxlint-disable-next-line react/no-array-index-key
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

    it('should pass errors as the provided React component', async () => {
      // live validate does not run on initial render anymore
      expect(node.querySelectorAll('.error-detail li')).toHaveLength(0);
      const input = node.querySelector<HTMLInputElement>('input')!;
      await user.clear(input);
      await user.type(input, 'stillinvalid');
      expect(node.querySelectorAll('.error-detail li')).toHaveLength(1);
    });

    it('should pass rawErrors as an array of strings', async () => {
      // live validate does not run on initial render anymore
      expect(node.querySelectorAll('.raw-error')).toHaveLength(0);
      const input = node.querySelector<HTMLInputElement>('input')!;
      await user.clear(input);
      await user.type(input, 'stillinvalid');
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
    it('should submit the form when clicked', async () => {
      const { node, onSubmit } = createFormComponent({ schema: {}, children: TWO_BUTTONS });
      const buttons = node.querySelectorAll<HTMLButtonElement>('button[type=submit]');
      expect(buttons).toHaveLength(2);
      await user.click(buttons[0]);
      await user.click(buttons[1]);
      expect(onSubmit).toHaveBeenCalledTimes(2);
    });
  });
});
