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
import { render, waitFor } from '@testing-library/react';
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
      await user.type(node.querySelector('#root_val')!, 'hi');

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
      await user.selectOptions(node.querySelector('select')!, 'B');

      expect(node.querySelectorAll('input')).toHaveLength(1);
      expect(node.querySelector('.rjsf-field-null')).not.toBeInTheDocument();
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

    it('clicking the expand button shows the next level of the cycle', async () => {
      const { node } = createFormComponent({ schema });

      // child is fully rendered (first $ref occurrence), but child.child hits the cycle
      const expandButton = node.querySelector<HTMLButtonElement>('#root_child_child-button')!;
      expect(expandButton).not.toBeNull();
      expect(expandButton).toHaveTextContent('Expand Cycle');

      await user.click(expandButton);

      expect(node.querySelector('#root_child_child-button')).toBeNull();
      expect(node.querySelector<HTMLButtonElement>('#root_child_child_child_child-button')).not.toBeNull();
    });
  });
});
