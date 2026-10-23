import type { DefaultFormStateBehavior, FieldProps, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import {
  createFormComponent,
  createFormRef,
  elementOf,
  expectToHaveBeenCalledWithFormData,
  handleOf,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

describe('NullField', () => {
  describe('No widget', () => {
    it('should render a null field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'null',
        },
      });

      expect(node.querySelectorAll('.rjsf-field')).toHaveLength(1);
    });

    it('should render the title and description of a null field itself, with no label naming a control', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'null',
          title: 'foo',
          description: 'Describes foo',
        },
      });

      expect(node.querySelector('#root__title')).toHaveTextContent('foo');
      expect(node.querySelector('#root__description')).toHaveTextContent('Describes foo');
      expect(node.querySelector('.rjsf-field label')).not.toBeInTheDocument();
    });

    it("should draw a null field's title as the legend of a fieldset around its title and description (#5562)", () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { n: { type: 'null', title: 'Nothing', description: 'Holds nothing' } } },
      });

      const legend = node.querySelector('#root_n__title')?.closest('legend');
      expect(legend?.parentElement?.tagName).toBe('FIELDSET');
      expect(legend?.parentElement?.firstElementChild).toBe(legend);
      expect(legend?.parentElement).toContainElement(node.querySelector('#root_n__description'));
    });

    it('should draw no fieldset for a null field that draws only a description', () => {
      const { node } = createFormComponent({ schema: { type: 'null', description: 'Holds nothing' } });

      expect(node.querySelector('#root__description')).toBeInTheDocument();
      expect(node.querySelector('fieldset')).toBeNull();
    });

    it('should render nothing of its own for a null field with no title or description', () => {
      const { node } = createFormComponent({ schema: { type: 'null' } });

      expect(node.querySelector('#root__title')).not.toBeInTheDocument();
      expect(node.querySelector('#root__description')).not.toBeInTheDocument();
    });

    it('should assign a default value', () => {
      const { getFormData } = createFormComponent({
        schema: {
          type: 'null',
          default: null,
        },
      });

      expect(getFormData()).toBe(null);
    });

    it('should not overwrite existing data', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'null',
        },
        initialFormData: 3,
        // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
        noValidate: true,
      });

      await submitForm(node, user);
      expectToHaveBeenCalledWithFormData(onSubmit, 3, true);
    });
  });

  // A `null` schema allows one value, so a missing one is filled in as it, whatever the form says of other defaults
  describe.each<NonNullable<DefaultFormStateBehavior['emptyObjectFields']>>([
    'populateAllDefaults',
    'populateRequiredDefaults',
    'skipEmptyDefaults',
    'skipDefaults',
  ])('a missing value under emptyObjectFields: %s', (emptyObjectFields) => {
    it.each<[string, RJSFSchema, unknown]>([
      ['a required property', { type: 'object', required: ['n'], properties: { n: { type: 'null' } } }, { n: null }],
      ['an optional property', { type: 'object', properties: { n: { type: 'null' } } }, { n: null }],
      [
        'an optional object',
        { type: 'object', properties: { o: { type: 'object', properties: { n: { type: 'null' } } } } },
        { o: { n: null } },
      ],
      [
        "an optional object's allOf",
        { type: 'object', properties: { a: { type: 'object', allOf: [{ properties: { n: { type: 'null' } } }] } } },
        { a: { n: null } },
      ],
      [
        "an optional object's if/then",
        {
          type: 'object',
          properties: {
            a: {
              type: 'object',
              properties: { k: { type: 'string' } },
              if: { properties: { k: { const: 'x' } } },
              then: { properties: { n: { type: 'null' } } },
            },
          },
        },
        { a: { n: null } },
      ],
      [
        'a property whose $ref names a null schema',
        { type: 'object', properties: { n: { $ref: '#/$defs/none' } }, $defs: { none: { type: 'null' } } },
        { n: null },
      ],
    ])('of a null schema in %s is submitted as null', async (_, schema, submitted) => {
      const { node, onSubmit, onError } = createFormComponent({
        schema,
        defaultFormStateBehavior: { emptyObjectFields },
      });

      await submitForm(node, user);

      expect(onError).not.toHaveBeenCalled();
      expectToHaveBeenCalledWithFormData(onSubmit, submitted, true);
    });
  });

  describe.each<NonNullable<DefaultFormStateBehavior['emptyObjectFields']>>([
    'populateAllDefaults',
    'populateRequiredDefaults',
    'skipEmptyDefaults',
    'skipDefaults',
  ])('under emptyObjectFields: %s', (emptyObjectFields) => {
    it('leaves an optional object the Optional Data Controls show collapsed out, a null schema in it included', async () => {
      const { node, onSubmit, onError } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            opt: { type: 'object', required: ['s'], properties: { s: { type: 'string' }, n: { type: 'null' } } },
          },
        },
        uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
        defaultFormStateBehavior: { emptyObjectFields },
      });

      expect(node.querySelector('#root_opt_s')).not.toBeInTheDocument();
      await submitForm(node, user);

      expect(onError).not.toHaveBeenCalled();
      expectToHaveBeenCalledWithFormData(onSubmit, {}, true);
    });
  });

  describe('a value no field renders', () => {
    // Filled in as the schema's other defaults are, a `{ const: null }`'s among them, whether or not a field renders it
    const OwnField = (_props: FieldProps) => <div>Own field</div>;

    it.each<[string, UiSchema]>([
      ['left out of a LayoutGridField layout', { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': ['s'] } }],
      ['under a ui:field that renders none of its properties', { 'ui:field': OwnField }],
    ])('is filled in as null when it is %s, as a const: null is', async (_, uiSchema) => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'object',
          properties: { s: { type: 'string' }, n: { type: 'null' }, c: { const: null } },
        },
        uiSchema,
      });

      await submitForm(node, user);

      expect(node.querySelector('.rjsf-field-null')).not.toBeInTheDocument();
      expectToHaveBeenCalledWithFormData(onSubmit, { n: null, c: null }, true);
    });
  });

  describe('in data a control adds, an optional object the Optional Data Controls show collapsed', () => {
    const uiSchema: UiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } };
    // Holds a `null` schema, which would have the object filled in, and shown with its fields, were it not collapsed
    const holder: RJSFSchema = {
      type: 'object',
      properties: { opt: { type: 'object', properties: { n: { type: 'null' } } } },
    };

    it('is left out of an item the add button adds, as it is of an item the form mounts with', async () => {
      const { node, getFormData } = createFormComponent({
        schema: { type: 'array', items: holder },
        uiSchema,
        initialFormData: [{}],
      });

      await user.click(elementOf(node, '.rjsf-array-item-add button'));

      expect(getFormData()).toEqual([{}, {}]);
      expect(node.querySelector('#root_1_opt__optionalAdd')).toBeInTheDocument();
    });

    it('is left out of an additional property the add button adds', async () => {
      const { node, getFormData } = createFormComponent({
        schema: { type: 'object', additionalProperties: holder },
        uiSchema,
        initialFormData: {},
      });

      await user.click(elementOf(node, '.rjsf-object-property-expand button'));

      expect(getFormData()).toEqual({ newKey: {} });
    });

    it('is left out of an optional object its own control adds', async () => {
      // A default of its own, so the object the control adds has a value to show it by; the form leaves it out of the
      // object until then
      const outer: RJSFSchema = {
        ...holder,
        properties: { ...holder.properties, s: { type: 'string', default: 'x' } },
      };
      const { node, getFormData } = createFormComponent({
        schema: { type: 'object', properties: { outer } },
        uiSchema,
        defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
      });

      await user.click(elementOf(node, '#root_outer__optionalAdd'));

      expect(getFormData()).toEqual({ outer: { s: 'x' } });
      expect(node.querySelector('#root_outer_opt__optionalAdd')).toBeInTheDocument();
    });

    it('is left out of the data an option switch writes, as it is of the option the form mounts with', async () => {
      const { node, getFormData } = createFormComponent({
        schema: {
          type: 'object',
          required: ['choice'],
          properties: {
            choice: {
              oneOf: [
                { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
                { ...holder, title: 'B' },
              ],
            },
          },
        },
        uiSchema,
        initialFormData: { choice: { a: 'x' } },
      });

      await user.selectOptions(elementOf(node, '#root_choice__oneof_select'), 'B');

      // The switch carries the new option's object over empty, which the controls show as holding nothing
      expect(getFormData()).toEqual({ choice: { opt: {} } });
      expect(node.querySelector('#root_choice_opt__optionalAdd')).toBeInTheDocument();
    });
  });

  describe('a value it is handed as undefined', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['n'],
      properties: { n: { type: 'null' }, s: { type: 'string' } },
    };

    it.each<[string, (ref: ReturnType<typeof createFormRef>) => void]>([
      ['a seed', () => {}],
      ['setFieldValue() at the field', (ref) => handleOf(ref).setFieldValue('n', undefined)],
      ['setFieldValue() at the root', (ref) => handleOf(ref).setFieldValue('', { n: undefined, s: 'a' })],
    ])('is filled in as null, from %s', async (_, write) => {
      const ref = createFormRef();
      const { node, onSubmit, getFormData } = createFormComponent({
        ref,
        schema,
        initialFormData: { n: undefined, s: 'a' },
      });

      act(() => write(ref));
      await submitForm(node, user);

      expect(getFormData()).toEqual({ n: null, s: 'a' });
      expectToHaveBeenCalledWithFormData(onSubmit, { n: null, s: 'a' }, true);
    });

    it('is filled in as null when a condition retypes the property to null', async () => {
      const { node, getFormData } = createFormComponent({
        schema: {
          type: 'object',
          properties: { k: { type: 'string' } },
          if: { properties: { k: { const: 'x' } }, required: ['k'] },
          then: { properties: { n: { type: 'null' } }, required: ['n'] },
          else: { properties: { n: { type: 'string' } } },
        },
        initialFormData: { n: 'abc' },
      });

      await user.type(elementOf(node, '#root_k'), 'x');

      expect(getFormData()).toEqual({ k: 'x', n: null });
    });

    it('is filled in as null when an option switch retypes the property to null', async () => {
      const { node, getFormData } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            p: {
              oneOf: [
                { title: 'text', type: 'object', properties: { n: { type: 'string' } } },
                { title: 'none', type: 'object', properties: { n: { type: 'null' } }, required: ['n'] },
              ],
            },
          },
        },
        initialFormData: { p: { n: 'abc' } },
      });

      await user.selectOptions(elementOf(node, '#root_p__oneof_select'), 'none');

      expect(getFormData()).toEqual({ p: { n: null } });
    });

    it.each<[string, RJSFSchema, unknown, unknown]>([
      ['a null additional property', { type: 'null' }, undefined, null],
      [
        'an additional property holding a null field',
        { type: 'object', properties: { n: { type: 'null' } } },
        {},
        { n: null },
      ],
    ])(
      'is filled in for %s of an object below the root, written after mount',
      (_, additionalProperties, written, kept) => {
        const ref = createFormRef();
        const { getFormData } = createFormComponent({
          ref,
          schema: { type: 'object', properties: { o: { type: 'object', additionalProperties } } },
          initialFormData: { o: {} },
        });

        act(() => handleOf(ref).setFieldValue(['o', 'k'], written));

        expect(getFormData()).toEqual({ o: { k: kept } });
      },
    );

    // An object holding a null field keeps the `undefined` it is given, as one holding none does
    const holder: RJSFSchema = {
      type: 'object',
      properties: { n: { type: 'null' }, s: { type: 'string', default: 'x' } },
    };

    it('is left alone for an object holding a null field, through the edits after it', async () => {
      const ref = createFormRef();
      const { node, getFormData } = createFormComponent({
        ref,
        schema: { type: 'object', properties: { a: { type: 'string' }, p: holder } },
      });

      act(() => handleOf(ref).setFieldValue('p', undefined));
      await user.type(elementOf(node, '#root_a'), 'z');

      expect(getFormData()).toEqual({ a: 'z', p: undefined });
    });

    it('is left alone for the object of an anyOf/oneOf whose selector was cleared', async () => {
      // A selector that can send no option, as a theme's select that allows deselecting does
      const ClearableSelector = ({ onChange }: WidgetProps) => (
        <button type='button' id='clear-option' onClick={() => onChange(undefined)}>
          Clear
        </button>
      );
      const { node, getFormData } = createFormComponent({
        schema: {
          type: 'object',
          properties: { a: { type: 'string' }, p: { oneOf: [holder, { type: 'string' }] } },
        },
        uiSchema: { p: { 'ui:widget': ClearableSelector } },
      });

      await user.click(elementOf(node, '#clear-option'));
      await user.type(elementOf(node, '#root_a'), 'z');

      expect(getFormData()).toEqual({ a: 'z', p: undefined });
    });
  });
});
