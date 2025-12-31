import { CSSProperties } from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { GenericObjectType, RJSFSchema, UiSchema, Widget, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import SelectWidget from '../src/components/widgets/SelectWidget';
import RadioWidget from '../src/components/widgets/RadioWidget';
import { createFormComponent, expectToHaveBeenCalledWithFormData, submitForm } from './testUtils';
import Form from '../src';

describe('uiSchema', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  beforeAll(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  afterAll(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  afterEach(() => {
    consoleWarnSpy.mockClear();
    consoleErrorSpy.mockClear();
  });
  describe('custom classNames', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
        bar: {
          type: 'string',
        },
        baz: {
          type: 'string',
        },
      },
    };

    const uiSchema: UiSchema = {
      foo: {
        'ui:classNames': 'class-for-foo',
      },
      bar: {
        'ui:options': {
          classNames: 'class-for-bar another-for-bar',
        },
      },
      baz: {
        'ui:classNames': 'class-for-baz',
      },
    };

    it('should apply custom class names to target widgets', () => {
      const { node } = createFormComponent({ schema, uiSchema });
      const [foo, bar, baz] = node.querySelectorAll('.rjsf-field-string');

      expect(foo.classList.contains('class-for-foo')).toBe(true);
      expect(bar.classList.contains('class-for-bar')).toBe(true);
      expect(bar.classList.contains('another-for-bar')).toBe(true);
      expect(baz.classList.contains('class-for-baz')).toBe(true);
    });
  });

  describe('custom style', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
        bar: {
          type: 'string',
        },
      },
    };

    const uiSchema: UiSchema = {
      foo: {
        'ui:style': {
          paddingRight: '1em',
        },
      },
      bar: {
        'ui:style': {
          paddingLeft: '1.5em',
          color: 'orange',
        },
      },
    };

    it('should apply custom style to target widgets', () => {
      const { node } = createFormComponent({ schema, uiSchema });
      const [foo, bar] = node.querySelectorAll<HTMLElement>('.rjsf-field-string');

      expect(foo.style.paddingRight).toEqual('1em');
      expect(bar.style.paddingLeft).toEqual('1.5em');
      expect(bar.style.color).toEqual('orange');
    });
  });

  describe('custom widget', () => {
    describe('root widget', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };

      const uiSchema: UiSchema = {
        'ui:widget': (props) => {
          return (
            <input
              type='text'
              className='custom'
              value={props.value}
              defaultValue={props.defaultValue}
              required={props.required}
              onChange={(event) => props.onChange(event.target.value)}
            />
          );
        },
      };

      it('should render a root custom widget', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('.custom')).toHaveLength(1);
      });
    });

    describe('custom options', () => {
      let widget: Widget;
      let widgets: { widget: Widget };
      let schema: RJSFSchema;
      let uiSchema: UiSchema;

      beforeEach(() => {
        widget = ({ label, options }) => {
          const realOptions: CSSProperties = {
            background: 'yellow',
            color: 'green',
            ...(options as CSSProperties),
          };
          return <div id={label} style={realOptions} />;
        };

        widgets = {
          widget,
        };

        // all fields in one schema to catch errors where options passed to one instance
        // of a widget are persistent across all instances
        schema = {
          type: 'object',
          properties: {
            funcAll: {
              type: 'string',
            },
            funcNone: {
              type: 'string',
            },
            stringAll: {
              type: 'string',
            },
            stringNone: {
              type: 'string',
            },
            stringTel: {
              type: 'string',
            },
          },
        };

        uiSchema = {
          // pass widget as function
          funcAll: {
            'ui:widget': widget,
            'ui:options': {
              margin: '7px',
              background: 'purple',
            },
            'ui:padding': '42px',
          },
          funcNone: {
            'ui:widget': widget,
          },

          // pass widget as string
          stringAll: {
            'ui:widget': 'widget',
            'ui:options': {
              margin: '19px',
              background: 'blue',
            },
            'ui:padding': '41px',
          },
          stringNone: {
            'ui:widget': 'widget',
          },
          stringTel: {
            'ui:options': {
              inputType: 'tel',
            },
          },
        };
      });

      it('should log error when unsupported ui:widget: {component, options} api is used', () => {
        createFormComponent({
          schema: {
            type: 'string',
          },
          uiSchema: {
            'ui:widget': {
              // @ts-expect-error TS2353, because we are trying to test an error condition
              component: 'widget',
            },
          },
          widgets,
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Setting options via ui:widget object is no longer supported, use ui:options instead',
        );
      });

      it('should cache MergedWidget instance', () => {
        // Cast to get to the underlying cached object without typescript warnings
        expect((widget as GenericObjectType).MergedWidget).not.toBeDefined();
        createFormComponent({
          schema: {
            type: 'string',
          },
          uiSchema: {
            'ui:widget': 'widget',
          },
          widgets,
        });
        const cached = (widget as GenericObjectType).MergedWidget;
        expect(cached).toBeDefined();
        createFormComponent({
          schema: {
            type: 'string',
          },
          uiSchema: {
            'ui:widget': 'widget',
          },
          widgets,
        });
        expect((widget as GenericObjectType).MergedWidget).toBe(cached);
      });

      it('should render merged ui:widget options for widget referenced as function', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          widgets,
        });
        const widget = node.querySelector<HTMLElement>('#funcAll');

        expect(widget?.style.background).toEqual('purple');
        expect(widget?.style.color).toEqual('green');
        expect(widget?.style.margin).toEqual('7px');
        expect(widget?.style.padding).toEqual('42px');
      });

      it('should render ui:widget default options for widget referenced as function', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          widgets,
        });
        const widget = node.querySelector<HTMLElement>('#funcNone');

        expect(widget?.style.background).toEqual('yellow');
        expect(widget?.style.color).toEqual('green');
        expect(widget?.style.margin).toEqual('');
        expect(widget?.style.padding).toEqual('');
      });

      it('should render merged ui:widget options for widget referenced as string', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          widgets,
        });
        const widget = node.querySelector<HTMLElement>('#stringAll');

        expect(widget?.style.background).toEqual('blue');
        expect(widget?.style.color).toEqual('green');
        expect(widget?.style.margin).toEqual('19px');
        expect(widget?.style.padding).toEqual('41px');
      });

      it('should render ui:widget default options for widget referenced as string', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          widgets,
        });
        const widget = node.querySelector<HTMLElement>('#stringNone');

        expect(widget?.style.background).toEqual('yellow');
        expect(widget?.style.color).toEqual('green');
        expect(widget?.style.margin).toEqual('');
        expect(widget?.style.padding).toEqual('');
      });

      it('should ui:option inputType for html5 input types', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          widgets,
        });
        const widget = node.querySelector("input[type='tel']");
        expect(widget).not.toBeNull();
      });
    });

    describe('nested widget', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          field: {
            type: 'string',
          },
        },
      };

      const uiSchema: UiSchema = {
        field: {
          'ui:widget': 'custom',
        },
      };

      const CustomWidget = (props: WidgetProps) => {
        return (
          <input
            type='text'
            className='custom'
            value={props.value}
            defaultValue={props.defaultValue}
            required={props.required}
            onChange={(event) => props.onChange(event.target.value)}
          />
        );
      };

      const widgets = {
        custom: CustomWidget,
      };

      it('should render a nested custom widget', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          widgets,
        });

        expect(node.querySelectorAll('.custom')).toHaveLength(1);
      });
    });

    describe('options', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          field: {
            type: 'string',
          },
        },
      };

      const CustomWidget = (props: WidgetProps) => {
        const { value, options } = props;
        return <input type='text' className={options.className} value={value} />;
      };

      describe('direct reference', () => {
        const uiSchema: UiSchema = {
          field: {
            'ui:widget': CustomWidget,
            'ui:options': {
              className: 'custom',
            },
          },
        };

        it('should render a custom widget with options', () => {
          const { node } = createFormComponent({ schema, uiSchema });

          expect(node.querySelectorAll('.custom')).toHaveLength(1);
        });
      });

      describe('string reference', () => {
        const uiSchema: UiSchema = {
          field: {
            'ui:widget': 'custom',
            'ui:options': {
              className: 'custom',
            },
          },
        };

        const widgets = {
          custom: CustomWidget,
        };

        it('should render a custom widget with options', () => {
          const { node } = createFormComponent({
            schema,
            uiSchema,
            widgets,
          });

          expect(node.querySelectorAll('.custom')).toHaveLength(1);
        });
      });
    });

    describe('enum fields native options', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: ['foo', 'bar'],
          },
        },
      };

      const CustomWidget = (props: WidgetProps) => {
        const { options } = props;
        const { enumOptions, className } = options;
        return (
          <select className={className}>
            {Array.isArray(enumOptions) && enumOptions.map(({ value }, i) => <option key={i}>{value}</option>)}
          </select>
        );
      };

      const uiSchema: UiSchema = {
        field: {
          'ui:widget': CustomWidget,
          'ui:options': {
            className: 'custom',
          },
        },
      };

      it('should merge enumOptions with custom options', () => {
        const { node } = createFormComponent({ schema, uiSchema });
        expect(node.querySelectorAll('.custom option')).toHaveLength(2);
      });
    });

    describe('enum fields disabled options', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: ['foo', 'bar'],
          },
        },
      };
      const uiSchema: UiSchema = {
        field: {
          'ui:widget': SelectWidget,
          'ui:options': {
            className: 'custom',
          },
          'ui:enumDisabled': ['foo'],
        },
      };
      it('should have atleast one option disabled', () => {
        const { node } = createFormComponent({ schema, uiSchema });
        const disabledOptionsLen = uiSchema.field['ui:enumDisabled'].length;
        expect(node.querySelectorAll('option:disabled')).toHaveLength(disabledOptionsLen);
        expect(node.querySelectorAll('option:enabled')).toHaveLength(
          // Two options, one disabled, plus the placeholder
          2 - disabledOptionsLen + 1,
        );
      });
    });

    describe('enum fields disabled radio options', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: ['foo', 'bar'],
          },
        },
      };
      const uiSchema: UiSchema = {
        field: {
          'ui:widget': RadioWidget,
          'ui:options': {
            className: 'custom',
          },
          'ui:enumDisabled': ['foo'],
        },
      };
      it('should have atleast one radio option disabled', () => {
        const { node } = createFormComponent({ schema, uiSchema });
        const disabledOptionsLen = uiSchema.field['ui:enumDisabled'].length;
        expect(node.querySelectorAll('input:disabled')).toHaveLength(disabledOptionsLen);
        expect(node.querySelectorAll('input:enabled')).toHaveLength(
          // Two options, one disabled, plus the placeholder
          2 - disabledOptionsLen,
        );
      });
    });
  });

  describe('ui:help', () => {
    it('should render the provided help text', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema: UiSchema = {
        'ui:help': 'plop',
      };

      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelector('div.help-block')).toHaveTextContent('plop');
    });
  });

  describe('ui:title', () => {
    it('should render the provided title text', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema: UiSchema = {
        'ui:title': 'plop',
      };

      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelector('label.control-label')).toHaveTextContent('plop');
    });
  });

  describe('ui:description', () => {
    it('should render the provided description text', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema: UiSchema = {
        'ui:description': 'plop',
      };

      const { node } = createFormComponent({ schema, uiSchema });

      expect(node.querySelector('div.field-description')).toHaveTextContent('plop');
    });
  });

  it('should accept a string as help', () => {
    const schema: RJSFSchema = {
      type: 'string',
    };
    const uiSchema: UiSchema = {
      'ui:help': 'plop',
    };

    const { node } = createFormComponent({ schema, uiSchema });

    expect(node.querySelector('div.help-block')).toHaveTextContent('plop');
  });

  describe('ui:focus', () => {
    function shouldFocus(schema: RJSFSchema, uiSchema: UiSchema, selector = 'input', formData?: any) {
      const props: GenericObjectType = {
        validator,
        schema,
        uiSchema,
      };
      if (typeof formData !== 'undefined') {
        props.formData = formData;
      }

      // activeElement only works correctly in jsdom if
      // the dom tree is connected to the document root.
      // https://github.com/jsdom/jsdom/issues/2723#issuecomment-664476384
      const domNode = document.createElement('div');
      document.body.appendChild(domNode);
      render(<Form schema={{ type: 'string' }} validator={validator} {...props} />, { baseElement: domNode });
      expect(document.querySelector(selector)).toEqual(document.activeElement);
      document.body.removeChild(domNode);
    }

    describe('number', () => {
      it('should focus on integer input', () => {
        shouldFocus(
          {
            type: 'integer',
          },
          { 'ui:autofocus': true },
        );
      });

      it('should focus on integer input, updown widget', () => {
        shouldFocus(
          {
            type: 'integer',
          },
          {
            'ui:widget': 'updown',
            'ui:autofocus': true,
          },
        );
      });

      it('should focus on integer input, range widget', () => {
        shouldFocus(
          {
            type: 'integer',
          },
          {
            'ui:widget': 'range',
            'ui:autofocus': true,
          },
        );
      });

      it('should focus on integer enum input', () => {
        shouldFocus(
          {
            type: 'integer',
            enum: [1, 2, 3],
          },
          {
            'ui:autofocus': true,
          },
          'select',
        );
      });
    });

    describe('string', () => {
      it('should focus on text input', () => {
        shouldFocus(
          {
            type: 'string',
          },
          { 'ui:autofocus': true },
        );
      });

      it('should focus on textarea', () => {
        shouldFocus(
          {
            type: 'string',
          },
          {
            'ui:widget': 'textarea',
            'ui:autofocus': true,
          },
          'textarea',
        );
      });

      it('should focus on password input', () => {
        shouldFocus(
          {
            type: 'string',
          },
          {
            'ui:widget': 'password',
            'ui:autofocus': true,
          },
        );
      });

      it('should focus on color input', () => {
        shouldFocus(
          {
            type: 'string',
          },
          {
            'ui:widget': 'color',
            'ui:autofocus': true,
          },
        );
      });

      it('should focus on email input', () => {
        shouldFocus(
          {
            type: 'string',
            format: 'email',
          },
          { 'ui:autofocus': true },
        );
      });

      it('should focus on uri input', () => {
        shouldFocus(
          {
            type: 'string',
            format: 'uri',
          },
          { 'ui:autofocus': true },
        );
      });

      it('should focus on data-url input', () => {
        shouldFocus(
          {
            type: 'string',
            format: 'data-url',
          },
          { 'ui:autofocus': true },
        );
      });
    });

    describe('object', () => {
      it('should focus on date input', () => {
        shouldFocus(
          {
            type: 'string',
            format: 'date',
          },
          { 'ui:autofocus': true },
        );
      });

      it('should focus on date-time input', () => {
        shouldFocus(
          {
            type: 'string',
            format: 'date-time',
          },
          { 'ui:autofocus': true },
        );
      });

      it('should focus on alt-date input', () => {
        shouldFocus(
          {
            type: 'string',
            format: 'date',
          },
          {
            'ui:widget': 'alt-date',
            'ui:autofocus': true,
          },
          'select',
        );
      });

      it('should focus on alt-date-time input', () => {
        shouldFocus(
          {
            type: 'string',
            format: 'date-time',
          },
          {
            'ui:widget': 'alt-datetime',
            'ui:autofocus': true,
          },
          'select',
        );
      });
    });

    describe('array', () => {
      it('should focus on multiple files input', () => {
        shouldFocus(
          {
            type: 'array',
            items: {
              type: 'string',
              format: 'data-url',
            },
          },
          { 'ui:autofocus': true },
        );
      });

      it('should focus on first item of a list of strings', () => {
        shouldFocus(
          {
            type: 'array',
            items: {
              type: 'string',
              default: 'foo',
            },
          },
          {
            'ui:autofocus': true,
          },
          'input',
          ['foo', 'bar'],
        );
      });

      it('should focus on first item of a multiple choices list', () => {
        shouldFocus(
          {
            type: 'array',
            items: {
              type: 'string',
              enum: ['foo', 'bar'],
            },
            uniqueItems: true,
          },
          {
            'ui:widget': 'checkboxes',
            'ui:autofocus': true,
          },
          'input',
          ['bar'],
        );
      });
    });

    describe('boolean', () => {
      it('should focus on checkbox input', () => {
        shouldFocus(
          {
            type: 'boolean',
          },
          { 'ui:autofocus': true },
        );
      });

      it('should focus on radio input', () => {
        shouldFocus(
          {
            type: 'boolean',
          },
          {
            'ui:widget': 'radio',
            'ui:autofocus': true,
          },
        );
      });

      it('should focus on select input', () => {
        shouldFocus(
          {
            type: 'boolean',
          },
          {
            'ui:widget': 'select',
            'ui:autofocus': true,
          },
          'select',
        );
      });
    });
  });

  describe('string', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
    };

    describe('file', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'file',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('input[type=file]')).toHaveLength(1);
      });
    });

    describe('textarea', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'textarea',
          'ui:placeholder': 'sample',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('textarea')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 'a',
          },
        });

        expect(node.querySelector('textarea')).toHaveValue('a');
      });

      it('should call onChange handler when text is updated', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 'a',
          },
        });

        act(() => {
          fireEvent.change(node.querySelector('textarea')!, {
            target: {
              value: 'b',
            },
          });
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: 'b' }, 'root_foo');
      });

      it('should set a placeholder value', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelector('textarea')).toHaveAttribute('placeholder', 'sample');
      });
    });

    describe('password', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'password',
          'ui:placeholder': 'sample',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=password]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 'a',
          },
        });

        expect(node.querySelector('[type=password]')).toHaveValue('a');
      });

      it('should call onChange handler when text is updated is checked', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 'a',
          },
        });

        act(() => {
          fireEvent.change(node.querySelector('[type=password]')!, {
            target: {
              value: 'b',
            },
          });
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: 'b' }, 'root_foo');
      });

      it('should set a placeholder value', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelector('[type=password]')).toHaveAttribute('placeholder', 'sample');
      });
    });

    describe('color', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'color',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=color]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: '#151ce6',
          },
        });

        expect(node.querySelector('[type=color]')).toHaveValue('#151ce6');
      });

      it('should call onChange handler when text is updated', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: '#151ce6',
          },
        });

        act(() => {
          fireEvent.change(node.querySelector('[type=color]')!, {
            target: {
              value: '#001122',
            },
          });
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: '#001122' }, 'root_foo');
      });
    });

    describe('hidden', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'hidden',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=hidden]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 'a',
          },
        });

        expect(node.querySelector('[type=hidden]')).toHaveValue('a');
      });

      it('should map widget value to a typed event property', () => {
        const { node, onSubmit } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 'a',
          },
        });

        submitForm(node);

        expectToHaveBeenCalledWithFormData(onSubmit, { foo: 'a' }, true);
      });
    });
  });

  describe('string (enum)', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          enum: ['a', 'b'],
        },
      },
    };

    describe('radio', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'radio',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=radio]')).toHaveLength(2);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 'b',
          },
        });

        expect(node.querySelectorAll('[type=radio]')[1]).toBeChecked();
      });

      it('should call onChange handler when value is updated', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 'a',
          },
        });

        act(() => {
          fireEvent.click(node.querySelectorAll('[type=radio]')[1]);
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: 'b' }, 'root_foo');
      });
    });
  });

  describe('number', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'number',
          multipleOf: 1,
          minimum: 10,
          maximum: 100,
        },
      },
    };

    describe('updown', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'updown',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=number]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 3.14,
          },
        });

        expect(node.querySelector('[type=number]')).toHaveValue(3.14);
      });

      it('should call onChange handler when value is updated', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 3.14,
          },
        });

        act(() => {
          fireEvent.change(node.querySelector('[type=number]')!, {
            target: {
              value: '6.28',
            },
          });
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: 6.28 }, 'root_foo');
      });

      describe('Constraint attributes', () => {
        let input: Element | null;

        beforeEach(() => {
          const { node } = createFormComponent({ schema, uiSchema });
          input = node.querySelector('[type=number]');
        });

        it('should support the minimum constraint', () => {
          expect(input).toHaveAttribute('min', '10');
        });

        it('should support maximum constraint', () => {
          expect(input).toHaveAttribute('max', '100');
        });

        it("should support '0' as minimum and maximum constraints", () => {
          const schema: RJSFSchema = {
            type: 'number',
            minimum: 0,
            maximum: 0,
          };
          const uiSchema: UiSchema = {
            'ui:widget': 'updown',
          };
          const { node } = createFormComponent({ schema, uiSchema });
          input = node.querySelector('[type=number]');

          expect(input).toHaveAttribute('min', '0');
          expect(input).toHaveAttribute('max', '0');
        });

        it('should support the multipleOf constraint', () => {
          expect(input).toHaveAttribute('step', '1');
        });
      });
    });

    describe('range', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'range',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=range]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 13.14,
          },
        });

        expect(node.querySelector('[type=range]')).toHaveValue('13.14');
      });

      it('should call onChange handler when value is updated', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            // Use a value that is greater than the minumum value of the schema
            foo: 13.14,
          },
        });

        act(() => {
          fireEvent.change(node.querySelector('[type=range]')!, {
            target: {
              value: '26.28',
            },
          });
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: 26.28 }, 'root_foo');
      });

      describe('Constraint attributes', () => {
        let input: Element | null;

        beforeEach(() => {
          const { node } = createFormComponent({ schema, uiSchema });
          input = node.querySelector('[type=range]');
        });

        it('should support the minimum constraint', () => {
          expect(input).toHaveAttribute('min', '10');
        });

        it('should support maximum constraint', () => {
          expect(input).toHaveAttribute('max', '100');
        });

        it("should support '0' as minimum and maximum constraints", () => {
          const schema: RJSFSchema = {
            type: 'number',
            minimum: 0,
            maximum: 0,
          };
          const uiSchema: UiSchema = {
            'ui:widget': 'range',
          };
          const { node } = createFormComponent({ schema, uiSchema });
          input = node.querySelector('[type=range]');

          expect(input).toHaveAttribute('min', '0');
          expect(input).toHaveAttribute('max', '0');
        });

        it('should support the multipleOf constraint', () => {
          expect(input).toHaveAttribute('step', '1');
        });
      });
    });

    describe('radio', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'number',
            enum: [3.14159, 2.718, 1.4142],
          },
        },
      };

      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'radio',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=radio]')).toHaveLength(3);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 2.718,
          },
        });

        expect(node.querySelectorAll('[type=radio]')[1]).toBeChecked();
      });

      it('should call onChange handler when value is updated', async () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 2.718,
          },
        });

        act(() => {
          // Click on the radio button to change it
          fireEvent.click(node.querySelectorAll('[type=radio]')[2]);
        });

        await waitFor(() => {
          expectToHaveBeenCalledWithFormData(onChange, { foo: 1.4142 }, 'root_foo');
        });
      });
    });

    describe('hidden', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'hidden',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=hidden]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 42,
          },
        });

        expect(node.querySelector('[type=hidden]')).toHaveValue('42');
      });

      it('should map widget value to a typed event property', () => {
        const { node, onSubmit } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 42,
          },
        });

        submitForm(node);

        expectToHaveBeenCalledWithFormData(onSubmit, { foo: 42 }, true);
      });
    });
  });

  describe('integer', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'integer',
        },
      },
    };

    describe('updown', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'updown',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=number]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 3,
          },
        });

        expect(node.querySelector('[type=number]')).toHaveValue(3);
      });

      it('should call onChange handler when value is updated', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 3,
          },
        });

        act(() => {
          fireEvent.change(node.querySelector('[type=number]')!, {
            target: {
              value: '6',
            },
          });
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: 6 }, 'root_foo');
      });
    });

    describe('range', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'range',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=range]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 3,
          },
        });

        expect(node.querySelector('[type=range]')).toHaveValue('3');
      });

      it('should call onChange handler when value is updated', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 3,
          },
        });

        act(() => {
          fireEvent.change(node.querySelector('[type=range]')!, {
            target: {
              value: '6',
            },
          });
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: 6 }, 'root_foo');
      });
    });

    describe('radio', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'integer',
            enum: [1, 2],
          },
        },
      };

      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'radio',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=radio]')).toHaveLength(2);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 2,
          },
        });

        expect(node.querySelectorAll('[type=radio]')[1]).toBeChecked();
      });

      it('should call onChange handler when value is updated', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 1,
          },
        });

        act(() => {
          fireEvent.click(node.querySelectorAll('[type=radio]')[1]);
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: 2 }, 'root_foo');
      });
    });

    describe('hidden', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'hidden',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=hidden]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 42,
          },
        });

        expect(node.querySelector('[type=hidden]')).toHaveValue('42');
      });

      it('should map widget value to a typed event property', () => {
        const { node, onSubmit } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: 42,
          },
        });

        submitForm(node);

        expectToHaveBeenCalledWithFormData(onSubmit, { foo: 42 }, true);
      });
    });
  });

  describe('boolean', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'boolean',
        },
      },
    };

    describe('radio', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'radio',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=radio]')).toHaveLength(2);
        expect(node.querySelectorAll('[type=radio]')[0]).not.toEqual(null);
        expect(node.querySelectorAll('[type=radio]')[1]).not.toEqual(null);
      });

      it('should render boolean option labels', () => {
        const { node } = createFormComponent({ schema, uiSchema });
        const labels = [].map.call(
          node.querySelectorAll('.field-radio-group label'),
          (node: Element) => node.textContent,
        );

        expect(labels).toEqual(['Yes', 'No']);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: false,
          },
        });

        expect(node.querySelectorAll('[type=radio]')[1]).toBeChecked();
      });

      it('should call onChange handler when false is checked', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: true,
          },
        });

        act(() => {
          fireEvent.click(node.querySelectorAll('[type=radio]')[1]);
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: false }, 'root_foo');
      });

      it('should call onChange handler when true is checked', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: false,
          },
        });

        act(() => {
          fireEvent.click(node.querySelectorAll('[type=radio]')[0]);
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: true }, 'root_foo');
      });
    });

    describe('select', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'select',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('select option')).toHaveLength(3);
      });

      it('should render boolean option labels', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('option')[1]).toHaveTextContent('Yes');
        expect(node.querySelectorAll('option')[2]).toHaveTextContent('No');
      });

      it('should call onChange handler when true is selected', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: false,
          },
        });

        act(() => {
          fireEvent.change(node.querySelector('select')!, {
            // DOM option change events always return strings
            target: {
              value: 0, // use index
            },
          });
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: true }, 'root_foo');
      });

      it('should call onChange handler when false is selected', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: false,
          },
        });

        act(() => {
          fireEvent.change(node.querySelector('select')!, {
            target: {
              value: 1, // use index
            },
          });
        });

        expectToHaveBeenCalledWithFormData(onChange, { foo: false }, 'root_foo');
      });
    });

    describe('hidden', () => {
      const uiSchema: UiSchema = {
        foo: {
          'ui:widget': 'hidden',
        },
      };

      it('should accept a uiSchema object', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=hidden]')).toHaveLength(1);
      });

      it('should support formData', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: true,
          },
        });

        expect(node.querySelector('[type=hidden]')).toHaveValue('true');
      });

      it('should map widget value to a typed event property', () => {
        const { node, onSubmit } = createFormComponent({
          schema,
          uiSchema,
          formData: {
            foo: true,
          },
        });

        submitForm(node);

        expectToHaveBeenCalledWithFormData(onSubmit, { foo: true }, true);
      });
    });
  });

  describe('custom root field id', () => {
    it('should use a custom root field id for objects', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
          bar: {
            type: 'string',
          },
        },
      };
      const uiSchema: UiSchema = {
        'ui:rootFieldId': 'myform',
      };
      const { node } = createFormComponent({ schema, uiSchema });

      const ids = [].map.call(node.querySelectorAll('input[type=text]'), (node: Element) => node.id);
      expect(ids).toEqual(['myform_foo', 'myform_bar']);
    });

    it('should use a custom root field id for arrays', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const uiSchema: UiSchema = {
        'ui:rootFieldId': 'myform',
      };
      const { node } = createFormComponent({
        schema,
        uiSchema,
        formData: ['foo', 'bar'],
      });

      const ids = [].map.call(node.querySelectorAll('input[type=text]'), (node: Element) => node.id);
      expect(ids).toEqual(['myform_0', 'myform_1']);
    });

    it('should use a custom root field id for array of objects', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'string',
            },
          },
        },
      };
      const uiSchema: UiSchema = {
        'ui:rootFieldId': 'myform',
      };
      const { node } = createFormComponent({
        schema,
        uiSchema,
        formData: [
          {
            foo: 'foo1',
            bar: 'bar1',
          },
          {
            foo: 'foo2',
            bar: 'bar2',
          },
        ],
      });

      const ids = [].map.call(node.querySelectorAll('input[type=text]'), (node: Element) => node.id);
      expect(ids).toEqual(['myform_0_foo', 'myform_0_bar', 'myform_1_foo', 'myform_1_bar']);
    });
  });

  describe('Disabled', () => {
    describe('Fields', () => {
      describe('ArrayField', () => {
        let node: Element;

        beforeEach(() => {
          const schema: RJSFSchema = {
            type: 'array',
            items: {
              type: 'string',
            },
          };
          const uiSchema: UiSchema = {
            'ui:disabled': true,
          };
          const formData = ['a', 'b'];

          const rendered = createFormComponent({
            schema,
            uiSchema,
            formData,
          });
          node = rendered.node;
        });

        it('should disable an ArrayField', () => {
          const disabled = [].map.call(
            node.querySelectorAll('[type=text]'),
            (node: HTMLSelectElement) => node.disabled,
          );
          expect(disabled).toEqual([true, true]);
        });

        it('should disable the Add button', () => {
          expect(node.querySelector('.rjsf-array-item-add button')).toBeDisabled();
        });

        it('should disable the Delete button', () => {
          expect(node.querySelector('.rjsf-array-item-remove')).toBeDisabled();
        });
      });

      describe('ObjectField', () => {
        let node: Element;

        beforeEach(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: {
                type: 'string',
              },
              bar: {
                type: 'string',
              },
            },
          };
          const uiSchema: UiSchema = {
            'ui:disabled': true,
          };

          const rendered = createFormComponent({ schema, uiSchema });
          node = rendered.node;
        });

        it('should disable an ObjectField', () => {
          const disabled = [].map.call(
            node.querySelectorAll('[type=text]'),
            (node: HTMLSelectElement) => node.disabled,
          );
          expect(disabled).toEqual([true, true]);
        });
      });
    });

    describe('Widgets', () => {
      function shouldBeDisabled(selector: string, schema: RJSFSchema, uiSchema: UiSchema) {
        const { node } = createFormComponent({ schema, uiSchema });
        expect(node.querySelector(selector)).toBeDisabled();
      }

      it('should disable a text widget', () => {
        shouldBeDisabled(
          'input[type=text]',
          {
            type: 'string',
          },
          { 'ui:disabled': true },
        );
      });

      it('should disabled a file widget', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'data-url',
          },
          uiSchema: {
            'ui:disabled': true,
          },
        });
        expect(node.querySelector('input[type=file]')).toBeDisabled();
      });

      it('should disable a textarea widget', () => {
        shouldBeDisabled(
          'textarea',
          {
            type: 'string',
          },
          {
            'ui:disabled': true,
            'ui:widget': 'textarea',
          },
        );
      });

      it('should disable a number text widget', () => {
        shouldBeDisabled(
          'input[type=number]',
          {
            type: 'number',
          },
          { 'ui:disabled': true },
        );
      });

      it('should disable a number widget', () => {
        shouldBeDisabled(
          'input[type=number]',
          {
            type: 'number',
          },
          {
            'ui:disabled': true,
            'ui:widget': 'updown',
          },
        );
      });

      it('should disable a range widget', () => {
        shouldBeDisabled(
          'input[type=range]',
          {
            type: 'number',
          },
          {
            'ui:disabled': true,
            'ui:widget': 'range',
          },
        );
      });

      it('should disable a select widget', () => {
        shouldBeDisabled(
          'select',
          {
            type: 'string',
            enum: ['a', 'b'],
          },
          { 'ui:disabled': true },
        );
      });

      it('should disable a checkbox widget', () => {
        shouldBeDisabled(
          'input[type=checkbox]',
          {
            type: 'boolean',
          },
          { 'ui:disabled': true },
        );
      });

      it('should disable a radio widget', () => {
        shouldBeDisabled(
          'input[type=radio]',
          {
            type: 'boolean',
          },
          {
            'ui:disabled': true,
            'ui:widget': 'radio',
          },
        );
      });

      it('should disable a color widget', () => {
        shouldBeDisabled(
          'input[type=color]',
          {
            type: 'string',
            format: 'color',
          },
          { 'ui:disabled': true },
        );
      });

      it('should disable a password widget', () => {
        shouldBeDisabled(
          'input[type=password]',
          {
            type: 'string',
          },
          {
            'ui:disabled': true,
            'ui:widget': 'password',
          },
        );
      });

      it('should disable an email widget', () => {
        shouldBeDisabled(
          'input[type=email]',
          {
            type: 'string',
            format: 'email',
          },
          { 'ui:disabled': true },
        );
      });

      it('should disable a date widget', () => {
        shouldBeDisabled(
          'input[type=date]',
          {
            type: 'string',
            format: 'date',
          },
          { 'ui:disabled': true },
        );
      });

      it('should disable a datetime widget', () => {
        shouldBeDisabled(
          'input[type=datetime-local]',
          {
            type: 'string',
            format: 'date-time',
          },
          { 'ui:disabled': true },
        );
      });

      it('should disable an alternative date widget', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema: {
            'ui:disabled': true,
            'ui:widget': 'alt-date',
          },
        });

        const disabled = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.disabled);
        expect(disabled).toEqual([true, true, true]);
      });

      it('should disable an alternative datetime widget', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date-time',
          },
          uiSchema: {
            'ui:disabled': true,
            'ui:widget': 'alt-datetime',
          },
        });

        const disabled = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.disabled);
        expect(disabled).toEqual([true, true, true, true, true, true]);
      });
    });
  });

  describe('Readonly', () => {
    describe('Fields', () => {
      describe('ArrayField', () => {
        let node: Element;

        beforeEach(() => {
          const schema: RJSFSchema = {
            type: 'array',
            items: {
              type: 'string',
            },
          };
          const uiSchema: UiSchema = {
            'ui:readonly': true,
          };
          const formData = ['a', 'b'];

          const rendered = createFormComponent({
            schema,
            uiSchema,
            formData,
          });
          node = rendered.node;
        });

        it('should mark as readonly an ArrayField', () => {
          const disabled = [].map.call(node.querySelectorAll('[type=text]'), (node: Element) =>
            node.hasAttribute('readonly'),
          );
          expect(disabled).toEqual([true, true]);
        });

        it('should disable the Add button', () => {
          expect(node.querySelector('.rjsf-array-item-add button')).toBeDisabled();
        });

        it('should disable the Delete button', () => {
          expect(node.querySelector('.rjsf-array-item-remove')).toBeDisabled();
        });
      });

      describe('ObjectField', () => {
        let node: Element;

        beforeEach(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: {
                type: 'string',
              },
              bar: {
                type: 'string',
              },
            },
          };
          const uiSchema: UiSchema = {
            'ui:readonly': true,
          };

          const rendered = createFormComponent({ schema, uiSchema });
          node = rendered.node;
        });

        it('should mark as readonly an ObjectField', () => {
          const disabled = [].map.call(node.querySelectorAll('[type=text]'), (node: Element) =>
            node.hasAttribute('readonly'),
          );
          expect(disabled).toEqual([true, true]);
        });
      });
    });

    describe('Widgets', () => {
      function shouldBeReadonly(selector: string, schema: RJSFSchema, uiSchema?: UiSchema) {
        const { node } = createFormComponent({ schema, uiSchema });
        expect(node.querySelector(selector)).toHaveAttribute('readonly', '');
      }
      function shouldBeDisabled(selector: string, schema: RJSFSchema, uiSchema?: UiSchema) {
        const { node } = createFormComponent({ schema, uiSchema });
        expect(node.querySelector(selector)).toBeDisabled();
      }

      it('should mark as readonly a text widget', () => {
        shouldBeReadonly(
          'input[type=text]',
          {
            type: 'string',
          },
          { 'ui:readonly': true },
        );
      });

      it('should mark as readonly a file widget', () => {
        // We mark a file widget as readonly by disabling it.
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'data-url',
          },
          uiSchema: {
            'ui:readonly': true,
          },
        });
        expect(node.querySelector('input[type=file]')).toBeDisabled();
      });

      it('should mark as readonly a textarea widget', () => {
        shouldBeReadonly(
          'textarea',
          {
            type: 'string',
          },
          {
            'ui:readonly': true,
            'ui:widget': 'textarea',
          },
        );
      });

      it('should mark as readonly a number text widget', () => {
        shouldBeReadonly(
          'input[type=number]',
          {
            type: 'number',
          },
          { 'ui:readonly': true },
        );
      });

      it('should mark as readonly a number widget', () => {
        shouldBeReadonly(
          'input[type=number]',
          {
            type: 'number',
          },
          {
            'ui:readonly': true,
            'ui:widget': 'updown',
          },
        );
      });

      it('should mark as readonly a range widget', () => {
        shouldBeReadonly(
          'input[type=range]',
          {
            type: 'number',
          },
          {
            'ui:readonly': true,
            'ui:widget': 'range',
          },
        );
      });

      it('should mark readonly as disabled on a select widget', () => {
        shouldBeDisabled(
          'select',
          {
            type: 'string',
            enum: ['a', 'b'],
          },
          { 'ui:readonly': true },
        );
      });

      it('should mark as readonly a color widget', () => {
        shouldBeReadonly(
          'input[type=color]',
          {
            type: 'string',
            format: 'color',
          },
          { 'ui:readonly': true },
        );
      });

      it('should mark as readonly a password widget', () => {
        shouldBeReadonly(
          'input[type=password]',
          {
            type: 'string',
          },
          {
            'ui:readonly': true,
            'ui:widget': 'password',
          },
        );
      });

      it('should mark as readonly a url widget', () => {
        shouldBeReadonly(
          'input[type=url]',
          {
            type: 'string',
            format: 'uri',
          },
          { 'ui:readonly': true },
        );
      });

      it('should mark as readonly an email widget', () => {
        shouldBeReadonly(
          'input[type=email]',
          {
            type: 'string',
            format: 'email',
          },
          { 'ui:readonly': true },
        );
      });

      it('should mark as readonly a date widget', () => {
        shouldBeReadonly(
          'input[type=date]',
          {
            type: 'string',
            format: 'date',
          },
          { 'ui:readonly': true },
        );
      });

      it('should mark as readonly a datetime widget', () => {
        shouldBeReadonly(
          'input[type=datetime-local]',
          {
            type: 'string',
            format: 'date-time',
          },
          { 'ui:readonly': true },
        );
      });

      it('should mark readonly as disabled on an alternative date widget', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema: {
            'ui:readonly': true,
            'ui:widget': 'alt-date',
          },
        });

        const readonly = [].map.call(node.querySelectorAll('select'), (node: Element) => node.hasAttribute('disabled'));
        expect(readonly).toEqual([true, true, true]);
      });

      it('should mark readonly as disabled on an alternative datetime widget', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date-time',
          },
          uiSchema: {
            'ui:readonly': true,
            'ui:widget': 'alt-datetime',
          },
        });

        const readonly = [].map.call(node.querySelectorAll('select'), (node: Element) => node.hasAttribute('disabled'));
        expect(readonly).toEqual([true, true, true, true, true, true]);
      });
    });
  });

  describe('Readonly in schema', () => {
    describe('Fields', () => {
      describe('ArrayField', () => {
        let node: Element;

        beforeEach(() => {
          const schema: RJSFSchema = {
            type: 'array',
            items: {
              type: 'string',
            },
            readOnly: true,
          };
          const uiSchema: UiSchema = {};
          const formData = ['a', 'b'];

          const rendered = createFormComponent({ schema, uiSchema, formData });
          node = rendered.node;
        });

        it('should mark as readonly an ArrayField', () => {
          const disabled = [].map.call(node.querySelectorAll('[type=text]'), (node: Element) =>
            node.hasAttribute('readonly'),
          );
          expect(disabled).toEqual([true, true]);
        });

        it('should disable the Add button', () => {
          expect(node.querySelector('.rjsf-array-item-add button')).toBeDisabled();
        });

        it('should disable the Delete button', () => {
          expect(node.querySelector('.rjsf-array-item-remove')).toBeDisabled();
        });
      });

      describe('ObjectField', () => {
        it('should mark as readonly an ObjectField', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: {
                type: 'string',
              },
              bar: {
                type: 'string',
              },
            },
            readOnly: true,
          };
          const uiSchema: UiSchema = {};

          const rendered = createFormComponent({ schema, uiSchema });
          const node = rendered.node;

          const disabled = [].map.call(node.querySelectorAll('[type=text]'), (node: Element) =>
            node.hasAttribute('readonly'),
          );
          expect(disabled).toEqual([true, true]);
        });

        it('should not mark as readonly even if globalOptions set readonly', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: {
                type: 'string',
              },
              bar: {
                type: 'string',
              },
            },
            readOnly: true,
          };

          const uiSchema: UiSchema = {
            'ui:globalOptions': {
              readonly: true,
            },
            foo: {
              'ui:readonly': false,
            },
          };

          const rendered = createFormComponent({ schema, uiSchema });
          const node = rendered.node;

          const disabled = [].map.call(node.querySelectorAll('[type=text]'), (node: Element) =>
            node.hasAttribute('readonly'),
          );
          expect(disabled).toEqual([false, true]);
        });
      });
    });

    describe('Widgets', () => {
      function shouldBeReadonly(selector: string, schema: RJSFSchema, uiSchema?: UiSchema) {
        const { node } = createFormComponent({ schema, uiSchema });
        expect(node.querySelector(selector)).toHaveAttribute('readonly', '');
      }
      function shouldBeDisabled(selector: string, schema: RJSFSchema, uiSchema?: UiSchema) {
        const { node } = createFormComponent({ schema, uiSchema });
        expect(node.querySelector(selector)).toBeDisabled();
      }

      it('should mark as readonly a text widget', () => {
        shouldBeReadonly(
          'input[type=text]',
          {
            type: 'string',
            readOnly: true,
          },
          {},
        );
      });

      it('should mark as readonly a file widget', () => {
        // We mark a file widget as readonly by disabling it.
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'data-url',
            readOnly: true,
          },
          uiSchema: {},
        });
        expect(node.querySelector('input[type=file]')).toBeDisabled();
      });

      it('should mark as readonly a textarea widget', () => {
        shouldBeReadonly(
          'textarea',
          {
            type: 'string',
            readOnly: true,
          },
          {
            'ui:widget': 'textarea',
          },
        );
      });

      it('should mark as readonly a number text widget', () => {
        shouldBeReadonly(
          'input[type=number]',
          {
            type: 'number',
            readOnly: true,
          },
          {},
        );
      });

      it('should mark as readonly a number widget', () => {
        shouldBeReadonly(
          'input[type=number]',
          {
            type: 'number',
            readOnly: true,
          },
          {
            'ui:widget': 'updown',
          },
        );
      });

      it('should mark as readonly a range widget', () => {
        shouldBeReadonly(
          'input[type=range]',
          {
            type: 'number',
            readOnly: true,
          },
          {
            'ui:widget': 'range',
          },
        );
      });

      it('should mark readonly as disabled on a select widget', () => {
        shouldBeDisabled(
          'select',
          {
            type: 'string',
            enum: ['a', 'b'],
            readOnly: true,
          },
          {},
        );
      });

      it('should mark as readonly a color widget', () => {
        shouldBeReadonly(
          'input[type=color]',
          {
            type: 'string',
            format: 'color',
            readOnly: true,
          },
          {},
        );
      });

      it('should mark as readonly a password widget', () => {
        shouldBeReadonly(
          'input[type=password]',
          {
            type: 'string',
            readOnly: true,
          },
          {
            'ui:widget': 'password',
          },
        );
      });

      it('should mark as readonly a url widget', () => {
        shouldBeReadonly(
          'input[type=url]',
          {
            type: 'string',
            format: 'uri',
            readOnly: true,
          },
          {},
        );
      });

      it('should mark as readonly an email widget', () => {
        shouldBeReadonly('input[type=email]', {
          type: 'string',
          format: 'email',
          readOnly: true,
        });
      });

      it('should mark as readonly a date widget', () => {
        shouldBeReadonly('input[type=date]', {
          type: 'string',
          format: 'date',
          readOnly: true,
        });
      });

      it('should mark as readonly a datetime widget', () => {
        shouldBeReadonly('input[type=datetime-local]', {
          type: 'string',
          format: 'date-time',
          readOnly: true,
        });
      });

      it('should mark readonly as disabled on an alternative date widget', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
            readOnly: true,
          },
          uiSchema: {
            'ui:widget': 'alt-date',
          },
        });

        const readonly = [].map.call(node.querySelectorAll('select'), (node: Element) => node.hasAttribute('disabled'));
        expect(readonly).toEqual([true, true, true]);
      });

      it('should mark readonly as disabled on an alternative datetime widget', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date-time',
            readOnly: true,
          },
          uiSchema: {
            'ui:widget': 'alt-datetime',
          },
        });

        const readonly = [].map.call(node.querySelectorAll('select'), (node: Element) => node.hasAttribute('disabled'));
        expect(readonly).toEqual([true, true, true, true, true, true]);
      });
    });
  });
});
