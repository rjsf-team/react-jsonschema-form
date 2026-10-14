import { forwardRef, useState } from 'react';
import type {
  BaseInputTemplateProps,
  ErrorSchema,
  FieldTemplateProps,
  RJSFSchema,
  SubmitButtonProps,
  WidgetProps,
} from '@rjsf/utils';
import { getExampleSuggestions } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Label from '../src/components/templates/FieldTemplate/Label.tsx';
import type { IChangeEvent } from '../src/index.ts';
import Form, { FieldTemplate as DefaultFieldTemplate, SchemaExamples } from '../src/index.ts';
import {
  AcceptingParent,
  createFormComponent,
  createParentLog,
  ListeningParent,
  createFormRef,
  handleOf,
  input,
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

  it('a parent storing each change keeps sibling fields and unchanged subtrees stable', async () => {
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

    const reported = seen.map((event) => event.formData);
    expect(reported.map((formData) => formData?.first)).toEqual(['a', 'ab', 'abc']);
    // Each reported value becomes the next prop, so it must share unchanged subtrees with the value it was applied to
    const nestedInstances = new Set(reported.map((formData) => formData?.nested));
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

  // A schema with a nested conditional sanitizes on every change, whether or not a branch actually swapped, and the
  // search for a swapped-away branch's stale defaults runs on that same path
  it('typing in a field of a schema with a nested conditional re-renders no sibling', async () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          first: { type: 'string' },
          second: { type: 'string' },
          nested: {
            type: 'object',
            properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' } },
            dependencies: {
              mode: {
                oneOf: [
                  { properties: { mode: { const: 'a' }, cfg: { type: 'object', default: { name: 'a' } } } },
                  { properties: { mode: { const: 'b' }, cfg: { type: 'object', default: { name: 'b' } } } },
                ],
              },
            },
          },
        },
      },
      initialFormData: { first: '', second: '', nested: { mode: 'a' } },
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const secondBefore = renderCount('root_second');
    const nestedBefore = renderCount('root_nested');
    expect(nestedBefore).toBeGreaterThan(0);

    await user.type(node.querySelector('#root_first')!, 'abc');

    expect(renderCount('root_second')).toBe(secondBefore);
    expect(renderCount('root_nested')).toBe(nestedBefore);
  });

  describe('a keystroke in a field', () => {
    const fieldSchema: RJSFSchema = { type: 'string', title: 'A', examples: ['one', 'two'] };
    const keystrokeSchema: RJSFSchema = { type: 'object', properties: { a: fieldSchema } };

    it('does not render the submit button template again', async () => {
      const SubmitButton = vi.fn((_props: SubmitButtonProps) => <button type='submit'>Submit</button>);
      createFormComponent({ schema: keystrokeSchema, templates: { ButtonTemplates: { SubmitButton } } });
      expect(SubmitButton).toHaveBeenCalledTimes(1);

      await user.type(screen.getByLabelText('A'), 'abc');

      expect(screen.getByLabelText('A')).toHaveValue('abc');
      expect(SubmitButton).toHaveBeenCalledTimes(1);
    });

    it('does not render the suggestions of that field again', async () => {
      // `SchemaExamples` reads the length of its suggestions each time it renders, which a spy cannot be put on since
      // `getExampleSuggestions()` freezes the array
      let lengthReads = 0;
      const suggestions = new Proxy(getExampleSuggestions(fieldSchema), {
        get(target, key, receiver): unknown {
          lengthReads += key === 'length' ? 1 : 0;
          return Reflect.get(target, key, receiver);
        },
      });
      const onTemplateRender = vi.fn();
      function CountingInputTemplate({ id, schema, value, onChange }: BaseInputTemplateProps) {
        onTemplateRender();
        return (
          <>
            <input id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
            <SchemaExamples id={id} schema={schema} suggestions={suggestions} />
          </>
        );
      }
      const { node } = createFormComponent({
        schema: keystrokeSchema,
        templates: { BaseInputTemplate: CountingInputTemplate },
      });
      expect(node.querySelectorAll('datalist option')).toHaveLength(2);
      const readsToRender = lengthReads;
      expect(readsToRender).toBeGreaterThan(0);
      onTemplateRender.mockClear();

      await user.type(screen.getByLabelText('A'), 'abc');

      expect(onTemplateRender).toHaveBeenCalled();
      expect(lengthReads).toBe(readsToRender);
    });

    // A label takes only strings and a boolean, none of which a test can count the reads of, and it renders the same
    // DOM whether it is skipped or not, so this is the one thing that fails when its `memo()` is taken away
    it('has a memoized label, which its unchanged props skip', () => {
      expect(Label).toHaveProperty('$$typeof', Symbol.for('react.memo'));
    });
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

  /** The cases one owner makes well defined. Each asserts its baseline count first, so a
   * renamed id cannot pass vacuously.
   */
  describe('under one owner', () => {
    const templates = { FieldTemplate: CountingFieldTemplate };

    it('an edit a parent does not store back re-renders nothing outside its own branch', async () => {
      const log = createParentLog<FormValue>();
      const { container } = render(
        <ListeningParent<FormValue> schema={schema} initialValue={initialFormData()} log={log} templates={templates} />,
      );
      const secondBefore = renderCount('root_second');
      const innerBefore = renderCount('root_nested_inner');
      expect(secondBefore).toBeGreaterThan(0);

      await user.type(container.querySelector('#root_first')!, 'abc');

      expect(log.reported.map((edit) => edit?.first)).toEqual(['a', 'ab', 'abc']);
      expect(container.querySelector('#root_first')).toHaveValue('abc');
      expect(renderCount('root_second')).toBe(secondBefore);
      expect(renderCount('root_nested_inner')).toBe(innerBefore);
    });

    it('a parent that writes a transform back re-renders only the field whose value it transformed', async () => {
      const ref = createFormRef<FormValue>();
      function TransformingWriter() {
        const [value, setValue] = useState(initialFormData);
        return (
          <Form<FormValue>
            ref={ref}
            schema={schema}
            validator={validator}
            templates={templates}
            formData={value}
            onChange={(event) => {
              const upper = event.formData.first.toUpperCase();
              if (upper !== event.formData.first) {
                handleOf(ref).setFieldValue('first', upper);
                return;
              }
              setValue(event.formData);
            }}
          />
        );
      }
      const { container } = render(<TransformingWriter />);
      const firstBefore = renderCount('root_first');
      const secondBefore = renderCount('root_second');
      const innerBefore = renderCount('root_nested_inner');
      expect(secondBefore).toBeGreaterThan(0);

      await user.type(input(container, 'root_first'), 'ab');

      expect(input(container, 'root_first')).toHaveValue('AB');
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

    it('a reset under a parent passing formData re-renders only the fields whose errors cleared', async () => {
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
