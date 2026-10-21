import { Suspense, forwardRef, lazy, memo } from 'react';
import type {
  ArrayFieldItemTemplateProps,
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
  ThemePresentation,
  WidgetProps,
} from '@rjsf/utils';
import {
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  createSchemaUtils,
  englishStringTranslator,
  errorId,
  mergeThemePresentation,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import SchemaField from '../src/components/fields/SchemaField.tsx';
import Form, { generateTheme, generateWidgets } from '../src/index.ts';
import MarkdownTemplate from '../src/markdown.tsx';
import { createFormComponent, setupConsoleWarnSuppression, submitForm } from './testUtils.tsx';
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
  });

  describe('Unsupported field', () => {
    it('should warn on invalid field type', () => {
      const { node } = createFormComponent({
        // @ts-expect-error: TS2322, because we are explicitly needing to provide an unsupported type
        schema: { type: 'invalid' },
      });

      expect(node.querySelector('.unsupported-field')).toHaveTextContent('Unknown field type invalid');
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

      it('warns once for the form about an unusable ui:globalOptions.field, and per field about a local one', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' } },
        };
        const { node } = createFormComponent({
          schema,
          uiSchema: { 'ui:globalOptions': { field: 'Stringfield' }, c: { 'ui:field': 'Cfield' } },
        });

        expect(node.querySelectorAll('input')).toHaveLength(3);
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenNthCalledWith(
          1,
          `ui:globalOptions.field names no registered field ('Stringfield'), so it is ignored and the fields it ` +
            'applies to are rendered as though no ui:field were given.',
        );
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenNthCalledWith(
          2,
          `ui:field for "root_c" (c) names no registered field ('Cfield'), so it is ignored and the field is ` +
            'rendered as though no ui:field were given.',
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
          const { node } = createFormComponent({ schema, uiSchema, formData });

          expect(node.querySelectorAll('input')).toHaveLength(3);
          expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
            `ui:field for ${label} names no registered field ('Typo'), so it is ignored and the field is rendered as ` +
              'though no ui:field were given.',
          );
        },
      );

      it('renders the ui:globalOptions.field in place of a local ui:field that is ignored', () => {
        const uiSchema: UiSchema = JSON.parse(
          '{ "ui:globalOptions": { "field": "myobject" }, "ui:field": null, "val": { "ui:field": "Nope" } }',
        );

        const { node } = createFormComponent({ schema: stringSchema, uiSchema, fields: { myobject: MyObject } });

        expect(node.querySelector('#custom')).toBeInTheDocument();
        expect(node.querySelector('input#root_val')).not.toBeInTheDocument();
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
          `ui:field for "root_val" (val) names no registered field ('Nope'), so it is ignored and the field is ` +
            'rendered as though no ui:field were given.',
        );
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

      it.each(['null', 'false', '""', '0'])(
        'does not warn when a JSON uiSchema clears a global ui:field with %s',
        (empty) => {
          const uiSchema: UiSchema = JSON.parse(
            `{ "ui:globalOptions": { "field": "myobject" }, "ui:field": ${empty}, "val": { "ui:field": ${empty} } }`,
          );

          const { node } = createFormComponent({ schema: stringSchema, uiSchema, fields: { myobject: MyObject } });

          expect(node.querySelector('#custom')).not.toBeInTheDocument();
          expect(node.querySelector('input#root_val')).toBeInTheDocument();
          expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalled();
        },
      );

      it.each(['null', 'false', '""', '0'])('does not warn about a JSON ui:globalOptions.field of %s', (empty) => {
        const uiSchema: UiSchema = JSON.parse(`{ "ui:globalOptions": { "field": ${empty} } }`);

        const { node } = createFormComponent({ schema: stringSchema, uiSchema });

        expect(node.querySelector('input#root_val')).toBeInTheDocument();
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

    it.each<[string, UiSchema]>([
      ["ui:field: 'SchemaField'", { val: { 'ui:field': 'SchemaField' } }],
      ["ui:options.field: 'SchemaField'", { val: { 'ui:options': { field: 'SchemaField' } } }],
      ["ui:globalOptions.field: 'SchemaField'", { 'ui:globalOptions': { field: 'SchemaField' } }],
    ])('renders the field %s names once, rather than until the heap runs out (#5377)', (_, uiSchema) => {
      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelectorAll('input#root_val')).toHaveLength(1);
      expect(screen.getByLabelText('Value')).toBe(node.querySelector('input#root_val'));
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
      ['a ui:options.field wrapping SchemaField', schema, { val: { 'ui:options': { field: 'wrapping' } } }],
      ['a ui:globalOptions.field wrapping SchemaField', schema, { 'ui:globalOptions': { field: 'wrapping' } }],
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
        props: { formData: ['x'] },
      },
      {
        spelling: "ui:field: 'SchemaField' on an anyOf array item",
        schema: { type: 'array', items: titledAnyOf },
        named: { type: 'array', items: titledAnyOf },
        uiSchema: { items: { 'ui:field': 'SchemaField' } },
        props: { formData: ['x'] },
      },
      {
        spelling: "ui:field: 'SchemaField' on an extra key",
        schema: { type: 'object', additionalProperties: titled },
        named: { type: 'object', additionalProperties: titled },
        uiSchema: { additionalProperties: { 'ui:field': 'SchemaField' } },
        props: { formData: { k: 'x' } },
      },
      {
        spelling: "ui:field: 'SchemaField' on an object with errors",
        schema: { type: 'object', properties: { o: { type: 'object', title: 'O', properties: { a: titled } } } },
        named: { type: 'object', properties: { o: { type: 'object', title: 'O', properties: { a: titled } } } },
        uiSchema: { o: { 'ui:field': 'SchemaField' } },
        props: { extraErrors: { o: { __errors: ['o bad'], a: { __errors: ['a bad'] } } } },
      },
      {
        spelling: "ui:globalOptions.field: 'SchemaField' on an anyOf",
        schema: { type: 'object', properties: { val: titledAnyOf } },
        named: { type: 'object', properties: { val: titledAnyOf } },
        uiSchema: { 'ui:globalOptions': { field: 'SchemaField' } },
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
        formData = ['x'],
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
          formData,
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
          named: "ui:field: 'Missing' and ui:globalOptions.field: 'SchemaField'",
          items: titled,
          uiSchema: { items: { 'ui:field': 'Missing' }, 'ui:globalOptions': { field: 'SchemaField' } },
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
          named: 'a ui:options.field naming a field written for the item',
          items: titled,
          uiSchema: { items: { 'ui:options': { field: 'own' } } },
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
        {
          spelling: 'ui:options.field',
          naming: (key) => ({
            schema: { type: 'array', items: titled },
            uiSchema: { items: { 'ui:options': { field: key } } },
          }),
        },
        {
          spelling: 'ui:globalOptions.field',
          // The array's own empty `ui:field` keeps the global field for its item alone
          naming: (key) => ({
            schema: { type: 'array', items: titled },
            uiSchema: { 'ui:field': '', 'ui:globalOptions': { field: key } },
          }),
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
            formData: [true],
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
          props: { schema: { type: 'array', items: { type: 'null', title: 'Nothing' } }, formData: [null] },
          displayLabel: false,
        },
        {
          named: "ui:widget: 'checkbox' on a boolean",
          props: {
            schema: { type: 'array', items: { type: 'boolean', title: 'Flag' } },
            uiSchema: { items: { 'ui:widget': 'checkbox' } },
            formData: [true],
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
            formData: [{}],
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
          formData: [value],
          presentation: selfLabelled,
        });

        expect(labels.fields[0]).toBe(false);
        expect(labels.items.at(-1)).toBe(displayLabel);
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
      [
        "ui:options.field: 'SchemaField'",
        describedSchema,
        { val: { 'ui:options': { field: 'SchemaField' }, 'ui:help': 'Help' } },
      ],
      [
        "ui:globalOptions.field: 'SchemaField'",
        describedSchema,
        { 'ui:globalOptions': { field: 'SchemaField' }, val: { 'ui:help': 'Help' } },
      ],
      [
        'a ui:options.field wrapping SchemaField',
        describedSchema,
        { val: { 'ui:options': { field: 'wrapping' }, 'ui:help': 'Help' } },
      ],
      [
        'a ui:globalOptions.field wrapping SchemaField',
        describedSchema,
        { 'ui:globalOptions': { field: 'wrapping' }, val: { 'ui:help': 'Help' } },
      ],
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
        "ui:options.field: 'SchemaField'",
        { type: 'object', properties: { val: { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] } } },
        { val: { 'ui:options': { field: 'SchemaField' } } },
      ],
      [
        "ui:globalOptions.field: 'SchemaField'",
        { type: 'object', properties: { val: { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] } } },
        { 'ui:globalOptions': { field: 'SchemaField' } },
      ],
      [
        'a ui:field wrapping SchemaField',
        { type: 'object', properties: { val: { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] } } },
        { val: { 'ui:field': 'wrapping' } },
      ],
      [
        'a ui:options.field wrapping SchemaField',
        { type: 'object', properties: { val: { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] } } },
        { val: { 'ui:options': { field: 'wrapping' } } },
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
      const { node: unnamedNode } = createFormComponent({ schema, formData });
      const { node } = createFormComponent({
        schema,
        formData,
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
        "ui:options.field: 'SchemaField'",
        { type: 'object', additionalProperties: { type: 'string' } },
        { additionalProperties: { 'ui:options': { field: 'SchemaField' } } },
      ],
      [
        'a ui:field wrapping SchemaField',
        { type: 'object', additionalProperties: { type: 'string' } },
        { additionalProperties: { 'ui:field': 'wrapping' } },
      ],
      [
        'a ui:options.field wrapping SchemaField',
        { type: 'object', additionalProperties: { type: 'string' } },
        { additionalProperties: { 'ui:options': { field: 'wrapping' } } },
      ],
      ['a $id wrapping SchemaField', { type: 'object', additionalProperties: { $id: 'wrapping', type: 'string' } }, {}],
    ])('renders one key input and one remove button for an extra key the field %s names', (_, schema, uiSchema) => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
        formData: { foo: 'x' },
        fields: { wrapping: WrappingField },
      });

      expect(node.querySelectorAll('input')).toHaveLength(2);
      expect(node.querySelectorAll('input#root_foo')).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1);
    });

    it.each<[string, UiSchema]>([
      ['without', { 'ui:globalOptions': { field: 'FallbackField' } }],
      ['with', { 'ui:globalOptions': { field: 'FallbackField' }, val: { anyOf: [{}, {}] } }],
    ])('renders one type selector %s a uiSchema per option under a global FallbackField', (_, uiSchema) => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { val: { type: ['string', 'number'], anyOf: [{ minLength: 2 }, { maximum: 5 }] } },
        },
        uiSchema,
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelectorAll('[id$="___internal_type_selector"]')).toHaveLength(1);
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
      {
        spelling: 'a ui:globalOptions.field',
        schema: anyOfSchema,
        uiSchema: { 'ui:globalOptions': { field: 'MyField' } },
        issue: '#5358',
      },
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

    it('does not render a ui:globalOptions.field again for an option with a uiSchema of its own', () => {
      const { node } = createFormComponent({
        schema: anyOfSchema,
        uiSchema: { 'ui:globalOptions': { field: 'MyField' }, anyOf: [{ 'ui:title': 'Short' }, {}] },
        fields,
      });

      expect(node.querySelectorAll('.my-field')).toHaveLength(1);
      expect(node.querySelectorAll('input#root')).toHaveLength(1);
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

    it.each<[string, RJSFSchema, UiSchema]>([
      ['ui:globalOptions.field', { type: 'string' }, { 'ui:field': 'Missing', 'ui:globalOptions': { field: 'Own' } }],
      [
        'ui:globalOptions.field, past ui:options.field',
        { type: 'string' },
        { 'ui:options': { field: 'Missing' }, 'ui:globalOptions': { field: 'Own' } },
      ],
      ['a $id', { $id: 'Own', type: 'string' }, { 'ui:field': 'Missing' }],
    ])('names no field where %s names it', (_, schema, uiSchema) => {
      const received = vi.fn<(uiSchema: FieldProps['uiSchema']) => void>();
      function Own(props: FieldProps) {
        received(props.uiSchema);
        return null;
      }
      createFormComponent({ schema, uiSchema, fields: { Own } });

      expect(received).toHaveBeenCalled();
      expect(received.mock.lastCall?.[0]).not.toHaveProperty(['ui:field']);
      expect(received.mock.lastCall?.[0]?.['ui:options']?.field).toBeUndefined();
    });

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
      const hiddenFields = node.querySelectorAll('.hidden');
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
      expect(node.querySelector('.control-label')).not.toBeInTheDocument();
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

      const matches = node.querySelectorAll(':scope > .form-group > div > .error-detail .text-danger');
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

      const matches = node.querySelectorAll(':scope .form-group .form-group .text-danger');
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

      const matches = node.querySelectorAll(':scope .form-group .form-group .text-danger');
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

      const matches = node.querySelectorAll(':scope .form-group .form-group .text-danger');
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

      const matches = node.querySelectorAll(':scope .form-group .form-group .text-danger');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll(':scope .form-group .form-group .custom-field-error');
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

      const matches = node.querySelectorAll(':scope .form-group .form-group .text-danger');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll(':scope .form-group .form-group .custom-field-error');
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

        const matches = node.querySelectorAll(':scope > .form-group > div > .error-detail .text-danger');
        expect(matches).toHaveLength(0);
      });

      it('should not show default errors in child component', async () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        await submitForm(node, user);

        const matches = node.querySelectorAll(':scope .form-group .form-group .text-danger');
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

        const matches = node.querySelectorAll(':scope > .form-group > div > .error-detail .text-danger');
        expect(matches).toHaveLength(0);
      });

      it('should show errors on child component', async () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        await submitForm(node, user);

        const matches = node.querySelectorAll(':scope .form-group .form-group .text-danger');
        expect(matches).toHaveLength(1);
        expect(matches[0]).toHaveTextContent('test');
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

        const matches = node.querySelectorAll(':scope .form-group .form-group .text-danger');
        expect(matches).toHaveLength(1);
        expect(matches[0]).toHaveTextContent('test');
      });
    });

    describe("resolved as the field's own, then its parent's, then the global one", () => {
      const nestedSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      };
      const extraErrors = { foo: { __errors: ['foo is wrong'] }, bar: { __errors: ['bar is wrong'] } } as ErrorSchema;

      it("hides a child's errors by its parent's ui:hideError over a global one", () => {
        const { node } = createFormComponent({
          schema: nestedSchema,
          uiSchema: { 'ui:globalOptions': { hideError: false }, 'ui:hideError': true },
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

      it('falls back to the global one where no field sets its own', () => {
        const { node } = createFormComponent({
          schema: nestedSchema,
          uiSchema: { 'ui:globalOptions': { hideError: true } },
          extraErrors,
        });

        expect(node.querySelector(`#${errorId('root_foo')}`)).not.toBeInTheDocument();
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

      const matches = node.querySelectorAll(':scope .form-group .form-group .help-block');
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

      const matches = node.querySelectorAll(':scope .form-group .form-group .help-block');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll(':scope .form-group .form-group .custom-field-help');
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

      const matches = node.querySelectorAll(':scope .form-group .form-group .help-block');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll(':scope .form-group .form-group .custom-field-help');
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

      const field = node.querySelector(':scope .form-group .form-group .field-description')!;

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

      const field = node.querySelector(':scope .form-group .form-group .field-description')!;

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

      expect(form.querySelectorAll('button[id$="-button"]')).toHaveLength(1);
      expect(form.querySelector('#root_wrap_child-button')).toHaveTextContent('Expand Cycle');
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

      expect(form.querySelectorAll('button[id$="-button"]')).toHaveLength(1);
      expect(form.querySelector('#root_child-button')).toHaveTextContent('Expand Cycle');

      // The expanded field is handed the definition resolved in place, with the branch still to resolve
      await user.click(screen.getByRole('button', { name: 'Expand Cycle' }));

      expect(form.querySelectorAll('button[id$="-button"]')).toHaveLength(1);
      expect(form.querySelector('#root_child_child-button')).toHaveTextContent('Expand Cycle');
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
      expect(form.querySelectorAll('button[id$="-button"]')).toHaveLength(0);
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
      const ids = () => [...node.querySelectorAll('input[id], button[id$="-button"]')].map(({ id }) => id);

      expect(ids()).toEqual(['root_a', 'root_b_b', 'root_b_a-button']);

      await user.click(screen.getByRole('button', { name: 'Expand Cycle' }));

      expect(ids()).toEqual(['root_a', 'root_b_b', 'root_b_a_a', 'root_b_a_b_b', 'root_b_a_b_a-button']);
    });

    it('clicking the expand button shows the next level of the cycle', async () => {
      const { node } = createFormComponent({ schema });

      // child is fully rendered (first $ref occurrence), but child.child hits the cycle
      const expandButton = node.querySelector<HTMLButtonElement>('#root_child_child-button')!;
      expect(expandButton).not.toBeNull();
      expect(expandButton).toHaveTextContent('Expand Cycle');

      await user.click(expandButton);

      // One level per click, as for a recursion through a `then` or an `allOf`
      expect(node.querySelector('#root_child_child-button')).toBeNull();
      expect(node.querySelector('#root_child_child_child-button')).toHaveTextContent('Expand Cycle');
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

        expect(node.querySelectorAll('button[id$="-button"]')).toHaveLength(1);
        expect(node.querySelector('#root_child-button')).toHaveTextContent('Expand Cycle');

        await user.click(screen.getByRole('button', { name: 'Expand Cycle' }));

        expect(node.querySelector('#root_child_name')).toBeInTheDocument();
        expect(node.querySelector('#root_child_child_name')).not.toBeInTheDocument();
        expect(node.querySelectorAll('button[id$="-button"]')).toHaveLength(1);
        expect(node.querySelector('#root_child_child-button')).toHaveTextContent('Expand Cycle');
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
        expect(node.querySelectorAll('button[id$="-button"]')).toHaveLength(0);
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
        expect(node.querySelectorAll('button[id$="-button"]')).toHaveLength(33);
      });

      describe('the fields and Expand Cycle buttons a recursion renders', () => {
        const controls = (node: Element) =>
          [...node.querySelectorAll('input[id], select[id], textarea[id]')].map(({ id }) => id);
        const buttons = (node: Element) => [...node.querySelectorAll('button[id$="-button"]')].map(({ id }) => id);
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
            'root_child_x-button',
            ['root_name', 'root_child_x_name'],
            'root_child_x_child_x-button',
            true,
          ],
          [
            'a then declaring the recursive property (#5500)',
            withName({ type: 'object', if: {}, then: { properties: { x: ref } } }),
            ['root_name'],
            'root_child_x-button',
            ['root_name', 'root_child_x_name'],
            'root_child_x_child_x-button',
          ],
          [
            'a dependencies entry that is the recursive $ref (#5500)',
            withName({ type: 'object', properties: { x: { type: 'string', default: 'x' } }, dependencies: { x: ref } }),
            ['root_name'],
            'root_child-button',
            ['root_name', 'root_child_x', 'root_child_name'],
            'root_child_child-button',
          ],
          [
            'a dependencies entry declaring the recursive property (#5500)',
            withName({
              type: 'object',
              properties: { x: { type: 'string', default: 'x' } },
              dependencies: { x: { properties: { y: ref } } },
            }),
            ['root_name', 'root_child_x'],
            'root_child_y-button',
            ['root_name', 'root_child_x', 'root_child_y_name', 'root_child_y_child_x'],
            'root_child_y_child_y-button',
          ],
          [
            'two definitions whose dependencies refer to each other',
            { definitions: { A, B }, $ref: '#/definitions/A' },
            ['root_a', 'root_b_c'],
            'root_b_a2-button',
            ['root_a', 'root_b_c', 'root_b_a2_a', 'root_b_a2_b_c'],
            'root_b_a2_b_a2-button',
          ],
          [
            'a then merging a definition that merges the recursive one back in',
            { definitions: { Pet, Cat }, $ref: '#/definitions/Pet' },
            ['root_petType', 'root_hunts'],
            'root_friend-button',
            ['root_petType', 'root_friend_petType', 'root_friend_hunts', 'root_hunts'],
            'root_friend_friend-button',
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
            'root_child-button',
            ['root_name', 'root_child_name'],
            'root_child_child-button',
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
            'root_c-button',
            ['root_n', 'root_c_n'],
            'root_c_c-button',
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
            'root_y_x-button',
            [],
            'root_y_x_y_x-button',
          ],
          [
            'an allOf entry declaring a recursive property its own pattern matches (#5452 b)',
            rootOf({
              type: 'object',
              allOf: [{ properties: { child: ref, name: named }, patternProperties: { '^child': { title: 'Child' } } }],
            }),
            ['root_name'],
            'root_child-button',
            ['root_child_name', 'root_name'],
            'root_child_child-button',
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
          const { node } = createFormComponent({ schema, formData: { kids: [{}] } });
          expect(buttons(node)).toEqual(['root_kids_0_best-button', 'root_best-button']);
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
          const { node } = createFormComponent({ schema, formData: { c: { k: 'text' } } });
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
          const { node } = createFormComponent({ schema, formData: { p: { info: { kind: { a: 'x' } } } } });
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
          expect(buttons(node)).toEqual(['root_x_b_a2-button', 'root_y_a2_b-button']);
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
          const { node } = createFormComponent({ schema, formData: data });

          expect(node.querySelector('#root_kids_0_kids_0_kids_0_v')).toHaveValue('d');
          expect(node.querySelectorAll('button[id$="-button"]')).toHaveLength(0);
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
          expect(node.querySelectorAll('button[id$="-button"]')).toHaveLength(0);
        });
      });
    });
  });
});
