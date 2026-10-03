/** @vitest-environment jsdom */
import type { ForwardedRef } from 'react';
import { createContext, forwardRef, memo } from 'react';
import { render } from '@testing-library/react';

import type { Registry, RJSFSchema, WidgetProps, Widget } from '../src/index.ts';
import { getWidget, resolveWidget, ROOT_FIELD_PATH } from '../src/index.ts';

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
  fieldPath: ROOT_FIELD_PATH,
  schema: {},
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

  it('should fail for a type that is not a JSON Schema type', () => {
    const unknownType = { type: 'foo' } as unknown as RJSFSchema;
    expect(() => getWidget(unknownType, 'blabla')).toThrow(`No widget for type 'foo' in schema: {"type":"foo"}`);
  });

  it('should return `SelectWidget` for a null type', () => {
    const registry = { SelectWidget: TestWidget };
    expect(getWidget({ type: 'null', enum: [null] }, 'select', registry)).toBe(TestWidget);
  });

  it('should fail if the object type has no such widget', () => {
    expect(() => getWidget(schema, 'blabla')).toThrow(`No widget 'blabla' for type 'object' in schema: ${schemaStr}`);
  });

  it('should return `SelectWidget` for an object type, which a select over object constants renders with', () => {
    const registry = { SelectWidget: TestWidget };
    expect(getWidget(schema, 'select', registry)).toBe(TestWidget);
  });

  it('should return `RadioWidget` for an array select over whole array constants', () => {
    const registry = { RadioWidget: TestWidget };
    expect(getWidget({ type: 'array', oneOf: [{ const: [1] }, { const: [2] }] }, 'radio', registry)).toBe(TestWidget);
    expect(getWidget({ type: 'array', enum: [[1], [2]] }, 'radio', registry)).toBe(TestWidget);
  });

  it.each(['checkboxes', 'files'])('should fail for %s on an array select over whole array constants', (widget) => {
    const schema: RJSFSchema = { type: 'array', enum: [[1, 2], [3]] };
    expect(() => getWidget(schema, widget, { CheckboxesWidget: TestWidget, FileWidget: TestWidget })).toThrow(
      `No widget '${widget}' for type 'array' in schema: ${JSON.stringify(schema)}`,
    );
  });

  it('should fail for a radio on a multi-select array, which would write one item in place of the list', () => {
    const multiSelect: RJSFSchema = { type: 'array', uniqueItems: true, items: { enum: ['a', 'b'] } };
    expect(() => getWidget(multiSelect, 'radio', { RadioWidget: TestWidget })).toThrow(
      `No widget 'radio' for type 'array' in schema: ${JSON.stringify(multiSelect)}`,
    );
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

  it('should return `TimeWidget` for the `iso-time` format', () => {
    const registry = { TimeWidget: TestWidget };
    const TheWidget = getWidget({ type: 'string' }, 'iso-time', registry);
    const { asFragment } = render(<TheWidget {...widgetProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should return `DateTimeWidget` for the `iso-date-time` format', () => {
    const registry = { DateTimeWidget: TestWidget };
    const TheWidget = getWidget({ type: 'string' }, 'iso-date-time', registry);
    const { asFragment } = render(<TheWidget {...widgetProps} />);
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
    const TheWidget = getWidget(schema, memo(TestWidget));
    const { asFragment } = render(<TheWidget {...widgetProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it.each(['constructor', 'toString'])('should fail for %s, which no widget is registered under', (name) => {
    expect(() => getWidget(schema, name, {})).toThrow(`No widget '${name}' for type 'object' in schema: ${schemaStr}`);
  });

  it('should fail for a React element, naming what to pass instead', () => {
    const element = <TestWidget {...widgetProps} />;
    const message =
      'Unsupported widget definition: the widget is a React element rather than a component (pass MyWidget, not <MyWidget />) ' +
      `in schema: ${schemaStr}`;
    expect(() => getWidget(schema, element as unknown as Widget)).toThrow(message);
    expect(() => getWidget(schema, 'blabla', { blabla: element as unknown as Widget })).toThrow(message);
  });

  it('should fail for an object that is not a component, such as a context Provider', () => {
    expect(() => getWidget(schema, createContext(null).Provider as unknown as Widget)).toThrow(
      `Unsupported widget definition: object in schema: ${schemaStr}`,
    );
  });
});

describe('resolveWidget()', () => {
  it('should return the widget getWidget() resolves as Widget', () => {
    expect(resolveWidget(subschema, 'select', { SelectWidget: TestWidget })).toEqual({ Widget: TestWidget });
    expect(resolveWidget(schema, TestWidget)).toEqual({ Widget: TestWidget });
  });

  it('should throw the error getWidget() throws', () => {
    expect(() => resolveWidget(schema)).toThrow(`Unsupported widget definition: undefined in schema: ${schemaStr}`);
  });
});
