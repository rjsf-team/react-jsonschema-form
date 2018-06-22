import React from 'react';
import { Simulate } from 'react-dom/test-utils';
import { cleanup } from 'react-testing-library';

import { createFormComponent } from './test_utils';

describe('BooleanField', () => {
  const CustomWidget = () => <div id="custom" />;

  afterEach(cleanup);

  it('should render a boolean field', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean'
      }
    });

    expect(node.querySelectorAll('.field input[type=checkbox]')).toHaveLength(
      1
    );
  });

  it('should render a boolean field with a label', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        title: 'foo'
      }
    });

    expect(node.querySelector('.field label span').textContent).toEqual('foo');
  });

  it('should render a single label', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        title: 'foo'
      }
    });

    expect(node.querySelectorAll('.field label')).toHaveLength(1);
  });

  it('should render a description', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        description: 'my description'
      }
    });

    const description = node.querySelector('.field-description');
    expect(description.textContent).toEqual('my description');
  });

  it('should assign a default value', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: true
      }
    });

    expect(node.querySelector('.field input').checked).toEqual(true);
  });

  it('should default state value to undefined', () => {
    const { getInstance } = createFormComponent({
      schema: { type: 'boolean' }
    });

    expect(getInstance().state.formData).toEqual(undefined);
  });

  it('should handle a change event', () => {
    const { getInstance, node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false
      }
    });

    Simulate.change(node.querySelector('input'), {
      target: { checked: true }
    });

    expect(getInstance().state.formData).toEqual(true);
  });

  it('should fill field with data', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean'
      },
      formData: true
    });

    expect(node.querySelector('.field input').checked).toEqual(true);
  });

  it('should support enumNames for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        enumNames: ['Yes', 'No']
      },
      formData: true,
      uiSchema: { 'ui:widget': 'radio' }
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      label => label.textContent
    );
    expect(labels).toEqual(['Yes', 'No']);
  });

  it('should support inline radio widgets', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean' },
      formData: true,
      uiSchema: {
        'ui:widget': 'radio',
        'ui:options': {
          inline: true
        }
      }
    });

    expect(node.querySelectorAll('.radio-inline')).toHaveLength(2);
  });

  it('should support enumNames for select', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        enumNames: ['Yes', 'No']
      },
      formData: true,
      uiSchema: { 'ui:widget': 'select' }
    });

    const labels = [].map.call(
      node.querySelectorAll('.field option'),
      label => label.textContent
    );
    expect(labels).toEqual(['', 'Yes', 'No']);
  });

  it('should render the widget with the expected id', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean'
      }
    });

    expect(node.querySelector('input[type=checkbox]').id).toEqual('root');
  });

  it('should render customized checkbox', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean'
      },
      widgets: {
        CheckboxWidget: CustomWidget
      }
    });

    expect(node.querySelector('#custom')).toBeDefined();
  });

  describe('Label', () => {
    const Widget = props => <div id={`label-${props.label}`} />;

    const widgets = { Widget };

    it('should pass field name to widget if there is no title', () => {
      const schema = {
        type: 'object',
        properties: {
          boolean: {
            type: 'boolean'
          }
        }
      };
      const uiSchema = {
        boolean: {
          'ui:widget': 'Widget'
        }
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-boolean')).not.toBeNull();
    });

    it('should pass schema title to widget', () => {
      const schema = {
        type: 'boolean',
        title: 'test'
      };
      const uiSchema = {
        'ui:widget': 'Widget'
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-test')).not.toBeNull();
    });

    it('should pass empty schema title to widget', () => {
      const schema = {
        type: 'boolean',
        title: ''
      };
      const uiSchema = {
        'ui:widget': 'Widget'
      };
      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-')).not.toBeNull();
    });
  });
});
