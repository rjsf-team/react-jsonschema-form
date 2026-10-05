import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import DateTimeWidget from '../src/widgets/DateTimeWidget/DateTimeWidget.tsx';
import DateWidget from '../src/widgets/DateWidget/DateWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe.each([
  ['date', DateWidget, 'date', '2020-05-03', '2020-05-17'],
  ['date-time', DateTimeWidget, 'iso-date-time', '2020-05-03T10:30:00', '2020-05-17T10:30:00'],
] as const)('%s picker events', (_, Widget, format, initial, proposal) => {
  test.each(['accept', 'transform', 'reject'])(
    'changes immediately and blurs with the %s parent value',
    async (mode) => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      const onFocus = vi.fn();
      function Controlled() {
        const [value, setValue] = useState<string>(initial);
        return (
          <>
            <Widget
              {...makeWidgetMockProps({
                id: 'date',
                value,
                schema: { type: 'string', format },
                onBlur,
                onFocus,
                autofocus: false,
                onChange: (next: string) => {
                  onChange(next);
                  if (mode !== 'reject') {
                    setValue(mode === 'transform' ? initial : next);
                  }
                },
              })}
            />
            <input aria-label='Outside' />
          </>
        );
      }
      const { container } = render(<Controlled />);
      await user.click(container.querySelector('button[aria-haspopup]')!);
      await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
      expect(onChange.mock.calls).toEqual([[proposal]]);
      expect(onBlur).not.toHaveBeenCalled();
      expect(onFocus).toHaveBeenCalledTimes(1);
      await user.click(screen.getByText('Done'));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onBlur).not.toHaveBeenCalled();
      await user.tab();
      expect(screen.getByLabelText('Outside')).toHaveFocus();
      expect(onBlur.mock.calls).toEqual([['date', mode === 'accept' ? proposal : initial]]);
    },
  );

  test.each(['Done', 'Escape', 'outside'])(
    '%s only closes, without another change or synthetic blur',
    async (action) => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      const { container } = render(
        <>
          <Widget
            {...makeWidgetMockProps({
              value: initial,
              schema: { type: 'string', format },
              onChange,
              onBlur,
              autofocus: false,
            })}
          />
          <input aria-label='Outside' />
        </>,
      );
      await user.click(container.querySelector('button[aria-haspopup]')!);
      await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
      expect(onChange.mock.calls).toEqual([[proposal]]);
      if (action === 'Done') {
        await user.click(screen.getByText('Done'));
      } else if (action === 'Escape') {
        await user.keyboard('{Escape}');
      } else {
        await user.click(screen.getByLabelText('Outside'));
      }
      expect(screen.queryByText('Done')).not.toBeInTheDocument();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(action === 'outside' ? 1 : 0);
    },
  );
});

test('date-time edits immediately report the time on the accepted day', async () => {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  function Controlled() {
    const [value, setValue] = useState('2020-05-03T10:30:00');
    return (
      <DateTimeWidget
        {...makeWidgetMockProps({
          value,
          schema: { type: 'string', format: 'iso-date-time' },
          onBlur,
          onChange: (next: string) => {
            onChange(next);
            setValue(next);
          },
        })}
      />
    );
  }
  const { container } = render(<Controlled />);
  await user.click(container.querySelector('button[aria-haspopup]')!);
  await user.click(screen.getByRole('button', { name: /May 17th, 2020/ }));
  fireEvent.change(container.querySelector('input[type="time"]')!, { target: { value: '11:45' } });
  expect(onChange.mock.calls).toEqual([['2020-05-17T10:30:00'], ['2020-05-17T11:45:00']]);
  expect(onBlur).not.toHaveBeenCalled();
});
