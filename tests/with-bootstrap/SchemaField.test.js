import React from 'react';
import { fireEvent, within, cleanup } from 'react-testing-library';

import SchemaField from 'react-jsonschema-form/src/components/fields/SchemaField';
import TitleTemplate from 'react-jsonschema-form-bootstrap/src/components/templates/TitleTemplate';
import DescriptionTemplate from 'react-jsonschema-form-bootstrap/src/components/templates/DescriptionTemplate';
import widgets from 'react-jsonschema-form-bootstrap/src/components/widgets';

import { createFormComponent, suppressLogs } from './test_utils';

describe('SchemaField', () => {
  afterEach(cleanup);

  describe('Unsupported field', () => {
    it('should warn on invalid field type', () => {
      const { node } = createFormComponent({
        schema: { type: 'invalid' }
      });

      expect(node.querySelector('.unsupported-field')).toHaveTextContent(
        'Unknown field type invalid'
      );
    });
  });

  describe('Custom SchemaField component', () => {
    const CustomSchemaField = function(props) {
      return (
        <div id="custom">
          <SchemaField {...props} />
        </div>
      );
    };

    it('should use the specified custom SchemaType property', () => {
      const fields = { SchemaField: CustomSchemaField };
      const { node } = createFormComponent({
        schema: { type: 'string' },
        fields
      });

      expect(
        node.querySelectorAll('#custom > .field input[type=text]')
      ).toHaveLength(1);
    });
  });

  describe('ui:field support', () => {
    class MyObject extends React.Component {
      constructor(props) {
        super(props);
      }

      render() {
        return <div id="custom" />;
      }
    }

    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' }
      }
    };

    it('should use provided direct custom component for object', () => {
      const uiSchema = { 'ui:field': MyObject };

      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelectorAll('#custom')).toHaveLength(1);

      expect(node.querySelectorAll('label')).toHaveLength(0);
    });

    it('should use provided direct custom component for specific property', () => {
      const uiSchema = {
        foo: { 'ui:field': MyObject }
      };

      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelectorAll('#custom')).toHaveLength(1);

      expect(node.querySelectorAll('input')).toHaveLength(1);

      expect(node.querySelectorAll('label')).toHaveLength(1);
    });

    it('should provide custom field the expected fields', () => {
      let receivedProps;
      createFormComponent({
        schema,
        uiSchema: {
          'ui:field': class extends React.Component {
            constructor(props) {
              super(props);
              receivedProps = props;
            }
            render() {
              return <div />;
            }
          }
        }
      });

      const { registry } = receivedProps;
      /**
       * I know that Object.keys doesn't guarantee the exact order of keys
       * but it works here. Maybe we can create custom matcher. ;)
       */
      expect(Object.keys(registry.widgets)).toEqual(Object.keys(widgets));
      expect(registry.definitions).toEqual({});
      expect(typeof registry.fields).toBe('object');
      expect(registry.fields.SchemaField).toEqual(SchemaField);
      expect(registry.templates.TitleTemplate).toEqual(TitleTemplate);
      expect(registry.templates.DescriptionTemplate).toEqual(
        DescriptionTemplate
      );
    });

    it('should use registered custom component for object', () => {
      const uiSchema = { 'ui:field': 'myobject' };
      const fields = { myobject: MyObject };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('#custom')).toHaveLength(1);
    });

    it('should handle referenced schema definitions', () => {
      const schema = {
        definitions: {
          foobar: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' }
            }
          }
        },
        $ref: '#/definitions/foobar'
      };
      const uiSchema = { 'ui:field': 'myobject' };
      const fields = { myobject: MyObject };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('#custom')).toHaveLength(1);
    });

    it('should not pass classNames to child component', () => {
      const CustomSchemaField = function(props) {
        return (
          <SchemaField
            {...props}
            uiSchema={{ ...props.uiSchema, 'ui:field': undefined }}
          />
        );
      };

      const schema = {
        type: 'string'
      };
      const uiSchema = {
        'ui:field': 'customSchemaField',
        classNames: 'foo'
      };
      const fields = { customSchemaField: CustomSchemaField };

      const { node } = createFormComponent({ schema, uiSchema, fields });

      expect(node.querySelectorAll('.foo')).toHaveLength(1);
    });
  });

  describe('label support', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' }
      }
    };

    it('should render label by default', () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelectorAll('label')).toHaveLength(1);
    });

    it('should render label if ui:options label is set to true', () => {
      const uiSchema = {
        foo: { 'ui:options': { label: true } }
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).toHaveLength(1);
    });

    it('should not render label if ui:options label is set to false', () => {
      const uiSchema = {
        foo: { 'ui:options': { label: false } }
      };

      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelectorAll('label')).toHaveLength(0);
    });
  });

  describe('description support', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string', description: 'A Foo field' },
        bar: { type: 'string' }
      }
    };

    it('should render description if available from the schema', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('#root_foo__description')).toHaveLength(1);
    });

    it('should render description if available from a referenced schema', () => {
      // Overriding.
      const schemaWithReference = {
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/foo' },
          bar: { type: 'string' }
        },
        definitions: {
          foo: {
            type: 'string',
            description: 'A Foo field'
          }
        }
      };
      const { node } = createFormComponent({
        schema: schemaWithReference
      });

      const matches = node.querySelectorAll('#root_foo__description');
      expect(matches).toHaveLength(1);
      expect(matches[0].textContent).toBe('A Foo field');
    });

    it('should not render description if not available from schema', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('#root_bar__description')).toHaveLength(0);
    });

    it('should render a customized description field', () => {
      const CustomDescriptionTemplate = ({ description }) => (
        <div id="custom">{description}</div>
      );

      const { node } = createFormComponent({
        schema,
        templates: {
          DescriptionTemplate: CustomDescriptionTemplate
        }
      });

      expect(node.querySelector('#custom').textContent).toEqual('A Foo field');
    });
  });

  describe('errors', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' }
      }
    };

    const uiSchema = {
      'ui:field': props => {
        const { uiSchema, ...fieldProps } = props; //eslint-disable-line
        return <SchemaField {...fieldProps} />;
      }
    };

    function validate(formData, errors) {
      errors.addError('container');
      errors.foo.addError('test');
      return errors;
    }

    const submit = node =>
      suppressLogs('error', () => {
        fireEvent.submit(node);
      });

    it('should render it\'s own errors', () => {
      const { node, queryByText } = createFormComponent({
        schema,
        uiSchema,
        validate
      });

      submit(node);

      expect(queryByText('container')).toBeInTheDOM();
    });

    it('should pass errors to child component', () => {
      const { node, queryById } = createFormComponent({
        schema,
        uiSchema,
        validate
      });
      const fooField = queryById('foo');

      submit(node);

      expect(
        within(fooField).queryAllByTestId('error-detail__item')
      ).toHaveLength(1);
      expect(within(fooField).queryByText('test')).toBeInTheDOM();
    });

    describe('Custom error rendering', () => {
      const customStringWidget = props => {
        return <div className="custom-text-widget">{props.rawErrors}</div>;
      };

      it('should pass rawErrors down to custom widgets', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          validate,
          widgets: { BaseInput: customStringWidget }
        });
        submit(node);

        const matches = node.querySelectorAll('.custom-text-widget');
        expect(matches).toHaveLength(1);
        expect(matches[0].textContent).toEqual('test');
      });
    });
  });
});
