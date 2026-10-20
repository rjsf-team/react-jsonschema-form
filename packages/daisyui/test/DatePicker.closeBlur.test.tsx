import type { ReactNode } from 'react';
import { Component, StrictMode, createRef, startTransition, useLayoutEffect, useRef, useState } from 'react';
import type { FormRef } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { flushSync } from 'react-dom';

import { collectDeferredThrows } from '../../../testing/deferredThrows.ts';
import Form from '../src/index.ts';
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
                onBlur: (_: string, reported: unknown) => events.push(`blur ${String(reported)}`),
                onFocus: () => events.push('focus'),
                onChange: (next: string) => {
                  events.push(`change ${next}`);
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
      // One focus for the press that both focused the trigger and opened the popup
      expect(events).toEqual(['focus']);
      const saved = { accept: proposal, transform: transformed, reject: initial }[mode];
      const blur = `blur ${action === 'Escape' ? initial : saved}`;
      const closed = action === 'Escape' ? ['focus', blur] : ['focus', `change ${proposal}`, blur];
      if (action === 'outside') {
        await user.pointer({ keys: '[MouseLeft>]', target: screen.getByLabelText('Elsewhere') });
        // Released even when the assertion fails: `user` is shared, and a held button would leak into the next test
        try {
          expect(events).toEqual(closed);
        } finally {
          await user.pointer({ keys: '[/MouseLeft]' });
        }
        // The press took the focus with it, so the field is neither back in use nor left a second time
        expect(events).toEqual(closed);
      } else {
        if (action === 'Escape') {
          await user.keyboard('{Escape}');
        } else {
          await user.click(action === 'Done' ? screen.getByText('Done') : trigger);
        }
        // Closing reports the blur and then the focus the trigger holds: the field was left, and is back in use
        expect(events).toEqual([...closed, 'focus']);
        expect(trigger).toHaveFocus();
        await user.tab();
        expect(events).toEqual([...closed, 'focus', blur]);
      }
    });
  });

  test.each(['Escape', 'outside', 'trigger'] as const)(
    'closing with %s reports focus and blur in turn when the trigger kept the focus',
    async (action) => {
      const events: string[] = [];
      const { container } = render(
        <StrictMode>
          <Widget
            {...makeWidgetMockProps({
              id: 'date',
              value: initial,
              autofocus: false,
              schema: { type: 'string', format },
              onBlur: () => events.push('blur'),
              onFocus: () => events.push('focus'),
            })}
          />
          <input aria-label='Elsewhere' />
        </StrictMode>,
      );
      const trigger = triggerIn(container);
      // Opened from the keyboard, the focus never enters the popup
      await user.tab();
      await user.keyboard('{Enter}');
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(events).toEqual(['focus']);
      if (action === 'outside') {
        await user.click(screen.getByLabelText('Elsewhere'));
        // One blur for the press that both closed the popup and took the focus from the trigger
        expect(events).toEqual(['focus', 'blur']);
      } else {
        await user.keyboard(action === 'Escape' ? '{Escape}' : '{Enter}');
        expect(trigger).toHaveFocus();
        expect(events).toEqual(['focus', 'blur', 'focus']);
        await user.tab();
        expect(events).toEqual(['focus', 'blur', 'focus', 'blur']);
      }
      expect(screen.queryByText('Done')).toBeNull();
    },
  );

  test('a press elsewhere that leaves the focus on the trigger reports no blur until the trigger loses it', async () => {
    const events: string[] = [];
    const { container } = render(
      <StrictMode>
        <Widget
          {...makeWidgetMockProps({
            id: 'date',
            value: initial,
            autofocus: false,
            schema: { type: 'string', format },
            onBlur: () => events.push('blur'),
            onFocus: () => events.push('focus'),
          })}
        />
        <button type='button' onMouseDown={(event) => event.preventDefault()}>
          Toolbar
        </button>
      </StrictMode>,
    );
    const trigger = triggerIn(container);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(events).toEqual(['focus']);
    await user.click(screen.getByText('Toolbar'));
    expect(screen.queryByText('Done')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(events).toEqual(['focus']);
    await user.tab();
    expect(events).toEqual(['focus', 'blur']);
  });

  test('a press elsewhere that takes the focus from the trigger reports the value the parent stores', async () => {
    const events: string[] = [];
    function Parent() {
      // A `''` left over from a cleared field, which any close replaces with the empty value, `undefined` here
      const [value, setValue] = useState<string | undefined>('');
      return (
        <>
          <Widget
            {...makeWidgetMockProps({
              id: 'date',
              value,
              autofocus: false,
              schema: { type: 'string', format },
              onChange: (next?: string) => {
                events.push(`change ${String(next)}`);
                setValue(next);
              },
              onBlur: (_: string, reported: unknown) => events.push(`blur ${String(reported)}`),
              onFocus: () => events.push('focus'),
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
    // Opened from the keyboard, so the trigger holds the focus when the press elsewhere closes the popup
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(triggerIn(container)).toHaveFocus();
    await user.click(screen.getByLabelText('Elsewhere'));
    expect(screen.getByLabelText('Elsewhere')).toHaveFocus();
    expect(events).toEqual(['focus', 'change undefined', 'blur undefined']);
  });

  test.each(['trigger', 'popup'] as const)(
    'a press elsewhere with the focus on the %s reports the value a rewriting parent stores',
    async (focused) => {
      const transformed = proposal.replace('-17', '-20');
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
                onChange: (next: string) => {
                  events.push(`change ${next}`);
                  setValue(transformed);
                },
                onBlur: (_: string, reported: unknown) => events.push(`blur ${String(reported)}`),
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
      if (focused === 'trigger') {
        // A browser that doesn't focus a button on click, as Safari doesn't, leaves the focus on the trigger when a day
        // is pressed. user-event always focuses the day, so the focus is put back
        act(() => trigger.focus());
      }
      expect(trigger.matches(':focus')).toBe(focused === 'trigger');
      await user.click(screen.getByLabelText('Elsewhere'));
      expect(events).toEqual([`change ${proposal}`, `blur ${transformed}`]);
    },
  );

  // The playground renders the form into an iframe, where every node is an instance of that window's classes and of
  // none of ours: a press on the trigger taken for a press elsewhere closes the popup on the way down and, the click
  // then finding it closed, opens it again
  test('a press on the trigger of a framed form closes the popup', async () => {
    const frame = document.body.appendChild(document.createElement('iframe'));
    onTestFinished(() => frame.remove());
    const frameDocument = frame.contentDocument;
    if (!frameDocument) {
      throw new Error('The frame has no document');
    }
    const frameUser = userEvent.setup({ document: frameDocument });
    const onChange = vi.fn();
    const view = render(
      <Widget
        {...makeWidgetMockProps({
          id: 'date',
          value: initial,
          autofocus: false,
          schema: { type: 'string', format },
          onChange,
        })}
      />,
      {
        container: frameDocument.body.appendChild(frameDocument.createElement('div')),
        baseElement: frameDocument.body,
      },
    );
    await frameUser.click(view.getByRole('combobox', { expanded: false }));
    await frameUser.click(view.getByRole('button', { name: /May 17th, 2020/ }));
    await frameUser.click(view.getByRole('combobox', { expanded: true }));
    expect(view.queryByText('Done')).toBeNull();
    expect(onChange.mock.calls).toEqual([[proposal]]);
  });

  test.each([
    ['hide', 'Done'],
    ['hide', 'outside'],
    ['remount', 'Done'],
    ['remount', 'outside'],
  ] as const)('keeps one notification when %s replaces the widget on %s', async (replacement, action) => {
    const onBlur = vi.fn();
    const onFocus = vi.fn();
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
                onFocus,
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
    // The trigger the close returned the focus to is gone, so the only focus reported is the one the opening did
    expect(onFocus).toHaveBeenCalledTimes(1);
    unmount();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test.each(['Done', 'Escape', 'trigger'] as const)(
    '%s reports blur before the focus the trigger holds',
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
      if (action === 'Escape') {
        await user.keyboard('{Escape}');
      } else {
        await user.click(action === 'Done' ? screen.getByText('Done') : trigger);
      }
      expect(events).toEqual(action === 'Escape' ? ['blur', 'focus'] : ['change', 'blur', 'focus']);
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

  test.each(['Done', 'Escape', 'trigger'] as const)(
    '%s reports the blur of a trigger whose focus onFocus moves on',
    async (action) => {
      const events: string[] = [];
      const { container } = render(
        <StrictMode>
          <Widget
            {...makeWidgetMockProps({
              id: 'date',
              value: initial,
              autofocus: false,
              schema: { type: 'string', format },
              onBlur: () => events.push('blur'),
              onFocus: () => {
                events.push('focus');
                if (events.length > 1) {
                  screen.getByLabelText('Next').focus();
                }
              },
            })}
          />
          <input aria-label='Next' />
        </StrictMode>,
      );
      const trigger = triggerIn(container);
      await user.tab();
      await user.keyboard('{Enter}');
      expect(trigger).toHaveFocus();
      expect(events).toEqual(['focus']);
      if (action === 'Done') {
        await user.click(screen.getByText('Done'));
      } else {
        await user.keyboard(action === 'Escape' ? '{Escape}' : '{Enter}');
      }
      expect(screen.getByLabelText('Next')).toHaveFocus();
      expect(events).toEqual(['focus', 'blur', 'focus', 'blur']);
    },
  );

  test.each(['Done', 'trigger'] as const)(
    '%s leaves focus on a field that takes it as the save reveals it',
    async (action) => {
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
      const trigger = triggerIn(container);
      await user.click(trigger);
      await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
      events.length = 0;
      await user.click(action === 'Done' ? screen.getByText('Done') : trigger);
      expect(screen.getByLabelText('Revealed')).toHaveFocus();
      expect(events).toEqual([`blur ${proposal}`]);
    },
  );

  test.each(['Done', 'trigger'] as const)(
    '%s reports the blur of an onChange that moves the focus on with the value the parent stores',
    async (action) => {
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
                onChange: (next: string) => {
                  events.push(`change ${next}`);
                  setValue(next);
                  screen.getByLabelText('Next').focus();
                },
                onBlur: (_: string, reported: unknown) => events.push(`blur ${String(reported)}`),
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
      const trigger = triggerIn(container);
      await user.click(trigger);
      await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
      events.length = 0;
      await user.click(action === 'Done' ? screen.getByText('Done') : trigger);
      expect(screen.getByLabelText('Next')).toHaveFocus();
      expect(events).toEqual([`change ${proposal}`, `blur ${proposal}`]);
    },
  );

  test('Done on a field holding a cleared one\'s "" reports the blur and focus with the empty value stored', async () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    function Parent() {
      const [value, setValue] = useState<string | undefined>('');
      return (
        <Widget
          {...makeWidgetMockProps({
            id: 'date',
            value,
            autofocus: false,
            schema: { type: 'string', format },
            onChange: (next?: string) => {
              onChange(next);
              setValue(next);
            },
            onBlur,
            onFocus,
          })}
        />
      );
    }
    const { container } = render(<Parent />);
    await user.click(triggerIn(container));
    onFocus.mockClear();
    await user.click(screen.getByText('Done'));

    expect(onChange.mock.calls).toEqual([[undefined]]);
    expect(onBlur.mock.calls).toEqual([['date', undefined]]);
    expect(onFocus.mock.calls).toEqual([['date', undefined]]);
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

  test('Escape surfaces a throw from onBlur and one from the onFocus that follows it', async () => {
    const blurBoom = new Error('blur');
    const focusBoom = new Error('focus');
    const onFocus = vi.fn();
    const { container } = render(
      <Widget
        {...makeWidgetMockProps({
          id: 'date',
          value: initial,
          autofocus: false,
          schema: { type: 'string', format },
          onBlur: () => {
            throw blurBoom;
          },
          onFocus,
        })}
      />,
    );
    const trigger = triggerIn(container);
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    onFocus.mockImplementation(() => {
      throw focusBoom;
    });
    const deferred = collectDeferredThrows();
    const onWindowError = vi.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener('error', onWindowError);
    try {
      await user.keyboard('{Escape}');
    } finally {
      window.removeEventListener('error', onWindowError);
      await deferred.settle();
    }
    // The blur's throw leaves the key handler, as it does with no `onFocus` after it. The focus's is rethrown from a
    // timer, where it cannot take the place of the blur's
    expect(onWindowError.mock.calls.map(([event]): unknown => event.error)).toEqual([blurBoom]);
    expect(deferred.thrown).toEqual([focusBoom]);
    expect(trigger).toHaveFocus();
  });

  test('Escape goes on reporting focus and blur in turn after onBlur throws', async () => {
    const boom = new Error('boom');
    const events: string[] = [];
    const onBlur = vi.fn(() => events.push('blur'));
    const { container } = render(
      <Widget
        {...makeWidgetMockProps({
          id: 'date',
          value: initial,
          autofocus: false,
          schema: { type: 'string', format },
          onBlur,
          onFocus: () => events.push('focus'),
        })}
      />,
    );
    const trigger = triggerIn(container);
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    onBlur.mockImplementationOnce(() => {
      events.push('blur');
      throw boom;
    });
    const onWindowError = vi.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener('error', onWindowError);
    try {
      await user.keyboard('{Escape}');
    } finally {
      window.removeEventListener('error', onWindowError);
    }
    expect(onWindowError.mock.calls.map(([event]): unknown => event.error)).toEqual([boom]);
    // The focus the trigger holds is reported by the close Effect, which the throw that ended the key handler doesn't
    // skip, so the trigger's own blur is reported when the user leaves it
    expect(events).toEqual(['focus', 'blur', 'focus']);
    await user.tab();
    expect(events).toEqual(['focus', 'blur', 'focus', 'blur']);
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

  test('a throwing onChange on Done still reports the close, and then the focus the trigger holds', async () => {
    const boom = new Error('boom');
    const events: string[] = [];
    const { container } = render(
      <Widget
        {...makeWidgetMockProps({
          id: 'date',
          value: initial,
          autofocus: false,
          schema: { type: 'string', format },
          onBlur: (_: string, reported: unknown) => events.push(`blur ${String(reported)}`),
          onFocus: () => events.push('focus'),
          onChange: () => {
            throw boom;
          },
        })}
      />,
    );
    const trigger = triggerIn(container);
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    events.length = 0;
    // An error from an event handler reaches no error boundary: React reports it to the window
    const onWindowError = vi.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener('error', onWindowError);
    try {
      await user.click(screen.getByText('Done'));
    } finally {
      window.removeEventListener('error', onWindowError);
    }
    expect(onWindowError.mock.calls.map(([event]): unknown => event.error)).toEqual([boom]);
    expect(screen.queryByText('Done')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(events).toEqual([`blur ${initial}`, 'focus']);

    await user.tab();

    expect(events).toEqual([`blur ${initial}`, 'focus', `blur ${initial}`]);
  });

  test('a throwing onChange on a press elsewhere still reports the blur, and the next opening its focus', async () => {
    const boom = new Error('boom');
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const { container } = render(
      <>
        <Widget
          {...makeWidgetMockProps({
            id: 'date',
            value: initial,
            autofocus: false,
            schema: { type: 'string', format },
            onBlur,
            onFocus,
            onChange: () => {
              throw boom;
            },
          })}
        />
        <input aria-label='Outside' />
      </>,
    );
    const trigger = triggerIn(container);
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    expect(screen.getByRole('button', { name: /May 17th, 2020/ })).toHaveFocus();
    // The press is handled by a document listener, so jsdom reports the throw to the window
    const onWindowError = vi.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener('error', onWindowError);
    try {
      await user.click(screen.getByLabelText('Outside'));
    } finally {
      window.removeEventListener('error', onWindowError);
    }
    expect(onWindowError.mock.calls.map(([event]): unknown => event.error)).toEqual([boom]);
    expect(screen.getByLabelText('Outside')).toHaveFocus();
    expect(onBlur.mock.calls).toEqual([['date', initial]]);

    await user.click(trigger);

    expect(onFocus).toHaveBeenCalledTimes(2);
  });

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

describe('a close in a form', () => {
  test('lets onBlur read the stored value when the form takes the date', async () => {
    const ref = createRef<FormRef>();
    const atBlur: unknown[] = [];
    render(
      <Form
        ref={ref}
        schema={{ type: 'string', format: 'date' }}
        validator={validator}
        initialFormData='2020-05-03'
        onBlur={(_id, reported) => atBlur.push([reported, ref.current?.getFormData()])}
      />,
    );
    await user.click(screen.getByRole('combobox', { expanded: false }));
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    await user.click(screen.getByText('Done'));

    // The blur is reported once the commit that renders the form's save is in, so the form holds the date by then
    expect(atBlur).toEqual([['2020-05-17', '2020-05-17']]);
  });
});
