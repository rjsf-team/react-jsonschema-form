import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import Form from '../src/index.ts';
import DateWidget from '../src/widgets/DateWidget/DateWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

const schema = { type: 'string' as const, format: 'date' };

/** Opens the picker from its trigger, the one button that opens a popup — the calendar renders more */
async function openPicker(container: HTMLElement) {
  await user.click(container.querySelector('button[aria-haspopup]')!);
}

describe('DateWidget', () => {
  // These assertions are the timezone-robust half: `toISOString()` never produces a `YYYY-MM-DD` string, so they
  // fail in every zone, where the display assertions below only failed in a zone behind UTC
  describe('the value it commits', () => {
    test('commits the selected day as a date, not a UTC date-time', async () => {
      const onChange = vi.fn();
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05-03', onChange, schema })} />);

      await openPicker(container);
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2020-05-03');
    });

    test('commits the same shape when the popup closes from a click outside', async () => {
      const onChange = vi.fn();
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05-03', onChange, schema })} />);

      await openPicker(container);
      await user.click(document.body);

      expect(onChange).toHaveBeenCalledWith('2020-05-03');
    });

    test('commits the day the user picks rather than one derived from an instant', async () => {
      const onChange = vi.fn();
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05-03', onChange, schema })} />);

      await openPicker(container);
      // A day cell is a button named by its full date, e.g. "Sunday, May 17th, 2020"
      await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2020-05-17');
    });

    test('commits the empty value, not an empty string, when there is no date', async () => {
      const onChange = vi.fn();
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '', onChange, schema })} />);

      await openPicker(container);
      await user.click(screen.getByText('Done'));

      // `''` is not a `date`, so committing it would fail the format of a field the user never filled in
      expect(onChange).toHaveBeenCalledWith(undefined);
    });

    test('honors an explicit ui:emptyValue when there is no date', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateWidget {...makeWidgetMockProps({ value: '', onChange, schema, options: { emptyValue: null } })} />,
      );

      await openPicker(container);
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('the day it displays', () => {
    test('displays the day the stored date names', () => {
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05-03', schema })} />);

      expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');
    });

    // A value carrying a time is read one of two ways, and each shape of stored value only goes wrong on one side of
    // UTC, so both of these pin a zone. Without pinning they would pass in CI's UTC and catch nothing. Assigning `TZ`
    // is enough under vitest's default `forks` pool, where Node re-reads it per call; in a `worker_threads` worker
    // `process.env` is a copy and the assignment would do nothing, which the `not.toBe()` below catches
    describe.each([
      ['ahead of UTC', 'Europe/Berlin'],
      ['behind UTC', 'America/Los_Angeles'],
    ])('in a timezone %s', (_, timeZone) => {
      const realTZ = process.env.TZ;

      beforeAll(() => {
        process.env.TZ = timeZone;
      });

      afterAll(() => {
        // `process.env.TZ = undefined` assigns the *string* `'undefined'`, which leaves the process running as UTC for
        // every later test file in this vitest worker
        if (realTZ === undefined) {
          delete process.env.TZ;
        } else {
          process.env.TZ = realTZ;
        }
      });

      test('names the day a UTC instant that is a local midnight stands for', async () => {
        // A picked 3 May stored as the `toISOString()` of local midnight, so a time of day that is not UTC midnight,
        // and in a zone ahead of UTC a different date than the one the user picked
        const localMidnight = new Date(2020, 4, 3).toISOString();
        const onChange = vi.fn();
        const { container } = render(
          <DateWidget {...makeWidgetMockProps({ value: localMidnight, onChange, schema })} />,
        );

        // Pinning `TZ` is what makes this a different instant from UTC midnight, and so a different reading rule
        expect(localMidnight).not.toBe('2020-05-03T00:00:00.000Z');
        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');

        await openPicker(container);
        await user.click(screen.getByText('Done'));

        expect(onChange).toHaveBeenCalledWith('2020-05-03');
      });

      test('names the calendar day a UTC midnight value stands for', async () => {
        // What a backend emits for a date, and what this widget committed for a user in UTC. Read as an instant it
        // would name the previous day everywhere behind UTC
        const onChange = vi.fn();
        const { container } = render(
          <DateWidget {...makeWidgetMockProps({ value: '2020-05-03T00:00:00.000Z', onChange, schema })} />,
        );

        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');

        await openPicker(container);
        await user.click(screen.getByText('Done'));

        expect(onChange).toHaveBeenCalledWith('2020-05-03');
      });

      // RFC 3339 also allows a space where the `T` goes, which is what an SQL backend emits by default. Read as an
      // instant it names the previous day everywhere behind UTC, and dismissing the picker then stores that day
      test('names the calendar day a UTC midnight value with a space separator stands for', async () => {
        const onChange = vi.fn();
        const { container } = render(
          <DateWidget {...makeWidgetMockProps({ value: '2020-05-03 00:00:00Z', onChange, schema })} />,
        );

        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');

        await openPicker(container);
        await user.click(screen.getByText('Done'));

        expect(onChange).toHaveBeenCalledWith('2020-05-03');
      });

      // The `-05` at the end of a `YYYY-MM` value looks like an offset of `-05:00` to anything matching one loosely,
      // which would send it down the writer's-zone path and, finding no day in its text, fall back to its instant
      test('names the first of the month for a value that stops at the month', () => {
        const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05', schema })} />);

        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 1, 2020');
      });

      // A zone of its own is a day this widget never wrote — `toISOString()` only ever writes `Z` — so it is the
      // writer's day, not the instant's day where it is read
      test('names the calendar day a value stamped with its own zone offset stands for', async () => {
        const onChange = vi.fn();
        const { container } = render(
          <DateWidget {...makeWidgetMockProps({ value: '2020-05-03T00:00:00+02:00', onChange, schema })} />,
        );

        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');

        await openPicker(container);
        await user.click(screen.getByText('Done'));

        expect(onChange).toHaveBeenCalledWith('2020-05-03');
      });
    });

    // The `Date` constructor reads a year below 100 as a two-digit one, so building the day from its parts would name
    // 1950 here
    test('names a year below 100 as itself', () => {
      const { container } = render(
        <DateWidget {...makeWidgetMockProps({ value: '0050-05-03T00:00:00.000Z', schema })} />,
      );

      expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 50');
    });

    test('falls back to the title instead of an Invalid Date when the stored value is unparsable', () => {
      const { container } = render(
        <DateWidget {...makeWidgetMockProps({ value: 'not-a-date', label: 'When', placeholder: '', schema })} />,
      );

      const trigger = container.querySelector('button[aria-haspopup]');
      expect(trigger).toHaveTextContent('When');
      expect(trigger).not.toHaveTextContent('Invalid');
    });

    // RFC 3339 lets both the separator and the zone be lowercase, and neither an epoch number nor a `Date` is ISO text
    // at all, so none of them reach `parseISO` and all are read by `Date` instead
    test.each([
      ['a lowercase separator and zone', '2020-05-03t00:00:00z'],
      ['an epoch instant', Date.UTC(2020, 4, 3)],
      ['a Date of its own', new Date(2020, 4, 3)],
    ])('reads a value with %s as the day it names', (_, value) => {
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value, schema })} />);

      expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');
    });
  });

  // Dismissing the picker commits, so a value it could not read would otherwise be replaced by the empty value
  describe('a stored value it cannot read', () => {
    test.each([
      ['dismissed with a click outside', async () => user.click(document.body)],
      ['dismissed with the Done button', async () => user.click(screen.getByText('Done'))],
    ])('survives a picker %s', async (_, dismiss) => {
      const onChange = vi.fn();
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: 'not-a-date', onChange, schema })} />);

      await openPicker(container);
      await dismiss();

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // Escape is the one way out of the popup that does not commit, so the day the user was trying out has to go with it
  test('discards the day Escape closes the picker on, and does not commit it later either', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { birthday: { ...schema, title: 'Birthday' } } }}
        formData={{ birthday: '2020-05-03' }}
        validator={validator}
        onChange={onChange}
      />,
    );

    await openPicker(container);
    await user.click(screen.getByRole('button', { name: /May 17th/ }));
    await user.keyboard('{Escape}');

    expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');
    expect(onChange).not.toHaveBeenCalled();

    // The discarded day would otherwise still be in local state, and the next close commits whatever that holds
    await openPicker(container);
    await user.click(document.body);

    expect(onChange.mock.calls[0]?.[0].formData).toEqual({ birthday: '2020-05-03' });
  });

  // Nothing about the picker is read-only in itself, so the trigger is the only place either flag can be honored
  describe.each([
    ['disabled', { disabled: true }],
    ['read-only', { readonly: true }],
  ])('a %s field', (_, flags) => {
    test('cannot be opened, so cannot be committed over', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateWidget {...makeWidgetMockProps({ value: '2020-05-03', onChange, schema, ...flags })} />,
      );

      await user.click(container.querySelector('button[aria-haspopup]')!);

      expect(screen.queryByText('Done')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // The trigger's name comes partly from the label `FieldTemplate` renders, so these go through a `Form`
  describe('the trigger it renders', () => {
    const dateSchema = { type: 'object' as const, properties: { birthday: { ...schema, title: 'Birthday' } } };

    test('is named by the label once when no date is selected', () => {
      render(<Form schema={dateSchema} validator={validator} />);

      expect(screen.getByRole('button', { name: 'Birthday' })).toHaveAccessibleName('Birthday');
    });

    // The label names the button through `htmlFor`, which replaces the button's own contents, so the day it displays
    // would otherwise never be announced
    test('describes itself with the selected date, which its name replaces', () => {
      render(<Form schema={dateSchema} formData={{ birthday: '2020-05-03' }} validator={validator} />);

      const trigger = screen.getByRole('button', { name: 'Birthday' });
      expect(trigger).toHaveAccessibleName('Birthday');
      expect(trigger).toHaveAccessibleDescription('May 3, 2020');
    });

    // Naming the trigger by reference instead would point at an id only this theme's `FieldTemplate` renders, leaving
    // the button named by its own contents — the date alone — under any other one
    test('is named by the label of a replacement FieldTemplate', () => {
      render(
        <Form
          schema={dateSchema}
          formData={{ birthday: '2020-05-03' }}
          validator={validator}
          templates={{
            FieldTemplate: ({ id, label, children }) => (
              <div>
                <label htmlFor={id}>{label}</label>
                {children}
              </div>
            ),
          }}
        />,
      );

      expect(screen.getByRole('button', { name: 'Birthday' })).toHaveAccessibleDescription('May 3, 2020');
    });

    // There is no label element to point at, so the trigger's contents are its whole name. Rendering nothing would
    // leave a control that is both blank and unnamed
    test('falls back to the label for its text, and so its name, where the label is hidden', () => {
      render(
        <Form schema={dateSchema} uiSchema={{ birthday: { 'ui:options': { label: false } } }} validator={validator} />,
      );

      expect(screen.queryByText('Birthday', { selector: 'label span' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Birthday' })).toHaveTextContent('Birthday');
    });

    // `<label for>` only associates with a labelable element, so a trigger that is not a real control is named by
    // the label without being reachable from it
    test('is opened by a click on the label naming it', async () => {
      const { container } = render(<Form schema={dateSchema} validator={validator} />);

      await user.click(container.querySelector('label[for="root_birthday"]')!);

      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    // The browser forwards the label's click to the trigger, so a press treated as one outside the popup closes it
    // first and the trigger opens it straight back: the label could never close it at all
    test.each([
      ['label', (container: HTMLElement) => container.querySelector('label[for="root_birthday"]')!],
      ['trigger', (container: HTMLElement) => container.querySelector('button[aria-haspopup]')!],
    ])('is closed again, committing its day, by a second click on the %s', async (_, press) => {
      const onChange = vi.fn();
      const { container } = render(
        <Form schema={dateSchema} formData={{ birthday: '2020-05-03' }} validator={validator} onChange={onChange} />,
      );

      await openPicker(container);
      await user.click(screen.getByRole('button', { name: /May 17th/ }));
      onChange.mockClear();
      await user.click(press(container));

      expect(screen.queryByText('Done')).not.toBeInTheDocument();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ birthday: '2020-05-17' });
    });

    // With no label element the trigger's contents are its own name, so referencing them as well would have the date
    // announced twice — once as the name and once as the description
    test('does not describe itself with its own name where there is no label', () => {
      const { container } = render(<Form schema={schema} formData='2020-05-03' validator={validator} />);

      const trigger = container.querySelector('button[aria-haspopup]')!;
      expect(trigger).toHaveAccessibleName('May 3, 2020');
      expect(trigger.getAttribute('aria-describedby')).not.toContain('__value');
    });

    test('shows the label rather than the schema title, which ui:title overrides', () => {
      render(<Form schema={dateSchema} uiSchema={{ birthday: { 'ui:title': 'DOB' } }} validator={validator} />);

      expect(screen.getByRole('button', { name: 'DOB' })).toBeInTheDocument();
    });
  });

  test('leaves an optional field untouched when the picker closes with no date chosen', async () => {
    const onError = vi.fn();
    const onSubmit = vi.fn();
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { when: { ...schema, title: 'When' } } }}
        validator={validator}
        onError={onError}
        onSubmit={onSubmit}
      />,
    );

    await openPicker(container);
    await user.click(screen.getByText('Done'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData.when).toBeUndefined();
  });

  test('the committed value satisfies the field format, so submitting reports no error', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Form
        schema={{ type: 'object', required: ['when'], properties: { when: { ...schema, title: 'When' } } }}
        validator={validator}
        onSubmit={onSubmit}
        onError={onError}
      />,
    );

    await openPicker(container);
    await user.click(screen.getByRole('button', { name: /17th/ }));
    await user.click(screen.getByText('Done'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData.when).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
