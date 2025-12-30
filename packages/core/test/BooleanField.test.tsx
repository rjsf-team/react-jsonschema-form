import { fireEvent, act } from '@testing-library/react';
import { RJSFSchema, WidgetProps } from '@rjsf/utils';

import { createFormComponent, getSelectedOptionValue, submitForm } from './testUtils';

const CustomWidget = () => <div id='custom' />;

describe('BooleanField', () => {
  it('should render a boolean field', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
    });

    expect(node.querySelectorAll('.rjsf-field input[type=checkbox]')).toHaveLength(1);
  });

  it('should render a boolean field with the expected id', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
    });

    expect(node.querySelector('.rjsf-field input[type=checkbox]')).toHaveAttribute('id', 'root');
  });

  it('should render a boolean field with a label', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        title: 'foo',
      },
    });

    expect(node.querySelector('.rjsf-field label span')).toHaveTextContent('foo');
  });

  describe('HTML5 required attribute', () => {
    it('should not render a required attribute for simple required fields', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
            },
          },
          required: ['foo'],
        },
      });

      expect(node.querySelector('input[type=checkbox]')).not.toHaveAttribute('required');
    });

    it('should add a required attribute if the schema uses const with a true value', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              const: true,
            },
          },
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });

    it('should add a required attribute if the schema uses an enum with a single value of true', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              enum: [true],
            },
          },
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });

    it('should add a required attribute if the schema uses an anyOf with a single value of true', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              anyOf: [
                {
                  const: true,
                },
              ],
            },
          },
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });

    it('should add a required attribute if the schema uses a oneOf with a single value of true', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              oneOf: [
                {
                  const: true,
                },
              ],
            },
          },
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });

    it('should add a required attribute if the schema uses an allOf with a value of true', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              allOf: [
                {
                  const: true,
                },
              ],
            },
          },
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });
  });

  it('should render a single label', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        title: 'foo',
      },
    });

    expect(node.querySelectorAll('.rjsf-field label')).toHaveLength(1);
  });

  it('should render a description', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        description: 'my description',
      },
    });

    const description = node.querySelector('.field-description');
    expect(description).toHaveTextContent('my description');
  });

  it('should pass uiSchema to custom widget', () => {
    const CustomCheckboxWidget = ({ uiSchema }: WidgetProps) => {
      return <div id='custom-ui-option-value'>{uiSchema?.custom_field_key['ui:options'].test}</div>;
    };

    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        description: 'my description',
      },
      widgets: {
        CheckboxWidget: CustomCheckboxWidget,
      },
      uiSchema: {
        custom_field_key: {
          'ui:widget': 'checkbox',
          'ui:options': {
            test: 'foo',
          },
        },
      },
    });

    expect(node.querySelector('#custom-ui-option-value')).toHaveTextContent('foo');
  });

  it('should render the description using provided description field', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        description: 'my description',
      },
      templates: {
        DescriptionFieldTemplate: ({ description }) => (
          <div className='field-description'>{description} overridden</div>
        ),
      },
    });

    const description = node.querySelector('.field-description');
    expect(description).toHaveTextContent('my description overridden');
  });

  it('should assign a default value', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: true,
      },
    });

    expect(node.querySelector('.rjsf-field input')).toHaveAttribute('checked', '');
  });

  it('formData should default to undefined', () => {
    const { node, onSubmit } = createFormComponent({
      schema: { type: 'boolean' },
      noValidate: true,
    });
    submitForm(node);
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: undefined }),
      expect.objectContaining({ type: 'submit' }),
    );
  });

  it('should focus on required radio missing data when focusOnFirstField and shows error', () => {
    const { node, onError } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          bool: {
            type: 'boolean',
          },
        },
        required: ['bool'],
      },
      focusOnFirstError: true,
      uiSchema: { bool: { 'ui:widget': 'radio' } },
    });
    const focusSpys = [jest.fn(), jest.fn()];
    const inputs = node.querySelectorAll('input[id^=root_bool]');
    expect(inputs).toHaveLength(2);
    let errorInputs = node.querySelectorAll('.form-group.rjsf-field-error input[id^=root_bool]');
    expect(errorInputs).toHaveLength(0);
    // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
    (inputs[0] as HTMLInputElement).focus = focusSpys[0];
    (inputs[1] as HTMLInputElement).focus = focusSpys[1];
    submitForm(node);
    expect(onError).toHaveBeenLastCalledWith([
      expect.objectContaining({ message: "must have required property 'bool'" }),
    ]);
    expect(focusSpys[0]).toHaveBeenCalled();
    expect(focusSpys[1]).not.toHaveBeenCalled();
    errorInputs = node.querySelectorAll('.form-group.rjsf-field-error input[id^=root_bool]');
    expect(errorInputs).toHaveLength(2);
  });

  it('should focus on required radio missing data when focusOnFirstField and hides error', () => {
    const { node, onError } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          bool: {
            type: 'boolean',
          },
        },
        required: ['bool'],
      },
      focusOnFirstError: true,
      uiSchema: { bool: { 'ui:widget': 'radio', 'ui:hideError': true } },
    });
    const focusSpys = [jest.fn(), jest.fn()];
    const inputs = node.querySelectorAll('input[id^=root_bool]');
    expect(inputs).toHaveLength(2);
    let errorInputs = node.querySelectorAll('.form-group.rjsf-field-error input[id^=root_bool]');
    expect(errorInputs).toHaveLength(0);
    // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
    (inputs[0] as HTMLInputElement).focus = focusSpys[0];
    (inputs[1] as HTMLInputElement).focus = focusSpys[1];
    submitForm(node);
    expect(onError).toHaveBeenLastCalledWith([
      expect.objectContaining({ message: "must have required property 'bool'" }),
    ]);
    expect(focusSpys[0]).toHaveBeenCalled();
    expect(focusSpys[1]).not.toHaveBeenCalled();
    errorInputs = node.querySelectorAll('.form-group.rjsf-field-error input[id^=root_bool]');
    expect(errorInputs).toHaveLength(0);
  });

  it('should handle a change event', () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
    });

    act(() => {
      fireEvent.click(node.querySelector('input')!);
    });

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: true }), 'root');
  });

  it('should fill field with data', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
      formData: true,
    });

    expect(node.querySelector('.rjsf-field input')).toHaveAttribute('checked', '');
  });

  it('should render radio widgets with the expected id', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
      uiSchema: { 'ui:widget': 'radio' },
    });

    expect(node.querySelector('.field-radio-group')).toHaveAttribute('id', 'root');
  });

  it('should have default enum option labels for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
      formData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['Yes', 'No']);
  });

  it('should support enum option ordering for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        enum: [false, true],
      },
      formData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['No', 'Yes']);
  });

  it('should support ui:enumNames for radio widgets', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean' },
      formData: true,
      uiSchema: { 'ui:widget': 'radio', 'ui:enumNames': ['Yes', 'No'] },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['Yes', 'No']);
  });

  it('should support oneOf titles for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        oneOf: [
          {
            const: true,
            title: 'Yes',
          },
          {
            const: false,
            title: 'No',
          },
        ],
      },
      formData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['Yes', 'No']);
  });

  it('should support oneOf titles for radio widgets, overrides in uiSchema', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        oneOf: [
          {
            const: true,
            title: 'Yes',
          },
          {
            const: false,
            title: 'No',
          },
        ],
      },
      formData: true,
      uiSchema: { 'ui:widget': 'radio', oneOf: [{ 'ui:title': 'Si!' }, { 'ui:title': 'No!' }] },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['Si!', 'No!']);
  });

  it('should preserve oneOf option ordering for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        oneOf: [
          {
            const: false,
            title: 'No',
          },
          {
            const: true,
            title: 'Yes',
          },
        ],
      },
      formData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['No', 'Yes']);
  });

  it('should support inline radio widgets', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean' },
      formData: true,
      uiSchema: {
        'ui:widget': 'radio',
        'ui:options': {
          inline: true,
        },
      },
    });

    expect(node.querySelectorAll('.radio-inline')).toHaveLength(2);
  });

  it('should handle a focus event for radio widgets', () => {
    const onFocus = jest.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'radio',
      },
      onFocus,
    });

    const element = node.querySelector('.field-radio-group');
    fireEvent.focus(node.querySelector('input')!, {
      target: {
        value: 1, // use index
      },
    });
    expect(onFocus).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should handle a blur event for radio widgets', () => {
    const onBlur = jest.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'radio',
      },
      onBlur,
    });

    const element = node.querySelector('.field-radio-group');
    fireEvent.blur(node.querySelector('input')!, {
      target: {
        value: 1, // use index
      },
    });
    expect(onBlur).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should support ui:enumNames for select, with overrides in uiSchema', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean' },
      formData: true,
      uiSchema: { 'ui:widget': 'select', 'ui:enumNames': ['Si!', 'No!'] },
    });

    const labels = [].map.call(node.querySelectorAll('.rjsf-field option'), (label: Element) => label.textContent);
    expect(labels).toEqual(['', 'Si!', 'No!']);
  });

  it('should handle a focus event with checkbox', () => {
    const onFocus = jest.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'select',
      },
      onFocus,
    });

    const element = node.querySelector('select');
    fireEvent.focus(element!, {
      target: {
        value: 1, // use index
      },
    });
    expect(onFocus).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should handle a blur event with select', () => {
    const onBlur = jest.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'select',
      },
      onBlur,
    });

    const element = node.querySelector('select');
    fireEvent.blur(element!, {
      target: {
        value: 1, // use index
      },
    });
    expect(onBlur).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should render the widget with the expected id', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
    });

    expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('id', 'root');
  });

  it('should render customized checkbox', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
      widgets: {
        CheckboxWidget: CustomWidget,
      },
    });

    expect(node.querySelector('#custom')).toBeInTheDocument();
  });

  it('should handle a focus event with checkbox', () => {
    const onFocus = jest.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'checkbox',
      },
      onFocus,
    });

    const element = node.querySelector('input');
    fireEvent.focus(element!, {
      target: {
        checked: false,
      },
    });
    expect(onFocus).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should handle a blur event with checkbox', () => {
    const onBlur = jest.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'checkbox',
      },
      onBlur,
    });

    const element = node.querySelector('input');
    fireEvent.blur(element!, {
      target: {
        checked: false,
      },
    });
    expect(onBlur).toHaveBeenLastCalledWith(element?.id, false);
  });

  describe('Label', () => {
    const Widget = (props: WidgetProps) => <div id={`label-${props.label}`} />;

    const widgets = { Widget };

    it('should pass field name to widget if there is no title', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          boolean: {
            type: 'boolean',
          },
        },
      };
      const uiSchema = {
        boolean: {
          'ui:widget': 'Widget',
        },
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-boolean')).not.toBeNull();
    });

    it('should pass schema title to widget', () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
      };
      const uiSchema = {
        'ui:widget': 'Widget',
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-test')).not.toBeNull();
    });

    it('should pass empty schema title to widget', () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: '',
      };
      const uiSchema = {
        'ui:widget': 'Widget',
      };
      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-')).not.toBeNull();
    });
  });

  describe('SelectWidget', () => {
    it('should render a field that contains an enum of booleans', () => {
      const { node } = createFormComponent({
        schema: {
          enum: [true, false],
        },
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(1);
    });

    it('should infer the value from an enum on change', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          enum: [true, false],
        },
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(1);
      const $select = node.querySelector<HTMLSelectElement>('.rjsf-field select');
      expect($select).toHaveValue('');

      act(() => {
        fireEvent.change($select!, {
          target: { value: 0 }, // use index
        });
      });
      expect(getSelectedOptionValue($select!)).toEqual('true');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: true }), 'root');
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          enum: [true, false],
          title: 'foo',
        },
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
    });

    it('should assign a default value', () => {
      const { onChange } = createFormComponent({
        schema: {
          enum: [true, false],
          default: true,
        },
      });
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: true }));
    });

    it('should handle a change event', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          enum: [true, false],
        },
      });

      act(() => {
        fireEvent.change(node.querySelector('select')!, {
          target: { value: 1 }, // use index
        });
      });

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: false }), 'root');
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          enum: [true, false],
        },
      });

      expect(node.querySelector('select')).toHaveAttribute('id', 'root');
    });
  });
});
