import { Component } from 'react';
import type { FieldProps, GenericObjectType, Registry, RJSFSchema, ThemePresentation } from '@rjsf/utils';
import { WIDGET_FIELD_PRESENTATION } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormProps, ThemeProps } from '../src/index.ts';
import { withTheme } from '../src/index.ts';
import { createComponent, createFormRef } from './testUtils.tsx';

function WrapperClassComponent(props: ThemeProps) {
  return class extends Component<FormProps> {
    render() {
      const Cmp = withTheme(props);
      return <Cmp {...this.props} />;
    }
  };
}

describe('withTheme', () => {
  describe('With fields', () => {
    it('should use the withTheme field', () => {
      const fields = {
        StringField() {
          return <div className='string-field' />;
        },
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          fieldA: {
            type: 'string',
          },
          fieldB: {
            type: 'string',
          },
        },
      };
      const uiSchema = {};
      const { node } = createComponent(WrapperClassComponent({ fields }), {
        schema,
        uiSchema,
        validator,
      });
      expect(node.querySelectorAll('.string-field')).toHaveLength(2);
    });

    it('should use withTheme field and the user defined field', () => {
      const themeFields = {
        StringField() {
          return <div className='string-field' />;
        },
      };
      const userFields = {
        NumberField() {
          return <div className='number-field' />;
        },
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          fieldA: {
            type: 'string',
          },
          fieldB: {
            type: 'number',
          },
        },
      };
      const uiSchema = {};
      const { node } = createComponent(WrapperClassComponent({ fields: themeFields }), {
        schema,
        uiSchema,
        fields: userFields,
        validator,
      });
      expect(node.querySelectorAll('.string-field')).toHaveLength(1);
      expect(node.querySelectorAll('.number-field')).toHaveLength(1);
    });

    it('should use only the user defined field', () => {
      const themeFields = {
        StringField() {
          return <div className='string-field' />;
        },
      };
      const userFields = {
        StringField() {
          return <div className='form-control' />;
        },
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          fieldA: {
            type: 'string',
          },
          fieldB: {
            type: 'string',
          },
        },
      };
      const uiSchema = {};
      const { node } = createComponent(WrapperClassComponent({ fields: themeFields }), {
        schema,
        uiSchema,
        fields: userFields,
        validator,
      });
      expect(node.querySelectorAll('.string-field')).toHaveLength(0);
      expect(node.querySelectorAll('.form-control')).toHaveLength(2);
    });
  });

  describe('With widgets', () => {
    it('should use the withTheme widget', () => {
      const widgets = {
        TextWidget: () => <div id='test' />,
      };
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {};
      const { node } = createComponent(WrapperClassComponent({ widgets }), {
        schema,
        uiSchema,
        validator,
      });
      expect(node.querySelectorAll('#test')).toHaveLength(1);
    });

    it('should use the withTheme widget as well as user defined widget', () => {
      const themeWidgets = {
        TextWidget: () => <div id='test-theme-widget' />,
      };
      const userWidgets = {
        DateWidget: () => <div id='test-user-widget' />,
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          fieldA: {
            type: 'string',
          },
          fieldB: {
            format: 'date',
            type: 'string',
          },
        },
      };
      const uiSchema = {};
      const { node } = createComponent(WrapperClassComponent({ widgets: themeWidgets }), {
        schema,
        uiSchema,
        widgets: userWidgets,
        validator,
      });
      expect(node.querySelectorAll('#test-theme-widget')).toHaveLength(1);
      expect(node.querySelectorAll('#test-user-widget')).toHaveLength(1);
    });

    it('should use only the user defined widget', () => {
      const themeWidgets = {
        TextWidget: () => <div id='test-theme-widget' />,
      };
      const userWidgets = {
        TextWidget: () => <div id='test-user-widget' />,
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          fieldA: {
            type: 'string',
          },
        },
      };
      const uiSchema = {};
      const { node } = createComponent(WrapperClassComponent({ widgets: themeWidgets }), {
        schema,
        uiSchema,
        widgets: userWidgets,
        validator,
      });
      expect(node.querySelectorAll('#test-theme-widget')).toHaveLength(0);
      expect(node.querySelectorAll('#test-user-widget')).toHaveLength(1);
    });
  });

  describe('With templates', () => {
    it('should use the withTheme template', () => {
      const themeTemplates = {
        FieldTemplate() {
          return <div className='with-theme-field-template' />;
        },
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          fieldA: {
            type: 'string',
          },
          fieldB: {
            type: 'string',
          },
        },
      };
      const uiSchema = {};
      const { node } = createComponent(WrapperClassComponent({ templates: themeTemplates }), {
        schema,
        uiSchema,
        validator,
      });
      expect(node.querySelectorAll('.with-theme-field-template')).toHaveLength(1);
    });

    it('should use only the user defined template', () => {
      const themeTemplates = {
        FieldTemplate() {
          return <div className='with-theme-field-template' />;
        },
      };
      const userTemplates = {
        FieldTemplate() {
          return <div className='user-field-template' />;
        },
      };

      const schema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      };
      const { node } = createComponent(WrapperClassComponent({ templates: themeTemplates }), {
        schema,
        templates: userTemplates,
        validator,
      });
      expect(node.querySelectorAll('.with-theme-field-template')).toHaveLength(0);
      expect(node.querySelectorAll('.user-field-template')).toHaveLength(1);
    });

    it('should use the withTheme submit button template', () => {
      const themeTemplates = {
        ButtonTemplates: {
          SubmitButton() {
            return (
              <button type='button' className='with-theme-button-template'>
                ThemeSubmit
              </button>
            );
          },
        },
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          fieldA: {
            type: 'string',
          },
          fieldB: {
            type: 'string',
          },
        },
      };
      const uiSchema = {};
      const { node } = createComponent(WrapperClassComponent({ templates: themeTemplates }), {
        schema,
        uiSchema,
        validator,
      });
      expect(node.querySelectorAll('.with-theme-button-template')).toHaveLength(1);
    });

    it('should use only the user defined submit button', () => {
      const themeTemplates = {
        ButtonTemplates: {
          SubmitButton() {
            return (
              <button type='button' className='with-theme-button-template'>
                ThemeSubmit
              </button>
            );
          },
        },
      };
      const userTemplates = {
        ButtonTemplates: {
          SubmitButton() {
            return (
              <button type='button' className='user-button-template'>
                UserSubmit
              </button>
            );
          },
        },
      };

      const schema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      };
      const { node } = createComponent(WrapperClassComponent({ templates: themeTemplates }), {
        schema,
        templates: userTemplates,
        validator,
      });
      expect(node.querySelectorAll('.with-theme-button-template')).toHaveLength(0);
      expect(node.querySelectorAll('.user-button-template')).toHaveLength(1);
    });
  });

  describe('With presentation', () => {
    it('layers the props over the theme over core, part by part', () => {
      let registry: Registry | undefined;
      const fields = {
        StringField(props: FieldProps) {
          registry = props.registry;
          return null;
        },
      };
      const theme: ThemeProps = {
        fields,
        presentation: {
          default: { label: 'self', errors: 'self' },
          widgets: { RadioWidget: { description: 'self' } },
        },
      };
      const presentation: ThemePresentation = { widgets: { RadioWidget: { label: 'template' } } };
      createComponent(WrapperClassComponent(theme), { schema: { type: 'string' }, presentation, validator });
      expect(registry?.presentation.widgets.RadioWidget).toEqual({
        label: 'template',
        description: 'self',
        errors: 'self',
        labelledBy: 'aria-labelledby',
      });
      expect(registry?.presentation.widgets.CheckboxWidget).toEqual({
        label: 'self',
        description: 'self',
        errors: 'self',
        uncheckedIsFalse: true,
      });
      expect(registry?.presentation.fields.StringField).toEqual(WIDGET_FIELD_PRESENTATION);
      expect(registry?.presentation.default).toEqual({ label: 'self', errors: 'self' });
    });
  });

  describe('With globalUiOptionsKeys', () => {
    it("reads the theme's keys and the props' from ui:globalOptions, and no other", () => {
      let registry: Registry | undefined;
      const fields = {
        StringField(props: FieldProps) {
          registry = props.registry;
          return null;
        },
      };
      const theme: ThemeProps = { fields, globalUiOptionsKeys: ['themeKey', 'shared'] };
      // Untyped, as a JSON uiSchema is, so it can hold a key that neither declares
      const globalOptions: GenericObjectType = { label: false, themeKey: 1, propKey: 2, shared: 3, undeclared: 4 };
      createComponent(WrapperClassComponent(theme), {
        schema: { type: 'string' },
        uiSchema: { 'ui:globalOptions': globalOptions },
        globalUiOptionsKeys: ['propKey', 'shared'],
        validator,
      });
      expect(registry?.globalUiOptions).toEqual({ label: false, themeKey: 1, propKey: 2, shared: 3 });
    });
  });

  it('infers the form data type from formData and takes the default validator', async () => {
    const user = userEvent.setup();
    const ThemedForm = withTheme({});
    const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
    const seen: (string | undefined)[] = [];

    const { container } = render(
      <ThemedForm
        schema={schema}
        validator={validator}
        initialFormData={{ name: 'a' }}
        onChange={({ formData }) => seen.push(formData?.name)}
      />,
    );
    await user.type(container.querySelector('#root_name') as HTMLInputElement, 'b');

    expect(seen).toEqual(['ab']);
  });

  it('renders without a theme argument, as an untyped caller could pass', () => {
    // @ts-expect-error called with no argument
    const ThemedForm = withTheme();
    const { container } = render(<ThemedForm schema={{ type: 'string' }} validator={validator} />);
    expect(container.querySelector('#root')).not.toBeNull();
  });

  it('should forward the ref', () => {
    const ref = createFormRef();
    const schema: RJSFSchema = {};
    const uiSchema = {};

    createComponent(withTheme({}), {
      schema,
      uiSchema,
      validator,
      ref,
    });

    expect(ref.current?.submit).not.toBeUndefined();
  });
});
