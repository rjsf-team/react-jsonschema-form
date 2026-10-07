import { createRef } from 'react';
import type { FieldTemplateProps, RJSFSchema, UiSchema, ValidatorType } from '@rjsf/utils';
import { JSON_SCHEMA_TYPES } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';

import FallbackField from '../src/components/fields/FallbackField.tsx';
import Form from '../src/index.ts';
import type { NoValFormProps } from './testUtils.tsx';
import {
  createComponent,
  createFormComponent as createDirectFormComponent,
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

/** The ways something other than the schema's own type names the fallback field for it, as `[label, uiSchema, schema]`
 * for a schema at `properties.val`. Shared so a route added here is covered by every test that walks them
 */
const FALLBACK_FIELD_ROUTES: [string, UiSchema, RJSFSchema][] = [
  ['a $id', {}, { $id: 'FallbackField' }],
  ['a ui:field', { val: { 'ui:field': 'FallbackField' } }, {}],
  ['a ui:globalOptions field', { 'ui:globalOptions': { field: 'FallbackField' } }, {}],
];

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
        initialFormData: {
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
        initialFormData: { multi: 'a string' },
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
        },
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelector('select')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[type=text]')).toBeInTheDocument();
    });

    it('renders a selector of every type for an unconstrained additional property', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', additionalProperties: true },
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: '42' },
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
      expectToHaveBeenCalledWithFormData(onChange, { aKey: 42 }, 'root_aKey');
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
        },
        useFallbackUiForUnsupportedType: true,
      });

      // The schema's own `properties` still describe the value once `object`, its first type, is what renders
      expect(node.querySelector<HTMLInputElement>('#root_multi_shared')).toBeInTheDocument();

      const select = node.querySelector('select')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'string')!,
      );

      expect(node.querySelector<HTMLInputElement>('#root_multi_shared')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('#root_multi')).toHaveAttribute('type', 'text');
    });

    it('renders a union constrained by an enum as a select over that enum', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { multi: { type: ['string', 'number'], enum: ['a', 1] } },
        },
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
        },
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
        },
        useFallbackUiForUnsupportedType: true,
        initialFormData: { disc: 'a', val: 'some text' },
      });

      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('type', 'text');

      const discSelect = node.querySelector<HTMLSelectElement>('#root_disc')!;
      await user.selectOptions(
        discSelect,
        Array.from(discSelect.options).find((o) => o.textContent === 'b')!,
      );

      // The branch switch replaces the types on offer, so the `string` selection gives way rather than leaving the
      // selector reading `boolean` while a text input renders below it
      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).map((o) => o.textContent)).toEqual(['boolean', 'array']);
      expect(Array.from(typeSelect.options).find((o) => o.selected)).toHaveTextContent('boolean');
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('type', 'checkbox');
    });

    it('clears the value rather than stringifying it when switching from null to string', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', additionalProperties: true },
        useFallbackUiForUnsupportedType: true,
        initialFormData: { aKey: 'a string' },
      });

      const select = () => node.querySelector<HTMLSelectElement>('select')!;
      await user.selectOptions(
        select(),
        Array.from(select().options).find((o) => o.textContent === 'null')!,
      );
      await user.selectOptions(
        select(),
        Array.from(select().options).find((o) => o.textContent === 'string')!,
      );

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
      await user.selectOptions(
        typeSelect,
        Array.from(typeSelect.options).find((o) => o.textContent === 'string')!,
      );

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
        },
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
        },
        useFallbackUiForUnsupportedType: true,
      });

      await user.type(node.querySelector<HTMLInputElement>('#root_multi')!, '42');
      // The option is rendered for `string`, the type the selector is on, so the value is the text that was typed
      expectToHaveBeenCalledWithFormData(onChange, { multi: '42' }, 'root_multi');

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_multi___internal_type_selector')!;
      await user.selectOptions(
        typeSelect,
        Array.from(typeSelect.options).find((o) => o.textContent === 'number')!,
      );

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
        },
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
        },
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
        },
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
        },
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelector('#root_multi__oneof_select')).toBeInTheDocument();

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_multi___internal_type_selector')!;
      await user.selectOptions(
        typeSelect,
        Array.from(typeSelect.options).find((o) => o.textContent === 'null')!,
      );

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
        },
        useFallbackUiForUnsupportedType: true,
      });

      // The value field renders for the `id` the outer label already points at, so a label of its own would be a
      // second one naming the same input — read out as one run-on name, and both focusing it
      expect(node.querySelectorAll('label[for="root_foo"]')).toHaveLength(1);
      expect(node.querySelector('label[for="root_foo"]')).toHaveTextContent('Foo');
    });

    it('keeps the value field title for a type that renders no label of its own', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { foo: { title: 'Foo', type: ['object', 'string'] } } },
        useFallbackUiForUnsupportedType: true,
        formData: { foo: { k: 1 } },
      });

      // An `object` field renders no label, so its own title is the only heading the value has and must survive the
      // rule that drops a second label
      expect(node.querySelector('#root_foo__title')).toHaveTextContent('Foo');
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
        },
        useFallbackUiForUnsupportedType: true,
      });

      // Two fields now render the same data address — the fallback UI's value field and the option selector's — so
      // the `XxxOf` suffix that keeps them apart has to survive being reached one level deeper than before
      const ids = Array.from(node.querySelectorAll('[id]')).map((element) => element.id);
      expect(ids).toHaveLength(new Set(ids).size);
    });

    it('reaches every type from an additional property whose value has been cleared', async () => {
      const { node } = createFormComponent({
        schema: { type: 'object', additionalProperties: true },
        useFallbackUiForUnsupportedType: true,
        initialFormData: { aKey: 'text' },
      });

      await user.clear(node.querySelector<HTMLInputElement>('#root_aKey')!);
      const select = node.querySelector<HTMLSelectElement>('#root_aKey___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'boolean')!,
      );

      // Clearing an additional property stores the empty string so its key survives, which must not read as a
      // `string` the selector has to go back to and so put every other type out of reach of a cleared value
      expect(Array.from(select.options).find((o) => o.selected)?.textContent).toBe('boolean');
      expect(node.querySelector<HTMLInputElement>('input[type=checkbox]')).toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('#root_aKey-key')).toHaveAttribute('value', 'aKey');
    });

    it('renders the title and description of a union whose field renders no label of its own', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { multi: { title: 'TITLE', description: 'DESCRIPTION', type: ['object', 'string'] } },
        },
        useFallbackUiForUnsupportedType: true,
      });

      // An `object` field renders neither, and the union resolves to its first type for that decision, so the value
      // field is the only place either of them can appear
      expect(node.querySelector('#root_multi__title')).toHaveTextContent('TITLE');
      expect(node).toHaveTextContent('DESCRIPTION');
    });

    it('renders the title of a union that resolves to a type with no label once', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { multi: { title: 'TITLE', type: ['boolean', 'string'] } },
        },
        useFallbackUiForUnsupportedType: true,
      });

      const labels = Array.from(node.querySelectorAll('label')).map((label) => label.textContent);
      expect(labels).toEqual(['Type', 'TITLE']);
    });

    it('names an untitled union after the property, as the field for a single type does', () => {
      const withFallback = createFormComponent({
        schema: { type: 'object', properties: { config: { type: ['object', 'string'] } } },
        useFallbackUiForUnsupportedType: true,
      });
      const withoutFallback = createFormComponent({
        schema: { type: 'object', properties: { config: { type: 'object' } } },
      });

      // The value field is the only place a heading can appear here, so naming its role there would rename every
      // untitled property the moment the fallback UI is turned on
      expect(withFallback.node.querySelector('#root_config__title')).toHaveTextContent('config');
      expect(withoutFallback.node.querySelector('#root_config__title')).toHaveTextContent('config');
    });

    it('gives way to form data of another type that replaces an empty string', () => {
      const schema = {
        type: 'object',
        properties: { val: { type: ['array', 'string'], items: { type: 'string' } } },
      } as RJSFSchema;
      const { node, rerender } = createFormComponent({
        schema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: ['an item'] },
      });

      rerender({ schema, useFallbackUiForUnsupportedType: true, formData: { val: '' } });

      // Only an additional property stores a cleared value as the empty string; anywhere else it is a `string` like
      // any other, so the selector must follow it rather than leave the array UI standing over string data
      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(select.options).find((o) => o.selected)?.textContent).toBe('string');
    });

    it('gives way to an empty string that replaces the object of an additional property', () => {
      const schema = { type: 'object', additionalProperties: true } as RJSFSchema;
      const { node, rerender } = createFormComponent({
        schema,
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: { a: 1 } },
      });

      rerender({ schema, useFallbackUiForUnsupportedType: true, formData: { aKey: '' } });

      // An `object` selection starts out as the empty object of its own rather than the empty string a cleared value
      // is stored as, so this one arrived from outside the form and is `string` data the selector has to follow
      const select = node.querySelector<HTMLSelectElement>('#root_aKey___internal_type_selector')!;
      expect(Array.from(select.options).find((o) => o.selected)?.textContent).toBe('string');
    });

    it('leaves a union to a widget the caller supplied as a component', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { multi: { type: ['string', 'number'] } } },
        uiSchema: { multi: { 'ui:widget': () => <div id='own-widget' /> } },
        useFallbackUiForUnsupportedType: true,
        formData: { multi: 'a string' },
      });

      // A control written for this schema handles the union itself, so wrapping it in a selector that pins the type
      // and casts the value on every switch would take away what it was written to do
      expect(node.querySelector('#own-widget')).toBeInTheDocument();
      expect(node.querySelector('#root_multi___internal_type_selector')).not.toBeInTheDocument();
    });

    it('still offers a type selector for an unconstrained additional property given a widget as a component', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', additionalProperties: true },
        uiSchema: { additionalProperties: { 'ui:widget': () => <div id='own-widget' /> } },
        useFallbackUiForUnsupportedType: true,
        formData: { aKey: 'a' },
      });

      // The schema lists no types for such a control to handle — the stub's type came from the data — so the
      // selector stands and the widget renders within it, the way it does for an unrecognized `type`
      expect(node.querySelector('#root_aKey___internal_type_selector')).toBeInTheDocument();
      expect(node.querySelector('#own-widget')).toBeInTheDocument();
    });

    // `0` and `null` stand in for an untyped JSON uiSchema, which the field's own label already treats as `false`
    it.each([false, 0, null])(
      'hides the type selector label along with the label of the field it sits in for a ui:label of %s',
      (label) => {
        const { node } = createFormComponent({
          schema: multiTypeSchema,
          uiSchema: { multi: { 'ui:options': { label } } },
          useFallbackUiForUnsupportedType: true,
          formData: { multi: 'a string' },
        });

        // Asserted first so that a selector gone missing fails here rather than passing the label check below, which a
        // field rendered without one satisfies just as well
        expect(node.querySelector('#root_multi___internal_type_selector')).toBeInTheDocument();
        // The selector is a control within the field, so the option that turns the field's label off turns its own off
        expect(Array.from(node.querySelectorAll('label')).map((aLabel) => aLabel.textContent)).toEqual([]);
      },
    );

    it('offers no type selector for an additional property constrained without a type', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', additionalProperties: { enum: ['a', 'b'] } },
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
        schema: { type: 'object', additionalProperties: { title: 'Anything' } },
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
        schema: { type: 'object', additionalProperties: { readOnly: true } },
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
        initialFormData: { multi: 'a string' },
      });

      expect(node.querySelector('#root_multi')!.tagName).toBe('TEXTAREA');

      const select = () => node.querySelector<HTMLSelectElement>('#root_multi___internal_type_selector')!;
      await user.selectOptions(
        select(),
        Array.from(select().options).find((o) => o.textContent === 'boolean')!,
      );

      // There is no `textarea` widget for `boolean`, and `getWidget()` throws rather than falling back, which would
      // take the whole form down instead of rendering the type the user asked for
      expect(node.querySelector<HTMLInputElement>('#root_multi')).toHaveAttribute('type', 'checkbox');

      await user.selectOptions(
        select(),
        Array.from(select().options).find((o) => o.textContent === 'string')!,
      );

      // The widget is only dropped for the types that cannot render it
      expect(node.querySelector('#root_multi')!.tagName).toBe('TEXTAREA');
    });

    it('starts a union listing null first on the first type that can hold a value', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['null', 'string', 'number'] } },
        },
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

    it('starts a union with no data on the type its ui:widget renders', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          required: ['val'],
          properties: { val: { type: ['null', 'boolean', 'string'] } },
        },
        uiSchema: { val: { 'ui:widget': 'textarea' } },
        useFallbackUiForUnsupportedType: true,
      });

      // The defaults follow the `textarea` to the `string` type and seed no `false`, so a `boolean` selection would show
      // an unchecked box holding no value
      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).find((o) => o.selected)).toHaveTextContent('string');
      expect(node.querySelector('#root_val')!.tagName).toBe('TEXTAREA');
    });

    // `SchemaField` layers the globals in when it picks the field, so the selection starts on that field's type
    it('starts a union with no data on the type the widget in ui:globalOptions renders', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['null', 'boolean', 'string'] } } },
        uiSchema: { 'ui:globalOptions': { widget: 'textarea' } },
        useFallbackUiForUnsupportedType: true,
      });

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).find((o) => o.selected)).toHaveTextContent('string');
      expect(node.querySelector('#root_val')!.closest('.rjsf-field')).toHaveClass('rjsf-field-string');
    });

    // `getWidget()` throws for a widget the selected type has none of, which would take the whole form down
    it('drops a widget in ui:globalOptions that the type the data selects has none of', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['null', 'boolean', 'string'] } } },
        uiSchema: { 'ui:globalOptions': { widget: 'textarea' } },
        formData: { val: true },
        useFallbackUiForUnsupportedType: true,
      });

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).find((o) => o.selected)).toHaveTextContent('boolean');
      expect(node.querySelector('#root_val')).toBeChecked();
    });

    it('starts a union holding data of a type it does not list on the type its ui:widget renders', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['null', 'boolean', 'string'] } } },
        uiSchema: { val: { 'ui:widget': 'textarea' } },
        formData: { val: 5 },
        useFallbackUiForUnsupportedType: true,
      });

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).find((o) => o.selected)).toHaveTextContent('string');
    });

    // A `format` constrains only the list's string member, so it moves neither the selection nor the field to it
    it('starts a union with no data on its first type whatever widget its format names', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['number', 'string'], format: 'email' } } },
        useFallbackUiForUnsupportedType: true,
      });

      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).find((o) => o.selected)).toHaveTextContent('number');
      expect(node.querySelector('#root_val')).toHaveAttribute('type', 'text');
    });

    it('renders the option content of a union listing null first alongside a oneOf', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            val: { type: ['null', 'string', 'number'], oneOf: [{ minLength: 1 }, { minLength: 5 }] },
          },
        },
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
        },
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
        schema: { type: 'object', additionalProperties: true },
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
        },
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
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } },
        useFallbackUiForUnsupportedType: true,
        initialFormData: { val: 'not a number' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'number')!,
      );

      // Text that reads as no number at all leaves the field empty, since a `0` would satisfy `required` and
      // `minimum` as though the user had entered it
      expectToHaveBeenCalledWithFormData(onChange, {}, 'root_val');
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('value', '');
    });

    it('converts a numeric string to the integer it reads as', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'integer'] } } },
        useFallbackUiForUnsupportedType: true,
        formData: { val: '4' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'integer')!,
      );

      // Clearing a value with no integer form must not cost the conversion of one that has it
      expectToHaveBeenCalledWithFormData(onChange, { val: 4 }, 'root_val');
    });

    it('leaves an integer empty for a fractional value that has no integer form', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['number', 'integer'] } } },
        useFallbackUiForUnsupportedType: true,
        formData: { val: -2.5 },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'integer')!,
      );

      // Rounding would rewrite the value the user entered, and switching back would show the rounded value rather
      // than what they had, so the number they typed is never recoverable
      expectToHaveBeenCalledWithFormData(onChange, {}, 'root_val');
    });

    it('keeps the selected type while a number is mid-edit', async () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } },
        useFallbackUiForUnsupportedType: true,
        initialFormData: { val: 'text' },
      });

      const select = () => node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select(),
        Array.from(select().options).find((o) => o.textContent === 'number')!,
      );
      await user.type(node.querySelector<HTMLInputElement>('#root_val')!, '3.');

      // `asNumber()` holds a trailing decimal point as the string `'3.'` until the next digit is typed, which must
      // not read as the value becoming a string and send the selector back to `string` mid-keystroke
      expect(Array.from(select().options).find((o) => o.selected)).toHaveTextContent('number');
      expect(node.querySelector<HTMLInputElement>('#root_val')).toHaveAttribute('value', '3.');
    });

    it('returns a boolean to itself on a round trip through string', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['boolean', 'string'] } } },
        useFallbackUiForUnsupportedType: true,
        formData: { val: false },
      });

      const select = () => node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select(),
        Array.from(select().options).find((o) => o.textContent === 'string')!,
      );
      expectToHaveBeenCalledWithFormData(onChange, { val: 'false' }, 'root_val');

      await user.selectOptions(
        select(),
        Array.from(select().options).find((o) => o.textContent === 'boolean')!,
      );

      // `Boolean('false')` is `true`, which would have two clicks turn a `false` the user never touched into a `true`
      expectToHaveBeenCalledWithFormData(onChange, { val: false }, 'root_val');
    });

    it('keeps focus on the type selector across a type change', async () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } },
        useFallbackUiForUnsupportedType: true,
        formData: { val: 'text' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'number')!,
      );

      // Remounting the selector on every form data change would drop the keyboard focus of the user changing types
      expect(document.activeElement).toBe(node.querySelector('#root_val___internal_type_selector'));
    });

    it('keeps an unconstrained additional property when its type is switched to null', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', additionalProperties: true },
        useFallbackUiForUnsupportedType: true,
        initialFormData: { aKey: 'a string' },
      });

      const select = node.querySelector('select')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'null')!,
      );

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
        },
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
          properties: { val: { type: ['someUnsupportedType', 'string', 'number'] } },
        } as unknown as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The unrecognized name is what sends the field to the fallback UI, which must not then offer types the schema
      // does not allow
      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(typeSelect.options).map((o) => o.textContent)).toEqual(['string', 'number']);
    });

    it('reconciles the selected type when a null replaces the form data', () => {
      const props: NoValFormProps = {
        schema: { type: 'object', additionalProperties: true },
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
        },
        uiSchema: { 'ui:definitions': { '#/$defs/multi': { 'ui:widget': 'textarea' } } },
        useFallbackUiForUnsupportedType: true,
        initialFormData: { multi: 'a string' },
      });

      expect(node.querySelector('#root_multi')!.tagName).toBe('TEXTAREA');

      const select = node.querySelector<HTMLSelectElement>('#root_multi___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'boolean')!,
      );

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
        },
        useFallbackUiForUnsupportedType: true,
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'boolean')!,
      );

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
        },
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
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } },
        uiSchema: { val: uiSchema },
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
        schema: { type: 'object', properties: { val: { type: ['object', 'boolean'] } } },
        useFallbackUiForUnsupportedType: true,
        formData: { val: {} },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'boolean')!,
      );

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
        },
        useFallbackUiForUnsupportedType: true,
      });

      // Only the value's own input renders the examples, so the field around it has no copy of them to fall back on
      expect(node.querySelector('#root_multi')).toHaveAttribute('list', 'root_multi__examples');
      expect(node.querySelectorAll('#root_multi__examples option')).toHaveLength(2);
    });

    it('keeps the selected type when an input whose empty value is null is cleared', async () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number', 'null'] } } },
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
        schema: { type: 'object', properties: { val: { type: ['string', 'boolean'] } } },
        useFallbackUiForUnsupportedType: true,
        formData: { val: ' False ' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'boolean')!,
      );

      expectToHaveBeenCalledWithFormData(onChange, { val: false }, 'root_val');
    });

    it.each([
      ['a boolean', true],
      ['blank text', '   '],
    ])('leaves a number empty when switching from %s', async (_, value) => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['boolean', 'string', 'number'] } } },
        useFallbackUiForUnsupportedType: true,
        formData: { val: value },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'number')!,
      );

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
        },
        useFallbackUiForUnsupportedType: true,
        formData: { val: { nested: 'x' } },
      });

      await user.click(node.querySelector('button[type=submit]')!);
      expect(node.querySelector('#root_val_nested__error')).toBeInTheDocument();

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'string')!,
      );

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
        },
        useFallbackUiForUnsupportedType: true,
        formData: { val: '   ' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'boolean')!,
      );

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
        },
        useFallbackUiForUnsupportedType: true,
        transformErrors: (errors) => errors.map((error) => ({ ...error, message: undefined })),
        formData: { other: 'x' },
      });

      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      await user.selectOptions(
        select,
        Array.from(select.options).find((o) => o.textContent === 'number')!,
      );
      await user.click(node.querySelector('button[type=submit]')!);

      // An empty error schema handed to a value that had no errors is stored as a custom error of the form's own,
      // which every later validation then merges in, dropping the errors `toErrorSchema()` leaves out of its schema
      expect(onError).toHaveBeenCalledWith([expect.objectContaining({ property: '.other' })]);
    });

    it('renders an unconstrained additional property as its own type when the fallback UI is off', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', additionalProperties: true },
        formData: { aKey: 42 },
      });

      expect(node.querySelector('select')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input[inputmode=decimal]')).toHaveAttribute('value', '42');
    });

    it('leaves the whole union on an option of a schema the fallback UI has not pinned', () => {
      const seenTypes: unknown[] = [];
      const CustomStringField = (props: { schema: RJSFSchema }) => {
        seenTypes.push(props.schema.type);
        return <div />;
      };
      createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['string', 'null'], oneOf: [{ title: 'A' }, { title: 'B' }] } },
        },
        fields: { StringField: CustomStringField },
      });

      // With the fallback UI off the option is the only place the union is rendered, so narrowing it here would tell
      // the option's field the value is of a type nothing pinned it to
      expect(seenTypes).toEqual([['string', 'null']]);
    });

    it('keeps an option of a union out of the numeric input the first type alone would get', () => {
      const schema = {
        type: 'object',
        properties: { val: { type: ['number', 'string'], oneOf: [{ title: 'A' }, { title: 'B' }] } },
      } as RJSFSchema;

      const { node } = createFormComponent({ schema });

      // `getInputProps()` withholds the numeric `pattern` from a union on purpose: text the `string` member allows
      // would fail the browser's own validation and block the submit before the validator ever saw it
      const input = node.querySelector<HTMLInputElement>('#root_val')!;
      expect(input).not.toHaveAttribute('pattern');
      expect(input).not.toHaveAttribute('inputmode');
    });

    it('offers the one type a union names alongside an unrecognized one', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['foo', 'null'] } } } as unknown as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // `null` is a type this schema really does allow, so the unrecognized name alongside it does not make the
      // property free to hold anything: offering every type would put data the schema rejects within a click. It is
      // the only type left, so there is nothing to choose between and the value field renders without a selector
      expect(node.querySelector('#root_val___internal_type_selector')).not.toBeInTheDocument();
      expect(node.querySelector('.rjsf-field-null')).toBeInTheDocument();
    });

    it('clears a number cast from text written in a notation the field would not take back', async () => {
      const schema = {
        type: 'object',
        properties: { val: { type: ['string', 'number'] } },
      } as RJSFSchema;

      const expectClearedOnSwitchToNumber = async (text: string) => {
        const { node, onChange } = createFormComponent({
          schema,
          useFallbackUiForUnsupportedType: true,
          formData: { val: text },
        });
        const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;

        await user.selectOptions(
          select,
          Array.from(select.options).find((o) => o.textContent === 'number')!,
        );

        expectToHaveBeenCalledWithFormData(onChange, { val: undefined }, 'root_val');
      };

      // An infinity is no JSON number — `JSON.stringify()` writes it as `null` — and `0x10` would come back as a
      // `16` nobody typed, so both leave the field empty the way any other unreadable text does
      await expectClearedOnSwitchToNumber('Infinity');
      await expectClearedOnSwitchToNumber('1e999');
      await expectClearedOnSwitchToNumber('0x10');
    });

    it('stays on the type being edited when an input clears to a ui:emptyValue of another type', async () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number', 'boolean'] } } },
        uiSchema: { val: { 'ui:options': { emptyValue: false } } },
        useFallbackUiForUnsupportedType: true,
        formData: { val: 'a string' },
      });

      await user.clear(node.querySelector<HTMLInputElement>('#root_val')!);

      // The value a cleared input reports is the one `ui:emptyValue` names, so reading it as a switch to its own type
      // would swap the input out from under a user who had only emptied it
      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(select.options).find((o) => o.selected)?.textContent).toBe('string');
    });

    it('gives way to a ui:emptyValue that replaces the object of a union from outside the form', () => {
      const schema = { type: 'object', properties: { val: { type: ['number', 'object'] } } } as RJSFSchema;
      const uiSchema = { val: { 'ui:options': { emptyValue: 0 } } };
      const { node, rerender } = createFormComponent({
        schema,
        uiSchema,
        useFallbackUiForUnsupportedType: true,
        formData: { val: { a: 1 } },
      });

      rerender({ schema, uiSchema, useFallbackUiForUnsupportedType: true, formData: { val: 0 } });

      // An `object` field renders no widget for a `ui:emptyValue` to belong to, so this `0` is not one of its inputs
      // reporting itself cleared: it is `number` data that arrived from outside and the selector has to follow
      const select = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(Array.from(select.options).find((o) => o.selected)?.textContent).toBe('number');
    });

    it('hides the label of an optional data control a union renders through the fallback UI', () => {
      const schema = {
        type: 'object',
        properties: {
          val: {
            type: ['string', 'number'],
            title: 'TITLE',
            anyOf: [
              { title: 'A', type: 'string' },
              { title: 'B', type: 'string' },
            ],
          },
        },
      } as RJSFSchema;
      const uiSchema = { val: { 'ui:options': { enableOptionalDataFieldForType: ['string'] } } };

      const { node } = createFormComponent({ schema, uiSchema, useFallbackUiForUnsupportedType: true });

      // The option selector the label names is withheld until there is data, and the value field around it is already
      // labelled `false`, so this is the one field either label could come from
      expect(Array.from(node.querySelectorAll('label')).map((label) => label.textContent)).not.toContain('TITLE');
    });

    it('leaves the types to the options of an unrecognized type whose anyOf names its own', async () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: 'someUnsupportedType', anyOf: [{ type: 'string' }, { type: 'number' }] } },
        } as unknown as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The option selector is already the choice a type selector would offer, and an option naming a type of its own
      // overrides the one the fallback UI would pin, so the options are what supplies the types here
      expect(node.querySelector('#root_val___internal_type_selector')).not.toBeInTheDocument();
      expect(node.querySelector('#root_val__anyof_select')).toBeInTheDocument();
      expect(node.querySelector('.rjsf-field-string')).toBeInTheDocument();
      expect(node.querySelector('.rjsf-field-number')).not.toBeInTheDocument();

      const optionSelect = node.querySelector<HTMLSelectElement>('#root_val__anyof_select')!;
      await user.selectOptions(optionSelect, 'Option 2');

      // The option chosen is what pins the type, so the field follows it rather than the unrecognized one
      expect(node.querySelector('.rjsf-field-number')).toBeInTheDocument();
    });

    it('leaves the types to the options of an unrecognized type whose oneOf names its own', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: 'someUnsupportedType', oneOf: [{ type: 'string' }, { type: 'number' }] } },
        } as unknown as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelector('#root_val___internal_type_selector')).not.toBeInTheDocument();
      expect(node.querySelector('#root_val__oneof_select')).toBeInTheDocument();
      expect(node.querySelector('.rjsf-field-string')).toBeInTheDocument();
      expect(node.querySelector('.rjsf-field-number')).not.toBeInTheDocument();
    });

    it('offers no type selector for an anyOf that names no type of its own', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { anyOf: [{ type: 'string' }, { type: 'number' }] } },
        },
        useFallbackUiForUnsupportedType: true,
      });

      // An `anyOf` standing in for a type is ordinary usage, so the opt-in must not wrap every one of them in a
      // selector of all seven JSON Schema types that the options are already there to choose between
      expect(node.querySelector('#root_val___internal_type_selector')).not.toBeInTheDocument();
      expect(node.querySelector('#root_val__anyof_select')).toBeInTheDocument();
      expect(node.querySelector('.rjsf-field-string')).toBeInTheDocument();
      expect(node.querySelector('.rjsf-field-number')).not.toBeInTheDocument();
    });

    it('leaves the options of an unrecognized type in place when the ui:field set to replace them resolves to nothing', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: 'someUnsupportedType', anyOf: [{ type: 'string' }, { type: 'number' }] } },
        } as unknown as RJSFSchema,
        uiSchema: { val: { 'ui:field': 'NotARegisteredField', 'ui:fieldReplacesAnyOrOneOf': true } },
        useFallbackUiForUnsupportedType: true,
      });

      // `ui:fieldReplacesAnyOrOneOf` asks the options to give way to the field named alongside it, and a name no field
      // is registered under names nothing for them to give way to, so they render and supply the types themselves
      expect(node.querySelector('#root_val__anyof_select')).toBeInTheDocument();
      expect(node.querySelector('#root_val___internal_type_selector')).not.toBeInTheDocument();
      expect(node.querySelector('.rjsf-field-string')).toBeInTheDocument();
    });

    it.each([
      ['by name', 'FallbackField'],
      ['by component', FallbackField],
    ])('renders one of each selector for a ui:field naming the fallback field itself, %s', (_label, field) => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['string', 'number'], anyOf: [{ minLength: 2 }, { maximum: 5 }] } },
        },
        uiSchema: { val: { 'ui:field': field } },
        useFallbackUiForUnsupportedType: true,
      });

      // The value field renders for the schema the selector pins a type on, so a `ui:field` naming this field routes
      // back to it, and every one of those renders another selector around another value field without end
      expect(node.querySelectorAll('[id$="___internal_type_selector"]')).toHaveLength(1);
      expect(node.querySelectorAll('[id$="__anyof_select"]')).toHaveLength(1);
      expect(node.querySelector('#root_val')).toBeInTheDocument();
    });

    it('renders the help of a ui:globalOptions once for a union the fallback UI renders', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['string', 'number'], title: 'VAL' } },
        },
        uiSchema: { 'ui:globalOptions': { help: 'HELPTEXT' } },
        useFallbackUiForUnsupportedType: true,
      });

      // A global entry reaches every field in the form, so the field around the value shadows it on both uiSchemas it
      // hands down: the value field renders for the same `id`, which would put a second copy of the help under the DOM
      // id the first one's `aria-describedby` names, and the selector is a control within the field rather than a field
      // whose own help this is
      const fieldHelp = node.querySelectorAll('[id="root_val__help"]');
      expect(fieldHelp).toHaveLength(1);
      expect(fieldHelp[0]).toHaveTextContent('HELPTEXT');
      expect(node.querySelector('#root_val___internal_type_selector__help')).not.toBeInTheDocument();
    });

    it('renders one of each selector for a ui:globalOptions field naming the fallback field itself', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['string', 'number'], anyOf: [{ minLength: 2 }, { maximum: 5 }] } },
        },
        uiSchema: { 'ui:globalOptions': { field: 'FallbackField' } },
        useFallbackUiForUnsupportedType: true,
      });

      // A global option reaches every field in the form, so the `field` has to be shadowed on both of the uiSchemas
      // this field hands down rather than dropped from the one the caller wrote: the value field routes straight back
      // here without it, and so does the type selector, which is a `SchemaField` like any other.
      // The global entry reaches the root as well, but the one type that schema names is nothing to choose between, so
      // the only selector is the union's: nothing offers to cast the whole form's data to another type
      expect(node.querySelectorAll('[id$="___internal_type_selector"]')).toHaveLength(1);
      expect(node.querySelector('#root___internal_type_selector')).not.toBeInTheDocument();
      expect(node.querySelectorAll('[id$="__anyof_select"]')).toHaveLength(1);
      expect(node.querySelector('#root_val')).toBeInTheDocument();
    });

    it('offers a type selector within an option of an unrecognized type that names none of its own', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            val: { type: 'someUnsupportedType', anyOf: [{ title: 'A' }, { title: 'B' }] },
          },
        } as unknown as RJSFSchema,
        useFallbackUiForUnsupportedType: true,
      });

      // The options supply no type, so each one is left with the unrecognized one the parent propagates and gets the
      // selector for it, rather than the parent getting one that every option would then be rendered within
      const optionSelect = node.querySelector('#root_val__anyof_select')!;
      const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
      expect(optionSelect).toBeInTheDocument();
      expect(typeSelect).toBeInTheDocument();
      expect(Array.from(typeSelect.options).map((o) => o.textContent)).toEqual([...JSON_SCHEMA_TYPES]);

      // Both selectors take their id from the same `fieldPath`, so which one wraps the other shows only in the order
      // they render in: the option selector comes first because the type selector renders within the chosen option
      const selectsInOrder = Array.from(node.querySelectorAll('select'));
      expect(selectsInOrder.indexOf(optionSelect as HTMLSelectElement)).toBeLessThan(
        selectsInOrder.indexOf(typeSelect),
      );
    });

    it.each([
      ['off', false],
      ['on', true],
    ] satisfies [string, boolean][])(
      'renders the options of a $id naming the fallback field with the fallback UI %s',
      (_, optIn) => {
        const { node } = createFormComponent({
          schema: { $id: 'FallbackField', type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] },
          useFallbackUiForUnsupportedType: optIn,
        });

        // A `$id` naming the field reaches it whatever the opt-in says, and neither state may cost the schema its
        // options: without the opt-in the field renders the unsupported field template, which renders nothing of them,
        // and with it the one type the schema names is nothing to choose between, so no selector stands over them
        expect(node.querySelectorAll('[id$="___internal_type_selector"]')).toHaveLength(0);
        expect(node.querySelector('#root__anyof_select')).toBeInTheDocument();
        expect(node.querySelector('#root')).toBeInTheDocument();
        expect(node.querySelectorAll('.unsupported-field')).toHaveLength(0);
      },
    );

    it.each([
      ['an enum of several types', { enum: ['a', 1] }, ['string', 'number']],
      ['an unrecognized type', { type: 'someUnsupportedType' }, [...JSON_SCHEMA_TYPES]],
    ] as [string, RJSFSchema, string[]][])(
      'offers the types %s allows to a schema the fallback field is named for',
      (_, val, types) => {
        const { node } = createFormComponent({
          schema: { type: 'object', properties: { val } },
          uiSchema: { val: { 'ui:field': 'FallbackField' } },
          useFallbackUiForUnsupportedType: true,
        });

        // A value pinned by an `enum` is one of the types those values have whichever type is chosen, so offering the
        // rest would offer types the schema rejects and cast the pinned value into one of them. A schema that names an
        // unrecognized type pins nothing, so it is still free to hold anything
        const typeSelect = node.querySelector<HTMLSelectElement>('#root_val___internal_type_selector')!;
        expect(Array.from(typeSelect.options).map((o) => o.textContent)).toEqual(types);
      },
    );

    it.each([
      ['an enum of one type', { enum: ['a', 'b'] }, '.rjsf-field-string'],
      ['a const', { const: 5 }, '.rjsf-field-number'],
      ['a type of its own', { type: 'string' }, '.rjsf-field-string'],
    ] as [string, RJSFSchema, string][])(
      'renders no type selector for %s, which the fallback field is named for and allows one type',
      (_, val, fieldClass) => {
        const { node } = createFormComponent({
          schema: { type: 'object', properties: { val } },
          uiSchema: { val: { 'ui:field': 'FallbackField' } },
          useFallbackUiForUnsupportedType: true,
        });

        // Naming this field for a schema that allows one type asks for a selector with nothing to choose between, and
        // nothing but the field for that type is left to render. A schema naming one type only ever arrives here by
        // being named for, since the type it names is otherwise rendered by the field for it
        expect(node.querySelector('#root_val___internal_type_selector')).not.toBeInTheDocument();
        expect(node.querySelector(fieldClass)).toBeInTheDocument();
      },
    );

    it.each(FALLBACK_FIELD_ROUTES.slice(0, 2))(
      'leaves the types to the options of a schema naming none, reached through %s',
      (_, uiSchema, schemaKeys) => {
        const { node } = createFormComponent({
          schema: {
            type: 'object',
            properties: { val: { ...schemaKeys, anyOf: [{ type: 'string' }, { type: 'number' }] } },
          },
          uiSchema,
          useFallbackUiForUnsupportedType: true,
        });

        // The options name their own types, and `MultiSchemaField` propagates the parent's type only to an option that
        // names none, so a type selector here would leave the screen as it was while casting the value on every switch.
        // Which of the several ways the field was reached by cannot change that, since the reason is the schema's own:
        // it names no type for a selector to offer one of, and its options are the only thing that says what it holds
        expect(node.querySelector('#root_val___internal_type_selector')).not.toBeInTheDocument();
        expect(node.querySelector('#root_val__anyof_select')).toBeInTheDocument();
        expect(node.querySelector('.rjsf-field-string')).toBeInTheDocument();
      },
    );

    it.each(FALLBACK_FIELD_ROUTES)(
      'renders one option selector for a schema whose type is read out of its properties, reached through %s',
      (_, uiSchema, schemaKeys) => {
        const { node } = createFormComponent({
          schema: {
            type: 'object',
            properties: {
              val: {
                ...schemaKeys,
                properties: { a: { type: 'string' } },
                anyOf: [{ type: 'string' }, { type: 'number' }],
              },
            },
          },
          uiSchema,
          useFallbackUiForUnsupportedType: true,
        });

        // `ObjectField` is the one field that renders beside an option selector, since the `properties` it renders are
        // the schema's own rather than an option's. Which field renders is what says whether this is that field, not
        // the name the type was read under: `getSchemaType()` reads `object` out of these `properties` while the
        // `ui:field` names the fallback UI, which renders the options within its own value field, so reading the name
        // left it standing beside an option selector rendering them a second time
        expect(node.querySelectorAll('[id$="__anyof_select"]')).toHaveLength(1);
        expect(node.querySelector('#root_val___internal_type_selector')).not.toBeInTheDocument();
        expect(node.querySelector('.rjsf-field-string')).toBeInTheDocument();
      },
    );

    it('keeps the type selector out of a ui:globalOptions title', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } },
        uiSchema: { 'ui:globalOptions': { title: 'GLOBAL' } },
        useFallbackUiForUnsupportedType: true,
      });

      // The selector is a control within the field rather than a field of its own, so nothing a caller writes about
      // the field describes it. A global entry reaches every `SchemaField`, this one included, so all of them are
      // shadowed rather than the ones found to misbehave one at a time
      expect(node.querySelector('label[for="root_val___internal_type_selector"]')).toHaveTextContent('Type');
      expect(node.querySelector('label[for="root_val"]')).toHaveTextContent('GLOBAL');
    });

    // A schema that only implies its type is rendered by the field for the implied one everywhere else, so the fallback
    // UI says the same about it however it was reached
    it.each(FALLBACK_FIELD_ROUTES)(
      'renders the properties of a schema whose object type is implied, reached through %s',
      (_, uiSchema, schemaOverride) => {
        const { node } = createFormComponent({
          schema: {
            type: 'object',
            properties: {
              val: {
                ...schemaOverride,
                properties: { own: { type: 'string' } },
                anyOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'number' } } }],
              },
            },
          },
          uiSchema,
          useFallbackUiForUnsupportedType: true,
        });

        // `properties` implies `object`, which is the one type the schema allows, so there is no type to choose and the
        // options supply no other. The schema's own property renders beside them, as it does with nothing naming a field
        expect(node.querySelector('#root_val___internal_type_selector')).toBeNull();
        expect(node.querySelector('#root_val__anyof_select')).toBeInTheDocument();
        expect(node.querySelector('#root_val_own')).toBeInTheDocument();
        // The option's own property renders too: a `ui:field` the options are rendered in place of does not reach them,
        // so no option renders another fallback field over its fields
        expect(node.querySelector('#root_val_a')).toBeInTheDocument();
      },
    );

    it('renders the properties of a schema whose object type is implied with no options to supply one', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { $id: 'FallbackField', properties: { own: { type: 'string' } } } },
        },
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelector('#root_val___internal_type_selector')).toBeNull();
      expect(node.querySelector('#root_val_own')).toBeInTheDocument();
    });

    it('lays the type selector out with a ui:globalOptions template', () => {
      const ids: string[] = [];
      function RecordingFieldTemplate(props: FieldTemplateProps) {
        ids.push(props.id);
        return <div>{props.children}</div>;
      }
      createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } },
        uiSchema: { 'ui:globalOptions': { FieldTemplate: RecordingFieldTemplate } },
        useFallbackUiForUnsupportedType: true,
      });

      // A template says how any field renders rather than what one holds, so it reaches the selector as it reaches
      // every other field, unlike the entries that describe the caller's own field
      expect(ids).toContain('root_val___internal_type_selector');
    });

    it.each<[string, UiSchema, RJSFSchema]>([
      ['ui:field', { val: { 'ui:field': 'FallbackField', 'ui:fieldReplacesAnyOrOneOf': true } }, {}],
      ['$id', { val: { 'ui:fieldReplacesAnyOrOneOf': true } }, { $id: 'FallbackField' }],
    ])(
      'keeps the options of a schema naming the fallback field through %s without the opt-in',
      (_, uiSchema, schemaOverride) => {
        const { node } = createFormComponent({
          schema: {
            type: 'object',
            properties: {
              val: {
                ...schemaOverride,
                type: 'object',
                anyOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'number' } } }],
              },
            },
          },
          uiSchema,
        });

        // Without the opt-in the field renders the unsupported-field template, which renders nothing of the options, so
        // it is not a field they can give way to whichever way it was named
        expect(node.querySelector('.unsupported-field')).toBeNull();
        expect(node.querySelector('#root_val__anyof_select')).toBeInTheDocument();
        expect(node.querySelector('#root_val_a')).toBeInTheDocument();
      },
    );

    it('keeps the options of a schema whose only type is null', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: 'null', anyOf: [{ title: 'A' }, { title: 'B' }] } },
        },
        // Named rather than reached through a `['foo', 'null']` type, which allows `null` alone the same way: such a
        // schema does not compile under AJV, and the shared validator carries that failure into every later test
        uiSchema: { val: { 'ui:field': 'FallbackField' } },
        useFallbackUiForUnsupportedType: true,
      });

      // `getValueSchema()` drops the options once `null` is the type in effect, since a `null` is the whole of the
      // value and no option can describe it. With `null` the only type the schema allows there is no selector to
      // choose another, so the fallback UI cannot be the one that renders them and does not claim to be
      expect(node.querySelector('#root_val___internal_type_selector')).toBeNull();
      expect(node.querySelector('#root_val__anyof_select')).toBeInTheDocument();
    });

    it('renders a single-type value field without the selector template around it', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: 'string' } } },
        uiSchema: { val: { 'ui:field': 'FallbackField' } },
        useFallbackUiForUnsupportedType: true,
      });

      // With no selector to lay out, the template contributes only its wrapper, which every theme gives padding or a
      // card of its own, and the empty row the selector would have filled
      expect(node.querySelector('#root_val')).toBeInTheDocument();
      expect(node.querySelector('.panel')).toBeNull();
      expect([...node.querySelectorAll('.form-group')].filter((group) => group.children.length === 0)).toHaveLength(0);
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

    describe('when props.initialFormData does not equal the default values', () => {
      it('should render the defaults added to the seed without calling props.onChange', () => {
        const formData = {
          foo: 123,
        };
        const { node, onChange } = createFormComponent({ schema, initialFormData: formData });
        expect(onChange).not.toHaveBeenCalled();
        expect(node.querySelector<HTMLInputElement>('#root_count')).toHaveValue('789');
      });
    });

    describe('when props.formData does not equal the default values', () => {
      it('should render the parent value as passed and not call props.onChange', () => {
        // The parent owns the value, defaults included; seeding them is the parent's job (see the v7 upgrade guide).
        // A direct `formData` prop, not the suite's creator, whose accepting parent seeds the defaults for this
        const formData = {
          foo: 123,
        };
        const { node, onChange } = createDirectFormComponent({ schema, formData });
        expect(onChange).not.toHaveBeenCalled();
        expect(node.querySelector<HTMLInputElement>('#root_count')).toHaveValue('');
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
          <span className='raw-help'>
            {typeof rawHelp === 'string' ? `${rawHelp} rendered from the raw format` : rawHelp}
          </span>
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
        initialFormData: formData,
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

    it('should pass rawHelp for a ui:help given as a React element, so a template can gate on it', () => {
      const seeRawHelp = vi.fn<(rawHelp: FieldTemplateProps['rawHelp']) => void>();
      function RawHelpProbe(props: FieldTemplateProps) {
        seeRawHelp(props.rawHelp);
        return <div>{props.children}</div>;
      }
      createFormComponent({
        schema,
        uiSchema: { foo: { 'ui:help': <strong>element help</strong> } },
        templates: { FieldTemplate: RawHelpProbe },
      });

      expect(seeRawHelp.mock.lastCall?.[0]).toStrictEqual(<strong>element help</strong>);
    });

    it('should pass rawHelp for a ui:help inherited from ui:globalOptions', () => {
      const seeRawHelp = vi.fn<(rawHelp: FieldTemplateProps['rawHelp']) => void>();
      function RawHelpProbe(props: FieldTemplateProps) {
        seeRawHelp(props.rawHelp);
        return <div>{props.children}</div>;
      }
      createFormComponent({
        schema,
        uiSchema: { 'ui:globalOptions': { help: 'global help' } },
        templates: { FieldTemplate: RawHelpProbe },
      });

      expect(seeRawHelp.mock.lastCall?.[0]).toBe('global help');
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
