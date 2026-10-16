import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { englishStringTranslator, TranslatableString } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import SelectWidget from '../src/SelectWidget/SelectWidget.tsx';

const user = userEvent.setup();

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
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('group', { name: 'Group A' })).toBeInTheDocument();
    // The placeholder option plus the 4 enum options (2 grouped, 2 ungrouped)
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });

  test('does not collide a group label with an option index key', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          options: {
            enumOptions,
            // '0' is also the index key of the first ungrouped option
            optgroups: { '0': ['bar'] },
          },
        })}
      />,
    );

    await screen.findByRole('combobox');
    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('group', { name: '0' })).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything());
    consoleError.mockRestore();
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
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Baz' }));

    expect(onChange).toHaveBeenCalledWith('baz');
  });

  test.each(['indexed', 'realValue'] as const)(
    'marks the selected object option in the %s format',
    async (optionValueFormat) => {
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

      await user.click(await screen.findByRole('combobox'));

      expect(screen.getByRole('option', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('option', { name: 'One' })).toHaveAttribute('aria-selected', 'false');
    },
  );

  test('multi-select: deselects a selected object option in the realValue format', async () => {
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
            optionValueFormat: 'realValue',
          },
        })}
      />,
    );

    await user.click(await screen.findByRole('combobox'));
    // A multiselect's options are checkable menu items
    const one = screen.getByRole('menuitemcheckbox', { name: 'One' });
    expect(one).toHaveAttribute('aria-checked', 'true');
    await user.click(one);

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  test('reports focus and blur with the selected value rather than its option index', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<SelectWidget {...makeWidgetMockProps({ value: 'bar', onFocus, onBlur, options: { enumOptions } })} />);

    await user.click(await screen.findByRole('combobox'));
    expect(onFocus).toHaveBeenLastCalledWith('test-id', 'bar');
    await user.keyboard('{Escape}');
    await user.tab();
    expect(onBlur).toHaveBeenLastCalledWith('test-id', 'bar');
  });

  test('multi-select: does not crash on a non-array value in the realValue format', async () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: null,
          multiple: true,
          options: { enumOptions, optionValueFormat: 'realValue' },
        })}
      />,
    );

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  // A label holding only the `*` would name the dropdown "star", so none is drawn; the dropdown is still required
  test('draws no label for a required select whose label is empty, and names it by the translated prompt', async () => {
    const { container } = render(
      <SelectWidget {...makeWidgetMockProps({ label: '', required: true, options: { enumOptions } })} />,
    );

    const dropdown = await screen.findByRole('combobox', {
      name: englishStringTranslator(TranslatableString.SelectPlaceholder),
    });
    expect(container.querySelector('label')).not.toBeInTheDocument();
    expect(dropdown).toHaveAttribute('aria-required', 'true');
  });

  test('names a select with an empty label by its placeholder before the translated prompt', async () => {
    render(<SelectWidget {...makeWidgetMockProps({ label: '', placeholder: 'Pick one', options: { enumOptions } })} />);

    expect(await screen.findByRole('combobox', { name: 'Pick one' })).toBeInTheDocument();
  });

  test('names a select whose label is hidden by that label, drawing none', async () => {
    const { container } = render(
      // oxlint-disable-next-line typescript/no-deprecated -- a widget rendered without a plan reads the deprecated prop
      <SelectWidget {...makeWidgetMockProps({ hideLabel: true, options: { enumOptions } })} />,
    );

    expect(await screen.findByRole('combobox', { name: 'Sample Field Label' })).toBeInTheDocument();
    expect(container.querySelector('label')).not.toBeInTheDocument();
  });

  test('renders no label for a select with an empty label that is not required', async () => {
    const { container } = render(
      <SelectWidget {...makeWidgetMockProps({ label: '', 'aria-label': 'When, year', options: { enumOptions } })} />,
    );

    await screen.findByRole('combobox', { name: 'When, year' });
    expect(container.querySelector('label')).not.toBeInTheDocument();
  });
});
