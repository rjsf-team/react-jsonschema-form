import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import Form from '../src/index.ts';
import DateTimeWidget from '../src/widgets/DateTimeWidget/DateTimeWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

/** Opens the picker from its trigger, the one button that opens a popup — the calendar renders more */
async function openPicker(container: HTMLElement) {
  await user.click(container.querySelector('button[aria-haspopup]')!);
}

/** Picks a day other than the stored one, since closing the picker stores what it holds only where the user chose it.
 * A day cell is a button named by its full date, e.g. "Tuesday, April 12th, 2016"
 */
async function pickTheTwelfth(year = 2016) {
  await user.click(screen.getByRole('button', { name: new RegExp(`12th, ${year}`) }));
}

describe('DateTimeWidget', () => {
  describe('with schema.format = iso-date-time', () => {
    const schema = { type: 'string' as const, format: 'iso-date-time' };

    test('commits the date-time as a naive local string without a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30', onChange, schema })} />,
      );

      await openPicker(container);
      await pickTheTwelfth();
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-12T14:01:30');
    });

    test('parses a stored offset value as the naive wall-clock time instead of converting it to local time', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await openPicker(container);
      await pickTheTwelfth();
      await user.click(screen.getByText('Done'));

      // The wall-clock time of the stored value, not the local time its offset converts to
      expect(onChange).toHaveBeenCalledWith('2016-04-12T14:01:30');
    });
  });

  describe('with schema.format = date-time', () => {
    const schema = { type: 'string' as const, format: 'date-time' };

    test('still commits the date-time as a UTC ISO string with a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await openPicker(container);
      await pickTheTwelfth();
      await user.click(screen.getByText('Done'));

      // The instant the picked day and the kept time land on depends on the zone the test runs in; the shape does not
      expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^2016-04-1[12]T\d{2}:\d{2}:30\.000Z$/));
    });

    // A day the user never picked is a day they never asked to store, and the value they arrived with may be one this
    // widget does not write itself — an offset date-time, or one carrying seconds
    test('leaves the stored value alone when the picker is dismissed without a change', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await openPicker(container);
      await user.click(screen.getByText('Done'));

      expect(onChange).not.toHaveBeenCalled();
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
        await openPicker(container);
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

      await openPicker(container);
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

    const trigger = container.querySelector('button[aria-haspopup]')!;
    const displayed = trigger.textContent;

    await openPicker(container);
    await user.clear(container.querySelector('input[type=time]')!);
    await user.click(screen.getByText('Done'));

    // The date-time it still holds, not the `Invalid Date` an emptied input parses as
    expect(trigger.textContent).toBe(displayed);
    // A half-typed time the widget could not read is no more a change the user asked to store than not touching it
    expect(onChange).not.toHaveBeenCalled();
  });

  // `widgetMap` resolves `ui:widget: 'date-time'` on any string schema, whatever `format` it declares, so this widget
  // can be asked to fill a field an instant does not satisfy
  test('commits a date for a field whose format is date, and so submits without error', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { when: { type: 'string', format: 'date', title: 'When' } } }}
        uiSchema={{ when: { 'ui:widget': 'date-time' } }}
        validator={validator}
        onSubmit={onSubmit}
        onError={onError}
      />,
    );

    await openPicker(container);
    await pickTheTwelfth(new Date().getFullYear());
    await user.click(screen.getByText('Done'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0].formData.when).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // A field with no title leaves `FieldTemplate` no label to render, so the trigger has neither a name from outside nor
  // contents of its own to be named by
  test('names an untitled field with no value by the translated prompt', () => {
    const { container } = render(<Form schema={{ type: 'string', format: 'date-time' }} validator={validator} />);

    expect(container.querySelector('button[aria-haspopup]')).toHaveAccessibleName('Select a date');
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
