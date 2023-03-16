import { expect } from 'chai';
import { Simulate } from 'react-dom/test-utils';
import sinon from 'sinon';
import { UI_GLOBAL_OPTIONS_KEY } from '@rjsf/utils';

import SchemaField from '../src/components/fields/SchemaField';
import { createFormComponent, createSandbox, submitForm } from './test_utils';

describe('ObjectField', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('schema', () => {
    const schema = {
      type: 'object',
      title: 'my object',
      description: 'my description',
      required: ['foo'],
      default: {
        foo: 'hey',
        bar: true,
      },
      properties: {
        foo: {
          title: 'Foo',
          type: 'string',
        },
        bar: {
          type: 'boolean',
        },
      },
    };

    it('should render a fieldset', () => {
      const { node } = createFormComponent({ schema });

      const fieldset = node.querySelectorAll('fieldset');
      expect(fieldset).to.have.length.of(1);
      expect(fieldset[0].id).eql('root');
    });

    it('should render a fieldset legend', () => {
      const { node } = createFormComponent({ schema });

      const legend = node.querySelector('fieldset > legend');

      expect(legend.textContent).eql('my object');
      expect(legend.id).eql('root__title');
    });

    it('should render a hidden object', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:widget': 'hidden',
        },
      });
      expect(node.querySelector('div.hidden > fieldset')).to.exist;
    });

    it('should render a customized title', () => {
      const CustomTitleField = ({ title }) => <div id='custom'>{title}</div>;

      const { node } = createFormComponent({
        schema,
        templates: {
          TitleFieldTemplate: CustomTitleField,
        },
      });
      expect(node.querySelector('fieldset > #custom').textContent).to.eql('my object');
    });

    it('should render a customized description', () => {
      const CustomDescriptionField = ({ description }) => <div id='custom'>{description}</div>;

      const { node } = createFormComponent({
        schema,
        templates: { DescriptionFieldTemplate: CustomDescriptionField },
      });
      expect(node.querySelector('fieldset > #custom').textContent).to.eql('my description');
    });

    it('should render a default property label', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.field-boolean label').textContent).eql('bar');
    });

    it('should render a string property', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('.field input[type=text]')).to.have.length.of(1);
    });

    it('should render a boolean property', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('.field input[type=checkbox]')).to.have.length.of(1);
    });

    it('should handle a default object value', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.field input[type=text]').value).eql('hey');
      expect(node.querySelector('.field input[type=checkbox]').checked).eql(true);
    });

    it('should handle required values', () => {
      const { node } = createFormComponent({ schema });

      // Required field is <input type="text" required="">
      expect(node.querySelector('input[type=text]').getAttribute('required')).eql('');
      expect(node.querySelector('.field-string label').textContent).eql('Foo*');
    });

    it('should fill fields with form data', () => {
      const { node } = createFormComponent({
        schema,
        formData: {
          foo: 'hey',
          bar: true,
        },
      });

      expect(node.querySelector('.field input[type=text]').value).eql('hey');
      expect(node.querySelector('.field input[type=checkbox]').checked).eql(true);
    });

    it('should handle object fields change events', () => {
      const { node, onChange } = createFormComponent({ schema });

      Simulate.change(node.querySelector('input[type=text]'), {
        target: { value: 'changed' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { foo: 'changed' },
        },
        'root_foo'
      );
    });

    it('should handle object fields with blur events', () => {
      const onBlur = sandbox.spy();
      const { node } = createFormComponent({ schema, onBlur });

      const input = node.querySelector('input[type=text]');
      Simulate.blur(input, {
        target: { value: 'changed' },
      });

      expect(onBlur.calledWith(input.id, 'changed')).to.be.true;
    });

    it('should handle object fields with focus events', () => {
      const onFocus = sandbox.spy();
      const { node } = createFormComponent({ schema, onFocus });

      const input = node.querySelector('input[type=text]');
      Simulate.focus(input, {
        target: { value: 'changed' },
      });

      expect(onFocus.calledWith(input.id, 'changed')).to.be.true;
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input[type=text]').id).eql('root_foo');
      expect(node.querySelector('input[type=checkbox]').id).eql('root_bar');
    });

    it('should pass form context to schema field', () => {
      const formContext = {
        root: 'root-id',
        root_foo: 'foo-id',
        root_bar: 'bar-id',
      };
      function CustomSchemaField(props) {
        const { formContext, idSchema } = props;
        return (
          <>
            <code id={formContext[idSchema.$id]}>Ha</code>
            <SchemaField {...props} />
          </>
        );
      }
      const { node } = createFormComponent({
        schema,
        formContext,
        fields: { SchemaField: CustomSchemaField },
      });

      const codeBlocks = node.querySelectorAll('code');
      expect(codeBlocks).to.have.length(3);
      Object.keys(formContext).forEach((key) => {
        expect(node.querySelector(`code#${formContext[key]}`)).to.exist;
      });
    });
  });

  describe('fields ordering', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
        baz: { type: 'string' },
        qux: { type: 'string' },
      },
    };

    it('should use provided order', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['baz', 'qux', 'bar', 'foo'],
        },
      });
      const labels = [].map.call(node.querySelectorAll('.field > label'), (l) => l.textContent);

      expect(labels).eql(['baz', 'qux', 'bar', 'foo']);
    });

    it('should insert unordered properties at wildcard position', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['baz', '*', 'foo'],
        },
      });
      const labels = [].map.call(node.querySelectorAll('.field > label'), (l) => l.textContent);

      expect(labels).eql(['baz', 'bar', 'qux', 'foo']);
    });

    it('should use provided order also if order list contains extraneous properties', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['baz', 'qux', 'bar', 'wut?', 'foo', 'huh?'],
        },
      });

      const labels = [].map.call(node.querySelectorAll('.field > label'), (l) => l.textContent);

      expect(labels).eql(['baz', 'qux', 'bar', 'foo']);
    });

    it('should throw when order list misses an existing property', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['baz', 'bar'],
        },
      });

      expect(node.querySelector('.config-error').textContent).to.match(/does not contain properties 'foo', 'qux'/);
    });

    it('should throw when more than one wildcard is present', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['baz', '*', 'bar', '*'],
        },
      });

      expect(node.querySelector('.config-error').textContent).to.match(/contains more than one wildcard/);
    });

    it('should order referenced schema definitions', () => {
      const refSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef' },
          bar: { $ref: '#/definitions/testdef' },
        },
      };

      const { node } = createFormComponent({
        schema: refSchema,
        uiSchema: {
          'ui:order': ['bar', 'foo'],
        },
      });
      const labels = [].map.call(node.querySelectorAll('.field > label'), (l) => l.textContent);

      expect(labels).eql(['bar', 'foo']);
    });

    it('should order referenced object schema definition properties', () => {
      const refSchema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
            },
          },
        },
        type: 'object',
        properties: {
          root: { $ref: '#/definitions/testdef' },
        },
      };

      const { node } = createFormComponent({
        schema: refSchema,
        uiSchema: {
          root: {
            'ui:order': ['bar', 'foo'],
          },
        },
      });
      const labels = [].map.call(node.querySelectorAll('.field > label'), (l) => l.textContent);

      expect(labels).eql(['bar', 'foo']);
    });

    it('should render the widget with the expected id', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
          bar: { type: 'string' },
        },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['bar', 'foo'],
        },
      });

      const ids = [].map.call(node.querySelectorAll('input[type=text]'), (node) => node.id);
      expect(ids).eql(['root_bar', 'root_foo']);
    });
  });

  describe('Title', () => {
    const TitleFieldTemplate = (props) => <div id={`title-${props.title}`} />;

    const templates = { TitleFieldTemplate };

    it('should pass field name to TitleFieldTemplate if there is no title', () => {
      const schema = {
        type: 'object',
        properties: {
          object: {
            type: 'object',
            properties: {},
          },
        },
      };

      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-object')).to.not.be.null;
    });

    it('should pass schema title to TitleFieldTemplate', () => {
      const schema = {
        type: 'object',
        properties: {},
        title: 'test',
      };

      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-test')).to.not.be.null;
    });

    it('should pass empty schema title to TitleFieldTemplate', () => {
      const schema = {
        type: 'object',
        properties: {},
        title: '',
      };
      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-')).to.be.null;
    });
  });

  describe('additionalProperties', () => {
    const schema = {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
    };

    it('should automatically add a property field if in formData', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelectorAll('.field-string')).to.have.length.of(1);
    });

    it('uiSchema title should not affect additionalProperties', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          additionalProperties: {
            'ui:title': 'CustomName',
          },
        },
        formData: {
          property1: 'test',
        },
      });
      const labels = node.querySelectorAll('label.control-label');
      expect(labels[0].textContent).eql('property1 Key');
      expect(labels[1].textContent).eql('property1');
    });

    it('uiSchema title should update additionalProperties object title', () => {
      const objectSchema = {
        type: 'object',
        properties: {
          main: {
            type: 'object',
            properties: {},
            additionalProperties: {
              type: 'object',
              title: 'propTitle',
              properties: {
                firstName: {
                  type: 'string',
                  title: 'First name',
                },
              },
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema: objectSchema,
        uiSchema: {
          main: {
            additionalProperties: {
              'ui:title': 'CustomName',
            },
          },
        },
        formData: {
          main: {
            property1: {
              firstName: 'hello',
            },
          },
        },
      });
      const labels = [...node.querySelectorAll('label.control-label')].map((n) => n.textContent);
      expect(labels).to.include('property1 Key');
      const objectTitle = node.querySelector('.form-additional > fieldset > legend');
      expect(objectTitle.textContent).eql('CustomName');
    });

    it('should not throw validation errors if additionalProperties is undefined', () => {
      const undefinedAPSchema = {
        ...schema,
        properties: { second: { type: 'string' } },
      };
      delete undefinedAPSchema.additionalProperties;
      const { node, onSubmit, onError } = createFormComponent({
        schema: undefinedAPSchema,
        formData: { nonschema: 1 },
      });

      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: { nonschema: 1 },
      });

      sinon.assert.notCalled(onError);
    });

    it('should throw a validation error if additionalProperties is false', () => {
      const { node, onSubmit, onError } = createFormComponent({
        schema: {
          ...schema,
          additionalProperties: false,
          properties: { second: { type: 'string' } },
        },
        formData: { nonschema: 1 },
      });
      submitForm(node);
      sinon.assert.notCalled(onSubmit);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          message: 'must NOT have additional properties',
          name: 'additionalProperties',
          params: { additionalProperty: 'nonschema' },
          property: '',
          schemaPath: '#/additionalProperties',
          stack: 'must NOT have additional properties',
        },
      ]);
    });

    it('should still obey properties if additionalProperties is defined', () => {
      const { node } = createFormComponent({
        schema: {
          ...schema,
          properties: {
            definedProperty: {
              type: 'string',
            },
          },
        },
      });

      expect(node.querySelectorAll('.field-string')).to.have.length.of(1);
    });

    it('should render a label for the additional property key', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector("[for='root_first-key']").textContent).eql('first Key');
    });

    it('should render a label for the additional property key if additionalProperties is true', () => {
      const { node } = createFormComponent({
        schema: { ...schema, additionalProperties: true },
        formData: { first: 1 },
      });

      expect(node.querySelector("[for='root_first-key']").textContent).eql('first Key');
    });

    it('should not render a label for the additional property key if additionalProperties is false', () => {
      const { node } = createFormComponent({
        schema: { ...schema, additionalProperties: false },
        formData: { first: 1 },
      });

      expect(node.querySelector("[for='root_first-key']")).eql(null);
    });

    it('should render a text input for the additional property key', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector('#root_first-key').value).eql('first');
    });

    it('should render a label for the additional property value', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector("[for='root_first']").textContent).eql('first');
    });

    it('should render a text input for the additional property value', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector('#root_first').value).eql('1');
    });

    it('should rename formData key if key input is renamed', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      const textNode = node.querySelector('#root_first-key');
      Simulate.blur(textNode, {
        target: { value: 'newFirst' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { newFirst: 1, first: undefined },
        },
        'root'
      );
    });

    it('should retain and display user-input data if key-value pair has a title present in the schema when renaming key', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          additionalProperties: {
            title: 'Custom title',
            type: 'string',
          },
        },
        formData: { 'Custom title': 1 },
      });

      const textNode = node.querySelector('#root_Custom\\ title-key');
      Simulate.blur(textNode, {
        target: { value: 'Renamed custom title' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { 'Renamed custom title': 1 },
        },
        'root'
      );

      const keyInput = node.querySelector('#root_Renamed\\ custom\\ title-key');
      expect(keyInput.value).eql('Renamed custom title');

      const keyInputLabel = node.querySelector('label[for="root_Renamed\\ custom\\ title-key"]');
      expect(keyInputLabel.textContent).eql('Renamed custom title Key');
    });

    it('should retain object title when renaming key', () => {
      const { node } = createFormComponent({
        schema: {
          title: 'Object title',
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
        },
        formData: { 'Custom title': 1 },
      });

      const textNode = node.querySelector('#root_Custom\\ title-key');
      Simulate.blur(textNode, {
        target: { value: 'Renamed custom title' },
      });

      const title = node.querySelector('#root__title');
      expect(title.textContent).eql('Object title');
    });

    it('should keep order of renamed key-value pairs while renaming key', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { first: 1, second: 2, third: 3 },
      });

      const textNode = node.querySelector('#root_second-key');
      Simulate.blur(textNode, {
        target: { value: 'newSecond' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { first: 1, newSecond: 2, third: 3 },
        },
        'root'
      );

      expect(Object.keys(onChange.lastCall.args[0].formData)).eql(['first', 'newSecond', 'third']);
    });

    it('should attach suffix to formData key if new key already exists when key input is renamed', () => {
      const formData = {
        first: 1,
        second: 2,
      };
      const { node, onChange } = createFormComponent({
        schema,
        formData,
      });

      const textNode = node.querySelector('#root_first-key');
      Simulate.blur(textNode, {
        target: { value: 'second' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { second: 2, 'second-1': 1 },
        },
        'root'
      );
    });

    it('uses a custom separator between the duplicate key name and the suffix', () => {
      const formData = {
        first: 1,
        second: 2,
      };
      const { node, onChange } = createFormComponent({
        schema,
        formData,
        uiSchema: {
          'ui:duplicateKeySuffixSeparator': '_',
        },
      });

      const textNode = node.querySelector('#root_first-key');
      Simulate.blur(textNode, {
        target: { value: 'second' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { second: 2, second_1: 1 },
        },
        'root'
      );
    });

    it('uses a global custom separator between the duplicate key name and the suffix', () => {
      const formData = {
        first: 1,
        second: 2,
      };
      const { node, onChange } = createFormComponent({
        schema,
        formData,
        uiSchema: {
          [UI_GLOBAL_OPTIONS_KEY]: {
            duplicateKeySuffixSeparator: '_',
          },
        },
      });

      const textNode = node.querySelector('#root_first-key');
      Simulate.blur(textNode, {
        target: { value: 'second' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { second: 2, second_1: 1 },
        },
        'root'
      );
    });

    it('should not attach suffix when input is only clicked', () => {
      const formData = {
        first: 1,
      };
      const { node, onChange } = createFormComponent({
        schema,
        formData,
      });

      const textNode = node.querySelector('#root_first-key');
      Simulate.blur(textNode);

      sinon.assert.notCalled(onChange);
    });

    it('should continue incrementing suffix to formData key until that key name is unique after a key input collision', () => {
      const formData = {
        first: 1,
        second: 2,
        'second-1': 2,
        'second-2': 2,
        'second-3': 2,
        'second-4': 2,
        'second-5': 2,
        'second-6': 2,
      };
      const { node, onChange } = createFormComponent({
        schema,
        formData,
      });

      const textNode = node.querySelector('#root_first-key');
      Simulate.blur(textNode, {
        target: { value: 'second' },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: {
          second: 2,
          'second-1': 2,
          'second-2': 2,
          'second-3': 2,
          'second-4': 2,
          'second-5': 2,
          'second-6': 2,
          'second-7': 1,
        },
      });
    });

    it('should have an expand button', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.object-property-expand button')).not.eql(null);
    });

    it('should not have an expand button if expandable is false', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:options': { expandable: false } },
      });

      expect(node.querySelector('.object-property-expand button')).to.be.null;
    });

    it('should add a new property when clicking the expand button', () => {
      const { node, onChange } = createFormComponent({ schema });

      Simulate.click(node.querySelector('.object-property-expand button'));

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: {
          newKey: 'New Value',
        },
      });
    });

    it("should add a new property with suffix when clicking the expand button and 'newKey' already exists", () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { newKey: 1 },
      });

      Simulate.click(node.querySelector('.object-property-expand button'));
      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: {
          'newKey-1': 'New Value',
        },
      });
    });

    it('should add a property matching the additionalProperties schema', () => {
      // Specify that additionalProperties must be an array of strings
      const additionalPropertiesArraySchema = {
        ...schema,
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      };
      const { node, onChange } = createFormComponent({
        schema: additionalPropertiesArraySchema,
        formData: {},
      });

      Simulate.click(node.querySelector('.object-property-expand button'));

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: {
          newKey: [],
        },
      });
    });

    it('should add a string item if additionalProperties is true', () => {
      // Specify that additionalProperties is true
      const customSchema = {
        ...schema,
        additionalProperties: true,
      };
      const { node, onChange } = createFormComponent({
        schema: customSchema,
        formData: {},
      });

      Simulate.click(node.querySelector('.object-property-expand button'));

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: {
          newKey: 'New Value',
        },
      });
    });

    it('should not provide an expand button if length equals maxProperties', () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 1, ...schema },
        formData: { first: 1 },
      });

      expect(node.querySelector('.object-property-expand button')).to.be.null;
    });

    it('should provide an expand button if length is less than maxProperties', () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 2, ...schema },
        formData: { first: 1 },
      });

      expect(node.querySelector('.object-property-expand button')).not.eql(null);
    });

    it('should not provide an expand button if expandable is expliclty false regardless of maxProperties value', () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 2, ...schema },
        formData: { first: 1 },
        uiSchema: {
          'ui:options': {
            expandable: false,
          },
        },
      });

      expect(node.querySelector('.object-property-expand button')).to.be.null;
    });

    it('should ignore expandable value if maxProperties constraint is not satisfied', () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 1, ...schema },
        formData: { first: 1 },
        uiSchema: {
          'ui:options': {
            expandable: true,
          },
        },
      });

      expect(node.querySelector('.object-property-expand button')).to.be.null;
    });

    it('should not have delete button if expand button has not been clicked', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.form-group > .btn-danger')).eql(null);
    });

    it('should have delete button if expand button has been clicked', () => {
      const { node } = createFormComponent({
        schema,
      });

      expect(node.querySelector('.form-group > .form-additional > .form-additional + .col-xs-2 .btn-danger')).eql(null);

      Simulate.click(node.querySelector('.object-property-expand button'));

      expect(node.querySelector('.form-group > .row > .form-additional + .col-xs-2 > .btn-danger')).to.not.be.null;
    });

    it('delete button should delete key-value pair', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });
      expect(node.querySelector('#root_first-key').value).to.eql('first');
      Simulate.click(node.querySelector('.form-group > .row > .form-additional + .col-xs-2 > .btn-danger'));
      expect(node.querySelector('#root_first-key')).to.not.exist;
    });

    it('delete button should delete correct pair', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1, second: 2, third: 3 },
      });
      const selector = '.form-group > .row > .form-additional + .col-xs-2 > .btn-danger';
      expect(node.querySelectorAll(selector).length).to.eql(3);
      Simulate.click(node.querySelectorAll(selector)[1]);
      expect(node.querySelector('#root_second-key')).to.not.exist;
      expect(node.querySelectorAll(selector).length).to.eql(2);
    });

    it('deleting content of value input should not delete pair', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      Simulate.change(node.querySelector('#root_first'), {
        target: { value: '' },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: { first: '' },
      });
    });

    it('should change content of value input to boolean false', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          ...schema,
          additionalProperties: true,
        },
        formData: { first: true },
      });

      Simulate.change(node.querySelector('#root_first'), {
        target: { checked: false },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: { first: false },
      });
    });

    it('should change content of value input to number 0', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          ...schema,
          additionalProperties: true,
        },
        formData: { first: 1 },
      });

      Simulate.change(node.querySelector('#root_first'), {
        target: { value: 0 },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: { first: 0 },
      });
    });

    it('should change content of value input to null', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { first: 'str' },
      });

      Simulate.change(node.querySelector('#root_first'), {
        target: { value: null },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: { first: null },
      });
    });
  });
});
