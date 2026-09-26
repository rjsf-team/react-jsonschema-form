import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import Form from '../src/index.ts';
import DateWidget from '../src/widgets/DateWidget/DateWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

const schema = { type: 'string' as const, format: 'date' };

/** Opens the picker from its trigger, which is the only `role=button` the widget renders */
async function openPicker(container: HTMLElement) {
  await user.click(container.querySelector('[role=button]')!);
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

    test('commits an empty string when there is no date', async () => {
      const onChange = vi.fn();
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '', onChange, schema })} />);

      await openPicker(container);
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('the day it displays', () => {
    test('displays the day the stored date names', () => {
      const { container } = render(<DateWidget {...makeWidgetMockProps({ value: '2020-05-03', schema })} />);

      expect(container.querySelector('[role=button]')).toHaveTextContent('May 3, 2020');
    });

    test('displays the same day for a value left over from when a UTC date-time was committed', () => {
      const { container } = render(
        <DateWidget {...makeWidgetMockProps({ value: '2020-05-03T00:00:00.000Z', schema })} />,
      );

      expect(container.querySelector('[role=button]')).toHaveTextContent('May 3, 2020');
    });

    test('falls back to the title instead of an Invalid Date when the stored value is unparsable', () => {
      const { container } = render(
        <DateWidget {...makeWidgetMockProps({ value: 'not-a-date', schema: { ...schema, title: 'When' } })} />,
      );

      const trigger = container.querySelector('[role=button]');
      expect(trigger).toHaveTextContent('When');
      expect(trigger).not.toHaveTextContent('Invalid');
    });
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
