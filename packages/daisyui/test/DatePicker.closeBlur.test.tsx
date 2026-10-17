import type { ReactNode } from 'react';
import { Component, StrictMode, createRef, startTransition, useLayoutEffect, useRef, useState } from 'react';
import type { FormRef } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { flushSync } from 'react-dom';

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
    test.each(['accept', 'transform', 'reject'] as const)(
      'reports the value the close stores, whatever a %s parent does with it',
      async (mode) => {
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
        // The close reports its blur from the handler that closes the popup, with the value it stores; the parent's
        // answer arrives through `value`, which a later blur of the trigger reports
        const saved = { accept: proposal, transform: transformed, reject: initial }[mode];
        const blur = `blur ${action === 'Escape' ? initial : proposal}`;
        const laterBlur = `blur ${action === 'Escape' ? initial : saved}`;
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
          expect(events).toEqual([...closed, 'focus', laterBlur]);
        }
      },
    );
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
    await frameUser.click(view.getByRole('button', { expanded: false }));
    await frameUser.click(view.getByRole('button', { name: /May 17th, 2020/ }));
    await frameUser.click(view.getByRole('button', { expanded: true }));
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
    // Reported from the close itself, with the value it stores, before the save replaces the widget
    expect(onBlur.mock.calls).toEqual([['date', proposal]]);
    if (replacement === 'hide') {
      expect(container.querySelector('button[aria-haspopup]')).toBeNull();
    } else {
      expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 17, 2020');
    }
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
    '%s reports the focus the trigger holds, and its loss, when the save reveals a field that takes the focus',
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
      // The trigger held the focus once the close was reported, until the commit that renders the save revealed the
      // field that took it
      expect(events).toEqual([`blur ${proposal}`, 'focus', `blur ${proposal}`]);
    },
  );

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

  test('Done on an empty field reports the blur and focus with the emptied value the close stores', async () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const { container } = render(
      <Widget
        {...makeWidgetMockProps({
          id: 'date',
          value: '',
          autofocus: false,
          schema: { type: 'string', format },
          onChange,
          onBlur,
          onFocus,
        })}
      />,
    );
    await user.click(triggerIn(container));
    onFocus.mockClear();
    await user.click(screen.getByText('Done'));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(onBlur).toHaveBeenLastCalledWith('date', undefined);
    expect(onFocus).toHaveBeenLastCalledWith('date', undefined);
  });

  test('Done runs a flushSync from onBlur at once, with no error from React', async () => {
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
      // Done reports the blur from its click handler, as Escape does from its key handler, so the `flushSync` runs
      expect(consoleError).not.toHaveBeenCalled();
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

  test('Escape surfaces a throw from onBlur, which ends the handler before the focus is reported', async () => {
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
    const onWindowError = vi.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener('error', onWindowError);
    try {
      await user.keyboard('{Escape}');
    } finally {
      window.removeEventListener('error', onWindowError);
    }
    // The blur's throw leaves the key handler, as any throw does, so the focus it would have reported next is not
    expect(onWindowError.mock.calls.map(([event]): unknown => event.error)).toEqual([blurBoom]);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  test.each(['close', 'hide'] as const)(
    'a throwing onBlur on Done (%s) leaves the click handler instead of unmounting the form',
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
      const { container } = render(
        <Boundary>
          <Parent />
        </Boundary>,
      );
      await user.click(triggerIn(container));
      await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
      // An error from an event handler reaches no error boundary: React reports it to the window
      const onWindowError = vi.fn((event: ErrorEvent) => event.preventDefault());
      window.addEventListener('error', onWindowError);
      try {
        await user.click(screen.getByText('Done'));
      } finally {
        window.removeEventListener('error', onWindowError);
      }
      expect(screen.queryByText('Fallback')).toBeNull();
      expect(screen.getByText('Sibling')).toBeInTheDocument();
      expect(onWindowError.mock.calls.map(([event]): unknown => event.error)).toEqual([boom]);
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
    // Reported with the value the close stores, without waiting for the parent to render it
    expect(onBlur.mock.calls).toEqual([['date', proposal]]);
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
    expect(onBlur.mock.calls).toEqual([['date', proposal]]);
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
  test.each([
    ['takes the date', undefined, '2020-05-17'],
    ['rewrites it in transformChange', (next: unknown) => (next === '2020-05-17' ? '2020-05-20' : next), '2020-05-20'],
  ] as const)('lets onBlur read the stored value when the form %s', async (_, transformChange, stored) => {
    const ref = createRef<FormRef>();
    const atBlur: unknown[] = [];
    render(
      <Form
        ref={ref}
        schema={{ type: 'string', format: 'date' }}
        validator={validator}
        initialFormData='2020-05-03'
        transformChange={transformChange}
        onBlur={(_id, reported) => atBlur.push([reported, ref.current?.getFormData()])}
      />,
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    await user.click(screen.getByText('Done'));

    // The form stores the edit as `onChange` reports it, so the blur that follows in the same handler finds it stored
    expect(atBlur).toEqual([['2020-05-17', stored]]);
  });
});
