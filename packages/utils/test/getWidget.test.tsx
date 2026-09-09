/** @vitest-environment jsdom */
import type { ForwardedRef } from 'react';
import { forwardRef, memo } from 'react';
import { render } from '@testing-library/react';

import type { FieldPathId, Registry, RJSFSchema, WidgetProps, Widget } from '../src/index.ts';
import { getWidget } from '../src/index.ts';

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

const TestRefWidget: Widget = forwardRef<HTMLSpanElement, Partial<WidgetProps>>(
  (props: Partial<WidgetProps>, ref: ForwardedRef<HTMLSpanElement>) => {
    const { id = 'test-id', ...options } = props.options ?? {};
    return (
      <span id={id} {...options} ref={ref}>
        test
      </span>
    );
  },
);

function TestWidget(props: WidgetProps) {
  const { options } = props;
  return <div {...options}>test</div>;
}

function TestWidgetWithDefaultOptions(props: WidgetProps) {
  const { color = 'yellow', ...options } = props.options;
  return (
    <div color={color} {...options}>
      test
    </div>
  );
}

const widgetProps: WidgetProps = {
  id: '',
  name: '',
  autofocus: false,
  disabled: false,
  errorSchema: {},
  formContext: undefined,
  formData: undefined,
  onBlur: vi.fn(),
  onChange: vi.fn(),
  onFocus: vi.fn(),
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
    const registry = { SelectWidget: TestWidgetWithDefaultOptions };
    const TheWidget = getWidget(subschema, 'select', registry);
    const { asFragment } = render(<TheWidget {...widgetProps} options={{ color: 'green' }} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should not fail on correct component', () => {
    const TheWidget = getWidget(schema, TestWidgetWithDefaultOptions);
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
