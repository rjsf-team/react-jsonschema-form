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

  it('holds the parent’s data after it declines the same edit of a scalar root twice', async () => {
    const ref = createFormRef<string>();
    const capped: Answer<string> = (proposed, held) => (proposed.length > 3 ? held : proposed);
    const { container } = render(
      <Parent<string> schema={{ type: 'string' }} initial='abc' answer={capped} ref={ref} />,
    );

    await user.type(input(container, 'root'), 'd');
    await user.type(input(container, 'root'), 'd');

    expect(input(container, 'root')).toHaveValue('abc');
    expect(handleOf(ref).getFormData()).toBe('abc');
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
    // A submit is no edit, so it proposes nothing
    expect(reported).toEqual([]);
  });

  it('takes a copy of the data it held as the parent declining, and keeps the errors it showed', async () => {
    const items: RJSFSchema = { type: 'array', items: { type: 'string', minLength: 2 } };
    const { container } = render(
      <Parent<string[]> schema={items} initial={['a', 'bb']} answer={(_, held) => [...held]} onError={noop} />,
    );
    await submitForm(container, user);
    expect(fieldErrorsById(container)).toEqual({ root_0: ['must NOT have fewer than 2 characters'] });

    await user.click(container.querySelectorAll('.rjsf-array-item-move-down')[0]);

    expect(input(container, 'root_0')).toHaveValue('a');
    expect(fieldErrorsById(container)).toEqual({ root_0: ['must NOT have fewer than 2 characters'] });
  });

  describe('reset()', () => {
    const seeded: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string', default: 'B' } },
    };

    it('proposes the data passed with its defaults, clears the errors, and shows what the parent stores', async () => {
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

    it('proposes the seed it is passed, which a parent that declines leaves unshown', async () => {
      const ref = createFormRef<Pair>();
      const reported: Pair[] = [];
      const { container } = render(
        <Parent<Pair> ref={ref} schema={seeded} initial={{ a: 'held' }} answer={decline} reported={reported} />,
      );

      act(() => handleOf(ref).reset({ a: 'other' }));

      expect(reported).toEqual([{ a: 'other', b: 'B' }]);
      expect(input(container, 'root_a')).toHaveValue('held');
      expect(handleOf(ref).getFormData()).toEqual({ a: 'held', b: 'B' });
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

    it('proposes the data without its extra fields, which the parent stores', async () => {
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

    it('leaves the data the parent holds when it declines the omission, blur after blur', async () => {
      const reported: Extra[] = [];
      const ref = createFormRef<Extra>();
      const { container } = render(
        <Parent<Extra>
          ref={ref}
          schema={described}
          initial={{ a: 'x', extra: 1 }}
          answer={decline}
          reported={reported}
          omitExtraData
          liveOmit='onBlur'
        />,
      );

      await user.click(input(container, 'root_a'));
      await user.tab();
      await user.click(input(container, 'root_a'));
      await user.tab();

      expect(reported).toEqual([{ a: 'x' }, { a: 'x' }]);
      expect(handleOf(ref).getFormData()).toEqual({ a: 'x', extra: 1 });
      expect(input(container, 'root_a')).toHaveValue('x');
      expect(handleOf(ref).getStatus().touchedFields).toEqual({ a: true });
    });
  });

  describe('touched', () => {
    function ChangeThenBlur({ id, value, onChange, onBlur }: WidgetProps) {
      return (
        <button
          type='button'
          onClick={() => {
            onChange('edited');
            onBlur(id, 'edited');
          }}
        >
          {`${id} is ${String(value)}`}
        </button>
      );
    }

    it('marks a field blurred in the same event as an edit the parent declines', async () => {
      const ref = createFormRef<Pair>();
      render(
        <Parent<Pair>
          ref={ref}
          schema={pair}
          initial={{ a: 'held', b: '' }}
          answer={decline}
          uiSchema={{ a: { 'ui:widget': ChangeThenBlur } }}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'root_a is held' }));

      expect(screen.getByRole('button', { name: 'root_a is held' })).toBeInTheDocument();
      expect(handleOf(ref).getStatus().touchedFields).toEqual({ a: true });
    });

    it('marks the row blurred in the same event as a reorder the parent declines, beside one touched before', async () => {
      const ref = createFormRef<string[]>();
      const { container } = render(
        <Parent<string[]>
          ref={ref}
          schema={{ type: 'array', items: { type: 'string' } }}
          initial={['a', 'b', 'c']}
          answer={decline}
        />,
      );
      await user.click(input(container, 'root_0'));
      await user.tab();
      const moveDown = container.querySelector<HTMLButtonElement>('.rjsf-array-item-move-down')!;
      const third = input(container, 'root_2');

      // In one `act()`, so the blur reaches the form before React renders the parent's answer to the reorder, as a
      // widget that reorders and blurs in one handler does. user-event flushes React after each of its calls
      act(() => {
        moveDown.click();
        third.focus();
        third.blur();
      });

      expect(input(container, 'root_0')).toHaveValue('a');
      expect(handleOf(ref).getStatus().touchedFields).toEqual([true, undefined, true]);
    });

    it('stays on the row that was blurred when the parent declines a reorder', async () => {
      const ref = createFormRef<string[]>();
      const { container } = render(
        <Parent<string[]>
          ref={ref}
          schema={{ type: 'array', items: { type: 'string' } }}
          initial={['a', 'b']}
          answer={decline}
        />,
      );
      await user.click(input(container, 'root_0'));
      await user.tab();
      expect(handleOf(ref).getStatus().touchedFields).toEqual([true, undefined]);

      await user.click(container.querySelectorAll('.rjsf-array-item-move-down')[0]);

      expect(handleOf(ref).getStatus().touchedFields).toEqual([true, undefined]);
    });
  });

  describe('with transformChange', () => {
    const upper = (next: Pair | undefined): Pair | undefined => next && { ...next, a: next.a?.toUpperCase() };

    it('proposes the edit as rewritten, which the parent stores', async () => {
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

    it('proposes the edit as rewritten, which a parent that declines leaves unshown', async () => {
      const reported: Pair[] = [];
      const ref = createFormRef<Pair>();
      const { container } = render(
        <Parent<Pair>
          ref={ref}
          schema={pair}
          initial={{ a: '', b: '' }}
          answer={decline}
          reported={reported}
          transformChange={upper}
        />,
      );

      await user.type(input(container, 'root_a'), 'xy');

      expect(reported).toEqual([
        { a: 'X', b: '' },
        { a: 'Y', b: '' },
      ]);
      expect(input(container, 'root_a')).toHaveValue('');
      expect(handleOf(ref).getFormData()).toEqual({ a: '', b: '' });
    });

    it('shows nothing of an edit it refuses, and takes the next one from the data the parent holds', async () => {
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

    it('keeps the rows, their errors and their options when the parent declines a removal it rewrote', async () => {
      const either: RJSFSchema = {
        anyOf: [
          { title: 'A', type: 'object', properties: { x: { type: 'string', minLength: 2 } } },
          { title: 'B', type: 'object', properties: { x: { type: 'string', minLength: 2 } } },
        ],
      };
      interface Row {
        x?: string;
        seen?: boolean;
      }
      const answers = { declines: false };
      const { container } = render(
        <Parent<Row[]>
          schema={{ type: 'array', items: either }}
          initial={[{ x: 'aa' }, { x: 'b' }, { x: 'cc' }]}
          answer={(proposed, held) => (answers.declines ? held : proposed)}
          // Rewrites every change, a removal included, so the form settles the move key by key
          transformChange={(next) => next?.map((row) => ({ ...row, seen: true }))}
          onError={noop}
        />,
      );
      await user.selectOptions(container.querySelectorAll('select')[1], 'B');
      await submitForm(container, user);
      const errors = fieldErrorsById(container);
      expect(errors.root_1_x).toEqual(['must NOT have fewer than 2 characters']);
      answers.declines = true;

      await user.click(container.querySelectorAll('.rjsf-array-item-remove')[0]);

      expect(container.querySelectorAll('.rjsf-array-item-remove')).toHaveLength(3);
      expect([...container.querySelectorAll('select')].map((select) => select.selectedOptions[0]?.text)).toEqual([
        'A',
        'B',
        'A',
      ]);
      expect(fieldErrorsById(container)).toEqual(errors);
    });
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

  describe('option selections', () => {
    const either: RJSFSchema = {
      oneOf: [
        { title: 'A', type: 'object', properties: { x: { type: 'string' } } },
        { title: 'B', type: 'object', properties: { x: { type: 'string' } } },
      ],
    };
    const selected = (container: HTMLElement) =>
      [...container.querySelectorAll('select')].map((select) => select.selectedOptions[0]?.text);
    /** A parent that stores every edit until it is told to decline them */
    function setup(schema: RJSFSchema, initial: unknown) {
      const answers = { declines: false };
      const view = render(
        <Parent schema={schema} initial={initial} answer={(proposed, held) => (answers.declines ? held : proposed)} />,
      );
      return { ...view, answers };
    }

    it('stay on their rows when the parent declines a removal', async () => {
      const { container, answers } = setup({ type: 'array', items: either }, [{ x: '0' }, { x: '1' }, { x: '2' }]);
      await user.selectOptions(container.querySelectorAll('select')[1], 'B');
      await user.selectOptions(container.querySelectorAll('select')[2], 'B');
      expect(selected(container)).toEqual(['A', 'B', 'B']);
      answers.declines = true;

      await user.click(container.querySelectorAll('.rjsf-array-item-remove')[0]);

      expect(selected(container)).toEqual(['A', 'B', 'B']);
    });

    it('stays on a property when the parent declines its removal', async () => {
      const { container, answers } = setup({ type: 'object', additionalProperties: either }, { first: { x: '0' } });
      await user.selectOptions(container.querySelectorAll('select')[0], 'B');
      answers.declines = true;

      await user.click(container.querySelectorAll('.rjsf-object-property-remove')[0]);

      expect(selected(container)).toEqual(['B']);
    });

    describe('of an option inside an option', () => {
      const inner: RJSFSchema = {
        anyOf: [
          { title: 'Inner A', type: 'object', properties: { y: { type: 'string' } } },
          {
            title: 'Inner B',
            type: 'object',
            properties: { y: { type: 'string' }, tag: { type: 'string', default: 't' } },
          },
        ],
      };
      // Each second option declares one property more, so a switch changes the data and is a proposal, while the data
      // fits both options, so only the selection says which is shown
      const nested: RJSFSchema = {
        anyOf: [
          { title: 'Outer A', type: 'object', properties: { x: { type: 'string' }, in: inner } },
          {
            title: 'Outer B',
            type: 'object',
            properties: { x: { type: 'string' }, in: inner, extra: { type: 'string', default: 'e' } },
          },
        ],
      };
      /** A form on `Outer B` and `Inner B`, each picked by hand */
      async function onSecondOptions() {
        const view = setup(nested, { x: '0', in: { y: '1' } });
        await user.selectOptions(view.container.querySelectorAll('select')[0], 'Outer B');
        await user.selectOptions(view.container.querySelectorAll('select')[1], 'Inner B');
        expect(selected(view.container)).toEqual(['Outer B', 'Inner B']);
        return view;
      }

      it('stay as chosen when the parent declines an edit inside the inner one', async () => {
        const { container, answers } = await onSecondOptions();
        answers.declines = true;

        await user.type(input(container, 'root_in_y'), 'z');

        expect(input(container, 'root_in_y')).toHaveValue('1');
        expect(selected(container)).toEqual(['Outer B', 'Inner B']);
      });

      it('stay as chosen when the parent declines a switch of the inner one', async () => {
        const { container, answers } = await onSecondOptions();
        answers.declines = true;

        await user.selectOptions(container.querySelectorAll('select')[1], 'Inner A');

        expect(selected(container)).toEqual(['Outer B', 'Inner B']);
        expect(input(container, 'root_in_tag')).toHaveValue('t');
      });

      it('stay as chosen when the parent declines a switch of the outer one', async () => {
        const { container, answers } = await onSecondOptions();
        answers.declines = true;

        await user.selectOptions(container.querySelectorAll('select')[0], 'Outer A');

        expect(selected(container)).toEqual(['Outer B', 'Inner B']);
        expect(input(container, 'root_in_y')).toHaveValue('1');
        expect(input(container, 'root_extra')).toHaveValue('e');
      });

      it('follow an edit the parent stores after one it declined', async () => {
        const { container, answers } = await onSecondOptions();
        answers.declines = true;
        await user.type(input(container, 'root_in_y'), 'z');
        answers.declines = false;

        await user.type(input(container, 'root_in_y'), 'z');

        expect(input(container, 'root_in_y')).toHaveValue('1z');
        expect(selected(container)).toEqual(['Outer B', 'Inner B']);
      });
    });

    it('stays as chosen when the parent declines an edit inside the option', async () => {
      const { container, answers } = setup(either, { x: '0' });
      await user.selectOptions(container.querySelectorAll('select')[0], 'B');
      answers.declines = true;

      await user.type(input(container, 'root_x'), 'y');

      expect(input(container, 'root_x')).toHaveValue('0');
      expect(selected(container)).toEqual(['B']);
    });
  });
});
