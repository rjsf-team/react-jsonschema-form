import { Component, startTransition, useActionState, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import type { RJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useFormStatus } from 'react-dom';

import Form from '../src/index.ts';
import { createFormComponent, createFormRef, handleOf } from './testUtils.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string', title: 'Name' } } };

interface Person {
  name?: string;
}

// React entangles every ongoing async transition, so one a failed test left unsettled would hold the next test's
// transitions too
const unsettled: PromiseWithResolvers<undefined>[] = [];
function deferred() {
  const save = Promise.withResolvers<undefined>();
  unsettled.push(save);
  return save;
}
afterEach(() => {
  for (const save of unsettled.splice(0)) {
    save.resolve(undefined);
  }
});

/** Pending marks the button `aria-disabled` and leaves it enabled, so it keeps focus */
function expectPending(button: HTMLElement) {
  expect(button).toHaveAttribute('aria-disabled', 'true');
  expect(button).toBeEnabled();
}

function expectIdle(button: HTMLElement) {
  expect(button).not.toHaveAttribute('aria-disabled');
  expect(button).toBeEnabled();
}

describe('a promise onSubmit returns', () => {
  it('marks the default submit button aria-disabled, rather than disabled, until the promise settles', async () => {
    const save = deferred();
    createFormComponent({ schema, initialFormData: { name: 'a' }, onSubmit: () => save.promise });
    const button = screen.getByRole('button', { name: 'Submit' });

    await user.click(button);

    expectPending(button);
    save.resolve(undefined);
    await waitFor(() => expectIdle(button));
  });

  it('keeps focus on the submit button a keyboard user submitted with', async () => {
    const save = deferred();
    const onSubmit = vi.fn(() => save.promise);
    createFormComponent({ schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });
    await user.tab();
    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expectPending(button);
    expect(button).toHaveFocus();
    save.resolve(undefined);
    await waitFor(() => expectIdle(button));
    expect(button).toHaveFocus();
  });

  it('ignores another submit while the promise is pending, and takes one once it settles', async () => {
    const save = deferred();
    const onSubmit = vi.fn().mockReturnValueOnce(save.promise);
    createFormComponent({ schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });
    await user.click(button);

    await user.click(button);
    await user.type(screen.getByRole('textbox', { name: 'Name' }), '{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    save.resolve(undefined);
    await waitFor(() => expectIdle(button));
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('ignores another submit from a button the form is passed as children while the promise is pending', async () => {
    const save = deferred();
    const onSubmit = vi.fn(() => save.promise);
    createFormComponent({
      schema,
      initialFormData: { name: 'a' },
      onSubmit,
      children: <button type='submit'>Send</button>,
    });
    const button = screen.getByRole('button', { name: 'Send' });

    await user.click(button);
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('still calls an onClick the submit button options set while the promise is pending, and ignores the submit', async () => {
    const save = deferred();
    const onSubmit = vi.fn(() => save.promise);
    const onClick = vi.fn();
    createFormComponent({
      schema,
      uiSchema: { 'ui:submitButtonOptions': { props: { onClick } } },
      initialFormData: { name: 'a' },
      onSubmit,
    });
    const button = screen.getByRole('button', { name: 'Submit' });
    await user.click(button);

    await user.click(button);

    expectPending(button);
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onClick).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'click', target: button }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('cancels the click while the promise is pending though the onClick the submit button options set throws', async () => {
    const save = deferred();
    const onSubmit = vi.fn().mockReturnValueOnce(save.promise);
    const thrown = new Error('onClick failed');
    const onClick = vi
      .fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementation(() => {
        throw thrown;
      });
    createFormComponent({
      schema: { ...schema, required: ['name'] },
      uiSchema: { 'ui:submitButtonOptions': { props: { onClick } } },
      initialFormData: { name: 'a' },
      onSubmit,
    });
    const button = screen.getByRole('button', { name: 'Submit' });
    const input = screen.getByRole('textbox', { name: /Name/ });
    const onInvalid = vi.fn();
    input.addEventListener('invalid', onInvalid);
    const reported: unknown[] = [];
    // React reports a throw from an event handler to the window rather than to the code that dispatched the click
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      reported.push(event.error);
    };
    window.addEventListener('error', onError);
    try {
      await user.click(button);
      await user.clear(input);

      await user.click(button);
    } finally {
      window.removeEventListener('error', onError);
    }

    expect(reported).toEqual([thrown]);
    expect(onInvalid).not.toHaveBeenCalled();
    expect(input).not.toHaveFocus();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('passes pending to a custom SubmitButton template', async () => {
    const save = deferred();
    const seen: (boolean | undefined)[] = [];
    function RecordingSubmitButton({ pending }: SubmitButtonProps) {
      seen.push(pending);
      return <button type='submit'>Save</button>;
    }
    createFormComponent({
      schema,
      initialFormData: { name: 'a' },
      templates: { ButtonTemplates: { SubmitButton: RecordingSubmitButton } },
      onSubmit: () => save.promise,
    });
    expect(seen.at(-1)).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(seen.at(-1)).toBe(true);
    save.resolve(undefined);

    await waitFor(() => expect(seen.at(-1)).toBe(false));
  });

  it('marks a custom SubmitButton template that spreads the props its uiSchema gives the button aria-disabled', async () => {
    const save = deferred();
    function SpreadingSubmitButton({ uiSchema }: SubmitButtonProps) {
      const { props } = getSubmitButtonOptions(uiSchema);
      return (
        <button type='submit' {...props}>
          Save
        </button>
      );
    }
    createFormComponent({
      schema,
      initialFormData: { name: 'a' },
      templates: { ButtonTemplates: { SubmitButton: SpreadingSubmitButton } },
      onSubmit: () => save.promise,
    });
    const button = screen.getByRole('button', { name: 'Save' });

    await user.click(button);

    expectPending(button);
    save.resolve(undefined);
    await waitFor(() => expectIdle(button));
  });

  it('leaves a thenable that is not a promise alone, since calling its then() again can rerun a lazy request', async () => {
    const then = vi.fn();
    createFormComponent({ schema, initialFormData: { name: 'a' }, onSubmit: () => ({ then }) });
    const button = screen.getByRole('button', { name: 'Submit' });

    await user.click(button);

    expect(then).not.toHaveBeenCalled();
    expectIdle(button);
  });

  it('reads no enclosing form status when it renders as an element other than a form', async () => {
    const outerSave = deferred();
    function OuterStatus() {
      const { pending } = useFormStatus();
      return <output aria-label='outer'>{pending ? 'pending' : 'idle'}</output>;
    }
    render(
      <form
        action={async () => {
          await outerSave.promise;
        }}
      >
        <Form tagName='div' schema={schema} validator={validator} initialFormData={{ name: 'a' }} />
        <OuterStatus />
        <button type='submit'>Outer</button>
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Outer' }));

    expect(screen.getByRole('status', { name: 'outer' })).toHaveTextContent('pending');
    expectIdle(screen.getByRole('button', { name: 'Submit' }));
    outerSave.resolve(undefined);
    await waitFor(() => expect(screen.getByRole('status', { name: 'outer' })).toHaveTextContent('idle'));
  });

  it('leaves the submit button enabled for an onSubmit that returns nothing', async () => {
    const onSubmit = vi.fn();
    createFormComponent({ schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });

    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expectIdle(button);
  });

  it('holds no transition elsewhere in the app while the promise is pending', async () => {
    const save = deferred();
    function Parent() {
      const [tab, setTab] = useState('details');
      const [isSwitching, startSwitch] = useTransition();
      return (
        <>
          <button type='button' onClick={() => startSwitch(() => setTab('history'))}>
            History
          </button>
          <output aria-label='tab'>{`${tab}${isSwitching ? ' switching' : ''}`}</output>
          <Form schema={schema} validator={validator} initialFormData={{ name: 'a' }} onSubmit={() => save.promise} />
        </>
      );
    }
    render(<Parent />);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await user.click(screen.getByRole('button', { name: 'History' }));

    expect(screen.getByRole('status', { name: 'tab' })).toHaveTextContent(/^history$/);
    expectPending(screen.getByRole('button', { name: 'Submit' }));
  });

  it('ignores a second FormRef.submit() in the same handler, before the pending state renders', async () => {
    const save = deferred();
    const onSubmit = vi.fn(() => save.promise);
    const ref = createFormRef();
    createFormComponent({ ref, schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });

    act(() => {
      handleOf(ref).submit();
      handleOf(ref).submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expectPending(button);
    save.resolve(undefined);
    await waitFor(() => expectIdle(button));
  });

  it('leaves useFormStatus() idle in buttons the form is passed as children, which a transition onSubmit starts makes pending', async () => {
    const save = deferred();
    const plain = deferred();
    function StatusButton() {
      const { pending } = useFormStatus();
      return (
        <button type='submit' data-pending={String(pending)}>
          Send
        </button>
      );
    }
    const { rerender } = render(
      <Form schema={schema} validator={validator} initialFormData={{ name: 'a' }} onSubmit={() => plain.promise}>
        <StatusButton />
      </Form>,
    );
    const button = screen.getByRole('button', { name: 'Send' });
    await user.click(button);
    expect(button).toHaveAttribute('data-pending', 'false');
    plain.resolve(undefined);

    rerender(
      <Form
        schema={schema}
        validator={validator}
        initialFormData={{ name: 'a' }}
        onSubmit={() =>
          startTransition(async () => {
            await save.promise;
          })
        }
      >
        <StatusButton />
      </Form>,
    );
    await user.click(button);

    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).toBeEnabled();
    save.resolve(undefined);
    await waitFor(() => expect(button).toHaveAttribute('data-pending', 'false'));
  });

  it('is pending for a submit through FormRef.submit() while the inputs show the data', async () => {
    const save = deferred();
    const ref = createFormRef();
    createFormComponent({ ref, schema, initialFormData: { name: 'a' }, onSubmit: () => save.promise });

    act(() => handleOf(ref).submit());

    expectPending(screen.getByRole('button', { name: 'Submit' }));
    save.resolve(undefined);
    await waitFor(() => expectIdle(screen.getByRole('button', { name: 'Submit' })));
  });

  it('is pending for a submit through FormRef.submit() of an edit the inputs have yet to show', async () => {
    const save = deferred();
    const ref = createFormRef();
    const onSubmit = vi.fn(() => save.promise);
    createFormComponent({ ref, schema, initialFormData: { name: 'a' }, onSubmit });

    act(() => {
      handleOf(ref).setFieldValue('name', 'b');
      handleOf(ref).submit();
    });

    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { name: 'b' } }), expect.anything());
    expectPending(screen.getByRole('button', { name: 'Submit' }));
    save.resolve(undefined);
    await waitFor(() => expectIdle(screen.getByRole('button', { name: 'Submit' })));
  });

  it('takes a submit again after FormRef.reset(), and keeps the later submit pending when the earlier promise settles', async () => {
    const hung = deferred();
    const save = deferred();
    const onSubmit = vi.fn().mockReturnValueOnce(hung.promise).mockReturnValueOnce(save.promise);
    const ref = createFormRef();
    createFormComponent({ ref, schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });
    await user.click(button);

    act(() => handleOf(ref).reset());

    expectIdle(button);
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expectPending(button);
    await act(async () => hung.resolve(undefined));
    expectPending(button);
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(2);
    save.resolve(undefined);
    await waitFor(() => expectIdle(button));
  });

  it('ignores a FormRef.submit() that onSubmit makes before it returns its promise', async () => {
    const save = deferred();
    const ref = createFormRef();
    const onSubmit = vi
      .fn()
      .mockImplementationOnce(() => {
        handleOf(ref).submit();
        return save.promise;
      })
      .mockReturnValue(undefined);
    createFormComponent({ ref, schema, initialFormData: { name: 'a' }, onSubmit });

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps a submit onSubmit starts after a FormRef.reset() pending once onSubmit returns', async () => {
    const save = deferred();
    const ref = createFormRef();
    const onSubmit = vi
      .fn()
      .mockImplementationOnce(() => {
        handleOf(ref).reset();
        handleOf(ref).submit();
      })
      .mockReturnValueOnce(save.promise);
    createFormComponent({ ref, schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(2);

    act(() => handleOf(ref).submit());

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expectPending(button);
    save.resolve(undefined);
    await waitFor(() => expectIdle(button));
  });

  it('keeps the submit onSubmit starts after a FormRef.reset() pending until its own promise settles', async () => {
    const outer = deferred();
    const inner = deferred();
    const ref = createFormRef();
    const onSubmit = vi
      .fn()
      .mockImplementationOnce(() => {
        handleOf(ref).reset();
        handleOf(ref).submit();
        return outer.promise;
      })
      .mockReturnValueOnce(inner.promise);
    createFormComponent({ ref, schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(2);

    await act(async () => outer.resolve(undefined));

    expectPending(button);
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(2);
    inner.resolve(undefined);
    await waitFor(() => expectIdle(button));
  });

  it('takes a submit again once onSubmit calls FormRef.reset() before it returns its promise', async () => {
    const save = deferred();
    const ref = createFormRef();
    const onSubmit = vi
      .fn()
      .mockImplementationOnce(() => {
        handleOf(ref).reset();
        return save.promise;
      })
      .mockReturnValue(undefined);
    createFormComponent({ ref, schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });

    await user.click(button);

    expectIdle(button);
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('runs no constraint validation for a submit it ignores, from the submit button, Enter or FormRef.submit()', async () => {
    const save = deferred();
    const onSubmit = vi.fn().mockReturnValueOnce(save.promise);
    const ref = createFormRef();
    createFormComponent({
      ref,
      schema: { ...schema, required: ['name'] },
      initialFormData: { name: 'a' },
      onSubmit,
    });
    const button = screen.getByRole('button', { name: 'Submit' });
    const input = screen.getByRole('textbox', { name: /Name/ });
    const onInvalid = vi.fn();
    input.addEventListener('invalid', onInvalid);
    await user.click(button);
    await user.clear(input);

    await user.click(button);
    await user.type(input, '{Enter}');
    act(() => handleOf(ref).submit());

    expect(onInvalid).not.toHaveBeenCalled();
    save.resolve(undefined);
    await waitFor(() => expectIdle(button));
    await user.click(button);
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  describe('that rejects', () => {
    const unhandled: unknown[] = [];
    const recordUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    beforeEach(() => {
      unhandled.length = 0;
      process.on('unhandledRejection', recordUnhandled);
    });
    afterEach(() => {
      process.off('unhandledRejection', recordUnhandled);
    });

    it('clears pending and reports the rejection as unhandled, without reaching an Error Boundary', async () => {
      const save = deferred();
      const rejection = new Error('save failed');
      class Boundary extends Component<{ children: ReactNode }, { caught?: unknown }> {
        constructor(props: { children: ReactNode }) {
          super(props);
          this.state = {};
        }
        static getDerivedStateFromError(caught: unknown) {
          return { caught };
        }
        render() {
          return this.state.caught ? <p>caught</p> : this.props.children;
        }
      }
      render(
        <Boundary>
          <Form
            schema={schema}
            validator={validator}
            initialFormData={{ name: 'a' }}
            onSubmit={async () => save.promise}
          />
        </Boundary>,
      );
      const button = screen.getByRole('button', { name: 'Submit' });

      await user.click(button);
      expectPending(button);
      save.reject(rejection);

      await waitFor(() => expectIdle(button));
      await waitFor(() => expect(unhandled).toEqual([rejection]));
      expect(screen.queryByText('caught')).not.toBeInTheDocument();
    });
  });
});

describe('a useActionState dispatch started from onSubmit', () => {
  it('takes no click on the default submit button while the action runs', async () => {
    const save = deferred();
    const onSubmit = vi.fn();
    function Parent() {
      const [, dispatch] = useActionState(async (previous: number) => {
        await save.promise;
        return previous + 1;
      }, 0);
      return (
        <Form
          schema={schema}
          validator={validator}
          initialFormData={{ name: 'a' }}
          onSubmit={() => {
            onSubmit();
            startTransition(() => dispatch());
          }}
        />
      );
    }
    render(<Parent />);
    const button = screen.getByRole('button', { name: 'Submit' });
    await user.click(button);

    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expectPending(button);
    save.resolve(undefined);
    await waitFor(() => expectIdle(button));
  });

  it('receives the validated data, keeps the form pending while it runs and leaves the inputs as they are', async () => {
    const save = deferred();
    const received: Person[] = [];
    function StatusButton() {
      const { pending } = useFormStatus();
      return (
        <button type='submit' disabled={pending}>
          Send
        </button>
      );
    }
    function Parent() {
      const [saves, dispatch, isPending] = useActionState(async (previous: number, formData: Person) => {
        received.push(formData);
        await save.promise;
        return previous + 1;
      }, 0);
      return (
        <>
          <output aria-label='saves'>{`${saves}${isPending ? ' pending' : ''}`}</output>
          <Form<Person>
            schema={schema}
            validator={validator}
            initialFormData={{ name: 'a' }}
            onSubmit={({ formData }) => startTransition(() => dispatch(formData))}
          >
            <StatusButton />
          </Form>
        </>
      );
    }
    render(<Parent />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    await user.type(input, 'b');

    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(received).toEqual([{ name: 'ab' }]);
    expect(screen.getByRole('status', { name: 'saves' })).toHaveTextContent('0 pending');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    save.resolve(undefined);
    await waitFor(() => expect(screen.getByRole('status', { name: 'saves' })).toHaveTextContent(/^1$/));
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    expect(input).toHaveValue('ab');
  });
});
