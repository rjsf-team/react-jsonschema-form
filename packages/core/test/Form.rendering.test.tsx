import { createRef } from 'react';
import type { FieldTemplateProps, RJSFSchema, UiSchema, ValidatorType } from '@rjsf/utils';
import { JSON_SCHEMA_TYPES } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';

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
setupConsoleErrorSuppression();

describeRepeated('Form common: rendering', (createFormComponent) => {
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

      /** Selects the type named `newType` in the fallback type selector, verifying that it becomes the selected one */
      const selectType = async (newType: string) => {
        const select = node.querySelector('select')!;
        const option = Array.from(select.options).find((anOption) => anOption.textContent === newType)!;
        expect(option).toBeInTheDocument();
        await user.selectOptions(select, option);
        expect(option.selected).toBe(true);
      };

      expect(node.querySelectorAll('.unsupported-field')).toHaveLength(0);
      expect(node.querySelector('select')).toBeInTheDocument();
      const options = node.querySelectorAll<HTMLOptionElement>('select option');
      expect(Array.from(options).map((option) => option.textContent)).toEqual([
        'string',
        'number',
        'integer',
        'boolean',
        'object',
        'array',
        'null',
      ]);
      expect(options[0].selected).toBe(true);
      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveAttribute('value', '123456');

      await selectType('number');
      expect(node.querySelector<HTMLInputElement>('input[inputmode=decimal]')).toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[inputmode=decimal]')).toHaveAttribute('value', '123456');

      // Verify formData was casted to number
      expectToHaveBeenCalledWithFormData(onChange, { unknownProperty: 123456 }, 'root_unknownProperty');

      await selectType('integer');
      expect(node.querySelector<HTMLInputElement>('input[inputmode=numeric]')).toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[inputmode=numeric]')).toHaveAttribute('value', '123456');

      // Verify formData was casted to integer
      expectToHaveBeenCalledWithFormData(onChange, { unknownProperty: 123456 }, 'root_unknownProperty');

      await selectType('boolean');
      expect(node.querySelector<HTMLInputElement>('input[type=checkbox]')).toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[type=checkbox]')).toBeChecked();
      // Verify formData was casted to boolean
      expectToHaveBeenCalledWithFormData(onChange, { unknownProperty: true }, 'root_unknownProperty');

      await selectType('object');
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

      await selectType('array');
      addButton = node.querySelector<HTMLButtonElement>('.rjsf-array-item-add button');
      expect(addButton).toBeInTheDocument();
      // click the add button
      await user.click(addButton!);

      // Verify formData was casted to array
      expectToHaveBeenCalledWithFormData(onChange, { unknownProperty: [undefined] }, 'root_unknownProperty');
    });
  });

  describe('Multiple types', () => {
    const multiTypeSchema = {
      type: 'object',
      properties: {
        multi: { type: ['string', 'boolean'] },
      },
    } as RJSFSchema;

    it('renders the first type when useFallbackUiForUnsupportedType is false', () => {
      const { node } = createFormComponent({ schema: multiTypeSchema });

      expect(node.querySelector('select')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[type=text]')).toBeInTheDocument();
    });

    it('renders a selector of only the allowed types when useFallbackUiForUnsupportedType is true', async () => {
      const { node, onChange } = createFormComponent({
        schema: multiTypeSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { multi: 'a string' },
      });

      const select = node.querySelector('select')!;
      expect(Array.from(select.options).map((option) => option.textContent)).toEqual(['string', 'boolean']);
      expect(select.options[0].selected).toBe(true);
      expect(node.querySelector<HTMLInputElement>('input[type=text]')).toHaveAttribute('value', 'a string');

      await user.selectOptions(select, select.options[1]);

      expect(node.querySelector<HTMLInputElement>('input[type=checkbox]')).toBeInTheDocument();
      expectToHaveBeenCalledWithFormData(onChange, { multi: true }, 'root_multi');
    });

    it('starts the selector on the type the form data already has', () => {
      const { node } = createFormComponent({
        schema: multiTypeSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { multi: false },
      });

      const select = node.querySelector('select')!;
      expect(select.options[1].selected).toBe(true);
      expect(node.querySelector<HTMLInputElement>('input[type=checkbox]')).toBeInTheDocument();
    });

    it('renders a nullable type as its non-null type rather than a selector', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            nullable: { type: ['string', 'null'] },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelector('select')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[type=text]')).toBeInTheDocument();
    });

    it('renders a selector of every type for an unconstrained additional property', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', additionalProperties: true } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: '42.6' },
      });

      const select = node.querySelector('select')!;
      expect(Array.from(select.options).map((option) => option.textContent)).toEqual([
        'string',
        'number',
        'integer',
        'boolean',
        'object',
        'array',
        'null',
      ]);
      expect(select.options[0].selected).toBe(true);

      await user.selectOptions(select, select.options[2]);

      expect(node.querySelector<HTMLInputElement>('input[inputmode=numeric]')).toBeInTheDocument();
      expectToHaveBeenCalledWithFormData(onChange, { aKey: 43 }, 'root_aKey');
      // The key of the additional property is still editable alongside the type selector
      expect(node.querySelector<HTMLInputElement>('#root_aKey-key')).toHaveAttribute('value', 'aKey');
    });

    it('keeps the rest of the schema when rendering the chosen type', async () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            multi: {
              type: ['object', 'string'],
              properties: { shared: { type: 'string', title: 'SHARED' } },
            },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The schema's own `properties` still describe the value once `object`, its first type, is what renders
      expect(node.querySelector<HTMLInputElement>('#root_multi_shared')).toBeInTheDocument();

      const select = node.querySelector('select')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'string')!);

      expect(node.querySelector<HTMLInputElement>('#root_multi_shared')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('#root_multi')).toHaveAttribute('type', 'text');
    });

    it('renders a union constrained by an enum as a select over that enum', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { multi: { type: ['string', 'number'], enum: ['a', 1] } },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The value field is a select over the enum rather than the free-text input a bare `string` would get
      const valueSelect = node.querySelector<HTMLSelectElement>('#root_multi')!;
      expect(valueSelect.tagName).toBe('SELECT');
      expect(Array.from(valueSelect.options).map((o) => o.textContent)).toEqual(['', 'a', '1']);
    });

    it('reconciles the selected type when the schema stops allowing it', async () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { disc: { type: 'string', enum: ['a', 'b'] } },
          dependencies: {
            disc: {
              oneOf: [
                { properties: { disc: { const: 'a' }, val: { type: ['string', 'number'] } } },
                { properties: { disc: { const: 'b' }, val: { type: ['boolean', 'array'] } } },
              ],
            },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { disc: 'a', val: 'some text' },
      });

      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('type', 'text');

      const discSelect = node.querySelector<HTMLSelectElement>('#root_disc')!;
      await user.selectOptions(discSelect, Array.from(discSelect.options).find((o) => o.textContent === 'b')!);

      // The branch switch replaces the types on offer, so the `string` selection gives way rather than leaving the
      // selector reading `boolean` while a text input renders below it
      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).map((o) => o.textContent)).toEqual(['boolean', 'array']);
      expect(Array.from(typeSelect.options).find((o) => o.selected)).toHaveTextContent('boolean');
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('type', 'checkbox');
    });

    it('clears the value rather than stringifying it when switching from null to string', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', additionalProperties: true } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: 'a string' },
      });

      const select = () => node.querySelector<HTMLSelectElement>('select')!;
      await user.selectOptions(select(), Array.from(select().options).find((o) => o.textContent === 'null')!);
      await user.selectOptions(select(), Array.from(select().options).find((o) => o.textContent === 'string')!);

      // `String(null)` would put the literal text `null` into the input as though the user had typed it
      expectToHaveBeenCalledWithFormData(onChange, { aKey: '' }, 'root_aKey');
    });

    it('leaves a union that also has a oneOf to its option selector', () => {
      const schema = {
        type: 'object',
        properties: {
          multi: {
            type: ['object', 'string'],
            properties: { shared: { type: 'string', title: 'SHARED' } },
            oneOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'string' } } }],
          },
        },
      } as RJSFSchema;

      const withFallback = createFormComponent({ schema, useFallbackUiForUnsupportedType: true });
      const withoutFallback = createFormComponent({ schema });

      // The option selector already decides the shape of the value, so both render the same: the shared property,
      // the oneOf selector, and the selected option's own property
      for (const { node } of [withFallback, withoutFallback]) {
        expect(node.querySelector('#root_multi___internal_type_selector')).not.toBeInTheDocument();
        expect(node.querySelector('#root_multi_shared')).toBeInTheDocument();
        expect(node.querySelector('#root_multi__oneof_select')).toBeInTheDocument();
        expect(node.querySelector('#root_multi_a')).toBeInTheDocument();
      }
    });

    it('offers no type selector for an additional property constrained without a type', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', additionalProperties: { enum: ['a', 'b'] } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: 'a' },
      });

      // The schema constrains the value even though it names no type, so every type is not on offer for it
      expect(node.querySelector('#root_aKey___internal_type_selector')).not.toBeInTheDocument();
      // The constraint the selector was withheld for is the one the value field enforces
      const valueSelect = node.querySelector<HTMLSelectElement>('#root_aKey')!;
      expect(valueSelect.tagName).toBe('SELECT');
      expect(Array.from(valueSelect.options).map((o) => o.textContent)).toEqual(['', 'a', 'b']);
    });

    it('offers every type for an additional property its schema only annotates', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', additionalProperties: { title: 'Anything' } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: 'a' },
      });

      // A title says nothing about the value, so the property is as free as `additionalProperties: true` leaves it
      const typeSelect = node.querySelector<HTMLSelectElement>('#root_aKey___internal_type_selector')!;
      expect(typeSelect).toBeInTheDocument();
      expect(Array.from(typeSelect.options)).toHaveLength(JSON_SCHEMA_TYPES.length);
    });

    it('drops a ui:widget the selected type has no widget for', async () => {
      const { node } = createFormComponent({
        schema: multiTypeSchema,
        uiSchema: { multi: { 'ui:widget': 'textarea' } },
        useFallbackUiForUnsupportedType: true,
        formData: { multi: 'a string' },
      });

      expect(node.querySelector('#root_multi')!.tagName).toBe('TEXTAREA');

      const select = () => node.querySelector<HTMLSelectElement>('#root_multi___internal_type_selector')!;
      await user.selectOptions(select(), Array.from(select().options).find((o) => o.textContent === 'boolean')!);

      // There is no `textarea` widget for `boolean`, and `getWidget()` throws rather than falling back, which would
      // take the whole form down instead of rendering the type the user asked for
      expect(node.querySelector<HTMLInputElement>('#root_multi')).toHaveAttribute('type', 'checkbox');

      await user.selectOptions(select(), Array.from(select().options).find((o) => o.textContent === 'string')!);

      // The widget is only dropped for the types that cannot render it
      expect(node.querySelector('#root_multi')!.tagName).toBe('TEXTAREA');
    });

    it('starts a union listing null first on the first type that can hold a value', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['null', 'string', 'number'] } },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).map((o) => o.textContent)).toEqual(['null', 'string', 'number']);
      expect(Array.from(typeSelect.options).find((o) => o.selected)).toHaveTextContent('string');
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('type', 'text');

      // Starting on `null` would have `NullField` write a `null` into the data for a field nobody has touched
      for (const [{ formData }] of onChange.mock.calls) {
        expect(formData).not.toHaveProperty('val');
      }
    });

    it('renders the option content of a union listing null first alongside a oneOf', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            val: { type: ['null', 'string', 'number'], oneOf: [{ minLength: 1 }, { minLength: 5 }] },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The option inherits the first type that can hold a value, rather than a `null` that would render nothing
      expect(node.querySelector('#root_val__oneof_select')).toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('type', 'text');
    });

    it('keeps an unconstrained additional property when its type is switched to null', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', additionalProperties: true } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: 'a string' },
      });

      const select = node.querySelector('select')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'null')!);

      // `null` is a value the property is allowed to hold, so it survives `omitExtraData` and the key stays editable
      expectToHaveBeenCalledWithFormData(onChange, { aKey: null }, 'root_aKey');
      expect(node.querySelector<HTMLInputElement>('#root_aKey-key')).toHaveAttribute('value', 'aKey');
      expect(
        Array.from(node.querySelectorAll<HTMLOptionElement>('select option')).find((o) => o.selected),
      ).toHaveTextContent('null');
    });

    it('renders an unconstrained additional property as its own type when the fallback UI is off', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', additionalProperties: true } as RJSFSchema,
        formData: { aKey: 42 },
      });

      expect(node.querySelector('select')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[inputmode=decimal]')).toHaveAttribute('value', '42');
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
        liveValidate: 'onChange',
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
