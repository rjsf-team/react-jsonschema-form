import { StrictMode, startTransition, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import DateTimeWidget from '../src/widgets/DateTimeWidget/DateTimeWidget.tsx';
import DateWidget from '../src/widgets/DateWidget/DateWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe.each([
  ['date', DateWidget, 'date', '2020-05-03', '2020-05-17'],
  ['date-time', DateTimeWidget, 'iso-date-time', '2020-05-03T10:30:00', '2020-05-17T10:30:00'],
] as const)('%s close-path blur', (_, Widget, format, initial, proposal) => {
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
    await user.click(container.querySelector('button[aria-haspopup]')!);
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

  test.each(['Done', 'Escape'] as const)('%s reports blur before returning focus', async (action) => {
    const events: string[] = [];
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
            onBlur: () => events.push('blur'),
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
    const trigger = container.querySelector('button[aria-haspopup]')!;
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
    events.length = 0;
    if (action === 'Done') {
      await user.click(screen.getByText('Done'));
    } else {
      await user.keyboard('{Escape}');
    }
    expect(events).toEqual(action === 'Done' ? ['change', 'blur', 'focus'] : ['blur', 'focus']);
    expect(trigger).toHaveFocus();
    unmount();
    expect(events.filter((event) => event === 'blur')).toHaveLength(1);
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
    await user.click(container.querySelector('button[aria-haspopup]')!);
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
    await user.click(container.querySelector('button[aria-haspopup]')!);
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
