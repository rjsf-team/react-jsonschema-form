import { forwardRef, useState } from 'react';
import type { ErrorSchema, FieldTemplateProps, RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { IChangeEvent } from '../src/index.ts';
import Form, { FieldTemplate as DefaultFieldTemplate } from '../src/index.ts';
import {
  AcceptingParent,
  createFormComponent,
  createParentLog,
  RejectingParent,
  TransformingParent,
  createFormRef,
} from './testUtils.tsx';

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

  const onFieldTemplateRender = vi.fn<(id: string) => void>();

  function renderCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [id] of onFieldTemplateRender.mock.calls) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }

  function renderCount(id: string): number {
    return onFieldTemplateRender.mock.calls.filter(([calledId]) => calledId === id).length;
  }

  function CountingFieldTemplate(props: FieldTemplateProps) {
    onFieldTemplateRender(props.id);
    return <DefaultFieldTemplate {...props} />;
  }

  beforeEach(() => {
    onFieldTemplateRender.mockClear();
  });

  it('typing in one field does not re-render sibling fields', async () => {
    const { node } = createFormComponent({
      schema,
      initialFormData: initialFormData(),
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const secondBefore = renderCount('root_second');
    const nestedBefore = renderCount('root_nested');
    const innerBefore = renderCount('root_nested_inner');
    const firstBefore = renderCount('root_first');

    await user.type(node.querySelector('#root_first')!, 'abc');

    expect(renderCount('root_first')).toBeGreaterThan(firstBefore);
    expect(renderCount('root_second')).toBe(secondBefore);
    expect(renderCount('root_nested')).toBe(nestedBefore);
    expect(renderCount('root_nested_inner')).toBe(innerBefore);
  });

  it('typing in a nested field does not re-render fields outside its branch', async () => {
    const { node } = createFormComponent({
      schema,
      initialFormData: initialFormData(),
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const firstBefore = renderCount('root_first');
    const secondBefore = renderCount('root_second');
    const innerBefore = renderCount('root_nested_inner');

    await user.type(node.querySelector('#root_nested_inner')!, 'abc');

    expect(renderCount('root_nested_inner')).toBeGreaterThan(innerBefore);
    expect(renderCount('root_first')).toBe(firstBefore);
    expect(renderCount('root_second')).toBe(secondBefore);
  });

  it('typing in a layout grid cell does not re-render the other cells', async () => {
    const { node } = createFormComponent({
      schema,
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': { children: [{ 'ui:col': { children: ['first', 'second', 'nested'] } }] } },
      },
      initialFormData: initialFormData(),
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const secondBefore = renderCount('root_second');
    const innerBefore = renderCount('root_nested_inner');

    await user.type(node.querySelector('#root_first')!, 'abc');

    expect(renderCount('root_second')).toBe(secondBefore);
    expect(renderCount('root_nested_inner')).toBe(innerBefore);
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

    const secondBefore = renderCount('root_second');
    const nestedBefore = renderCount('root_nested');
    const innerBefore = renderCount('root_nested_inner');

    await user.type(container.querySelector('#root_first')!, 'abc');

    const proposals = seen.map((event) => event.formData);
    expect(proposals.map((formData) => formData?.first)).toEqual(['a', 'ab', 'abc']);
    // Each proposal becomes the next prop, so it must share unchanged subtrees with the value it was applied to
    const nestedInstances = new Set(proposals.map((formData) => formData?.nested));
    expect(nestedInstances.size).toBe(1);
    expect(renderCount('root_second')).toBe(secondBefore);
    expect(renderCount('root_nested')).toBe(nestedBefore);
    expect(renderCount('root_nested_inner')).toBe(innerBefore);
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
    const before = renderCounts();
    expect(Object.keys(before)).toEqual(expect.arrayContaining(['root_first', 'root_second', 'root_nested_inner']));

    rerender(<Parent tick={1} />);

    expect(renderCounts()).toEqual(before);
  });

  it('live validation on change leaves a sibling with an unchanged error alone', async () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: { first: { type: 'string' }, second: { type: 'string', minLength: 3 } },
      },
      initialFormData: { first: '', second: 'ab' },
      liveValidate: 'onChange',
      templates: { FieldTemplate: CountingFieldTemplate },
    });
    await user.type(node.querySelector('#root_first')!, 'a');
    expect(node.textContent).toContain('must NOT have fewer than 3 characters');
    const secondBefore = renderCount('root_second');
    expect(secondBefore).toBeGreaterThan(0);

    await user.type(node.querySelector('#root_first')!, 'bc');

    expect(renderCount('root_second')).toBe(secondBefore);
  });

  it('live validation on blur leaves sibling fields alone', async () => {
    const { node } = createFormComponent({
      schema,
      initialFormData: initialFormData(),
      liveValidate: 'onBlur',
      templates: { FieldTemplate: CountingFieldTemplate },
    });
    await user.type(node.querySelector('#root_first')!, 'abc');
    const secondBefore = renderCount('root_second');
    const innerBefore = renderCount('root_nested_inner');
    expect(secondBefore).toBeGreaterThan(0);

    await user.tab();

    expect(renderCount('root_second')).toBe(secondBefore);
    expect(renderCount('root_nested_inner')).toBe(innerBefore);
  });

  it('a submit that changes no errors re-renders no field', async () => {
    const { node } = createFormComponent({
      schema,
      initialFormData: initialFormData(),
      templates: { FieldTemplate: CountingFieldTemplate },
    });
    const before = renderCounts();
    expect(Object.keys(before)).toEqual(expect.arrayContaining(['root_first', 'root_second', 'root_nested_inner']));

    await user.click(node.querySelector('button[type=submit]')!);

    expect(renderCounts()).toEqual(before);
  });

  it('typing in one array item does not re-render the other items', async () => {
    const { node } = createFormComponent({
      schema: { type: 'array', items: { type: 'string' } },
      initialFormData: ['', ''],
      templates: { FieldTemplate: CountingFieldTemplate },
    });
    const otherBefore = renderCount('root_1');
    expect(otherBefore).toBeGreaterThan(0);

    await user.type(node.querySelector('#root_0')!, 'abc');

    expect(renderCount('root_1')).toBe(otherBefore);
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

  /** The cases single ownership makes well defined (RFC, section 6). Each asserts its baseline count first, so a
   * renamed id cannot pass vacuously.
   */
  describe('under single ownership', () => {
    const templates = { FieldTemplate: CountingFieldTemplate };

    it('a rejected controlled proposal re-renders nothing outside the proposing branch and shows no rejected value', async () => {
      const log = createParentLog<FormValue>();
      const { container } = render(
        <RejectingParent<FormValue> schema={schema} initialValue={initialFormData()} log={log} templates={templates} />,
      );
      const secondBefore = renderCount('root_second');
      const innerBefore = renderCount('root_nested_inner');
      expect(secondBefore).toBeGreaterThan(0);

      await user.type(container.querySelector('#root_first')!, 'abc');

      expect(log.proposals.map((proposal) => proposal?.first)).toEqual(['a', 'b', 'c']);
      expect(container.querySelector('#root_first')).toHaveValue('');
      expect(renderCount('root_second')).toBe(secondBefore);
      expect(renderCount('root_nested_inner')).toBe(innerBefore);
    });

    it('a transforming parent re-renders only the field whose value it transformed', async () => {
      const { container } = render(
        <TransformingParent<FormValue>
          schema={schema}
          initialValue={initialFormData()}
          templates={templates}
          transform={(proposal) => proposal && { ...proposal, first: proposal.first.toUpperCase() }}
        />,
      );
      const firstBefore = renderCount('root_first');
      const secondBefore = renderCount('root_second');
      const innerBefore = renderCount('root_nested_inner');
      expect(secondBefore).toBeGreaterThan(0);

      await user.type(container.querySelector('#root_first')!, 'ab');

      expect(container.querySelector('#root_first')).toHaveValue('AB');
      expect(renderCount('root_first')).toBeGreaterThan(firstBefore);
      expect(renderCount('root_second')).toBe(secondBefore);
      expect(renderCount('root_nested_inner')).toBe(innerBefore);
    });

    it('replaced extraErrors re-render only the fields whose errors changed, and a deep-equal replacement none', () => {
      const serverError = (): ErrorSchema<FormValue> => ({ first: { __errors: ['from the server'] } });
      function Parent({ extraErrors }: { extraErrors?: ErrorSchema<FormValue> }) {
        return (
          <Form
            schema={schema}
            validator={validator}
            formData={initialFormData()}
            extraErrors={extraErrors}
            templates={templates}
            onChange={() => undefined}
          />
        );
      }
      const { rerender } = render(<Parent />);
      const firstBefore = renderCount('root_first');
      const secondBefore = renderCount('root_second');
      expect(secondBefore).toBeGreaterThan(0);

      rerender(<Parent extraErrors={serverError()} />);
      expect(renderCount('root_first')).toBeGreaterThan(firstBefore);
      expect(renderCount('root_second')).toBe(secondBefore);

      const before = renderCounts();
      rerender(<Parent extraErrors={serverError()} />);
      expect(renderCounts()).toEqual(before);
    });

    it('a oneOf option switch re-renders nothing outside the switched branch', async () => {
      const withChoice: RJSFSchema = {
        type: 'object',
        properties: {
          first: { type: 'string' },
          choice: {
            oneOf: [
              { type: 'string', title: 'text' },
              { type: 'number', title: 'number' },
            ],
          },
        },
      };
      const { container } = render(
        <AcceptingParent schema={withChoice} initialValue={{ first: '', choice: '' }} templates={templates} />,
      );
      const firstBefore = renderCount('root_first');
      expect(firstBefore).toBeGreaterThan(0);

      await user.selectOptions(container.querySelector('#root_choice__oneof_select')!, '1');

      expect(container.querySelector('#root_choice')).toHaveAttribute('inputmode', 'decimal');
      expect(renderCount('root_first')).toBe(firstBefore);
    });

    it('array add, remove and reorder keep the count of items whose data and position are unchanged', async () => {
      const arraySchema: RJSFSchema = { type: 'array', items: { type: 'string' } };
      const { container } = render(
        <AcceptingParent<string[]> schema={arraySchema} initialValue={['a', 'b', 'c']} templates={templates} />,
      );
      const firstBefore = renderCount('root_0');
      const secondBefore = renderCount('root_1');
      const thirdBefore = renderCount('root_2');
      expect(thirdBefore).toBeGreaterThan(0);

      await user.click(container.querySelector('.rjsf-array-item-add button')!);
      expect(container.querySelectorAll('input[type=text]')).toHaveLength(4);
      expect(renderCount('root_0')).toBe(firstBefore);
      expect(renderCount('root_1')).toBe(secondBefore);
      expect(renderCount('root_2')).toBe(thirdBefore);

      await user.click(container.querySelectorAll('.rjsf-array-item-remove')[3]);
      expect(container.querySelectorAll('input[type=text]')).toHaveLength(3);
      expect(renderCount('root_0')).toBe(firstBefore);
      expect(renderCount('root_1')).toBe(secondBefore);
      expect(renderCount('root_2')).toBe(thirdBefore);

      await user.click(container.querySelectorAll('.rjsf-array-item-move-down')[0]);
      expect([...container.querySelectorAll<HTMLInputElement>('input[type=text]')].map((el) => el.value)).toEqual([
        'b',
        'a',
        'c',
      ]);
      expect(renderCount('root_2')).toBe(thirdBefore);
    });

    it('a controlled reset re-renders only the fields whose errors cleared', async () => {
      const constrained: RJSFSchema = {
        ...schema,
        properties: { ...schema.properties, first: { type: 'string', minLength: 1 } },
      };
      const ref = createFormRef();
      render(
        <Form
          ref={ref}
          schema={constrained}
          validator={validator}
          formData={{ first: '', second: '', nested: { inner: '' } }}
          templates={templates}
          onChange={() => undefined}
        />,
      );
      await act(async () => {
        ref.current!.validateForm();
      });
      const firstBefore = renderCount('root_first');
      const secondBefore = renderCount('root_second');
      const innerBefore = renderCount('root_nested_inner');
      expect(secondBefore).toBeGreaterThan(0);

      act(() => {
        ref.current!.reset();
      });

      expect(renderCount('root_first')).toBeGreaterThan(firstBefore);
      expect(renderCount('root_second')).toBe(secondBefore);
      expect(renderCount('root_nested_inner')).toBe(innerBefore);
    });
  });
});
