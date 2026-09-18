import { forwardRef, useState } from 'react';
import type { FieldTemplateProps, RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { IChangeEvent } from '../src/index.ts';
import Form, { FieldTemplate as DefaultFieldTemplate } from '../src/index.ts';
import { createFormComponent } from './testUtils.tsx';

const user = userEvent.setup();

/** Typing in one field must not re-render its siblings. That only holds while every prop a sibling receives keeps
 * its reference across a change, so a leak in any of them fails here.
 */
describe('render stability across sibling fields', () => {
  interface FormValue {
    first: string;
    second: string;
    nested: { inner: string };
  }
  const initialFormData = (): FormValue => ({ first: '', second: '', nested: { inner: '' } });
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      first: { type: 'string' },
      second: { type: 'string' },
      nested: {
        type: 'object',
        properties: {
          inner: { type: 'string' },
        },
      },
    },
  };

  let renderCounts: Record<string, number>;

  function CountingFieldTemplate(props: FieldTemplateProps) {
    renderCounts[props.id] = (renderCounts[props.id] ?? 0) + 1;
    return <DefaultFieldTemplate {...props} />;
  }

  beforeEach(() => {
    renderCounts = {};
  });

  it('typing in one field does not re-render sibling fields', async () => {
    const { node } = createFormComponent({
      schema,
      formData: initialFormData(),
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const secondBefore = renderCounts.root_second;
    const nestedBefore = renderCounts.root_nested;
    const innerBefore = renderCounts.root_nested_inner;
    const firstBefore = renderCounts.root_first;

    await user.type(node.querySelector('#root_first')!, 'abc');

    expect(renderCounts.root_first).toBeGreaterThan(firstBefore);
    expect(renderCounts.root_second).toBe(secondBefore);
    expect(renderCounts.root_nested).toBe(nestedBefore);
    expect(renderCounts.root_nested_inner).toBe(innerBefore);
  });

  it('typing in a nested field does not re-render fields outside its branch', async () => {
    const { node } = createFormComponent({
      schema,
      formData: initialFormData(),
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const firstBefore = renderCounts.root_first;
    const secondBefore = renderCounts.root_second;
    const innerBefore = renderCounts.root_nested_inner;

    await user.type(node.querySelector('#root_nested_inner')!, 'abc');

    expect(renderCounts.root_nested_inner).toBeGreaterThan(innerBefore);
    expect(renderCounts.root_first).toBe(firstBefore);
    expect(renderCounts.root_second).toBe(secondBefore);
  });

  it('typing in a layout grid cell does not re-render the other cells', async () => {
    const { node } = createFormComponent({
      schema,
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': { children: [{ 'ui:col': { children: ['first', 'second', 'nested'] } }] } },
      },
      formData: initialFormData(),
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const secondBefore = renderCounts.root_second;
    const innerBefore = renderCounts.root_nested_inner;

    await user.type(node.querySelector('#root_first')!, 'abc');

    expect(renderCounts.root_second).toBe(secondBefore);
    expect(renderCounts.root_nested_inner).toBe(innerBefore);
  });

  it('a controlled parent accepting each change keeps sibling fields and unchanged subtrees stable', async () => {
    const seen: IChangeEvent<FormValue>[] = [];
    function Parent() {
      const [formData, setFormData] = useState(initialFormData);
      return (
        <Form
          schema={schema}
          validator={validator}
          formData={formData}
          templates={{ FieldTemplate: CountingFieldTemplate }}
          onChange={(event) => {
            seen.push(event);
            setFormData(event.formData);
          }}
        />
      );
    }
    const { container } = render(<Parent />);

    const secondBefore = renderCounts.root_second;
    const nestedBefore = renderCounts.root_nested;
    const innerBefore = renderCounts.root_nested_inner;

    await user.type(container.querySelector('#root_first')!, 'abc');

    const proposals = seen.map((event) => event.formData);
    expect(proposals.map((formData) => formData?.first)).toEqual(['a', 'ab', 'abc']);
    // Each proposal becomes the next prop, so it must share unchanged subtrees with the value it was applied to
    const nestedInstances = new Set(proposals.map((formData) => formData?.nested));
    expect(nestedInstances.size).toBe(1);
    expect(renderCounts.root_second).toBe(secondBefore);
    expect(renderCounts.root_nested).toBe(nestedBefore);
    expect(renderCounts.root_nested_inner).toBe(innerBefore);
  });

  it('a parent re-render with equal but rebuilt props re-renders no field', () => {
    function Parent({ tick }: { tick: number }) {
      return (
        <Form
          schema={schema}
          validator={validator}
          formData={initialFormData()}
          uiSchema={{ first: { 'ui:help': <span>tick {tick >= 0 ? 'help' : ''}</span> } }}
          formContext={{ label: 'stable' }}
          templates={{ FieldTemplate: CountingFieldTemplate }}
          onChange={() => undefined}
        />
      );
    }
    const { rerender } = render(<Parent tick={0} />);
    const before = { ...renderCounts };
    expect(Object.keys(before)).toEqual(expect.arrayContaining(['root_first', 'root_second', 'root_nested_inner']));

    rerender(<Parent tick={1} />);

    expect(renderCounts).toEqual(before);
  });

  it('live validation on change leaves a sibling with an unchanged error alone', async () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: { first: { type: 'string' }, second: { type: 'string', minLength: 3 } },
      },
      formData: { first: '', second: 'ab' },
      liveValidate: 'onChange',
      templates: { FieldTemplate: CountingFieldTemplate },
    });
    await user.type(node.querySelector('#root_first')!, 'a');
    expect(node.textContent).toContain('must NOT have fewer than 3 characters');
    const secondBefore = renderCounts.root_second;
    expect(secondBefore).toBeGreaterThan(0);

    await user.type(node.querySelector('#root_first')!, 'bc');

    expect(renderCounts.root_second).toBe(secondBefore);
  });

  it('live validation on blur leaves sibling fields alone', async () => {
    const { node } = createFormComponent({
      schema,
      formData: initialFormData(),
      liveValidate: 'onBlur',
      templates: { FieldTemplate: CountingFieldTemplate },
    });
    await user.type(node.querySelector('#root_first')!, 'abc');
    const secondBefore = renderCounts.root_second;
    const innerBefore = renderCounts.root_nested_inner;
    expect(secondBefore).toBeGreaterThan(0);

    await user.tab();

    expect(renderCounts.root_second).toBe(secondBefore);
    expect(renderCounts.root_nested_inner).toBe(innerBefore);
  });

  it('a submit that changes no errors re-renders no field', async () => {
    const { node } = createFormComponent({
      schema,
      formData: initialFormData(),
      templates: { FieldTemplate: CountingFieldTemplate },
    });
    const before = { ...renderCounts };
    expect(Object.keys(before)).toEqual(expect.arrayContaining(['root_first', 'root_second', 'root_nested_inner']));

    await user.click(node.querySelector('button[type=submit]')!);

    expect(renderCounts).toEqual(before);
  });

  it('typing in one array item does not re-render the other items', async () => {
    const { node } = createFormComponent({
      schema: { type: 'array', items: { type: 'string' } },
      formData: ['', ''],
      templates: { FieldTemplate: CountingFieldTemplate },
    });
    const otherBefore = renderCounts.root_1;
    expect(otherBefore).toBeGreaterThan(0);

    await user.type(node.querySelector('#root_0')!, 'abc');

    expect(renderCounts.root_1).toBe(otherBefore);
  });

  it('a replaced widget takes effect even when both are forwardRef components', () => {
    const First = forwardRef<HTMLInputElement, WidgetProps>((props, ref) => (
      <input ref={ref} id={props.id} data-which='first' onChange={() => undefined} value='' />
    ));
    const Second = forwardRef<HTMLInputElement, WidgetProps>((props, ref) => (
      <input ref={ref} id={props.id} data-which='second' onChange={() => undefined} value='' />
    ));
    function Parent({ widget }: { widget: typeof First }) {
      return (
        <Form
          schema={{ type: 'object', properties: { first: { type: 'string' } } }}
          uiSchema={{ first: { 'ui:widget': 'custom' } }}
          widgets={{ custom: widget }}
          validator={validator}
          formData={{ first: '' }}
        />
      );
    }
    const { container, rerender } = render(<Parent widget={First} />);
    expect(container.querySelector('#root_first')).toHaveAttribute('data-which', 'first');

    rerender(<Parent widget={Second} />);

    expect(container.querySelector('#root_first')).toHaveAttribute('data-which', 'second');
  });
});
