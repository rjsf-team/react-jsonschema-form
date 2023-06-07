import { Component } from 'react';
import { expect } from 'chai';
import { Simulate } from 'react-dom/test-utils';
import { createSchemaUtils, englishStringTranslator } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import SchemaField from '../src/components/fields/SchemaField';

import { createFormComponent, createSandbox } from './test_utils';
import getDefaultRegistry from '../src/getDefaultRegistry';

describe('SchemaField', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('registry', () => {
    it('should provide expected registry as prop', () => {
      let receivedProps;
      const schema = {
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

      const { registry } = receivedProps;
      const defaultRegistry = getDefaultRegistry();
      expect(registry).eql({
        fields: defaultRegistry.fields,
        templates: defaultRegistry.templates,
        widgets: defaultRegistry.widgets,
        rootSchema: schema,
        formContext: {},
        schemaUtils,
        translateString: englishStringTranslator,
        globalUiOptions: undefined,
      });
    });
    it('should provide expected registry with globalUiOptions as prop', () => {
      let receivedProps;
      const schema = {
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

      const { registry } = receivedProps;
      const defaultRegistry = getDefaultRegistry();
      expect(registry).eql({
        fields: defaultRegistry.fields,
        templates: defaultRegistry.templates,
        widgets: defaultRegistry.widgets,
        rootSchema: schema,
        formContext: {},
        schemaUtils,
        translateString: englishStringTranslator,
        globalUiOptions: { copyable: true },
      });
    });
  });

  describe('Unsupported field', () => {
    it('should warn on invalid field type', () => {
      const { node } = createFormComponent({
        schema: { type: 'invalid' },
      });

      expect(node.querySelector('.unsupported-field').textContent).to.contain('Unknown field type invalid');
    });

    it('should be able to be overwritten with a custom UnsupportedField component', () => {
      const CustomUnsupportedField = function () {
        return <span id='custom'>Custom UnsupportedField</span>;
      };

      const templates = { UnsupportedFieldTemplate: CustomUnsupportedField };
      const { node } = createFormComponent({
        schema: { type: 'invalid' },
        templates,
      });

      expect(node.querySelectorAll('#custom')[0].textContent).to.eql('Custom UnsupportedField');
    });
  });

  describe('Custom SchemaField component', () => {
    const CustomSchemaField = function (props) {
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

      expect(node.querySelectorAll('#custom > .field input[type=text]')).to.have.length.of(1);
    });
  });

  describe('ui:field support', () => {
    class MyObject extends Component {
      constructor(props) {
        super(props);
      }

      render() {
        return <div id='custom' />;
      }
    }

    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };

    it('should use provided direct custom component for object', () => {
      const uiSchema = { 'ui:field': MyObject };

      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelectorAll('#custom')).to.have.length.of(1);

      expect(node.querySelectorAll('label')).to.have.length.of(0);
    });

    it('should use provided direct custom component for specific property', () => {
      const uiSchema = {
        foo: { 'ui:field': MyObject },
      };

      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelectorAll('#custom')).to.have.length.of(1);

      expect(node.querySelectorAll('input')).to.have.length.of(1);

      expect(node.querySelectorAll('label')).to.have.length.of(1);
    });

    it('should provide custom field the expected fields', () => {
      let receivedProps;
      createFormComponent({
        schema,
        uiSchema: {
          'ui:field': (props) => {
            receivedProps = props;
            return null;
          },
        },
      });

      const { registry } = receivedProps;
      const defaultRegistry = getDefaultRegistry();
      expect(registry.widgets).eql(defaultRegistry.widgets);
      expect(registry.rootSchema).eql(schema);
      expect(registry.fields).to.be.an('object');
      expect(registry.fields.SchemaField).eql(SchemaField);
      expect(registry.templates.TitleFieldTemplate).eql(defaultRegistry.templates.TitleFieldTemplate);
      expect(registry.templates.DescriptionFieldTemplate).eql(defaultRegistry.templates.DescriptionFieldTemplate);
    });

    it('should use registered custom component for object', () => {
      const uiSchema = { 'ui:field': 'myobject' };
      const fields = { myobject: MyObject };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('#custom')).to.have.length.of(1);
    });

    it('should handle referenced schema definitions', () => {
      const schema = {
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
      const uiSchema = { 'ui:field': 'myobject' };
      const fields = { myobject: MyObject };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('#custom')).to.have.length.of(1);
    });

    it('should not pass ui:classNames or ui:style to child component', () => {
      const CustomSchemaField = function (props) {
        return <SchemaField {...props} uiSchema={{ ...props.uiSchema, 'ui:field': undefined }} />;
      };

      const schema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:field': 'customSchemaField',
        'ui:classNames': 'foo',
        'ui:style': { color: 'red' },
      };
      const fields = { customSchemaField: CustomSchemaField };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('.foo')).to.have.length.of(1);
      expect(node.querySelectorAll("[style*='red']")).to.have.length.of(1);
    });
    it('should not pass ui:options { classNames or style } to child component', () => {
      const CustomSchemaField = function (props) {
        return <SchemaField {...props} uiSchema={{ ...props.uiSchema, 'ui:field': undefined }} />;
      };

      const schema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:field': 'customSchemaField',
        'ui:options': {
          classNames: 'foo',
          style: { color: 'red' },
        },
      };
      const fields = { customSchemaField: CustomSchemaField };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('.foo')).to.have.length.of(1);
      expect(node.querySelectorAll("[style*='red']")).to.have.length.of(1);
    });
  });

  describe('label support', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    it('should render label by default', () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelectorAll('label')).to.have.length.of(1);
    });

    it('should render label if ui:globaLOptions label is set to true', () => {
      const uiSchema = {
        'ui:globalOptions': { label: true },
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).to.have.length.of(1);
    });

    it('should not render label if ui:globalOptions label is set to false', () => {
      const uiSchema = {
        'ui:globalOptions': { label: false },
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).to.have.length.of(0);
    });

    it('should render label if ui:options label is set to true', () => {
      const uiSchema = {
        foo: { 'ui:options': { label: true } },
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).to.have.length.of(1);
    });

    it('should not render label if ui:options label is set to false', () => {
      const uiSchema = {
        foo: { 'ui:options': { label: false } },
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).to.have.length.of(0);
    });

    it('should render label even when type object is missing', () => {
      const schema = {
        title: 'test',
        properties: {
          foo: { type: 'string' },
        },
      };
      const { node } = createFormComponent({ schema });
      expect(node.querySelectorAll('label')).to.have.length.of(1);
    });
  });

  describe('description support', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string', description: 'A Foo field' },
        bar: { type: 'string' },
      },
    };

    it('should render description if available from the schema', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('#root_foo__description')).to.have.length.of(1);
    });

    it('should render description if available from a referenced schema', () => {
      // Overriding.
      const schemaWithReference = {
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
      expect(matches).to.have.length.of(1);
      expect(matches[0].textContent).to.equal('A Foo field');
    });

    it('should not render description if not available from schema', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('#root_bar__description')).to.have.length.of(0);
    });

    it('should render a customized description field', () => {
      const CustomDescriptionField = ({ description }) => <div id='custom'>{description}</div>;

      const { node } = createFormComponent({
        schema,
        templates: {
          DescriptionFieldTemplate: CustomDescriptionField,
        },
      });

      expect(node.querySelector('#custom').textContent).to.eql('A Foo field');
    });
  });

  describe('errors', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const uiSchema = {
      'ui:field': (props) => {
        const { uiSchema, ...fieldProps } = props; //eslint-disable-line
        return <SchemaField {...fieldProps} />;
      },
    };

    function customValidate(formData, errors) {
      errors.addError('container');
      errors.foo.addError('test');
      return errors;
    }

    it('should render its own errors', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
      });
      Simulate.submit(node);

      const matches = node.querySelectorAll('form > .form-group > div > .error-detail .text-danger');
      expect(matches).to.have.length.of(1);
      expect(matches[0].textContent).to.eql('container');
    });

    it('should pass errors to child component', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
      });
      Simulate.submit(node);

      const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
      expect(matches).to.have.length.of(1);
      expect(matches[0].textContent).to.contain('test');
    });

    it('should pass errors to custom FieldErrorTemplate', () => {
      const customFieldError = (props) => {
        return <div className='custom-field-error'>{props.errors}</div>;
      };
      const { node } = createFormComponent({
        schema,
        uiSchema,
        customValidate,
        templates: { FieldErrorTemplate: customFieldError },
      });
      Simulate.submit(node);

      const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
      expect(matches).to.have.length.of(0);

      const customMatches = node.querySelectorAll('form .form-group .form-group .custom-field-error');
      expect(customMatches[0].textContent).to.contain('test');
    });

    it('should pass errors to custom FieldErrorTemplate, via uiSchema', () => {
      const customFieldError = (props) => {
        return <div className='custom-field-error'>{props.errors}</div>;
      };
      const uiSchema = {
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
      Simulate.submit(node);

      const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
      expect(matches).to.have.length.of(0);

      const customMatches = node.querySelectorAll('form .form-group .form-group .custom-field-error');
      expect(customMatches[0].textContent).to.contain('test');
    });

    describe('Custom error rendering', () => {
      const customStringWidget = (props) => {
        return <div className='custom-text-widget'>{props.rawErrors}</div>;
      };

      it('should pass rawErrors down to custom widgets', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          customValidate,
          templates: { BaseInputTemplate: customStringWidget },
        });
        Simulate.submit(node);

        const matches = node.querySelectorAll('.custom-text-widget');
        expect(matches).to.have.length.of(1);
        expect(matches[0].textContent).to.eql('test');
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
        Simulate.submit(node);

        const matches = node.querySelectorAll('form > .form-group > div > .error-detail .text-danger');
        expect(matches).to.have.length.of(0);
      });

      it('should not show default errors in child component', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });
        Simulate.submit(node);

        const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
        expect(matches).to.have.length.of(0);
      });

      describe('Custom error rendering', () => {
        const customStringWidget = (props) => {
          return <div className='custom-text-widget'>{props.rawErrors}</div>;
        };

        it('should pass rawErrors down to custom widgets and render them', () => {
          const { node } = createFormComponent({
            schema,
            uiSchema: hideUiSchema,
            customValidate,
            templates: { BaseInputTemplate: customStringWidget },
          });
          Simulate.submit(node);

          const matches = node.querySelectorAll('.custom-text-widget');
          expect(matches).to.have.length.of(1);
          expect(matches[0].textContent).to.eql('test');
        });
      });
    });
    describe('hideError flag false for child should show errors', () => {
      const hideUiSchema = {
        'ui:hideError': true,
        'ui:field': (props) => {
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
        Simulate.submit(node);

        const matches = node.querySelectorAll('form > .form-group > div > .error-detail .text-danger');
        expect(matches).to.have.length.of(0);
      });

      it('should show errors on child component', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: hideUiSchema,
          customValidate,
        });
        Simulate.submit(node);

        const matches = node.querySelectorAll('form .form-group .form-group .text-danger');
        expect(matches).to.have.length.of(1);
        expect(matches[0].textContent).to.contain('test');
      });
    });
  });
  describe('help', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const helpText = 'help me!';
    const uiSchema = {
      foo: { 'ui:help': helpText },
    };

    it('should render its own help', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema,
      });
      Simulate.submit(node);

      const matches = node.querySelectorAll('form .form-group .form-group .help-block');
      expect(matches).to.have.length.of(1);
      expect(matches[0].textContent).to.eql(helpText);
    });

    it('should pass help to custom FieldHelpTemplate', () => {
      const customFieldHelp = (props) => {
        return <div className='custom-field-help'>{props.help}</div>;
      };
      const { node } = createFormComponent({
        schema,
        uiSchema,
        templates: { FieldHelpTemplate: customFieldHelp },
      });
      Simulate.submit(node);

      const matches = node.querySelectorAll('form .form-group .form-group .help-block');
      expect(matches).to.have.length.of(0);

      const customMatches = node.querySelectorAll('form .form-group .form-group .custom-field-help');
      expect(customMatches[0].textContent).to.contain(helpText);
    });

    it('should pass errors to custom FieldErrorTemplate, via uiSchema', () => {
      const customFieldHelp = (props) => {
        return <div className='custom-field-help'>{props.help}</div>;
      };
      const uiSchema = {
        foo: { 'ui:help': helpText, 'ui:FieldHelpTemplate': customFieldHelp },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema,
      });
      Simulate.submit(node);

      const matches = node.querySelectorAll('form .form-group .form-group .help-block');
      expect(matches).to.have.length.of(0);

      const customMatches = node.querySelectorAll('form .form-group .form-group .custom-field-help');
      expect(customMatches[0].textContent).to.contain(helpText);
    });
  });

  describe('markdown', () => {
    const schema = {
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

      const { innerHTML } = node.querySelector('form .form-group .form-group .field-description');

      expect(innerHTML).to.contains('<strong>');
      expect(innerHTML).to.contains('<em>');
      expect(innerHTML).to.contains('<code>');
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

      const { innerHTML, textContent } = node.querySelector('form .form-group .form-group .field-description');

      expect(innerHTML).to.not.contains('<strong>');
      expect(innerHTML).to.not.contains('<em>');
      expect(innerHTML).to.not.contains('<code>');
      expect(textContent).to.contains(descText);
    });
  });
});
