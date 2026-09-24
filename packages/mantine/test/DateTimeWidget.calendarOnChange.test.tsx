import { MantineProvider } from '@mantine/core';
import type * as MantineDates from '@mantine/dates';
import type { WidgetProps } from '@rjsf/utils';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

// `DateInput`'s `onChange` passes a plain `YYYY-MM-DD` string (Mantine's `DateStringValue`) for the primary
// calendar-click and preset interactions, not a `Date`; only the typed-input path (exercised in
// DateTimeWidget.test.tsx) produces a real `Date`. Driving the real popover isn't practical in this test
// environment, so `DateInput` is mocked to invoke `onChange` the way the calendar-click path actually does.
// This lives in its own file since `vi.mock` is hoisted module-wide and would affect DateTimeWidget.test.tsx's
// other tests, which rely on the real `DateInput`.
vi.mock('@mantine/dates', async (importOriginal) => {
  const actual = await importOriginal<typeof MantineDates>();
  return {
    ...actual,
    DateInput: (props: { onChange?: (value: string | null) => void }) => (
      <button type='button' onClick={() => props.onChange?.('2024-01-15')}>
        pick date
      </button>
    ),
  };
});

const { default: DateTimeWidget } = await import('../src/widgets/DateTime/DateTimeWidget.tsx');

const user = userEvent.setup();

function makeProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    value: '',
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    label: 'DateTime',
    hideLabel: false,
    rawErrors: [],
    options: {},
    schema: { type: 'string', format: 'date-time' },
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    ...props,
  } as unknown as WidgetProps;
}

describe('DateTimeWidget calendar-click onChange', () => {
  test('commits a value with a timezone offset when the calendar passes a date string for format=date-time', async () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <MantineProvider>
        <DateTimeWidget {...makeProps({ onChange })} />
      </MantineProvider>,
    );

    await user.click(getByText('pick date'));

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^2024-01-1[45]T\d{2}:\d{2}:00(?:\.\d{3})?Z$/));
  });
});
