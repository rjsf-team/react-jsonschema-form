import type { ReactNode } from 'react';
import { Component, StrictMode, startTransition, useLayoutEffect, useRef, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { flushSync } from 'react-dom';

import { collectDeferredThrows } from '../../../testing/deferredThrows.ts';
import DateTimeWidget from '../src/widgets/DateTimeWidget/DateTimeWidget.tsx';
import DateWidget from '../src/widgets/DateWidget/DateWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

function triggerIn(container: HTMLElement) {
  const trigger = container.querySelector('button[aria-haspopup]');
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error('No picker trigger rendered');
  }
  return trigger;
}

/** A field that takes focus in the commit that mounts it, as a dialog or an `autoFocus` input does */
function SelfFocusing() {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    ref.current?.focus();
  }, []);
  return <input ref={ref} aria-label='Revealed' />;
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

describe.each([
  ['date', DateWidget, 'date', '2020-05-03', '2020-05-17'],
  ['date-time', DateTimeWidget, 'iso-date-time', '2020-05-03T10:30:00', '2020-05-17T10:30:00'],
] as const)('%s close-path blur', (_, Widget, format, initial, proposal) => {
  describe.each(['Done', 'Escape', 'outside', 'trigger'] as const)('closing with %s', (action) => {
    test.each(['accept', 'transform', 'reject'] as const)('reports the %s parent value on close', async (mode) => {
      const transformed = proposal.replace('-17', '-20');
      const onBlur = vi.fn();
      const onChange = vi.fn();
      function Parent() {
        const [value, setValue] = useState<string>(initial);
        return (
          <>
            <Widget
              {...makeWidgetMockProps({
                id: 'date',
                value,
                autofocus: false,
                schema: { type: 'string', format },
                onBlur,
                onChange: (next: string) => {
                  onChange(next);
                  if (mode !== 'reject') {
                    setValue(mode === 'transform' ? transformed : next);
                  }
                },
              })}
            />
            <input aria-label='Elsewhere' />
          </>
        );
      }
      const { container } = render(
        <StrictMode>
          <Parent />
        </StrictMode>,
      );
      const trigger = triggerIn(container);
      await user.click(trigger);
      await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
      expect(onChange).not.toHaveBeenCalled();
      expect(onBlur).not.toHaveBeenCalled();
      const saved = { accept: proposal, transform: transformed, reject: initial }[mode];
      const expected = action === 'Escape' ? initial : saved;
      if (action === 'outside') {
        await user.pointer({ keys: '[MouseLeft>]', target: screen.getByLabelText('Elsewhere') });
        // Released even when the assertion fails: `user` is shared, and a held button would leak into the next test
        try {
          expect(onBlur).toHaveBeenCalledExactlyOnceWith('date', expected);
        } finally {
          await user.pointer({ keys: '[/MouseLeft]' });
        }
        expect(onBlur).toHaveBeenCalledTimes(1);
      } else {
        if (action === 'Escape') {
          await user.keyboard('{Escape}');
        } else {
          await user.click(action === 'Done' ? screen.getByText('Done') : trigger);
        }
        expect(onBlur).toHaveBeenCalledExactlyOnceWith('date', expected);
        expect(trigger).toHaveFocus();
        await user.tab();
        // Closing reports blur, and the trigger's own blur afterwards is a separate notification
        expect(onBlur).toHaveBeenCalledTimes(2);
        expect(onBlur).toHaveBeenLastCalledWith('date', expected);
      }
      if (action === 'Escape') {
        expect(onChange).not.toHaveBeenCalled();
      } else {
        expect(onChange).toHaveBeenCalledExactlyOnceWith(proposal);
        expect(onBlur.mock.invocationCallOrder[0]).toBeGreaterThan(onChange.mock.invocationCallOrder[0]);
      }
    });
  });

  test.each([
    ['hide', 'Done'],
    ['hide', 'outside'],
    ['remount', 'Done'],
    ['remount', 'outside'],
  ] as const)('keeps one notification when %s replaces the widget on %s', async (replacement, action) => {
    const onBlur = vi.fn();
    const onChange = vi.fn();
    function Parent() {
      const [value, setValue] = useState<string>(initial);
      const [visible, setVisible] = useState(true);
      return (
        <>
          {visible && (
            <Widget
              key={replacement === 'remount' ? value : 'date'}
              {...makeWidgetMockProps({
                id: 'date',
                value,
                autofocus: false,
                schema: { type: 'string', format },
                onBlur,
                onChange: (next: string) => {
                  onChange(next);
                  setValue(next);
                  if (replacement === 'hide') {
                    setVisible(false);
                  }
                },
              })}
            />
          )}
          <input aria-label='Outside' />
        </>
      );
    }
    const { container, unmount } = render(
      <StrictMode>
        <Parent />
      </StrictMode>,
    );
    await user.click(triggerIn(container));
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    expect(onChange).not.toHaveBeenCalled();
    if (action === 'Done') {
      await user.click(screen.getByText('Done'));
    } else {
      await user.click(screen.getByLabelText('Outside'));
    }
    expect(onChange.mock.calls).toEqual([[proposal]]);
    expect(onBlur.mock.calls).toEqual([['date', initial]]);
    if (replacement === 'hide') {
      expect(container.querySelector('button[aria-haspopup]')).toBeNull();
    } else {
      expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 17, 2020');
    }
    unmount();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test.each(['Done', 'Escape'] as const)(
    '%s reports blur before the focus it returned to the trigger',
    async (action) => {
      const events: string[] = [];
      const focusedAtBlur: (Element | null)[] = [];
      function Parent() {
        const [value, setValue] = useState<string>(initial);
        return (
          <Widget
            {...makeWidgetMockProps({
              id: 'date',
              value,
              autofocus: false,
              schema: { type: 'string', format },
              onChange: (next: string) => {
                events.push('change');
                setValue(next);
              },
              onBlur: () => {
                events.push('blur');
                focusedAtBlur.push(document.activeElement);
              },
              onFocus: () => events.push('focus'),
            })}
          />
        );
      }
      const { container, unmount } = render(
        <StrictMode>
          <Parent />
        </StrictMode>,
      );
      const trigger = triggerIn(container);
      await user.click(trigger);
      await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
      events.length = 0;
      if (action === 'Done') {
        await user.click(screen.getByText('Done'));
      } else {
        await user.keyboard('{Escape}');
      }
      expect(events).toEqual(action === 'Done' ? ['change', 'blur', 'focus'] : ['blur', 'focus']);
      // Focus never falls to the body the unmounted popup would leave it on: it is on the trigger by the time the
      // consumer hears the blur, so a check for focus still being inside the field answers yes
      expect(focusedAtBlur).toHaveLength(1);
      expect(focusedAtBlur[0]).toBe(trigger);
      expect(trigger).toHaveFocus();
      unmount();
      expect(events.filter((event) => event === 'blur')).toHaveLength(1);
    },
  );

  test.each(['Done', 'Escape'] as const)('%s leaves focus where onBlur moved it', async (action) => {
    const events: string[] = [];
    function Parent() {
      const [value, setValue] = useState<string>(initial);
      return (
        <>
          <Widget
            {...makeWidgetMockProps({
              id: 'date',
              value,
              autofocus: false,
              schema: { type: 'string', format },
              onChange: (next: string) => setValue(next),
              onBlur: () => {
                events.push('blur');
                screen.getByLabelText('Next').focus();
              },
              onFocus: () => events.push('focus'),
            })}
          />
          <input aria-label='Next' />
        </>
      );
    }
    const { container } = render(
      <StrictMode>
        <Parent />
      </StrictMode>,
    );
    await user.click(triggerIn(container));
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    events.length = 0;
    if (action === 'Done') {
      await user.click(screen.getByText('Done'));
    } else {
      await user.keyboard('{Escape}');
    }
    expect(screen.getByLabelText('Next')).toHaveFocus();
    // The trigger lost the focus the close returned to it before the consumer heard of it, so neither that focus nor
    // its loss is reported
    expect(events).toEqual(['blur']);
  });

  test('Done leaves focus on a field that takes it as the save reveals it', async () => {
    const events: string[] = [];
    function Parent() {
      const [value, setValue] = useState<string>(initial);
      return (
        <>
          <Widget
            {...makeWidgetMockProps({
              id: 'date',
              value,
              autofocus: false,
              schema: { type: 'string', format },
              onChange: (next: string) => setValue(next),
              onBlur: (_: string, reported: unknown) => events.push(`blur ${String(reported)}`),
              onFocus: () => events.push('focus'),
            })}
          />
          {value !== initial && <SelfFocusing />}
        </>
      );
    }
    const { container } = render(
      <StrictMode>
        <Parent />
      </StrictMode>,
    );
    await user.click(triggerIn(container));
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    events.length = 0;
    await user.click(screen.getByText('Done'));
    expect(screen.getByLabelText('Revealed')).toHaveFocus();
    expect(events).toEqual([`blur ${proposal}`]);
  });

  test('Escape returns focus when onBlur flushes a render synchronously', async () => {
    function Parent() {
      const [, setTick] = useState(0);
      return (
        <Widget
          {...makeWidgetMockProps({
            id: 'date',
            value: initial,
            autofocus: false,
            schema: { type: 'string', format },
            onBlur: () => flushSync(() => setTick((tick) => tick + 1)),
          })}
        />
      );
    }
    const { container } = render(<Parent />);
    const trigger = triggerIn(container);
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Done')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  test('Done defers a flushSync from onBlur, and React reports the deferral', async () => {
    function Parent() {
      const [, setTick] = useState(0);
      return (
        <Widget
          {...makeWidgetMockProps({
            id: 'date',
            value: initial,
            autofocus: false,
            schema: { type: 'string', format },
            onBlur: () => flushSync(() => setTick((tick) => tick + 1)),
          })}
        />
      );
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { container } = render(<Parent />);
      const trigger = triggerIn(container);
      await user.click(trigger);
      await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
      await user.click(screen.getByText('Done'));

      expect(screen.queryByText('Done')).toBeNull();
      expect(trigger).toHaveFocus();
      // Done reports blur from the close commit's passive Effect, where React defers a `flushSync` and logs that it did;
      // Escape, above, reports it from the key handler, where the `flushSync` runs at once
      const flushSyncErrors = consoleError.mock.calls.filter(([message]) =>
        String(message).includes('flushSync was called from inside a lifecycle method'),
      );
      expect(flushSyncErrors).toHaveLength(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  test('Escape returns focus even when onBlur throws', async () => {
    const boom = new Error('boom');
    const { container } = render(
      <Widget
        {...makeWidgetMockProps({
          id: 'date',
          value: initial,
          autofocus: false,
          schema: { type: 'string', format },
          onBlur: () => {
            throw boom;
          },
        })}
      />,
    );
    const trigger = triggerIn(container);
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    // Escape is handled by a document listener, so jsdom reports the throw to the window, not to user-event
    const onWindowError = vi.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener('error', onWindowError);
    try {
      await user.keyboard('{Escape}');
    } finally {
      window.removeEventListener('error', onWindowError);
    }
    expect(onWindowError.mock.calls.map(([event]): unknown => event.error)).toEqual([boom]);
    expect(trigger).toHaveFocus();
  });

  test.each(['close', 'hide'] as const)(
    'a throwing onBlur on Done (%s) is rethrown outside the commit instead of unmounting the form',
    async (replacement) => {
      const boom = new Error('boom');
      function Parent() {
        const [value, setValue] = useState<string>(initial);
        const [visible, setVisible] = useState(true);
        return (
          <>
            {visible && (
              <Widget
                {...makeWidgetMockProps({
                  id: 'date',
                  value,
                  autofocus: false,
                  schema: { type: 'string', format },
                  onBlur: () => {
                    throw boom;
                  },
                  onChange: (next: string) => {
                    setValue(next);
                    if (replacement === 'hide') {
                      setVisible(false);
                    }
                  },
                })}
              />
            )}
            <p>Sibling</p>
          </>
        );
      }
      const deferred = collectDeferredThrows();
      try {
        const { container } = render(
          <Boundary>
            <Parent />
          </Boundary>,
        );
        await user.click(triggerIn(container));
        await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
        await user.click(screen.getByText('Done'));
      } finally {
        await deferred.settle();
      }
      expect(screen.queryByText('Fallback')).toBeNull();
      expect(screen.getByText('Sibling')).toBeInTheDocument();
      expect(deferred.thrown).toEqual([boom]);
    },
  );

  test('does not wait for a parent transition', async () => {
    const onBlur = vi.fn();
    function Parent() {
      const [value, setValue] = useState<string>(initial);
      return (
        <Widget
          {...makeWidgetMockProps({
            id: 'date',
            value,
            autofocus: false,
            schema: { type: 'string', format },
            onBlur,
            onChange: (next: string) => startTransition(() => setValue(next)),
          })}
        />
      );
    }
    const { container } = render(<Parent />);
    await user.click(triggerIn(container));
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    await user.click(screen.getByText('Done'));
    expect(onBlur.mock.calls).toEqual([['date', initial]]);
    expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 17, 2020');
  });

  test('does not repeat blur when an async parent response arrives later', async () => {
    let accept = () => {};
    const response = new Promise<void>((resolve) => {
      accept = resolve;
    });
    const onBlur = vi.fn();
    function Parent() {
      const [value, setValue] = useState<string>(initial);
      return (
        <Widget
          {...makeWidgetMockProps({
            id: 'date',
            value,
            autofocus: false,
            schema: { type: 'string', format },
            onBlur,
            onChange: (next: string) => response.then(() => setValue(next)),
          })}
        />
      );
    }
    const { container, unmount } = render(
      <StrictMode>
        <Parent />
      </StrictMode>,
    );
    await user.click(triggerIn(container));
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    await user.click(screen.getByText('Done'));
    expect(onBlur.mock.calls).toEqual([['date', initial]]);
    await act(async () => {
      accept();
      await response;
    });
    expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 17, 2020');
    expect(onBlur).toHaveBeenCalledTimes(1);
    unmount();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
