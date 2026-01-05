import { fireEvent, act } from '@testing-library/react';
import {
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  FieldProps,
  RJSFSchema,
  UiSchema,
  createSchemaUtils,
  englishStringTranslator,
  DescriptionFieldProps,
  FormValidation,
  FieldErrorProps,
  FieldHelpProps,
  WidgetProps,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import { getDefaultRegistry } from '../src';
import SchemaField from '../src/components/fields/SchemaField';
import { createFormComponent } from './testUtils';

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
      const schemaUtils = createSchemaUtils(validator, schema);

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
      const defaultRegistry = getDefaultRegistry();
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
      const schemaUtils = createSchemaUtils(validator, schema);

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
      const defaultRegistry = getDefaultRegistry();
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
      const CustomUnsupportedField = function () {
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

  describe('Custom SchemaField component', () => {
    const CustomSchemaField = function (props: FieldProps) {
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
    const CustomStringField = function () {
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
    const CustomIdField = function () {
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
      const defaultRegistry = getDefaultRegistry();
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
      const CustomSchemaField = function (props: FieldProps) {
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
      const CustomSchemaField = function (props: FieldProps) {
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
        const { uiSchema, ...fieldProps } = props; //eslint-disable-line
        return <SchemaField {...fieldProps} />;
      },
    };

    function customValidate(_: any, errors: FormValidation) {
      errors.addError('container');
      errors.foo?.addError('test');
      return errors;
    }

    it('should render its own errors', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
      });

      act(() => {
        fireEvent.submit(node);
      });

      const matches = node.querySelectorAll('form > .form-group > div > .error-detail .text-danger');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('container');
    });

    it('should pass errors to child component', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
      });

      act(() => {
        fireEvent.submit(node);
      });

      const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('test');
    });

    it('should ignore errors for top level anyOf/oneOf and show only one in child schema', () => {
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

      act(() => {
        fireEvent.submit(node);
      });

      const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('test');
    });

    it('should show errors for top level anyOf/oneOf when schema is select control', () => {
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

      act(() => {
        fireEvent.submit(node);
      });

      const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('test');
    });

    it('should pass errors to custom FieldErrorTemplate', () => {
      const customFieldError = (props: FieldErrorProps) => {
        return <div className='custom-field-error'>{props.errors}</div>;
      };
      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
        templates: { FieldErrorTemplate: customFieldError },
      });

      act(() => {
        fireEvent.submit(node);
      });

      const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll('form .form-group .form-group .custom-field-error');
      expect(customMatches[0]).toHaveTextContent('test');
    });

    it('should pass errors to custom FieldErrorTemplate, via uiSchema', () => {
      const customFieldError = (props: FieldErrorProps) => {
        return <div className='custom-field-error'>{props.errors}</div>;
      };
      const uiSchema: UiSchema = {
        'ui:field': (props) => {
          const { uiSchema, ...fieldProps } = props; //eslint-disable-line
          return <SchemaField {...fieldProps} uiSchema={{ foo: { 'ui:FieldErrorTemplate': customFieldError } }} />;
        },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
      });

      act(() => {
        fireEvent.submit(node);
      });

      const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll('form .form-group .form-group .custom-field-error');
      expect(customMatches[0]).toHaveTextContent('test');
    });

    describe('Custom error rendering', () => {
      const customStringWidget = (props: WidgetProps) => {
        return <div className='custom-text-widget'>{props.rawErrors}</div>;
      };

      it('should pass rawErrors down to custom widgets', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          customValidate,
          templates: { BaseInputTemplate: customStringWidget },
        });

        act(() => {
          fireEvent.submit(node);
        });

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

      it('should not render its own default errors', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        act(() => {
          fireEvent.submit(node);
        });

        const matches = node.querySelectorAll('form > .form-group > div > .error-detail .text-danger');
        expect(matches).toHaveLength(0);
      });

      it('should not show default errors in child component', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        act(() => {
          fireEvent.submit(node);
        });

        const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
        expect(matches).toHaveLength(0);
      });

      describe('Custom error rendering', () => {
        const customStringWidget = (props: WidgetProps) => {
          return <div className='custom-text-widget'>{props.rawErrors}</div>;
        };

        it('should pass rawErrors down to custom widgets and render them', () => {
          const { node } = createFormComponent({
            schema,
            uiSchema: hideUiSchema,
            customValidate,
            templates: { BaseInputTemplate: customStringWidget },
          });

          act(() => {
            fireEvent.submit(node);
          });

          const matches = node.querySelectorAll('.custom-text-widget');
          expect(matches).toHaveLength(1);
          expect(matches[0]).toHaveTextContent('test');
        });
      });
    });

    describe('hideError flag false for child should show errors', () => {
      const hideUiSchema = {
        'ui:hideError': true,
        'ui:field': (props: FieldProps) => {
          const { uiSchema, ...fieldProps } = props; //eslint-disable-line
          // Pass the children schema in after removing the global one
          return <SchemaField {...fieldProps} uiSchema={{ 'ui:hideError': false }} />;
        },
      };

      it('should not render its own default errors', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        act(() => {
          fireEvent.submit(node);
        });

        const matches = node.querySelectorAll('form > .form-group > div > .error-detail .text-danger');
        expect(matches).toHaveLength(0);
      });

      it('should show errors on child component', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });

        act(() => {
          fireEvent.submit(node);
        });

        const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
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

    it('should render its own help', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
      });

      act(() => {
        fireEvent.submit(node);
      });

      const matches = node.querySelectorAll('form .form-group .form-group .help-block');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent(helpText);
    });

    it('should pass help to custom FieldHelpTemplate', () => {
      const customFieldHelp = (props: FieldHelpProps) => {
        return <div className='custom-field-help'>{props.help}</div>;
      };
      const { node } = createFormComponent({
        schema,
        uiSchema,
        templates: { FieldHelpTemplate: customFieldHelp },
      });

      act(() => {
        fireEvent.submit(node);
      });

      const matches = node.querySelectorAll('form .form-group .form-group .help-block');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll('form .form-group .form-group .custom-field-help');
      expect(customMatches[0]).toHaveTextContent(helpText);
    });

    it('should pass errors to custom FieldErrorTemplate, via uiSchema', () => {
      const customFieldHelp = (props: FieldHelpProps) => {
        return <div className='custom-field-help'>{props.help}</div>;
      };
      const uiSchema: UiSchema = {
        foo: { 'ui:help': helpText, 'ui:FieldHelpTemplate': customFieldHelp },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema,
      });

      act(() => {
        fireEvent.submit(node);
      });

      const matches = node.querySelectorAll('form .form-group .form-group .help-block');
      expect(matches).toHaveLength(0);

      const customMatches = node.querySelectorAll('form .form-group .form-group .custom-field-help');
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

    it('should render description with markdown', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          foo: {
            'ui:description': descText,
            'ui:enableMarkdownInDescription': true,
          },
        },
      });

      const field = node.querySelector('form .form-group .form-group .field-description')!;

      expect(field).toContainHTML('<strong>bold</strong>');
      expect(field).toContainHTML('<em>italic</em>');
      expect(field).toContainHTML('<code>code</code>');
    });

    it('should render description without html tags', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          foo: {
            'ui:description': descText,
          },
        },
      });

      const field = node.querySelector('form .form-group .form-group .field-description')!;

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
});
