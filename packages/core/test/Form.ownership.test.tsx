import { Activity, Component, StrictMode, startTransition, useEffect, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ErrorSchema, FieldProps, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { buttonId, deepEquals, getTemplates, getUiOptions, noop } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { collectDeferredThrows } from '../../../testing/deferredThrows.ts';
import SchemaField from '../src/components/fields/SchemaField.tsx';
import type { FormRef, IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';
import type { ParentLog } from './testUtils.tsx';
import {
  AcceptingParent,
  createFormComponent,
  createFormRef,
  createParentLog,
  elementOf,
  fieldErrorsById,
  handleOf,
  input,
  ListeningParent,
  renderInActivity,
  reportedBy,
  setupConsoleWarnSuppression,
  submitForm,
  TransformingParent,
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

/** The ownership contract: the form owns its data. `initialFormData`, and `formData` as another name for it, seed the
 * form on mount and on `reset()` only, like `defaultValue`; a value passed after mount is ignored, with a warning in
 * development. Edits are the form's own and are reported through `onChange`, whatever the parent does with them.
 */
describe('form data ownership', () => {
  const warnings = setupConsoleWarnSuppression();
  /** The warnings the form gave about a `formData` it ignored */
  const ignoredFormDataWarnings = () =>
    warnings.consoleSpy.mock.calls.filter(([message]) =>
      String(message).includes('`formData` changed after the form mounted'),
    );
  /** The warnings the form gave about a handle call it dropped while hidden or after unmounting */
  const droppedCallWarnings = () =>
    warnings.consoleSpy.mock.calls.filter(([message]) => String(message).includes('and was dropped'));

  describe('edits are the form’s own', () => {
    it('an edit is shown and reported whatever its parent does with it', async () => {
      const log = createParentLog<Data>();
      const { container } = render(<ListeningParent<Data> schema={schema} initialValue={{ a: 'a' }} log={log} />);

      await user.click(input(container, 'root_a'));
      await user.paste('b');

      expect(log.reported).toEqual([{ a: 'ab' }]);
      expect(input(container, 'root_a')).toHaveValue('ab');
    });

    it('a spy handler sees each edit, and the form keeps showing it', async () => {
      const { node, onChange } = createFormComponent({ schema, initialFormData: { a: 'a' } });

      await user.click(elementOf(node, '#root_a'));
      await user.paste('b');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'ab' });
      expect(node.querySelector('#root_a')).toHaveValue('ab');
    });

    it('a parent that stores each edit renders it with exactly one callback per edit', async () => {
      const log = createParentLog<Data>();
      const { container } = render(<AcceptingParent<Data> schema={schema} initialValue={{ a: '' }} log={log} />);

      await user.type(input(container, 'root_a'), 'abc');

      expect(log.reported.map((edit) => edit?.a)).toEqual(['a', 'ab', 'abc']);
      expect(input(container, 'root_a')).toHaveValue('abc');
    });

    it('a parent that transforms what it stores does not have its value rendered, and is warned once', async () => {
      const log = createParentLog<Data>();
      const upper = (edit: Data | undefined) => edit && { ...edit, a: edit.a?.toUpperCase() };
      const { container } = render(
        <TransformingParent<Data> schema={schema} initialValue={{ a: '' }} log={log} transform={upper} />,
      );

      await user.type(input(container, 'root_a'), 'ab');

      expect(log.reported).toEqual([{ a: 'a' }, { a: 'ab' }]);
      expect(log.value).toEqual({ a: 'AB' });
      expect(input(container, 'root_a')).toHaveValue('ab');
      expect(ignoredFormDataWarnings()).toHaveLength(1);
    });
  });

  describe('a formData passed after mount is ignored', () => {
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

    it('keeps the data, calls no onChange and warns once, naming a key and setFieldValue', () => {
      const seen: unknown[] = [];
      const uiSchema = { a: { 'ui:widget': recordingWidget(seen) } };
      const onChange = vi.fn();
      function Parent({ value }: { value: Data }) {
        // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
        return <Form schema={schema} uiSchema={uiSchema} validator={validator} formData={value} onChange={onChange} />;
      }
      const { rerender, container } = render(<Parent value={{ a: 'old' }} />);

      rerender(<Parent value={{ a: 'new' }} />);
      rerender(<Parent value={{ a: 'newer' }} />);

      expect(new Set(seen)).toEqual(new Set(['old']));
      expect(input(container, 'root_a')).toHaveValue('old');
      expect(onChange).not.toHaveBeenCalled();
      const ignored = ignoredFormDataWarnings();
      expect(ignored).toHaveLength(1);
      expect(String(ignored[0][0])).toContain('`key`');
      expect(String(ignored[0][0])).toContain('setFieldValue');
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
            // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
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

    it('fills the formData it mounts with in with the schema defaults, without calling onChange, in StrictMode too', () => {
      const ref = createFormRef<Data>();
      const onChange = vi.fn();
      function Parent({ schema: current, value }: { schema: RJSFSchema; value: Data }) {
        return (
          <StrictMode>
            {/* oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning */}
            <Form ref={ref} schema={current} validator={validator} formData={value} onChange={onChange} />
          </StrictMode>
        );
      }
      const value = { a: 'given' };
      const { rerender, container } = render(<Parent schema={withDefaults} value={value} />);

      rerender(<Parent schema={{ ...withDefaults, title: 'changed' }} value={value} />);

      expect(onChange).not.toHaveBeenCalled();
      expect(input(container, 'root_a')).toHaveValue('given');
      expect(input(container, 'root_b')).toHaveValue('B');
      expect(handleOf(ref).getFormData()).toEqual({ a: 'given', b: 'B' });
      expect(ignoredFormDataWarnings()).toHaveLength(0);
    });

    it('warns when a parent puts back the record it seeded the form with, as a Cancel button does', async () => {
      const record: Data = { a: 'saved' };
      function Parent() {
        const [value, setValue] = useState<Data | undefined>(record);
        return (
          <>
            <Form<Data>
              schema={schema}
              validator={validator}
              // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
              formData={value}
              onChange={(event) => setValue(event.formData)}
            />
            <button type='button' onClick={() => setValue(record)}>
              Cancel
            </button>
          </>
        );
      }
      const { container } = render(<Parent />);

      await user.type(input(container, 'root_a'), '!');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(input(container, 'root_a')).toHaveValue('saved!');
      expect(ignoredFormDataWarnings()).toHaveLength(1);
    });

    it('keeps the edits of a form whose parent stores none across the parent’s re-renders', async () => {
      const record: Data = { a: 'record' };
      function Parent({ tick }: { tick: number }) {
        return (
          // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
          <Form schema={schema} validator={validator} formData={record} className={`tick-${tick}`} onChange={noop} />
        );
      }
      const { rerender, container } = render(<Parent tick={0} />);
      await user.type(input(container, 'root_a'), 'x');

      rerender(<Parent tick={1} />);

      expect(input(container, 'root_a')).toHaveValue('recordx');
    });

    it('keeps an edit under a parent that goes on passing its root NaN seed', () => {
      const ref = createFormRef<number>();
      render(
        <Form<number>
          ref={ref}
          schema={{ type: 'number' }}
          validator={validator}
          // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
          formData={Number.NaN}
          onChange={noop}
        />,
      );

      act(() => handleOf(ref).setFieldValue('', 5));

      expect(handleOf(ref).getFormData()).toBe(5);
    });

    it('takes the data it reported back as its own, not as a replacement, without a warning', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { container } = render(
        <AcceptingParent<Data> ref={ref} schema={schema} initialValue={{ a: '' }} log={log} />,
      );

      await user.type(input(container, 'root_a'), 'abc');

      expect(handleOf(ref).getFormData()).toBe(log.value);
      expect(ignoredFormDataWarnings()).toHaveLength(0);
    });

    it.each<[string, (update: () => void) => void]>([
      ['after a timeout', (update) => setTimeout(update, 0)],
      ['in a transition', (update) => startTransition(update)],
    ])('keeps the later edits when a parent stores what it reported %s, without a warning', async (_, apply) => {
      function LateParent() {
        const [data, setData] = useState<Data>({ a: '' });
        return (
          <Form<Data>
            schema={schema}
            validator={validator}
            // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
            formData={data}
            onChange={(event) => apply(() => setData(event.formData))}
          />
        );
      }
      const { container } = render(<LateParent />);

      await user.type(input(container, 'root_a'), 'abc');
      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(input(container, 'root_a')).toHaveValue('abc');
      expect(ignoredFormDataWarnings()).toHaveLength(0);
    });

    it('does not warn for a parent that stores a JSON copy of each edit, once a field is cleared', async () => {
      function JsonParent() {
        const [data, setData] = useState<Data>({ a: 'seed' });
        return (
          <Form<Data>
            schema={schema}
            validator={validator}
            // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back a JSON copy of what onChange reported as `formData`
            formData={data}
            onChange={(event) => setData(JSON.parse(JSON.stringify(event.formData)))}
          />
        );
      }
      const { container } = render(<JsonParent />);

      await user.clear(input(container, 'root_a'));

      expect(input(container, 'root_a')).toHaveValue('');
      expect(ignoredFormDataWarnings()).toHaveLength(0);
    });

    it.each<[string, (update: () => void) => void]>([
      ['at once', (update) => update()],
      ['after a timeout', (update) => setTimeout(update, 0)],
    ])('does not warn for a scalar root whose parent stores what it reported %s', async (_, apply) => {
      function ScalarParent() {
        const [data, setData] = useState<string | undefined>('');
        return (
          <Form<string>
            schema={{ type: 'string' }}
            validator={validator}
            // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
            formData={data}
            onChange={(event) => apply(() => setData(event.formData))}
          />
        );
      }
      const { container } = render(<ScalarParent />);

      await user.type(input(container, 'root'), 'abc');
      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(input(container, 'root')).toHaveValue('abc');
      expect(ignoredFormDataWarnings()).toHaveLength(0);
    });

    it('does not warn for a scalar root whose parent puts back a value it reported before', async () => {
      const ref = createFormRef<string>();
      function UndoParent() {
        const [history, setHistory] = useState<(string | undefined)[]>(['']);
        return (
          <>
            <Form<string>
              ref={ref}
              schema={{ type: 'string' }}
              validator={validator}
              // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern with an undo
              formData={history[history.length - 1]}
              onChange={(event) => setHistory((previous) => [...previous, event.formData])}
            />
            <button type='button' onClick={() => setHistory((previous) => previous.slice(0, -1))}>
              undo
            </button>
          </>
        );
      }
      const { container } = render(<UndoParent />);
      await user.type(input(container, 'root'), 'ab');

      await user.click(screen.getByRole('button', { name: 'undo' }));

      expect(ignoredFormDataWarnings()).toHaveLength(0);
    });

    it('does not warn for a formData written inline whose content never changed', async () => {
      function Parent({ tick }: { tick: number }) {
        return (
          <Form
            schema={schema}
            validator={validator}
            // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: an inline literal re-created on every render
            formData={{ a: 'seed' }}
            className={`tick-${tick}`}
            onChange={noop}
          />
        );
      }
      const { rerender, container } = render(<Parent tick={0} />);
      await user.type(input(container, 'root_a'), 'x');

      rerender(<Parent tick={1} />);

      expect(input(container, 'root_a')).toHaveValue('seedx');
      expect(ignoredFormDataWarnings()).toHaveLength(0);
    });

    it('takes a copy of its data a parent stores without a warning', async () => {
      const log = createParentLog<Data>();
      const { container } = render(
        <TransformingParent<Data>
          schema={schema}
          initialValue={{ a: '' }}
          log={log}
          transform={(edit) => (edit === undefined ? edit : structuredClone(edit))}
        />,
      );

      await user.type(input(container, 'root_a'), 'ab');

      expect(log.value).toEqual({ a: 'ab' });
      expect(input(container, 'root_a')).toHaveValue('ab');
      expect(ignoredFormDataWarnings()).toHaveLength(0);
    });

    it('passing the object the form mounted with again changes nothing, and reset() puts it back', async () => {
      const record: Data = { a: 'record' };
      const ref = createFormRef<Data>();
      function Parent() {
        const [data, setData] = useState<Data | undefined>(record);
        return (
          <>
            <button type='button' onClick={() => setData(record)}>
              restore
            </button>
            <Form<Data>
              ref={ref}
              schema={schema}
              validator={validator}
              // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
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

      expect(input(container, 'root_a')).toHaveValue('recordx');
      act(() => handleOf(ref).reset());
      expect(input(container, 'root_a')).toHaveValue('record');
    });

    it('a formData that becomes undefined, or another value, leaves the data as it is', () => {
      const onChange = vi.fn();
      function Parent({ value }: { value: Data | undefined }) {
        // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
        return <Form schema={withDefaults} validator={validator} formData={value} onChange={onChange} />;
      }
      const { rerender, container } = render(<Parent value={{ a: 'x' }} />);

      rerender(<Parent value={undefined} />);

      expect(input(container, 'root_a')).toHaveValue('x');
      expect(onChange).not.toHaveBeenCalled();

      rerender(<Parent value={{ a: 'y' }} />);

      expect(input(container, 'root_a')).toHaveValue('x');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('a null formData seeds the schema defaults, and a field edit builds on them', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <Form schema={withDefaults} validator={validator} initialFormData={null} onChange={onChange} />,
      );
      expect(input(container, 'root_a')).toHaveValue('A');

      await user.click(input(container, 'root_a'));
      await user.paste('x');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'Ax', b: 'B' });
      expect(input(container, 'root_a')).toHaveValue('Ax');
    });

    it('a null formData is passed, so it is the seed over initialFormData and seeds the schema defaults', () => {
      const { container } = render(
        <Form
          schema={withDefaults}
          validator={validator}
          // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias winning over `initialFormData`
          formData={null}
          initialFormData={{ a: 'seed' }}
        />,
      );

      expect(input(container, 'root_a')).toHaveValue('A');
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
        // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: reset() re-reads the latest `formData`
        <Form ref={ref} schema={withDefault} validator={validator} formData={{ a: 'x' }} onChange={onChange} />,
      );
      await act(async () => {
        handleOf(ref).validateForm();
      });
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(1);
      act(() => handleOf(ref).setFieldValue('a', 'edited'));
      onChange.mockClear();

      act(() => {
        handleOf(ref).reset();
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
          initialFormData={{ a: 'x' }}
          extraErrors={extraErrors}
          onChange={noop}
        />,
      );

      act(() => {
        handleOf(ref).reset();
      });

      expect(container.querySelector('.error-detail li')).toHaveTextContent('from the server');
    });

    it.each(['formData', 'initialFormData'] as const)(
      'reports the extraErrors it keeps on display, for a form seeded with %s',
      (seed) => {
        const ref = createFormRef();
        const onChange = vi.fn();
        const extraErrors: ErrorSchema = { a: { __errors: ['from the server'] } };
        render(
          <Form
            ref={ref}
            schema={withDefault}
            validator={validator}
            {...{ [seed]: { a: 'x' } }}
            extraErrors={extraErrors}
            onChange={onChange}
          />,
        );

        act(() => handleOf(ref).reset());

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].errors).toEqual([
          { property: '.a', message: 'from the server', stack: '.a from the server' },
        ]);
        expect(onChange.mock.calls[0][0].errorSchema).toEqual(extraErrors);
      },
    );

    it('a parent that stores edits replaces the data and clears the errors by resetting and then setting the root', async () => {
      const ref = createFormRef<Data>();
      const reported: unknown[] = [];
      function Parent() {
        const [data, setData] = useState<Data>({ a: 'x' });
        return (
          <>
            <button
              type='button'
              onClick={() => {
                handleOf(ref).reset();
                handleOf(ref).setFieldValue('', { a: 'replaced' });
              }}
            >
              reload
            </button>
            <Form
              ref={ref}
              schema={withDefault}
              validator={validator}
              // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
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
        handleOf(ref).validateForm();
      });
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(1);

      await user.click(elementOf(container, 'button'));

      expect(input(container, 'root_a')).toHaveValue('replaced');
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(0);
      // The reset reported the data it put back, and the root value set after it its own
      expect(reported).toEqual([
        { a: 'x', b: 'defaulted' },
        { a: 'replaced', b: 'defaulted' },
      ]);
    });
  });

  describe('data that loads after mount', () => {
    it('is shown by rendering the form once it arrives', () => {
      function Parent({ record }: { record?: Data }) {
        return record ? <Form schema={schema} validator={validator} initialFormData={record} onChange={noop} /> : null;
      }
      const { rerender, container } = render(<Parent />);
      expect(container.querySelector('#root_a')).not.toBeInTheDocument();

      rerender(<Parent record={{ a: 'loaded' }} />);

      expect(input(container, 'root_a')).toHaveValue('loaded');
    });

    it('switches records by remounting under a key', () => {
      const onChange = vi.fn();
      function Parent({ record, id }: { record?: Data; id: string }) {
        if (!record) {
          return <span>loading</span>;
        }
        return <Form key={id} schema={schema} validator={validator} initialFormData={record} onChange={onChange} />;
      }
      const { rerender, container } = render(<Parent id='1' />);
      expect(container).toHaveTextContent('loading');

      rerender(<Parent id='1' record={{ a: 'one' }} />);
      expect(input(container, 'root_a')).toHaveValue('one');
      rerender(<Parent id='2' record={{ a: 'two' }} />);

      expect(input(container, 'root_a')).toHaveValue('two');
      expect(onChange).not.toHaveBeenCalled();
      expect(ignoredFormDataWarnings()).toHaveLength(0);
    });

    it('takes a fallback value until the record arrives, remounting under a key when it does', () => {
      function Parent({ record }: { record?: Data }) {
        return (
          <Form
            key={record ? 'record' : 'fallback'}
            schema={schema}
            validator={validator}
            initialFormData={record ?? {}}
            onChange={noop}
          />
        );
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
      expect(handleOf(ref).getFormData()).toEqual({ a: 'A', b: 'seed' });
    });

    it('keeps its data across an unrelated prop change and a new initialFormData', async () => {
      const { node, rerender } = createFormComponent({ schema, initialFormData: { a: 'own' } });
      await user.clear(input(node, 'root_a'));
      await user.paste('edited');

      rerender({ schema, initialFormData: { a: 'own' }, className: 'other' });
      expect(node.querySelector('#root_a')).toHaveValue('edited');
      rerender({ schema, initialFormData: { a: 'another seed' } });

      expect(node.querySelector('#root_a')).toHaveValue('edited');
    });

    it('a formData passed later is ignored like a new initialFormData', async () => {
      const { node, rerender } = createFormComponent({ schema, initialFormData: { a: 'own' } });
      await user.clear(input(node, 'root_a'));
      await user.paste('edited');

      // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias passed beside `initialFormData`
      rerender({ schema, initialFormData: { a: 'own' }, formData: { a: 'late' } });

      expect(node.querySelector('#root_a')).toHaveValue('edited');
      expect(ignoredFormDataWarnings()).toHaveLength(1);
    });

    it('resets to the latest seed and the current schema, and reports it', async () => {
      const ref = createFormRef();
      const { node, onChange, rerender } = createFormComponent({
        ref,
        schema: withDefault,
        initialFormData: { b: 'one' },
      });
      await user.clear(input(node, 'root_b'));
      await user.paste('edited');
      rerender({ ref, schema: withDefault, initialFormData: { b: 'two' } });
      onChange.mockClear();

      act(() => {
        handleOf(ref).reset();
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
      expect(handleOf(ref).getFormData()).toEqual({ a: 'A', b: 'kept' });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('composition in one tick under a parent that stores edits', () => {
    /** Two path changes in one `act`, through the form's own change path, with exactly `setData(event.formData)` */
    const acceptAll = () => true;
    const keepEdit = (edit: Data) => edit;

    function PolicyParent({
      ref,
      accept = acceptAll,
      transform = keepEdit,
      log,
    }: {
      ref: React.RefObject<FormRef<Data> | null>;
      accept?: (edit: Data) => boolean;
      transform?: (edit: Data) => Data;
      log: ParentLog<Data>;
    }) {
      const [data, setData] = useState<Data>({ a: '', b: '' });
      Object.assign(log, { value: data });
      return (
        <Form<Data>
          ref={ref}
          schema={schema}
          validator={validator}
          // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
          formData={data}
          onChange={(event) => {
            const edit = event.formData;
            log.reported.push(edit);
            if (accept(edit)) {
              setData(transform(edit));
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
        handleOf(ref).setFieldValue('a', 'first');
        handleOf(ref).setFieldValue('b', 'second');
      });

      // The second change builds on the first, which React has not rendered yet
      expect(log.reported).toEqual([
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
      const { container } = render(<PolicyParent ref={ref} log={log} />);

      await act(async () => {
        handleOf(ref).setFieldValue([], { ...handleOf(ref).getFormData(), a: 'first', b: 'second' });
      });

      expect(log.reported).toEqual([{ a: 'first', b: 'second' }]);
      expect(log.value).toEqual({ a: 'first', b: 'second' });
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('second');
    });

    it("a second change in one tick builds on the first as made, not as the parent's transform", async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      render(<PolicyParent ref={ref} log={log} transform={(edit) => ({ ...edit, a: edit.a?.toUpperCase() })} />);

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'first');
        handleOf(ref).setFieldValue('b', 'second');
      });

      // The transform reaches the form only when React renders the parent's value
      expect(log.reported[1]).toEqual({ a: 'first', b: 'second' });
      expect(log.value).toEqual({ a: 'FIRST', b: 'second' });
    });

    it('an edit the parent does not store stays the form’s data, in the same tick and in later ones', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { container } = render(<PolicyParent ref={ref} log={log} accept={(edit) => edit.a !== 'first'} />);

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'first');
      });
      await act(async () => {
        handleOf(ref).setFieldValue('b', 'second');
      });

      // The form owns the edit; a parent that wants it undone sets the field back
      expect(log.reported).toEqual([
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
            // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
            formData={data}
            onChange={(event) => {
              reported.push(event.formData);
              if (event.formData.a === 'forbidden') {
                handleOf(ref).setFieldValue('a', data.a);
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

    it('drops an edit made while hidden by Activity, as React asks hidden content to be treated as unmounted', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { hide, show } = renderInActivity(() => <PolicyParent ref={ref} log={log} />);
      const handle = handleOf(ref);
      hide();

      await act(async () => {
        handle.setFieldValue('a', 'first');
      });
      show();

      expect(log.reported).toEqual([]);
      expect(handle.getFormData()).toEqual({ a: '', b: '' });
    });

    it('drops a reset and a submit made while hidden by Activity', () => {
      const ref = createFormRef<Data>();
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const { hide } = renderInActivity(() => (
        <Form<Data>
          ref={ref}
          schema={schema}
          validator={validator}
          initialFormData={{ a: 'seed' }}
          onChange={onChange}
          onSubmit={onSubmit}
        />
      ));
      const handle = handleOf(ref);
      act(() => handle.setFieldValue('a', 'edited'));
      hide();
      onChange.mockClear();

      act(() => handle.reset());
      act(() => handle.submit());

      expect(onChange).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(handle.getFormData()).toEqual({ a: 'edited' });
    });

    it.each([
      ['valid', { a: 'seed' }],
      ['invalid', { a: 'x' }],
    ])('drops a submit event that reaches a form hidden by Activity, with %s data', (_, seedData) => {
      const onSubmit = vi.fn();
      const onError = vi.fn();
      const { container, hide } = renderInActivity(() => (
        <Form<Data>
          schema={{ ...schema, properties: { ...schema.properties, a: { type: 'string', minLength: 2 } } }}
          validator={validator}
          initialFormData={seedData}
          noHtml5Validate
          onSubmit={onSubmit}
          onError={onError}
        />
      ));
      hide();

      act(() => {
        elementOf(container, 'form').dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('drops a submit event that reaches a form first rendered hidden by Activity', () => {
      const onSubmit = vi.fn();
      const { container } = render(
        <Activity mode='hidden'>
          <Form<Data> schema={schema} validator={validator} initialFormData={{ a: 'seed' }} onSubmit={onSubmit} />
        </Activity>,
      );

      act(() => {
        elementOf(container, 'form').dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('warns once, in development, about the handle calls it drops while hidden by Activity', () => {
      const ref = createFormRef<Data>();
      const { hide, show } = renderInActivity(() => (
        <Form<Data> ref={ref} schema={schema} validator={validator} initialFormData={{ a: 'seed' }} />
      ));
      const handle = handleOf(ref);
      hide();

      act(() => handle.setFieldValue('a', 'dropped'));
      act(() => handle.reset());
      act(() => handle.submit());

      expect(droppedCallWarnings()).toHaveLength(1);
      expect(droppedCallWarnings()[0][0]).toMatch(/`setFieldValue\(\)` was called on a form that is hidden/);
      expect(handle.getFormData()).toEqual({ a: 'seed' });

      show();
      act(() => handle.setFieldValue('a', 'shown'));

      expect(handle.getFormData()).toEqual({ a: 'shown' });
      expect(droppedCallWarnings()).toHaveLength(1);
    });

    it('warns once, in development, about a handle call made after the form unmounted', () => {
      const ref = createFormRef<Data>();
      const { unmount } = render(
        <Form<Data> ref={ref} schema={schema} validator={validator} initialFormData={{ a: 'seed' }} />,
      );
      const handle = handleOf(ref);
      unmount();

      act(() => handle.reset());
      act(() => handle.setFieldValue('a', 'dropped'));

      expect(droppedCallWarnings()).toHaveLength(1);
      expect(droppedCallWarnings()[0][0]).toMatch(/`reset\(\)` was called on a form that is hidden/);
      expect(handle.getFormData()).toEqual({ a: 'seed' });
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
      const { rerender } = render(<Form<Data> key='1' {...props} initialFormData={{ a: 'layout', b: 'passive' }} />);
      onChange.mockClear();

      // The parent loads another record under its own key, in which both widgets set their field again
      rerender(<Form<Data> key='2' {...props} initialFormData={{ a: 'x', b: 'y' }} />);

      expect(onChange.mock.calls.map(([event]: IChangeEvent<Data>[]) => event.formData)).toEqual([
        { a: 'layout', b: 'y' },
        { a: 'layout', b: 'passive' },
      ]);
    });

    it('keeps an edit a layout Effect cleanup makes in the commit that renders the echo of the edit before it', () => {
      interface Flushed extends Data {
        c?: string;
      }
      const ref = createFormRef<Flushed>();
      const log = createParentLog<Flushed>();
      const pending = { cleanup: false, setup: false };
      // Writes `b` as React cleans its layout Effect up, which is before the form hears of the commit, the way a widget
      // flushes a value it held back, and `c` once the same commit has set the Effect up again
      function FlushingWidget({ value }: WidgetProps) {
        useLayoutEffect(() => {
          if (pending.setup) {
            pending.setup = false;
            handleOf(ref).setFieldValue('c', 'from setup');
          }
          return () => {
            if (pending.cleanup) {
              pending.cleanup = false;
              handleOf(ref).setFieldValue('b', 'from cleanup');
            }
          };
        });
        return <span>{String(value)}</span>;
      }
      render(
        <AcceptingParent<Flushed>
          ref={ref}
          schema={{
            type: 'object',
            properties: { a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' } },
          }}
          uiSchema={{ a: { 'ui:widget': FlushingWidget } }}
          initialValue={{ a: '', b: '', c: '' }}
          log={log}
        />,
      );

      act(() => {
        Object.assign(pending, { cleanup: true, setup: true });
        handleOf(ref).setFieldValue('a', 'x');
      });

      expect(handleOf(ref).getFormData()).toEqual({ a: 'x', b: 'from cleanup', c: 'from setup' });
      expect(log.value).toEqual({ a: 'x', b: 'from cleanup', c: 'from setup' });
    });

    it('takes an edit made as a hidden form is shown, and none made while it was hidden', () => {
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

      expect(log.value).toEqual({ a: '', b: 'shown' });
    });

    it.each([false, true])(
      'takes an edit a widget makes from a layout Effect as a hidden form is shown again (StrictMode: %s)',
      (reactStrictMode) => {
        const log = createParentLog<Data>();
        // A new widget each time, so its layout Effect sets the field as the form is shown, before the form's own
        // layout Effects run
        const parent = (to: string) => {
          const form = (
            <AcceptingParent<Data>
              schema={schema}
              uiSchema={{ a: { 'ui:widget': settingWidget(useLayoutEffect, to) } }}
              initialValue={{ a: '', b: '' }}
              log={log}
            />
          );
          return reactStrictMode ? <StrictMode>{form}</StrictMode> : form;
        };
        const { hide, show } = renderInActivity(parent, 'mounted');
        expect(log.value).toEqual({ a: 'mounted', b: '' });
        hide('mounted');

        show('shown');

        expect(log.value).toEqual({ a: 'shown', b: '' });
      },
    );

    it('a command from a layout Effect earlier in the tree starts from the props of its commit', () => {
      const onlyA: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
      const ref = createFormRef<Data>();
      function Sync({ hasB }: { hasB: boolean }) {
        useLayoutEffect(() => {
          if (hasB) {
            handleOf(ref).setFieldValue('b', 'set');
          }
        }, [hasB]);
        return null;
      }
      const tree = (hasB: boolean) => (
        <>
          <Sync hasB={hasB} />
          <Form<Data>
            ref={ref}
            schema={hasB ? schema : onlyA}
            validator={validator}
            omitExtraData
            liveOmit='onChange'
          />
        </>
      );
      const { rerender } = render(tree(false));

      rerender(tree(true));

      // Set under the schema that declares `b`, so the live omit keeps it
      expect(handleOf(ref).getFormData()).toEqual({ b: 'set' });
    });

    it("a removed field's layout cleanup reports through the props of the commit that removes it", () => {
      interface Versioned {
        a?: string;
        b?: string;
        version?: number;
      }
      // Flushes a draft as it unmounts, as a widget that keeps its own draft does
      function FlushingWidget({ onChange }: WidgetProps) {
        useLayoutEffect(() => () => onChange('flushed'), [onChange]);
        return null;
      }
      const reported: [number, Versioned][] = [];
      const tree = (version: number) => (
        <Form<Versioned>
          schema={version === 1 ? schema : { type: 'object', properties: { a: { type: 'string' } } }}
          uiSchema={{ b: { 'ui:widget': FlushingWidget } }}
          validator={validator}
          initialFormData={{ a: 'a' }}
          onChange={(event) => reported.push([version, event.formData])}
        />
      );
      const { rerender } = render(tree(1));

      rerender(tree(2));

      expect(reported).toEqual([[2, { a: 'a', b: 'flushed' }]]);
    });

    it("a replaced root field's layout cleanup reports through the props of the commit that replaces it", () => {
      interface Versioned {
        a?: string;
        b?: string;
      }
      function FlushingWidget({ onChange }: WidgetProps) {
        useLayoutEffect(() => () => onChange('flushed'), [onChange]);
        return null;
      }
      // Two root fields that render alike, so switching between them replaces a direct child of the form element
      function FirstSchemaField(props: FieldProps) {
        return <SchemaField {...props} />;
      }
      function SecondSchemaField(props: FieldProps) {
        return <SchemaField {...props} />;
      }
      const reported: [number, Versioned][] = [];
      const tree = (version: number) => (
        <Form<Versioned>
          schema={schema}
          uiSchema={{ b: { 'ui:widget': FlushingWidget } }}
          fields={{ SchemaField: version === 1 ? FirstSchemaField : SecondSchemaField }}
          validator={validator}
          initialFormData={{ a: 'a' }}
          onChange={(event) => reported.push([version, event.formData])}
        />
      );
      const { rerender } = render(tree(1));

      rerender(tree(2));

      expect(reported).toEqual([[2, { a: 'a', b: 'flushed' }]]);
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
            // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
            formData={data}
            onChange={(event) => {
              const edit = event.formData;
              reported.push(edit);
              setData(edit);
              if (edit.a === 'first' && edit.b === '') {
                handleOf(ref).setFieldValue('b', 'derived');
              }
            }}
          />
        );
      }
      const { container } = render(<ReentrantParent />);

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'first');
      });

      expect(reported).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'derived' },
      ]);
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('derived');
    });

    it('a derived field a parent adds to the value it stores is not rendered, since the form keeps its data', async () => {
      const ref = createFormRef<Data>();
      const reported: Data[] = [];
      function ComposingOnChangeParent() {
        const [data, setData] = useState<Data>({ a: '', b: '' });
        return (
          <Form<Data>
            ref={ref}
            schema={schema}
            validator={validator}
            // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
            formData={data}
            onChange={(event) => {
              const edit = event.formData;
              reported.push(edit);
              setData(edit.a === 'first' ? { ...edit, b: 'derived' } : edit);
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
      expect(input(container, 'root_b')).toHaveValue('');
      expect(ignoredFormDataWarnings()).toHaveLength(1);
    });

    it('a new formData object leaves the edits a parent never stored, and a missing handler stops nothing', async () => {
      const ref = createFormRef();
      // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
      const { rerender } = render(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} />);
      await act(async () => {
        handleOf(ref).setFieldValue('a', 'x');
        handleOf(ref).setFieldValue('b', 'y');
      });
      expect(handleOf(ref).getFormData()).toEqual({ a: 'x', b: 'y' });
      const onChange = vi.fn();
      // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
      rerender(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} onChange={onChange} />);

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'z');
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'z', b: 'y' });
    });

    it('every operation in one tick calls onChange with its own value', async () => {
      const ref = createFormRef();
      const onChange = vi.fn();
      render(<Form ref={ref} schema={schema} validator={validator} initialFormData={{ a: '' }} onChange={onChange} />);

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'x');
        handleOf(ref).setFieldValue('b', 'y');
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'x' });
      expect(onChange.mock.calls[1][0].formData).toEqual({ a: 'x', b: 'y' });
    });
  });

  describe('development diagnostics', () => {
    /** The warnings the form gave about being passed both seeds */
    const bothSeedsWarnings = () =>
      warnings.consoleSpy.mock.calls.filter(([message]) => String(message).includes('`initialFormData` is ignored'));

    it('warns once, naming the seed that won, when both formData and initialFormData are passed', () => {
      const ref = createFormRef<Data>();
      function Parent({ tick }: { tick: number }) {
        return (
          <Form<Data>
            ref={ref}
            schema={schema}
            validator={validator}
            // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias taking over initialFormData
            formData={{ a: 'formData' }}
            initialFormData={{ a: 'initialFormData' }}
            className={`tick-${tick}`}
          />
        );
      }
      const { rerender } = render(<Parent tick={0} />);
      rerender(<Parent tick={1} />);
      act(() => handleOf(ref).reset());

      expect(handleOf(ref).getFormData()).toEqual({ a: 'formData' });
      expect(bothSeedsWarnings()).toHaveLength(1);
      expect(String(bothSeedsWarnings()[0][0])).toContain('`formData`');
    });

    describe('a container field rendered with other data than the form holds at its path', () => {
      /** The warnings the form gave about a container field not passed the form's data */
      const passThroughWarnings = () =>
        warnings.consoleSpy.mock.calls.filter(([message]) => String(message).includes('pass `formData` through'));
      interface ListData {
        list?: string[];
        record?: { a?: string };
      }
      const listSchema: RJSFSchema = {
        type: 'object',
        properties: {
          list: { type: 'array', items: { type: 'string' } },
          record: { type: 'object', properties: { a: { type: 'string' } } },
        },
      };

      it('warns once, naming the field, for a wrapper that hands ArrayField a sorted copy', async () => {
        function SortedList(props: FieldProps<string[]>) {
          const { ArrayField } = props.registry.fields;
          return <ArrayField {...props} formData={[...(props.formData ?? [])].sort()} />;
        }
        const { container } = render(
          <Form<ListData>
            schema={listSchema}
            uiSchema={{ list: { 'ui:field': SortedList } }}
            validator={validator}
            initialFormData={{ list: ['b', 'a'] }}
          />,
        );
        await user.click(elementOf(container, `#${buttonId('root_list', 'add')}`));

        expect(passThroughWarnings()).toHaveLength(1);
        expect(String(passThroughWarnings()[0][0])).toContain('ArrayField');
        expect(String(passThroughWarnings()[0][0])).toContain('root_list');
      });

      it('warns once for a field remounted with a key, naming it by its path as well as its id', () => {
        function SortedList(props: FieldProps<string[]>) {
          const { ArrayField } = props.registry.fields;
          return <ArrayField {...props} formData={[...(props.formData ?? [])].sort()} />;
        }
        const form = (key: number) => (
          <Form<ListData>
            key={key}
            schema={listSchema}
            uiSchema={{ list: { 'ui:field': SortedList } }}
            validator={validator}
            initialFormData={{ list: ['b', 'a'] }}
          />
        );
        const { rerender } = render(form(0));

        rerender(form(1));
        rerender(form(2));

        expect(passThroughWarnings()).toHaveLength(1);
        expect(String(passThroughWarnings()[0][0])).toContain('"root_list" (list)');
      });

      it('does not warn for wrappers that pass formData through, or a widget that edits as it mounts', () => {
        function PassingRecord(props: FieldProps) {
          const { ObjectField } = props.registry.fields;
          return <ObjectField {...props} />;
        }
        function ChangeOnMountWidget({ onChange }: WidgetProps) {
          useLayoutEffect(() => {
            onChange('mounted');
          }, [onChange]);
          return null;
        }
        render(
          <Form<ListData>
            schema={listSchema}
            uiSchema={{ record: { 'ui:field': PassingRecord, a: { 'ui:widget': ChangeOnMountWidget } } }}
            validator={validator}
            initialFormData={{ list: ['b', 'a'], record: {} }}
          />,
        );

        expect(passThroughWarnings()).toHaveLength(0);
      });
    });

    it('does not warn when only one seed is passed', () => {
      render(<Form schema={schema} validator={validator} initialFormData={{ a: 'seed' }} />);

      expect(bothSeedsWarnings()).toHaveLength(0);
    });

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
          initialFormData={{ a: '', list: ['one'], when }}
          onChange={(event) => {
            seen = event;
          }}
        />,
      );

      await user.click(elementOf(document, '#root_a'));
      await user.paste('x');

      expect(Object.isFrozen(seen!.formData)).toBe(true);
      expect(Object.isFrozen(seen!.formData.list)).toBe(true);
      expect(seen!.formData.when).toBeInstanceOf(Date);
      expect(Object.isFrozen(seen!.formData.when)).toBe(false);
    });

    it('freezes the data the form commits', async () => {
      const ref = createFormRef();
      const { node } = createFormComponent({ ref, schema, initialFormData: { a: '' } });

      await user.click(elementOf(node, '#root_a'));
      await user.paste('x');

      expect(Object.isFrozen(handleOf(ref).getFormData())).toBe(true);
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
      const select = elementOf(container, '#root_status__oneof_select');

      await user.selectOptions(select, '1');

      expect(log.reported).toHaveLength(1);
      expect(select).toHaveValue('1');
      expect(input(container, 'root_status_reason')).toHaveValue('');
    });

    it('a oneOf switch that transformChange rewrites checks the chosen option without the stubs of its additional keys', async () => {
      // The chosen option's stub for `k` is a guessed `{ type: 'string' }`, which takes `'x'`, but the option's own
      // `additionalProperties` rejects it. The rewrite gives the status an `id` beside that `k`, so the data no longer
      // fits the choice and the selector goes back to option 0
      const stubbed: RJSFSchema = {
        type: 'object',
        properties: {
          note: { type: 'string' },
          status: {
            type: 'object',
            oneOf: [
              { title: 'Fixed', type: 'object', properties: { k: { const: 'x' } } },
              {
                title: 'Open',
                type: 'object',
                properties: { id: { type: 'string' } },
                additionalProperties: { not: { const: 'x' } },
              },
            ],
          },
        },
      };
      render(
        <Form
          schema={stubbed}
          validator={validator}
          initialFormData={{ status: { k: 'x' } }}
          transformChange={(next) => ({ ...next, status: { k: 'x', id: 'a' } })}
        />,
      );
      const select = screen.getByDisplayValue('Fixed');
      expect(select).toHaveValue('0');

      await user.selectOptions(select, '1');

      expect(select).toHaveValue('0');
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
      const select = elementOf(container, '#root_size__oneof_select');

      await user.selectOptions(select, '1');

      expect(select).toHaveValue('1');
    });

    it('an array add and remove are shown whatever the parent stores', async () => {
      const arraySchema: RJSFSchema = { type: 'array', items: { type: 'string' } };
      const log = createParentLog<string[]>();
      const { container } = render(<ListeningParent schema={arraySchema} initialValue={['one', 'two']} log={log} />);

      await user.click(elementOf(container, '.rjsf-array-item-add button'));
      expect(log.reported).toEqual([['one', 'two', undefined]]);
      expect(container.querySelectorAll('input[type=text]')).toHaveLength(3);

      await user.click(elementOf(container, '.rjsf-array-item-remove'));
      expect(log.reported.at(-1)).toEqual(['two', undefined]);
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
      const keyInput = input(container, 'root_first__key');

      await user.clear(keyInput);
      await user.type(keyInput, 'renamed');
      await user.tab();

      expect(log.reported.at(-1)).toEqual({ renamed: 'one', second: 'two' });
      expect(container.querySelector('#root_renamed')).toHaveValue('one');
      expect(container.querySelector('#root_second')).toHaveValue('two');
      expect(container.querySelector('#root_first')).toBeNull();
    });

    it('an additional property the parent set back and the user adds again renders once', async () => {
      const objectSchema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
      const ref = createFormRef<Record<string, string>>();
      let isStoring = false;
      function SetBackOnceParent() {
        const [data, setData] = useState<Record<string, string>>({});
        return (
          <Form<Record<string, string>>
            ref={ref}
            schema={objectSchema}
            validator={validator}
            // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
            formData={data}
            onChange={(event) => {
              if (isStoring) {
                setData(event.formData);
              } else if ('newKey' in event.formData) {
                handleOf(ref).setFieldValue('', data);
              }
            }}
          />
        );
      }
      const { container } = render(<SetBackOnceParent />);
      const addButton = () => elementOf(container, '.rjsf-object-property-expand button');

      await user.click(addButton());
      expect(container.querySelectorAll('#root_newKey')).toHaveLength(0);
      isStoring = true;
      await user.click(addButton());

      expect(container.querySelectorAll('#root_newKey')).toHaveLength(1);
    });
  });

  describe('reading and submitting', () => {
    it('getFormData() returns the formData passed, when the schema adds no default, and the edits made since', async () => {
      const passed = createFormRef();
      const value = { a: 'parent' };
      render(<Form ref={passed} schema={schema} validator={validator} initialFormData={value} onChange={noop} />);
      expect(handleOf(passed).getFormData()).toBe(value);

      const owned = createFormRef();
      const { node } = createFormComponent({ ref: owned, schema, initialFormData: { a: 'seed' } });
      await user.clear(input(node, 'root_a'));
      await user.paste('edited');
      expect(handleOf(owned).getFormData()).toEqual({ a: 'edited' });
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
          initialFormData={{ a: 'x', extra: 'gone' }}
          omitExtraData
          onSubmit={onSubmit}
          onChange={onChange}
        />,
      );

      await act(async () => {
        handleOf(ref).submit();
      });

      expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'x' });
      expect(handleOf(ref).getFormData()).toEqual({ a: 'x' });
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
      await user.click(elementOf(container, 'button[type=submit]'));
      expect(fieldErrorsById(container).root_foo).toEqual(['must NOT have fewer than 5 characters']);

      await user.click(elementOf(container, '#root_foo-raise'));

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
      await user.click(elementOf(container, 'button[type=submit]'));

      await user.click(elementOf(container, '#root_foo-raise'));

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

      await user.click(elementOf(container, '#raise-root'));
      await user.click(elementOf(container, 'button[type=submit]'));

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

      expect(log.reported).toEqual([{ foo: 'abcdef' }]);
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
      expect(log.reported.at(-1)).toEqual({ a: 'x', b: 'fromBlur' });
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
      handleOf(ref).setFieldValue('a', 'new');
      handleOf(ref).submit();
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
    act(() => handleOf(ref).setFieldValue('a', 'new'));

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
            handleOf(ref).setFieldValue('a', 'edited');
            handleOf(ref).submit();
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

    // `submit()` throws the validation's error into the click handler, whose error React reports to `window`
    expect(await reportedBy(() => user.click(screen.getByRole('button', { name: 'go' })))).toEqual([new Error('boom')]);
    expect(ref.current).not.toBeNull();
    act(() => handleOf(ref).setFieldValue('a', 'later'));
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
        handleOf(ref).setFieldValue('a', 'first');
        handleOf(ref).setFieldValue('a', 'second');
      }),
    ).toThrow('boom');
    expect(ref.current).not.toBeNull();
    act(() => handleOf(ref).setFieldValue('a', 'later'));
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

    await user.click(elementOf(node, '#root_foo-commit'));

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

  it('is checked by schema validation alone, before submit() returns, while the inputs have yet to show the edit', () => {
    const ref = createFormRef<Data>();
    const { onSubmit, onError } = createFormComponent({
      ref,
      schema: { ...schema, required: ['a'] },
      initialFormData: {},
    });

    act(() => {
      handleOf(ref).setFieldValue('b', 'y');
      handleOf(ref).submit();
      // The inputs describe data the form no longer holds, so the browser's checks of them are not run
      expect(onError).toHaveBeenCalledTimes(1);
    });

    expect(onError.mock.calls[0][0]).toEqual([expect.objectContaining({ property: 'a' })]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an edit that fills the required input before submit() returns', () => {
    const ref = createFormRef<Data>();
    const { onSubmit } = createFormComponent({
      ref,
      schema: { ...schema, required: ['a'] },
      initialFormData: {},
    });

    act(() => {
      handleOf(ref).setFieldValue('a', 'x');
      handleOf(ref).submit();
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'x' });
  });

  it('is checked by native validation when the inputs show the data, as for a submit button', () => {
    const ref = createFormRef<Data>();
    const { container, onSubmit, onError } = createFormComponent({
      ref,
      schema: { ...schema, required: ['a'] },
      initialFormData: {},
    });

    act(() => handleOf(ref).submit());

    expect(input(container, 'root_a')).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('submits before submit() returns when the inputs already show the data', () => {
    const ref = createFormRef<Data>();
    const { onSubmit } = createFormComponent({
      ref,
      schema: { ...schema, required: ['a'] },
      initialFormData: { a: 'x' },
    });

    act(() => {
      handleOf(ref).submit();
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
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
    act(() => handleOf(ref).setFieldValue('a', 'later'));
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
    act(() => handleOf(ref).setFieldValue('a', 'later'));
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
      act(() => handleOf(ref).setFieldValue('a', 'later'));
      expect(getFormData()).toEqual({ a: 'later' });
    });

    it('on a programmatic validateForm()', () => {
      const { ref, getFormData } = renderInvalid();

      expect(() => act(() => handleOf(ref).validateForm())).toThrow('boom');
      expect(ref.current).not.toBeNull();
      act(() => handleOf(ref).setFieldValue('a', 'later'));
      expect(getFormData()).toEqual({ a: 'later' });
    });
  });
});

describe('a throwing callback a field reports from an Effect', () => {
  const boom = () => {
    throw new Error('boom');
  };

  it('fills a null property in on mount without calling onChange, so a throwing one is never reached', async () => {
    const onChange = vi.fn(boom);
    const ref = createFormRef();

    const rethrown = await rethrownFromTimers(async () => {
      render(
        <Boundary>
          <Form
            ref={ref}
            schema={{ type: 'object', properties: { n: { type: 'null' } } }}
            validator={validator}
            onChange={onChange}
          />
        </Boundary>,
      );
    });

    expect(handleOf(ref).getFormData()).toEqual({ n: null });
    expect(rethrown).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
    expect(document.querySelector('form')).toBeInTheDocument();
  });

  it("a widget's layout Effect change keeps a form given formData mounted", async () => {
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
            initialFormData={{}}
            onChange={boom}
          />
        </Boundary>,
      );
    });

    expect(rethrown).toEqual([new Error('boom')]);
    expect(screen.queryByText('Fallback')).toBeNull();
    expect(document.querySelector('form')).toBeInTheDocument();
  });

  it("a transformChange that throws on a widget's layout Effect change keeps the form mounted, and the data as it was", async () => {
    function ChangeOnMountWidget({ onChange }: WidgetProps) {
      useLayoutEffect(() => {
        onChange('mounted');
      }, [onChange]);
      return null;
    }
    const ref = createFormRef<Data>();
    const onChange = vi.fn();

    const rethrown = await rethrownFromTimers(async () => {
      render(
        <Boundary>
          <Form<Data>
            ref={ref}
            schema={schema}
            uiSchema={{ a: { 'ui:widget': ChangeOnMountWidget } }}
            validator={validator}
            initialFormData={{ a: 'seed' }}
            transformChange={boom}
            onChange={onChange}
          />
        </Boundary>,
      );
    });

    expect(rethrown).toEqual([new Error('boom')]);
    expect(screen.queryByText('Fallback')).toBeNull();
    expect(document.querySelector('form')).toBeInTheDocument();
    expect(handleOf(ref).getFormData()).toEqual({ a: 'seed' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("a customValidate that throws on a widget's layout Effect blur keeps the form mounted", async () => {
    function BlurOnMountWidget({ id, value, onBlur }: WidgetProps) {
      useLayoutEffect(() => {
        onBlur(id, value);
      }, [id, onBlur, value]);
      return null;
    }

    const rethrown = await rethrownFromTimers(async () => {
      render(
        <Boundary>
          <Form<Data>
            schema={schema}
            uiSchema={{ a: { 'ui:widget': BlurOnMountWidget } }}
            validator={validator}
            initialFormData={{ a: 'seed' }}
            liveValidate='onBlur'
            customValidate={boom}
          />
        </Boundary>,
      );
    });

    expect(rethrown).toEqual([new Error('boom')]);
    expect(screen.queryByText('Fallback')).toBeNull();
    expect(document.querySelector('form')).toBeInTheDocument();
  });
});
