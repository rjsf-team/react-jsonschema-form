import { expect } from 'chai';
import { Component, createRef } from 'react';
import validator from '@rjsf/validator-ajv8';

import { withTheme } from '../src';
import { createComponent, createSandbox } from './test_utils';

const WrapperClassComponent = (...args) => {
  return class extends Component {
    render() {
      const Cmp = withTheme(...args);
      return <Cmp {...this.props} />;
    }
  };
};

describe('withTheme', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('With fields', () => {
    it('should use the withTheme field', () => {
      const fields = {
        StringField() {
          return <div className='string-field' />;
        },
      };
      const schema = {
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
      let { node } = createComponent(WrapperClassComponent({ fields }), {
        schema,
        uiSchema,
        validator,
      });
      expect(node.querySelectorAll('.string-field')).to.have.length.of(2);
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
      const schema = {
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
      let { node } = createComponent(WrapperClassComponent({ fields: themeFields }), {
        schema,
        uiSchema,
        fields: userFields,
        validator,
      });
      expect(node.querySelectorAll('.string-field')).to.have.length.of(1);
      expect(node.querySelectorAll('.number-field')).to.have.length.of(1);
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
      const schema = {
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
      let { node } = createComponent(WrapperClassComponent({ fields: themeFields }), {
        schema,
        uiSchema,
        fields: userFields,
        validator,
      });
      expect(node.querySelectorAll('.string-field')).to.have.length.of(0);
      expect(node.querySelectorAll('.form-control')).to.have.length.of(2);
    });
  });

  describe('With widgets', () => {
    it('should use the withTheme widget', () => {
      const widgets = {
        TextWidget: () => <div id='test' />,
      };
      const schema = {
        type: 'string',
      };
      const uiSchema = {};
      let { node } = createComponent(WrapperClassComponent({ widgets }), {
        schema,
        uiSchema,
        validator,
      });
      expect(node.querySelectorAll('#test')).to.have.length.of(1);
    });

    it('should use the withTheme widget as well as user defined widget', () => {
      const themeWidgets = {
        TextWidget: () => <div id='test-theme-widget' />,
      };
      const userWidgets = {
        DateWidget: () => <div id='test-user-widget' />,
      };
      const schema = {
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
      let { node } = createComponent(WrapperClassComponent({ widgets: themeWidgets }), {
        schema,
        uiSchema,
        widgets: userWidgets,
        validator,
      });
      expect(node.querySelectorAll('#test-theme-widget')).to.have.length.of(1);
      expect(node.querySelectorAll('#test-user-widget')).to.have.length.of(1);
    });

    it('should use only the user defined widget', () => {
      const themeWidgets = {
        TextWidget: () => <div id='test-theme-widget' />,
      };
      const userWidgets = {
        TextWidget: () => <div id='test-user-widget' />,
      };
      const schema = {
        type: 'object',
        properties: {
          fieldA: {
            type: 'string',
          },
        },
      };
      const uiSchema = {};
      let { node } = createComponent(WrapperClassComponent({ widgets: themeWidgets }), {
        schema,
        uiSchema,
        widgets: userWidgets,
        validator,
      });
      expect(node.querySelectorAll('#test-theme-widget')).to.have.length.of(0);
      expect(node.querySelectorAll('#test-user-widget')).to.have.length.of(1);
    });
  });

  describe('With templates', () => {
    it('should use the withTheme template', () => {
      const themeTemplates = {
        FieldTemplate() {
          return <div className='with-theme-field-template' />;
        },
      };
      const schema = {
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
      let { node } = createComponent(WrapperClassComponent({ templates: themeTemplates }), {
        schema,
        uiSchema,
        validator,
      });
      expect(node.querySelectorAll('.with-theme-field-template')).to.have.length.of(1);
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

      const schema = {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      };
      let { node } = createComponent(WrapperClassComponent({ templates: themeTemplates }), {
        schema,
        templates: userTemplates,
        validator,
      });
      expect(node.querySelectorAll('.with-theme-field-template')).to.have.length.of(0);
      expect(node.querySelectorAll('.user-field-template')).to.have.length.of(1);
    });

    it('should use the withTheme submit button template', () => {
      const themeTemplates = {
        ButtonTemplates: {
          SubmitButton() {
            return <button className='with-theme-button-template'>ThemeSubmit</button>;
          },
        },
      };
      const schema = {
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
      let { node } = createComponent(WrapperClassComponent({ templates: themeTemplates }), {
        schema,
        uiSchema,
        validator,
      });
      expect(node.querySelectorAll('.with-theme-button-template')).to.have.length.of(1);
    });

    it('should use only the user defined submit button', () => {
      const themeTemplates = {
        ButtonTemplates: {
          SubmitButton() {
            return <button className='with-theme-button-template'>ThemeSubmit</button>;
          },
        },
      };
      const userTemplates = {
        ButtonTemplates: {
          SubmitButton() {
            return <button className='user-button-template'>UserSubmit</button>;
          },
        },
      };

      const schema = {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      };
      let { node } = createComponent(WrapperClassComponent({ templates: themeTemplates }), {
        schema,
        templates: userTemplates,
        validator,
      });
      expect(node.querySelectorAll('.with-theme-button-template')).to.have.length.of(0);
      expect(node.querySelectorAll('.user-button-template')).to.have.length.of(1);
    });
  });

  it('should forward the ref', () => {
    const ref = createRef();
    const schema = {};
    const uiSchema = {};

    createComponent(withTheme({}), {
      schema,
      uiSchema,
      validator,
      ref,
    });

    expect(ref.current.submit).not.eql(undefined);
  });
});
