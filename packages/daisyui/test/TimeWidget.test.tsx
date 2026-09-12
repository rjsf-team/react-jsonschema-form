import { render, fireEvent } from '@testing-library/react';

import TimeWidget from '../src/widgets/TimeWidget/TimeWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

describe('TimeWidget', () => {
  test('strips a timezone offset from the value for display', () => {
    const { container } = render(<TimeWidget {...makeWidgetMockProps({ value: '13:10:30+02:00' })} />);
    expect(container.querySelector<HTMLInputElement>('[type=time]')).toHaveValue('13:10:30');
  });

  test('appends the local timezone offset and pads seconds when the value is changed', () => {
    const onChange = vi.fn();
    const { container } = render(<TimeWidget {...makeWidgetMockProps({ value: '', onChange })} />);

    fireEvent.change(container.querySelector<HTMLInputElement>('[type=time]')!, { target: { value: '11:10' } });

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^11:10:00(?:Z|[+-]\d{2}:\d{2})$/));
  });

  test('calls onChange with an empty string when cleared', () => {
    const onChange = vi.fn();
    const { container } = render(<TimeWidget {...makeWidgetMockProps({ value: '11:10:00Z', onChange })} />);

    fireEvent.change(container.querySelector<HTMLInputElement>('[type=time]')!, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith('');
  });

  describe('with schema.format = iso-time', () => {
    const schema = { type: 'string' as const, format: 'iso-time' };

    test('pads seconds but does not add a timezone offset when the value is changed', () => {
      const onChange = vi.fn();
      const { container } = render(<TimeWidget {...makeWidgetMockProps({ value: '', onChange, schema })} />);

      fireEvent.change(container.querySelector<HTMLInputElement>('[type=time]')!, { target: { value: '11:10' } });

      expect(onChange).toHaveBeenCalledWith('11:10:00');
    });

    test('displays a stored value as-is', () => {
      const { container } = render(<TimeWidget {...makeWidgetMockProps({ value: '13:10:30', schema })} />);
      expect(container.querySelector<HTMLInputElement>('[type=time]')).toHaveValue('13:10:30');
    });

    test('still strips a timezone offset from a stored value for display', () => {
      const { container } = render(<TimeWidget {...makeWidgetMockProps({ value: '13:10:30+02:00', schema })} />);
      expect(container.querySelector<HTMLInputElement>('[type=time]')).toHaveValue('13:10:30');
    });
  });
});
