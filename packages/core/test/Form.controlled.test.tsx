import { Profiler, StrictMode, useState } from 'react';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { noop } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import type { FormProps } from '../src/index.ts';
import { createFormRef, fieldErrorsById, handleOf, input, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

type Answer<T> = (reported: T, held: T) => T;
const accept = <T,>(reported: T) => reported;
const ignore = <T,>(_: T, held: T) => held;

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

  it('keeps showing the edits a parent stores nothing for, and reports each one built on the last', async () => {
    const reported: Pair[] = [];
    const { container } = render(
      <StrictMode>
        <Parent<Pair> schema={pair} initial={{ a: '', b: '' }} answer={ignore} reported={reported} />
      </StrictMode>,
    );

    await user.type(input(container, 'root_a'), 'xy');

    expect(input(container, 'root_a')).toHaveValue('xy');
    expect(reported).toEqual([
      { a: 'x', b: '' },
      { a: 'xy', b: '' },
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
    ['ignores', ignore],
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

  it('holds the record shown after a parent that stores nothing passes again one edited before', async () => {
    const ref = createFormRef<Pair>();
    const first: Pair = { a: 'one', b: '' };
    function Records() {
      const [value, setValue] = useState(first);
      return (
        <>
          <Form<Pair> ref={ref} schema={pair} validator={validator} formData={value} />
          <button type='button' onClick={() => setValue({ a: 'two', b: '' })}>
            second
          </button>
          <button type='button' onClick={() => setValue(first)}>
            first
          </button>
        </>
      );
    }
    const { container } = render(<Records />);
    await user.type(input(container, 'root_a'), 'x');

    // Each click blurs the field first, which the form's store takes without a render
    await user.click(screen.getByRole('button', { name: 'second' }));
    await user.click(screen.getByRole('button', { name: 'first' }));

    expect(input(container, 'root_a')).toHaveValue('one');
    expect(handleOf(ref).getFormData()).toEqual({ a: 'one', b: '' });
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

  it('submits without the extra data and clears the errors, leaving the data the parent holds as it is', async () => {
    interface Extra {
      a?: string;
      extra?: number;
    }
    const onSubmit = vi.fn();
    const reported: Extra[] = [];
    let fails = true;
    const { container } = render(
      <Parent<Extra>
        schema={{ type: 'object', properties: { a: { type: 'string' } } }}
        initial={{ a: 'x', extra: 1 }}
        reported={reported}
        omitExtraData
        customValidate={(_, errors) => {
          if (fails) {
            errors.a?.addError('bad');
          }
          return errors;
        }}
        onSubmit={onSubmit}
        onError={noop}
      />,
    );
    await submitForm(container, user);
    expect(fieldErrorsById(container)).toEqual({ root_a: ['bad'] });
    fails = false;

    await submitForm(container, user);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'x' });
    expect(fieldErrorsById(container)).toEqual({});
    expect(reported).toEqual([]);
  });

  it('keeps an edit when the parent passes a copy of the data it passed before', async () => {
    const items: RJSFSchema = { type: 'array', items: { type: 'string', minLength: 2 } };
    const { container } = render(
      <Parent<string[]> schema={items} initial={['a', 'bb']} answer={(_, held) => [...held]} onError={noop} />,
    );

    await user.click(container.querySelectorAll('.rjsf-array-item-move-down')[0]);

    expect(input(container, 'root_0')).toHaveValue('bb');
  });

  describe('reset()', () => {
    const seeded: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string', default: 'B' } },
    };

    it('reports the data passed with its defaults, clears the errors, and shows what the parent stores', async () => {
      const ref = createFormRef<Pair>();
      const reported: Pair[] = [];
      const { container } = render(
        <Parent<Pair> ref={ref} schema={seeded} initial={{ a: 'x' }} reported={reported} onError={noop} />,
      );
      await submitForm(container, user);
      expect(fieldErrorsById(container)).toEqual({ root_a: ['must NOT have fewer than 3 characters'] });

      act(() => handleOf(ref).reset());

      expect(reported).toEqual([{ a: 'x', b: 'B' }]);
      expect(input(container, 'root_a')).toHaveValue('x');
      expect(fieldErrorsById(container)).toEqual({});
      expect(handleOf(ref).getStatus().dirty).toBe(false);
    });

    it('shows the seed it is passed under a parent that stores nothing', async () => {
      const ref = createFormRef<Pair>();
      const reported: Pair[] = [];
      const { container } = render(
        <Parent<Pair> ref={ref} schema={seeded} initial={{ a: 'held' }} answer={ignore} reported={reported} />,
      );

      act(() => handleOf(ref).reset({ a: 'other' }));

      expect(reported).toEqual([{ a: 'other', b: 'B' }]);
      expect(input(container, 'root_a')).toHaveValue('other');
      expect(handleOf(ref).getFormData()).toEqual({ a: 'other', b: 'B' });
    });

    it('shows the seed it is passed once the parent stores it, and the form is not dirty', async () => {
      const ref = createFormRef<Pair>();
      const { container } = render(<Parent<Pair> ref={ref} schema={seeded} initial={{ a: 'held' }} />);
      await user.type(input(container, 'root_a'), '!');
      expect(handleOf(ref).getStatus().dirty).toBe(true);

      act(() => handleOf(ref).reset({ a: 'other' }));

      expect(input(container, 'root_a')).toHaveValue('other');
      expect(handleOf(ref).getStatus().dirty).toBe(false);
    });
  });

  describe('a blur under liveOmit onBlur', () => {
    interface Extra {
      a?: string;
      extra?: number;
    }
    const described: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };

    it('reports the data without its extra fields, which the parent stores', async () => {
      const reported: Extra[] = [];
      const ref = createFormRef<Extra>();
      const { container } = render(
        <Parent<Extra>
          ref={ref}
          schema={described}
          initial={{ a: 'x', extra: 1 }}
          reported={reported}
          omitExtraData
          liveOmit='onBlur'
        />,
      );

      await user.click(input(container, 'root_a'));
      await user.tab();

      expect(reported).toEqual([{ a: 'x' }]);
      expect(handleOf(ref).getFormData()).toEqual({ a: 'x' });
    });

    it('omits the extra fields once under a parent that stores nothing, blur after blur', async () => {
      const reported: Extra[] = [];
      const ref = createFormRef<Extra>();
      const { container } = render(
        <Parent<Extra>
          ref={ref}
          schema={described}
          initial={{ a: 'x', extra: 1 }}
          answer={ignore}
          reported={reported}
          omitExtraData
          liveOmit='onBlur'
        />,
      );

      await user.click(input(container, 'root_a'));
      await user.tab();
      await user.click(input(container, 'root_a'));
      await user.tab();

      expect(reported).toEqual([{ a: 'x' }]);
      expect(handleOf(ref).getFormData()).toEqual({ a: 'x' });
      expect(input(container, 'root_a')).toHaveValue('x');
      expect(handleOf(ref).getStatus().touchedFields).toEqual({ a: true });
    });
  });

  describe('with transformChange', () => {
    const upper = (next: Pair | undefined): Pair | undefined => next && { ...next, a: next.a?.toUpperCase() };

    it('reports the edit as rewritten, which the parent stores', async () => {
      const reported: Pair[] = [];
      const { container } = render(
        <Parent<Pair> schema={pair} initial={{ a: '', b: '' }} reported={reported} transformChange={upper} />,
      );

      await user.type(input(container, 'root_a'), 'xy');

      expect(reported).toEqual([
        { a: 'X', b: '' },
        { a: 'XY', b: '' },
      ]);
      expect(input(container, 'root_a')).toHaveValue('XY');
    });

    it('shows the edit as rewritten under a parent that stores nothing', async () => {
      const reported: Pair[] = [];
      const ref = createFormRef<Pair>();
      const { container } = render(
        <Parent<Pair>
          ref={ref}
          schema={pair}
          initial={{ a: '', b: '' }}
          answer={ignore}
          reported={reported}
          transformChange={upper}
        />,
      );

      await user.type(input(container, 'root_a'), 'xy');

      expect(reported).toEqual([
        { a: 'X', b: '' },
        { a: 'XY', b: '' },
      ]);
      expect(input(container, 'root_a')).toHaveValue('XY');
      expect(handleOf(ref).getFormData()).toEqual({ a: 'XY', b: '' });
    });

    it('shows nothing of an edit it refuses, and takes the next one from the data before it', async () => {
      const reported: Pair[] = [];
      const { container } = render(
        <Parent<Pair>
          schema={pair}
          initial={{ a: '', b: '' }}
          reported={reported}
          transformChange={(next, previous) => (next?.a === 'x' ? previous : next)}
        />,
      );

      await user.type(input(container, 'root_a'), 'x');
      expect(input(container, 'root_a')).toHaveValue('');
      await user.type(input(container, 'root_b'), 'y');

      expect(input(container, 'root_b')).toHaveValue('y');
      expect(reported.at(-1)).toEqual({ a: '', b: 'y' });
    });
  });

  it('keeps every keystroke, and stays dirty, under a parent that stores each edit late', async () => {
    const ref = createFormRef<Pair>();
    function LateParent() {
      const [value, setValue] = useState<Pair>({ a: '', b: '' });
      return (
        <Form<Pair>
          ref={ref}
          schema={pair}
          validator={validator}
          formData={value}
          onChange={(event) => setTimeout(() => setValue(event.formData), 30)}
        />
      );
    }
    const { container } = render(<LateParent />);

    await user.type(input(container, 'root_a'), 'xyz');
    await act(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, 100);
        }),
    );

    expect(input(container, 'root_a')).toHaveValue('xyz');
    expect(handleOf(ref).getStatus().dirty).toBe(true);
  });

  describe('under a parent that stores each edit late, in a commit of its own', () => {
    function QueueingParent<T>({
      formRef,
      schema,
      initial,
      stored,
      copy,
    }: {
      formRef?: FormProps<T>['ref'];
      schema: RJSFSchema;
      initial: T;
      stored: T[];
      copy?: (value: T) => T;
    }) {
      const [value, setValue] = useState(initial);
      return (
        <>
          <Form<T>
            ref={formRef}
            schema={schema}
            validator={validator}
            formData={value}
            onChange={(event) => stored.push(event.formData as T)}
          />
          <button type='button' onClick={() => setValue(copy ? copy(stored.shift()!) : stored.shift()!)}>
            store next
          </button>
        </>
      );
    }
    const storeNext = () => user.click(screen.getByRole('button', { name: 'store next' }));

    it.each([
      ['the object reported', undefined],
      ['a copy of it', (value: Pair) => structuredClone(value)],
    ])('keeps the later edits, and stays dirty, when it stores %s', async (_, copy) => {
      const ref = createFormRef<Pair>();
      const { container } = render(
        <QueueingParent<Pair> formRef={ref} schema={pair} initial={{ a: '', b: '' }} stored={[]} copy={copy} />,
      );
      await user.type(input(container, 'root_a'), 'xy');

      await storeNext();
      expect(input(container, 'root_a')).toHaveValue('xy');
      await storeNext();

      expect(input(container, 'root_a')).toHaveValue('xy');
      expect(handleOf(ref).getStatus().dirty).toBe(true);
    });

    it('keeps the later edits of a scalar root, and stays dirty', async () => {
      const ref = createFormRef<string>();
      const { container } = render(
        <QueueingParent<string> formRef={ref} schema={{ type: 'string' }} initial='' stored={[]} />,
      );
      await user.type(input(container, 'root'), 'xy');

      await storeNext();
      expect(input(container, 'root')).toHaveValue('xy');
      await storeNext();

      expect(input(container, 'root')).toHaveValue('xy');
      expect(handleOf(ref).getStatus().dirty).toBe(true);
    });

    it('shows an older edit the parent puts back once it has stored the latest', async () => {
      const stored: Pair[] = [];
      const { container } = render(<QueueingParent<Pair> schema={pair} initial={{ a: '', b: '' }} stored={stored} />);
      await user.type(input(container, 'root_a'), 'xy');
      const [first] = stored;
      await storeNext();
      await storeNext();

      stored.push(first);
      await storeNext();

      expect(input(container, 'root_a')).toHaveValue('x');
    });
  });

  it('commits once for each record a parent that stores nothing passes over an edit', async () => {
    const onRender = vi.fn();
    const first: Pair = { a: 'one' };
    const element = (data: Pair) => (
      <Profiler id='form' onRender={onRender}>
        <Form<Pair> schema={pair} validator={validator} formData={data} onChange={noop} />
      </Profiler>
    );
    const { container, rerender } = render(element(first));
    await user.type(input(container, 'root_a'), 'x');
    await user.tab();
    onRender.mockClear();

    rerender(element({ a: 'two' }));
    expect(onRender).toHaveBeenCalledTimes(1);
    rerender(element(first));

    expect(onRender).toHaveBeenCalledTimes(2);
    expect(input(container, 'root_a')).toHaveValue('one');
  });

  it('commits no render for a blur after an edit the parent stored', async () => {
    const onRender = vi.fn();
    const { container } = render(
      <Profiler id='form' onRender={onRender}>
        <Parent<Pair> schema={pair} initial={{ a: '', b: '' }} />
      </Profiler>,
    );
    await user.type(input(container, 'root_a'), 'x');
    onRender.mockClear();

    await user.tab();

    expect(onRender).not.toHaveBeenCalled();
  });

  describe('dirty', () => {
    function Records({ answer = accept, formRef }: { answer?: Answer<Pair>; formRef: FormProps<Pair>['ref'] }) {
      const [value, setValue] = useState<Pair>({ a: 'one' });
      return (
        <>
          <Form<Pair>
            ref={formRef}
            schema={pair}
            validator={validator}
            formData={value}
            onChange={(event) => setValue((held) => answer(event.formData, held))}
          />
          <button type='button' onClick={() => setValue({ a: 'record two' })}>
            load
          </button>
        </>
      );
    }

    it('is not against the record before, once the parent passes another', async () => {
      const ref = createFormRef<Pair>();
      const { container } = render(<Records formRef={ref} />);
      await user.type(input(container, 'root_a'), 'x');
      expect(handleOf(ref).getStatus().dirty).toBe(true);

      await user.click(screen.getByRole('button', { name: 'load' }));

      expect(input(container, 'root_a')).toHaveValue('record two');
      expect(handleOf(ref).getStatus().dirty).toBe(false);

      await user.type(input(container, 'root_a'), 'x');

      expect(handleOf(ref).getStatus().dirty).toBe(true);
      expect(handleOf(ref).getStatus().dirtyFields).toEqual({ a: true });
    });

    it('holds through a parent that stores its own copy of each edit', async () => {
      const ref = createFormRef<Pair>();
      const { container } = render(
        <Records formRef={ref} answer={(proposed) => ({ ...proposed, a: proposed.a?.toUpperCase() })} />,
      );

      await user.type(input(container, 'root_a'), 'x');

      expect(input(container, 'root_a')).toHaveValue('ONEX');
      expect(handleOf(ref).getStatus().dirty).toBe(true);
    });
  });
});
