import { Activity, Suspense, forwardRef, lazy, memo } from 'react';
import type {
  ArrayFieldItemTemplateProps,
  CyclicSchemaExpandProps,
  ErrorSchema,
  Field,
  FieldProps,
  GenericObjectType,
  RJSFSchema,
  UiSchema,
  DescriptionFieldProps,
  FormValidation,
  FieldErrorProps,
  FieldHelpProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  ThemePresentation,
  WidgetProps,
} from '@rjsf/utils';
import {
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  createSchemaUtils,
  englishStringTranslator,
  errorId,
  fallbackTypeSelectorId,
  mergeThemePresentation,
  toFieldPath,
  toInputValue,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import BooleanField from '../src/components/fields/BooleanField.tsx';
import SchemaField from '../src/components/fields/SchemaField.tsx';
import Form, { generateTheme, generateWidgets } from '../src/index.ts';
import MarkdownTemplate from '../src/markdown.tsx';
import {
  createFormComponent,
  createFormRef,
  elementOf,
  getSelectedOptionValue,
  handleOf,
  renderInActivity,
  setupConsoleWarnSuppression,
  submitForm,
} from './testUtils.tsx';
import type { NoValFormProps } from './testUtils.tsx';

const user = userEvent.setup();
const { TextWidget: CoreTextWidget, RadioWidget: CoreRadioWidget } = generateWidgets();

describe('SchemaField', () => {
  describe('registry', () => {
    it('should provide expected registry as prop', () => {
      let receivedProps: FieldProps;
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          a: { type: 'string' },
        },
      };
      const schemaUtils = createSchemaUtils({ validator }, schema);

      createFormComponent({
        schema,
        uiSchema: {
          'ui:field': (props) => {
            receivedProps = props;
            return null;
          },
        },
      });

      // @ts-expect-error: TS2454, because we are setting it in the field component above
      const { registry } = receivedProps;
      const defaultRegistry = generateTheme();
      expect(registry).toEqual({
        fields: defaultRegistry.fields,
        templates: defaultRegistry.templates,
        widgets: defaultRegistry.widgets,
        presentation: mergeThemePresentation(defaultRegistry.presentation),
        // Core's empty map merges to a map of `undefined`s, which `toEqual` reads as no keys
        classMap: {},
        rootSchema: schema,
        formContext: {},
        schemaUtils,
        translateString: englishStringTranslator,
        globalUiOptions: undefined,
        globalFormOptions: {
          idPrefix: DEFAULT_ID_PREFIX,
          idSeparator: DEFAULT_ID_SEPARATOR,
          useFallbackUiForUnsupportedType: false,
        },
        uiSchemaDefinitions: {},
      });
    });
    it('should provide expected registry with globalUiOptions as prop', () => {
      let receivedProps: FieldProps;
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          a: { type: 'string' },
        },
      };
      const schemaUtils = createSchemaUtils({ validator }, schema);

      createFormComponent({
        schema,
        uiSchema: {
          'ui:globalOptions': { copyable: true },
          'ui:field': (props) => {
            receivedProps = props;
            return null;
          },
        },
      });

      // @ts-expect-error: TS2454, because we are setting it in the field component above
      const { registry } = receivedProps;
      const defaultRegistry = generateTheme();
      expect(registry).toEqual({
        fields: defaultRegistry.fields,
        templates: defaultRegistry.templates,
        widgets: defaultRegistry.widgets,
        presentation: mergeThemePresentation(defaultRegistry.presentation),
        // Core's empty map merges to a map of `undefined`s, which `toEqual` reads as no keys
        classMap: {},
        rootSchema: schema,
        formContext: {},
        schemaUtils,
        translateString: englishStringTranslator,
        globalUiOptions: { copyable: true },
        globalFormOptions: {
          idPrefix: DEFAULT_ID_PREFIX,
          idSeparator: DEFAULT_ID_SEPARATOR,
          useFallbackUiForUnsupportedType: false,
        },
        uiSchemaDefinitions: {},
      });
    });

    describe('a registry whose globalUiOptions skipped pickGlobalUiOptions()', () => {
      // A per-field name such as these can only reach the registry when it is built by hand
      const unpickedGlobals: GenericObjectType = {
        hideError: true,
        description: 'Global description',
        widget: 'textarea',
        readonly: true,
        help: 'Global help',
      };
      const NumberFieldMarker = () => <div id='number-field' />;

      function renderWithUnpickedGlobals(fieldProps: Partial<FieldProps>) {
        return createFormComponent({
          schema: { type: 'object' },
          uiSchema: {
            'ui:field': (props: FieldProps) => (
              <SchemaField
                {...props}
                name='child'
                fieldPath={toFieldPath('child')}
                id='root_child'
                formData={undefined}
                uiSchema={{}}
                {...fieldProps}
                registry={{
                  ...props.registry,
                  fields: { ...props.registry.fields, NumberField: NumberFieldMarker },
                  globalUiOptions: unpickedGlobals,
                }}
              />
            ),
          },
        });
      }

      it("keeps the parent's hideError over a global one", () => {
        const { node } = renderWithUnpickedGlobals({
          schema: { type: 'string' },
          errorSchema: { __errors: ['Boom'] },
          hideError: false,
        });

        expect(node).toHaveTextContent('Boom');
      });

      it("renders the field's own schema description over a global one", () => {
        const { node } = renderWithUnpickedGlobals({ schema: { type: 'string', description: 'Own description' } });

        expect(node).toHaveTextContent('Own description');
        expect(node).not.toHaveTextContent('Global description');
      });

      it("keeps the parent's readonly over a global one, and renders no global help", () => {
        const { node } = renderWithUnpickedGlobals({ schema: { type: 'string' }, readonly: false });

        expect(node.querySelector('#root_child')).not.toHaveAttribute('readonly');
        expect(node).not.toHaveTextContent('Global help');
      });

      it("picks a type list's field by the field's own widget only", () => {
        const { node } = renderWithUnpickedGlobals({ schema: { type: ['null', 'number', 'string'] } });

        expect(node.querySelector('#number-field')).toBeInTheDocument();
      });
    });
  });

  describe('Unsupported field', () => {
    it('should warn on invalid field type', () => {
      const { node } = createFormComponent({
        // @ts-expect-error: TS2322, because we are explicitly needing to provide an unsupported type
        schema: { type: 'invalid' },
      });

      expect(node.querySelector('.rjsf-unsupported-field')).toHaveTextContent('Unknown field type invalid');
    });

    it('should be able to be overwritten with a custom UnsupportedField component', () => {
      const CustomUnsupportedField = function CustomUnsupportedField() {
        return <span id='custom'>Custom UnsupportedField</span>;
      };

      const templates = { UnsupportedFieldTemplate: CustomUnsupportedField };
      const { node } = createFormComponent({
        // @ts-expect-error: TS2322, because we are explicitly needing to provide an unsupported type
        schema: { type: 'invalid' },
        templates,
      });

      expect(node.querySelectorAll('#custom')[0]).toHaveTextContent('Custom UnsupportedField');
    });
  });

  describe("a type list's widget", () => {
    const objectList: RJSFSchema = {
      type: ['null', 'object', 'string'],
      properties: { a: { type: 'string', default: 'x' }, b: { type: 'string', default: 'y' } },
    };
    const arrayList: RJSFSchema = { type: ['array', 'string'], items: { type: 'string' } };
    const listForm = (val: RJSFSchema, formData?: { val: unknown }, more: Partial<NoValFormProps> = {}) =>
      createFormComponent({
        schema: { type: 'object', properties: { val } },
        uiSchema: { val: { 'ui:widget': 'textarea' } },
        initialFormData: formData,
        ...more,
      });
    const typeOf = (node: Element, id: string) =>
      getSelectedOptionValue(elementOf(node, `#${fallbackTypeSelectorId(id)}`, HTMLSelectElement));
    const pickType = (node: Element, id: string, type: string) =>
      user.selectOptions(elementOf(node, `#${fallbackTypeSelectorId(id)}`), type);

    it.each<[string, RJSFSchema]>([
      ['object', objectList],
      ['array', arrayList],
      ['array, after a null,', { ...arrayList, type: ['null', 'array', 'string'] }],
    ])('should let a string be entered in a textarea on a list resolving to %s', async (_, val) => {
      const { node, onChange } = listForm(val);

      await user.type(screen.getByRole('textbox'), 'hi');

      expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { val: 'hi' } }), 'root_val');
      expect(node.querySelector('#root_val')?.closest('.rjsf-field')).toHaveClass('rjsf-field-string');
    });

    it('should keep an object the list holds in its own field, with its defaults filled in', () => {
      const { node } = listForm(objectList, { val: { a: 'q' } });

      expect(node.querySelector('textarea')).not.toBeInTheDocument();
      expect(node.querySelector('#root_val_a')).toHaveValue('q');
      expect(node.querySelector('#root_val_b')).toHaveValue('y');
      expect(node.querySelector('#root_val')?.closest('.rjsf-field')).toHaveClass('rjsf-field-object');
    });

    it('should keep an array the list holds in its own field, without handing the field the widget', () => {
      const { node } = listForm(arrayList, { val: ['a'] });

      expect(node.querySelector('textarea')).not.toBeInTheDocument();
      expect(node.querySelector('#root_val_0')).toHaveValue('a');
      expect(node.querySelector('#root_val')?.closest('.rjsf-field')).toHaveClass('rjsf-field-array');
    });

    it('should name the type the list resolves to in the class of a named field, which the widget picks nothing for', () => {
      const NamedField = () => <div id='named' />;
      const { node } = listForm({ type: ['null', 'number', 'string'] }, undefined, {
        uiSchema: { val: { 'ui:field': NamedField, 'ui:widget': 'textarea' } },
      });

      expect(node.querySelector('#named')?.closest('.rjsf-field')).toHaveClass('rjsf-field-number');
    });

    it('should hand a named field its widget whatever value the list holds', () => {
      const NamedField = ({ uiSchema }: FieldProps) => <div id='named'>{String(uiSchema?.['ui:widget'])}</div>;
      const { node } = listForm(
        objectList,
        { val: { a: 'q' } },
        {
          uiSchema: { val: { 'ui:field': NamedField, 'ui:widget': 'textarea' } },
        },
      );

      expect(node.querySelector('#named')).toHaveTextContent('textarea');
    });

    it('should name the field rendering a select over the list in its class', () => {
      const { node } = listForm({ type: ['null', 'boolean', 'string'], enum: [null, true, 'a'] }, undefined, {
        uiSchema: {},
      });

      expect(node.querySelector('#root_val')?.closest('.rjsf-field')).toHaveClass('rjsf-field-string');
    });

    describe('registered under a built-in alias', () => {
      function NumericTextarea({ id, value, onChange }: WidgetProps) {
        return <textarea id={id} value={toInputValue(value)} onChange={(event) => onChange(event.target.value)} />;
      }
      const widgets = { textarea: NumericTextarea };

      it('should leave the list on the type it resolves to', async () => {
        const { node, onChange } = listForm({ type: ['null', 'number', 'string'] }, undefined, { widgets });

        await user.type(screen.getByRole('textbox'), '7');

        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { val: 7 } }), 'root_val');
        expect(node.querySelector('#root_val')?.closest('.rjsf-field')).toHaveClass('rjsf-field-number');
      });

      it('should fill in the defaults of the object field it leaves on screen', () => {
        const { node } = listForm(objectList, undefined, { widgets });

        expect(node.querySelector('#root_val_a')).toHaveValue('x');
        expect(node.querySelector('textarea')).not.toBeInTheDocument();
      });
    });

    describe('with ui:required properties', () => {
      const required: RJSFSchema = { type: ['string', 'object'], properties: { a: { type: 'string' } } };
      const uiSchema: UiSchema = { val: { a: { 'ui:required': true } } };
      const submitted = async (
        val: RJSFSchema,
        formData: { val: unknown },
        useFallbackUiForUnsupportedType: boolean,
      ) => {
        const { node, onSubmit, onError } = listForm(val, formData, {
          uiSchema,
          noHtml5Validate: true,
          useFallbackUiForUnsupportedType,
        });
        await submitForm(node, user);
        return { hasInput: node.querySelector('#root_val_a') !== null, onSubmit, onError };
      };

      it.each<[string, RJSFSchema, { val: unknown }, boolean]>([
        ['an object under the fallback UI, whatever the order of the list', required, { val: {} }, true],
        [
          'an object under the fallback UI, listed first',
          { ...required, type: ['object', 'string'] },
          { val: {} },
          true,
        ],
        [
          'a string in the object field, with the fallback UI off',
          { ...required, type: ['object', 'string'] },
          { val: 'hello' },
          false,
        ],
        [
          'a null in the object field, with the fallback UI off',
          { ...required, type: ['null', 'object'] },
          { val: null },
          false,
        ],
      ])('should block the submit of %s, whose input is on screen', async (_, val, formData, fallback) => {
        const { hasInput, onSubmit, onError } = await submitted(val, formData, fallback);

        expect(hasInput).toBe(true);
        expect(onError).toHaveBeenCalled();
        expect(onSubmit).not.toHaveBeenCalled();
      });

      it.each<[string, RJSFSchema, { val: unknown }, boolean]>([
        [
          'a null picked under the fallback UI',
          { ...required, type: ['null', 'object', 'string'] },
          { val: null },
          true,
        ],
        ['a string under the fallback UI', { ...required, type: ['object', 'string'] }, { val: 'hello' }, true],
        ['an object in the string field, with the fallback UI off', required, { val: {} }, false],
      ])('should submit %s, with no input on screen for it', async (_, val, formData, fallback) => {
        const { hasInput, onSubmit, onError } = await submitted(val, formData, fallback);

        expect(hasInput).toBe(false);
        expect(onError).not.toHaveBeenCalled();
        expect(onSubmit).toHaveBeenCalled();
      });

      describe('as the type selector picks the type (#5729)', () => {
        const fallbackForm = (type: RJSFSchema['type'], formData?: { val: unknown }) =>
          listForm({ ...required, type }, formData, {
            uiSchema,
            noHtml5Validate: true,
            useFallbackUiForUnsupportedType: true,
          });
        it('should submit once a number is picked, which takes the object field off screen', async () => {
          const { node, onSubmit, onError } = fallbackForm(['object', 'number']);
          expect(node.querySelector('#root_val_a')).toBeInTheDocument();

          await pickType(node, 'root_val', 'number');
          await submitForm(node, user);

          expect(node.querySelector('#root_val_a')).not.toBeInTheDocument();
          expect(onError).not.toHaveBeenCalled();
          expect(onSubmit).toHaveBeenCalled();
        });

        it('should submit a string typed in and cleared again', async () => {
          const { node, onSubmit, onError } = fallbackForm(['object', 'string']);

          await pickType(node, 'root_val', 'string');
          const input = elementOf(node, '#root_val');
          await user.type(input, 'x');
          await user.clear(input);
          await submitForm(node, user);

          expect(node.querySelector('#root_val_a')).not.toBeInTheDocument();
          expect(onError).not.toHaveBeenCalled();
          expect(onSubmit).toHaveBeenCalled();
        });

        it.each<[unknown]>([[null], [5]])(
          'should report the missing property of an object field the selector starts on for %j',
          async (val) => {
            const { node, onSubmit, onError } = fallbackForm(['object', 'string'], { val });
            await submitForm(node, user);

            expect(node.querySelector('#root_val_a')).toBeInTheDocument();
            expect(onError).toHaveBeenLastCalledWith(
              expect.arrayContaining([expect.objectContaining({ property: '.val.a' })]),
            );
            expect(onSubmit).not.toHaveBeenCalled();
          },
        );
      });
    });

    describe('once the selector picks a type (#5729)', () => {
      it('should start a field that leaves the screen and comes back on the type its data starts it on', async () => {
        const { node } = createFormComponent({
          schema: {
            type: 'object',
            properties: { show: { type: 'boolean', default: true } },
            dependencies: {
              show: {
                oneOf: [
                  {
                    properties: {
                      show: { const: true },
                      val: { type: ['object', 'number'], properties: { a: { type: 'string' } } },
                    },
                  },
                  { properties: { show: { const: false } } },
                ],
              },
            },
          },
          useFallbackUiForUnsupportedType: true,
        });
        await pickType(node, 'root_val', 'number');

        await user.click(elementOf(node, '#root_show'));
        expect(node.querySelector(`#${fallbackTypeSelectorId('root_val')}`)).not.toBeInTheDocument();
        await user.click(elementOf(node, '#root_show'));

        expect(typeOf(node, 'root_val')).toBe('object');
      });

      it('should keep the type picked through an <Activity> hiding the field and showing it again', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { val: { type: ['object', 'number'], properties: { a: { type: 'string' } } } },
        };
        const form = (uiSchema: UiSchema) => (
          <Form schema={schema} uiSchema={uiSchema} validator={validator} useFallbackUiForUnsupportedType />
        );
        const { container, hide, show } = renderInActivity(form, {});
        await pickType(container, 'root_val', 'number');

        hide({});
        // A changed uiSchema, so the field renders again as it is shown
        show({ val: { 'ui:title': 'Value' } });

        expect(typeOf(container, 'root_val')).toBe('number');
      });

      it('should start a type list the schema swaps in on the type its data starts it on', async () => {
        const schemaOf = (type: RJSFSchema['type']): RJSFSchema => ({
          type: 'object',
          properties: { val: { type, properties: { a: { type: 'string' } } } },
        });
        const { node, rerender } = createFormComponent({
          schema: schemaOf(['object', 'number']),
          useFallbackUiForUnsupportedType: true,
        });
        await pickType(node, 'root_val', 'number');

        rerender({ schema: schemaOf(['string', 'number', 'object']), useFallbackUiForUnsupportedType: true });

        expect(typeOf(node, 'root_val')).toBe('string');
      });

      it('should drop the type picked once the schema switches the type list away and back', async () => {
        const { node } = createFormComponent({
          schema: {
            type: 'object',
            properties: { kind: { type: 'boolean' }, val: { properties: { a: { type: 'string' } } } },
            if: { properties: { kind: { const: true } }, required: ['kind'] },
            then: { properties: { val: { type: ['object', 'string'] } } },
            else: { properties: { val: { type: ['object', 'number'] } } },
          },
          useFallbackUiForUnsupportedType: true,
        });
        await pickType(node, 'root_val', 'number');

        await user.click(elementOf(node, '#root_kind'));
        expect(typeOf(node, 'root_val')).toBe('object');
        await user.click(elementOf(node, '#root_kind'));

        expect(typeOf(node, 'root_val')).toBe('object');
      });

      it('should require nothing of the object a picked number left while an <Activity> hides the field', async () => {
        // A tab template's way of hiding a field without unmounting it, as `formContext.hidden` says
        function TabTemplate({ properties, registry }: ObjectFieldTemplateProps) {
          const { formContext } = registry;
          const mode = 'hidden' in formContext && formContext.hidden === true ? 'hidden' : 'visible';
          return properties.map(({ name, content }) => (
            <Activity key={name} mode={mode}>
              {content}
            </Activity>
          ));
        }
        const props = {
          schema: {
            type: 'object',
            properties: { val: { type: ['object', 'number'], properties: { a: { type: 'string' } } } },
          },
          uiSchema: { val: { a: { 'ui:required': true } } },
          templates: { ObjectFieldTemplate: TabTemplate },
          useFallbackUiForUnsupportedType: true,
          noHtml5Validate: true,
        } satisfies NoValFormProps;
        const { node, onSubmit, onError, rerender } = createFormComponent({ ...props, formContext: {} });
        await pickType(node, 'root_val', 'number');

        rerender({ ...props, formContext: { hidden: true } });
        await submitForm(node, user);

        expect(onError).not.toHaveBeenCalled();
        expect(onSubmit).toHaveBeenCalled();
      });

      it('should require nothing of the object a number picked for an array item left, over the null it clears to', async () => {
        const { node, onError } = createFormComponent({
          schema: {
            type: 'object',
            properties: {
              list: { type: 'array', items: { type: ['object', 'number'], properties: { a: { type: 'string' } } } },
            },
          },
          uiSchema: { list: { items: { a: { 'ui:required': true } } } },
          initialFormData: { list: [{}] },
          useFallbackUiForUnsupportedType: true,
          noHtml5Validate: true,
        });
        await pickType(node, 'root_list_0', 'number');
        await submitForm(node, user);

        expect(typeOf(node, 'root_list_0')).toBe('number');
        expect(onError.mock.calls.flatMap(([errors]: unknown[]) => errors)).not.toContainEqual(
          expect.objectContaining({ property: '.list.0.a' }),
        );
      });

      it("should require nothing of the object an entry's option left for boolean, over the '' its widget clears to", async () => {
        const EmptyWidget = ({ id, onChange }: WidgetProps) => (
          <button type='button' id={id} onClick={() => onChange('')}>
            Send empty
          </button>
        );
        // The option's schema carries no marker of the entry it renders at, which only the field knows
        const { node, onError } = createFormComponent({
          schema: {
            type: 'object',
            additionalProperties: {
              anyOf: [
                { title: 'One', type: ['object', 'boolean'], properties: { a: { type: 'string' } } },
                { title: 'Two', type: 'number' },
              ],
            },
          },
          uiSchema: { additionalProperties: { 'ui:widget': 'EmptyWidget', a: { 'ui:required': true } } },
          widgets: { EmptyWidget },
          initialFormData: { x: true },
          useFallbackUiForUnsupportedType: true,
          noHtml5Validate: true,
        });
        await user.click(elementOf(node, '#root_x', HTMLButtonElement));
        await submitForm(node, user);

        expect(typeOf(node, 'root_x')).toBe('boolean');
        expect(onError.mock.calls.flatMap(([errors]: unknown[]) => errors)).not.toContainEqual(
          expect.objectContaining({ property: '.x.a' }),
        );
      });

      describe('with anyOf options that offer types of their own', () => {
        const optionsForm = (anyOf: RJSFSchema[]) =>
          createFormComponent({
            schema: {
              type: 'object',
              properties: { val: { type: ['object', 'number'], properties: { a: { type: 'string' } }, anyOf } },
            },
            uiSchema: { val: { a: { 'ui:required': true } } },
            useFallbackUiForUnsupportedType: true,
            noHtml5Validate: true,
          });

        it.each<[string, RJSFSchema[], string]>([
          [
            "an option's own selector, the field's being on object",
            [{ type: ['object', 'number'] }, { minimum: 1 }],
            'root_val__internalTypeSelector2',
          ],
          [
            'the only selector, within the option',
            [
              { title: 'One', type: ['object', 'number'] },
              { title: 'Two', type: 'object' },
            ],
            'root_val__internalTypeSelector',
          ],
        ])(
          'should block the submit after %s picks number, as the property is still on screen',
          async (_, anyOf, id) => {
            const { node, onSubmit, onError } = optionsForm(anyOf);
            await user.selectOptions(elementOf(node, `#${id}`), 'number');
            await submitForm(node, user);

            expect(node.querySelector('#root_val_a')).toBeInTheDocument();
            expect(onError).toHaveBeenLastCalledWith(
              expect.arrayContaining([expect.objectContaining({ property: '.val.a' })]),
            );
            expect(onSubmit).not.toHaveBeenCalled();
          },
        );

        it("should require an option's own property only while the option's selector is on object", async () => {
          const { node, onSubmit, onError } = createFormComponent({
            schema: {
              type: 'object',
              properties: {
                val: {
                  type: ['object', 'number'],
                  properties: { a: { type: 'string' } },
                  anyOf: [
                    { title: 'One', type: ['object', 'number'], properties: { b: { type: 'string' } } },
                    { title: 'Two', type: 'object' },
                  ],
                },
              },
            },
            uiSchema: { val: { b: { 'ui:required': true } } },
            useFallbackUiForUnsupportedType: true,
            noHtml5Validate: true,
          });
          await submitForm(node, user);
          expect(node.querySelector('#root_val_b')).toBeInTheDocument();
          expect(onError).toHaveBeenLastCalledWith(
            expect.arrayContaining([expect.objectContaining({ property: '.val.b' })]),
          );

          await pickType(node, 'root_val', 'number');
          await submitForm(node, user);

          expect(node.querySelector('#root_val_b')).not.toBeInTheDocument();
          expect(node.querySelector('#root_val_a')).toBeInTheDocument();
          expect(onSubmit).toHaveBeenCalled();
        });
      });

      it('should report the property of a field shown again in the live validation that shows it', async () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'object',
            properties: { show: { type: 'boolean', default: true } },
            dependencies: {
              show: {
                oneOf: [
                  {
                    properties: {
                      show: { const: true },
                      val: { type: ['object', 'number'], properties: { a: { type: 'string' } } },
                    },
                  },
                  { properties: { show: { const: false } } },
                ],
              },
            },
          },
          uiSchema: { val: { a: { 'ui:required': true } } },
          useFallbackUiForUnsupportedType: true,
          liveValidate: 'onChange',
        });
        await pickType(node, 'root_val', 'number');
        await user.click(elementOf(node, '#root_show'));

        await user.click(elementOf(node, '#root_show'));

        expect(typeOf(node, 'root_val')).toBe('object');
        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ errors: [expect.objectContaining({ property: '.val.a' })] }),
          'root_show',
        );
      });

      it('should start an item added where data from outside removed one on the type its data starts it on', async () => {
        const ref = createFormRef();
        const { node, onChange } = createFormComponent({
          schema: { type: 'array', items: { type: ['object', 'string'], properties: { a: { type: 'string' } } } },
          uiSchema: { items: { a: { 'ui:required': true } } },
          initialFormData: [{}, {}],
          useFallbackUiForUnsupportedType: true,
          liveValidate: 'onChange',
          ref,
        });
        await pickType(node, 'root_1', 'string');
        // Data from outside, which tells the form of no move, so the type kept at the removed item's path stays
        act(() => handleOf(ref).setFieldValue([], [{}]));

        await user.click(elementOf(node, '.rjsf-array-item-add'));

        expect(typeOf(node, 'root_1')).toBe('object');
        expect(node.querySelector('#root_1_a')).toBeInTheDocument();
        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ errors: expect.arrayContaining([expect.objectContaining({ property: '.1.a' })]) }),
          'root',
        );
      });

      it('should keep the type each array item is on as the items move', async () => {
        const { node } = createFormComponent({
          schema: { type: 'array', items: { type: ['string', 'number'] } },
          initialFormData: ['1', '2'],
          useFallbackUiForUnsupportedType: true,
        });
        await pickType(node, 'root_0', 'number');
        // A number field holds the text of a number being typed, which a fresh selector would start on `string`
        await user.type(elementOf(node, '#root_0'), '.');
        expect(typeOf(node, 'root_0')).toBe('number');

        await user.click(screen.getAllByTitle('Move down')[0]);

        expect([typeOf(node, 'root_0'), typeOf(node, 'root_1')]).toEqual(['string', 'number']);
      });

      describe('within an array item', () => {
        const props = {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              arr: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { val: { type: ['object', 'number'], properties: { a: { type: 'string' } } } },
                },
              },
            },
          },
          initialFormData: { arr: [{}] },
          useFallbackUiForUnsupportedType: true,
          noHtml5Validate: true,
        } satisfies NoValFormProps;

        it('should submit once a number is picked, after an edit of another field', async () => {
          const { node, onSubmit, onError } = createFormComponent({
            ...props,
            uiSchema: { arr: { items: { val: { a: { 'ui:required': true } } } } },
          });
          await pickType(node, 'root_arr_0_val', 'number');
          await user.type(elementOf(node, '#root_name'), 'x');
          await submitForm(node, user);

          expect(onError).not.toHaveBeenCalled();
          expect(onSubmit).toHaveBeenCalled();
        });

        it('should keep the type picked through an edit of another field', async () => {
          const { node, rerender } = createFormComponent(props);
          await pickType(node, 'root_arr_0_val', 'number');
          await user.type(elementOf(node, '#root_name'), 'x');

          rerender({ ...props, uiSchema: { arr: { items: { val: { 'ui:title': 'Value' } } } } });

          expect(typeOf(node, 'root_arr_0_val')).toBe('number');
        });

        const { items } = props.schema.properties.arr;
        it.each<[string, RJSFSchema]>([
          ['an allOf', { allOf: [{ type: 'array' }, { items }] }],
          ['an anyOf option', { type: 'array', anyOf: [{ items }] }],
          ['the then of an if the data meets', { type: 'array', if: { minItems: 0 }, then: { items } }],
        ])('should keep the type picked through an edit of another field, with the items from %s', async (_, arr) => {
          const { node, onSubmit, onError } = createFormComponent({
            ...props,
            schema: { ...props.schema, properties: { ...props.schema.properties, arr } },
            uiSchema: { arr: { items: { val: { a: { 'ui:required': true } } } } },
          });
          await pickType(node, 'root_arr_0_val', 'number');
          await user.type(elementOf(node, '#root_name'), 'x');
          await submitForm(node, user);

          expect(typeOf(node, 'root_arr_0_val')).toBe('number');
          expect(onError).not.toHaveBeenCalled();
          expect(onSubmit).toHaveBeenCalled();
        });
      });

      it('should keep the type picked under an option the user picked, which the data does not match best', async () => {
        const { node, onSubmit, onError } = createFormComponent({
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              choice: {
                type: 'object',
                anyOf: [
                  { title: 'A', properties: { x: { type: 'string' } } },
                  {
                    title: 'B',
                    properties: { val: { type: ['object', 'number'], properties: { a: { type: 'string' } } } },
                  },
                ],
              },
            },
          },
          uiSchema: { choice: { val: { a: { 'ui:required': true } } } },
          useFallbackUiForUnsupportedType: true,
          noHtml5Validate: true,
        });
        await user.selectOptions(elementOf(node, '#root_choice__anyof_select'), '1');
        await pickType(node, 'root_choice_val', 'number');
        await user.type(elementOf(node, '#root_name'), 'x');
        await submitForm(node, user);

        expect(typeOf(node, 'root_choice_val')).toBe('number');
        expect(onError).not.toHaveBeenCalled();
        expect(onSubmit).toHaveBeenCalled();
      });

      it('should keep the type picked for an entry additionalProperties: true lets in, through an edit of another field', async () => {
        const props = {
          schema: { type: 'object', properties: { name: { type: 'string' } }, additionalProperties: true },
          initialFormData: { extra: '5' },
          useFallbackUiForUnsupportedType: true,
        } satisfies NoValFormProps;
        const { node, rerender } = createFormComponent(props);
        // `5` reads as a `number`, so only the kept pick keeps the selector on `integer`
        await pickType(node, 'root_extra', 'integer');
        await user.type(elementOf(node, '#root_name'), 'x');

        rerender({ ...props, uiSchema: { name: { 'ui:title': 'Name' } } });

        expect(typeOf(node, 'root_extra')).toBe('integer');
      });

      it.each([
        ['anyOf', [{ properties: { o: { type: 'string' } }, additionalProperties: true }]],
        ['oneOf', [{ additionalProperties: true }, { properties: { o: { type: 'string' } } }]],
      ] as const)(
        'should keep the type picked for an entry the shown %s option lets in, through an edit of another field',
        async (keyword, options) => {
          const props = {
            schema: { type: 'object', properties: { name: { type: 'string' } }, [keyword]: options },
            initialFormData: { extra: '5' },
            useFallbackUiForUnsupportedType: true,
          } satisfies NoValFormProps;
          const { node, rerender } = createFormComponent(props);
          await pickType(node, 'root_extra', 'integer');
          await user.type(elementOf(node, '#root_name'), 'x');

          rerender({ ...props, uiSchema: { name: { 'ui:title': 'Name' } } });

          expect(typeOf(node, 'root_extra')).toBe('integer');
        },
      );

      it.each<[string, RJSFSchema, RJSFSchema]>([
        ['the object', { additionalProperties: true }, {}],
        ['the option', {}, { additionalProperties: true }],
      ])(
        'should keep the type picked for an entry %s lets in, under a shown option offering options in turn',
        async (_, object, option) => {
          const props: NoValFormProps = {
            schema: {
              ...object,
              type: 'object',
              properties: { name: { type: 'string' } },
              anyOf: [
                {
                  ...option,
                  properties: { o: { type: 'string' } },
                  anyOf: [{ properties: { p: { type: 'string' } } }, { properties: { q: { type: 'string' } } }],
                },
              ],
            },
            initialFormData: { extra: '5' },
            useFallbackUiForUnsupportedType: true,
          };
          const { node, rerender } = createFormComponent(props);
          await pickType(node, 'root_extra', 'integer');
          await user.type(elementOf(node, '#root_name'), 'x');

          rerender({ ...props, uiSchema: { name: { 'ui:title': 'Name' } } });

          expect(typeOf(node, 'root_extra')).toBe('integer');
        },
      );

      it('should require nothing of the options of a field on number whose options list no types', async () => {
        const { node, onSubmit, onError } = createFormComponent({
          schema: {
            type: 'object',
            properties: {
              val: {
                type: ['object', 'number'],
                properties: { a: { type: 'string' } },
                anyOf: [{ properties: { b: { type: 'string' } } }, { properties: { c: { type: 'string' } } }],
              },
            },
          },
          uiSchema: { val: { b: { 'ui:required': true } } },
          useFallbackUiForUnsupportedType: true,
          noHtml5Validate: true,
        });
        await pickType(node, 'root_val', 'number');
        await submitForm(node, user);

        expect(node.querySelector('#root_val_b')).not.toBeInTheDocument();
        expect(onError).not.toHaveBeenCalled();
        expect(onSubmit).toHaveBeenCalled();
      });
    });

    it('should let the fallback UI start a textarea on the string with no value, and an object on its own type', () => {
      const { node: empty } = listForm(objectList, undefined, { useFallbackUiForUnsupportedType: true });
      expect(empty.querySelector('textarea')).toBeInTheDocument();

      const { node: holding } = listForm(objectList, { val: { a: 'q' } }, { useFallbackUiForUnsupportedType: true });
      expect(holding.querySelector('textarea')).not.toBeInTheDocument();
      expect(holding.querySelector('#root_val_a')).toHaveValue('q');
    });
  });

  describe('type list starting with null', () => {
    it('should render the field for the first type that is not null', async () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['null', 'string', 'number'] } } },
      });

      expect(node.querySelector('.rjsf-field-null')).not.toBeInTheDocument();
      await user.type(screen.getByRole('textbox'), 'hi');

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { val: 'hi' } }), 'root_val');
    });

    it('should render an input within whichever oneOf option is selected', async () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['null', 'string', 'number'], oneOf: [{ title: 'A' }, { title: 'B' }] } },
        },
      });

      expect(node.querySelectorAll('input')).toHaveLength(1);
      await user.selectOptions(screen.getByRole('combobox'), 'B');

      expect(node.querySelectorAll('input')).toHaveLength(1);
      expect(node.querySelector('.rjsf-field-null')).not.toBeInTheDocument();
    });

    it('should keep the text typed into a widget only the string type has, rather than convert it', async () => {
      const { onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['null', 'number', 'string'] } } },
        uiSchema: { val: { 'ui:widget': 'textarea' } },
      });

      await user.type(screen.getByRole('textbox'), '007');

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { val: '007' } }), 'root_val');
    });

    it('should render the string field for a widget named by its registered name', async () => {
      const { onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['null', 'number', 'string'] } } },
        uiSchema: { val: { 'ui:widget': 'TextareaWidget' } },
      });
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');

      await user.type(textarea, '007');

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { val: '007' } }), 'root_val');
    });

    // A `format` constrains only the list's string member, so unlike a `ui:widget` it doesn't make the number the list
    // resolves to unreachable
    it.each<[RJSFSchema['type']]>([[['null', 'integer', 'string']], [['number', 'string']]])(
      'should keep the number field of a %j list whose format names a widget only its string type has',
      async (type) => {
        const { onChange } = createFormComponent({
          schema: { type: 'object', properties: { val: { type, format: 'email' } } },
        });
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('type', 'text');

        await user.type(input, '42');

        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { val: 42 } }), 'root_val');
      },
    );

    it('should render the widget a format names for a list resolving to string', () => {
      createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['null', 'string', 'number'], format: 'email' } } },
      });

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('should still convert what is typed into a number for a number-first list with no string widget', async () => {
      const { onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['null', 'number', 'string'], format: 'uuid' } } },
      });

      await user.type(screen.getByRole('textbox'), '7');

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { val: 7 } }), 'root_val');
    });

    it('should save a number from a widget only the number type has on a string-first list', async () => {
      const { onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['string', 'number'] } } },
        uiSchema: { val: { 'ui:widget': 'updown' } },
      });

      const input = screen.getByRole('spinbutton');
      await user.type(input, '7.5');

      // Without a `step="any"`, the browser would treat the decimal as a step mismatch and block the submit
      expect(input).toHaveAttribute('step', 'any');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { val: 7.5 } }), 'root_val');
    });

    it('should save a boolean from a widget only the boolean type has on a number-first list', async () => {
      const { onChange } = createFormComponent({
        schema: { type: 'object', properties: { val: { type: ['number', 'boolean'] } } },
        uiSchema: { val: { 'ui:widget': 'checkbox' } },
      });

      await user.click(screen.getByRole('checkbox'));

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { val: true } }), 'root_val');
    });
  });

  describe('Custom SchemaField component', () => {
    const CustomSchemaField = function CustomSchemaField(props: FieldProps) {
      return (
        <div id='custom'>
          <SchemaField {...props} />
        </div>
      );
    };

    it('should use the specified custom SchemaType property', () => {
      const fields = { SchemaField: CustomSchemaField };
      const { node } = createFormComponent({
        schema: { type: 'string' },
        fields,
      });

      expect(node.querySelectorAll('#custom > .rjsf-field input[type=text]')).toHaveLength(1);
    });
  });

  describe('Custom type component', () => {
    const CustomStringField = function CustomStringField() {
      return <div id='custom-type' />;
    };

    it('should use custom type component', () => {
      const fields = { StringField: CustomStringField };
      const { node } = createFormComponent({
        schema: { type: 'string' },
        fields,
      });

      expect(node.querySelectorAll('#custom-type')).toHaveLength(1);
    });
  });

  describe('Custom id component', () => {
    const CustomIdField = function CustomIdField() {
      return <div id='custom-id' />;
    };

    it('should use custom id compnent', () => {
      const fields = { '/schemas/custom-id': CustomIdField };
      const { node } = createFormComponent({
        schema: {
          $id: '/schemas/custom-id',
          type: 'string',
        },
        fields,
      });

      expect(node.querySelectorAll('#custom-id')).toHaveLength(1);
    });
  });

  describe('ui:field support', () => {
    function MyObject() {
      return <div id='custom' />;
    }

    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };

    it('should use provided direct custom component for object', () => {
      const uiSchema: UiSchema = { 'ui:field': MyObject };

      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelectorAll('#custom')).toHaveLength(1);

      expect(node.querySelectorAll('label')).toHaveLength(0);
    });

    it('should use provided direct custom component for specific property', () => {
      const uiSchema: UiSchema = {
        foo: { 'ui:field': MyObject },
      };

      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelectorAll('#custom')).toHaveLength(1);

      expect(node.querySelectorAll('input')).toHaveLength(1);

      expect(node.querySelectorAll('label')).toHaveLength(1);
    });

    it('should provide custom field the expected fields', () => {
      let receivedProps: FieldProps;
      createFormComponent({
        schema,
        uiSchema: {
          'ui:field': (props) => {
            receivedProps = props;
            return null;
          },
        },
      });

      // @ts-expect-error: TS2454, because we are setting it in the field component above
      const { registry } = receivedProps;
      const defaultRegistry = generateTheme();
      expect(registry.widgets).toEqual(defaultRegistry.widgets);
      expect(registry.rootSchema).toEqual(schema);
      expect(registry.fields).toBeInstanceOf(Object);
      expect(registry.fields.SchemaField).toEqual(SchemaField);
      expect(registry.templates.TitleFieldTemplate).toEqual(defaultRegistry.templates.TitleFieldTemplate);
      expect(registry.templates.DescriptionFieldTemplate).toEqual(defaultRegistry.templates.DescriptionFieldTemplate);
    });

    it('should use registered custom component for object', () => {
      const uiSchema: UiSchema = { 'ui:field': 'myobject' };
      const fields = { myobject: MyObject };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('#custom')).toHaveLength(1);
    });

    it('should handle referenced schema definitions', () => {
      const schema: RJSFSchema = {
        definitions: {
          foobar: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
            },
          },
        },
        $ref: '#/definitions/foobar',
      };
      const uiSchema: UiSchema = { 'ui:field': 'myobject' };
      const fields = { myobject: MyObject };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('#custom')).toHaveLength(1);
    });

    it('should not pass ui:classNames or ui:style to child component', () => {
      const CustomSchemaField = function CustomSchemaField(props: FieldProps) {
        return <SchemaField {...props} uiSchema={{ ...props.uiSchema, 'ui:field': undefined }} />;
      };

      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema: UiSchema = {
        'ui:field': 'customSchemaField',
        'ui:classNames': 'foo',
        'ui:style': { color: 'red' },
      };
      const fields = { customSchemaField: CustomSchemaField };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('.foo')).toHaveLength(1);
      expect(node.querySelectorAll("[style*='red']")).toHaveLength(1);
    });
    it('should not pass ui:options { classNames or style } to child component', () => {
      const CustomSchemaField = function CustomSchemaField(props: FieldProps) {
        return <SchemaField {...props} uiSchema={{ ...props.uiSchema, 'ui:field': undefined }} />;
      };

      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema: UiSchema = {
        'ui:field': 'customSchemaField',
        'ui:options': {
          classNames: 'foo',
          style: { color: 'red' },
        },
      };
      const fields = { customSchemaField: CustomSchemaField };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('.foo')).toHaveLength(1);
      expect(node.querySelectorAll("[style*='red']")).toHaveLength(1);
    });

    describe('a ui:field that is not a function component', () => {
      const consoleWarnSuppression = setupConsoleWarnSuppression();
      const stringSchema: RJSFSchema = { type: 'object', properties: { val: { type: 'string' } } };
      const ForwardedField = forwardRef<HTMLDivElement>((_props, ref) => <div id='custom' ref={ref} />);

      it.each([
        ['memo()', memo(MyObject)],
        ['forwardRef()', ForwardedField],
      ])('renders a %s component in place of the default field', (_, component) => {
        const { node } = createFormComponent({
          schema: stringSchema,
          uiSchema: { val: { 'ui:field': component as Field } },
        });

        expect(node.querySelector('#custom')).toBeInTheDocument();
        expect(node.querySelector('#root_val')).not.toBeInTheDocument();
        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
      });

      it('renders a lazy() component in place of the default field', async () => {
        const LazyField = lazy(async () => ({ default: MyObject }));
        const { container } = render(
          <Suspense fallback={null}>
            <Form schema={stringSchema} uiSchema={{ val: { 'ui:field': LazyField } }} validator={validator} />
          </Suspense>,
        );

        await waitFor(() => expect(container.querySelector('#custom')).toBeInTheDocument());
        expect(container.querySelector('#root_val')).not.toBeInTheDocument();
        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
      });

      it('warns that a name no field is registered under is ignored, and renders the default field', () => {
        const { node } = createFormComponent({
          schema: stringSchema,
          uiSchema: { val: { 'ui:field': 'Stringfield' } },
        });

        expect(node.querySelector('input#root_val')).toBeInTheDocument();
        // Labelled as the default field is anywhere else
        expect(node.querySelector('label[for="root_val"]')).toBeInTheDocument();
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          `ui:field for "root_val" (val) names no registered field ('Stringfield'), so it is ignored and the field is ` +
            'rendered as though no ui:field were given.',
        );
      });

      it('warns that a React element is ignored, since it is not a component', () => {
        const { node } = createFormComponent({
          schema: stringSchema,
          uiSchema: { val: { 'ui:field': (<MyObject />) as unknown as Field } },
        });

        expect(node.querySelector('#custom')).not.toBeInTheDocument();
        expect(node.querySelector('input#root_val')).toBeInTheDocument();
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'ui:field for "root_val" (val) is a React element rather than a component (pass MyField, not <MyField />), ' +
            'so it is ignored and the field is rendered as though no ui:field were given.',
        );
      });

      it('warns that a name a React element is registered under is ignored, and renders the default field', () => {
        const { node } = createFormComponent({
          schema: stringSchema,
          uiSchema: { val: { 'ui:field': 'geo' } },
          fields: { geo: (<MyObject />) as unknown as Field },
        });

        expect(node.querySelector('#custom')).not.toBeInTheDocument();
        expect(node.querySelector('input#root_val')).toBeInTheDocument();
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          `ui:field for "root_val" (val) names a registered field ('geo') that is a React element rather than a ` +
            'component (pass MyField, not <MyField />), so it is ignored and the field is rendered as though no ' +
            'ui:field were given.',
        );
      });

      it.each<[string, RJSFSchema, UiSchema, unknown, string]>([
        [
          'a nested',
          {
            type: 'object',
            properties: {
              list: { type: 'array', items: { type: 'object', properties: { val: { type: 'string' } } } },
            },
          },
          { list: { items: { val: { 'ui:field': 'Typo' } } } },
          { list: [{}, {}, {}] },
          '"root_list_[]_val" (list[].val)',
        ],
        [
          'the root',
          { type: 'array', items: { type: 'string' } },
          { items: { 'ui:field': 'Typo' } },
          ['a', 'b', 'c'],
          '"root_[]" ([])',
        ],
      ])(
        'warns once about an unusable ui:field in %s items entry, not once per item',
        (_, schema, uiSchema, formData, label) => {
          const { node } = createFormComponent({ schema, uiSchema, initialFormData: formData });

          expect(node.querySelectorAll('input')).toHaveLength(3);
          expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
            `ui:field for ${label} names no registered field ('Typo'), so it is ignored and the field is rendered as ` +
              'though no ui:field were given.',
          );
        },
      );

      it('warns once about an unusable ui:field in an additionalProperties entry, not once per extra key', () => {
        createFormComponent({
          schema: { type: 'object', additionalProperties: { type: 'string' } },
          uiSchema: { additionalProperties: { 'ui:field': 'Typo' } },
          initialFormData: { x: 'a', y: 'b' },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'ui:field for "root_{}" ({}) names no registered field (\'Typo\'), so it is ignored and the field is ' +
            'rendered as though no ui:field were given.',
        );
      });

      it("warns apart about the same unusable ui:field in two options' entries, naming each entry", async () => {
        createFormComponent({
          schema: {
            anyOf: [
              { title: 'A', type: 'object', properties: { b: { type: 'string' } } },
              { title: 'B', type: 'object', properties: { b: { type: 'number' } } },
            ],
          },
          uiSchema: { anyOf: [{ b: { 'ui:field': 'Typo' } }, { b: { 'ui:field': 'Typo' } }] },
        });

        await user.selectOptions(screen.getByRole('combobox'), 'B');

        expect(consoleWarnSuppression.consoleSpy.mock.calls).toEqual([
          [
            'ui:field for the uiSchema.anyOf[0].b entry of "root" names no registered field (\'Typo\'), so it is ' +
              'ignored and the field is rendered as though no ui:field were given.',
          ],
          [
            'ui:field for the uiSchema.anyOf[1].b entry of "root" names no registered field (\'Typo\'), so it is ' +
              'ignored and the field is rendered as though no ui:field were given.',
          ],
        ]);
      });

      it('warns that a value that is neither a name nor a component is ignored', () => {
        const { node } = createFormComponent({
          schema: stringSchema,
          uiSchema: { val: { 'ui:field': 42 as unknown as Field } },
        });

        expect(node.querySelector('input#root_val')).toBeInTheDocument();
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'ui:field for "root_val" (val) is not a component (got number), so it is ignored and the field is rendered ' +
            'as though no ui:field were given.',
        );
      });

      it('does not warn when a ui:field is shadowed with undefined', () => {
        createFormComponent({ schema: stringSchema, uiSchema: { val: { 'ui:field': undefined } } });

        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('a named field renders once per data path', () => {
    const schema: RJSFSchema = { type: 'object', properties: { val: { type: 'string', title: 'Value' } } };

    function WrappingField(props: FieldProps) {
      const { SchemaField: RegistrySchemaField } = props.registry.fields;
      return (
        <div className='wrapper'>
          <RegistrySchemaField {...props} />
        </div>
      );
    }

    it("renders the field ui:field: 'SchemaField' names once, rather than until the heap runs out (#5377)", () => {
      const { node } = createFormComponent({ schema, uiSchema: { val: { 'ui:field': 'SchemaField' } } });

      expect(node.querySelectorAll('input#root_val')).toHaveLength(1);
      expect(screen.getByLabelText('Value')).toBe(node.querySelector('input#root_val'));
    });

    describe('the keys ui:options does not take', () => {
      setupConsoleWarnSuppression();
      const fields = { own: () => <div className='own-field' /> };

      // Untyped, as a JSON uiSchema is, since the type rejects these
      it('ignores the field ui:options.field names', () => {
        const uiSchema = { 'ui:options': { field: 'own' } } as unknown as UiSchema;
        const { node } = createFormComponent({ schema: { type: 'string' }, uiSchema, fields });

        expect(node.querySelector('.own-field')).not.toBeInTheDocument();
        expect(node.querySelectorAll('input#root')).toHaveLength(1);
      });

      it('leaves the options for ui:options.fieldReplacesAnyOrOneOf', () => {
        const uiSchema = { 'ui:field': 'own', 'ui:options': { fieldReplacesAnyOrOneOf: true } } as unknown as UiSchema;
        const schema: RJSFSchema = { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] };
        const { node } = createFormComponent({ schema, uiSchema, fields });

        expect(node.querySelectorAll('.own-field')).toHaveLength(1);
        expect(node.querySelectorAll('#root__anyof_select')).toHaveLength(1);
      });
    });

    it('renders a field that wraps SchemaField for its own data once (#5377)', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { val: { 'ui:field': 'wrapping' } },
        fields: { wrapping: WrappingField },
      });

      expect(node.querySelectorAll('.wrapper')).toHaveLength(1);
      expect(node.querySelectorAll('input#root_val')).toHaveLength(1);
    });

    it('renders a field a $id names once when it wraps SchemaField (#5377)', () => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: { $id: 'wrapping', type: 'string' } } },
        fields: { wrapping: WrappingField },
      });

      expect(node.querySelectorAll('.wrapper')).toHaveLength(1);
      expect(node.querySelectorAll('input#root_val')).toHaveLength(1);
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      ['no field', schema, {}],
      ["ui:field: 'SchemaField'", schema, { val: { 'ui:field': 'SchemaField' } }],
      ['a ui:field wrapping SchemaField', schema, { val: { 'ui:field': 'wrapping' } }],
      ['a $id wrapping SchemaField', { type: 'object', properties: { val: { $id: 'wrapping', type: 'string' } } }, {}],
    ])("hands the widget the field's own errors with %s named, and renders them once", (_, schema, uiSchema) => {
      const renderWidget = vi.fn<(id: string, rawErrors: WidgetProps['rawErrors']) => void>();
      function TextWidget(props: WidgetProps) {
        // oxlint-disable-next-line typescript/no-deprecated -- the errors a widget rendered without reading its plan gets
        renderWidget(props.id, props.rawErrors);
        return <input id={props.id} />;
      }
      const { node } = createFormComponent({
        schema,
        uiSchema,
        extraErrors: { val: { __errors: ['bad'] } },
        showErrorList: false,
        widgets: { TextWidget },
        fields: { wrapping: WrappingField },
      });

      expect(renderWidget).toHaveBeenLastCalledWith('root_val', ['bad']);
      expect(new Set(renderWidget.mock.calls.map(([id]) => id))).toEqual(new Set(['root_val']));
      expect(screen.getAllByText('bad')).toHaveLength(1);
      expect(node.querySelectorAll('#root_val__error')).toHaveLength(1);
    });

    const titled: RJSFSchema = { type: 'string', title: 'Val', description: 'Desc' };
    const titledAnyOf: RJSFSchema = { ...titled, anyOf: [{ minLength: 2 }, { maxLength: 5 }] };
    it.each<{
      spelling: string;
      schema: RJSFSchema;
      named: RJSFSchema;
      uiSchema: UiSchema;
      props?: Omit<NoValFormProps, 'schema'>;
    }>([
      {
        spelling: "ui:field: 'SchemaField' on an anyOf",
        schema: { type: 'object', properties: { val: titledAnyOf } },
        named: { type: 'object', properties: { val: titledAnyOf } },
        uiSchema: { val: { 'ui:field': 'SchemaField' } },
      },
      {
        spelling: "ui:field: 'SchemaField' on an array's items",
        schema: { type: 'array', items: titled },
        named: { type: 'array', items: titled },
        uiSchema: { items: { 'ui:field': 'SchemaField' } },
        props: { initialFormData: ['x'] },
      },
      {
        spelling: "ui:field: 'SchemaField' on an anyOf array item",
        schema: { type: 'array', items: titledAnyOf },
        named: { type: 'array', items: titledAnyOf },
        uiSchema: { items: { 'ui:field': 'SchemaField' } },
        props: { initialFormData: ['x'] },
      },
      {
        spelling: "ui:field: 'SchemaField' on an extra key",
        schema: { type: 'object', additionalProperties: titled },
        named: { type: 'object', additionalProperties: titled },
        uiSchema: { additionalProperties: { 'ui:field': 'SchemaField' } },
        props: { initialFormData: { k: 'x' } },
      },
      {
        spelling: "ui:field: 'SchemaField' on an object with errors",
        schema: { type: 'object', properties: { o: { type: 'object', title: 'O', properties: { a: titled } } } },
        named: { type: 'object', properties: { o: { type: 'object', title: 'O', properties: { a: titled } } } },
        uiSchema: { o: { 'ui:field': 'SchemaField' } },
        props: { extraErrors: { o: { __errors: ['o bad'], a: { __errors: ['a bad'] } } } },
      },
      {
        spelling: "a $id naming 'SchemaField' on an anyOf",
        schema: { type: 'object', properties: { val: titledAnyOf } },
        named: { type: 'object', properties: { val: { ...titledAnyOf, $id: 'SchemaField' } } },
        uiSchema: {},
      },
    ])('renders $spelling exactly as with no field named', ({ schema, named, uiSchema, props }) => {
      const { node: unnamedNode } = createFormComponent({ schema, showErrorList: false, ...props });
      const { node: namedNode } = createFormComponent({ schema: named, uiSchema, showErrorList: false, ...props });

      expect(namedNode.innerHTML).toBe(unnamedNode.innerHTML);
    });

    describe("labels an array item as the item's field is labelled", () => {
      setupConsoleWarnSuppression();
      function OwnField(props: FieldProps) {
        return <input id={props.id} />;
      }
      function DeclaredField(props: FieldProps) {
        return <input id={props.id} />;
      }
      function DeclaredWrappingField(props: FieldProps) {
        const { SchemaField: RegistrySchemaField } = props.registry.fields;
        return (
          <div className='wrapper'>
            <RegistrySchemaField {...props} />
          </div>
        );
      }

      /** Renders a one-item array, recording the `displayLabel` the item's template is handed, and the one each
       * template rendered at the item's id is handed, in the order they render
       */
      function renderItemLabels({
        initialFormData = ['x'],
        presentation,
        ...props
      }: Omit<NoValFormProps, 'fields' | 'templates'>) {
        const items: (boolean | undefined)[] = [];
        const fields: (boolean | undefined)[] = [];
        function ArrayFieldItemTemplate(templateProps: ArrayFieldItemTemplateProps) {
          items.push(templateProps.displayLabel);
          return <div>{templateProps.children}</div>;
        }
        function FieldTemplate(templateProps: FieldTemplateProps) {
          if (templateProps.id === 'root_0') {
            // oxlint-disable-next-line typescript/no-deprecated -- the prop the item's template lays its toolbar out to match
            fields.push(templateProps.displayLabel);
          }
          return <div>{templateProps.children}</div>;
        }
        createFormComponent({
          ...props,
          initialFormData,
          fields: {
            own: OwnField,
            declared: DeclaredField,
            wrapping: WrappingField,
            declaredWrapping: DeclaredWrappingField,
          },
          presentation: {
            ...presentation,
            fields: {
              ...presentation?.fields,
              declared: { label: 'template' },
              declaredWrapping: { label: 'template' },
            },
          },
          templates: { ArrayFieldItemTemplate, FieldTemplate },
        });
        return { items, fields };
      }

      it.each<{ named: string; items: RJSFSchema; uiSchema: UiSchema; displayLabel: boolean }>([
        {
          named: "ui:field: 'SchemaField'",
          items: titled,
          uiSchema: { items: { 'ui:field': 'SchemaField' } },
          displayLabel: true,
        },
        {
          named: "ui:field: 'Missing'",
          items: titled,
          uiSchema: { items: { 'ui:field': 'Missing' } },
          displayLabel: true,
        },
        {
          named: "ui:field: 'Missing' and a $id naming 'SchemaField'",
          items: { ...titled, $id: 'SchemaField' },
          uiSchema: { items: { 'ui:field': 'Missing' } },
          displayLabel: true,
        },
        {
          named: 'a ui:field naming a field written for the item',
          items: titled,
          uiSchema: { items: { 'ui:field': 'own' } },
          displayLabel: false,
        },
        {
          named: 'a $id naming a field written for the item',
          items: { ...titled, $id: 'own' },
          uiSchema: {},
          displayLabel: false,
        },
      ])('with $named', ({ items, uiSchema, displayLabel }) => {
        const labels = renderItemLabels({ schema: { type: 'array', items }, uiSchema });

        expect(labels.items.at(-1)).toBe(displayLabel);
        expect(labels.fields.at(-1)).toBe(displayLabel);
      });

      const spellings: { spelling: string; naming: (key: string) => Pick<NoValFormProps, 'schema' | 'uiSchema'> }[] = [
        {
          spelling: 'ui:field',
          naming: (key) => ({ schema: { type: 'array', items: titled }, uiSchema: { items: { 'ui:field': key } } }),
        },
        { spelling: 'a $id', naming: (key) => ({ schema: { type: 'array', items: { ...titled, $id: key } } }) },
      ];
      const namedFields: { kind: string; key: string; templateDrawsLabel: boolean }[] = [
        { kind: 'a custom field drawing its own label', key: 'own', templateDrawsLabel: false },
        { kind: "a field declared label: 'template'", key: 'declared', templateDrawsLabel: true },
        // The field a wrapper renders for its own data draws the label it hands down, within the wrapper's template,
        // which the plan of the field named here has no way to foresee
        { kind: 'a field wrapping SchemaField', key: 'wrapping', templateDrawsLabel: false },
        {
          kind: "a wrapper declared label: 'template'",
          key: 'declaredWrapping',
          templateDrawsLabel: true,
        },
        { kind: "StringField, the item's default field", key: 'StringField', templateDrawsLabel: true },
      ];
      it.each(
        spellings.flatMap(({ spelling, naming }) =>
          namedFields.map(({ kind, key, templateDrawsLabel }) => ({
            spelling,
            kind,
            templateDrawsLabel,
            ...naming(key),
          })),
        ),
      )(
        'with $spelling naming $kind, as the template of the field named draws its label',
        ({ templateDrawsLabel, ...props }) => {
          const labels = renderItemLabels(props);

          expect(labels.fields[0]).toBe(templateDrawsLabel);
          expect(labels.items.at(-1)).toBe(templateDrawsLabel);
        },
      );

      it.each<{
        named: string;
        props: Omit<NoValFormProps, 'fields' | 'presentation' | 'templates'>;
        displayLabel: boolean;
      }>([
        {
          named: 'a boolean with titled oneOf constants',
          props: {
            schema: {
              type: 'array',
              items: {
                type: 'boolean',
                title: 'Flag',
                oneOf: [
                  { const: true, title: 'Yes' },
                  { const: false, title: 'No' },
                ],
              },
            },
            initialFormData: [true],
          },
          displayLabel: true,
        },
        {
          named: 'an untitled item, with no label text',
          props: { schema: { type: 'array', items: { type: 'string' } } },
          displayLabel: false,
        },
        {
          named: 'a null item, which NullField titles',
          props: { schema: { type: 'array', items: { type: 'null', title: 'Nothing' } }, initialFormData: [null] },
          displayLabel: false,
        },
        {
          named: "ui:widget: 'checkbox' on a boolean",
          props: {
            schema: { type: 'array', items: { type: 'boolean', title: 'Flag' } },
            uiSchema: { items: { 'ui:widget': 'checkbox' } },
            initialFormData: [true],
          },
          displayLabel: false,
        },
        {
          named: 'an object union, its selector labelled',
          props: {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                title: 'Union',
                anyOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'string' } } }],
              },
            },
            initialFormData: [{}],
          },
          displayLabel: true,
        },
        {
          named: 'ui:definitions naming a custom field',
          props: {
            schema: { type: 'array', items: { $ref: '#/definitions/val' }, definitions: { val: titled } },
            uiSchema: { 'ui:definitions': { '#/definitions/val': { 'ui:field': 'own' } } },
          },
          displayLabel: false,
        },
      ])('with $named, as its template draws the label', ({ props, displayLabel }) => {
        const labels = renderItemLabels(props);

        expect(labels.fields[0]).toBe(displayLabel);
        expect(labels.items.at(-1)).toBe(displayLabel);
      });

      // A theme whose widgets draw their own label above the control, its checkbox beside it, as @rjsf/fluentui-rc's do
      const selfLabelled: ThemePresentation = {
        default: { label: 'self', labelPlacement: 'above' },
        widgets: { CheckboxWidget: { labelPlacement: 'beside' } },
      };
      it.each<{ named: string; items: RJSFSchema; uiSchema?: UiSchema; value: unknown; displayLabel: boolean }>([
        { named: 'a text input drawing its label above it', items: titled, value: 'x', displayLabel: true },
        {
          named: 'a checkbox drawing its label beside it',
          items: { type: 'boolean', title: 'Flag' },
          value: true,
          displayLabel: false,
        },
        {
          named: 'a hidden input, with no control on screen to draw a label above',
          items: titled,
          uiSchema: { items: { 'ui:widget': 'hidden' } },
          value: 'x',
          displayLabel: false,
        },
      ])('with $named, as its declaration places the label', ({ items, uiSchema, value, displayLabel }) => {
        const labels = renderItemLabels({
          schema: { type: 'array', items },
          uiSchema,
          initialFormData: [value],
          presentation: selfLabelled,
        });

        expect(labels.fields[0]).toBe(false);
        expect(labels.items.at(-1)).toBe(displayLabel);
      });

      // The fallback UI's type selector comes first and is labelled for the type, whatever the item's title or the
      // value's widget, by the template here and by the select itself under a theme declaring it so
      const typeList: RJSFSchema = { type: ['string', 'number'] };
      describe.each<{ theme: string; presentation?: ThemePresentation }>([
        { theme: 'the template' },
        {
          theme: 'the select',
          presentation: { ...selfLabelled, fields: { FallbackField: { label: 'self', labelPlacement: 'above' } } },
        },
      ])('under the fallback UI, its type selector labelled by $theme', ({ presentation }) => {
        it.each<{ named: string; items: RJSFSchema; uiSchema?: UiSchema; value?: unknown; displayLabel: boolean }>([
          { named: 'a titled type list', items: { ...typeList, title: 'Value' }, displayLabel: true },
          { named: 'an untitled type list', items: typeList, displayLabel: true },
          {
            named: 'a type list with a hidden value, whose type selector is hidden with it',
            items: { ...typeList, title: 'Value' },
            uiSchema: { items: { 'ui:widget': 'hidden' } },
            displayLabel: false,
          },
          {
            named: 'a deprecated type list hidden by ui:deprecatedHandling, whose type selector is hidden with it',
            items: { ...typeList, title: 'Value', deprecated: true },
            uiSchema: { items: { 'ui:deprecatedHandling': 'hide' } },
            displayLabel: false,
          },
          {
            named: "a type list with ui:label false, which turns the selector's label off too",
            items: { ...typeList, title: 'Value' },
            uiSchema: { items: { 'ui:label': false } },
            displayLabel: false,
          },
          {
            named: 'a boolean-first type list, whose checkbox draws its own label below the type selector',
            items: { type: ['boolean', 'string'], title: 'Value' },
            value: true,
            displayLabel: true,
          },
          {
            named: 'a lone boolean radio naming FallbackField, which draws its label above the control',
            items: { type: 'boolean', title: 'Value' },
            uiSchema: { items: { 'ui:field': 'FallbackField', 'ui:widget': 'radio' } },
            value: true,
            displayLabel: true,
          },
          {
            named: 'an object-first type list, whose heading is drawn below the type selector',
            items: { type: ['object', 'string'], title: 'Value' },
            value: {},
            displayLabel: true,
          },
          {
            named: 'a hidden text input, which renders no type selector',
            items: titled,
            uiSchema: { items: { 'ui:widget': 'hidden' } },
            displayLabel: false,
          },
        ])('with $named', ({ items, uiSchema, value = 'a', displayLabel }) => {
          const labels = renderItemLabels({
            schema: { type: 'array', items },
            uiSchema,
            initialFormData: [value],
            presentation,
            useFallbackUiForUnsupportedType: true,
          });

          expect(labels.items.at(-1)).toBe(displayLabel);
        });
      });
    });

    const describedSchema: RJSFSchema = {
      type: 'object',
      properties: { val: { type: 'string', title: 'Value', description: 'Desc' } },
    };
    const describedIdSchema: RJSFSchema = {
      type: 'object',
      properties: { val: { $id: 'wrapping', type: 'string', title: 'Value', description: 'Desc' } },
    };

    it.each<[string, RJSFSchema, UiSchema]>([
      ["ui:field: 'SchemaField'", describedSchema, { val: { 'ui:field': 'SchemaField', 'ui:help': 'Help' } }],
      ['a ui:field wrapping SchemaField', describedSchema, { val: { 'ui:field': 'wrapping', 'ui:help': 'Help' } }],
      ['a $id wrapping SchemaField', describedIdSchema, { val: { 'ui:help': 'Help' } }],
    ])('renders one label, description and help for the field %s names', (_, schema, uiSchema) => {
      const { node } = createFormComponent({ schema, uiSchema, fields: { wrapping: WrappingField } });

      expect(node.querySelectorAll('input#root_val')).toHaveLength(1);
      expect(node.querySelectorAll('label[for="root_val"]')).toHaveLength(1);
      expect(node.querySelectorAll('#root_val__description')).toHaveLength(1);
      expect(node.querySelectorAll('#root_val__help')).toHaveLength(1);
    });

    it('hands the label and description of a field a ui:field names that wraps SchemaField down to the field it wraps, rendering each once', () => {
      const { node } = createFormComponent({
        schema: describedSchema,
        uiSchema: { val: { 'ui:field': 'wrapping', 'ui:help': 'Help' } },
        fields: { wrapping: WrappingField },
      });

      expect(node.querySelectorAll('input#root_val')).toHaveLength(1);
      expect(node.querySelectorAll('label[for="root_val"]')).toHaveLength(1);
      expect(screen.getByRole('textbox', { name: 'Value' })).toBe(node.querySelector('input#root_val'));
      expect(node.querySelectorAll('#root_val__description')).toHaveLength(1);
      expect(node.querySelectorAll('#root_val__help')).toHaveLength(1);
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      [
        "ui:field: 'SchemaField'",
        { type: 'object', properties: { val: { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] } } },
        { val: { 'ui:field': 'SchemaField' } },
      ],
      [
        'a ui:field wrapping SchemaField',
        { type: 'object', properties: { val: { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] } } },
        { val: { 'ui:field': 'wrapping' } },
      ],
      [
        'a $id wrapping SchemaField',
        {
          type: 'object',
          properties: { val: { $id: 'wrapping', anyOf: [{ type: 'string' }, { type: 'number' }] } },
        },
        {},
      ],
    ])('renders one option selector and one input for an anyOf the field %s names', (_, schema, uiSchema) => {
      const { node } = createFormComponent({ schema, uiSchema, fields: { wrapping: WrappingField } });

      expect(node.querySelectorAll('select')).toHaveLength(1);
      expect(node.querySelector('select')).toHaveAttribute('id', 'root_val__anyof_select');
      expect(node.querySelectorAll('input')).toHaveLength(1);
      expect(node.querySelector('input')).toHaveAttribute('id', 'root_val');
    });

    it("renders each property of an object oneOf's option once below a field wrapping SchemaField", async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          oneOf: [
            { title: 'A', properties: { a: { type: 'string' } } },
            { title: 'B', properties: { b: { type: 'number' } } },
          ],
        },
        uiSchema: { 'ui:field': 'wrapping' },
        fields: { wrapping: WrappingField },
      });

      expect(node.querySelectorAll('.wrapper')).toHaveLength(1);
      expect(node.querySelectorAll('select')).toHaveLength(1);
      expect(node.querySelectorAll('input#root_a')).toHaveLength(1);

      await user.selectOptions(screen.getByRole('combobox'), 'B');
      await user.type(screen.getByRole('textbox'), '3');

      expect(node.querySelectorAll('input#root_b')).toHaveLength(1);
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { b: 3 } }), 'root_b');
    });

    it("leaves the keys an object oneOf's selected option declares to the option below a field wrapping SchemaField", () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: { type: 'string' },
        oneOf: [
          { title: 'A', properties: { a: { type: 'string' } } },
          { title: 'B', properties: { b: { type: 'string' } } },
        ],
      };
      const formData = { a: 'x', c: 'y' };
      const { node: unnamedNode } = createFormComponent({ schema, initialFormData: formData });
      const { node } = createFormComponent({
        schema,
        initialFormData: formData,
        uiSchema: { 'ui:field': 'wrapping' },
        fields: { wrapping: WrappingField },
      });

      expect(node.querySelectorAll('input#root_a')).toHaveLength(1);
      expect(node.querySelectorAll('input#root_c')).toHaveLength(1);
      expect(node.querySelectorAll('input')).toHaveLength(unnamedNode.querySelectorAll('input').length);
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      [
        "ui:field: 'SchemaField'",
        { type: 'object', additionalProperties: { type: 'string' } },
        { additionalProperties: { 'ui:field': 'SchemaField' } },
      ],
      [
        'a ui:field wrapping SchemaField',
        { type: 'object', additionalProperties: { type: 'string' } },
        { additionalProperties: { 'ui:field': 'wrapping' } },
      ],
      ['a $id wrapping SchemaField', { type: 'object', additionalProperties: { $id: 'wrapping', type: 'string' } }, {}],
    ])('renders one key input and one remove button for an extra key the field %s names', (_, schema, uiSchema) => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
        initialFormData: { foo: 'x' },
        fields: { wrapping: WrappingField },
      });

      expect(node.querySelectorAll('input')).toHaveLength(2);
      expect(node.querySelectorAll('input#root_foo')).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1);
    });

    it.each<[string, UiSchema]>([
      ['without', { val: { 'ui:field': 'FallbackField' } }],
      ['with', { val: { 'ui:field': 'FallbackField', anyOf: [{}, {}] } }],
    ])('renders one type selector %s a uiSchema per option under a ui:field naming FallbackField', (_, uiSchema) => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['string', 'number'], anyOf: [{ minLength: 2 }, { maximum: 5 }] } },
        },
        uiSchema,
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelectorAll('[id$="__internalTypeSelector"]')).toHaveLength(1);
    });

    it('applies a field named for a data path below the one already named', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:field': 'wrapping', val: { 'ui:field': 'wrapping' } },
        fields: { wrapping: WrappingField },
      });

      expect(node.querySelectorAll('.wrapper')).toHaveLength(2);
      expect(node.querySelectorAll('input#root_val')).toHaveLength(1);
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      ['ui:field', { type: 'string' }, { 'ui:field': 'Inner' }],
      ['$id', { $id: 'Inner', type: 'string' }, {}],
    ])("applies the root field a nested Form's %s names below an outer root field", (_, innerSchema, innerUiSchema) => {
      function InnerField() {
        return <div className='inner-field' />;
      }
      function EmbeddingField() {
        return (
          <Form schema={innerSchema} uiSchema={innerUiSchema} fields={{ Inner: InnerField }} validator={validator} />
        );
      }
      const { node } = createFormComponent({
        schema: { type: 'object' },
        uiSchema: { 'ui:field': 'Embedding' },
        fields: { Embedding: EmbeddingField },
      });

      expect(node.querySelectorAll('.inner-field')).toHaveLength(1);
      expect(node.querySelector('input')).not.toBeInTheDocument();
    });
  });

  describe('a $id names a field as ui:field does', () => {
    function MyField() {
      return <div className='my-field' />;
    }
    const fields = { MyField };
    const anyOfSchema: RJSFSchema = { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] };

    it('renders the field a $id names beside a non-select anyOf, where it rendered nothing of the field (#5391)', () => {
      const { node } = createFormComponent({
        schema: { $id: 'MyField', type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] },
        fields,
      });

      expect(node.querySelectorAll('.my-field')).toHaveLength(1);
      expect(node.querySelector('#root__anyof_select')).toBeInTheDocument();
      expect(node.querySelectorAll('input#root')).toHaveLength(1);
    });

    it.each<{ spelling: string; schema: RJSFSchema; uiSchema: UiSchema; issue: string }>([
      { spelling: 'a ui:field', schema: anyOfSchema, uiSchema: { 'ui:field': 'MyField' }, issue: '#5358' },
    ])('renders the field $spelling names once, beside the option selector ($issue)', ({ schema, uiSchema }) => {
      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('.my-field')).toHaveLength(1);
      expect(node.querySelector('#root__anyof_select')).toBeInTheDocument();
      expect(node.querySelectorAll('input#root')).toHaveLength(1);
    });

    it('renders the field a $id names in place of the options under ui:fieldReplacesAnyOrOneOf (#5391)', () => {
      const { node } = createFormComponent({
        schema: { $id: 'MyField', ...anyOfSchema },
        uiSchema: { 'ui:fieldReplacesAnyOrOneOf': true },
        fields,
      });

      expect(node.querySelectorAll('.my-field')).toHaveLength(1);
      expect(node.querySelector('#root__anyof_select')).not.toBeInTheDocument();
      expect(node.querySelector('input#root')).not.toBeInTheDocument();
    });

    it('renders the field a ui:field names in place of the options under ui:fieldReplacesAnyOrOneOf', () => {
      const { node } = createFormComponent({
        schema: anyOfSchema,
        uiSchema: { 'ui:field': 'MyField', 'ui:fieldReplacesAnyOrOneOf': true },
        fields,
      });

      expect(node.querySelectorAll('.my-field')).toHaveLength(1);
      expect(node.querySelector('#root__anyof_select')).not.toBeInTheDocument();
      expect(node.querySelector('input#root')).not.toBeInTheDocument();
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      ['its own ui:field', anyOfSchema, { 'ui:field': 'MyField', anyOf: [{ 'ui:field': 'OptionField' }, {}] }],
      [
        'its own $id',
        { type: 'string', anyOf: [{ $id: 'OptionField', minLength: 2 }, { maxLength: 5 }] },
        { 'ui:field': 'MyField' },
      ],
    ])('renders the default field for an option naming %s below a named field', (_, schema, uiSchema) => {
      function OptionField() {
        return <div className='option-field' />;
      }
      const { node } = createFormComponent({ schema, uiSchema, fields: { MyField, OptionField } });

      expect(node.querySelectorAll('.my-field')).toHaveLength(1);
      expect(node.querySelector('.option-field')).not.toBeInTheDocument();
      expect(node.querySelectorAll('input#root')).toHaveLength(1);
    });

    it("renders an option's own ui:field below a ui:field naming FallbackField, which yields to the options", () => {
      function OptionField() {
        return <div className='option-field' />;
      }
      const { node } = createFormComponent({
        schema: anyOfSchema,
        uiSchema: { 'ui:field': 'FallbackField', anyOf: [{ 'ui:field': 'OptionField' }, {}] },
        fields: { OptionField },
      });

      expect(node.querySelector('#root__anyof_select')).toBeInTheDocument();
      expect(node.querySelectorAll('.option-field')).toHaveLength(1);
    });
  });

  describe("an option's own ui:field below a named field", () => {
    const consoleWarnSuppression = setupConsoleWarnSuppression();
    function MyField() {
      return <div className='my-field' />;
    }
    function OptionField() {
      return <div className='option-field' />;
    }
    const fields = { MyField, OptionField };
    const anyOfSchema: RJSFSchema = { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] };

    it.each<[string, UiSchema]>([
      ['a registered field through ui:field', { 'ui:field': 'OptionField' }],
      ['no registered field', { 'ui:field': 'NotRegistered' }],
    ])('warns that an option entry naming %s is ignored', (_, optionUiSchema) => {
      const { node } = createFormComponent({
        schema: anyOfSchema,
        uiSchema: { 'ui:field': 'MyField', anyOf: [optionUiSchema, {}] },
        fields,
      });

      expect(node.querySelector('.option-field')).not.toBeInTheDocument();
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        'ui:field in uiSchema.anyOf[0] for "root" is ignored, since a field is already named for that path, so the ' +
          'option is rendered as though no ui:field were given.',
      );
    });

    it.each<[string, UiSchema]>([
      ['an option inheriting the uiSchema of its field', { 'ui:field': 'MyField' }],
      [
        'an option entry clearing its ui:field',
        // A JSON uiSchema clears a field with `null`, which the type doesn't admit
        { 'ui:field': 'MyField', anyOf: [{ 'ui:field': null } as unknown as UiSchema, {}] },
      ],
      [
        'an option entry naming SchemaField, which renders the option the same either way',
        { 'ui:field': 'MyField', anyOf: [{ 'ui:field': 'SchemaField' }, {}] },
      ],
    ])('does not warn for %s', (_, uiSchema) => {
      const { node } = createFormComponent({ schema: anyOfSchema, uiSchema, fields });

      expect(node.querySelector('#root__anyof_select')).toBeInTheDocument();
      expect(node.querySelectorAll('input#root')).toHaveLength(1);
      expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
    });

    it('applies an option entry below FallbackField without a warning', () => {
      const { node } = createFormComponent({
        schema: anyOfSchema,
        uiSchema: { 'ui:field': 'FallbackField', anyOf: [{ 'ui:field': 'OptionField' }, {}] },
        fields,
      });

      expect(node.querySelector('.option-field')).toBeInTheDocument();
      expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
    });

    it('does not warn for a null option, which renders no field', () => {
      const { node } = createFormComponent({
        schema: { anyOf: [{ type: 'null' }, { type: 'string' }] },
        uiSchema: { 'ui:field': 'MyField', anyOf: [{ 'ui:field': 'OptionField' }, {}] },
        initialFormData: null,
        fields,
      });

      expect(node.querySelector('#root__anyof_select')).toBeInTheDocument();
      expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
    });

    it("names the option's ui:definitions entry beside its own, which resolveUiSchema() merges under it", () => {
      const { node } = createFormComponent({
        schema: {
          $defs: { Foo: { minLength: 2 } },
          type: 'string',
          anyOf: [{ $ref: '#/$defs/Foo' }, { maxLength: 5 }],
        },
        uiSchema: { 'ui:field': 'MyField', 'ui:definitions': { '#/$defs/Foo': { 'ui:field': 'OptionField' } } },
        fields,
      });

      expect(node.querySelector('.option-field')).not.toBeInTheDocument();
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        'ui:field in uiSchema.anyOf[0] (or ui:definitions[\'#/$defs/Foo\']) for "root" is ignored, since a field is ' +
          'already named for that path, so the option is rendered as though no ui:field were given.',
      );
    });

    it('warns once for an option entry below a wrapper that renders SchemaField for its own data', () => {
      function Wrapper(props: FieldProps) {
        const { SchemaField: InnerSchemaField } = props.registry.fields;
        return (
          <div className='wrapper'>
            <InnerSchemaField {...props} />
          </div>
        );
      }
      const { node } = createFormComponent({
        schema: anyOfSchema,
        uiSchema: { 'ui:field': 'Wrapper', anyOf: [{ 'ui:field': 'OptionField' }, {}] },
        fields: { Wrapper, OptionField },
      });

      expect(node.querySelectorAll('.wrapper')).toHaveLength(1);
      expect(node.querySelector('.option-field')).not.toBeInTheDocument();
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        'ui:field in uiSchema.anyOf[0] for "root" is ignored, since a field is already named for that path, so the ' +
          'option is rendered as though no ui:field were given.',
      );
    });
  });

  describe('a field registered under a $id that is not a component', () => {
    const consoleWarnSuppression = setupConsoleWarnSuppression();

    it('warns that it is ignored, and renders the field for the schema type (#5439)', async () => {
      function MyField() {
        return <div id='custom' />;
      }
      const fieldsWithElement: Record<string, Field> = {};
      // A JavaScript caller can register a React element, which the registry's type rules out
      Reflect.set(fieldsWithElement, '#/thing', <MyField />);
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { thing: { $id: '#/thing', type: 'string' } } },
        fields: fieldsWithElement,
      });

      expect(node.querySelector('#custom')).not.toBeInTheDocument();
      await user.type(screen.getByRole('textbox'), 'x');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { thing: 'x' } }), 'root_thing');
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        "$id names a registered field ('#/thing') that is a React element rather than a component (pass MyField, not " +
          '<MyField />), so it is ignored and the fields of the schema carrying it are rendered as though no field ' +
          'were registered under it.',
      );
    });

    it('does not warn about a $id no field is registered under', () => {
      const { node } = createFormComponent({ schema: { $id: 'https://example.com/thing.json', type: 'string' } });

      expect(node.querySelector('input#root')).toBeInTheDocument();
      expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('the uiSchema a field written for the schema reads, named past an own ui:field that names nothing', () => {
    setupConsoleWarnSuppression();

    it.each<[string, RJSFSchema, UiSchema]>([['a $id', { $id: 'Own', type: 'string' }, { 'ui:field': 'Missing' }]])(
      'names no field where %s names it',
      (_, schema, uiSchema) => {
        const received = vi.fn<(uiSchema: FieldProps['uiSchema']) => void>();
        function Own(props: FieldProps) {
          received(props.uiSchema);
          return null;
        }
        createFormComponent({ schema, uiSchema, fields: { Own } });

        expect(received).toHaveBeenCalled();
        expect(received.mock.lastCall?.[0]).not.toHaveProperty(['ui:field']);
        expect(received.mock.lastCall?.[0]?.['ui:options']?.field).toBeUndefined();
      },
    );

    it('keeps the ui:field that names it', () => {
      const received = vi.fn<(uiSchema: FieldProps['uiSchema']) => void>();
      function Own(props: FieldProps) {
        received(props.uiSchema);
        return null;
      }
      createFormComponent({ schema: { type: 'string' }, uiSchema: { 'ui:field': 'Own' }, fields: { Own } });

      expect(received).toHaveBeenLastCalledWith(expect.objectContaining({ 'ui:field': 'Own' }));
    });
  });

  describe('option labels a field does not show', () => {
    const consoleWarnSuppression = setupConsoleWarnSuppression();
    const CustomWidget = () => <div id='custom' />;
    const OwnField = () => <div id='own-field' />;
    const WrappedBooleanField = (props: FieldProps) => <BooleanField {...props} />;
    const selectUi: UiSchema = { 'ui:widget': 'select' };
    const stringEnum = { type: 'string', enum: ['a', 'b'] } satisfies RJSFSchema;
    const numberEnum = { type: 'number', enum: [1, 2] } satisfies RJSFSchema;
    const booleanEnum = { type: 'boolean', enum: [true, false] } satisfies RJSFSchema;
    const titles = [{ title: 'First' }, { title: 'Second' }];
    const enumBesideTitles = { ...stringEnum, oneOf: titles } satisfies RJSFSchema;
    const stringConstants = { type: 'string', oneOf: [{ const: 'a' }, { const: 'b' }] } satisfies RJSFSchema;

    describe('titles of options behind an enum', () => {
      const hiddenTitles = expect.stringContaining('has an `enum` beside');

      it.each<[string, RJSFSchema, UiSchema]>([
        ['string anyOf', { ...stringEnum, anyOf: titles }, {}],
        ['number oneOf', { ...numberEnum, oneOf: titles }, {}],
        ['boolean oneOf', { ...booleanEnum, oneOf: titles }, selectUi],
        ['string oneOf as radios', enumBesideTitles, { 'ui:widget': 'radio' }],
        [
          'string oneOf titled through uiSchema.oneOf',
          { ...stringEnum, oneOf: [{ description: 'x' }, { description: 'y' }] },
          { oneOf: [{ 'ui:title': 'First' }, {}] },
        ],
        [
          'string oneOf of titled constants, which the enum is read before',
          {
            ...stringEnum,
            oneOf: [
              { const: 'a', title: 'First' },
              { const: 'b', title: 'Second' },
            ],
          },
          {},
        ],
        ['string oneOf, with ui:enumNames naming part of the enum', enumBesideTitles, { 'ui:enumNames': { a: 'A' } }],
      ])('should warn once for a %s', (_, schema, uiSchema) => {
        createFormComponent({ schema, uiSchema });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(hiddenTitles);
      });

      it('should only ask for constants when the options are not constants already', () => {
        createFormComponent({
          schema: {
            ...stringEnum,
            oneOf: [
              { const: 'a', title: 'First' },
              { const: 'b', title: 'Second' },
            ],
          },
        });
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenLastCalledWith(
          expect.stringMatching(/ui:enumNames, or drop the `enum`\.$/),
        );

        createFormComponent({ schema: enumBesideTitles });
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenLastCalledWith(
          expect.stringMatching(/ui:enumNames, or drop the `enum` and make every `oneOf` option a `const` schema\.$/),
        );
      });

      it('should name the field and show the enum', () => {
        const { node } = createFormComponent({ schema: enumBesideTitles });

        expect(Array.from(node.querySelectorAll('option')).map((option) => option.textContent)).toEqual(['', 'a', 'b']);
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('"root" has an `enum` beside `oneOf` options, so its options come from the `enum`'),
        );
      });

      it.each<[string, RJSFSchema, UiSchema]>([
        ['ui:enumNames names the enum', enumBesideTitles, { 'ui:enumNames': ['A', 'B'] }],
        [
          'ui:enumOrder drops the value ui:enumNames leaves unnamed',
          enumBesideTitles,
          { 'ui:enumNames': { a: 'A' }, 'ui:enumOrder': ['a'] },
        ],
        ['the oneOf has no titles', { ...stringEnum, oneOf: [{ description: 'x' }, { description: 'y' }] }, {}],
        ['the enum is empty', { type: 'string', enum: [], oneOf: titles }, {}],
        ['the widget is a custom one', enumBesideTitles, { 'ui:widget': CustomWidget }],
        ['the widget is hidden', enumBesideTitles, { 'ui:widget': 'hidden' }],
        ['the widget is a boolean checkbox', { ...booleanEnum, oneOf: titles }, { 'ui:widget': 'checkbox' }],
        ['a ui:field replaces the field', enumBesideTitles, { 'ui:field': OwnField }],
      ])('should not warn when %s', (_, schema, uiSchema) => {
        createFormComponent({ schema, uiSchema });

        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalledWith(hiddenTitles);
      });

      it('should not throw for a widget nothing registers, which a custom field for the type may render anyway', () => {
        const StringField = () => <div id='own-string-field' />;
        const { node } = createFormComponent({
          schema: enumBesideTitles,
          uiSchema: { 'ui:widget': 'notRegistered' },
          fields: { StringField },
        });

        expect(node.querySelector('#own-string-field')).toBeInTheDocument();
        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalledWith(hiddenTitles);
      });
    });

    describe('ui:enumNames beside constant options', () => {
      const ignoredNames = expect.stringContaining('sets ui:enumNames');
      const enumNames = ['A', 'B'];

      it.each<[string, RJSFSchema, UiSchema]>([
        ['string', stringConstants, {}],
        ['string anyOf', { type: 'string', anyOf: [{ const: 'a' }, { const: 'b' }] }, {}],
        ['number', { type: 'number', oneOf: [{ const: 1 }, { const: 2 }] }, {}],
        ['typeless', { oneOf: [{ const: 'a' }, { const: 'b' }] }, {}],
        ['boolean select', { type: 'boolean', oneOf: [{ const: true }, { const: false }] }, selectUi],
        ['string as radios', stringConstants, { 'ui:widget': 'radio' }],
        ['boolean defaulted to a checkbox', { type: 'boolean', oneOf: [{ const: true }, { const: false }] }, {}],
      ])('should warn once for a %s field', (_, schema, uiSchema) => {
        createFormComponent({ schema, uiSchema: { ...uiSchema, 'ui:enumNames': enumNames } });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('"root" sets ui:enumNames, which applies only to `enum` values'),
        );
      });

      it.each<[string, RJSFSchema, UiSchema]>([
        [
          'an enum beside the constants of a string, which it labels',
          { ...stringEnum, oneOf: [{ const: 'a' }, { const: 'b' }] },
          {},
        ],
        ['a custom widget', stringConstants, { 'ui:widget': CustomWidget }],
        ['a hidden field', stringConstants, { 'ui:widget': 'hidden' }],
        [
          'a checkbox the uiSchema asks for',
          { type: 'boolean', oneOf: [{ const: true }, { const: false }] },
          { 'ui:widget': 'checkbox' },
        ],
        ['a ui:field', stringConstants, { 'ui:field': OwnField }],
      ])('should not warn for %s', (_, schema, uiSchema) => {
        createFormComponent({ schema, uiSchema: { ...uiSchema, 'ui:enumNames': enumNames } });

        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalledWith(ignoredNames);
      });

      it.each<[string, UiSchema['ui:enumOrder'], string[]]>([
        ['reorders', ['b', 'a'], ['', 'b', 'a']],
        ['drops', ['a'], ['', 'a']],
      ])(
        'should not warn about a ui:enumOrder that %s the constant options, which it applies to',
        (_, order, labels) => {
          const { node } = createFormComponent({
            schema: stringConstants,
            uiSchema: { 'ui:enumOrder': order },
          });

          expect(Array.from(node.querySelectorAll('option')).map((option) => option.textContent)).toEqual(labels);
          expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
        },
      );

      it('should not tell a custom field wrapping BooleanField to title options that are titled', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'boolean',
            oneOf: [
              { const: true, title: 'Yes please' },
              { const: false, title: 'No thanks' },
            ],
          },
          uiSchema: { 'ui:field': 'WrappedBooleanField', 'ui:enumNames': ['Accept', 'Decline'] },
          fields: { WrappedBooleanField },
        });

        expect(node.querySelector('input[type=checkbox]')).toBeInTheDocument();
        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
      });
    });

    it.each<[string, RJSFSchema, unknown, string]>([
      [
        'array items',
        { type: 'array', items: enumBesideTitles },
        ['a', 'b', 'a'],
        '"root_[]" ([]) has an `enum` beside',
      ],
      [
        'additional properties',
        { type: 'object', additionalProperties: enumBesideTitles },
        { x: 'a', y: 'b' },
        '"root_{}" ({}) has an `enum` beside',
      ],
    ])('should warn once for the entry that renders many %s', (_, schema, initialFormData, message) => {
      createFormComponent({ schema, initialFormData });

      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(message));
    });

    describe('a field rendered as an anyOf option', () => {
      const otherOption = { type: 'number' } satisfies RJSFSchema;
      const enumOption = { type: 'object', anyOf: [enumBesideTitles, otherOption] } satisfies RJSFSchema;

      it.each<[string, UiSchema]>([
        ['no uiSchema of its own', {}],
        ['a uiSchema of its own', { anyOf: [{}, {}] }],
      ])('should name the option holding an enum beside titles, with %s', (_, uiSchema) => {
        createFormComponent({ schema: enumOption, uiSchema });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('the anyOf[0] option of "root" has an `enum` beside `oneOf` options'),
        );
      });

      it('should name the option holding a titled oneOf behind an anyOf', () => {
        createFormComponent({
          schema: { anyOf: [{ type: 'string', anyOf: [{ maxLength: 1 }], oneOf: titles }, otherOption] },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('the anyOf[0] option of "root" has both an `anyOf` and a `oneOf`'),
        );
      });

      it('should name the option holding a titled oneOf behind an anyOf beside an enum', () => {
        createFormComponent({
          schema: { anyOf: [{ ...stringEnum, anyOf: [{ maxLength: 1 }], oneOf: titles }, otherOption] },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringMatching(/^the anyOf\[0\] option of "root" has both .* label those values with ui:enumNames\.$/),
        );
      });

      it('should name both options when one is nested in the other', () => {
        createFormComponent({ schema: { anyOf: [{ anyOf: [enumBesideTitles, otherOption] }, otherOption] } });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('the anyOf[0] option of the anyOf[0] option of "root" has an `enum` beside'),
        );
      });

      it('should warn separately for two options with the same mistake', async () => {
        const { node } = createFormComponent({ schema: { anyOf: [enumBesideTitles, enumBesideTitles] } });

        await user.selectOptions(node.querySelector('select')!, 'Option 2');

        expect(consoleWarnSuppression.consoleSpy.mock.calls.map(([message]) => String(message).slice(0, 40))).toEqual([
          'the anyOf[0] option of "root" has an `en',
          'the anyOf[1] option of "root" has an `en',
        ]);
      });

      it('should warn once for an option an items entry renders many of', () => {
        createFormComponent({
          schema: { type: 'array', items: { anyOf: [enumBesideTitles, otherOption] } },
          initialFormData: ['a', 'b', 'a'],
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('the anyOf[0] option of "root_[]" ([]) has an `enum` beside'),
        );
      });

      it('should still name the uiSchema entry for ignored ui:enumNames', () => {
        createFormComponent({
          schema: { anyOf: [stringConstants, otherOption] },
          uiSchema: { anyOf: [{ 'ui:enumNames': ['A', 'B'] }, {}] },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('the uiSchema.anyOf[0] entry of "root" sets ui:enumNames'),
        );
      });
    });

    describe('a titled oneOf behind an anyOf', () => {
      const hiddenOneOf = expect.stringContaining(
        '"root" has both an `anyOf` and a `oneOf`, and the `anyOf` is read first',
      );
      const titledOneOf = [
        { const: true, title: 'On' },
        { const: false, title: 'Off' },
      ];

      it.each<[string, RJSFSchema, UiSchema]>([
        ['boolean with no enum', { type: 'boolean', anyOf: [{ type: 'boolean' }], oneOf: titledOneOf }, selectUi],
        ['string', { type: 'string', anyOf: [{ maxLength: 1 }, { maxLength: 2 }], oneOf: titles }, {}],
        ['number', { type: 'number', anyOf: [{ maximum: 1 }, { maximum: 2 }], oneOf: titles }, {}],
        [
          'object option selector',
          {
            type: 'object',
            anyOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'string' } } }],
            oneOf: [
              { title: 'C', properties: { c: { type: 'string' } } },
              { title: 'D', properties: { d: { type: 'string' } } },
            ],
          },
          {},
        ],
        [
          'oneOf titled through uiSchema.oneOf',
          { type: 'string', anyOf: [{ maxLength: 1 }], oneOf: [{ maxLength: 2 }] },
          { oneOf: [{ 'ui:title': 'Short' }] },
        ],
      ])('should warn once for a %s', (_, schema, uiSchema) => {
        createFormComponent({ schema, uiSchema });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(hiddenOneOf);
      });

      it.each<[string, RJSFSchema, UiSchema]>([
        ['string', { ...stringEnum, anyOf: [{ maxLength: 1 }], oneOf: titles }, {}],
        [
          'string beside a constant anyOf',
          { ...stringEnum, anyOf: [{ const: 'a' }, { const: 'b' }], oneOf: titles },
          {},
        ],
        ['number', { ...numberEnum, anyOf: [{ maximum: 1 }], oneOf: titles }, {}],
        ['boolean', { ...booleanEnum, anyOf: [{ not: { const: null } }], oneOf: titledOneOf }, selectUi],
      ])('should point a %s field whose enum supplies the options at ui:enumNames', (_, schema, uiSchema) => {
        createFormComponent({ schema, uiSchema });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('Its options come from its `enum`, so label those values with ui:enumNames.'),
        );
      });

      it('should still say to move the labels when a boolean shows its constant anyOf rather than its enum', () => {
        createFormComponent({
          schema: { ...booleanEnum, anyOf: [{ const: true }, { const: false }], oneOf: titledOneOf },
          uiSchema: selectUi,
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('Move the labels to the `anyOf`, or merge the two lists.'),
        );
      });

      it.each<[string, UiSchema]>([
        ['ui:enumNames names every value', { 'ui:enumNames': ['A', 'B'] }],
        [
          'ui:enumOrder drops the value ui:enumNames leaves unnamed',
          { 'ui:enumNames': { a: 'A' }, 'ui:enumOrder': ['a'] },
        ],
        ['a custom widget shows no option labels', { 'ui:widget': CustomWidget }],
      ])('should not warn about an enum beside an anyOf and a titled oneOf when %s', (_, uiSchema) => {
        createFormComponent({ schema: { ...stringEnum, anyOf: [{ maxLength: 1 }], oneOf: titles }, uiSchema });

        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
      });

      it.each<[string, RJSFSchema, UiSchema]>([
        ['the anyOf is empty, so the oneOf is rendered', { type: 'boolean', anyOf: [], oneOf: titledOneOf }, selectUi],
        ['the oneOf has no titles', { type: 'string', anyOf: [{ maxLength: 1 }], oneOf: [{ maxLength: 2 }] }, {}],
        ['there is only a oneOf', { type: 'string', oneOf: titles }, {}],
        ['a ui:field is set', { type: 'string', anyOf: [{ maxLength: 1 }], oneOf: titles }, { 'ui:field': OwnField }],
        [
          'the field is hidden',
          { type: 'string', anyOf: [{ maxLength: 1 }], oneOf: titles },
          { 'ui:widget': 'hidden' },
        ],
      ])('should not warn when %s', (_, schema, uiSchema) => {
        createFormComponent({ schema, uiSchema });

        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalledWith(hiddenOneOf);
      });
    });
  });

  describe('label support', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    it('should render label by default', () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelectorAll('label')).toHaveLength(1);
    });

    it('should render label if ui:globaLOptions label is set to true', () => {
      const uiSchema: UiSchema = {
        'ui:globalOptions': { label: true },
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).toHaveLength(1);
    });

    it('should not render label if ui:globalOptions label is set to false', () => {
      const uiSchema: UiSchema = {
        'ui:globalOptions': { label: false },
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).toHaveLength(0);
    });

    it('should render label if ui:options label is set to true', () => {
      const uiSchema: UiSchema = {
        foo: { 'ui:options': { label: true } },
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).toHaveLength(1);
    });

    it('should not render label if ui:options label is set to false', () => {
      const uiSchema: UiSchema = {
        foo: { 'ui:options': { label: false } },
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).toHaveLength(0);
    });

    it('should render label even when type object is missing', () => {
      const schema: RJSFSchema = {
        title: 'test',
        properties: {
          foo: { type: 'string' },
        },
      };
      const { node } = createFormComponent({ schema });
      expect(node.querySelectorAll('label')).toHaveLength(1);
    });
  });

  describe('deprecatedHandling', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string', deprecated: true },
        bar: { type: 'string' },
      },
    };

    it('should append (deprecated) to label by default, and hand the widget the same label', () => {
      const widgetLabels = new Map<string, string>();
      function TextWidget(props: WidgetProps) {
        widgetLabels.set(props.id, props.label);
        return <CoreTextWidget {...props} />;
      }
      const { node } = createFormComponent({ schema, widgets: { TextWidget } });
      const labels = node.querySelectorAll('label');
      expect(labels[0]).toHaveTextContent('foo (deprecated)');
      expect(labels[1]).toHaveTextContent('bar');
      expect(Object.fromEntries(widgetLabels)).toEqual({ root_foo: 'foo (deprecated)', root_bar: 'bar' });
    });

    it('should not append (deprecated) if deprecatedHandling is not label', () => {
      const uiSchema: UiSchema = {
        'ui:globalOptions': { deprecatedHandling: 'disable' },
      };
      const { node } = createFormComponent({ schema, uiSchema });
      const labels = node.querySelectorAll('label');
      expect(labels[0]).toHaveTextContent('foo');
    });

    it('should disable field if deprecatedHandling is disable', () => {
      const uiSchema: UiSchema = {
        'ui:globalOptions': { deprecatedHandling: 'disable' },
      };
      const { node } = createFormComponent({ schema, uiSchema });
      const inputs = node.querySelectorAll('input');
      expect(inputs[0]).toBeDisabled();
      expect(inputs[1]).not.toBeDisabled();
    });

    it('should hide field if deprecatedHandling is hide', () => {
      const uiSchema: UiSchema = {
        'ui:globalOptions': { deprecatedHandling: 'hide' },
      };
      const { node } = createFormComponent({ schema, uiSchema });
      const hiddenFields = node.querySelectorAll('[hidden]');
      expect(hiddenFields.length).toBe(1);
    });

    // A field with no title and no name has no label to decorate, so neither the template nor a widget naming its
    // group by the label it is handed is given one reading only the marker
    it('should render no label and hand the widget an empty one for an untitled, unnamed deprecated field', () => {
      const recordWidgetLabel = vi.fn<(label: string) => void>();
      function RadioWidget(props: WidgetProps) {
        recordWidgetLabel(props.label);
        return <CoreRadioWidget {...props} />;
      }
      const { node } = createFormComponent({
        schema: { type: 'string', enum: ['a', 'b'], deprecated: true },
        uiSchema: { 'ui:widget': 'radio' },
        widgets: { RadioWidget },
      });
      expect(node.querySelector('.rjsf-field-label')).not.toBeInTheDocument();
      expect(node).not.toHaveTextContent('(deprecated)');
      expect(recordWidgetLabel).toHaveBeenLastCalledWith('');
    });
  });

  describe('description support', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string', description: 'A Foo field' },
        bar: { type: 'string' },
      },
    };

    it('should render description if available from the schema', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('#root_foo__description')).toHaveLength(1);
    });

    it('should render description if available from a referenced schema', () => {
      // Overriding.
      const schemaWithReference: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/foo' },
          bar: { type: 'string' },
        },
        definitions: {
          foo: {
            type: 'string',
            description: 'A Foo field',
          },
        },
      };
      const { node } = createFormComponent({
        schema: schemaWithReference,
      });

      const matches = node.querySelectorAll('#root_foo__description');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('A Foo field');
    });

    it('should not render description if not available from schema', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('#root_bar__description')).toHaveLength(0);
    });

    it('should render a customized description field', () => {
      const CustomDescriptionField = ({ description }: DescriptionFieldProps) => <div id='custom'>{description}</div>;

      const { node } = createFormComponent({
        schema,
        templates: {
          DescriptionFieldTemplate: CustomDescriptionField,
        },
      });

      expect(node.querySelector('#custom')).toHaveTextContent('A Foo field');
    });
  });

  describe('errors', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const uiSchema: UiSchema = {
      'ui:field': (props) => {
        const { uiSchema, ...fieldProps } = props;
        return <SchemaField {...fieldProps} />;
      },
    };

    function customValidate(_: unknown, errors: FormValidation<{ foo?: string }>) {
      errors.addError('container');
      errors.foo?.addError('test');
      return errors;
    }

    it('should render its own errors', async () => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
      });

      await submitForm(node, user);

      const matches = node.querySelectorAll(':scope > .rjsf-field > div > .rjsf-error-detail .rjsf-error');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('container');
    });

    it('should pass errors to child component', async () => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
      });

      await submitForm(node, user);

      const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-error');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('test');
    });

    it('should ignore errors for top level anyOf/oneOf and show only one in child schema', async () => {
      const testSchema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            anyOf: [
              {
                type: 'boolean',
              },
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            ],
          },
        },
      };
      const { node } = createFormComponent({
        schema: testSchema,
        uiSchema,
        customValidate,
      });

      await submitForm(node, user);

      const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-error');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('test');
    });

    it('should show errors for top level anyOf/oneOf when schema is select control', async () => {
      const testSchema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            title: 'Media Type',
            oneOf: [
              {
                const: 'tv',
                title: 'Television',
              },
              {
                const: 'pc',
                title: 'Computer',
              },
              {
                const: 'console',
                title: 'Console',
              },
            ],
          },
        },
      };
      const { node } = createFormComponent({
        schema: testSchema,
        uiSchema,
        customValidate,
      });

      await submitForm(node, user);

      const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-error');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('test');
    });

    it('should pass errors to custom FieldErrorTemplate', async () => {
      const customFieldError = (props: FieldErrorProps) => <div className='custom-field-error'>{props.errors}</div>;
      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
        templates: { FieldErrorTemplate: customFieldError },
      });

      await submitForm(node, user);

      const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-error');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .custom-field-error');
      expect(customMatches[0]).toHaveTextContent('test');
    });

    it('should pass errors to custom FieldErrorTemplate, via uiSchema', async () => {
      const customFieldError = (props: FieldErrorProps) => <div className='custom-field-error'>{props.errors}</div>;
      const uiSchema: UiSchema = {
        'ui:field': (props) => {
          const { uiSchema, ...fieldProps } = props;
          return <SchemaField {...fieldProps} uiSchema={{ foo: { 'ui:FieldErrorTemplate': customFieldError } }} />;
        },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
      });

      await submitForm(node, user);

      const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-error');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .custom-field-error');
      expect(customMatches[0]).toHaveTextContent('test');
    });

    describe('Custom error rendering', () => {
      // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
      const customStringWidget = (props: WidgetProps) => <div className='custom-text-widget'>{props.rawErrors}</div>;

      it('should pass rawErrors down to custom widgets', async () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          customValidate,
          templates: { BaseInputTemplate: customStringWidget },
        });

        await submitForm(node, user);

        const matches = node.querySelectorAll('.custom-text-widget');
        expect(matches).toHaveLength(1);
        expect(matches[0]).toHaveTextContent('test');
      });
    });

    describe('hideError flag and errors', () => {
      const hideUiSchema = {
        'ui:hideError': true,
        ...uiSchema,
      };

      it('should not render its own default errors', async () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        await submitForm(node, user);

        const matches = node.querySelectorAll(':scope > .rjsf-field > div > .rjsf-error-detail .rjsf-error');
        expect(matches).toHaveLength(0);
      });

      it('should not show default errors in child component', async () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        await submitForm(node, user);

        const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-error');
        expect(matches).toHaveLength(0);
      });

      describe('Custom error rendering', () => {
        // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
        const customStringWidget = (props: WidgetProps) => <div className='custom-text-widget'>{props.rawErrors}</div>;

        it('should pass rawErrors down to custom widgets and render them', async () => {
          const { node } = createFormComponent({
            schema,
            uiSchema: hideUiSchema,
            customValidate,
            templates: { BaseInputTemplate: customStringWidget },
          });

          await submitForm(node, user);

          const matches = node.querySelectorAll('.custom-text-widget');
          expect(matches).toHaveLength(1);
          expect(matches[0]).toHaveTextContent('test');
        });

        it('should withhold rawErrors from a custom FieldTemplate while leaving them in its errorSchema', async () => {
          // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
          const customFieldTemplate = ({ children, rawErrors, errorSchema }: FieldTemplateProps) => (
            <div>
              {children}
              <div className='raw-errors'>{rawErrors}</div>
              <div className='schema-errors'>{errorSchema?.__errors}</div>
            </div>
          );
          const { node } = createFormComponent({
            schema,
            uiSchema: hideUiSchema,
            customValidate,
            templates: { FieldTemplate: customFieldTemplate },
          });

          await submitForm(node, user);

          // A template styling itself from `rawErrors` alone stays out of the error state under `ui:hideError`
          const rawErrorNodes = [...node.querySelectorAll('.raw-errors')];
          expect(rawErrorNodes.length).toBeGreaterThan(0);
          rawErrorNodes.forEach((rawErrorNode) => expect(rawErrorNode).toBeEmptyDOMElement());
          // while one rendering the errors itself can still reach them
          const schemaErrors = [...node.querySelectorAll('.schema-errors')].map(({ textContent }) => textContent);
          expect(schemaErrors).toContain('test');
        });
      });
    });

    describe('hideError flag false for child should show errors', () => {
      const hideUiSchema = {
        'ui:hideError': true,
        'ui:field': (props: FieldProps) => {
          const { uiSchema, ...fieldProps } = props;
          // Pass the children schema in after removing the global one
          return <SchemaField {...fieldProps} uiSchema={{ 'ui:hideError': false }} />;
        },
      };

      it('should not render its own default errors', async () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        await submitForm(node, user);

        const matches = node.querySelectorAll(':scope > .rjsf-field > div > .rjsf-error-detail .rjsf-error');
        expect(matches).toHaveLength(0);
      });

      it('should show errors on child component', async () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        await submitForm(node, user);

        // The framed root shows its own error as its `ui:hideError` leaves it, drawing it after its child's
        const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-error');
        expect([...matches].map(({ textContent }) => textContent)).toEqual(['test', 'container']);
      });

      it('reads a child ui:hideError of null as false rather than inheriting the parent flag', async () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: {
            ...hideUiSchema,
            'ui:field': (props: FieldProps) => {
              const { uiSchema, ...fieldProps } = props;
              const uiSchemaFromJson: GenericObjectType = { 'ui:hideError': null };
              return <SchemaField {...fieldProps} uiSchema={uiSchemaFromJson} />;
            },
          },
          customValidate,
        });

        await submitForm(node, user);

        // The framed root shows its own error as its `ui:hideError` leaves it, drawing it after its child's
        const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-error');
        expect([...matches].map(({ textContent }) => textContent)).toEqual(['test', 'container']);
      });
    });

    describe("resolved as the field's own, then its parent's", () => {
      const nestedSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      };
      const extraErrors = { foo: { __errors: ['foo is wrong'] }, bar: { __errors: ['bar is wrong'] } } as ErrorSchema;

      it("hides a child's errors by its parent's ui:hideError", () => {
        const { node } = createFormComponent({
          schema: nestedSchema,
          uiSchema: { 'ui:hideError': true },
          extraErrors,
        });

        expect(node.querySelector(`#${errorId('root_foo')}`)).not.toBeInTheDocument();
      });

      it("shows a child's errors by its own ui:hideError over its parent's", () => {
        const { node } = createFormComponent({
          schema: nestedSchema,
          uiSchema: { 'ui:hideError': true, bar: { 'ui:hideError': false } },
          extraErrors,
        });

        expect(node.querySelector(`#${errorId('root_foo')}`)).not.toBeInTheDocument();
        expect(node.querySelector(`#${errorId('root_bar')}`)).toHaveTextContent('bar is wrong');
      });

      it('ignores a hideError in ui:globalOptions, which RJSF reads only per field', () => {
        // Untyped, as a JSON uiSchema is, since `hideError` is an option RJSF reads only per field
        const globalOptions: GenericObjectType = { hideError: true };
        const { node } = createFormComponent({
          schema: nestedSchema,
          uiSchema: { 'ui:globalOptions': globalOptions },
          extraErrors,
        });

        expect(node.querySelector(`#${errorId('root_foo')}`)).toHaveTextContent('foo is wrong');
      });
    });
  });
  describe('help', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const helpText = 'help me!';
    const uiSchema: UiSchema = {
      foo: { 'ui:help': helpText },
    };

    it('should render its own help', async () => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
      });

      await submitForm(node, user);

      const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-field-help');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent(helpText);
    });

    it('should pass help to custom FieldHelpTemplate', async () => {
      const customFieldHelp = (props: FieldHelpProps) => <div className='custom-field-help'>{props.help}</div>;
      const { node } = createFormComponent({
        schema,
        uiSchema,
        templates: { FieldHelpTemplate: customFieldHelp },
      });

      await submitForm(node, user);

      const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-field-help');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .custom-field-help');
      expect(customMatches[0]).toHaveTextContent(helpText);
    });

    it('should pass errors to custom FieldErrorTemplate, via uiSchema', async () => {
      const customFieldHelp = (props: FieldHelpProps) => <div className='custom-field-help'>{props.help}</div>;
      const uiSchema: UiSchema = {
        foo: { 'ui:help': helpText, 'ui:FieldHelpTemplate': customFieldHelp },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema,
      });

      await submitForm(node, user);

      const matches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .rjsf-field-help');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll(':scope .rjsf-field .rjsf-field .custom-field-help');
      expect(customMatches[0]).toHaveTextContent(helpText);
    });
  });

  describe('markdown', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const descText = 'Make things **bold** or *italic*. Embed snippets of `code`.';

    it('should render description with markdown when a MarkdownTemplate is registered', () => {
      const { node } = createFormComponent({
        schema,
        templates: { MarkdownTemplate },
        uiSchema: {
          foo: {
            'ui:description': descText,
            'ui:enableMarkdownInDescription': true,
          },
        },
      });

      const field = node.querySelector(':scope .rjsf-field .rjsf-field .rjsf-field-description')!;

      expect(field).toContainHTML('<strong>bold</strong>');
      expect(field).toContainHTML('<em>italic</em>');
      expect(field).toContainHTML('<code>code</code>');
    });

    it('should render description as plain text without a MarkdownTemplate', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          foo: {
            'ui:description': descText,
            'ui:enableMarkdownInDescription': true,
          },
        },
      });

      const field = node.querySelector(':scope .rjsf-field .rjsf-field .rjsf-field-description')!;

      expect(field).not.toContainHTML('<strong>bold</strong>');
      expect(field).not.toContainHTML('<em>italic</em>');
      expect(field).not.toContainHTML('<code>code</code>');
      expect(field).toHaveTextContent(descText);
    });
  });

  describe('readOnly', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'boolean', readOnly: true },
      },
    };

    it('should be readonly if prescribed by the schema', () => {
      const { node } = createFormComponent({
        schema,
      });

      const { disabled } = node.querySelector('input')!;

      expect(disabled).toBe(true);
    });
  });

  describe('cyclic $ref', () => {
    const schema: RJSFSchema = {
      title: 'A registration form',
      description: 'A simple form example.',
      type: 'object',
      properties: {
        child: {
          $ref: '#',
        },
      },
    };

    it('renders a cycle indicator for a recursion reached through a nested property', () => {
      // A recursion the cycle flag alone stops: the flag is the walk's only change to the subtree holding it
      const node: RJSFSchema = {
        type: 'object',
        properties: { wrap: { type: 'object', properties: { child: { $ref: '#/definitions/node' } } } },
      };
      const { node: form } = createFormComponent({ schema: { definitions: { node }, $ref: '#/definitions/node' } });

      expect(form.querySelectorAll('button[id$="__expand"]')).toHaveLength(1);
      expect(form.querySelector('#root_wrap_child__expand')).toHaveTextContent('Expand Cycle');
    });

    it('renders a cycle indicator for a recursion reached through a then branch', async () => {
      // A recursion the defaults reach through the branch's expanded `$ref` rather than through a `$ref` of their own
      const node: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        if: {},
        then: { properties: { child: { $ref: '#/definitions/node' } } },
      };
      const { node: form } = createFormComponent({ schema: { definitions: { node }, $ref: '#/definitions/node' } });

      expect(form.querySelectorAll('button[id$="__expand"]')).toHaveLength(1);
      expect(form.querySelector('#root_child__expand')).toHaveTextContent('Expand Cycle');

      // The expanded field is handed the definition resolved in place, with the branch still to resolve
      await user.click(screen.getByRole('button', { name: 'Expand Cycle' }));

      expect(form.querySelectorAll('button[id$="__expand"]')).toHaveLength(1);
      expect(form.querySelector('#root_child_child__expand')).toHaveTextContent('Expand Cycle');
    });

    it.each<[string, (b: RJSFSchema) => RJSFSchema, string]>([
      ['in a property', (b) => ({ type: 'object', properties: { b } }), '#root_b_friend_name'],
      ['at the root', (b) => b, '#root_friend_name'],
    ])('renders a second use of a definition in a branch beside the $ref to it, %s', (_, withB, nameId) => {
      // The `then` stands beside the `$ref` rather than in the definition, so its `$ref` to the definition is no way back
      const Q: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const b: RJSFSchema = {
        $ref: '#/definitions/Q',
        if: {},
        then: { properties: { friend: { $ref: '#/definitions/Q' } } },
      };
      const { node: form } = createFormComponent({ schema: { definitions: { Q }, ...withB(b) } });

      expect(form.querySelector(nameId)).toBeInTheDocument();
      expect(form.querySelectorAll('button[id$="__expand"]')).toHaveLength(0);
    });

    it.each<[string, Record<string, Field> | undefined]>([
      ['the default SchemaField', undefined],
      [
        'a custom SchemaField that renders a copy of its schema',
        {
          // The copy carries a keyword of its own, so it is planned again from its keywords, within the ref path of the
          // field it copies
          SchemaField: function DescribedSchemaField(props: FieldProps) {
            return <SchemaField {...props} schema={{ ...props.schema, description: 'wrapped' }} />;
          },
        },
      ],
    ])('stops a mutual recursion rendered through %s, one period per click', async (_, fields) => {
      const A: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' }, b: { $ref: '#/definitions/B' } },
      };
      const B: RJSFSchema = {
        type: 'object',
        properties: { b: { type: 'string' }, a: { $ref: '#/definitions/A' } },
      };
      const { node } = createFormComponent({ schema: { definitions: { A, B }, $ref: '#/definitions/A' }, fields });
      const ids = () => [...node.querySelectorAll('input[id], button[id$="__expand"]')].map(({ id }) => id);

      expect(ids()).toEqual(['root_a', 'root_b_b', 'root_b_a__expand']);

      await user.click(screen.getByRole('button', { name: 'Expand Cycle' }));

      expect(ids()).toEqual(['root_a', 'root_b_b', 'root_b_a_a', 'root_b_a_b_b', 'root_b_a_b_a__expand']);
    });

    it('clicking the expand button shows the next level of the cycle', async () => {
      const { node } = createFormComponent({ schema });

      // child is fully rendered (first $ref occurrence), but child.child hits the cycle
      const expandButton = elementOf(node, '#root_child_child__expand', HTMLButtonElement);
      expect(expandButton).not.toBeNull();
      expect(expandButton).toHaveTextContent('Expand Cycle');

      await user.click(expandButton);

      // One level per click, as for a recursion through a `then` or an `allOf`
      expect(node.querySelector('#root_child_child__expand')).toBeNull();
      expect(node.querySelector('#root_child_child_child__expand')).toHaveTextContent('Expand Cycle');
    });

    describe('a ui:CyclicSchemaExpandTemplate override', () => {
      const consoleWarnSuppression = setupConsoleWarnSuppression();

      it('renders a custom one for the cyclic field, without warning', () => {
        function CustomExpand(props: CyclicSchemaExpandProps) {
          return (
            <button type='button' id={`${props.id}-button`} onClick={() => props.onExpand(props.id)}>
              Grow
            </button>
          );
        }
        const { node } = createFormComponent({
          schema,
          uiSchema: { child: { child: { 'ui:CyclicSchemaExpandTemplate': CustomExpand } } },
        });

        expect(node.querySelector('#root_child_child-button')).toHaveTextContent('Grow');
        expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
      });

      it('warns once for an invalid one, naming the cyclic field, and renders the default', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: {
            child: { child: { 'ui:CyclicSchemaExpandTemplate': <div /> } },
          },
        });

        expect(node.querySelector('#root_child_child__expand')).toHaveTextContent('Expand Cycle');
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'CyclicSchemaExpandTemplate (ui:CyclicSchemaExpandTemplate or ui:options) for "root_child_child" ' +
            '(child.child) is a React element rather than a component (pass MyTemplate, not <MyTemplate />), so ' +
            'it is ignored.',
        );
      });
    });

    describe('template-override warnings from SchemaField', () => {
      const consoleWarnSuppression = setupConsoleWarnSuppression();
      const typo = 'Typo' as unknown as UiSchema['ui:FieldTemplate'];

      it('warns once for an invalid ui:FieldTemplate, naming the field, and renders the default', () => {
        createFormComponent({
          schema: { type: 'object', properties: { val: { type: 'string' } } },
          uiSchema: { val: { 'ui:FieldTemplate': <div /> } },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "root_val" (val) is a React element rather than a ' +
            'component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
        );
      });

      it('warns once for an invalid override in an items entry, not once per item', () => {
        createFormComponent({
          schema: { type: 'object', properties: { arr: { type: 'array', items: { type: 'string' } } } },
          uiSchema: { arr: { items: { 'ui:FieldTemplate': <div /> } } },
          initialFormData: { arr: ['one', 'two', 'three'] },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "root_arr_[]" (arr[]) is a React element rather than ' +
            'a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
        );
      });

      it('warns for an object entry and its shown anyOf option entry apart, naming the option entry', () => {
        createFormComponent({
          schema: {
            type: 'object',
            properties: { a: { type: 'string' } },
            anyOf: [
              { type: 'object', properties: { b: { type: 'string' } } },
              { type: 'object', properties: { c: { type: 'string' } } },
            ],
          },
          uiSchema: {
            'ui:FieldTemplate': 'Typo' as unknown as UiSchema['ui:FieldTemplate'],
            anyOf: [{ 'ui:FieldTemplate': 'Typo' as unknown as UiSchema['ui:FieldTemplate'] }],
          },
          initialFormData: { b: 'x' },
        });

        // The two entries render at the one fieldPath, so their warnings would read alike - and `logOnce()` would
        // drop the option entry's - if the option's entry were not named
        expect(consoleWarnSuppression.consoleSpy.mock.calls).toEqual([
          [
            'FieldTemplate (ui:FieldTemplate or ui:options) for "root" names no registered template (\'Typo\'), so it is ignored.',
          ],
          [
            'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0] entry of "root" names no ' +
              "registered template ('Typo'), so it is ignored.",
          ],
        ]);
      });

      it('names the option entry when only the option entry is invalid', () => {
        createFormComponent({
          schema: {
            type: 'object',
            properties: { a: { type: 'string' } },
            anyOf: [
              { type: 'object', properties: { b: { type: 'string' } } },
              { type: 'object', properties: { c: { type: 'string' } } },
            ],
          },
          uiSchema: {
            anyOf: [{ 'ui:FieldTemplate': 'Typo' as unknown as UiSchema['ui:FieldTemplate'] }],
          },
          initialFormData: { b: 'x' },
        });

        // The option's own SchemaField names the option entry, so the one warning points at the entry holding the
        // mistake and none blames the field's own entry, which has no override
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0] entry of "root" names no ' +
            "registered template ('Typo'), so it is ignored.",
        );
      });

      it('names each entry apart when the object entry and the option entry carry different invalid overrides', () => {
        createFormComponent({
          schema: {
            type: 'object',
            properties: { a: { type: 'string' } },
            anyOf: [
              { type: 'object', properties: { b: { type: 'string' } } },
              { type: 'object', properties: { c: { type: 'string' } } },
            ],
          },
          uiSchema: {
            'ui:FieldTemplate': 'Parent' as unknown as UiSchema['ui:FieldTemplate'],
            anyOf: [{ 'ui:FieldTemplate': 'Option' as unknown as UiSchema['ui:FieldTemplate'] }],
          },
          initialFormData: { b: 'x' },
        });

        expect(consoleWarnSuppression.consoleSpy.mock.calls).toEqual([
          [
            'FieldTemplate (ui:FieldTemplate or ui:options) for "root" names no registered template (\'Parent\'), so it is ignored.',
          ],
          [
            'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0] entry of "root" names no ' +
              "registered template ('Option'), so it is ignored.",
          ],
        ]);
      });

      it('names an option entry nested in another option entry by both', () => {
        createFormComponent({
          schema: { anyOf: [{ anyOf: [{ type: 'string' }, { type: 'number' }] }, { type: 'boolean' }] },
          uiSchema: {
            anyOf: [
              {
                'ui:FieldTemplate': 'Outer' as unknown as UiSchema['ui:FieldTemplate'],
                anyOf: [{ 'ui:FieldTemplate': 'Inner' as unknown as UiSchema['ui:FieldTemplate'] }],
              },
            ],
          },
        });

        expect(consoleWarnSuppression.consoleSpy.mock.calls).toEqual([
          [
            'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0] entry of "root" names no ' +
              "registered template ('Outer'), so it is ignored.",
          ],
          [
            'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0] entry of the uiSchema.anyOf[0] ' +
              'entry of "root" names no registered template (\'Inner\'), so it is ignored.',
          ],
        ]);
      });

      it('names a field below an option entry after that entry, so the same mistake in each option warns apart', async () => {
        createFormComponent({
          schema: {
            anyOf: [
              { title: 'A', type: 'object', properties: { b: { type: 'string' } } },
              { title: 'B', type: 'object', properties: { b: { type: 'number' } } },
            ],
          },
          uiSchema: { anyOf: [{ b: { 'ui:FieldTemplate': typo } }, { b: { 'ui:FieldTemplate': typo } }] },
        });

        await user.selectOptions(screen.getByRole('combobox'), 'B');

        // Both `b`s render at the one path, so named by it alone the second option's warning would read as the first's
        expect(consoleWarnSuppression.consoleSpy.mock.calls).toEqual([
          [
            'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0].b entry of "root" names no ' +
              "registered template ('Typo'), so it is ignored.",
          ],
          [
            'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[1].b entry of "root" names no ' +
              "registered template ('Typo'), so it is ignored.",
          ],
        ]);
      });

      it('names a field below an option with no entry of its own by the field entry it renders from', () => {
        createFormComponent({
          schema: { anyOf: [{ type: 'object', properties: { b: { type: 'string' } } }] },
          uiSchema: { b: { 'ui:FieldTemplate': typo } },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "root_b" (b) names no registered template (\'Typo\'), ' +
            'so it is ignored.',
        );
      });

      it('warns once for an items entry below an option entry, writing the index within the option as []', () => {
        createFormComponent({
          schema: {
            anyOf: [
              {
                type: 'object',
                properties: {
                  tasks: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' } } } },
                },
              },
            ],
          },
          uiSchema: {
            anyOf: [
              {
                tasks: { items: { title: { 'ui:FieldTemplate': typo } } },
              },
            ],
          },
          initialFormData: { tasks: [{ title: 'x' }, { title: 'y' }] },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0].tasks[].title entry of "root" ' +
            "names no registered template ('Typo'), so it is ignored.",
        );
      });

      it("names an extra key an option takes from its field by the field's additionalProperties entry", () => {
        const withOwnOptions = (title: string): RJSFSchema => ({
          title,
          type: 'object',
          anyOf: [{ properties: { p: { type: 'string' } } }, { properties: { q: { type: 'string' } } }],
        });
        createFormComponent({
          schema: {
            type: 'object',
            properties: { a: { type: 'string' } },
            additionalProperties: { type: 'string' },
            anyOf: [withOwnOptions('A'), withOwnOptions('B')],
          },
          uiSchema: {
            additionalProperties: { 'ui:FieldTemplate': typo },
            anyOf: [{ 'ui:title': 'A' }, { 'ui:title': 'B' }],
          },
          initialFormData: { extra: 'x' },
        });

        // The option's entry has no `additionalProperties`, so the extra key renders from the field's
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "root_{}" ({}) names no registered template (\'Typo\'), ' +
            'so it is ignored.',
        );
      });

      it("names an extra key an option below an option takes from the field by the field's additionalProperties entry", () => {
        const withOwnOptions = (title: string): RJSFSchema => ({
          title,
          type: 'object',
          anyOf: [{ properties: { p: { type: 'string' } } }, { properties: { q: { type: 'string' } } }],
        });
        const withNestedOptions = (title: string): RJSFSchema => ({
          title,
          type: 'object',
          anyOf: [withOwnOptions(`${title}1`), withOwnOptions(`${title}2`)],
        });
        createFormComponent({
          schema: {
            type: 'object',
            properties: { a: { type: 'string' } },
            additionalProperties: { type: 'string' },
            anyOf: [withNestedOptions('A'), withNestedOptions('B')],
          },
          uiSchema: {
            additionalProperties: { 'ui:FieldTemplate': typo },
            anyOf: [{ 'ui:title': 'A', anyOf: [{ 'ui:title': 'A1' }, { 'ui:title': 'A2' }] }, { 'ui:title': 'B' }],
          },
          initialFormData: { extra: 'x' },
        });

        // Neither option's entry has `additionalProperties`, so the extra key renders from the field's
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "root_{}" ({}) names no registered template (\'Typo\'), ' +
            'so it is ignored.',
        );
      });

      describe("an option whose $ref has a ui:definitions entry, which is merged under the option's own", () => {
        const schema: RJSFSchema = {
          $defs: { Foo: { type: 'object', properties: { b: { type: 'string' } } } },
          anyOf: [{ $ref: '#/$defs/Foo' }, { type: 'number' }],
        };

        it('names both places for a mistake in the option entry', () => {
          createFormComponent({
            schema,
            uiSchema: { 'ui:definitions': { '#/$defs/Foo': { 'ui:FieldTemplate': typo } } },
          });

          // No `uiSchema.anyOf` is written, but `resolveUiSchema()` fills `uiSchema.anyOf[0]` in from the definition
          expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
            'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0] entry of "root" (or ' +
              "ui:definitions['#/$defs/Foo']) names no registered template ('Typo'), so it is ignored.",
          );
        });

        it('names both places for a mistake below the option entry, beside keys the uiSchema gives it', () => {
          createFormComponent({
            schema,
            uiSchema: {
              'ui:definitions': { '#/$defs/Foo': { b: { 'ui:FieldTemplate': typo } } },
              anyOf: [{ 'ui:title': 'Foo' }],
            },
          });

          expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
            'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0].b entry of "root" (or ' +
              "ui:definitions['#/$defs/Foo'].b) names no registered template ('Typo'), so it is ignored.",
          );
        });
      });

      it('names an option entry below another option entry after both', () => {
        createFormComponent({
          schema: {
            anyOf: [{ type: 'object', properties: { b: { oneOf: [{ type: 'string' }, { type: 'number' }] } } }],
          },
          uiSchema: {
            anyOf: [{ b: { oneOf: [{ 'ui:FieldTemplate': typo }] } }],
          },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.oneOf[0] entry of the uiSchema.anyOf[0].b ' +
            'entry of "root" names no registered template (\'Typo\'), so it is ignored.',
        );
      });

      it('names a field of a form nested below an option entry by the nested form alone', () => {
        const NestedForm = () => (
          <Form
            schema={{ type: 'object', properties: { c: { type: 'string' } } }}
            uiSchema={{ c: { 'ui:FieldTemplate': typo } }}
            validator={validator}
            idPrefix='inner'
          />
        );
        createFormComponent({
          schema: { anyOf: [{ type: 'object', properties: { b: { type: 'string' } } }] },
          uiSchema: { anyOf: [{ b: { 'ui:field': NestedForm } }] },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "inner_c" (c) names no registered template (\'Typo\'), ' +
            'so it is ignored.',
        );
      });

      it('warns once for an invalid override in an additionalProperties entry, not once per extra key', () => {
        createFormComponent({
          schema: { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: { type: 'string' } },
          uiSchema: {
            additionalProperties: { 'ui:FieldTemplate': (<div />) as unknown as UiSchema['ui:FieldTemplate'] },
          },
          initialFormData: { k1: 'x', k2: 'y', k3: 'z' },
        });

        // Every extra key renders the one `additionalProperties` entry, so like an `items` entry its key collapses
        // and the entry warns once
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "root_{}" ({}) is a React element rather than a ' +
            'component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
        );
      });

      it('warns once for an entry nested beneath an additionalProperties entry, not once per extra key', () => {
        createFormComponent({
          schema: {
            type: 'object',
            additionalProperties: { type: 'object', properties: { foo: { type: 'string' } } },
          },
          uiSchema: {
            additionalProperties: { foo: { 'ui:FieldTemplate': (<div />) as unknown as UiSchema['ui:FieldTemplate'] } },
          },
          initialFormData: { k1: { foo: 'a' }, k2: { foo: 'b' }, k3: { foo: 'c' } },
        });

        // The `foo` entry is shared by every extra key's object, so the key collapses above it too
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "root_{}_foo" ({}.foo) is a React element rather than ' +
            'a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
        );
      });

      it('warns once for an items entry nested beneath an additionalProperties entry, not once per extra key', () => {
        createFormComponent({
          schema: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
          uiSchema: {
            additionalProperties: {
              items: { 'ui:FieldTemplate': (<div />) as unknown as UiSchema['ui:FieldTemplate'] },
            },
          },
          initialFormData: { k1: ['a'], k2: ['b'] },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "root_{}_[]" ({}[]) is a React element rather than a ' +
            'component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
        );
      });

      it('warns once for an additionalProperties entry nested beneath an items entry, not once per row or key', () => {
        createFormComponent({
          schema: {
            type: 'object',
            properties: { arr: { type: 'array', items: { type: 'object', additionalProperties: { type: 'string' } } } },
          },
          uiSchema: {
            arr: {
              items: {
                additionalProperties: { 'ui:FieldTemplate': (<div />) as unknown as UiSchema['ui:FieldTemplate'] },
              },
            },
          },
          initialFormData: { arr: [{ k1: 'a' }, { k2: 'b' }] },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for "root_arr_[]_{}" (arr[]{}) is a React element rather ' +
            'than a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
        );
      });

      it('warns once for an option entry beneath an additionalProperties entry, naming the option entry', () => {
        createFormComponent({
          schema: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              anyOf: [
                { type: 'object', properties: { b: { type: 'string' } } },
                { type: 'object', properties: { c: { type: 'string' } } },
              ],
            },
          },
          uiSchema: {
            additionalProperties: {
              anyOf: [{ 'ui:FieldTemplate': 'Typo' as unknown as UiSchema['ui:FieldTemplate'] }],
            },
          },
          initialFormData: { k1: { b: 'x' }, k2: { b: 'y' } },
        });

        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          'FieldTemplate (ui:FieldTemplate or ui:options) for the uiSchema.anyOf[0] entry of "root_{}" ({}) names no ' +
            "registered template ('Typo'), so it is ignored.",
        );
      });
    });

    describe('recursive definitions', () => {
      const ref: RJSFSchema = { $ref: '#/definitions/node' };
      const rootOf = (node: RJSFSchema): RJSFSchema => ({ definitions: { node }, $ref: '#/definitions/node' });
      const nodeWith = (child: RJSFSchema): RJSFSchema =>
        rootOf({ type: 'object', properties: { name: { type: 'string' }, child } });

      it.each<[string, RJSFSchema]>([
        ['a property', ref],
        ['an allOf (#5501)', { allOf: [ref] }],
        ['a then branch (#5501)', { type: 'object', if: {}, then: ref }],
      ])('expands a recursion through %s by one level per click', async (_, child) => {
        const { node } = createFormComponent({ schema: nodeWith(child) });

        expect(node.querySelectorAll('button[id$="__expand"]')).toHaveLength(1);
        expect(node.querySelector('#root_child__expand')).toHaveTextContent('Expand Cycle');

        await user.click(screen.getByRole('button', { name: 'Expand Cycle' }));

        expect(node.querySelector('#root_child_name')).toBeInTheDocument();
        expect(node.querySelector('#root_child_child_name')).not.toBeInTheDocument();
        expect(node.querySelectorAll('button[id$="__expand"]')).toHaveLength(1);
        expect(node.querySelector('#root_child_child__expand')).toHaveTextContent('Expand Cycle');
      });

      it('renders an anyOf option that refers back to the schema offering it as the selector alone', async () => {
        const schema = rootOf({
          anyOf: [ref, { type: 'object', properties: { x: { type: 'string' } } }],
        });
        const { node } = createFormComponent({ schema });
        const select = screen.getByRole('combobox');

        expect(select).toHaveAttribute('id', 'root__anyof_select');
        expect(node.querySelectorAll('input')).toHaveLength(0);

        await user.selectOptions(select, 'Option 2');

        expect(node.querySelector('#root_x')).toBeInTheDocument();
        expect(node.querySelectorAll('button[id$="__expand"]')).toHaveLength(0);
      });

      it('renders definitions that all refer to one another, collapsing each path where it comes back round', () => {
        const names = ['d0', 'd1', 'd2', 'd3'];
        const definitions = Object.fromEntries(
          names.map((name): [string, RJSFSchema] => [
            name,
            {
              type: 'object',
              properties: {
                v: { type: 'string' },
                ...Object.fromEntries(
                  names.filter((other) => other !== name).map((other) => [other, { $ref: `#/definitions/${other}` }]),
                ),
              },
            },
          ]),
        );
        const { node } = createFormComponent({ schema: { definitions, $ref: '#/definitions/d0' } });

        expect(node.querySelectorAll('input')).toHaveLength(16);
        expect(node.querySelectorAll('button[id$="__expand"]')).toHaveLength(33);
      });

      describe('the fields and Expand Cycle buttons a recursion renders', () => {
        const controls = (node: Element) =>
          [...node.querySelectorAll('input[id], select[id], textarea[id]')].map(({ id }) => id);
        const buttons = (node: Element) => [...node.querySelectorAll('button[id$="__expand"]')].map(({ id }) => id);
        const named: RJSFSchema = { type: 'string' };
        const withName = (child: RJSFSchema): RJSFSchema =>
          rootOf({ type: 'object', properties: { name: named, child } });
        const A: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string', default: 'x' } },
          dependencies: { a: { properties: { b: { $ref: '#/definitions/B' } } } },
        };
        const B: RJSFSchema = {
          type: 'object',
          properties: { c: { type: 'string', default: 'y' } },
          dependencies: { c: { properties: { a2: { $ref: '#/definitions/A' } } } },
        };
        const Pet: RJSFSchema = {
          type: 'object',
          properties: { petType: { type: 'string', default: 'cat' }, friend: { $ref: '#/definitions/Pet' } },
          if: { properties: { petType: { const: 'cat' } } },
          then: { $ref: '#/definitions/Cat' },
        };
        const Cat: RJSFSchema = {
          allOf: [
            { $ref: '#/definitions/Pet' },
            { type: 'object', properties: { hunts: { type: 'string', default: 'h' } } },
          ],
        };

        it.each<[string, RJSFSchema, string[], string, string[], string, boolean?]>([
          [
            'an allOf declaring the recursive property (#5500)',
            withName({ type: 'object', allOf: [{ properties: { x: ref } }] }),
            ['root_name'],
            'root_child_x__expand',
            ['root_name', 'root_child_x_name'],
            'root_child_x_child_x__expand',
            true,
          ],
          [
            'a then declaring the recursive property (#5500)',
            withName({ type: 'object', if: {}, then: { properties: { x: ref } } }),
            ['root_name'],
            'root_child_x__expand',
            ['root_name', 'root_child_x_name'],
            'root_child_x_child_x__expand',
          ],
          [
            'a dependencies entry that is the recursive $ref (#5500)',
            withName({ type: 'object', properties: { x: { type: 'string', default: 'x' } }, dependencies: { x: ref } }),
            ['root_name'],
            'root_child__expand',
            ['root_name', 'root_child_x', 'root_child_name'],
            'root_child_child__expand',
          ],
          [
            'a dependencies entry declaring the recursive property (#5500)',
            withName({
              type: 'object',
              properties: { x: { type: 'string', default: 'x' } },
              dependencies: { x: { properties: { y: ref } } },
            }),
            ['root_name', 'root_child_x'],
            'root_child_y__expand',
            ['root_name', 'root_child_x', 'root_child_y_name', 'root_child_y_child_x'],
            'root_child_y_child_y__expand',
          ],
          [
            'two definitions whose dependencies refer to each other',
            { definitions: { A, B }, $ref: '#/definitions/A' },
            ['root_a', 'root_b_c'],
            'root_b_a2__expand',
            ['root_a', 'root_b_c', 'root_b_a2_a', 'root_b_a2_b_c'],
            'root_b_a2_b_a2__expand',
          ],
          [
            'a then merging a definition that merges the recursive one back in',
            { definitions: { Pet, Cat }, $ref: '#/definitions/Pet' },
            ['root_petType', 'root_hunts'],
            'root_friend__expand',
            ['root_petType', 'root_friend_petType', 'root_friend_hunts', 'root_hunts'],
            'root_friend_friend__expand',
          ],
          [
            'a percent-encoded $ref, stopping where the same $ref written plainly does',
            {
              definitions: {
                A: { type: 'object', properties: { name: named, child: { $ref: '#/definitions/%41' } } },
              },
              $ref: '#/definitions/A',
            },
            ['root_name'],
            'root_child__expand',
            ['root_name', 'root_child_name'],
            'root_child_child__expand',
          ],
          [
            'a chain of aliases, stopping where its first alias enters the definition again',
            {
              definitions: {
                node: { type: 'object', properties: { n: { type: 'string' }, c: { $ref: '#/definitions/A1' } } },
                A1: { $ref: '#/definitions/A2' },
                A2: ref,
              },
              $ref: '#/definitions/node',
            },
            ['root_n'],
            'root_c__expand',
            ['root_n', 'root_c_n'],
            'root_c_c__expand',
          ],
          [
            'two definitions whose patterns match the keys referring to each other (#5452 a)',
            {
              definitions: {
                x: {
                  type: 'object',
                  properties: { y: { $ref: '#/definitions/y' } },
                  patternProperties: { '^y': { title: 'Y' } },
                },
                y: {
                  type: 'object',
                  properties: { x: { $ref: '#/definitions/x' } },
                  patternProperties: { '^x': { title: 'X' } },
                },
              },
              $ref: '#/definitions/x',
            },
            [],
            'root_y_x__expand',
            [],
            'root_y_x_y_x__expand',
          ],
          [
            'an allOf entry declaring a recursive property its own pattern matches (#5452 b)',
            rootOf({
              type: 'object',
              allOf: [{ properties: { child: ref, name: named }, patternProperties: { '^child': { title: 'Child' } } }],
            }),
            ['root_name'],
            'root_child__expand',
            ['root_child_name', 'root_name'],
            'root_child_child__expand',
          ],
        ])(
          'renders a recursion through %s, one level per click',
          async (_, schema, before, button, after, next, populate) => {
            const { node } = createFormComponent({
              schema,
              defaultFormStateBehavior: populate ? { allOf: 'populateDefaults' } : undefined,
            });
            expect(controls(node)).toEqual(before);
            expect(buttons(node)).toEqual([button]);

            await user.click(screen.getByRole('button', { name: 'Expand Cycle' }));

            expect(controls(node)).toEqual(after);
            expect(buttons(node)).toEqual([next]);
          },
        );

        it.each<[string, RJSFSchema, string[]]>([
          [
            'an allOf declaring the recursive items (#5500)',
            withName({ type: 'array', minItems: 1, allOf: [{ items: ref }] }),
            ['root_name', 'root_child_0_name', 'root_child_0_child_0_name'],
          ],
          [
            'array items whose then declares the recursive property (#5500)',
            withName({
              type: 'array',
              minItems: 1,
              items: { type: 'object', if: {}, then: { properties: { x: ref } } },
            }),
            ['root_name', 'root_child_0_x_name', 'root_child_0_x_child_0_x_name'],
          ],
        ])('renders the rows the defaults fill for a recursion through %s', (_, schema, expected) => {
          const { node } = createFormComponent({ schema, defaultFormStateBehavior: { allOf: 'populateDefaults' } });
          expect(controls(node)).toEqual(expected);
          expect(buttons(node)).toEqual([]);
        });

        it('collapses the first array row under a root $ref as it collapses the others', () => {
          const schema = rootOf({
            type: 'object',
            properties: { name: named, kids: { type: 'array', items: ref }, best: ref },
          });
          const { node } = createFormComponent({ schema, initialFormData: { kids: [{}] } });
          expect(buttons(node)).toEqual(['root_kids_0_best__expand', 'root_best__expand']);
        });

        it("fills an added row of a recursive definition with its item's defaults, where the recursion restarts once", async () => {
          const schema: RJSFSchema = {
            definitions: {
              A: { type: 'object', properties: { v: { type: 'string' }, b: { $ref: '#/definitions/B' } } },
              B: { type: 'array', minItems: 1, items: { $ref: '#/definitions/A' } },
            },
            $ref: '#/definitions/A',
          };
          const { node } = createFormComponent({ schema });
          expect(controls(node)).toEqual(['root_v', 'root_b_0_v', 'root_b_0_b_0_v']);
          const add = node.querySelector('#root_b__add');
          if (!(add instanceof HTMLButtonElement)) {
            throw new Error('no button #root_b__add');
          }

          await user.click(add);

          expect(controls(node)).toEqual([
            'root_v',
            'root_b_0_v',
            'root_b_0_b_0_v',
            'root_b_1_v',
            'root_b_1_b_0_v',
            'root_b_1_b_0_b_0_v',
          ]);
        });

        it('renders the keywords beside a $ref that another $ref reaches together with its target', () => {
          const schema: RJSFSchema = {
            definitions: {
              O: { properties: { a: { type: 'string', default: 'a' } } },
              M: { $ref: '#/definitions/O', properties: { b: { type: 'string', default: 'b' } } },
            },
            type: 'object',
            properties: { v: { $ref: '#/definitions/M' } },
          };
          const { node } = createFormComponent({ schema });
          expect(controls(node)).toEqual(['root_v_b', 'root_v_a']);
          expect(node.querySelector('#root_v_b')).toHaveValue('b');
          expect(node.querySelector('#root_v_a')).toHaveValue('a');
        });

        it('renders the default beside the $ref of a tuple entry and of additionalItems', () => {
          const schema: RJSFSchema = {
            definitions: { s: { type: 'string', default: 'target' } },
            type: 'object',
            properties: {
              t: {
                type: 'array',
                items: [{ $ref: '#/definitions/s', default: 'beside' }, { $ref: '#/definitions/s' }],
              },
              x: {
                type: 'array',
                minItems: 2,
                items: [{ type: 'string' }],
                additionalItems: { $ref: '#/definitions/s', default: 'beside' },
              },
            },
          };
          const { node } = createFormComponent({ schema });
          expect(node.querySelector('#root_t_0')).toHaveValue('beside');
          expect(node.querySelector('#root_t_1')).toHaveValue('target');
          expect(node.querySelector('#root_x_1')).toHaveValue('beside');
        });

        it('renders a $ref to an $anchor, and one under a relative $id, against what it names', () => {
          const target: RJSFSchema = { type: 'object', properties: { v: { type: 'string', default: 'v' } } };
          const anchored = { ...target, $anchor: 'nodeA' };
          const draft2020 = 'https://json-schema.org/draft/2020-12/schema';
          const { node: anchor } = createFormComponent({
            schema: {
              $schema: draft2020,
              $id: 'https://example.com/root',
              $defs: { n: anchored },
              type: 'object',
              properties: { p: { $ref: '#nodeA' } },
            },
          });
          expect(controls(anchor)).toEqual(['root_p_v']);
          const { node: relative } = createFormComponent({
            schema: {
              $schema: draft2020,
              $id: 'https://example.com/root.json',
              $defs: {
                c: {
                  $id: 'sub/c.json',
                  type: 'object',
                  properties: { w: { $ref: '#/$defs/w' } },
                  $defs: { w: { type: 'string', default: 'w' } },
                },
              },
              type: 'object',
              properties: { p: { $ref: 'sub/c.json' } },
            },
          });
          expect(controls(relative)).toEqual(['root_p_w']);
          expect(relative.querySelector('#root_p_w')).toHaveValue('w');
        });

        it('renders and edits a field whose $ref sits under a relative nested $id', async () => {
          const schema: RJSFSchema = {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $id: 'https://example.com/root.json',
            $defs: {
              child: {
                $id: 'child.json',
                properties: { a: { $ref: '#/$defs/x' } },
                $defs: { x: { type: 'string', title: 'Child x' } },
              },
            },
            type: 'object',
            properties: { c: { $ref: 'child.json' } },
          };
          const { node, onChange } = createFormComponent({ schema });
          expect(controls(node)).toEqual(['root_c_a']);

          await user.type(screen.getByRole('textbox', { name: 'Child x' }), 'hi');

          expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ formData: { c: { a: 'hi' } } }),
            'root_c_a',
          );
        });

        it("renders an additional key of a nested resource under a relative root $id with the resource's own definition", () => {
          const schema: RJSFSchema = {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $id: 'schemas/root.json',
            $defs: {
              x: { type: 'number' },
              child: {
                $id: 'nested/child.json',
                $defs: { x: { type: 'string' } },
                additionalProperties: { $ref: '#/$defs/x' },
              },
            },
            type: 'object',
            properties: { c: { $ref: '#/$defs/child' } },
          };
          const { node } = createFormComponent({ schema, initialFormData: { c: { k: 'text' } } });
          expect(node.querySelector('#root_c_k')).toHaveAttribute('type', 'text');
          expect(node.querySelector('#root_c_k')).toHaveValue('text');
        });

        it('picks an option by the $ref a merged property two levels down holds in a resource of its own', () => {
          // The option merges `info.kind` with the resource's own, a `$ref` to the resource's `cat`, which the root
          // does not define
          const schema: RJSFSchema = {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $id: 'https://example.com/root.json',
            $defs: {
              pet: {
                $id: 'pet.json',
                $defs: { cat: { type: 'object', properties: { a: { type: 'string' } } } },
                type: 'object',
                properties: { info: { type: 'object', properties: { kind: { $ref: '#/$defs/cat' } } } },
              },
              dog: { type: 'object', properties: { bark: { type: 'string' } } },
            },
            type: 'object',
            properties: {
              p: {
                oneOf: [
                  { $ref: 'pet.json', properties: { info: { properties: { kind: { title: 'Kind' } } } } },
                  { $ref: '#/$defs/dog' },
                ],
              },
            },
          };
          const { node } = createFormComponent({ schema, initialFormData: { p: { info: { kind: { a: 'x' } } } } });
          expect(node.querySelector('#root_p_info_kind_a')).toHaveValue('x');
        });

        it('mounts with a list a merge rebuilt in a resource of its own, whose options hold $refs written there', () => {
          // Each option of the cross product of the two lists is a `$ref` to the resource's `s` or `t` with a `title`
          // beside it; the root defines an `s` of its own and no `t`
          const schema: RJSFSchema = {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $id: 'https://example.com/root.json',
            $defs: {
              s: { type: 'number' },
              res: {
                $id: 'res.json',
                $defs: {
                  s: { type: 'object', properties: { q: { type: 'string', default: 'Q' } }, required: ['q'] },
                  t: { type: 'object', properties: { r: { type: 'string', default: 'R' } }, required: ['r'] },
                  o: {
                    type: 'object',
                    if: {},
                    then: {},
                    allOf: [{ anyOf: [{ $ref: '#/$defs/s' }, { $ref: '#/$defs/t' }] }, { anyOf: [{ title: 'A' }] }],
                  },
                },
              },
            },
            type: 'object',
            properties: { p: { $ref: 'res.json#/$defs/o' } },
          };
          const { node } = createFormComponent({ schema });
          expect(node.querySelector('#root_p_q')).toHaveValue('Q');
        });

        it('expands a definition two others share at the first path that reaches it, and collapses it at the second', () => {
          const schema: RJSFSchema = {
            definitions: {
              A: { type: 'object', properties: { a: { type: 'string' }, b: { $ref: '#/definitions/B' } } },
              B: { type: 'object', properties: { c: { type: 'string' }, a2: { $ref: '#/definitions/A' } } },
              C: { type: 'object', properties: { x: { $ref: '#/definitions/A' }, y: { $ref: '#/definitions/B' } } },
            },
            $ref: '#/definitions/C',
          };
          const { node } = createFormComponent({ schema });
          expect(controls(node)).toEqual(['root_x_a', 'root_x_b_c', 'root_y_c', 'root_y_a2_a']);
          expect(buttons(node)).toEqual(['root_x_b_a2__expand', 'root_y_a2_b__expand']);
        });
      });

      describe('a tree whose array sits in a definition each row enters again', () => {
        const tree: RJSFSchema = {
          type: 'object',
          properties: { v: { type: 'string' }, kids: { $ref: '#/definitions/list' } },
        };
        const definitions = { node: tree, list: { type: 'array', items: ref } } satisfies Record<string, RJSFSchema>;
        const data = { v: 'a', kids: [{ v: 'b', kids: [{ v: 'c', kids: [{ v: 'd' }] }] }] };

        it.each<[string, RJSFSchema]>([
          ['under a root $ref', { definitions, $ref: '#/definitions/node' }],
          ['under a root that is not a $ref', { definitions, ...tree }],
        ])('renders every row the data has, %s', (_, schema) => {
          const { node } = createFormComponent({ schema, initialFormData: data });

          expect(node.querySelector('#root_kids_0_kids_0_kids_0_v')).toHaveValue('d');
          expect(node.querySelectorAll('button[id$="__expand"]')).toHaveLength(0);
        });

        it('offers an added row its own Add button rather than an Expand Cycle button', async () => {
          const { node } = createFormComponent({ schema: { definitions, $ref: '#/definitions/node' } });

          const button = (id: string) => {
            const found = node.querySelector(`#${id}`);
            if (!(found instanceof HTMLButtonElement)) {
              throw new Error(`no button #${id}`);
            }
            return found;
          };
          await user.click(button('root_kids__add'));
          await user.click(button('root_kids_0_kids__add'));

          expect(node.querySelector('#root_kids_0_kids_0_v')).toBeInTheDocument();
          expect(node.querySelector('#root_kids_0_kids_0_kids__add')).toBeInTheDocument();
          expect(node.querySelectorAll('button[id$="__expand"]')).toHaveLength(0);
        });
      });
    });
  });
});
