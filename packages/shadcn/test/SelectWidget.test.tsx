import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SelectWidget from '../src/SelectWidget';
import { makeWidgetMockProps } from './helpers/createMocks';

describe('SelectWidget', () => {
  test('single select is reachable from the tab order and opens with the keyboard', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label='before select' />
        <SelectWidget
          {...makeWidgetMockProps({
            autofocus: false,
            disabled: false,
            readonly: false,
            rawErrors: [],
            value: undefined,
            placeholder: 'Select a country',
            options: {
              enumOptions: [
                { label: 'United States', value: 'United States' },
                { label: 'Canada', value: 'Canada' },
              ],
            },
          })}
        />
        <button type='button'>After select</button>
      </>,
    );

    await user.tab();
    expect(screen.getByLabelText('before select')).toHaveFocus();

    await user.tab();
    const trigger = screen.getByRole('button', { name: /select a country/i });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Canada' })).toBeInTheDocument();
  });

  test('disabled single select trigger exposes disabled button semantics', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label='before select' />
        <SelectWidget
          {...makeWidgetMockProps({
            autofocus: false,
            disabled: true,
            readonly: false,
            rawErrors: [],
            value: undefined,
            placeholder: 'Select a country',
            options: {
              enumOptions: [
                { label: 'United States', value: 'United States' },
                { label: 'Canada', value: 'Canada' },
              ],
            },
          })}
        />
        <button type='button'>After select</button>
      </>,
    );

    const trigger = screen.getByRole('button', { name: /select a country/i });
    expect(trigger).toBeDisabled();

    await user.tab();
    expect(screen.getByLabelText('before select')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'After select' })).toHaveFocus();
  });
});
