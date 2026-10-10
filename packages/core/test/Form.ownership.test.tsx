import { Component, StrictMode, useEffect, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ErrorSchema, FieldProps, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { deepEquals, getTemplates, getUiOptions, noop } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { collectDeferredThrows } from '../../../testing/deferredThrows.ts';
import type { FormRef, IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';
import type { ControlledParentLog } from './testUtils.tsx';
import {
  AcceptingParent,
  createFormComponent,
  createParentLog,
  fieldErrorsById,
  handleOf,
  input,
  ListeningParent,
  renderInActivity,
  reportedBy,
  submitForm,
  TransformingParent,
  createFormRef,
} from './testUtils.tsx';

const user = userEvent.setup();

/** Collects what `callWithDeferredThrow()` rethrows from a timer while `run` runs */
async function rethrownFromTimers(run: () => Promise<void>) {
  const deferred = collectDeferredThrows();
  try {
    await run();
  } finally {
    await deferred.settle();
  }
  return deferred.thrown;
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? <p>Fallback</p> : this.props.children;
  }
}

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    a: { type: 'string' },
    b: { type: 'string' },
  },
};

interface Data {
  a?: string;
  b?: string;
}

const withDefaults: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string', default: 'A' }, b: { type: 'string', default: 'B' } },
};

/** The ownership contract: the form owns its data. `formData` is the value the form takes when it is passed a new
 * one, like `value` on an `<input>` React re-renders; `initialFormData` is read on mount and `reset()` only, like
 * `defaultValue`. Edits are the form's own and are reported through `onChange`, whatever the parent does with them.
 */
describe('form data ownership', () => {
  describe('edits are the form’s own', () => {
    it('an edit is shown and reported whatever its parent does with it', async () => {
      const log = createParentLog<Data>();
      const { container } = render(<ListeningParent<Data> schema={schema} initialValue={{ a: 'a' }} log={log} />);

      await user.click(input(container, 'root_a'));
      await user.paste('b');

      expect(log.proposals).toEqual([{ a: 'ab' }]);
      expect(input(container, 'root_a')).toHaveValue('ab');
    });

    it('a spy handler sees each edit, and the form keeps showing it', async () => {
      const { node, onChange } = createFormComponent({ schema, formData: { a: 'a' } });

      await user.click(node.querySelector('#root_a')!);
      await user.paste('b');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'ab' });
      expect(node.querySelector('#root_a')).toHaveValue('ab');
    });

    it('a parent that stores each edit renders it with exactly one callback per edit', async () => {
      const log = createParentLog<Data>();
      const { container } = render(<AcceptingParent<Data> schema={schema} initialValue={{ a: '' }} log={log} />);

      await user.type(input(container, 'root_a'), 'abc');

      expect(log.proposals.map((proposal) => proposal?.a)).toEqual(['a', 'ab', 'abc']);
      expect(input(container, 'root_a')).toHaveValue('abc');
    });

    it('a parent that transforms what it stores has its value rendered, with no echo callback', async () => {
      const log = createParentLog<Data>();
      const upper = (proposal: Data | undefined) => proposal && { ...proposal, a: proposal.a?.toUpperCase() };
      const { container } = render(
        <TransformingParent<Data> schema={schema} initialValue={{ a: '' }} log={log} transform={upper} />,
      );

      await user.type(input(container, 'root_a'), 'ab');

      expect(log.proposals).toEqual([{ a: 'a' }, { a: 'Ab' }]);
      expect(input(container, 'root_a')).toHaveValue('AB');
    });
  });

  describe('formData replaces the data when it changes', () => {
    /** Records the value the `a` widget has at every commit, so a stale value committed before the parent's value
     * would show up in the sequence and not just be overwritten by the final DOM
     */
    function recordingWidget(seen: unknown[]) {
      return function Recording(props: WidgetProps) {
        const { BaseInputTemplate } = getTemplates(props.registry, getUiOptions(props.uiSchema));
        useLayoutEffect(() => {
          seen.push(props.value);
        });
        return <BaseInputTemplate {...props} />;
      };
    }

    it('renders a new formData at once, with no stale-data commit in between', () => {
      const seen: unknown[] = [];
      const uiSchema = { a: { 'ui:widget': recordingWidget(seen) } };
      function Parent({ value }: { value: Data }) {
        return <Form schema={schema} uiSchema={uiSchema} validator={validator} formData={value} onChange={noop} />;
      }
      const { rerender } = render(<Parent value={{ a: 'old' }} />);

      rerender(<Parent value={{ a: 'new' }} />);

      expect(seen).toEqual(['old', 'new']);
    });

    it('an unrelated re-render neither resets the data nor commits anything', () => {
      const seen: unknown[] = [];
      const uiSchema = { a: { 'ui:widget': recordingWidget(seen) } };
      const value = { a: 'kept' };
      function Parent({ tick }: { tick: number }) {
        return (
          <Form
            schema={schema}
            uiSchema={uiSchema}
            validator={validator}
            formData={value}
            className={`tick-${tick}`}
            onChange={noop}
          />
        );
      }
      const { rerender, container } = render(<Parent tick={0} />);

      rerender(<Parent tick={1} />);

      expect(seen).toEqual(['kept']);
      expect(input(container, 'root_a')).toHaveValue('kept');
    });

    it('fills a new formData in with the schema defaults, without calling onChange, in StrictMode too', () => {
      const ref = createFormRef<Data>();
      const onChange = vi.fn();
      function Parent({ schema: current, value }: { schema: RJSFSchema; value: Data }) {
        return (
          <StrictMode>
            <Form ref={ref} schema={current} validator={validator} formData={value} onChange={onChange} />
          </StrictMode>
        );
      }
      const { rerender, container } = render(<Parent schema={withDefaults} value={{}} />);
      expect(input(container, 'root_a')).toHaveValue('A');

      rerender(<Parent schema={{ ...withDefaults, title: 'changed' }} value={{}} />);
      rerender(<Parent schema={{ ...withDefaults, title: 'changed' }} value={{ a: 'given' }} />);

      expect(onChange).not.toHaveBeenCalled();
      expect(input(container, 'root_a')).toHaveValue('given');
      expect(input(container, 'root_b')).toHaveValue('B');
      expect(handleOf(ref).getFormData()).toEqual({ a: 'given', b: 'B' });
    });

    it('keeps the edits of a form whose parent stores none across the parent’s re-renders', async () => {
      const record: Data = { a: 'record' };
      function Parent({ tick }: { tick: number }) {
        return (
          <Form schema={schema} validator={validator} formData={record} className={`tick-${tick}`} onChange={noop} />
        );
      }
      const { rerender, container } = render(<Parent tick={0} />);
      await user.type(input(container, 'root_a'), 'x');

      rerender(<Parent tick={1} />);

      expect(input(container, 'root_a')).toHaveValue('recordx');
    });

    it('takes the data it reported back as its own, not as a replacement', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { container } = render(
        <AcceptingParent<Data> ref={ref} schema={schema} initialValue={{ a: '' }} log={log} />,
      );

      await user.type(input(container, 'root_a'), 'abc');

      expect(handleOf(ref).getFormData()).toBe(log.value);
    });

    it('passing the object the form mounted with again puts the data back', async () => {
      const record: Data = { a: 'record' };
      function Parent() {
        const [data, setData] = useState<Data | undefined>(record);
        return (
          <>
            <button type='button' onClick={() => setData(record)}>
              restore
            </button>
            <Form<Data>
              schema={schema}
              validator={validator}
              formData={data}
              onChange={(event) => setData(event.formData)}
            />
          </>
        );
      }
      const { container } = render(<Parent />);
      await user.type(input(container, 'root_a'), 'x');
      expect(input(container, 'root_a')).toHaveValue('recordx');

      await user.click(screen.getByRole('button', { name: 'restore' }));

      expect(input(container, 'root_a')).toHaveValue('record');
    });

    it('a formData that becomes undefined is not passed, so the data stays', () => {
      const onChange = vi.fn();
      function Parent({ value }: { value: Data | undefined }) {
        return <Form schema={withDefaults} validator={validator} formData={value} onChange={onChange} />;
      }
      const { rerender, container } = render(<Parent value={{ a: 'x' }} />);

      rerender(<Parent value={undefined} />);

      expect(input(container, 'root_a')).toHaveValue('x');
      expect(onChange).not.toHaveBeenCalled();

      rerender(<Parent value={{ a: 'y' }} />);

      expect(input(container, 'root_a')).toHaveValue('y');
    });

    it('a null formData seeds the schema defaults, and a field edit builds on them', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <Form schema={withDefaults} validator={validator} formData={null} onChange={onChange} />,
      );
      expect(input(container, 'root_a')).toHaveValue('A');

      await user.click(input(container, 'root_a'));
      await user.paste('x');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'Ax', b: 'B' });
      expect(input(container, 'root_a')).toHaveValue('Ax');
    });
  });

  describe('reset()', () => {
    const withDefault: RJSFSchema = {
      type: 'object',
      required: ['a'],
      properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string', default: 'defaulted' } },
    };

    it('puts the formData last passed back, with its defaults, clears the errors and reports it', async () => {
      const ref = createFormRef();
      const onChange = vi.fn();
      const { container } = render(
        <Form ref={ref} schema={withDefault} validator={validator} formData={{ a: 'x' }} onChange={onChange} />,
      );
      await act(async () => {
        ref.current!.validateForm();
      });
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(1);
      act(() => ref.current!.setFieldValue('a', 'edited'));
      onChange.mockClear();

      act(() => {
        ref.current!.reset();
      });

      expect(container.querySelectorAll('.error-detail li')).toHaveLength(0);
      expect(input(container, 'root_a')).toHaveValue('x');
      expect(input(container, 'root_b')).toHaveValue('defaulted');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'x', b: 'defaulted' });
    });

    it('keeps the extraErrors the parent passes', () => {
      const ref = createFormRef();
      const extraErrors: ErrorSchema = { a: { __errors: ['from the server'] } };
      const { container } = render(
        <Form
          ref={ref}
          schema={withDefault}
          validator={validator}
          formData={{ a: 'x' }}
          extraErrors={extraErrors}
          onChange={noop}
        />,
      );

      act(() => {
        ref.current!.reset();
      });

      expect(container.querySelector('.error-detail li')).toHaveTextContent('from the server');
    });

    it('a parent that stores edits replaces the data and clears the errors by resetting and then storing its value', async () => {
      const ref = createFormRef<Data>();
      const reported: unknown[] = [];
      function Parent() {
        const [data, setData] = useState<Data>({ a: 'x' });
        return (
          <>
            <button
              type='button'
              onClick={() => {
                ref.current!.reset();
                setData({ a: 'replaced' });
              }}
            >
              reload
            </button>
            <Form
              ref={ref}
              schema={withDefault}
              validator={validator}
              formData={data}
              onChange={(event) => {
                reported.push(event.formData);
                setData(event.formData);
              }}
            />
          </>
        );
      }
      const { container } = render(<Parent />);
      await act(async () => {
        ref.current!.validateForm();
      });
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(1);

      await user.click(container.querySelector('button')!);

      expect(input(container, 'root_a')).toHaveValue('replaced');
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(0);
      // The reset reported the data it put back; the value stored after it won the render
      expect(reported).toEqual([{ a: 'x', b: 'defaulted' }]);
    });
  });

  describe('data that loads after mount', () => {
    it('is taken when it arrives', () => {
      function Parent({ record }: { record?: Data }) {
        return <Form schema={schema} validator={validator} formData={record} onChange={noop} />;
      }
      const { rerender, container } = render(<Parent />);
      expect(input(container, 'root_a')).toHaveValue('');

      rerender(<Parent record={{ a: 'loaded' }} />);

      expect(input(container, 'root_a')).toHaveValue('loaded');
    });

    it('switches records when another arrives, and by remounting under a key', () => {
      const onChange = vi.fn();
      function Parent({ record, id }: { record?: Data; id: string }) {
        if (!record) {
          return <span>loading</span>;
        }
        return <Form key={id} schema={schema} validator={validator} formData={record} onChange={onChange} />;
      }
      const { rerender, container } = render(<Parent id='1' />);
      expect(container).toHaveTextContent('loading');

      rerender(<Parent id='1' record={{ a: 'one' }} />);
      expect(input(container, 'root_a')).toHaveValue('one');
      rerender(<Parent id='1' record={{ a: 'two' }} />);
      expect(input(container, 'root_a')).toHaveValue('two');
      rerender(<Parent id='2' record={{ a: 'three' }} />);

      expect(input(container, 'root_a')).toHaveValue('three');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('takes a fallback value until the record arrives', () => {
      function Parent({ record }: { record?: Data }) {
        return <Form schema={schema} validator={validator} formData={record ?? {}} onChange={noop} />;
      }
      const { rerender, container } = render(<Parent />);
      expect(input(container, 'root_a')).toHaveValue('');

      rerender(<Parent record={{ a: 'loaded' }} />);

      expect(input(container, 'root_a')).toHaveValue('loaded');
    });
  });

  describe('a seed through initialFormData', () => {
    it('two setFieldValue calls in one tick both land and report cumulative data', () => {
      const ref = createFormRef();
      const { onChange, getFormData } = createFormComponent({ ref, schema, initialFormData: { a: '', b: '' } });

      act(() => {
        handleOf(ref).setFieldValue('a', 'first');
        handleOf(ref).setFieldValue('b', 'second');
      });

      // Each operation reads the current model, so the second event includes the first edit.
      expect(getFormData()).toEqual({ a: 'first', b: 'second' });
      expect(onChange.mock.calls.map(([event]: IChangeEvent[]) => event.formData)).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'second' },
      ]);
    });

    it('a root replacement from inside onChange composes a derived field', () => {
      const ref = createFormRef();
      const reported: unknown[] = [];
      const { getFormData } = createFormComponent({
        ref,
        schema,
        initialFormData: { a: '', b: '' },
        onChange: (event: IChangeEvent) => {
          const data = event.formData;
          reported.push(data);
          if (deepEquals(data, { a: 'first', b: '' })) {
            handleOf(ref).setFieldValue([], { a: 'first', b: 'derived' });
          }
        },
      });

      act(() => handleOf(ref).setFieldValue('a', 'first'));

      expect(getFormData()).toEqual({ a: 'first', b: 'derived' });
      expect(reported).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'derived' },
      ]);
    });

    it('live-validates cumulative data during each same-tick edit', () => {
      const ref = createFormRef();
      const minLength: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string', minLength: 3 } },
      };
      const { node, onChange, getFormData } = createFormComponent({
        ref,
        schema: minLength,
        initialFormData: { a: 'long enough', b: 'long enough' },
        liveValidate: 'onChange',
      });

      act(() => {
        handleOf(ref).setFieldValue('a', 'x');
        handleOf(ref).setFieldValue('b', 'y');
      });

      // The second operation validates the combined data before notifying the consumer.
      expect(getFormData()).toEqual({ a: 'x', b: 'y' });
      expect(fieldErrorsById(node)).toEqual({
        root_a: ['must NOT have fewer than 3 characters'],
        root_b: ['must NOT have fewer than 3 characters'],
      });
      // Each event carries the errors for its cumulative data.
      expect(onChange.mock.calls.map(([event]) => Object.keys(event.errorSchema))).toEqual([['a'], ['a', 'b']]);
    });

    const withDefault: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'A' }, b: { type: 'string' } },
    };

    it('adds the defaults to the seed without calling onChange; getFormData() reads the result', () => {
      const ref = createFormRef();
      const onChange = vi.fn();
      render(
        <StrictMode>
          <Form
            ref={ref}
            schema={withDefault}
            validator={validator}
            initialFormData={{ b: 'seed' }}
            onChange={onChange}
          />
        </StrictMode>,
      );

      expect(onChange).not.toHaveBeenCalled();
      expect(ref.current!.getFormData()).toEqual({ a: 'A', b: 'seed' });
    });

    it('keeps its data across an unrelated prop change and a new initialFormData', async () => {
      const { node, rerender } = createFormComponent({ schema, initialFormData: { a: 'own' } });
      await user.clear(node.querySelector('#root_a')!);
      await user.paste('edited');

      rerender({ schema, initialFormData: { a: 'own' }, className: 'other' });
      expect(node.querySelector('#root_a')).toHaveValue('edited');
      rerender({ schema, initialFormData: { a: 'another seed' } });

      expect(node.querySelector('#root_a')).toHaveValue('edited');
    });

    it('a formData passed later replaces the seed and the edits made on it', async () => {
      const { node, rerender } = createFormComponent({ schema, initialFormData: { a: 'own' } });
      await user.clear(node.querySelector('#root_a')!);
      await user.paste('edited');

      rerender({ schema, initialFormData: { a: 'own' }, formData: { a: 'late' } });

      expect(node.querySelector('#root_a')).toHaveValue('late');
    });

    it('resets to the latest seed and the current schema, and reports it', async () => {
      const ref = createFormRef();
      const { node, onChange, rerender } = createFormComponent({
        ref,
        schema: withDefault,
        initialFormData: { b: 'one' },
      });
      await user.clear(node.querySelector('#root_b')!);
      await user.paste('edited');
      rerender({ ref, schema: withDefault, initialFormData: { b: 'two' } });
      onChange.mockClear();

      act(() => {
        ref.current!.reset();
      });

      expect(node.querySelector('#root_a')).toHaveValue('A');
      expect(node.querySelector('#root_b')).toHaveValue('two');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'A', b: 'two' });
    });

    it('a schema change that adds a default transforms the held data without calling onChange', () => {
      const ref = createFormRef();
      const { node, onChange, rerender } = createFormComponent({ ref, schema, initialFormData: { b: 'kept' } });

      rerender({ ref, schema: withDefault, initialFormData: { b: 'kept' } });

      expect(node.querySelector('#root_a')).toHaveValue('A');
      expect(ref.current!.getFormData()).toEqual({ a: 'A', b: 'kept' });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('composition in one tick under a parent that stores edits', () => {
    /** Two path changes in one `act`, through the form's own change path, with exactly `setData(event.formData)` */
    const acceptAll = () => true;
    const keepProposal = (proposal: Data) => proposal;

    function PolicyParent({
      ref,
      accept = acceptAll,
      transform = keepProposal,
      log,
    }: {
      ref: React.RefObject<FormRef<Data> | null>;
      accept?: (proposal: Data) => boolean;
      transform?: (proposal: Data) => Data;
      log: ControlledParentLog<Data>;
    }) {
      const [data, setData] = useState<Data>({ a: '', b: '' });
      Object.assign(log, { value: data });
      return (
        <Form<Data>
          ref={ref}
          schema={schema}
          validator={validator}
          formData={data}
          onChange={(event) => {
            const proposal = event.formData;
            log.proposals.push(proposal);
            if (accept(proposal)) {
              setData(transform(proposal));
            }
          }}
        />
      );
    }

    it('two path changes in one tick chain, so the parent keeps both', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { container } = render(<PolicyParent ref={ref} log={log} />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'first');
        ref.current!.setFieldValue('b', 'second');
      });

      // The second change builds on the first, which React has not rendered yet
      expect(log.proposals).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'second' },
      ]);
      expect(log.value).toEqual({ a: 'first', b: 'second' });
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('second');
    });

    it('a root replacement writes several fields in one event', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { container } = render(
        <PolicyParent ref={ref} log={log} transform={(proposal) => ({ ...proposal, a: proposal.a?.toUpperCase() })} />,
      );

      await act(async () => {
        handleOf(ref).setFieldValue([], { ...handleOf(ref).getFormData(), a: 'first', b: 'second' });
      });

      expect(log.proposals).toEqual([{ a: 'first', b: 'second' }]);
      expect(log.value).toEqual({ a: 'FIRST', b: 'second' });
      expect(input(container, 'root_a')).toHaveValue('FIRST');
      expect(input(container, 'root_b')).toHaveValue('second');
    });

    it("a second change in one tick builds on the first as made, not as the parent's transform", async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      render(
        <PolicyParent ref={ref} log={log} transform={(proposal) => ({ ...proposal, a: proposal.a?.toUpperCase() })} />,
      );

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'first');
        handleOf(ref).setFieldValue('b', 'second');
      });

      // The transform reaches the form only when React renders the parent's value
      expect(log.proposals[1]).toEqual({ a: 'first', b: 'second' });
      expect(log.value).toEqual({ a: 'FIRST', b: 'second' });
    });

    it('an edit the parent does not store stays the form’s data, in the same tick and in later ones', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { container } = render(<PolicyParent ref={ref} log={log} accept={(proposal) => proposal.a !== 'first'} />);

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'first');
      });
      await act(async () => {
        handleOf(ref).setFieldValue('b', 'second');
      });

      // The form owns the edit; a parent that wants it undone sets the field back
      expect(log.proposals).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'second' },
      ]);
      expect(log.value).toEqual({ a: '', b: '' });
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('second');
    });

    it('a parent refuses an edit by setting the field back from onChange', async () => {
      const ref = createFormRef<Data>();
      const reported: Data[] = [];
      function RefusingParent() {
        const [data, setData] = useState<Data>({ a: '', b: '' });
        return (
          <Form<Data>
            ref={ref}
            schema={schema}
            validator={validator}
            formData={data}
            onChange={(event) => {
              reported.push(event.formData);
              if (event.formData.a === 'forbidden') {
                ref.current!.setFieldValue('a', data.a);
                return;
              }
              setData(event.formData);
            }}
          />
        );
      }
      const { container } = render(<RefusingParent />);

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'forbidden');
      });

      expect(reported).toEqual([
        { a: 'forbidden', b: '' },
        { a: '', b: '' },
      ]);
      expect(input(container, 'root_a')).toHaveValue('');
    });

    it('edits made while hidden by Activity are applied and reported at once', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { hide } = renderInActivity(() => <PolicyParent ref={ref} log={log} />);
      const handle = handleOf(ref);
      hide();

      await act(async () => {
        handle.setFieldValue('a', 'first');
      });

      expect(log.proposals).toEqual([{ a: 'first', b: '' }]);
      expect(handle.getFormData()).toEqual({ a: 'first', b: '' });
    });

    /** A widget that sets its field to `to` from `useCommitEffect` */
    function settingWidget(useCommitEffect: typeof useEffect, to: string) {
      return function SettingWidget({ onChange, value }: WidgetProps) {
        useCommitEffect(() => {
          if (value !== to) {
            onChange(to);
          }
        }, [value, onChange]);
        return null;
      };
    }
    const settingUiSchema = {
      a: { 'ui:widget': settingWidget(useLayoutEffect, 'layout') },
      b: { 'ui:widget': settingWidget(useEffect, 'passive') },
    };

    it.each([false, true])(
      'an edit from a passive Effect builds on one a layout Effect made in the same commit (StrictMode: %s)',
      (reactStrictMode) => {
        const log = createParentLog<Data>();
        render(
          <AcceptingParent<Data>
            schema={schema}
            uiSchema={settingUiSchema}
            initialValue={{ a: '', b: '' }}
            log={log}
          />,
          { reactStrictMode },
        );

        // The form commits between the two edits, before its parent has rendered the first
        expect(log.value).toEqual({ a: 'layout', b: 'passive' });
      },
    );

    it('edits from the Effects of the commit that renders another record are made on that record', () => {
      const onChange = vi.fn();
      const props = { schema, validator, uiSchema: settingUiSchema, onChange };
      const { rerender } = render(<Form<Data> {...props} formData={{ a: 'layout', b: 'passive' }} />);
      onChange.mockClear();

      // The parent loads another record, in which both widgets set their field again
      rerender(<Form<Data> {...props} formData={{ a: 'x', b: 'y' }} />);

      expect(onChange.mock.calls.map(([event]: IChangeEvent<Data>[]) => event.formData)).toEqual([
        { a: 'layout', b: 'y' },
        { a: 'layout', b: 'passive' },
      ]);
    });

    it('an edit made as a hidden form is shown builds on one made while it was hidden', () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      let onShown = noop;
      function Panel() {
        useEffect(() => onShown(), []);
        return <AcceptingParent<Data> ref={ref} schema={schema} initialValue={{ a: '', b: '' }} log={log} />;
      }
      const { hide, show } = renderInActivity(() => <Panel />);
      const handle = handleOf(ref);
      hide();
      act(() => handle.setFieldValue('a', 'hidden'));
      onShown = () => handle.setFieldValue('b', 'shown');

      show();

      expect(log.value).toEqual({ a: 'hidden', b: 'shown' });
    });

    it('a setFieldValue from inside onChange builds on the edit being handled', async () => {
      const ref = createFormRef<Data>();
      const reported: Data[] = [];
      function ReentrantParent() {
        const [data, setData] = useState<Data>({ a: '', b: '' });
        return (
          <Form<Data>
            ref={ref}
            schema={schema}
            validator={validator}
            formData={data}
            onChange={(event) => {
              const proposal = event.formData;
              reported.push(proposal);
              setData(proposal);
              if (proposal.a === 'first' && proposal.b === '') {
                ref.current!.setFieldValue('b', 'derived');
              }
            }}
          />
        );
      }
      const { container } = render(<ReentrantParent />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'first');
      });

      expect(reported).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'derived' },
      ]);
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('derived');
    });

    it('a parent adds a derived field to the value it stores instead of calling setFieldValue', async () => {
      const ref = createFormRef<Data>();
      const reported: Data[] = [];
      function ComposingOnChangeParent() {
        const [data, setData] = useState<Data>({ a: '', b: '' });
        return (
          <Form<Data>
            ref={ref}
            schema={schema}
            validator={validator}
            formData={data}
            onChange={(event) => {
              const proposal = event.formData;
              reported.push(proposal);
              setData(proposal.a === 'first' ? { ...proposal, b: 'derived' } : proposal);
            }}
          />
        );
      }
      const { container } = render(<ComposingOnChangeParent />);

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'first');
      });

      expect(reported).toEqual([{ a: 'first', b: '' }]);
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('derived');
    });

    it('a new formData object replaces the edits a parent never stored, and a missing handler stops nothing', async () => {
      const ref = createFormRef();
      const { rerender } = render(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} />);
      await act(async () => {
        ref.current!.setFieldValue('a', 'x');
        ref.current!.setFieldValue('b', 'y');
      });
      expect(ref.current!.getFormData()).toEqual({ a: 'x', b: 'y' });
      const onChange = vi.fn();
      rerender(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} onChange={onChange} />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'z');
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'z' });
    });

    it('every operation in one tick calls onChange with its own value', async () => {
      const ref = createFormRef();
      const onChange = vi.fn();
      render(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} onChange={onChange} />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'x');
        ref.current!.setFieldValue('b', 'y');
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'x' });
      expect(onChange.mock.calls[1][0].formData).toEqual({ a: 'x', b: 'y' });
    });
  });

  describe('development diagnostics', () => {
    it('freezes the formData handed to onChange, leaving non-plain values alone', async () => {
      const when = new Date(0);
      const nested: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' }, list: { type: 'array', items: { type: 'string' } } },
      };
      let seen: IChangeEvent<{ a: string; list: string[]; when: Date }> | undefined;
      render(
        <Form
          schema={nested}
          validator={validator}
          formData={{ a: '', list: ['one'], when }}
          onChange={(event) => {
            seen = event;
          }}
        />,
      );

      await user.click(document.querySelector('#root_a')!);
      await user.paste('x');

      expect(Object.isFrozen(seen!.formData)).toBe(true);
      expect(Object.isFrozen(seen!.formData.list)).toBe(true);
      expect(seen!.formData.when).toBeInstanceOf(Date);
      expect(Object.isFrozen(seen!.formData.when)).toBe(false);
    });

    it('freezes the data the form commits', async () => {
      const ref = createFormRef();
      const { node } = createFormComponent({ ref, schema, initialFormData: { a: '' } });

      await user.click(node.querySelector('#root_a')!);
      await user.paste('x');

      expect(Object.isFrozen(ref.current!.getFormData())).toBe(true);
    });
  });

  describe('nested fields', () => {
    const oneOfSchema: RJSFSchema = {
      type: 'object',
      properties: {
        status: {
          type: 'object',
          oneOf: [
            { title: 'Approved', type: 'object', properties: { by: { type: 'string' } }, required: ['by'] },
            { title: 'Rejected', type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] },
          ],
        },
      },
    };

    it('a oneOf switch is shown whatever the parent stores', async () => {
      const log = createParentLog<{ status: { by?: string; reason?: string } }>();
      const { container } = render(
        <ListeningParent schema={oneOfSchema} initialValue={{ status: { by: 'me' } }} log={log} />,
      );
      const select = container.querySelector<HTMLSelectElement>('#root_status__oneof_select')!;

      await user.selectOptions(select, '1');

      expect(log.proposals).toHaveLength(1);
      expect(select).toHaveValue('1');
      expect(input(container, 'root_status_reason')).toHaveValue('');
    });

    it('a oneOf switch that leaves the data unchanged keeps the chosen option the data does not fit yet', async () => {
      const rangeSchema: RJSFSchema = {
        type: 'object',
        properties: {
          size: {
            type: 'object',
            oneOf: [
              { title: 'Small', type: 'object', properties: { n: { type: 'number', maximum: 9 } } },
              { title: 'Large', type: 'object', properties: { n: { type: 'number', minimum: 10 } } },
            ],
          },
        },
      };
      const { container } = render(
        <Form schema={rangeSchema} validator={validator} initialFormData={{ size: { n: 5 } }} />,
      );
      const select = container.querySelector<HTMLSelectElement>('#root_size__oneof_select')!;

      await user.selectOptions(select, '1');

      expect(select).toHaveValue('1');
    });

    it('an array add and remove are shown whatever the parent stores', async () => {
      const arraySchema: RJSFSchema = { type: 'array', items: { type: 'string' } };
      const log = createParentLog<string[]>();
      const { container } = render(<ListeningParent schema={arraySchema} initialValue={['one', 'two']} log={log} />);

      await user.click(container.querySelector('.rjsf-array-item-add button')!);
      expect(log.proposals).toEqual([['one', 'two', undefined]]);
      expect(container.querySelectorAll('input[type=text]')).toHaveLength(3);

      await user.click(container.querySelector('.rjsf-array-item-remove')!);
      expect(log.proposals.at(-1)).toEqual(['two', undefined]);
      expect([...container.querySelectorAll<HTMLInputElement>('input[type=text]')].map((el) => el.value)).toEqual([
        'two',
        '',
      ]);
    });

    it('an additional property rename is shown whatever the parent stores', async () => {
      const objectSchema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
      const log = createParentLog<Record<string, string>>();
      const { container } = render(
        <ListeningParent schema={objectSchema} initialValue={{ first: 'one', second: 'two' }} log={log} />,
      );
      const keyInput = container.querySelector<HTMLInputElement>('#root_first-key')!;

      await user.clear(keyInput);
      await user.type(keyInput, 'renamed');
      await user.tab();

      expect(log.proposals.at(-1)).toEqual({ renamed: 'one', second: 'two' });
      expect(container.querySelector('#root_renamed')).toHaveValue('one');
      expect(container.querySelector('#root_second')).toHaveValue('two');
      expect(container.querySelector('#root_first')).toBeNull();
    });
  });

  describe('reading and submitting', () => {
    it('getFormData() returns the formData passed, when the schema adds no default, and the edits made since', async () => {
      const passed = createFormRef();
      const value = { a: 'parent' };
      render(<Form ref={passed} schema={schema} validator={validator} formData={value} onChange={noop} />);
      expect(passed.current!.getFormData()).toBe(value);

      const owned = createFormRef();
      const { node } = createFormComponent({ ref: owned, schema, initialFormData: { a: 'seed' } });
      await user.clear(node.querySelector('#root_a')!);
      await user.paste('edited');
      expect(owned.current!.getFormData()).toEqual({ a: 'edited' });
    });

    it('a submit with omitExtraData submits the omitted copy and keeps it, without calling onChange', async () => {
      const onSubmit = vi.fn();
      const onChange = vi.fn();
      const ref = createFormRef();
      render(
        <Form
          ref={ref}
          schema={schema}
          validator={validator}
          formData={{ a: 'x', extra: 'gone' }}
          omitExtraData
          onSubmit={onSubmit}
          onChange={onChange}
        />,
      );

      await act(async () => {
        ref.current!.submit();
      });

      expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'x' });
      expect(ref.current!.getFormData()).toEqual({ a: 'x' });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('errors under a parent', () => {
    const minLengthSchema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string', minLength: 5 } },
    };

    function CustomErrorWidget(props: WidgetProps) {
      return (
        <button
          type='button'
          id={`${props.id}-raise`}
          onClick={() => props.onChange(props.value, { __errors: ['custom!'] })}
        >
          raise
        </button>
      );
    }

    function RootErrorField(props: FieldProps) {
      return (
        <button
          type='button'
          id='raise-root'
          onClick={() => props.onChange(props.formData, props.fieldPath, { __errors: ['custom root!'] })}
        >
          raise
        </button>
      );
    }

    function ChangeThenBlurWidget(props: WidgetProps) {
      return (
        <button
          type='button'
          id={`${props.id}-commit`}
          onClick={() => {
            props.onChange('abcdef');
            props.onBlur(props.id, 'abcdef');
          }}
        >
          commit
        </button>
      );
    }

    it('a custom error a field raises over a validation error stays shown', async () => {
      const { container } = render(
        <ListeningParent
          schema={minLengthSchema}
          uiSchema={{ foo: { 'ui:widget': CustomErrorWidget } }}
          initialValue={{ foo: 'a' }}
        />,
      );
      await user.click(container.querySelector('button[type=submit]')!);
      expect(fieldErrorsById(container).root_foo).toEqual(['must NOT have fewer than 5 characters']);

      await user.click(container.querySelector('#root_foo-raise')!);

      expect(fieldErrorsById(container).root_foo).toEqual(['custom!']);
    });

    it('a custom error a field raises over a validation error leaves the other errors as the validator reported them', async () => {
      const pairSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'string', minLength: 5 }, bar: { type: 'string', minLength: 5 } },
      };
      const { container, onChange } = createFormComponent({
        schema: pairSchema,
        uiSchema: { foo: { 'ui:widget': CustomErrorWidget } },
        initialFormData: { foo: 'a', bar: 'b' },
      });
      await user.click(container.querySelector('button[type=submit]')!);

      await user.click(container.querySelector('#root_foo-raise')!);

      const { errors } = onChange.mock.lastCall![0] as IChangeEvent;
      expect(errors.map(({ name, property, message }) => ({ name, property, message }))).toEqual([
        { name: 'minLength', property: '.bar', message: 'must NOT have fewer than 5 characters' },
        { name: undefined, property: '.foo', message: 'custom!' },
      ]);
    });

    it('a root custom error blocks submit on a form mounted with data', async () => {
      const onSubmit = vi.fn();
      const onError = vi.fn();
      const { container } = render(
        <ListeningParent
          schema={schema}
          uiSchema={{ 'ui:field': RootErrorField }}
          initialValue={{ a: 'x', b: 'y' }}
          onSubmit={onSubmit}
          onError={onError}
        />,
      );

      await user.click(container.querySelector('#raise-root')!);
      await user.click(container.querySelector('button[type=submit]')!);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('a blur in the same tick as an edit validates the edit, under a parent that stores it', async () => {
      const log = createParentLog<{ foo?: string }>();
      const { container } = render(
        <AcceptingParent
          schema={minLengthSchema}
          uiSchema={{ foo: { 'ui:widget': ChangeThenBlurWidget } }}
          initialValue={{ foo: 'a' }}
          liveValidate='onBlur'
          log={log}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'commit' }));

      expect(log.proposals).toEqual([{ foo: 'abcdef' }]);
      expect(log.value).toEqual({ foo: 'abcdef' });
      expect(fieldErrorsById(container)).toEqual({});
    });

    it('a blur validation keeps a value its onBlur set', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { container } = render(
        <AcceptingParent<Data>
          ref={ref}
          schema={{ type: 'object', properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string' } } }}
          initialValue={{ a: '', b: '' }}
          liveValidate='onBlur'
          log={log}
          onBlur={() => handleOf(ref).setFieldValue('b', 'fromBlur')}
        />,
      );

      await user.type(input(container, 'root_a'), 'x');
      await user.tab();

      expect(input(container, 'root_b')).toHaveValue('fromBlur');
      expect(log.proposals.at(-1)).toEqual({ a: 'x', b: 'fromBlur' });
    });

    it('a blur in the same handler as an edit validates the changed data', async () => {
      const { node, onChange, getFormData } = createFormComponent({
        schema: minLengthSchema,
        uiSchema: { foo: { 'ui:widget': ChangeThenBlurWidget } },
        initialFormData: { foo: 'a' },
        liveValidate: 'onBlur',
      });

      await user.click(screen.getByRole('button', { name: 'commit' }));

      // The blur sees the changed data; no invalid old-value notification is emitted.
      expect(onChange.mock.calls).toEqual([
        [expect.objectContaining({ formData: { foo: 'abcdef' }, errors: [] }), 'root_foo'],
      ]);
      expect(getFormData()).toEqual({ foo: 'abcdef' });
      expect(fieldErrorsById(node)).toEqual({});
    });
  });
});

describe('operations in one tick', () => {
  it('a same-tick submit reads the current data', () => {
    const ref = createFormRef();
    const { onSubmit, getFormData } = createFormComponent({ ref, schema, initialFormData: { a: 'old' } });

    act(() => {
      ref.current!.setFieldValue('a', 'new');
      ref.current!.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'new' });
    expect(getFormData()).toEqual({ a: 'new' });
  });

  it('a submit whose validation throws lets later operations run', async () => {
    const ref = createFormRef();
    const { node, getFormData } = createFormComponent({
      ref,
      schema,
      initialFormData: { a: 'old' },
      noHtml5Validate: true,
      customValidate: () => {
        throw new Error('boom');
      },
    });

    const reported = await reportedBy(() => submitForm(node, user));
    act(() => ref.current!.setFieldValue('a', 'new'));

    expect(reported).toEqual([new Error('boom')]);

    expect(getFormData()).toEqual({ a: 'new' });
  });

  it('a submit in the same tick as an edit whose validation throws keeps the form mounted', async () => {
    const ref = createFormRef();
    function EditThenSubmit(props: WidgetProps) {
      return (
        <button
          type='button'
          id={`${props.id}-go`}
          onClick={() => {
            ref.current!.setFieldValue('a', 'edited');
            ref.current!.submit();
          }}
        >
          go
        </button>
      );
    }
    const { getFormData } = createFormComponent({
      ref,
      schema,
      uiSchema: { a: { 'ui:widget': EditThenSubmit } },
      initialFormData: { a: 'old' },
      noHtml5Validate: true,
      customValidate: () => {
        throw new Error('boom');
      },
    });

    // The submit runs from the DOM event `submit()` dispatches, whose handler's error React reports to `window`
    expect(await reportedBy(() => user.click(screen.getByRole('button', { name: 'go' })))).toEqual([new Error('boom')]);
    expect(ref.current).not.toBeNull();
    act(() => ref.current!.setFieldValue('a', 'later'));
    expect(getFormData()).toEqual({ a: 'later' });
  });

  it('a second edit in one tick whose validation throws keeps the form mounted', () => {
    const ref = createFormRef();
    const { getFormData } = createFormComponent({
      ref,
      schema,
      initialFormData: { a: 'old' },
      liveValidate: 'onChange',
      customValidate: (formData, errors) => {
        if ((formData as Data).a === 'second') {
          throw new Error('boom');
        }
        return errors;
      },
    });

    // The handle method validates in the caller's own call, so the throw reaches the caller
    expect(() =>
      act(() => {
        ref.current!.setFieldValue('a', 'first');
        ref.current!.setFieldValue('a', 'second');
      }),
    ).toThrow('boom');
    expect(ref.current).not.toBeNull();
    act(() => ref.current!.setFieldValue('a', 'later'));
    expect(getFormData()).toEqual({ a: 'later' });
  });

  it('a blur after two edits keeps validation aligned with the last edit', async () => {
    function EditTwiceThenBlur(props: WidgetProps) {
      return (
        <button
          type='button'
          id={`${props.id}-commit`}
          onClick={() => {
            props.onChange('abcde');
            props.onChange('ab');
            props.onBlur(props.id, 'ab');
          }}
        >
          commit
        </button>
      );
    }
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { foo: { type: 'string', minLength: 5 } } },
      uiSchema: { foo: { 'ui:widget': EditTwiceThenBlur } },
      liveValidate: 'onChange',
      omitExtraData: true,
      liveOmit: 'onBlur',
      initialFormData: { foo: 'abcdef' },
    });

    await user.click(node.querySelector('#root_foo-commit')!);

    expect(fieldErrorsById(node)).toEqual({ root_foo: ['must NOT have fewer than 5 characters'] });
  });
});

describe('a submit in the same tick as an edit', () => {
  it('reports the edited data when it is invalid', () => {
    const ref = createFormRef<Data>();
    const { onSubmit, onError } = createFormComponent({
      ref,
      schema: { ...schema, required: ['a', 'b'] },
      initialFormData: {},
      noHtml5Validate: true,
    });

    act(() => {
      handleOf(ref).setFieldValue('a', 'new');
      handleOf(ref).submit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toEqual([expect.objectContaining({ property: 'b' })]);
  });

  it('submits the edit', () => {
    const ref = createFormRef<Data>();
    const { onSubmit } = createFormComponent({
      ref,
      schema: { ...schema, required: ['a'] },
      initialFormData: {},
      noHtml5Validate: true,
    });

    act(() => {
      handleOf(ref).setFieldValue('a', 'x');
      handleOf(ref).submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'x' });
  });

  it('is checked by native validation against the inputs as rendered before the edit', () => {
    const ref = createFormRef<Data>();
    const { container, onSubmit, onError } = createFormComponent({
      ref,
      schema: { ...schema, required: ['a'] },
      initialFormData: {},
    });

    act(() => {
      handleOf(ref).setFieldValue('b', 'y');
      handleOf(ref).submit();
    });

    expect(input(container, 'root_b')).toHaveValue('y');
    expect(input(container, 'root_a')).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('is blocked by native validation when the edit fills the required input, until React renders it', () => {
    const ref = createFormRef<Data>();
    const { onSubmit } = createFormComponent({
      ref,
      schema: { ...schema, required: ['a'] },
      initialFormData: {},
    });

    act(() => {
      handleOf(ref).setFieldValue('a', 'x');
      handleOf(ref).submit();
    });
    expect(onSubmit).not.toHaveBeenCalled();

    // The input shows the edit now, so a submit goes through: submit from an Effect, or turn `noHtml5Validate` on
    act(() => handleOf(ref).submit());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'x' });
  });
});

/** A throw from a callback propagates to the caller of the handle method that called it, to `window`, where React
 * reports it, for a submit event, and from a timer for a field's change, blur or focus, which a field can report from an
 * Effect. None of them unmounts the form.
 */
describe('a throwing callback', () => {
  it('an onChange that throws keeps the form mounted', () => {
    const ref = createFormRef();
    const { getFormData } = createFormComponent({
      ref,
      schema,
      initialFormData: { a: 'old' },
      onChange: ({ formData }: IChangeEvent) => {
        if ((formData as Data | undefined)?.a === 'first') {
          throw new Error('boom');
        }
      },
    });

    expect(() => act(() => handleOf(ref).setFieldValue('a', 'first'))).toThrow('boom');
    expect(ref.current).not.toBeNull();
    act(() => ref.current!.setFieldValue('a', 'later'));
    expect(getFormData()).toEqual({ a: 'later' });
  });

  it('an onSubmit that throws keeps the form mounted', async () => {
    const ref = createFormRef();
    const { node, getFormData } = createFormComponent({
      ref,
      schema,
      initialFormData: { a: 'old' },
      onSubmit: () => {
        throw new Error('boom');
      },
    });

    expect(await reportedBy(() => submitForm(node, user))).toEqual([new Error('boom')]);
    expect(ref.current).not.toBeNull();
    act(() => ref.current!.setFieldValue('a', 'later'));
    expect(getFormData()).toEqual({ a: 'later' });
  });

  describe('an onError that throws keeps the form mounted', () => {
    const renderInvalid = () => {
      const ref = createFormRef();
      const rendered = createFormComponent({
        ref,
        schema: { type: 'object', properties: { a: { type: 'string', minLength: 5 } } },
        initialFormData: { a: 'x' },
        noHtml5Validate: true,
        onError: () => {
          throw new Error('boom');
        },
      });
      return { ref, ...rendered };
    };

    it('on an invalid submit', async () => {
      const { ref, node, getFormData } = renderInvalid();

      expect(await reportedBy(() => submitForm(node, user))).toEqual([new Error('boom')]);
      expect(ref.current).not.toBeNull();
      act(() => ref.current!.setFieldValue('a', 'later'));
      expect(getFormData()).toEqual({ a: 'later' });
    });

    it('on a programmatic validateForm()', () => {
      const { ref, getFormData } = renderInvalid();

      expect(() => act(() => handleOf(ref).validateForm())).toThrow('boom');
      expect(ref.current).not.toBeNull();
      act(() => ref.current!.setFieldValue('a', 'later'));
      expect(getFormData()).toEqual({ a: 'later' });
    });
  });
});

describe('a throwing callback a field reports from an Effect', () => {
  const boom = () => {
    throw new Error('boom');
  };

  it("a NullField's mount change keeps the form mounted", async () => {
    const onChange = vi.fn(boom);

    const rethrown = await rethrownFromTimers(async () => {
      render(
        <Boundary>
          <Form
            schema={{ type: 'object', properties: { n: { type: 'null' } } }}
            validator={validator}
            onChange={onChange}
          />
        </Boundary>,
      );
    });

    expect(rethrown).toEqual([new Error('boom')]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Fallback')).toBeNull();
    expect(document.querySelector('form')).toBeInTheDocument();
  });

  it("a widget's layout Effect change keeps a form mounted with data mounted", async () => {
    function ChangeOnMountWidget({ onChange }: WidgetProps) {
      useLayoutEffect(() => {
        onChange('mounted');
      }, [onChange]);
      return null;
    }

    const rethrown = await rethrownFromTimers(async () => {
      render(
        <Boundary>
          <Form<Data>
            schema={schema}
            uiSchema={{ a: { 'ui:widget': ChangeOnMountWidget } }}
            validator={validator}
            formData={{}}
            onChange={boom}
          />
        </Boundary>,
      );
    });

    expect(rethrown).toEqual([new Error('boom')]);
    expect(screen.queryByText('Fallback')).toBeNull();
    expect(document.querySelector('form')).toBeInTheDocument();
  });
});
