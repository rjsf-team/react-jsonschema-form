import { fireEvent, render } from '@testing-library/react';
import { vi } from 'vitest';

import SelectWidget from '../src/SelectWidget/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

describe('SelectWidget', () => {
  const enumOptions = [
    { label: 'Foo', value: 'foo' },
    { label: 'Bar', value: 'bar' },
    { label: 'Baz', value: 'baz' },
    { label: 'Qux', value: 'qux' },
  ];

  test('renders optgroups when ui:options.optgroups is provided', () => {
    const { container } = render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          readonly: false,
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

    const optgroups = container.querySelectorAll('optgroup');
    expect(optgroups).toHaveLength(2);
    expect(optgroups[0]).toHaveAttribute('label', 'Group A');
    expect(optgroups[1]).toHaveAttribute('label', 'Group B');
    expect(optgroups[0].querySelectorAll('option')).toHaveLength(2);
    expect(optgroups[1].querySelectorAll('option')).toHaveLength(2);
  });

  test('renders ungrouped options after the optgroups', () => {
    const { container } = render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          readonly: false,
          options: {
            enumOptions,
            optgroups: {
              'Group A': ['foo', 'bar'],
            },
          },
        })}
      />,
    );

    const select = container.querySelector('select')!;
    expect(select.querySelectorAll('optgroup')).toHaveLength(1);
    // The placeholder plus the two ungrouped options (baz, qux) render as direct children of the select
    const directOptions = Array.from(select.children).filter((child) => child.tagName === 'OPTION');
    expect(directOptions).toHaveLength(3);
  });

  test('disables enumDisabled options inside an optgroup', () => {
    const { container } = render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          readonly: false,
          options: {
            enumOptions,
            enumDisabled: ['bar'],
            optgroups: {
              'Group A': ['foo', 'bar'],
            },
          },
        })}
      />,
    );

    const groupAOptions = container.querySelector('optgroup')!.querySelectorAll('option');
    expect(groupAOptions[0]).not.toBeDisabled();
    expect(groupAOptions[1]).toBeDisabled();
  });

  test('does not collide a group label with an option index key', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          readonly: false,
          options: {
            enumOptions,
            // '0' is also the index key of the first ungrouped option
            optgroups: { '0': ['bar'] },
          },
        })}
      />,
    );

    expect(container.querySelectorAll('optgroup')).toHaveLength(1);
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything());
    consoleError.mockRestore();
  });

  test('fires onChange with the correct value for a grouped option', () => {
    const onChange = vi.fn();
    const { container } = render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          readonly: false,
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

    const select = container.querySelector('select')!;
    const bazOption = container.querySelector<HTMLOptionElement>('optgroup[label="Group B"] option')!;
    fireEvent.change(select, { target: { value: bazOption.value } });

    expect(onChange).toHaveBeenCalledWith('baz');
  });

  test('reports a multiple select in enum order even when optgroups reorders the options', () => {
    const onChange = vi.fn();
    const { container } = render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: [],
          readonly: false,
          multiple: true,
          onChange,
          options: {
            enumOptions,
            // 'qux' and 'baz' lead the rendered list while 'foo' and 'bar' trail it, so a browser reporting the
            // selection in document order would swap the two picks below
            optgroups: { Zed: ['qux', 'baz'] },
          },
        })}
      />,
    );

    const select = container.querySelector('select')!;
    const optionFor = (label: string) =>
      Array.from(select.querySelectorAll('option')).find((option) => option.textContent === label)!;
    optionFor('Foo').selected = true;
    optionFor('Baz').selected = true;
    fireEvent.change(select);

    expect(onChange).toHaveBeenLastCalledWith(['foo', 'baz']);
  });
});
