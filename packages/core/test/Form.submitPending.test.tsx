import { Component, startTransition, useActionState, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import type { RJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useFormStatus } from 'react-dom';

import Form from '../src/index.ts';
import { createFormComponent, createFormRef, handleOf } from './testUtils.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string', title: 'Name' } } };

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

describe('a promise onSubmit returns', () => {
  it('disables the default submit button until the promise settles', async () => {
    const save = deferred();
    createFormComponent({ schema, initialFormData: { name: 'a' }, onSubmit: () => save.promise });
    const button = screen.getByRole('button', { name: 'Submit' });

    await user.click(button);

    expect(button).toBeDisabled();
    save.resolve(undefined);
    await waitFor(() => expect(button).toBeEnabled());
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

  it('leaves the submit button enabled for an onSubmit that returns nothing', async () => {
    const onSubmit = vi.fn();
    createFormComponent({ schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });

    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(button).toBeEnabled();
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
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('stays pending until every promise from a second submit settles too', async () => {
    const first = deferred();
    const second = deferred();
    const onSubmit = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const ref = createFormRef();
    createFormComponent({ ref, schema, initialFormData: { name: 'a' }, onSubmit });
    const button = screen.getByRole('button', { name: 'Submit' });

    act(() => handleOf(ref).submit());
    act(() => handleOf(ref).submit());
    first.resolve(undefined);
    await act(() => first.promise);

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(button).toBeDisabled();
    second.resolve(undefined);
    await waitFor(() => expect(button).toBeEnabled());
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

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    save.resolve(undefined);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());
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
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    save.resolve(undefined);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());
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
      expect(button).toBeDisabled();
      save.reject(rejection);

      await waitFor(() => expect(button).toBeEnabled());
      await waitFor(() => expect(unhandled).toEqual([rejection]));
      expect(screen.queryByText('caught')).not.toBeInTheDocument();
    });
  });
});

describe('a useActionState dispatch started from onSubmit', () => {
  it('receives the validated data, keeps the form pending while it runs and leaves the inputs as they are', async () => {
    const save = deferred();
    const received: unknown[] = [];
    function StatusButton() {
      const { pending } = useFormStatus();
      return (
        <button type='submit' disabled={pending}>
          Send
        </button>
      );
    }
    function Parent() {
      const [saves, dispatch, isPending] = useActionState(async (previous: number, formData: unknown) => {
        received.push(formData);
        await save.promise;
        return previous + 1;
      }, 0);
      return (
        <>
          <output aria-label='saves'>{`${saves}${isPending ? ' pending' : ''}`}</output>
          <Form
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
