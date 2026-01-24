import { forwardRef, memo, ForwardedRef } from 'react';
import { render } from '@testing-library/react';

import { FieldPathId, Registry, RJSFSchema, WidgetProps, getWidget } from '../src';

const subschema: RJSFSchema = {
  type: 'boolean',
  default: true,
};

const subschemaStr = JSON.stringify(subschema);

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
const schemaStr = JSON.stringify(schema);

const TestRefWidget = forwardRef<HTMLSpanElement, Partial<WidgetProps>>(function TestRefWidget(
  props: Partial<WidgetProps>,
  ref: ForwardedRef<HTMLSpanElement>,
) {
  const { options } = props;
  return (
    <span {...options} ref={ref}>
      test
    </span>
  );
});

TestRefWidget.defaultProps = { options: { id: 'test-id' } };

function TestWidget(props: WidgetProps) {
  const { options } = props;
  return <div {...options}>test</div>;
}

function TestWidgetDefaults(props: WidgetProps) {
  const { options } = props;
  return <div {...options}>test</div>;
}

TestWidgetDefaults.defaultProps = { options: { color: 'yellow' } };


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
  fieldPathId: {} as FieldPathId,
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
    expect(() => getWidget(schema)).toThrow(`Unsupported widget definition: undefined in schema: ${schemaStr}`);
  });

  it('should fail if widget has no type property', () => {
    expect(() => getWidget(schema, 'blabla')).toThrow(`No widget for type 'object' in schema: ${schemaStr}`);
  });

  it('should fail if schema `type` has no widget property', () => {
    expect(() => getWidget(subschema, 'blabla')).toThrow(
      `No widget 'blabla' for type 'boolean' in schema: ${subschemaStr}`,
    );
  });

  it('should fail if schema has no type property', () => {
    expect(() => getWidget({}, 'blabla')).toThrow(`No widget 'blabla' for type 'undefined' in schema: {}`);
  });

  it('should return widget if in registered widgets', () => {
    const registry = { blabla: TestWidget };
    const TheWidget = getWidget(schema, 'blabla', registry);
    const { asFragment } = render(<TheWidget {...widgetProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should return `SelectWidget` for boolean type', () => {
    const registry = { SelectWidget: TestWidgetDefaults };
    const TheWidget = getWidget(subschema, 'select', registry);
    const { asFragment } = render(<TheWidget {...widgetProps} options={{ color: 'green' }} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should not fail on correct component', () => {
    const TheWidget = getWidget(schema, TestWidgetDefaults);
    const { asFragment } = render(<TheWidget {...widgetProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should not fail on forwarded ref component', () => {
    const TheWidget = getWidget(schema, TestRefWidget);
    const { asFragment } = render(<TheWidget {...widgetProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should not fail on memo component', () => {
    const TheWidget = memo(TestWidget);
    const { asFragment } = render(<TheWidget {...widgetProps} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
