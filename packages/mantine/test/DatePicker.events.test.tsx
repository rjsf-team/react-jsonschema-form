import { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { WidgetProps } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Templates from '../src/templates/index.ts';
import DateTimeWidget from '../src/widgets/DateTime/DateTimeWidget.tsx';
import DateWidget from '../src/widgets/DateTime/DateWidget.tsx';

const user = userEvent.setup();

function makeProps(props: Partial<WidgetProps>): WidgetProps {
  return {
    id: 'date',
    name: 'date',
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    label: 'Date',
    hideLabel: false,
    rawErrors: [],
    options: {},
    schema: { type: 'string', format: 'date' },
    value: '2020-05-03',
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    registry: getTestRegistry(undefined, {}, Templates, {}),
    ...props,
  };
}

describe.each([
  ['date', DateWidget, 'date', '2020-05-03', '2020-05-17', '2020-05-17'],
  ['date-time', DateTimeWidget, 'iso-date-time', '2020-05-03T10:30:00', '2020-05-17T11:45:00', '2020-05-17T11:45:00'],
] as const)('%s picker events', (_, Widget, format, initial, typed, proposal) => {
  test.each(['accept', 'transform', 'reject'])(
    'reports typed changes immediately and blurs with the %s parent value',
    async (mode) => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      function Controlled() {
        const [value, setValue] = useState<string>(initial);
        return (
          <MantineProvider>
            <Widget
              {...makeProps({
                schema: { type: 'string', format },
                value,
                onBlur,
                onChange: (next: string) => {
                  onChange(next);
                  if (mode !== 'reject') {
                    setValue(mode === 'transform' ? initial : next);
                  }
                },
              })}
            />
            <input aria-label='Outside' />
          </MantineProvider>
        );
      }
      const { container } = render(<Controlled />);
      const input = container.querySelector<HTMLInputElement>('input#date')!;
      await user.click(input);
      await user.clear(input);
      await user.paste(typed);
      expect(onChange).toHaveBeenCalledWith(proposal);
      expect(onBlur).not.toHaveBeenCalled();
      onChange.mockClear();
      await user.click(screen.getByLabelText('Outside'));
      expect(onChange).not.toHaveBeenCalled();
      expect(onBlur.mock.calls).toEqual([['date', mode === 'accept' ? proposal : initial]]);
    },
  );
});

test('calendar selection changes immediately without blurring the input', async () => {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  const { container } = render(
    <MantineProvider>
      <DateWidget {...makeProps({ onChange, onBlur })} />
      <input aria-label='Outside' />
    </MantineProvider>,
  );
  const input = container.querySelector<HTMLInputElement>('input#date')!;
  await user.click(input);
  await user.click(await screen.findByRole('button', { name: /17 May 2020/ }));
  expect(onChange).toHaveBeenCalledWith('2020-05-17');
  expect(onBlur).not.toHaveBeenCalled();
  expect(input).toHaveFocus();
  await user.click(screen.getByLabelText('Outside'));
  expect(onBlur).toHaveBeenCalledTimes(1);
});
