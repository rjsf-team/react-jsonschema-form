import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import pinTimeZone from '../../../testing/pinTimeZone.ts';
import DateWidget from '../src/widgets/DateWidget/index.tsx';

// The date-time tests paste rather than type: each keystroke re-renders antd's picker, slow enough on a loaded CI
// runner to near the 5s default timeout
const user = userEvent.setup();

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
  test('formats a picked date-time as a naive local string without a timezone offset', async () => {
    const onChange = vi.fn();
    const { container } = render(<DateWidget {...makeProps({ onChange })} showTime />);

    const input = container.querySelector('input')!;
    await user.click(input);
    await user.paste('2016-04-05 14:01:30');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30');
  });
});

describe('DateWidget with schema.format = date-time', () => {
  test('still formats a picked date-time as a UTC ISO string with a timezone offset', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateWidget {...makeProps({ onChange, schema: { type: 'string', format: 'date-time' } })} showTime />,
    );

    const input = container.querySelector('input')!;
    await user.click(input);
    await user.paste('2016-04-05 14:01:30');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^2016-04-05T\d{2}:\d{2}:30\.\d{3}Z$/));
  });
});

describe('DateWidget with a bare day stored for iso-date-time', () => {
  // West of UTC, a day read as UTC midnight shows as the day before
  pinTimeZone('America/Los_Angeles');

  describe.each([
    { showTime: true, expected: '2020-05-03 00:00:00' },
    { showTime: false, expected: '2020-05-03' },
  ])('with showTime=$showTime', ({ showTime, expected }) => {
    test.each(['2020-05-03', '2020-05-03+02:00'])(`displays %s as ${expected}`, (value) => {
      const { container } = render(<DateWidget {...makeProps({ value })} showTime={showTime} />);

      expect(container.querySelector('input')).toHaveValue(expected);
    });
  });
});

describe('DateWidget with a stored offset value for iso-date-time', () => {
  test('displays the naive wall-clock time instead of converting the instant to local time', () => {
    const { container } = render(<DateWidget {...makeProps({ value: '2016-04-05T14:01:30.000Z' })} showTime />);

    const input = container.querySelector('input')!;
    expect(input).toHaveValue('2016-04-05 14:01:30');
  });
});
