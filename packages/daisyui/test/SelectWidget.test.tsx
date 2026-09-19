import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';

import SelectWidget from '../src/widgets/SelectWidget/SelectWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

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

  test('selecting a grouped option fires onChange with the correct value', () => {
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

    fireEvent.click(screen.getByRole('option', { name: 'Baz' }));

    expect(onChange).toHaveBeenCalledWith('baz');
  });

  test('marks enumDisabled options as disabled and ignores clicks on them', () => {
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
    fireEvent.click(bar);
    fireEvent.keyDown(bar, { key: 'Enter' });
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
