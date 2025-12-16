import {
  UI_GLOBAL_OPTIONS_KEY,
  RJSFSchema,
  FieldProps,
  FieldPathList,
  ErrorSchema,
  TitleFieldProps,
  DescriptionFieldProps,
  GenericObjectType,
} from '@rjsf/utils';
import { fireEvent, act } from '@testing-library/react';

import SchemaField from '../src/components/fields/SchemaField';
import ObjectField from '../src/components/fields/ObjectField';
import { TextWidgetTest } from './StringField.test';
import { createFormComponent, submitForm } from './testUtils';

const ObjectFieldTest = (props: FieldProps) => {
  const onChangeTest = (newFormData: any, path: FieldPathList, errorSchema?: ErrorSchema, id?: string) => {
    let newErrorSchema = errorSchema;
    if (newFormData !== 'test') {
      newErrorSchema = {
        ...errorSchema,
        __errors: ['Value must be "test"'],
      } as ErrorSchema;
    }
    props.onChange(newFormData, path, newErrorSchema, id);
  };
  return <ObjectField {...props} onChange={onChangeTest} />;
};

describe('ObjectField', () => {
  describe('schema', () => {
    const schema: RJSFSchema = {
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
      expect(fieldset).toHaveLength(1);
      expect(fieldset[0]).toHaveAttribute('id', 'root');
    });

    it('should render a fieldset legend', () => {
      const { node } = createFormComponent({ schema });

      const legend = node.querySelector('fieldset > legend');

      expect(legend).toHaveTextContent('my object');
      expect(legend).toHaveAttribute('id', 'root__title');
    });

    it('should render a hidden object', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:widget': 'hidden',
        },
      });
      expect(node.querySelector('div.hidden > fieldset')).toBeInTheDocument();
    });

    it('should render a customized title', () => {
      const CustomTitleField = ({ title }: TitleFieldProps) => <div id='custom'>{title}</div>;

      const { node } = createFormComponent({
        schema,
        templates: {
          TitleFieldTemplate: CustomTitleField,
        },
      });
      expect(node.querySelector('fieldset > #custom')).toHaveTextContent('my object');
    });

    it('should render a customized description', () => {
      const CustomDescriptionField = ({ description }: DescriptionFieldProps) => <div id='custom'>{description}</div>;

      const { node } = createFormComponent({
        schema,
        templates: { DescriptionFieldTemplate: CustomDescriptionField },
      });
      expect(node.querySelector('fieldset > #custom')).toHaveTextContent('my description');
    });

    it('should render a default property label', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.rjsf-field-boolean label')).toHaveTextContent('bar');
    });

    it('should render a string property', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('.rjsf-field input[type=text]')).toHaveLength(1);
    });

    it('should render a boolean property', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('.rjsf-field input[type=checkbox]')).toHaveLength(1);
    });

    it('should handle a default object value', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.rjsf-field input[type=text]')).toHaveValue('hey');
      expect(node.querySelector('.rjsf-field input[type=checkbox]')).toBeChecked();
    });

    it('should handle required values', () => {
      const { node } = createFormComponent({ schema });

      // Required field is <input type="text" required="">
      expect(node.querySelector('input[type=text]')).toHaveAttribute('required', '');
      expect(node.querySelector('.rjsf-field-string label')).toHaveTextContent('Foo*');
    });

    it('should fill fields with form data', () => {
      const { node } = createFormComponent({
        schema,
        formData: {
          foo: 'hey',
          bar: true,
        },
      });

      expect(node.querySelector('.rjsf-field input[type=text]')).toHaveValue('hey');
      expect(node.querySelector('.rjsf-field input[type=checkbox]')).toBeChecked();
    });

    it('should handle object fields change events', () => {
      const { node, onChange } = createFormComponent({ schema });

      fireEvent.change(node.querySelector('input[type=text]')!, {
        target: { value: 'changed' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: expect.objectContaining({ foo: 'changed' }),
        }),
        'root_foo',
      );
    });

    it('should handle object fields with blur events', () => {
      const onBlur = jest.fn();
      const { node } = createFormComponent({ schema, onBlur });

      const input = node.querySelector('input[type=text]');
      fireEvent.blur(input!, {
        target: { value: 'changed' },
      });

      expect(onBlur).toHaveBeenCalledWith(input?.id, 'changed');
    });

    it('should handle object fields with focus events', () => {
      const onFocus = jest.fn();
      const { node } = createFormComponent({ schema, onFocus });

      const input = node.querySelector('input[type=text]');
      fireEvent.focus(input!, {
        target: { value: 'changed' },
      });

      expect(onFocus).toHaveBeenCalledWith(input?.id, 'changed');
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input[type=text]')).toHaveAttribute('id', 'root_foo');
      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('id', 'root_bar');
    });

    it('should pass form context to schema field', () => {
      const formContext: GenericObjectType = {
        root: 'root-id',
        root_foo: 'foo-id',
        root_bar: 'bar-id',
      };
      function CustomSchemaField(props: FieldProps) {
        const {
          registry: { formContext },
          fieldPathId,
        } = props;
        return (
          <>
            <code id={formContext[fieldPathId.$id]}>Ha</code>
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
      expect(codeBlocks).toHaveLength(3);
      Object.keys(formContext).forEach((key) => {
        expect(node.querySelector(`code#${formContext[key]}`)).toBeInTheDocument();
      });
    });

    it('Check schema with if/then/else conditions and activate the then/else subschemas, the onChange event should reflect the actual validation errors', () => {
      const schema: RJSFSchema = {
        type: 'object',
        _const: 'test',
        required: ['checkbox'],
        properties: {
          checkbox: {
            type: 'boolean',
          },
        },
        if: {
          required: ['checkbox'],
          properties: {
            checkbox: {
              const: true,
            },
          },
        },
        then: {
          required: ['text'],
          properties: {
            text: {
              type: 'string',
            },
          },
        },
      };

      const { node, onChange } = createFormComponent({
        schema,
        formData: {
          checkbox: true,
        },
        liveValidate: true,
      });

      // Uncheck the checkbox
      fireEvent.click(node.querySelector('input[type=checkbox]')!);

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { checkbox: false },
          errorSchema: {},
          errors: [],
        }),
        'root_checkbox',
      );
    });

    it('should validate AJV $data reference ', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            title: 'E-mail',
            format: 'email',
          },
          emailConfirm: {
            type: 'string',
            const: {
              $data: '/email',
            },
            title: 'Confirm e-mail',
            format: 'email',
          },
        },
      };
      const { node, rerender } = createFormComponent({
        schema,
        formData: {
          email: 'Appie@hotmail.com',
          emailConfirm: 'wrong@wrong.com',
        },
        liveValidate: true,
      });

      // trigger the errors by submitting the form since initial render no longer shows them
      submitForm(node);

      const errorMessages = node.querySelectorAll('#root_emailConfirm__error');
      expect(errorMessages).toHaveLength(1);

      rerender({
        schema,
        formData: {
          email: 'Appie@hotmail.com',
          emailConfirm: 'Appie@hotmail.com',
        },
        liveValidate: true,
      });

      expect(node.querySelectorAll('#root_foo__error')).toHaveLength(0);
    });

    it('Check that when formData changes, the form should re-validate', () => {
      const { node, rerender } = createFormComponent({
        schema,
        formData: {
          foo: null,
        },
        liveValidate: true,
      });

      // trigger the errors by submitting the form since initial render no longer shows them
      submitForm(node);

      const errorMessages = node.querySelectorAll('#root_foo__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessageContent = node.querySelector('#root_foo__error .text-danger');
      expect(errorMessageContent).toHaveTextContent('must be string');

      rerender({ schema, formData: { foo: 'test' }, liveValidate: true });

      expect(node.querySelectorAll('#root_foo__error')).toHaveLength(0);
    });

    it('raise an error and check if the error is displayed', () => {
      const { node } = createFormComponent({
        schema,
        fields: {
          ObjectField: ObjectFieldTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'hello' } });
      });

      const errorMessages = node.querySelectorAll('#root_foo__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessageContent = node.querySelector('#root_foo__error .text-danger');
      expect(errorMessageContent).toHaveTextContent('Value must be "test"');
    });

    it('should not raise an error if value is correct', () => {
      const { node } = createFormComponent({
        schema,
        fields: {
          ObjectField: ObjectFieldTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      const errorMessages = node.querySelectorAll('#root_foo__error');
      expect(errorMessages).toHaveLength(0);
    });

    it('should clear an error if value is entered correctly', () => {
      const { node } = createFormComponent({
        schema,
        fields: {
          ObjectField: ObjectFieldTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'hello' } });
      });

      let errorMessages = node.querySelectorAll('#root_foo__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessageContent = node.querySelector('#root_foo__error .text-danger');
      expect(errorMessageContent).toHaveTextContent('Value must be "test"');

      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      errorMessages = node.querySelectorAll('#root_foo__error');
      expect(errorMessages).toHaveLength(0);
    });

    it('raise an error and check if the error is displayed using custom text widget', () => {
      const { node } = createFormComponent({
        schema,
        widgets: {
          TextWidget: TextWidgetTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'hello' } });
      });

      const errorMessages = node.querySelectorAll('#root_foo__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessageContent = node.querySelector('#root_foo__error .text-danger');
      expect(errorMessageContent).toHaveTextContent('Value must be "test"');
    });

    it('should not raise an error if value is correct using custom text widget', () => {
      const { node } = createFormComponent({
        schema,
        widgets: {
          TextWidget: TextWidgetTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      const errorMessages = node.querySelectorAll('#root_foo__error');
      expect(errorMessages).toHaveLength(0);
    });

    it('should clear an error if value is entered correctly using custom text widget', () => {
      const { node } = createFormComponent({
        schema,
        widgets: {
          TextWidget: TextWidgetTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'hello' } });
      });

      let errorMessages = node.querySelectorAll('#root_foo__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessageContent = node.querySelector('#root_foo__error .text-danger');
      expect(errorMessageContent).toHaveTextContent('Value must be "test"');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      errorMessages = node.querySelectorAll('#root_foo__error');
      expect(errorMessages).toHaveLength(0);
    });

    it('should not copy errors when name has dotted-path similar to real property', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          'Foo.Bar': {
            type: 'string',
            minLength: 5,
          },
          Foo: {
            type: 'object',
            properties: {
              Bar: {
                type: 'string',
                minLength: 2,
              },
            },
          },
        },
      };
      const formData = {
        'Foo.Bar': 'FooBar',
        Foo: {
          Bar: 'B',
        },
      };
      const { node } = createFormComponent({ schema, formData });
      // click submit
      submitForm(node);
      console.log(node.innerHTML);
      const fooDotBarErrors = node.querySelectorAll('#root_Foo.Bar__error');
      expect(fooDotBarErrors).toHaveLength(0);
      const fooBarErrors = node.querySelectorAll('#root_Foo_Bar__error');
      expect(fooBarErrors).toHaveLength(1);
    });
  });

  describe('fields ordering', () => {
    const schema: RJSFSchema = {
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
      const labels = [].map.call(node.querySelectorAll('.rjsf-field > label'), (l: Element) => l.textContent);

      expect(labels).toEqual(['baz', 'qux', 'bar', 'foo']);
    });

    it('should insert unordered properties at wildcard position', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['baz', '*', 'foo'],
        },
      });
      const labels = [].map.call(node.querySelectorAll('.rjsf-field > label'), (l: Element) => l.textContent);

      expect(labels).toEqual(['baz', 'bar', 'qux', 'foo']);
    });

    it('should use provided order also if order list contains extraneous properties', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['baz', 'qux', 'bar', 'wut?', 'foo', 'huh?'],
        },
      });

      const labels = [].map.call(node.querySelectorAll('.rjsf-field > label'), (l: Element) => l.textContent);

      expect(labels).toEqual(['baz', 'qux', 'bar', 'foo']);
    });

    it('should throw when order list misses an existing property', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['baz', 'bar'],
        },
      });

      expect(node.querySelector('.rjsf-config-error')).toHaveTextContent(/does not contain properties 'foo', 'qux'/);
    });

    it('should throw when more than one wildcard is present', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:order': ['baz', '*', 'bar', '*'],
        },
      });

      expect(node.querySelector('.rjsf-config-error')).toHaveTextContent(/contains more than one wildcard/);
    });

    it('should order referenced schema definitions', () => {
      const refSchema: RJSFSchema = {
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
      const labels = [].map.call(node.querySelectorAll('.rjsf-field > label'), (l: Element) => l.textContent);

      expect(labels).toEqual(['bar', 'foo']);
    });

    it('should order referenced object schema definition properties', () => {
      const refSchema: RJSFSchema = {
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
      const labels = [].map.call(node.querySelectorAll('.rjsf-field > label'), (l: Element) => l.textContent);

      expect(labels).toEqual(['bar', 'foo']);
    });

    it('should render the widget with the expected id', () => {
      const schema: RJSFSchema = {
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

      const ids = [].map.call(node.querySelectorAll('input[type=text]'), (node: Element) => node.id);
      expect(ids).toEqual(['root_bar', 'root_foo']);
    });
  });

  describe('Title', () => {
    const TitleFieldTemplate = (props: TitleFieldProps) => <div id={`title-${props.title}`} />;

    const templates = { TitleFieldTemplate };

    it('should pass field name to TitleFieldTemplate if there is no title', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          object: {
            type: 'object',
            properties: {},
          },
        },
      };

      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-object')).not.toBeNull();
    });

    it('should pass schema title to TitleFieldTemplate', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {},
        title: 'test',
      };

      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-test')).not.toBeNull();
    });

    it('should pass empty schema title to TitleFieldTemplate', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {},
        title: '',
      };
      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-')).toBeNull();
    });
  });

  describe('additionalProperties', () => {
    const schema: RJSFSchema = {
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

      expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(1);
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
      expect(labels[0]).toHaveTextContent('property1 Key');
      expect(labels[1]).toHaveTextContent('property1');
    });

    it('uiSchema title should update additionalProperties object title', () => {
      const objectSchema: RJSFSchema = {
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
      expect(labels).toContain('property1 Key');
      const objectTitle = node.querySelector('.form-additional > fieldset > legend');
      expect(objectTitle).toHaveTextContent('CustomName');
    });

    it('should not throw validation errors if additionalProperties is undefined', () => {
      const undefinedAPSchema: RJSFSchema = {
        ...schema,
        properties: { second: { type: 'string' } },
      };
      delete undefinedAPSchema.additionalProperties;
      const { node, onSubmit, onError } = createFormComponent({
        schema: undefinedAPSchema,
        formData: { nonschema: 1 },
      });

      submitForm(node);
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { nonschema: 1 },
        }),
        expect.objectContaining({ type: 'submit' }),
      );

      expect(onError).not.toHaveBeenCalled();
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
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenLastCalledWith([
        {
          message: 'must NOT have additional properties',
          name: 'additionalProperties',
          params: { additionalProperty: 'nonschema' },
          property: '',
          schemaPath: '#/additionalProperties',
          stack: 'must NOT have additional properties',
          title: '',
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

      expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(1);
    });

    it('should render a label for the additional property key', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector("[for='root_first-key']")).toHaveTextContent('first Key');
    });

    it('should render a label for the additional property key if additionalProperties is true', () => {
      const { node } = createFormComponent({
        schema: { ...schema, additionalProperties: true },
        formData: { first: 1 },
      });

      expect(node.querySelector("[for='root_first-key']")).toHaveTextContent('first Key');
    });

    it('should not render a label for the additional property key if additionalProperties is false', () => {
      const { node } = createFormComponent({
        schema: { ...schema, additionalProperties: false },
        formData: { first: 1 },
      });

      expect(node.querySelector("[for='root_first-key']")).toBeNull();
    });

    it('should render a text input for the additional property key', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector('#root_first-key')).toHaveValue('first');
    });

    it('should render a label for the additional property value', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector("[for='root_first']")).toHaveTextContent('first');
    });

    it('should render a text input for the additional property value', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector('#root_first')).toHaveValue('1');
    });

    it('should rename formData key if key input is renamed', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      const textNode = node.querySelector('#root_first-key');
      fireEvent.blur(textNode!, {
        target: { value: 'newFirst' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { newFirst: 1, first: undefined },
        }),
        'root',
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
      fireEvent.blur(textNode!, {
        target: { value: 'Renamed custom title' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { 'Renamed custom title': 1 },
        }),
        'root',
      );

      const keyInput = node.querySelector('#root_Renamed\\ custom\\ title-key');
      expect(keyInput).toHaveValue('Renamed custom title');

      const keyInputLabel = node.querySelector('label[for="root_Renamed\\ custom\\ title-key"]');
      expect(keyInputLabel).toHaveTextContent('Renamed custom title Key');
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
      fireEvent.blur(textNode!, {
        target: { value: 'Renamed custom title' },
      });

      const title = node.querySelector('#root__title');
      expect(title).toHaveTextContent('Object title');
    });

    it('should keep order of renamed key-value pairs while renaming key', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { first: 1, second: 2, third: 3 },
      });

      const textNode = node.querySelector('#root_second-key');
      fireEvent.blur(textNode!, {
        target: { value: 'newSecond' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { first: 1, newSecond: 2, third: 3 },
        }),
        'root',
      );
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
      fireEvent.blur(textNode!, {
        target: { value: 'second' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { second: 2, 'second-1': 1 },
        }),
        'root',
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
      fireEvent.blur(textNode!, {
        target: { value: 'second' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { second: 2, second_1: 1 },
        }),
        'root',
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
      fireEvent.blur(textNode!, {
        target: { value: 'second' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { second: 2, second_1: 1 },
        }),
        'root',
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
      fireEvent.blur(textNode!);

      expect(onChange).not.toHaveBeenCalled();
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
      fireEvent.blur(textNode!, {
        target: { value: 'second' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
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
        }),
        'root',
      );
    });

    it('should have an expand button', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.rjsf-object-property-expand button')).not.toBeNull();
    });

    it('should not have an expand button if expandable is false', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:options': { expandable: false } },
      });

      expect(node.querySelector('.rjsf-object-property-expand button')).toBeNull();
    });

    it('should add a new property when clicking the expand button', () => {
      const { node, onChange } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.rjsf-object-property-expand button')!);

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            newKey: 'New Value',
          },
        }),
        'root',
      );
    });

    it("should add a new property with suffix when clicking the expand button and 'newKey' already exists", () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { newKey: 1 },
      });

      fireEvent.click(node.querySelector('.rjsf-object-property-expand button')!);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            newKey: 1,
            'newKey-1': 'New Value',
          },
        }),
        'root',
      );
    });

    it('should add a property matching the additionalProperties schema', () => {
      // Specify that additionalProperties must be an array of strings
      const additionalPropertiesArraySchema: RJSFSchema = {
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

      fireEvent.click(node.querySelector('.rjsf-object-property-expand button')!);

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            newKey: [],
          },
        }),
        'root',
      );
    });

    it('should add a string item if additionalProperties is true', () => {
      // Specify that additionalProperties is true
      const customSchema: RJSFSchema = {
        ...schema,
        additionalProperties: true,
      };
      const { node, onChange } = createFormComponent({
        schema: customSchema,
        formData: {},
      });

      fireEvent.click(node.querySelector('.rjsf-object-property-expand button')!);

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            newKey: 'New Value',
          },
        }),
        'root',
      );
    });

    it("should add a new default item if default is provided in the additionalProperties' schema", () => {
      const customSchema: RJSFSchema = {
        ...schema,
        additionalProperties: {
          type: 'string',
          default: 'default value',
        },
      };
      const { node, onChange } = createFormComponent({
        schema: customSchema,
        formData: {},
      });

      fireEvent.click(node.querySelector('.rjsf-object-property-expand button')!);

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            newKey: 'default value',
          },
        }),
        'root',
      );
    });

    it('should add a new default item even if the schema of default value is invalid', () => {
      const customSchema: RJSFSchema = {
        ...schema,
        additionalProperties: {
          type: 'string',
          default: 1,
        },
      };
      const { node, onChange } = createFormComponent({
        schema: customSchema,
        formData: {},
      });

      fireEvent.click(node.querySelector('.rjsf-object-property-expand button')!);

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            newKey: 1,
          },
        }),
        'root',
      );
    });

    it('should generate the specified default key and value inputs if default is provided outside of additionalProperties schema', () => {
      const customSchema: RJSFSchema = {
        ...schema,
        default: {
          defaultKey: 'defaultValue',
        },
      };
      const { onChange } = createFormComponent({
        schema: customSchema,
        formData: {},
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            defaultKey: 'defaultValue',
          },
        }),
      );
    });

    it('should generate the specified default key/value input with custom formData provided', () => {
      const customSchema: RJSFSchema = {
        ...schema,
        default: {
          defaultKey: 'defaultValue',
        },
      };
      const { onChange } = createFormComponent({
        schema: customSchema,
        formData: {
          someData: 'someValue',
        },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            defaultKey: 'defaultValue',
            someData: 'someValue',
          },
        }),
      );
    });

    it('should edit the specified default key without duplicating', () => {
      const customSchema: RJSFSchema = {
        ...schema,
        default: {
          defaultKey: 'defaultValue',
        },
      };
      const { node, onChange } = createFormComponent({
        schema: customSchema,
        formData: {},
      });

      fireEvent.blur(node.querySelector('#root_defaultKey-key')!, { target: { value: 'newDefaultKey' } });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            newDefaultKey: 'defaultValue',
          },
        }),
        'root',
      );
    });

    it('should remove the specified default key/value input item', () => {
      const customSchema: RJSFSchema = {
        ...schema,
        default: {
          defaultKey: 'defaultValue',
        },
      };
      const { node, onChange } = createFormComponent({
        schema: customSchema,
        formData: {},
      });

      fireEvent.click(node.querySelector('.rjsf-object-property-remove')!);

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {},
        }),
        'root',
      );
    });

    it('should handle nested additional property default key/value input generation', () => {
      const customSchema: RJSFSchema = {
        ...schema,
        default: {
          defaultKey: 'defaultValue',
        },
        properties: {
          nested: {
            type: 'object',
            properties: {
              bar: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                },
                default: {
                  baz: 'value',
                },
              },
            },
          },
        },
      };

      const { onChange } = createFormComponent({
        schema: customSchema,
        formData: {},
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            defaultKey: 'defaultValue',
            nested: {
              bar: {
                baz: 'value',
              },
            },
          },
        }),
      );
    });

    it('should remove nested additional property default key/value input', () => {
      const customSchema: RJSFSchema = {
        ...schema,
        properties: {
          nested: {
            type: 'object',
            properties: {
              bar: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                },
                default: {
                  baz: 'value',
                },
              },
            },
          },
        },
      };

      const { node, onChange } = createFormComponent({
        schema: customSchema,
        formData: {},
      });

      fireEvent.click(node.querySelector('.rjsf-object-property-remove')!);

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            nested: {
              bar: {},
            },
          },
        }),
        'root_nested_bar',
      );
    });

    it('should not provide an expand button if length equals maxProperties', () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 1, ...schema },
        formData: { first: 1 },
      });

      expect(node.querySelector('.rjsf-object-property-expand button')).toBeNull();
    });

    it('should provide an expand button if length is less than maxProperties', () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 2, ...schema },
        formData: { first: 1 },
      });

      expect(node.querySelector('.rjsf-object-property-expand button')).not.toBeNull();
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

      expect(node.querySelector('.rjsf-object-property-expand button')).toBeNull();
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

      expect(node.querySelector('.rjsf-object-property-expand button')).toBeNull();
    });

    it('should not have delete button if expand button has not been clicked', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.form-group > .btn-danger')).toBeNull();
    });

    it('should have delete button if expand button has been clicked', () => {
      const { node } = createFormComponent({
        schema,
      });

      expect(
        node.querySelector('.form-group > .form-additional > .form-additional + .col-xs-2 .btn-danger'),
      ).toBeNull();

      fireEvent.click(node.querySelector('.rjsf-object-property-expand button')!);

      expect(node.querySelector('.form-group > .row > .form-additional + .col-xs-2 > .btn-danger')).not.toBeNull();
    });

    it('delete button should delete key-value pair', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });
      expect(node.querySelector('#root_first-key')).toHaveValue('first');
      fireEvent.click(node.querySelector('.form-group > .row > .form-additional + .col-xs-2 > .btn-danger')!);
      expect(node.querySelector('#root_first-key')).not.toBeInTheDocument();
    });

    it('delete button should delete correct pair', () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1, second: 2, third: 3 },
      });
      const selector = '.form-group > .row > .form-additional + .col-xs-2 > .btn-danger';
      expect(node.querySelectorAll(selector)).toHaveLength(3);
      fireEvent.click(node.querySelectorAll(selector)[1]);
      expect(node.querySelector('#root_second-key')).not.toBeInTheDocument();
      expect(node.querySelectorAll(selector)).toHaveLength(2);
    });

    it('deleting content of value input should not delete pair', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      fireEvent.change(node.querySelector('#root_first')!, {
        target: { value: '' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { first: '' },
        }),
        'root_first',
      );
    });

    it('should change content of value input to boolean false', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          ...schema,
          additionalProperties: true,
        },
        formData: { first: true },
      });

      act(() => {
        fireEvent.click(node.querySelector('#root_first')!);
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { first: false },
        }),
        'root_first',
      );
    });

    it('should change content of value input to number 0', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          ...schema,
          additionalProperties: true,
        },
        formData: { first: 1 },
      });

      fireEvent.change(node.querySelector('#root_first')!, {
        target: { value: 0 },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { first: 0 },
        }),
        'root_first',
      );
    });

    it('should change content of value input to null', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: { first: 'str' },
      });

      act(() => {
        fireEvent.change(node.querySelector('#root_first')!, {
          target: { value: null },
        });
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { first: '' },
        }),
        'root_first',
      );
    });
  });
  describe('markdown', () => {
    const schema: RJSFSchema = {
      title: 'A list of tasks',
      type: 'object',
      properties: {
        tasks: {
          description: 'New *description*, with some Markdown.',
          type: 'object',
          title: 'Tasks',
          properties: {
            details: {
              type: 'string',
              title: 'Task details',
              description: 'Description to renders Markdown **correctly**.',
            },
            has_markdown: {
              type: 'boolean',
              description: 'Checkbox with some `markdown`!',
            },
          },
        },
      },
    };

    const uiSchema = {
      tasks: {
        'ui:enableMarkdownInDescription': true,
        details: {
          'ui:enableMarkdownInDescription': true,
          'ui:widget': 'textarea',
        },
        has_markdown: {
          'ui:enableMarkdownInDescription': true,
        },
      },
    };

    it('should render markdown in description when enableMarkdownInDescription is set to true', () => {
      const { node } = createFormComponent({ schema, uiSchema });

      const field = node.querySelector('form .form-group .form-group .field-description');
      expect(field).toContainHTML('New <em>description</em>, with some Markdown.');

      const details = node.querySelector('form .form-group .form-group .rjsf-field-string .field-description');
      expect(details).toContainHTML('Description to renders Markdown <strong>correctly</strong>.');

      const checkbox = node.querySelector('form .form-group .form-group .rjsf-field-boolean .field-description');
      expect(checkbox).toContainHTML('Checkbox with some <code>markdown</code>!');
    });
    it('should not render markdown in description when enableMarkdownInDescription is not present in uiSchema', () => {
      const { node } = createFormComponent({ schema });

      const field = node.querySelector('form .form-group .form-group .field-description');
      expect(field).toContainHTML('New *description*, with some Markdown.');

      const details = node.querySelector('form .form-group .form-group .rjsf-field-string .field-description');
      expect(details).toContainHTML('Description to renders Markdown **correctly**.');

      const checkbox = node.querySelector('form .form-group .form-group .rjsf-field-boolean .field-description');
      expect(checkbox).toContainHTML('Checkbox with some `markdown`!');
    });
  });
});
