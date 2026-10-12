import { Component, StrictMode, Suspense, use, useEffect, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ErrorSchema, FieldProps, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { createSchemaUtils, deepEquals, getTemplates, getUiOptions, noop } from '@rjsf/utils';
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
  describeOwnerships,
  fieldErrorsById,
  handleOf,
  input,
  RejectingParent,
  renderInActivity,
  reportedBy,
  setupConsoleWarnSuppression,
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

/** The ownership contract (RFC, section 6): a form with a `formData` prop renders the parent's value and only ever
 * proposes; one without owns its value. A `vi.fn()` `onChange` is a rejecting parent.
 */
describe('form data ownership', () => {
  const warnings = setupConsoleWarnSuppression();

  describe('fixed controlled data', () => {
    it('an edit is proposed but does not change the rendered data without acceptance', async () => {
      const log = createParentLog<Data>();
      const { container } = render(<RejectingParent<Data> schema={schema} initialValue={{ a: 'a' }} log={log} />);

      await user.click(input(container, 'root_a'));
      await user.paste('b');

      expect(log.proposals).toEqual([{ a: 'ab' }]);
      expect(input(container, 'root_a')).toHaveValue('a');
    });

    it('a spy handler is a rejecting parent, so the form keeps rendering the prop', async () => {
      const { node, onChange } = createFormComponent({ schema, formData: { a: 'a' } });

      await user.click(node.querySelector('#root_a')!);
      await user.paste('b');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'ab' });
      expect(node.querySelector('#root_a')).toHaveValue('a');
    });
  });

  describe('accepted and transformed updates', () => {
    it('an accepting parent renders each proposal with exactly one callback per edit', async () => {
      const log = createParentLog<Data>();
      const { container } = render(<AcceptingParent<Data> schema={schema} initialValue={{ a: '' }} log={log} />);

      await user.type(input(container, 'root_a'), 'abc');

      expect(log.proposals.map((proposal) => proposal?.a)).toEqual(['a', 'ab', 'abc']);
      expect(input(container, 'root_a')).toHaveValue('abc');
    });

    it("a transforming parent's value wins and its acceptance causes no echo callback", async () => {
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

  describe('external replacement', () => {
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

    it('renders the new prop at once, with no stale-data commit in between', () => {
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
  });

  describe('controlled reset', () => {
    const withDefault: RJSFSchema = {
      type: 'object',
      required: ['a'],
      properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string', default: 'defaulted' } },
    };

    it('clears local errors, keeps the loaded data, computes no defaults and calls no onChange', async () => {
      const ref = createFormRef();
      const onChange = vi.fn();
      const { container } = render(
        <Form ref={ref} schema={withDefault} validator={validator} formData={{ a: 'x' }} onChange={onChange} />,
      );
      await act(async () => {
        ref.current!.validateForm();
      });
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(1);

      act(() => {
        ref.current!.reset();
      });

      expect(container.querySelectorAll('.error-detail li')).toHaveLength(0);
      expect(input(container, 'root_a')).toHaveValue('x');
      expect(input(container, 'root_b')).toHaveValue('');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the parent-supplied extraErrors', () => {
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

    it('lets the parent replace the data and clear local errors in one step without an old-value echo', async () => {
      const ref = createFormRef<Data>();
      const proposals: unknown[] = [];
      function Parent() {
        const [data, setData] = useState<Data>({ a: 'x' });
        return (
          <>
            <button
              type='button'
              onClick={() => {
                setData({ a: 'replaced' });
                ref.current!.reset();
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
                proposals.push(event.formData);
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
      expect(proposals).toEqual([]);
    });
  });

  describe('no controlled defaults', () => {
    const withDefaults: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'A' }, b: { type: 'string', default: 'B' } },
    };

    it('mount, a semantic schema change and a data-only replacement emit no onChange, in StrictMode too', () => {
      const onChange = vi.fn();
      function Parent({ schema: current, value }: { schema: RJSFSchema; value: Data }) {
        return (
          <StrictMode>
            <Form schema={current} validator={validator} formData={value} onChange={onChange} />
          </StrictMode>
        );
      }
      const { rerender, container } = render(<Parent schema={withDefaults} value={{}} />);
      expect(input(container, 'root_a')).toHaveValue('');

      rerender(<Parent schema={{ ...withDefaults, title: 'changed' }} value={{}} />);
      rerender(<Parent schema={{ ...withDefaults, title: 'changed' }} value={{ a: 'given' }} />);

      expect(onChange).not.toHaveBeenCalled();
      expect(input(container, 'root_a')).toHaveValue('given');
      expect(input(container, 'root_b')).toHaveValue('');
    });

    it('a parent seeded with getDefaultFormState renders the defaults on the first render', () => {
      const onChange = vi.fn();
      const seeded = createSchemaUtils({ validator }, withDefaults).getDefaultFormState(withDefaults, {
        a: 'given',
      });
      const { container } = render(
        <Form schema={withDefaults} validator={validator} formData={seeded} onChange={onChange} />,
      );

      expect(input(container, 'root_a')).toHaveValue('given');
      expect(input(container, 'root_b')).toHaveValue('B');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('a controlled root that becomes undefined stays controlled and does not warn', () => {
      const onChange = vi.fn();
      function Parent({ value }: { value: Data | undefined }) {
        return <Form schema={withDefaults} validator={validator} formData={value} onChange={onChange} />;
      }
      const { rerender, container } = render(<Parent value={{ a: 'x' }} />);

      rerender(<Parent value={undefined} />);

      expect(input(container, 'root_a')).toHaveValue('');
      expect(onChange).not.toHaveBeenCalled();
      expect(warnings.consoleSpy).not.toHaveBeenCalled();

      rerender(<Parent value={{ a: 'y' }} />);

      expect(input(container, 'root_a')).toHaveValue('y');
    });

    it('a null root at mount is controlled: a field edit proposes the object it creates, defaults included', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <Form schema={withDefaults} validator={validator} formData={null} onChange={onChange} />,
      );
      expect(input(container, 'root_a')).toHaveValue('');

      await user.click(input(container, 'root_a'));
      await user.paste('x');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'x', b: 'B' });
      expect(input(container, 'root_a')).toHaveValue('');
      expect(warnings.consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('controlled composition', () => {
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

      // The second change builds on the first proposal, which React has not rendered yet
      expect(log.proposals).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'second' },
      ]);
      expect(log.value).toEqual({ a: 'first', b: 'second' });
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('second');
    });

    it('a root replacement writes several fields in one proposal', async () => {
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

    it("a second change in one tick builds on the first proposal as proposed, not as the parent's transform", async () => {
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

    it('a parent that rejects a proposal sees it again in a later proposal of the same tick', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      render(<PolicyParent ref={ref} log={log} accept={(proposal) => proposal.a !== 'first'} />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'first');
        ref.current!.setFieldValue('b', 'second');
      });

      // The form cannot know the parent's answer before it renders, so the second proposal still carries the first
      // edit, and the parent's rule refuses it too
      expect(log.proposals).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'second' },
      ]);
      expect(log.value).toEqual({ a: '', b: '' });
    });

    it.each([false, true])(
      'a proposal the parent refused is dropped at the next render of the form (StrictMode: %s)',
      async (reactStrictMode) => {
        const ref = createFormRef<Data>();
        const log = createParentLog<Data>();
        render(<PolicyParent ref={ref} log={log} accept={(proposal) => proposal.a !== 'first'} />, {
          reactStrictMode,
        });

        await act(async () => {
          handleOf(ref).setFieldValue('a', 'first');
        });
        await act(async () => {
          handleOf(ref).setFieldValue('b', 'second');
        });

        expect(log.proposals).toEqual([
          { a: 'first', b: '' },
          { a: '', b: 'second' },
        ]);
        expect(log.value).toEqual({ a: '', b: 'second' });
      },
    );

    it('a proposal made while hidden by Activity lasts until the form is shown and renders', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { hide, show } = renderInActivity(() => (
        <PolicyParent ref={ref} log={log} accept={(proposal) => proposal.a !== 'first'} />
      ));
      const handle = handleOf(ref);
      hide();

      await act(async () => {
        handle.setFieldValue('a', 'first');
      });
      await act(async () => {
        handle.setFieldValue('b', 'second');
      });

      // The parent is told only once the form is shown, so the hidden form cannot have its answer yet
      expect(log.proposals).toEqual([]);

      show();
      await act(async () => {
        handle.setFieldValue('b', 'third');
      });

      expect(log.proposals).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'second' },
        { a: '', b: 'third' },
      ]);
      expect(log.value).toEqual({ a: '', b: 'third' });
    });

    it('a proposal made while hidden by Activity lasts through a render of the hidden form', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const { hide, show } = renderInActivity(() => <PolicyParent ref={ref} log={log} />);
      const handle = handleOf(ref);
      hide();

      await act(async () => {
        handle.setFieldValue('a', 'first');
      });
      // The parent renders the hidden form again, having heard nothing of the proposal yet
      hide();
      await act(async () => {
        handle.setFieldValue('b', 'second');
      });
      show();

      expect(log.value).toEqual({ a: 'first', b: 'second' });
    });

    it('a proposal made while hidden by Activity is dropped once a parent that was told of it keeps to its value', async () => {
      const ref = createFormRef<Data>();
      const log = createParentLog<Data>();
      const parent = (idPrefix: string) => (
        <RejectingParent<Data>
          ref={ref}
          idPrefix={idPrefix}
          schema={schema}
          initialValue={{ a: '', b: '' }}
          log={log}
        />
      );
      const { hide, show } = renderInActivity((element: ReactNode) => element, parent('mounted'));
      // Rendered once more, as most forms have been by the time they are hidden. The same element from then on, so
      // neither showing the form nor the refusal renders it
      const rendered = parent('rendered');
      show(rendered);
      const handle = handleOf(ref);
      hide(rendered);

      await act(async () => {
        handle.setFieldValue('a', 'first');
      });
      show(rendered);
      await act(async () => {
        handle.setFieldValue('b', 'second');
      });

      expect(log.proposals).toEqual([
        { a: 'first', b: '' },
        { a: '', b: 'second' },
      ]);
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
      'an edit from a passive Effect builds on one a layout Effect proposed in the same commit (StrictMode: %s)',
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

        // The form commits between the two edits, before its parent has rendered an answer to the first
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

    it('an edit made as a hidden form is shown builds on a proposal made while it was hidden', () => {
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

      // The parent is told of the first edit as the form is shown, and has not rendered its answer when the second is made
      expect(log.value).toEqual({ a: 'hidden', b: 'shown' });
    });

    it('a setFieldValue from inside onChange builds on the proposal being handled', async () => {
      const ref = createFormRef<Data>();
      const proposals: Data[] = [];
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
              proposals.push(proposal);
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

      expect(proposals).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'derived' },
      ]);
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('derived');
    });

    it('a parent adds a derived field to the proposal it stores instead of calling setFieldValue', async () => {
      const ref = createFormRef<Data>();
      const proposals: Data[] = [];
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
              proposals.push(proposal);
              setData(proposal.a === 'first' ? { ...proposal, b: 'derived' } : proposal);
            }}
          />
        );
      }
      const { container } = render(<ComposingOnChangeParent />);

      await act(async () => {
        handleOf(ref).setFieldValue('a', 'first');
      });

      expect(proposals).toEqual([{ a: 'first', b: '' }]);
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('derived');
    });

    it('the queue advances past a rejected proposal and a missing handler', async () => {
      const ref = createFormRef();
      const { rerender } = render(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} />);
      await act(async () => {
        ref.current!.setFieldValue('a', 'x');
        ref.current!.setFieldValue('b', 'y');
      });
      const onChange = vi.fn();
      rerender(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} onChange={onChange} />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'z');
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'z' });
    });

    it('every operation in one tick calls onChange with its own proposal', async () => {
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

  describe('self-owned forms', () => {
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

    it('keeps its data across an unrelated prop change and a later formData prop', async () => {
      const { node, rerender } = createFormComponent({ schema, initialFormData: { a: 'own' } });
      await user.clear(node.querySelector('#root_a')!);
      await user.paste('edited');

      rerender({ schema, initialFormData: { a: 'own' }, className: 'other' });
      expect(node.querySelector('#root_a')).toHaveValue('edited');
      rerender({ schema, formData: { a: 'late' } });

      expect(node.querySelector('#root_a')).toHaveValue('edited');
      expect(warnings.consoleSpy).toHaveBeenCalledTimes(1);
      expect(warnings.consoleSpy.mock.calls[0][0]).toContain('mounted without it');
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

  describe('development diagnostics', () => {
    it('warns once when both data props are set and ignores the initial data', () => {
      const { node } = createFormComponent({ schema, formData: { a: 'owned' }, initialFormData: { a: 'seed' } });

      expect(node.querySelector('#root_a')).toHaveValue('owned');
      expect(warnings.consoleSpy).toHaveBeenCalledTimes(1);
      expect(warnings.consoleSpy.mock.calls[0][0]).toContain('`initialFormData` is ignored');
    });

    it('warns about a controlled mount without onChange unless the form is readonly or disabled', () => {
      render(<Form schema={schema} validator={validator} formData={{ a: 'x' }} />);
      expect(warnings.consoleSpy).toHaveBeenCalledTimes(1);
      expect(warnings.consoleSpy.mock.calls[0][0]).toContain('without an `onChange` handler');

      warnings.consoleSpy.mockClear();
      render(<Form schema={schema} validator={validator} formData={{ a: 'x' }} readonly />);
      render(<Form schema={schema} validator={validator} formData={{ a: 'x' }} disabled />);
      render(<Form schema={schema} validator={validator} formData={{ a: 'x' }} onChange={noop} />);
      expect(warnings.consoleSpy).not.toHaveBeenCalled();
    });

    it('logs no warning for a mount that never commits', () => {
      const never = new Promise<void>(() => {});
      function SuspendingWidget() {
        use(never);
        return null;
      }
      render(
        <Suspense fallback='Loading'>
          <Form
            schema={schema}
            validator={validator}
            formData={{ a: 'x' }}
            widgets={{ TextWidget: SuspendingWidget }}
          />
        </Suspense>,
      );

      // A warning is a side effect, and a render React throws away has none
      expect(warnings.consoleSpy).not.toHaveBeenCalled();
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

    it('freezes the data a self-owned form commits', async () => {
      const ref = createFormRef();
      const { node } = createFormComponent({ ref, schema, initialFormData: { a: '' } });

      await user.click(node.querySelector('#root_a')!);
      await user.paste('x');

      expect(Object.isFrozen(ref.current!.getFormData())).toBe(true);
    });
  });

  describe('asynchronously loaded data', () => {
    it('pattern 1: mounting once the record is there, keyed by the record, switches records by remounting', () => {
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
      rerender(<Parent id='2' record={{ a: 'two' }} />);

      expect(input(container, 'root_a')).toHaveValue('two');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('pattern 2: a complete fallback value keeps the form controlled until the record arrives', () => {
      function Parent({ record }: { record?: Data }) {
        return <Form schema={schema} validator={validator} formData={record ?? {}} onChange={noop} />;
      }
      const { rerender, container } = render(<Parent />);
      expect(input(container, 'root_a')).toHaveValue('');

      rerender(<Parent record={{ a: 'loaded' }} />);

      expect(input(container, 'root_a')).toHaveValue('loaded');
      expect(warnings.consoleSpy).not.toHaveBeenCalled();
    });

    it('the broken version mounts self-owned, ignores the record and warns', () => {
      function Parent({ record }: { record?: Data }) {
        return <Form schema={schema} validator={validator} formData={record} onChange={noop} />;
      }
      const { rerender, container } = render(<Parent />);

      rerender(<Parent record={{ a: 'loaded' }} />);

      expect(input(container, 'root_a')).toHaveValue('');
      expect(warnings.consoleSpy).toHaveBeenCalledTimes(1);
      expect(warnings.consoleSpy.mock.calls[0][0]).toContain('mounted without it');
    });
  });

  describe('nested fields under a declined proposal', () => {
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

    it('a oneOf selector goes back to the option the data fits when the switch is declined', async () => {
      const log = createParentLog<{ status: { by: string } }>();
      const { container } = render(
        <RejectingParent schema={oneOfSchema} initialValue={{ status: { by: 'me' } }} log={log} />,
      );
      const select = container.querySelector<HTMLSelectElement>('#root_status__oneof_select')!;

      await user.selectOptions(select, '1');

      expect(log.proposals).toHaveLength(1);
      expect(select).toHaveValue('0');
      expect(input(container, 'root_status_by')).toHaveValue('me');
    });

    it('a oneOf selector keeps an explicit choice the data still fits when the switch is declined', async () => {
      const ambiguous: RJSFSchema = {
        type: 'object',
        properties: {
          status: {
            type: 'object',
            oneOf: [
              { title: 'A', type: 'object' },
              { title: 'B', type: 'object' },
            ],
          },
        },
      };
      const { container } = render(<RejectingParent schema={ambiguous} initialValue={{ status: {} }} />);
      const select = container.querySelector<HTMLSelectElement>('#root_status__oneof_select')!;

      await user.selectOptions(select, '1');

      expect(select).toHaveValue('1');
    });

    it('a self-owned oneOf switch that leaves the data unchanged keeps the chosen option the data does not fit yet', async () => {
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

    it('an array add or remove the parent declines leaves no optimistic item behind', async () => {
      const arraySchema: RJSFSchema = { type: 'array', items: { type: 'string' } };
      const log = createParentLog<string[]>();
      const { container } = render(<RejectingParent schema={arraySchema} initialValue={['one', 'two']} log={log} />);

      await user.click(container.querySelector('.rjsf-array-item-add button')!);
      expect(log.proposals).toEqual([['one', 'two', undefined]]);
      expect(container.querySelectorAll('input[type=text]')).toHaveLength(2);

      await user.click(container.querySelector('.rjsf-array-item-remove')!);
      expect(log.proposals.at(-1)).toEqual(['two']);
      expect([...container.querySelectorAll<HTMLInputElement>('input[type=text]')].map((el) => el.value)).toEqual([
        'one',
        'two',
      ]);
    });

    it('an additional property whose rename the parent declines keeps rendering under its old key', async () => {
      const objectSchema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
      const log = createParentLog<Record<string, string>>();
      const { container } = render(
        <RejectingParent schema={objectSchema} initialValue={{ first: 'one', second: 'two' }} log={log} />,
      );
      const keyInput = container.querySelector<HTMLInputElement>('#root_first-key')!;

      await user.clear(keyInput);
      await user.type(keyInput, 'renamed');
      await user.tab();

      expect(log.proposals.at(-1)).toEqual({ renamed: 'one', second: 'two' });
      expect(container.querySelector('#root_first')).toHaveValue('one');
      expect(container.querySelector('#root_second')).toHaveValue('two');
      expect(container.querySelector('#root_renamed')).toBeNull();
    });

    it('an additional property the parent declined and then accepted when added again renders once', async () => {
      const objectSchema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
      let isAccepting = false;
      function LateAcceptingParent() {
        const [value, setValue] = useState<Record<string, string>>({});
        return (
          <Form
            schema={objectSchema}
            validator={validator}
            formData={value}
            onChange={(event) => {
              if (isAccepting) {
                setValue(event.formData);
              }
            }}
          />
        );
      }
      const { container } = render(<LateAcceptingParent />);
      const addButton = () => container.querySelector('.rjsf-object-property-expand button')!;

      await user.click(addButton());
      isAccepting = true;
      await user.click(addButton());

      expect(container.querySelectorAll('#root_newKey')).toHaveLength(1);
    });
  });

  describe('reading and submitting the owner', () => {
    it('getFormData() returns the formData prop of a controlled form and the committed data of a self-owned one', async () => {
      const controlled = createFormRef();
      const value = { a: 'parent' };
      render(<Form ref={controlled} schema={schema} validator={validator} formData={value} onChange={noop} />);
      expect(controlled.current!.getFormData()).toBe(value);

      const owned = createFormRef();
      const { node } = createFormComponent({ ref: owned, schema, initialFormData: { a: 'seed' } });
      await user.clear(node.querySelector('#root_a')!);
      await user.paste('edited');
      expect(owned.current!.getFormData()).toEqual({ a: 'edited' });
    });

    it('a controlled submit with omitExtraData submits the omitted copy without installing it', async () => {
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
      expect(ref.current!.getFormData()).toEqual({ a: 'x', extra: 'gone' });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('errors the form owns under a parent', () => {
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
        <RejectingParent
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
        <RejectingParent
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

    it('a parent-owned blur in the same tick as an edit validates the edit', async () => {
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

    it('a parent-owned blur validation keeps a value its onBlur set', async () => {
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

    it('a self-owned blur in the same handler validates the changed model data', async () => {
      const { node, onChange, getFormData } = createFormComponent({
        schema: minLengthSchema,
        uiSchema: { foo: { 'ui:widget': ChangeThenBlurWidget } },
        initialFormData: { foo: 'a' },
        liveValidate: 'onBlur',
      });

      await user.click(screen.getByRole('button', { name: 'commit' }));

      // The blur sees the changed model data; no invalid old-value notification is emitted.
      expect(onChange.mock.calls).toEqual([
        [expect.objectContaining({ formData: { foo: 'abcdef' }, errors: [] }), 'root_foo'],
      ]);
      expect(getFormData()).toEqual({ foo: 'abcdef' });
      expect(fieldErrorsById(node)).toEqual({});
    });
  });
});

describeOwnerships('operations in one tick', (createFormComponent, isControlled) => {
  it('a same-tick submit reads current model data or committed parent data', () => {
    const ref = createFormRef();
    const { onSubmit, getFormData } = createFormComponent({ ref, schema, initialFormData: { a: 'old' } });

    act(() => {
      ref.current!.setFieldValue('a', 'new');
      ref.current!.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: isControlled ? 'old' : 'new' });
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

describe('operations in one tick on a self-owned form', () => {
  it('an invalid submit in the same tick as an edit reports the edited data', () => {
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

  it('a submit in the same tick as an edit submits it once the inputs show it', () => {
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

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'x' });
  });

  it('a submit in the same tick as an edit is still blocked by native validation of data that is invalid', () => {
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

  it.each(['useEffect', 'useLayoutEffect'] as const)(
    'a submit after an edit from a consumer %s waits for the commit that renders the edit',
    async (hook) => {
      const ref = createFormRef<Data>();
      const onSubmit = vi.fn();
      const useCommitEffect = hook === 'useEffect' ? useEffect : useLayoutEffect;
      function Consumer() {
        const [isSaving, setIsSaving] = useState(false);
        useCommitEffect(() => {
          if (isSaving) {
            handleOf(ref).setFieldValue('a', 'x');
            handleOf(ref).submit();
          }
        }, [isSaving]);
        return (
          <>
            <Form<Data>
              ref={ref}
              schema={{ ...schema, required: ['a'] }}
              validator={validator}
              initialFormData={{}}
              onSubmit={onSubmit}
            >
              <span />
            </Form>
            <button type='button' onClick={() => setIsSaving(true)}>
              Save
            </button>
          </>
        );
      }
      render(<Consumer />);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'x' });
    },
  );
});

/** A throw from a callback propagates to the caller of the handle method that called it, to `window`, where React
 * reports it, for a submit event, and from a timer for a field's change, blur or focus, which a field can report from an
 * Effect. None of them unmounts the form.
 */
describe('a throwing callback on a self-owned form', () => {
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

  it("a NullField's mount change keeps a self-owned form mounted", async () => {
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

  it("a widget's layout Effect change keeps a parent-owned form mounted", async () => {
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
