import { Profiler, StrictMode, useState } from 'react';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import type { FormProps } from '../src/index.ts';
import { createFormRef, handleOf, input } from './testUtils.tsx';

const user = userEvent.setup();

type Answer<T> = (proposed: T, held: T) => T;
const accept = <T,>(proposed: T) => proposed;
const decline = <T,>(_: T, held: T) => held;

type ParentProps<T> = Omit<FormProps<T>, 'validator' | 'formData' | 'onChange'> & {
  initial: T;
  answer?: Answer<T>;
  reported?: T[];
};

function Parent<T>({ initial, answer = accept, reported, ...formProps }: ParentProps<T>) {
  const [value, setValue] = useState(initial);
  return (
    <Form<T>
      {...formProps}
      validator={validator}
      formData={value}
      onChange={(event) => {
        const proposed = event.formData as T;
        reported?.push(proposed);
        setValue((held) => answer(proposed, held));
      }}
    />
  );
}

interface Pair {
  a?: string;
  b?: string;
}
const pair: RJSFSchema = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } };

function countingText(renders: Map<string, number>) {
  return function CountingText({ id, value, onChange }: WidgetProps) {
    renders.set(id, (renders.get(id) ?? 0) + 1);
    return (
      <input
        id={id}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  };
}

describe('a form controlled through formData', () => {
  it('shows an edit the parent stores, in one commit per keystroke', async () => {
    const onRender = vi.fn();
    const { container } = render(
      <Profiler id='form' onRender={onRender}>
        <Parent<Pair> schema={pair} initial={{ a: '', b: '' }} />
      </Profiler>,
    );
    onRender.mockClear();

    await user.type(input(container, 'root_a'), 'xyz');

    expect(input(container, 'root_a')).toHaveValue('xyz');
    expect(onRender).toHaveBeenCalledTimes(3);
  });

  it('does not show an edit the parent declines, and proposes each one from the data it holds', async () => {
    const reported: Pair[] = [];
    const { container } = render(
      <StrictMode>
        <Parent<Pair> schema={pair} initial={{ a: '', b: '' }} answer={decline} reported={reported} />
      </StrictMode>,
    );

    await user.type(input(container, 'root_a'), 'xy');

    expect(input(container, 'root_a')).toHaveValue('');
    expect(reported).toEqual([
      { a: 'x', b: '' },
      { a: 'y', b: '' },
    ]);
  });

  it('shows what the parent made of an edit', async () => {
    const upper: Answer<Pair> = (proposed) => ({ ...proposed, a: proposed.a?.toUpperCase() });
    const { container } = render(
      <StrictMode>
        <Parent<Pair> schema={pair} initial={{ a: '', b: '' }} answer={upper} />
      </StrictMode>,
    );

    await user.type(input(container, 'root_a'), 'xy');

    expect(input(container, 'root_a')).toHaveValue('XY');
  });

  it.each([
    ['stores', accept],
    ['copies', (proposed: Pair) => structuredClone(proposed)],
    ['declines', decline],
  ] satisfies [string, Answer<Pair>][])('renders no sibling field for a keystroke the parent %s', async (_, answer) => {
    const renders = new Map<string, number>();
    const { container } = render(
      <Parent<Pair>
        schema={pair}
        initial={{ a: '', b: '' }}
        answer={answer}
        widgets={{ TextWidget: countingText(renders) }}
      />,
    );
    const before = renders.get('root_b');

    await user.type(input(container, 'root_a'), 'xyz');

    expect(before).toBeGreaterThan(0);
    expect(renders.get('root_b')).toBe(before);
  });

  it('shows data the parent passes on its own, in the commit that passes it', () => {
    const onRender = vi.fn();
    const element = (data: Pair) => (
      <Profiler id='form' onRender={onRender}>
        <Form<Pair> schema={pair} validator={validator} formData={data} />
      </Profiler>
    );
    const { container, rerender } = render(element({ a: 'one' }));
    onRender.mockClear();

    rerender(element({ a: 'two' }));

    expect(input(container, 'root_a')).toHaveValue('two');
    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('keeps both of two edits made in one tick', () => {
    const ref = createFormRef<Pair>();
    const { container } = render(
      <StrictMode>
        <Parent<Pair> schema={pair} initial={{ a: '', b: '' }} ref={ref} />
      </StrictMode>,
    );

    act(() => {
      handleOf(ref).setFieldValue('a', 'x');
      handleOf(ref).setFieldValue('b', 'y');
    });

    expect(input(container, 'root_a')).toHaveValue('x');
    expect(input(container, 'root_b')).toHaveValue('y');
  });

  it('adds no array row the parent declines', async () => {
    const list: RJSFSchema = { type: 'array', items: { type: 'string' } };
    const { container } = render(<Parent<string[]> schema={list} initial={[]} answer={decline} />);

    await user.click(container.querySelector('.rjsf-array-item-add')!);

    expect(container.querySelectorAll('.rjsf-array-item')).toHaveLength(0);
  });

  it('keeps the option shown when the parent declines a switch', async () => {
    const options: RJSFSchema = {
      oneOf: [
        { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
        { title: 'B', type: 'object', properties: { b: { type: 'string' } } },
      ],
    };
    const { container } = render(<Parent<Pair> schema={options} initial={{ a: 'kept' }} answer={decline} />);

    await user.selectOptions(container.querySelector('select')!, 'B');

    expect(container.querySelector('#root_b')).toBeNull();
    expect(input(container, 'root_a')).toHaveValue('kept');
  });
});
