import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import SelectWidget from '../src/SelectWidget/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

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

  test('renders a heading per optgroups entry, plus an unheaded group for the ungrouped options', async () => {
    const user = userEvent.setup();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          disabled: false,
          readonly: false,
          rawErrors: [],
          value: undefined,
          options: {
            enumOptions: [
              { label: 'Foo', value: 'foo' },
              { label: 'Bar', value: 'bar' },
              { label: 'Baz', value: 'baz' },
              { label: 'Qux', value: 'qux' },
            ],
            optgroups: {
              'Group A': ['foo', 'bar'],
            },
          },
        })}
      />,
    );

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('group', { name: 'Group A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Foo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bar' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Baz' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Qux' })).toBeInTheDocument();
  });

  test('does not collide a group label with the unheaded section key', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          disabled: false,
          readonly: false,
          rawErrors: [],
          value: undefined,
          options: {
            enumOptions: [
              { label: 'Foo', value: 'foo' },
              { label: 'Bar', value: 'bar' },
            ],
            // A label chosen to collide with the key the unheaded section used to be given
            optgroups: { 'ungrouped-1': ['foo'] },
          },
        })}
      />,
    );

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('group', { name: 'ungrouped-1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bar' })).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything());
    consoleError.mockRestore();
  });

  test('selecting a grouped option fires onValueChange with the correct index', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          disabled: false,
          readonly: false,
          rawErrors: [],
          value: undefined,
          onChange: onValueChange,
          options: {
            enumOptions: [
              { label: 'Foo', value: 'foo' },
              { label: 'Bar', value: 'bar' },
              { label: 'Baz', value: 'baz' },
              { label: 'Qux', value: 'qux' },
            ],
            optgroups: {
              'Group A': ['foo', 'bar'],
              'Group B': ['baz', 'qux'],
            },
          },
        })}
      />,
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('option', { name: 'Baz' }));

    expect(onValueChange).toHaveBeenCalledWith('baz');
  });

  test('multi-select: renders a heading per optgroups entry', async () => {
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
              { label: 'Foo', value: 'foo' },
              { label: 'Bar', value: 'bar' },
              { label: 'Baz', value: 'baz' },
            ],
            optgroups: {
              'Group A': ['foo', 'bar'],
            },
          },
        })}
      />,
    );

    const input = screen.getByPlaceholderText('Select ...');
    await user.click(input);

    expect(screen.getByRole('group', { name: 'Group A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Baz' })).toBeInTheDocument();
  });

  test('multi-select: reports the picked values in the realValue format', async () => {
    const user = userEvent.setup();
    const seen: unknown[] = [];

    function Controlled() {
      const [value, setValue] = useState<unknown[]>([]);
      return (
        <SelectWidget
          {...makeWidgetMockProps({
            autofocus: false,
            disabled: false,
            readonly: false,
            multiple: true,
            rawErrors: [],
            value,
            onChange: (next) => {
              seen.push(next);
              setValue(next as unknown[]);
            },
            options: {
              enumOptions: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
                { label: 'None', value: null },
              ],
              optionValueFormat: 'realValue',
            },
          })}
        />
      );
    }

    const pick = async (name: string) => {
      await user.click(screen.getByPlaceholderText('Select ...'));
      await user.click(screen.getByRole('option', { name }));
    };

    render(<Controlled />);
    await pick('B');
    await pick('None');

    expect(seen).toEqual([['b'], ['b', null]]);
  });

  test('single select: reports the form data value on focus and blur rather than decoding it', async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <SelectWidget
          {...makeWidgetMockProps({
            autofocus: false,
            disabled: false,
            readonly: false,
            rawErrors: [],
            // Decoded as a DOM value, `1` would be read as the index of the option whose value is `0`
            value: 1,
            onFocus,
            onBlur,
            options: {
              enumOptions: [
                { label: 'One', value: 1 },
                { label: 'Zero', value: 0 },
              ],
            },
          })}
        />
        <button type='button'>After select</button>
      </>,
    );

    await user.tab();
    await user.tab();

    expect(onFocus).toHaveBeenCalledWith('_id', 1);
    expect(onBlur).toHaveBeenCalledWith('_id', 1);
  });

  test('multi-select: optgroups does not reorder the selected values it reports', async () => {
    const user = userEvent.setup();
    const seen: unknown[] = [];

    function Controlled({ optgroups }: { optgroups?: Record<string, string[]> }) {
      const [value, setValue] = useState<string[]>([]);
      return (
        <SelectWidget
          {...makeWidgetMockProps({
            autofocus: false,
            disabled: false,
            readonly: false,
            multiple: true,
            rawErrors: [],
            value,
            onChange: (next) => {
              seen.push(next);
              setValue(next as string[]);
            },
            options: {
              enumOptions: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
                { label: 'C', value: 'c' },
                { label: 'D', value: 'd' },
              ],
              optgroups,
            },
          })}
        />
      );
    }

    const pick = async (name: string) => {
      await user.click(screen.getByPlaceholderText('Select ...'));
      await user.click(screen.getByRole('option', { name }));
    };

    // 'C' and 'D' are grouped, so they lead the flattened option list while 'A' and 'B' trail it. Selecting across
    // that boundary must still report the values in the order they were picked: `optgroups` is presentational and
    // must not reach the array written to formData.
    const { unmount } = render(<Controlled optgroups={{ G: ['c', 'd'] }} />);
    await pick('A');
    await pick('C');
    await pick('B');
    const grouped = seen.at(-1);
    unmount();

    seen.length = 0;
    render(<Controlled />);
    await pick('A');
    await pick('C');
    await pick('B');
    const ungrouped = seen.at(-1);

    expect(ungrouped).toEqual(['a', 'c', 'b']);
    expect(grouped).toEqual(ungrouped);
  });
});
