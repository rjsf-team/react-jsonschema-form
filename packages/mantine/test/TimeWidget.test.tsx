import { MantineProvider } from '@mantine/core';
import type { WidgetProps } from '@rjsf/utils';
import { render, fireEvent } from '@testing-library/react';

import TimeWidget from '../src/widgets/DateTime/TimeWidget.tsx';

function makeProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    value: '',
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    label: 'Time',
    hideLabel: false,
    rawErrors: [],
    options: {},
    schema: { type: 'string' },
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    ...props,
  } as unknown as WidgetProps;
}

function renderTimeWidget(props: Partial<WidgetProps> = {}) {
  return render(
    <MantineProvider>
      <TimeWidget {...makeProps(props)} />
    </MantineProvider>,
  );
}

describe('TimeWidget', () => {
  test('strips a timezone offset from the value for display', () => {
    const { container } = renderTimeWidget({ value: '13:10:30+02:00' });
    expect(container.querySelector<HTMLInputElement>('input#root')).toHaveValue('13:10:30');
  });

  test('appends the local timezone offset and pads seconds when the value is changed', () => {
    const onChange = vi.fn();
    const { container } = renderTimeWidget({ onChange });

    fireEvent.change(container.querySelector<HTMLInputElement>('input#root')!, { target: { value: '11:10' } });

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^11:10:00(?:Z|[+-]\d{2}:\d{2})$/));
  });

  test('calls onChange without a timezone offset when cleared', () => {
    const onChange = vi.fn();
    const { container } = renderTimeWidget({ value: '11:10:00Z', onChange });

    fireEvent.change(container.querySelector<HTMLInputElement>('input#root')!, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith('');
  });

  describe('with schema.format = iso-time', () => {
    const schema = { type: 'string' as const, format: 'iso-time' };

    test('pads seconds but does not add a timezone offset when the value is changed', () => {
      const onChange = vi.fn();
      const { container } = renderTimeWidget({ onChange, schema });

      fireEvent.change(container.querySelector<HTMLInputElement>('input#root')!, { target: { value: '11:10' } });

      expect(onChange).toHaveBeenCalledWith('11:10:00');
    });

    test('displays a stored value as-is', () => {
      const { container } = renderTimeWidget({ value: '13:10:30', schema });
      expect(container.querySelector<HTMLInputElement>('input#root')).toHaveValue('13:10:30');
    });

    test('still strips a timezone offset from a stored value for display', () => {
      const { container } = renderTimeWidget({ value: '13:10:30+02:00', schema });
      expect(container.querySelector<HTMLInputElement>('input#root')).toHaveValue('13:10:30');
    });
  });
});
