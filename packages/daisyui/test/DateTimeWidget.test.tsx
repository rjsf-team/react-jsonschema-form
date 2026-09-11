import { fireEvent, render, screen } from '@testing-library/react';

import DateTimeWidget from '../src/widgets/DateTimeWidget/DateTimeWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

describe('DateTimeWidget', () => {
  describe('with schema.format = iso-date-time', () => {
    const schema = { type: 'string' as const, format: 'iso-date-time' };

    test('commits the date-time as a naive local string without a timezone offset', () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30', onChange, schema })} />,
      );

      fireEvent.click(container.querySelector('[role=button]')!);
      fireEvent.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30');
    });

    test('parses a stored offset value as the naive wall-clock time instead of converting it to local time', () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      fireEvent.click(container.querySelector('[role=button]')!);
      fireEvent.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30');
    });
  });

  describe('with schema.format = date-time', () => {
    const schema = { type: 'string' as const, format: 'date-time' };

    test('still commits the date-time as a UTC ISO string with a timezone offset', () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      fireEvent.click(container.querySelector('[role=button]')!);
      fireEvent.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30.000Z');
    });

    test('commits an empty string instead of throwing when the stored value is unparsable', () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: 'not-a-date', onChange, schema })} />,
      );

      expect(() => {
        fireEvent.click(container.querySelector('[role=button]')!);
        fireEvent.click(screen.getByText('Done'));
      }).not.toThrow();

      expect(onChange).toHaveBeenCalledWith('');
    });
  });
});
