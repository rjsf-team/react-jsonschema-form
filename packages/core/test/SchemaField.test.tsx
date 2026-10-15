import { Suspense, forwardRef, lazy, memo } from 'react';
import type {
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
  WidgetProps,
} from '@rjsf/utils';
import { DEFAULT_ID_PREFIX, DEFAULT_ID_SEPARATOR, createSchemaUtils, englishStringTranslator } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import SchemaField from '../src/components/fields/SchemaField.tsx';
import Form, { generateTheme } from '../src/index.ts';
import MarkdownTemplate from '../src/markdown.tsx';
import { createFormComponent, setupConsoleWarnSuppression, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

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
  });

  describe('a $id names a field as ui:field does (#5391)', () => {
    function MyField() {
      return <div className='my-field' />;
    }
    const fields = { MyField };
    const anyOfSchema: RJSFSchema = { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] };

    it.each<[string, RJSFSchema, UiSchema]>([
      ['a $id', { $id: 'MyField', ...anyOfSchema }, {}],
      ['a ui:field', anyOfSchema, { 'ui:field': 'MyField' }],
      ['a ui:globalOptions.field', anyOfSchema, { 'ui:globalOptions': { field: 'MyField' } }],
    ])('renders the field %s names once, beside the option selector', (_, schema, uiSchema) => {
      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('.my-field')).toHaveLength(1);
      expect(node.querySelector('#root__anyof_select')).toBeInTheDocument();
      expect(node.querySelectorAll('input#root')).toHaveLength(1);
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      ['a $id', { $id: 'MyField', ...anyOfSchema }, { 'ui:fieldReplacesAnyOrOneOf': true }],
      ['a ui:field', anyOfSchema, { 'ui:field': 'MyField', 'ui:fieldReplacesAnyOrOneOf': true }],
    ])('renders the field %s names in place of the options under ui:fieldReplacesAnyOrOneOf', (_, schema, uiSchema) => {
      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('.my-field')).toHaveLength(1);
      expect(node.querySelector('#root__anyof_select')).not.toBeInTheDocument();
      expect(node.querySelector('input#root')).not.toBeInTheDocument();
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

    it('should append (deprecated) to label by default', () => {
      const { node } = createFormComponent({ schema });
      const labels = node.querySelectorAll('label');
      expect(labels[0]).toHaveTextContent('foo (deprecated)');
      expect(labels[1]).toHaveTextContent('bar');
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
