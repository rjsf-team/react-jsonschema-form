import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import SelectWidget from '../src/SelectWidget/SelectWidget.tsx';

const mockSchema: RJSFSchema = { type: 'string' };

function makeWidgetMockProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    uiSchema: {},
    schema: mockSchema,
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    label: 'Sample Field Label',
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    multiple: false,
    rawErrors: [],
    value: undefined,
    options: {},
    id: 'test-id',
    name: 'test-name',
    placeholder: '',
    registry: getTestRegistry(mockSchema),
    ...props,
  };
}

describe('SelectWidget', () => {
  const enumOptions = [
    { label: 'Foo', value: 'foo' },
    { label: 'Bar', value: 'bar' },
    { label: 'Baz', value: 'baz' },
    { label: 'Qux', value: 'qux' },
  ];

  test('renders an OptionGroup per optgroups entry, plus the ungrouped options', async () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          options: {
            enumOptions,
            optgroups: {
              'Group A': ['foo', 'bar'],
            },
          },
        })}
      />,
    );

    await screen.findByRole('combobox');
    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getByRole('group', { name: 'Group A' })).toBeInTheDocument();
    // The placeholder option plus the 4 enum options (2 grouped, 2 ungrouped)
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });

  test('selecting a grouped option fires onChange with the correct value', async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
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

    await screen.findByRole('combobox');
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Baz' }));

    expect(onChange).toHaveBeenCalledWith('baz');
  });
});
