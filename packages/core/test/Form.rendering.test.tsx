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
      // The enum already pins the value, so there is no type to choose: switching to `number` would cast the `'a'`
      // the user picked into a value the schema rejects
      expect(node.querySelector('#root_multi___internal_type_selector')).not.toBeInTheDocument();
    });

    it('offers no type selector for a union pinned by a const', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { multi: { type: ['string', 'number'], const: 'a' } },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelector('#root_multi___internal_type_selector')).not.toBeInTheDocument();
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

    it('pairs the type selector with the option selector for a union that also has a oneOf', async () => {
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

      const { node } = createFormComponent({ schema, useFallbackUiForUnsupportedType: true });

      // The type selector wraps the option selector rather than replacing it, so the shared property, the oneOf
      // selector and the selected option's own property all still render for `object`, the first type
      expect(node.querySelector('#root_multi___internal_type_selector')).toBeInTheDocument();
      expect(node.querySelector('#root_multi_shared')).toBeInTheDocument();
      expect(node.querySelector('#root_multi__oneof_select')).toBeInTheDocument();
      expect(node.querySelector('#root_multi_a')).toBeInTheDocument();

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_multi___internal_type_selector')!;
      await user.selectOptions(typeSelect, Array.from(typeSelect.options).find((o) => o.textContent === 'string')!);

      // Choosing `string` re-pins the type the options are rendered for, so the option selector stays while the
      // properties of the `object` type give way to the input the chosen type calls for
      expect(node.querySelector('#root_multi__oneof_select')).toBeInTheDocument();
      expect(node.querySelector('#root_multi_shared')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('#root_multi')).toHaveAttribute('type', 'text');
    });

    it('leaves a union that also has a oneOf one-way with the fallback UI off', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            multi: {
              type: ['object', 'string'],
              properties: { shared: { type: 'string', title: 'SHARED' } },
              oneOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'string' } } }],
            },
          },
        } as RJSFSchema,
      });

      // Without the opt-in UI the first type still wins and the others stay unreachable, exactly as in v6
      expect(node.querySelector('#root_multi___internal_type_selector')).not.toBeInTheDocument();
      expect(node.querySelector('#root_multi_shared')).toBeInTheDocument();
      expect(node.querySelector('#root_multi__oneof_select')).toBeInTheDocument();
      expect(node.querySelector('#root_multi_a')).toBeInTheDocument();
    });

    it('reaches every type of a union from inside a oneOf option', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            multi: { type: ['string', 'number'], oneOf: [{ title: 'A' }, { title: 'B' }] },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      await user.type(node.querySelector<HTMLInputElement>('#root_multi')!, '42');
      // The option is rendered for `string`, the type the selector is on, so the value is the text that was typed
      expectToHaveBeenCalledWithFormData(onChange, { multi: '42' }, 'root_multi');

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_multi___internal_type_selector')!;
      await user.selectOptions(typeSelect, Array.from(typeSelect.options).find((o) => o.textContent === 'number')!);

      // The other member of the union is reachable from within the option, which is what having a type selector at
      // all is for: before it composed with the option selector, an option could only ever be the first type
      expectToHaveBeenCalledWithFormData(onChange, { multi: 42 }, 'root_multi');
      expect(node.querySelector('#root_multi__oneof_select')).toBeInTheDocument();
    });

    it('pairs the type selector with the option selector for a union that also has an anyOf', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            multi: { type: ['string', 'number'], anyOf: [{ title: 'A' }, { title: 'B' }] },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelector('#root_multi___internal_type_selector')).toBeInTheDocument();
      expect(node.querySelector('#root_multi__anyof_select')).toBeInTheDocument();
    });

    it('offers no type selector for a union whose oneOf is a select', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            multi: { type: ['string', 'number'], oneOf: [{ const: 'a' }, { const: 1 }] },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // Options that are all constants pin the value the way an `enum` does, so switching type would only cast a
      // value the user picked into one the schema rejects
      expect(node.querySelector('#root_multi___internal_type_selector')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLSelectElement>('#root_multi')!.tagName).toBe('SELECT');
    });

    it('leaves the members of a composed option to the option rather than stubbing them', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            multi: {
              type: ['object', 'string'],
              oneOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'string' } } }],
            },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { multi: { a: 'hello' } },
      });

      // The options describe the object's members even though the schema around them names no `properties` of its
      // own, so treating that silence as "takes any key/value pair" would stub `a` as an additional property of the
      // value field and render it a second time alongside the option's own
      expect(node.querySelectorAll('#root_multi_a')).toHaveLength(1);
      // ...under a key input and a remove button that would rename or delete a property the schema describes
      expect(node.querySelector('#root_multi_a-key')).not.toBeInTheDocument();
      expect(node.querySelector('#root_multi_a__remove')).not.toBeInTheDocument();
      expect(node.querySelector('.rjsf-object-property-expand button')).not.toBeInTheDocument();
    });

    it('drops the option selector when a composed union is pinned to null', async () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            multi: { type: ['string', 'number', 'null'], oneOf: [{ title: 'A' }, { title: 'B' }] },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelector('#root_multi__oneof_select')).toBeInTheDocument();

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_multi___internal_type_selector')!;
      await user.selectOptions(typeSelect, Array.from(typeSelect.options).find((o) => o.textContent === 'null')!);

      // A `null` is the whole of the value, so an option has nothing left to say about it: the selector would stand
      // over a field that renders nothing and change nothing below it
      expect(node.querySelector('#root_multi__oneof_select')).not.toBeInTheDocument();
      expect(node.querySelector('#root_multi___internal_type_selector')).toBeInTheDocument();
    });

    it('labels the value field once for the control it shares with the field around it', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: { title: 'Foo', type: ['string', 'number'], oneOf: [{ title: 'A' }, { title: 'B' }] },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The value field renders for the `id` the outer label already points at, so a label of its own would be a
      // second one naming the same input — read out as one run-on name, and both focusing it
      expect(node.querySelectorAll('label[for="root_foo"]')).toHaveLength(1);
      expect(node.querySelector('label[for="root_foo"]')).toHaveTextContent('Foo');
    });

    it('keeps the value field title for a type that renders no label of its own', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { foo: { title: 'Foo', type: ['object', 'string'] } } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { foo: { k: 1 } },
      });

      // An `object` field renders no label, so its own title is the only heading the value has and must survive the
      // rule that drops a second label
      expect(node.querySelector('#root_foo__title')).toBeInTheDocument();
    });

    it('gives the composed selectors distinct DOM ids', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            multi: {
              type: ['object', 'string'],
              properties: { shared: { type: 'string', title: 'SHARED' } },
              oneOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'string' } } }],
            },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // Two fields now render the same data address — the fallback UI's value field and the option selector's — so
      // the `XxxOf` suffix that keeps them apart has to survive being reached one level deeper than before
      const ids = Array.from(node.querySelectorAll('[id]')).map((element) => element.id);
      expect(ids).toHaveLength(new Set(ids).size);
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

    it('locks the type selector of an additional property its schema marks read-only', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', additionalProperties: { readOnly: true } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: 'a' },
      });

      // `readOnly` is no constraint on the type, so every type is on offer, but changing it would change the value
      const typeSelect = node.querySelector<HTMLSelectElement>('#root_aKey___internal_type_selector')!;
      expect(Array.from(typeSelect.options)).toHaveLength(JSON_SCHEMA_TYPES.length);
      expect(typeSelect).toBeDisabled();
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

    it('renders the option content of a nullable type alongside a oneOf', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            val: { type: ['string', 'null'], oneOf: [{ pattern: '^a' }, { pattern: '^b' }] },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: null },
      });

      // A nullable type is not a union, so the option inherits the single type it resolves to and renders a field
      // for it rather than the nothing a `null` type renders
      expect(node.querySelector('#root_val__oneof_select')).toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('type', 'text');
    });

    it('reconciles the selected type when form data of another shape replaces it', () => {
      const props: NoValFormProps = {
        schema: { type: 'object', additionalProperties: true } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: 'a string' },
      };
      const { node, rerender } = createFormComponent(props);

      const selected = () =>
        Array.from(node.querySelectorAll<HTMLOptionElement>('#root_aKey___internal_type_selector option')).find(
          (o) => o.selected,
        );
      expect(selected()).toHaveTextContent('string');

      rerender({ ...props, formData: { aKey: { nested: 'value' } } });

      // Data replaced by a controlled parent never went through the selector, so the `string` selection gives way
      // rather than leaving a text input to render the object as `[object Object]`
      expect(selected()).toHaveTextContent('object');
      expect(node.querySelector<HTMLInputElement>('#root_aKey_nested')).toHaveAttribute('value', 'value');
    });

    it('keeps the reconciled type after the data that forced it is cleared', async () => {
      const props: NoValFormProps = {
        schema: {
          type: 'object',
          properties: { val: { type: ['object', 'number'], properties: { a: { type: 'string' } } } },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: { a: 'nested' } },
      };
      const { node, rerender } = createFormComponent(props);

      const selected = () =>
        Array.from(node.querySelectorAll<HTMLOptionElement>('#root_val___internal_type_selector option')).find(
          (o) => o.selected,
        );
      expect(selected()).toHaveTextContent('object');

      rerender({ ...props, formData: { val: 5 } });
      expect(selected()).toHaveTextContent('number');
      await user.clear(node.querySelector<HTMLInputElement>('#root_val')!);

      // Emptying the input leaves no data to reconcile against, which must not bring back the `object` the property
      // used to hold and swap out the number input the user is typing in
      expect(selected()).toHaveTextContent('number');
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('inputmode', 'decimal');
    });

    it('leaves a number empty when the value it replaces has no numeric form', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: 'not a number' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'number')!);

      // Text that reads as no number at all leaves the field empty, since a `0` would satisfy `required` and
      // `minimum` as though the user had entered it
      expectToHaveBeenCalledWithFormData(onChange, {}, 'root_val');
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('value', '');
    });

    it('rounds a numeric string to the integer it reads as', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'integer'] } } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: '3.7' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'integer')!);

      // Clearing a value with no numeric form must not cost the conversion of one that has it
      expectToHaveBeenCalledWithFormData(onChange, { val: 4 }, 'root_val');
    });

    it('keeps the selected type while a number is mid-edit', async () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: 'text' },
      });

      const select = () => node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select(), Array.from(select().options).find((o) => o.textContent === 'number')!);
      await user.type(node.querySelector<HTMLInputElement>('#root_val')!, '3.');

      // `asNumber()` holds a trailing decimal point as the string `'3.'` until the next digit is typed, which must
      // not read as the value becoming a string and send the selector back to `string` mid-keystroke
      expect(Array.from(select().options).find((o) => o.selected)).toHaveTextContent('number');
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('value', '3.');
    });

    it('returns a boolean to itself on a round trip through string', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['boolean', 'string'] } } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: false },
      });

      const select = () => node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select(), Array.from(select().options).find((o) => o.textContent === 'string')!);
      expectToHaveBeenCalledWithFormData(onChange, { val: 'false' }, 'root_val');

      await user.selectOptions(select(), Array.from(select().options).find((o) => o.textContent === 'boolean')!);

      // `Boolean('false')` is `true`, which would have two clicks turn a `false` the user never touched into a `true`
      expectToHaveBeenCalledWithFormData(onChange, { val: false }, 'root_val');
    });

    it('keeps focus on the type selector across a type change', async () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: 'text' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'number')!);

      // Remounting the selector on every form data change would drop the keyboard focus of the user changing types
      expect(document.activeElement).toBe(node.querySelector('#root_val___internal_type_selector'));
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

    it('renders the description and deprecation of a union once', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            multi: { type: ['string', 'number'], description: 'DESCRIPTION', deprecated: true },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The outer field already renders them, so the value field repeating them would also repeat the description's
      // DOM id that `aria-describedby` points at
      expect(node.querySelectorAll('[id="root_multi__description"]')).toHaveLength(1);
      expect(node.querySelectorAll('.field-description')).toHaveLength(1);
    });

    it('offers only the recognized types of a list that also names an unrecognized one', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['someUnsupportedType', 'string'] } },
        } as unknown as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The unrecognized name is what sends the field to the fallback UI, which must not then offer types the schema
      // does not allow
      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).map((o) => o.textContent)).toEqual(['string']);
    });

    it('reconciles the selected type when a null replaces the form data', () => {
      const props: NoValFormProps = {
        schema: { type: 'object', additionalProperties: true } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: 'text' },
      };
      const { node, rerender } = createFormComponent(props);

      const selected = () =>
        Array.from(node.querySelectorAll<HTMLOptionElement>('#root_aKey___internal_type_selector option')).find(
          (o) => o.selected,
        );
      expect(selected()).toHaveTextContent('string');

      rerender({ ...props, formData: { aKey: null } });

      // An empty text input would hide the `null`, and the next keystroke would silently replace it
      expect(selected()).toHaveTextContent('null');
    });

    it('drops a ui:widget a ui:definitions entry supplies for a type that has no such widget', async () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { multi: { $ref: '#/$defs/multi' } },
          $defs: { multi: { type: ['string', 'boolean'] } },
        } as RJSFSchema,
        uiSchema: { 'ui:definitions': { '#/$defs/multi': { 'ui:widget': 'textarea' } } },
        useFallbackUiForUnsupportedType: true,
        formData: { multi: 'a string' },
      });

      expect(node.querySelector('#root_multi')!.tagName).toBe('TEXTAREA');

      const select = node.querySelector<HTMLSelectElement>('#root_multi___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'boolean')!);

      // The value schema keeping the marker of the `$ref` it was resolved from would have the definition's widget
      // merged back in below, undoing the drop and taking the whole form down with a widget `boolean` has no
      // implementation of
      expect(node.querySelector<HTMLInputElement>('#root_multi')).toHaveAttribute('type', 'checkbox');
    });

    it('leaves a boolean empty when there is no value to cast', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          required: ['val'],
          properties: { val: { type: ['string', 'boolean'] } },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'boolean')!);

      // `Boolean(undefined)` is `false`, which would satisfy `required` for a field nobody has filled in
      for (const [{ formData }] of onChange.mock.calls) {
        expect(formData.val).toBeUndefined();
      }
      expect(node.querySelector<HTMLInputElement>('#root_val')).not.toBeChecked();
    });

    it('marks the value of a required field required rather than the type selector', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          required: ['val'],
          properties: { val: { type: ['string', 'boolean'] } },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The selector always has a type chosen, so requiring it says nothing, while its marker reads as a second
      // required field within the one the outer label already marks
      expect(node.querySelector('#root_val___internal_type_selector')).not.toBeRequired();
      expect(node.querySelector('#root_val')).toBeRequired();
    });

    it.each([
      ['the ui:xxx spelling', { 'ui:title': 'TITLE', 'ui:description': 'DESC', 'ui:help': 'HELP' }],
      ['the ui:options spelling', { 'ui:options': { title: 'TITLE', description: 'DESC', help: 'HELP' } }],
    ])('renders the uiSchema title, description and help of a union once, in %s', (_, uiSchema) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } } as RJSFSchema,
        uiSchema: { val: uiSchema } as UiSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The field around the value renders each of them, so a second copy would repeat the DOM ids that the value's
      // `aria-describedby` points at, and label the very same input twice
      expect(node.querySelectorAll('[id="root_val__description"]')).toHaveLength(1);
      expect(node.querySelectorAll('[id="root_val__help"]')).toHaveLength(1);
      // `TITLE` names the value's own input, so the value field adds no second label pointing at the same `id`
      expect(Array.from(node.querySelectorAll('label')).map((label) => label.textContent)).toEqual(['TITLE', 'Type']);
    });

    it('leaves a boolean empty when the value it replaces is a container', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['object', 'boolean'] } } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: {} },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'boolean')!);

      // `Boolean({})` is `true`, which would check a box the user never checked
      for (const [{ formData }] of onChange.mock.calls) {
        expect(formData.val).not.toBe(true);
      }
      expect(node.querySelector<HTMLInputElement>('#root_val')).not.toBeChecked();
    });

    it('keeps the examples of a union as suggestions for its value', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { multi: { type: ['string', 'number'], examples: ['a', 'b'] } },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // Only the value's own input renders the examples, so the field around it has no copy of them to fall back on
      expect(node.querySelector('#root_multi')).toHaveAttribute('list', 'root_multi__examples');
      expect(node.querySelectorAll('#root_multi__examples option')).toHaveLength(2);
    });

    it('keeps the selected type when an input whose empty value is null is cleared', async () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number', 'null'] } } } as RJSFSchema,
        uiSchema: { val: { 'ui:emptyValue': null } },
        useFallbackUiForUnsupportedType: true,
        formData: { val: 'text' },
      });

      await user.clear(node.querySelector<HTMLInputElement>('#root_val')!);

      // The `null` is how this input reports being empty, not a switch to the `null` type
      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).find((o) => o.selected)).toHaveTextContent('string');
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('type', 'text');
    });

    it('reads the spellings of false a user types as false', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'boolean'] } } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: ' False ' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'boolean')!);

      expectToHaveBeenCalledWithFormData(onChange, { val: false }, 'root_val');
    });

    it.each([
      ['a boolean', true],
      ['blank text', '   '],
    ])('leaves a number empty when switching from %s', async (_, value) => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['boolean', 'string', 'number'] } } } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: value },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'number')!);

      // `Number(true)` is `1` and `Number('   ')` is `0`, neither of which the user entered
      expectToHaveBeenCalledWithFormData(onChange, {}, 'root_val');
    });

    it('clears the errors of the value it replaces when the type changes', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            val: { type: ['object', 'string'], properties: { nested: { type: 'string', minLength: 5 } } },
          },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: { nested: 'x' } },
      });

      await user.click(node.querySelector('button[type=submit]')!);
      expect(node.querySelector('#root_val_nested__error')).toBeInTheDocument();

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'string')!);

      // The error belonged to a property of the object the cast replaced, so passing the field's error schema back
      // with the new value would re-assert it against a string that has no such property
      const [{ errorSchema }] = onChange.mock.calls.at(-1)!;
      expect(errorSchema.val?.nested).toBeUndefined();
    });

    it('leaves a boolean empty when switching from blank text', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          required: ['val'],
          properties: { val: { type: ['string', 'boolean'] } },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: '   ' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'boolean')!);

      // Text a user has cleared spells neither `true` nor `false`, so reading it as a definite `false` would satisfy
      // `required` for a field nobody has filled in
      expectToHaveBeenCalledWithFormData(onChange, {}, 'root_val');
      expect(node.querySelector<HTMLInputElement>('#root_val')).not.toBeChecked();
    });

    it('keeps reporting message-less errors after a type change that had nothing to clear', async () => {
      const { node, onError } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['string', 'number'] }, other: { type: 'string', minLength: 5 } },
        } as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
        transformErrors: (errors) => errors.map((error) => ({ ...error, message: undefined })),
        formData: { other: 'x' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(select, Array.from(select.options).find((o) => o.textContent === 'number')!);
      await user.click(node.querySelector('button[type=submit]')!);

      // An empty error schema handed to a value that had no errors is stored as a custom error of the form's own,
      // which every later validation then merges in, dropping the errors `toErrorSchema()` leaves out of its schema
      expect(onError).toHaveBeenCalledWith([expect.objectContaining({ property: '.other' })]);
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
