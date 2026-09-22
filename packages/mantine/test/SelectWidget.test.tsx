import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { fireEvent, render, screen } from '@testing-library/react';

import SelectWidget from '../src/widgets/SelectWidget.tsx';

const schema: RJSFSchema = { type: 'string', enum: ['foo', 'bar', 'baz', 'qux'] };

function makeProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    schema,
    registry: getTestRegistry(schema),
    options: {},
    label: 'Select',
    value: undefined,
    required: false,
    disabled: false,
    readonly: false,
    multiple: false,
    rawErrors: [],
    uiSchema: {},
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    ...props,
  } as unknown as WidgetProps;
}

/** Renders the widget inside a `MantineProvider`, which its components require */
function renderWidget(props: Partial<WidgetProps> = {}) {
  return render(
    <MantineProvider>
      <SelectWidget {...makeProps(props)} />
    </MantineProvider>,
  );
}

describe('mantine SelectWidget optgroups', () => {
  const enumOptions = [
    { label: 'Foo', value: 'foo' },
    { label: 'Bar', value: 'bar' },
    { label: 'Baz', value: 'baz' },
    { label: 'Qux', value: 'qux' },
  ];

  test('renders a labeled group for each optgroups entry, plus the ungrouped options', () => {
    renderWidget({
      options: {
        enumOptions,
        optgroups: {
          'Group A': ['foo', 'bar'],
        },
      },
    });

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Foo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bar' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Baz' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Qux' })).toBeInTheDocument();
  });

  test('disables enumDisabled options inside an optgroup', () => {
    renderWidget({
      options: {
        enumOptions,
        enumDisabled: ['bar'],
        optgroups: {
          'Group A': ['foo', 'bar'],
        },
      },
    });

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: 'Foo' })).not.toHaveAttribute('data-combobox-disabled');
    expect(screen.getByRole('option', { name: 'Bar' })).toHaveAttribute('data-combobox-disabled', 'true');
  });

  test('selecting a grouped option fires onChange with the correct value', () => {
    const onChange = vi.fn();
    renderWidget({
      onChange,
      options: {
        enumOptions,
        optgroups: {
          'Group A': ['foo', 'bar'],
          'Group B': ['baz', 'qux'],
        },
      },
    });

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Baz' }));

    expect(onChange).toHaveBeenCalledWith('baz');
  });

  test('drops a group whose options the search filtered out', () => {
    renderWidget({
      options: {
        enumOptions,
        optgroups: {
          'Group A': ['foo', 'bar'],
          'Group B': ['baz', 'qux'],
        },
      },
    });

    const combobox = screen.getByRole('combobox');
    // Mantine ignores an input change made while the input isn't focused, treating it as a browser autofill
    combobox.focus();
    fireEvent.click(combobox);
    fireEvent.change(combobox, { target: { value: 'ba' } });

    expect(screen.getByRole('option', { name: 'Bar' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Baz' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Foo' })).not.toBeInTheDocument();
    expect(screen.getByText('Group A')).toBeInTheDocument();

    fireEvent.change(combobox, { target: { value: 'qu' } });

    expect(screen.getByRole('option', { name: 'Qux' })).toBeInTheDocument();
    expect(screen.queryByText('Group A')).not.toBeInTheDocument();
  });
});
