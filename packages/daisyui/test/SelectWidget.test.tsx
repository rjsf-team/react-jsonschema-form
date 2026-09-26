import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import SelectWidget from '../src/widgets/SelectWidget/SelectWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe('SelectWidget', () => {
  const enumOptions = [
    { label: 'Foo', value: 'foo' },
    { label: 'Bar', value: 'bar' },
    { label: 'Baz', value: 'baz' },
    { label: 'Qux', value: 'qux' },
  ];

  test('renders a header row and its options for each optgroups entry', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          options: {
            enumOptions,
            optgroups: {
              'Group A': ['foo', 'bar'],
              'Group B': ['baz', 'qux'],
            },
          },
        })}
      />,
    );

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  test('exposes each optgroup as a labelled group owning its options', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          options: {
            enumOptions,
            optgroups: {
              'Group A': ['foo', 'bar'],
              'Group B': ['baz'],
            },
          },
        })}
      />,
    );

    const groupA = screen.getByRole('group', { name: 'Group A' });
    expect(within(groupA).getAllByRole('option')).toHaveLength(2);
    expect(within(groupA).getByRole('option', { name: 'Foo' })).toBeInTheDocument();
    expect(within(groupA).getByRole('option', { name: 'Bar' })).toBeInTheDocument();
    const groupB = screen.getByRole('group', { name: 'Group B' });
    expect(within(groupB).getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('Group A')).toHaveAttribute('aria-hidden', 'true');
  });

  test('renders ungrouped options after the optgroups', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          options: {
            enumOptions,
            optgroups: {
              'Group A': ['foo', 'bar'],
            },
          },
        })}
      />,
    );

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(screen.getByRole('option', { name: 'Baz' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Qux' })).toBeInTheDocument();
  });

  test('selecting a grouped option fires onChange with the correct value', async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          onChange,
          options: {
            enumOptions,
            optgroups: {
              'Group A': ['foo', 'bar'],
              'Group B': ['baz', 'qux'],
            },
          },
        })}
      />,
    );

    await user.click(screen.getByRole('option', { name: 'Baz' }));

    expect(onChange).toHaveBeenCalledWith('baz');
  });

  test.each(['indexed', 'realValue'] as const)(
    'selecting an option fires onChange with its value in the %s format',
    async (optionValueFormat) => {
      const onChange = vi.fn();
      render(
        <SelectWidget
          {...makeWidgetMockProps({ value: undefined, onChange, options: { enumOptions, optionValueFormat } })}
        />,
      );

      await user.click(screen.getByRole('option', { name: 'Bar' }));

      expect(onChange).toHaveBeenLastCalledWith('bar');
    },
  );

  test('multi-select: selecting an option fires onChange with its value in the realValue format', async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: ['foo'],
          multiple: true,
          onChange,
          options: { enumOptions, optionValueFormat: 'realValue' },
        })}
      />,
    );

    await user.click(screen.getByRole('option', { name: 'Baz' }));

    expect(onChange).toHaveBeenLastCalledWith(['foo', 'baz']);
  });

  test.each(['indexed', 'realValue'] as const)(
    'shows the label of a selected object option in the %s format',
    (optionValueFormat) => {
      render(
        <SelectWidget
          {...makeWidgetMockProps({
            value: { a: 2 },
            options: {
              enumOptions: [
                { label: 'One', value: { a: 1 } },
                { label: 'Two', value: { a: 2 } },
              ],
              optionValueFormat,
            },
          })}
        />,
      );

      expect(screen.getByRole('button')).toHaveTextContent('Two');
    },
  );

  test('multi-select: deselects an object option that is equal to, but not the same instance as, its constant', async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: [{ a: 1 }],
          multiple: true,
          onChange,
          options: {
            enumOptions: [
              { label: 'One', value: { a: 1 } },
              { label: 'Two', value: { a: 2 } },
            ],
          },
        })}
      />,
    );

    await user.click(screen.getByRole('option', { name: 'One' }));

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  test('reports focus and blur for the dropdown as a whole, with the current value', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <SelectWidget {...makeWidgetMockProps({ value: 'bar', onFocus, onBlur, options: { enumOptions } })} />
        <button type='button'>After select</button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: /Bar/ }));
    expect(onFocus).toHaveBeenCalledWith('test-id', 'bar');

    await user.click(screen.getByRole('option', { name: 'Baz' }));
    expect(onBlur).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'After select' }));
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledExactlyOnceWith('test-id', 'bar');
  });

  test('marks enumDisabled options as disabled and ignores clicks on them', async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          onChange,
          options: {
            enumOptions,
            enumDisabled: ['bar'],
            optgroups: { 'Group A': ['foo', 'bar'] },
          },
        })}
      />,
    );

    const bar = screen.getByRole('option', { name: 'Bar' });
    expect(bar).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'Foo' })).not.toHaveAttribute('aria-disabled');
    await user.click(bar);
    expect(bar).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('renders object examples by their display value when there is no enum', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          schema: { type: 'object', examples: [{ name: 'Alpha' }, { name: 'Beta' }] },
          options: {},
        })}
      />,
    );

    expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument();
  });

  test('renders falsy primitive examples by their string form when there is no enum', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          schema: { type: 'number', examples: [0, 1] },
          options: {},
        })}
      />,
    );

    expect(screen.getByRole('option', { name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1' })).toBeInTheDocument();
  });
});
