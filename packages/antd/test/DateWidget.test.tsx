import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { fireEvent, render } from '@testing-library/react';

import DateWidget from '../src/widgets/DateWidget/index.tsx';

const schema: RJSFSchema = { type: 'string', format: 'iso-date-time' };

function makeProps(overrides: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    value: '',
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    label: 'Date',
    schema,
    options: {},
    rawErrors: [],
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    registry: { formContext: {} },
    ...overrides,
  } as unknown as WidgetProps;
}

describe('DateWidget with schema.format = iso-date-time', () => {
  test('formats a picked date-time as a naive local string without a timezone offset', () => {
    const onChange = vi.fn();
    const { container } = render(<DateWidget {...makeProps({ onChange })} showTime />);

    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '2016-04-05 14:01:30' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30');
  });
});

describe('DateWidget with schema.format = date-time', () => {
  test('still formats a picked date-time as a UTC ISO string with a timezone offset', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateWidget {...makeProps({ onChange, schema: { type: 'string', format: 'date-time' } })} showTime />,
    );

    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '2016-04-05 14:01:30' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^2016-04-05T\d{2}:\d{2}:30\.\d{3}Z$/));
  });
});

describe('DateWidget with a stored offset value for iso-date-time', () => {
  test('displays the naive wall-clock time instead of converting the instant to local time', () => {
    const { container } = render(<DateWidget {...makeProps({ value: '2016-04-05T14:01:30.000Z' })} showTime />);

    const input = container.querySelector('input')!;
    expect(input).toHaveValue('2016-04-05 14:01:30');
  });
});
