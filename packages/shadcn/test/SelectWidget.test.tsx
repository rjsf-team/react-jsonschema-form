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

  test('hovering over elements with duplicate labels only highlights the correct one by value', async () => {
    const user = userEvent.setup();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          disabled: false,
          readonly: false,
          rawErrors: [],
          value: undefined,
          placeholder: 'Select a vehicle',
          options: {
            enumOptions: [
              { label: 'Car', value: 'car1' },
              { label: 'Car', value: 'car2' },
              { label: 'Bike', value: 'bike' },
            ],
          },
        })}
      />,
    );

    const trigger = screen.getByRole('button', { name: /select a vehicle/i });
    await user.click(trigger);

    const carOptions = screen.getAllByRole('option', { name: 'Car' });
    expect(carOptions).toHaveLength(2);

    await user.hover(carOptions[0]);

    expect(carOptions[0]).toHaveAttribute('aria-selected', 'true');
    expect(carOptions[0]).toHaveAttribute('data-selected', 'true');

    expect(carOptions[1]).toHaveAttribute('aria-selected', 'false');
    expect(carOptions[1]).toHaveAttribute('data-selected', 'false');

    await user.hover(carOptions[1]);

    expect(carOptions[0]).toHaveAttribute('aria-selected', 'false');
    expect(carOptions[0]).toHaveAttribute('data-selected', 'false');

    expect(carOptions[1]).toHaveAttribute('aria-selected', 'true');
    expect(carOptions[1]).toHaveAttribute('data-selected', 'true');
  });

  test('multi-select: hovering over elements with duplicate labels only highlights the correct one by value', async () => {
    const user = userEvent.setup();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          disabled: false,
          readonly: false,
          multiple: true,
          rawErrors: [],
          value: [],
          options: {
            enumOptions: [
              { label: 'Car', value: 'car1' },
              { label: 'Car', value: 'car2' },
              { label: 'Bike', value: 'bike' },
            ],
          },
        })}
      />,
    );

    const input = screen.getByPlaceholderText('Select ...');
    await user.click(input);

    const carOptions = screen.getAllByRole('option', { name: 'Car' });
    expect(carOptions).toHaveLength(2);

    await user.hover(carOptions[0]);

    expect(carOptions[0]).toHaveAttribute('aria-selected', 'true');
    expect(carOptions[0]).toHaveAttribute('data-selected', 'true');

    expect(carOptions[1]).toHaveAttribute('aria-selected', 'false');
    expect(carOptions[1]).toHaveAttribute('data-selected', 'false');

    await user.hover(carOptions[1]);

    expect(carOptions[0]).toHaveAttribute('aria-selected', 'false');
    expect(carOptions[0]).toHaveAttribute('data-selected', 'false');

    expect(carOptions[1]).toHaveAttribute('aria-selected', 'true');
    expect(carOptions[1]).toHaveAttribute('data-selected', 'true');
  });
});
