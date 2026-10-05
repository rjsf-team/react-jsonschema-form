import { useState } from 'react';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import DateWidget from '../src/widgets/DateWidget/DateWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';
import pinTimeZone from './helpers/pinTimeZone.ts';

const user = userEvent.setup();

const schema = { type: 'string' as const, format: 'date' };

/** Opens the picker from its trigger, the one button that opens a popup — the calendar renders more */
async function openPicker(container: HTMLElement) {
  await user.click(container.querySelector('button[aria-haspopup]')!);
}

/** Picks a day other than the stored one, since closing the picker stores what it holds only where the user chose it.
 * A day cell is a button named by its full date, e.g. "Sunday, May 17th, 2020"
 *
 * @param [year=2020] - The year the calendar is showing, which is the current one for a field holding no date
 */
async function pickTheSeventeenth(year = 2020) {
  await user.click(screen.getByRole('button', { name: new RegExp(`17th, ${year}`) }));
}

describe('DateWidget', () => {
  test.each(['pointercancel', 'window blur'] as const)(
    'finishes an outside press interrupted by %s once',
    async (kind) => {
      const onBlur = vi.fn();
      const props = makeWidgetMockProps({ value: '2020-05-03', onBlur, schema });
      const { container, rerender } = render(
        <>
          <DateWidget {...props} />
          <input aria-label='Elsewhere' />
        </>,
      );
      await openPicker(container);
      await pickTheSeventeenth();
      await user.pointer({ keys: '[MouseLeft>]', target: screen.getByLabelText('Elsewhere') });
      rerender(
        <>
          <DateWidget {...props} value='2020-05-17' />
          <input aria-label='Elsewhere' />
        </>,
      );
      expect(onBlur).not.toHaveBeenCalled();
      if (kind === 'pointercancel') {
        fireEvent.pointerCancel(document);
      } else {
        fireEvent(window, new Event('blur'));
      }
      expect(onBlur).toHaveBeenCalledExactlyOnceWith(props.id, '2020-05-17');
      await user.pointer({ keys: '[/MouseLeft]' });
      expect(onBlur).toHaveBeenCalledTimes(1);
    },
  );

  test.each(['accept', 'transform', 'reject'] as const)(
    'reports the %s parent value on outside release without an Effect notification',
    async (mode) => {
      const onBlur = vi.fn();
      function Parent() {
        const [value, setValue] = useState('2020-05-03');
        return (
          <>
            <DateWidget
              {...makeWidgetMockProps({
                value,
                schema,
                onBlur,
                onChange: (next: string) => {
                  if (mode !== 'reject') {
                    setValue(mode === 'transform' ? '2020-05-20' : next);
                  }
                },
              })}
            />
            <input aria-label='Elsewhere' />
          </>
        );
      }
      const { container } = render(<Parent />);
      await openPicker(container);
      await pickTheSeventeenth();
      await user.pointer({ keys: '[MouseLeft>]', target: screen.getByLabelText('Elsewhere') });
      expect(onBlur).not.toHaveBeenCalled();
      await user.pointer({ keys: '[/MouseLeft]' });
      const acceptedValues = { accept: '2020-05-17', transform: '2020-05-20', reject: '2020-05-03' };
      const expected = acceptedValues[mode];
      expect(onBlur).toHaveBeenCalledExactlyOnceWith('test-id', expected);
    },
  );

  test.each([
    { name: 'Done', close: async () => user.click(screen.getByText('Done')), accepted: '2020-05-17' },
    { name: 'Escape', close: async () => user.keyboard('{Escape}'), accepted: '2020-05-03' },
  ])('reports one native blur after $name returns focus to the trigger', async ({ close, accepted }) => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const props = makeWidgetMockProps({ value: '2020-05-03', onChange, onBlur, schema });
    const { container, rerender } = render(<DateWidget {...props} />);

    await openPicker(container);
    await pickTheSeventeenth();
    await close();

    expect(container.querySelector('button[aria-haspopup]')).toHaveFocus();
    expect(onBlur).not.toHaveBeenCalled();
    // Echo the accepted value before the next user event, as a controlled parent does.
    rerender(<DateWidget {...props} value={accepted} />);
    await user.tab();

    expect(onBlur).toHaveBeenCalledExactlyOnceWith(props.id, accepted);
  });

  // These assertions are the timezone-robust half: `toISOString()` never produces a `YYYY-MM-DD` string, so they
  // fail in every zone, where the display assertions below only failed in a zone behind UTC
  describe('the value it commits', () => {
    test.each([
      ['the Done button', async () => user.click(screen.getByText('Done'))],
      ['a click outside', async () => user.click(document.body)],
    ])('commits the selected day as a date, not a UTC date-time, when closed by %s', async (_, close) => {
      const onChange = vi.fn();
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05-03', onChange, schema })} />);

      await openPicker(container);
      await pickTheSeventeenth();
      await close();

      expect(onChange).toHaveBeenCalledWith('2020-05-17');
    });

    // A value that arrived from the parent is not one the user was in the middle of choosing
    test('drops a pick made against a value the parent has since replaced', async () => {
      const onChange = vi.fn();
      const { container, rerender } = render(
        <DateWidget {...makeWidgetMockProps({ value: '2020-05-03', onChange, schema })} />,
      );

      await openPicker(container);
      await pickTheSeventeenth();
      rerender(<DateWidget {...makeWidgetMockProps({ value: '2021-01-10', onChange, schema })} />);

      expect(screen.getByRole('button', { name: /January 10th, 2021, selected/ })).toBeInTheDocument();
      await user.click(screen.getByText('Done'));
      expect(onChange).not.toHaveBeenCalled();
    });

    test('drops a pick when the parent replaces the value and then restores it', async () => {
      const onChange = vi.fn();
      const { container, rerender } = render(<DateWidget {...makeWidgetMockProps({ value: '', onChange, schema })} />);

      await openPicker(container);
      await pickTheSeventeenth(new Date().getFullYear());
      rerender(<DateWidget {...makeWidgetMockProps({ value: '2021-01-10', onChange, schema })} />);
      rerender(<DateWidget {...makeWidgetMockProps({ value: '', onChange, schema })} />);

      await user.click(screen.getByText('Done'));
      // A `''` is the one value Done rewrites without a pick, and it rewrites it to the empty value
      expect(onChange.mock.calls).toEqual([[undefined]]);
    });

    test('commits the empty value, not an empty string, when there is no date', async () => {
      const onChange = vi.fn();
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '', onChange, schema })} />);

      await openPicker(container);
      await user.click(screen.getByText('Done'));

      // `''` is not a `date`, so committing it would fail the format of a field the user never filled in
      expect(onChange).toHaveBeenCalledWith(undefined);
    });

    // Reported as a change, an open and a dismiss the user made no edit in would show up in a dirty-state check, an
    // autosave or an analytics hook as one they never made
    // A field holding nothing is already empty, whatever `ui:emptyValue` would spell that as — including the `''` that
    // dismissing a picker exists to replace
    test.each([
      ['no ui:emptyValue', {}],
      ['an empty string ui:emptyValue', { emptyValue: '' }],
      ['a null ui:emptyValue', { emptyValue: null }],
    ])('reports no change at all for a field holding nothing, with %s', async (_, options) => {
      const onChange = vi.fn();
      const { container } = render(
        <DateWidget {...makeWidgetMockProps({ value: undefined, onChange, schema, options })} />,
      );

      await openPicker(container);
      await user.click(screen.getByText('Done'));

      expect(onChange).not.toHaveBeenCalled();
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

    // Each shape of stored value only goes wrong on one side of UTC, so both of these pin a zone. Without pinning they
    // would pass in CI's UTC and catch nothing. Assigning `TZ` is enough under vitest's default `forks` pool, where
    // Node re-reads it per call; in a `worker_threads` worker `process.env` is a copy and the assignment would do
    // nothing, which the `not.toBe()` below catches
    describe.each([
      ['ahead of UTC', 'Europe/Berlin'],
      ['behind UTC', 'America/Los_Angeles'],
    ])('in a timezone %s', (_, timeZone) => {
      pinTimeZone(timeZone);

      test('names the day a UTC instant that is a local midnight stands for', () => {
        // A picked 3 May stored as the `toISOString()` of local midnight, so a time of day that is not UTC midnight,
        // and in a zone ahead of UTC a different date than the one the user picked
        const localMidnight = new Date(2020, 4, 3).toISOString();
        const { container } = render(<DateWidget {...makeWidgetMockProps({ value: localMidnight, schema })} />);

        // Pinning `TZ` is what makes this a different instant from UTC midnight, and so a different reading rule
        expect(localMidnight).not.toBe('2020-05-03T00:00:00.000Z');
        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');
      });

      // Read as an instant these would each name the previous day somewhere: a UTC midnight everywhere behind UTC,
      // and a noon one far enough east. The day each of them names is the one its own text spells
      test.each([
        // What a backend emits for a date, and what this widget committed for a user in UTC
        ['a UTC midnight value', '2020-05-03T00:00:00.000Z'],
        // RFC 3339 also allows a space where the `T` goes, which is what an SQL backend emits by default
        ['a UTC midnight value with a space separator', '2020-05-03 00:00:00Z'],
        // The convention a backend storing a day as an instant uses to keep it clear of both zone edges
        ['a midday UTC value', '2020-05-03T12:00:00Z'],
        // A zone of its own is one this widget never writes — `toISOString()` only ever writes `Z`
        ['a value stamped with its own zone offset', '2020-05-03T00:00:00+02:00'],
        // 22:00Z, which is midnight in Berlin on the *fourth*: the shape the local-midnight rule exists for looks
        // exactly like this one from here, and the offset is what tells them apart
        ['a value whose own offset lands on local midnight here', '2020-05-03T18:00:00-04:00'],
      ])('names the calendar day %s stands for', (_, value) => {
        const { container } = render(<DateWidget {...makeWidgetMockProps({ value, schema })} />);

        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');
      });

      // Opening the picker and dismissing it is not an edit, and the day it reads out of a date-time is not always the
      // day the instant lands on where it is read: writing it back would move the stored day for readers far enough
      // from the zone it was written in
      test.each([
        ['the Done button', async () => user.click(screen.getByText('Done'))],
        ['a click outside', async () => user.click(document.body)],
      ])('leaves a stored date-time alone when the picker is dismissed by %s', async (_, close) => {
        const onChange = vi.fn();
        const { container } = render(
          <DateWidget {...makeWidgetMockProps({ value: '2020-05-03T12:00:00Z', onChange, schema })} />,
        );

        await openPicker(container);
        await close();

        expect(onChange).not.toHaveBeenCalled();
      });

      // Picking a day is the request to store one, and this field's format has no room for the time the old value
      // carried
      test('rewrites a stored date-time as a date once the user picks a day', async () => {
        const onChange = vi.fn();
        const { container } = render(
          <DateWidget {...makeWidgetMockProps({ value: '2020-05-03T12:00:00Z', onChange, schema })} />,
        );

        await openPicker(container);
        await pickTheSeventeenth();
        await user.click(screen.getByText('Done'));

        expect(onChange).toHaveBeenCalledWith('2020-05-17');
      });

      // Its text names no day at all, so the day is the one the `Date` constructor resolves it to
      test('names the first of the month for a value that stops at the month', () => {
        const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05', schema })} />);

        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 1, 2020');
      });
    });

    // The one zone where the two rules above cannot both hold — `parseDateValue()`'s own doc has the argument, and
    // #5395 is the fix. These two tests are what keeps the reading it settles on from being changed by accident: the
    // second value is the first's text to the millisecond, so whichever way the rule reads one, it reads the other
    describe('in a timezone exactly twelve hours ahead of UTC', () => {
      pinTimeZone('Pacific/Auckland');

      test('reads a midday UTC value as the local day its instant begins, not the day its text spells', () => {
        const { container } = render(
          <DateWidget {...makeWidgetMockProps({ value: '2020-05-03T12:00:00Z', schema })} />,
        );

        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 4, 2020');
      });

      // The reading the case above pays for: this is the same text, to the millisecond
      test('names the day a value stored from here stands for', () => {
        const localMidnight = new Date(2020, 4, 3).toISOString();
        const { container } = render(<DateWidget {...makeWidgetMockProps({ value: localMidnight, schema })} />);

        expect(localMidnight).toBe('2020-05-02T12:00:00.000Z');
        expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');
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

    // Every shape above the `T` is optional for an engine to accept, and an offset given as hours alone is one no
    // engine here parses, so the day has to come from the text rather than from the instant nobody could build
    test('names the day the text spells where the engine cannot read the value as an instant', () => {
      const value = '2020-05-03T20:00:00-04';

      expect(new Date(value).toString()).toBe('Invalid Date');

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

    // The discarded day would otherwise still be in local state, and the next close would store whatever that holds
    await openPicker(container);
    await user.click(document.body);

    expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');
    expect(onChange).not.toHaveBeenCalled();
  });

  // Escape unmounts the popup from under whatever inside it holds focus, which would fall to the document body and
  // lose a keyboard user their place in the form
  test('returns focus to the trigger when Escape closes the picker from inside it', async () => {
    const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05-03', schema })} />);
    const trigger = container.querySelector('button[aria-haspopup]')!;

    await openPicker(container);
    await pickTheSeventeenth();
    await user.keyboard('{Escape}');

    expect(trigger).toHaveFocus();
  });

  // A form that does not take what the picker committed — one rendering `formData` it holds itself, or normalizing the
  // value back to the one it already had — leaves the widget's props unchanged, and nothing else would bring the
  // trigger back to the day the form actually holds
  test('goes back to the stored day where the form does not take the day it committed', async () => {
    const onChange = vi.fn();
    const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05-03', onChange, schema })} />);

    await openPicker(container);
    await pickTheSeventeenth();
    await user.click(screen.getByText('Done'));

    expect(onChange).toHaveBeenCalledWith('2020-05-17');
    expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020');

    // Reopening on the discarded day would offer to commit it again, from a calendar the form never agreed to
    await openPicker(container);

    expect(screen.getByRole('button', { name: /May 3rd, 2020, selected/ })).toBeInTheDocument();
  });

  // The playground renders the form into an iframe, which is a document away from the one this module runs in: a press
  // or a key inside it never reaches listeners bound to ours, leaving Done and the trigger the only ways out
  test('closes on Escape raised in the document it was rendered into', async () => {
    const frame = document.body.appendChild(document.createElement('iframe'));
    const frameDocument = frame.contentDocument!;
    const frameUser = userEvent.setup({ document: frameDocument });
    const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05-03', schema })} />, {
      container: frameDocument.body.appendChild(frameDocument.createElement('div')),
      baseElement: frameDocument.body,
    });

    await frameUser.click(container.querySelector('button[aria-haspopup]')!);
    expect(frameDocument.querySelector('.date-picker-popup')).not.toBeNull();

    await frameUser.keyboard('{Escape}');
    expect(frameDocument.querySelector('.date-picker-popup')).toBeNull();

    frame.remove();
  });

  // Reopening on the month the user just left would show them the calendar they discarded rather than the one the
  // stored value names — and for an empty field the month is never reset by the stored day, since there is none
  test('reopens on the current month after Escape discards a month the user navigated to', async () => {
    const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '', schema })} />);
    const thisYear = String(new Date().getFullYear());

    await openPicker(container);
    const [, yearBefore] = [...document.querySelectorAll('select')];
    await user.selectOptions(yearBefore, '2000');
    await user.keyboard('{Escape}');
    await openPicker(container);

    const [, yearAfter] = [...document.querySelectorAll('select')];
    expect(yearAfter).toHaveValue(thisYear);
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

  // A date the user cannot change is still one they read, and the `disabled` attribute would take the button holding
  // it out of the tab order
  test('leaves a read-only field reachable by keyboard, where a disabled one is not', () => {
    const { container: readOnly } = render(
      <DateWidget {...makeWidgetMockProps({ value: '2020-05-03', schema, readonly: true })} />,
    );
    const { container: disabled } = render(
      <DateWidget {...makeWidgetMockProps({ value: '2020-05-03', schema, disabled: true })} />,
    );

    expect(readOnly.querySelector('button[aria-haspopup]')).not.toBeDisabled();
    expect(readOnly.querySelector('button[aria-haspopup]')).toHaveAttribute('aria-disabled', 'true');
    expect(disabled.querySelector('button[aria-haspopup]')).toBeDisabled();
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

  // `widgetMap` resolves `ui:widget: 'date'` on any string schema, whatever `format` it declares, so this widget can
  // be asked to fill a field a day on its own does not satisfy
  describe('a field whose format is not date', () => {
    test.each([
      ['date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/],
      ['iso-date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/],
      // A format neither picker can spell is one this widget has no better answer for than its own shape, which is
      // the likelier of the two to satisfy a dialect of `date` somebody registered with ajv under another name
      ['full-date', /^\d{4}-\d{2}-\d{2}$/],
    ])('commits the shape a %s field declares, and so submits without error', async (formatName, shape) => {
      const onSubmit = vi.fn();
      const onError = vi.fn();
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { when: { type: 'string', format: formatName, title: 'When' } } }}
          uiSchema={{ when: { 'ui:widget': 'date' } }}
          validator={validator}
          onSubmit={onSubmit}
          onError={onError}
        />,
      );

      await openPicker(container);
      await pickTheSeventeenth(new Date().getFullYear());
      await user.click(screen.getByText('Done'));
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(onError).not.toHaveBeenCalled();
      expect(onSubmit.mock.calls[0][0].formData.when).toMatch(shape);
    });
  });

  // A field with no title leaves `FieldTemplate` no label to render, so the trigger has neither a name from outside nor
  // contents of its own to be named by
  test('names an untitled field with no value by the translated prompt', () => {
    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelector('button[aria-haspopup]')).toHaveAccessibleName('Select a date');
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
