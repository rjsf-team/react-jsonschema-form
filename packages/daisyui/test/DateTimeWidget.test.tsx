import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import DateTimeWidget from '../src/widgets/DateTimeWidget/DateTimeWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe('DateTimeWidget', () => {
  describe('with schema.format = iso-date-time', () => {
    const schema = { type: 'string' as const, format: 'iso-date-time' };

    test('commits the date-time as a naive local string without a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30', onChange, schema })} />,
      );

      await user.click(container.querySelector('button[aria-haspopup]')!);
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30');
    });

    test('parses a stored offset value as the naive wall-clock time instead of converting it to local time', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await user.click(container.querySelector('button[aria-haspopup]')!);
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30');
    });
  });

  describe('with schema.format = date-time', () => {
    const schema = { type: 'string' as const, format: 'date-time' };

    test('still commits the date-time as a UTC ISO string with a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await user.click(container.querySelector('button[aria-haspopup]')!);
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30.000Z');
    });

    test('leaves an unparsable stored value alone rather than throwing over it', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: 'not-a-date', onChange, schema })} />,
      );

      // React routes an error thrown inside a handler to a window `error` event rather than rejecting the
      // promise user-event returns, so the "instead of throwing" half of this test has to listen for that;
      // awaiting the clicks, or wrapping them in `.resolves.not.toThrow()`, would pass either way
      const onWindowError = vi.fn((event: Event) => event.preventDefault());
      window.addEventListener('error', onWindowError);

      try {
        await user.click(container.querySelector('button[aria-haspopup]')!);
        await user.click(screen.getByText('Done'));
      } finally {
        window.removeEventListener('error', onWindowError);
      }

      expect(onWindowError).not.toHaveBeenCalled();
      // Dismissing the picker without choosing a day is not a request to throw the stored value away, so the empty
      // value is committed only where there was nothing to lose
      expect(onChange).not.toHaveBeenCalled();
    });

    test('commits the empty value, not an empty string, when there was no date to begin with', async () => {
      const onChange = vi.fn();
      const { container } = render(<DateTimeWidget {...makeWidgetMockProps({ value: '', onChange, schema })} />);

      await user.click(container.querySelector('button[aria-haspopup]')!);
      await user.click(screen.getByText('Done'));

      // `''` is no more a `date-time` than a mangled one, so committing it would fail the format of the field
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  // An emptied time input parses as `NaN`, which invalidates the whole date. Held in state it throws from the
  // calendar's month caption, so the picker dies mid-edit rather than letting the user finish typing a time
  test('survives the time input being cleared mid-edit', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTimeWidget
        {...makeWidgetMockProps({
          value: '2016-04-05T14:01:30.000Z',
          onChange,
          schema: { type: 'string' as const, format: 'date-time' },
        })}
      />,
    );

    await user.click(container.querySelector('button[aria-haspopup]')!);
    await user.clear(container.querySelector('input[type=time]')!);
    await user.click(screen.getByText('Done'));

    // The last time it could read, rather than an `Invalid Date` that `commitValue()` would throw on
    expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30.000Z');
  });

  // A hidden label leaves no label element for the trigger to be named by, so its contents are its whole name:
  // rendering nothing would leave a control that is both blank and unnamed
  test('falls back to the label for its text, and so its name, where the label is hidden', () => {
    const { container } = render(
      <DateTimeWidget
        {...makeWidgetMockProps({
          value: '',
          label: 'When',
          hideLabel: true,
          placeholder: '',
          schema: { type: 'string' as const, format: 'date-time' },
        })}
      />,
    );

    expect(container.querySelector('button[aria-haspopup]')).toHaveAccessibleName('When');
  });

  // Nothing about the picker is read-only in itself, so the trigger is the only place either flag can be honored
  describe.each([
    ['disabled', { disabled: true }],
    ['read-only', { readonly: true }],
  ])('a %s field', (_, flags) => {
    test('cannot be opened, so cannot be committed over', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget
          {...makeWidgetMockProps({
            value: '2016-04-05T14:01:30.000Z',
            onChange,
            schema: { type: 'string' as const, format: 'date-time' },
            ...flags,
          })}
        />,
      );

      await user.click(container.querySelector('button[aria-haspopup]')!);

      expect(screen.queryByText('Done')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // Escape is the one way out of the popup that does not commit, so the instant the user was trying out has to go too
  test('discards the day Escape closes the picker on', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTimeWidget
        {...makeWidgetMockProps({
          value: '2016-04-05T14:01:30.000Z',
          onChange,
          schema: { type: 'string' as const, format: 'date-time' },
        })}
      />,
    );

    await user.click(container.querySelector('button[aria-haspopup]')!);
    await user.click(screen.getByRole('button', { name: /April 17th, 2016/ }));
    await user.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('button[aria-haspopup]')).not.toHaveTextContent('Apr 17, 2016');
  });

  // A name from outside the element replaces its contents, so the instant on the trigger is only announced where
  // something points at it
  test('describes itself with the selected date-time, which its name replaces', () => {
    const { container } = render(
      <DateTimeWidget
        {...makeWidgetMockProps({
          value: '2016-04-05T14:01:30.000Z',
          label: 'When',
          schema: { type: 'string' as const, format: 'iso-date-time' },
        })}
      />,
    );

    expect(container.querySelector('button[aria-haspopup]')).toHaveAccessibleDescription(/Apr 5, 2016/);
  });
});
