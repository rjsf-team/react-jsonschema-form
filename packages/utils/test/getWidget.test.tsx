import { forwardRef, memo } from 'react';
import TestRenderer from 'react-test-renderer';

import { IdSchema, Registry, RJSFSchema, WidgetProps, getWidget } from '../src';

const subschema: RJSFSchema = {
  type: 'boolean',
  default: true,
};

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    anObject: {
      type: 'object',
      properties: {
        array: {
          type: 'array',
          default: ['foo', 'bar'],
          items: {
            type: 'string',
          },
        },
        bool: subschema,
      },
    },
  },
};

const TestRefWidget = forwardRef(function TestRefWidget(props: WidgetProps, ref: React.ForwardedRef<any>) {
  const { options } = props;
  return (
    <span {...options} ref={ref}>
      test
    </span>
  );
});

TestRefWidget.defaultProps = {
  options: { id: 'test-id' },
};

function TestWidget(props: WidgetProps) {
  const { options } = props;
  return <div {...options}>test</div>;
}

TestWidget.defaultProps = {
  id: 'foo',
};

function TestWidgetDefaults(props: WidgetProps) {
  const { options } = props;
  return <div {...options}>test</div>;
}

TestWidgetDefaults.defaultProps = {
  options: { color: 'yellow' },
};

const widgetProps: WidgetProps = {
  id: '',
  name: '',
  autofocus: false,
  disabled: false,
  errorSchema: {},
  formContext: undefined,
  formData: undefined,
  onBlur: jest.fn(),
  onChange: jest.fn(),
  onFocus: jest.fn(),
  readonly: false,
  required: false,
  idSchema: {} as IdSchema,
  schema: {} as RJSFSchema,
  uiSchema: {},
  options: {},
  value: undefined,
  multiple: false,
  label: '',
  placeholder: '',
  rawErrors: [],
  registry: {} as Registry,
};

describe('getWidget()', () => {
  it('should fail if widget has incorrect type', () => {
    expect(() => getWidget(schema)).toThrowError('Unsupported widget definition: undefined');
  });

  it('should fail if widget has no type property', () => {
    expect(() => getWidget(schema, 'blabla')).toThrowError(`No widget for type 'object'`);
  });

  it('should fail if schema has no type property', () => {
    expect(() => getWidget({}, 'blabla')).toThrowError(`No widget 'blabla' for type 'undefined'`);
  });

  it('should return widget if in registered widgets', () => {
    const registry = { blabla: TestWidget };
    const TheWidget = getWidget(schema, 'blabla', registry);
    const rendered = TestRenderer.create(<TheWidget {...widgetProps} />);
    expect(rendered.toJSON()).toEqual({
      children: ['test'],
      props: {},
      type: 'div',
    });
  });

  it('should return `SelectWidget` for boolean type', () => {
    const registry = { SelectWidget: TestWidgetDefaults };
    const TheWidget = getWidget(subschema, 'select', registry);
    const rendered = TestRenderer.create(<TheWidget {...widgetProps} options={{ color: 'green' }} />);
    expect(rendered.toJSON()).toEqual({
      children: ['test'],
      props: { color: 'green' },
      type: 'div',
    });
  });

  it('should not fail on correct component', () => {
    const TheWidget = getWidget(schema, TestWidgetDefaults);
    const rendered = TestRenderer.create(<TheWidget {...widgetProps} />);
    expect(rendered.toJSON()).toEqual({
      children: ['test'],
      props: { color: 'yellow' },
      type: 'div',
    });
  });

  it('should not fail on forwarded ref component', () => {
    const TheWidget = getWidget(schema, TestRefWidget);
    const rendered = TestRenderer.create(<TheWidget {...widgetProps} />);
    expect(rendered.toJSON()).toEqual({
      children: ['test'],
      props: { id: 'test-id' },
      type: 'span',
    });
  });

  it('should not fail on memo component', () => {
    const TheWidget = memo(TestWidget);
    const rendered = TestRenderer.create(<TheWidget {...widgetProps} />);
    expect(rendered.toJSON()).toEqual({
      children: ['test'],
      props: {},
      type: 'div',
    });
  });
});
