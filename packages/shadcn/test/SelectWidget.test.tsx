import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { RJSFSchema } from '@rjsf/utils';
import { englishStringTranslator, TranslatableString } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import SelectWidget from '../src/SelectWidget/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const translateToFrench = (stringToTranslate: TranslatableString) =>
  stringToTranslate === TranslatableString.SelectPlaceholder ? 'Choisir ...' : stringToTranslate;

describe('SelectWidget', () => {
  // jsdom doesn't implement `scrollIntoView`, which the selects call on the option they highlight
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

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
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Select a country');
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

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Select a country');
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

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Select a vehicle');
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

    await user.click(screen.getByRole('combobox'));

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

    await user.click(screen.getByRole('combobox'));

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

    await user.click(screen.getByRole('combobox'));
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

  test('multi-select: keys and highlights each object option on its own', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          disabled: false,
          readonly: false,
          multiple: true,
          value: [],
          onChange,
          options: {
            enumOptions: [
              { label: 'One', value: { id: 1 } },
              { label: 'Two', value: { id: 2 } },
            ],
          },
        })}
      />,
    );

    try {
      await user.click(screen.getByPlaceholderText('Select ...'));
      await user.keyboard('{ArrowDown}');
      const highlighted = screen
        .getAllByRole('option')
        .filter((option) => option.getAttribute('aria-selected') === 'true');
      expect(highlighted.map((option) => option.textContent)).toEqual(['Two']);
      await user.click(screen.getByRole('option', { name: 'Two' }));

      expect(onChange).toHaveBeenLastCalledWith([{ id: 2 }]);
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything());
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  test('multi-select: finds an object option by typing its label', async () => {
    const user = userEvent.setup();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          disabled: false,
          readonly: false,
          multiple: true,
          value: [],
          options: {
            enumOptions: [
              { label: 'Basic', value: { tier: 1 } },
              { label: 'Pro', value: { tier: 2 } },
            ],
          },
        })}
      />,
    );

    await user.type(screen.getByPlaceholderText('Select ...'), 'Pro');

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Pro']);
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

  test('multi-select: reads a lone value as one selected item, as core does', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          disabled: false,
          readonly: false,
          multiple: true,
          value: 'a',
          onChange,
          options: {
            enumOptions: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' },
            ],
            optionValueFormat: 'realValue',
          },
        })}
      />,
    );

    await user.click(screen.getByPlaceholderText('Select ...'));
    expect(screen.queryByRole('option', { name: 'A' })).toBeNull();
    await user.click(screen.getByRole('option', { name: 'B' }));

    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
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

describe('multiple SelectWidget options', () => {
  // jsdom doesn't implement `scrollIntoView`, which cmdk calls on the option it highlights
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  const selectWidget = (enumOptions: { label: string; value: unknown }[], onChange = vi.fn()) => (
    <SelectWidget
      {...makeWidgetMockProps({
        autofocus: false,
        disabled: false,
        readonly: false,
        multiple: true,
        value: [],
        onChange,
        options: { enumOptions },
      })}
    />
  );
  const renderSelect = (enumOptions: { label: string; value: unknown }[]) => {
    const onChange = vi.fn();
    render(selectWidget(enumOptions, onChange));
    return onChange;
  };
  const highlighted = () =>
    screen.getAllByRole('option').map((option) => option.getAttribute('aria-selected') === 'true');
  const untitled = [
    { label: '1', value: 1 },
    { label: '1', value: '1' },
    { label: '2', value: 2 },
  ];

  test.each([
    ['the first', '', [true, false, false], 1],
    ['the second', '{ArrowDown}', [false, true, false], '1'],
    ['the last', '{ArrowDown}{ArrowDown}', [false, false, true], 2],
  ])('highlights %s alone with the arrow keys and chooses it', async (_, keys, expected, chosen) => {
    const user = userEvent.setup();
    const onChange = renderSelect(untitled);

    await user.click(screen.getByPlaceholderText('Select ...'));
    if (keys) {
      await user.keyboard(keys);
    }
    expect(highlighted()).toEqual(expected);

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith([chosen]);
  });

  test('chooses the option a search leaves with Enter', async () => {
    const user = userEvent.setup();
    const onChange = renderSelect([
      { label: 'Apple', value: 1 },
      { label: 'Apple too', value: '1' },
      { label: 'Pear', value: 2 },
    ]);

    await user.type(screen.getByPlaceholderText('Select ...'), 'Pear{Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith([2]);
  });

  test.each([
    ['its label', 'Eig', ['Eight']],
    ['its value', '7', ['Seven']],
    ['its index, which it does not show', '1', []],
  ])('searches an option by %s', async (_, search, found) => {
    const user = userEvent.setup();
    renderSelect([
      { label: 'Seven', value: 7 },
      { label: 'Eight', value: 8 },
    ]);

    await user.type(screen.getByPlaceholderText('Select ...'), search);

    expect(screen.queryAllByRole('option').map((option) => option.textContent)).toEqual(found);
  });

  test.each([
    ['a label', 'a'],
    ['a value and a label', 'k'],
  ])('searches an option by what it shows after it takes %s while the list is open', async (_, newValue) => {
    const user = userEvent.setup();
    const { rerender } = render(selectWidget([{ label: 'Apple', value: 'a' }]));
    const input = screen.getByPlaceholderText('Select ...');

    await user.click(input);
    rerender(selectWidget([{ label: 'Kiwi', value: newValue }]));
    await user.type(input, 'Kiwi');

    expect(screen.queryAllByRole('option').map((option) => option.textContent)).toEqual(['Kiwi']);
  });

  test('keeps the highlight on an option that takes a new label while the list is open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(selectWidget([{ label: 'Apple', value: 'a' }], onChange));

    await user.click(screen.getByPlaceholderText('Select ...'));
    rerender(selectWidget([{ label: 'Apfel', value: 'a' }], onChange));
    expect(highlighted()).toEqual([true]);

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['a']);
  });

  test('names an option by its text, pointing at no id, since cmdk replaces the one an option is given', async () => {
    const user = userEvent.setup();
    renderSelect([{ label: 'Red', value: 'r' }]);

    await user.click(screen.getByPlaceholderText('Select ...'));

    const option = screen.getByRole('option', { name: 'Red' });
    expect(option).not.toHaveAttribute('aria-labelledby');
    expect(option).not.toHaveAttribute('aria-controls');
  });

  test('highlights, moves past and finds an option whose value is an empty string', async () => {
    const user = userEvent.setup();
    renderSelect([
      { label: 'None', value: '' },
      { label: 'Two', value: 2 },
    ]);
    const input = screen.getByPlaceholderText('Select ...');

    await user.click(input);
    expect(highlighted()).toEqual([true, false]);

    await user.keyboard('{ArrowDown}');
    expect(highlighted()).toEqual([false, true]);

    await user.type(input, 'None');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['None']);
  });
});

describe('multiple SelectWidget accessible name', () => {
  const colorsSchema = {
    type: 'object' as const,
    properties: {
      colors: {
        type: 'array' as const,
        title: 'Colors',
        uniqueItems: true,
        items: { type: 'string' as const, enum: ['red', 'blue'] },
      },
    },
  };
  const untitledRootSchema = {
    type: 'array' as const,
    uniqueItems: true,
    items: { type: 'string' as const, enum: ['red', 'blue'] },
  };

  test('uses the field title', () => {
    render(<Form schema={colorsSchema} validator={validator} />);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Colors');
  });

  test('uses an overridden ui:title', () => {
    render(
      <Form schema={colorsSchema} uiSchema={{ colors: { 'ui:title': 'Favorite colors' } }} validator={validator} />,
    );
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Favorite colors');
  });

  test('falls back to a fixed translated name for an untitled root field', () => {
    render(<Form schema={untitledRootSchema} validator={validator} />);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Select ...');
  });

  test('is named by the label the template shows, which an explicit blank ui:title falls through to the title', () => {
    render(<Form schema={colorsSchema} uiSchema={{ colors: { 'ui:title': '' } }} validator={validator} />);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Colors');
  });

  test('prefers ui:placeholder for the name and the visible placeholder of an untitled root field', () => {
    render(<Form schema={untitledRootSchema} uiSchema={{ 'ui:placeholder': 'Pick colors' }} validator={validator} />);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pick colors');
    expect(screen.getByPlaceholderText('Pick colors')).toBeInTheDocument();
  });

  test('fills the visible placeholder with the translated fallback when no ui:placeholder is given', () => {
    render(<Form schema={untitledRootSchema} validator={validator} />);
    expect(screen.getByPlaceholderText('Select ...')).toBeInTheDocument();
  });

  test('a custom translateString drives both the name and the visible placeholder', () => {
    render(<Form schema={untitledRootSchema} validator={validator} translateString={translateToFrench} />);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Choisir ...');
    expect(screen.getByPlaceholderText('Choisir ...')).toBeInTheDocument();
  });

  test('passes required and the field description to the combobox input', () => {
    const schema = {
      type: 'object' as const,
      required: ['colors'],
      properties: {
        colors: {
          type: 'array' as const,
          title: 'Colors',
          description: 'Pick your colors',
          uniqueItems: true,
          items: { type: 'string' as const, enum: ['red', 'blue'] },
        },
      },
    };
    render(<Form schema={schema} validator={validator} />);
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-required', 'true');
    expect(combobox).toHaveAttribute('aria-describedby', expect.stringContaining('root_colors__description'));
  });
});

describe('single SelectWidget translated placeholder', () => {
  test('a custom translateString drives the trigger', () => {
    const schema = { type: 'string' as const, enum: ['red', 'blue'] };
    render(<Form schema={schema} validator={validator} translateString={translateToFrench} />);
    expect(screen.getByRole('combobox', { expanded: false })).toHaveTextContent('Choisir ...');
  });

  test('an option with an empty label renders blank once selected instead of the placeholder', () => {
    const schema = {
      type: 'string' as const,
      oneOf: [
        { const: 'none', title: '' },
        { const: 'red', title: 'Red' },
      ],
    };
    render(<Form schema={schema} validator={validator} initialFormData='none' />);
    const trigger = screen.getByRole('combobox', { expanded: false });
    expect(trigger).toHaveTextContent(/^$/);
  });
});

describe('SelectWidget named and described by its caller', () => {
  const enumOptions = [
    { label: 'Red', value: 'red' },
    { label: 'Blue', value: 'blue' },
  ];

  test('single select falls back to its fallback name for an empty aria-label, as the multiple select does', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({ label: '', value: undefined, options: { enumOptions }, 'aria-label': '' })}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Select ...' })).toBeInTheDocument();
  });

  test('multi-select names its search input by the aria-label it is passed', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({ multiple: true, value: [], options: { enumOptions }, 'aria-label': 'When, year' })}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'When, year' })).toBeInTheDocument();
  });

  test('multi-select describes its search input by the ids it is passed', () => {
    render(
      <>
        <p id='field-help'>Pick any.</p>
        <SelectWidget
          {...makeWidgetMockProps({
            multiple: true,
            value: [],
            options: { enumOptions },
            'aria-describedby': 'field-help',
          })}
        />
      </>,
    );

    expect(screen.getByRole('combobox')).toHaveAccessibleDescription('Pick any.');
  });
});

describe('SelectWidget whose combobox the field label names', () => {
  const enumOptions = [
    { label: 'Red', value: 'red' },
    { label: 'Blue', value: 'blue' },
  ];

  function renderLabelled(props: Parameters<typeof makeWidgetMockProps>[0], labelText: string) {
    render(
      <>
        <label htmlFor='root_color'>{labelText}</label>
        <SelectWidget
          {...makeWidgetMockProps({ id: 'root_color', value: 'red', options: { enumOptions }, ...props })}
        />
      </>,
    );
    return screen.getByRole('combobox', { expanded: false });
  }

  // A combobox takes no name from the item it displays, which is its value, so it is neither named nor described by it
  // `SchemaField` hands an untitled field its property name as its label, which the template's label shows
  test('is named by the label showing the property name of an untitled field, holding its value', () => {
    const combobox = renderLabelled({ label: 'color', name: 'color' }, 'color');

    expect(combobox).toHaveAccessibleName('color');
    expect(combobox).not.toHaveAccessibleDescription(expect.stringContaining('Red'));
    expect(combobox).toHaveTextContent('Red');
  });

  // The template draws no label holding only a required field's `*`, which would name it "star"
  test('names a required select with no label text by the select prompt, holding its value', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          id: 'root_color',
          value: 'red',
          label: '',
          required: true,
          options: { enumOptions },
        })}
      />,
    );
    const combobox = screen.getByRole('combobox', { expanded: false });

    expect(combobox).toHaveAccessibleName(englishStringTranslator(TranslatableString.SelectPlaceholder));
    expect(combobox).toHaveTextContent('Red');
  });

  test('names a select with no label text by its placeholder before the select prompt', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({ id: 'root_color', label: '', placeholder: 'Pick one', options: { enumOptions } })}
      />,
    );

    expect(screen.getByRole('combobox', { expanded: false })).toHaveAccessibleName('Pick one');
  });
});

describe('an anyOf option selector', () => {
  test("is named by the label its field's template draws", () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          title: 'Foo',
          anyOf: [
            { title: 'Text', type: 'string' },
            { title: 'Number', type: 'number' },
          ],
        },
      },
    };
    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelector('#root_foo__anyof_select')).toHaveAccessibleName('Foo');
  });
});

describe('SelectWidget combobox', () => {
  // jsdom doesn't implement `scrollIntoView`, which the selects call on the option they highlight
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  const colors: RJSFSchema = { type: 'string', title: 'Color', enum: ['red', 'blue'] };

  test.each<[string, RJSFSchema]>([
    ['single', colors],
    [
      'multiple',
      { type: 'array', title: 'Color', items: { type: 'string', enum: ['red', 'blue'] }, uniqueItems: true },
    ],
  ])('a %s select is invalid while its field shows errors, and described by them', (_, color) => {
    render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        validator={validator}
        extraErrors={{ color: { __errors: ['is wrong'] } }}
      />,
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-invalid', 'true');
    expect(combobox).toHaveAccessibleDescription(expect.stringContaining('is wrong'));
  });

  test('a single select is named by the field label its plan hides', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { color: colors } }}
        uiSchema={{ color: { 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Color');
  });

  test.each([
    ['a required', ['color'], true],
    ['an optional', [], false],
  ])("%s single select's combobox says whether its field is required", (_, required, isRequired) => {
    render(<Form schema={{ type: 'object', required, properties: { color: colors } }} validator={validator} />);

    expect(screen.getByRole('combobox').getAttribute('aria-required')).toBe(isRequired ? 'true' : null);
  });

  test.each<[string, RJSFSchema]>([
    ['single', colors],
    [
      'multiple',
      { type: 'array', title: 'Color', items: { type: 'string', enum: ['red', 'blue'] }, uniqueItems: true },
    ],
  ])("focuses a %s select's combobox under ui:autofocus", (_, color) => {
    render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        uiSchema={{ color: { 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  test("leaves a multiple select's list closed as ui:autofocus focuses it, and opens it on a click", async () => {
    const user = userEvent.setup();
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            color: {
              type: 'array',
              title: 'Color',
              items: { type: 'string', enum: ['red', 'blue'] },
              uniqueItems: true,
            },
          },
        }}
        uiSchema={{ color: { 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    const input = screen.getByRole('combobox');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await user.click(input);
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  test("opens an autofocused multiple select's list on Down Arrow", async () => {
    const user = userEvent.setup();
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            color: {
              type: 'array',
              title: 'Color',
              items: { type: 'string', enum: ['red', 'blue'] },
              uniqueItems: true,
            },
          },
        }}
        uiSchema={{ color: { 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  test("closes a multiple select's list as focus leaves its input, for a remove button or out of the select", async () => {
    const user = userEvent.setup();
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            color: {
              type: 'array',
              title: 'Color',
              items: { type: 'string', enum: ['red', 'blue', 'green'] },
              uniqueItems: true,
            },
          },
        }}
        initialFormData={{ color: ['red'] }}
        validator={validator}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await user.tab({ shift: true });
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox'));
    await user.tab();

    expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  test('a single select no label names is named by the select prompt where it has no title', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          label: '',
          name: '',
          required: false,
          value: undefined,
          options: { enumOptions: [{ label: 'Red', value: 'red' }] },
        })}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Select ...');
  });

  test('scrolls the group heading into view with the option the single select opens on, first in that group', async () => {
    const user = userEvent.setup();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          readonly: false,
          value: 'blue',
          options: {
            enumOptions: ['red', 'blue'].map((value) => ({ label: value, value })),
            optgroups: { Warm: ['red'], Cool: ['blue'] },
          },
        })}
      />,
    );

    await user.click(screen.getByRole('combobox'));

    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
    const scrolled = vi.mocked(Element.prototype.scrollIntoView).mock.contexts;
    expect(scrolled).toContain(screen.getByText('Cool'));
    expect(scrolled.at(-1)).toBe(screen.getByRole('option', { name: 'blue' }));
  });
});

describe("the single select's combobox while its listbox is open", () => {
  const enumOptions = [
    { label: 'Red', value: 'red' },
    { label: 'Green', value: 'green' },
    { label: 'Blue', value: 'blue' },
  ];

  test('points at the listbox and at the option it highlights, which focus never leaves it for, and Enter chooses', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const props = makeWidgetMockProps({
      id: 'root_color',
      label: 'Color',
      disabled: false,
      readonly: false,
      onChange,
      options: { enumOptions },
    });
    const { rerender } = render(<SelectWidget {...props} />);
    const combobox = screen.getByRole('combobox', { expanded: false });

    // Moving the highlight scrolls the item into view with an API jsdom lacks
    Element.prototype.scrollIntoView = vi.fn();
    try {
      await user.click(combobox);
      await user.keyboard('{ArrowDown}');

      const highlighted = screen
        .getAllByRole('option')
        .find((option) => option.getAttribute('aria-selected') === 'true');
      expect(highlighted).toHaveTextContent('Green');
      expect(combobox).toHaveFocus();
      expect(combobox).toHaveAttribute('aria-activedescendant', highlighted!.id);
      expect(combobox).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);

      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledExactlyOnceWith('green');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(combobox).not.toHaveAttribute('aria-activedescendant');

      // The options mount under new ids as the listbox reopens on the option the select now holds
      rerender(<SelectWidget {...props} value='green' />);
      await user.click(combobox);
      const rehighlighted = screen
        .getAllByRole('option')
        .find((option) => option.getAttribute('aria-selected') === 'true');
      expect(rehighlighted).toHaveTextContent('Green');
      expect(combobox).toHaveAttribute('aria-activedescendant', rehighlighted!.id);
    } finally {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });

  describe('driven by the keys of a select-only combobox', () => {
    // Moving the highlight scrolls the item into view with an API jsdom lacks
    beforeEach(() => {
      Element.prototype.scrollIntoView = vi.fn();
    });
    afterEach(() => {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    });

    function renderSelect(props: Parameters<typeof makeWidgetMockProps>[0] = {}) {
      const onChange = vi.fn();
      const view = render(
        <SelectWidget
          {...makeWidgetMockProps({
            id: 'root_color',
            label: 'Color',
            disabled: false,
            readonly: false,
            autofocus: false,
            onChange,
            options: { enumOptions },
            ...props,
          })}
        />,
      );
      return { ...view, onChange, combobox: screen.getByRole('combobox') };
    }

    function highlightedOption() {
      return screen.getAllByRole('option').find((option) => option.getAttribute('aria-selected') === 'true');
    }

    test('opens on the option it holds, so Enter keeps that value', async () => {
      const user = userEvent.setup();
      const { combobox, onChange } = renderSelect({ value: 'blue' });

      await user.click(combobox);
      expect(highlightedOption()).toHaveTextContent('Blue');
      expect(combobox).toHaveAttribute('aria-activedescendant', highlightedOption()!.id);
      await user.keyboard('{Enter}');

      expect(onChange).not.toHaveBeenCalled();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    test('reports no change on Space over the option it holds', async () => {
      const user = userEvent.setup();
      const { combobox, onChange } = renderSelect({ value: 'blue' });

      await user.click(combobox);
      await user.keyboard(' ');

      expect(onChange).not.toHaveBeenCalled();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    test('opens with no value on its first option a user can choose, not on one an earlier opening left highlighted', async () => {
      const user = userEvent.setup();
      const { combobox } = renderSelect({ options: { enumOptions, enumDisabled: ['red'] } });

      await user.click(combobox);
      await user.keyboard('{ArrowDown}');
      expect(highlightedOption()).toHaveTextContent('Blue');
      await user.keyboard('{Escape}');
      await user.keyboard('{ArrowDown}');

      expect(highlightedOption()).toHaveTextContent('Green');
      expect(combobox).toHaveAttribute('aria-activedescendant', highlightedOption()!.id);
    });

    test.each([
      ['Down Arrow', '{ArrowDown}'],
      ['Alt+Down Arrow', '{Alt>}{ArrowDown}{/Alt}'],
      ['Up Arrow', '{ArrowUp}'],
    ])('opens on %s, keeping focus on the combobox', async (_, keys) => {
      const user = userEvent.setup();
      const { combobox } = renderSelect();

      await user.tab();
      await user.keyboard(keys);

      expect(combobox).toHaveAttribute('aria-expanded', 'true');
      expect(combobox).toHaveFocus();
      expect(combobox).toHaveAttribute('aria-activedescendant', highlightedOption()!.id);
    });

    test('closes on Enter without choosing where the option it holds and opens on is disabled', async () => {
      const user = userEvent.setup();
      const { combobox, onChange } = renderSelect({
        value: 'green',
        options: { enumOptions, enumDisabled: ['green'] },
      });

      await user.tab();
      await user.keyboard('{Enter}');
      expect(highlightedOption()).toHaveTextContent('Green');
      await user.keyboard('{Enter}');

      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(onChange).not.toHaveBeenCalled();
    });

    // Ctrl+N, J, P and K are cmdk's vim bindings, and Alt+Arrow, with no other group to jump to, falls back to a step
    test.each([
      ['{ArrowDown}', 'Blue'],
      ['{ArrowUp}', 'Red'],
      ['{Control>}n{/Control}', 'Blue'],
      ['{Control>}j{/Control}', 'Blue'],
      ['{Control>}p{/Control}', 'Red'],
      ['{Control>}k{/Control}', 'Red'],
      ['{Alt>}{ArrowDown}{/Alt}', 'Blue'],
      ['{Alt>}{ArrowUp}{/Alt}', 'Red'],
    ])(
      'moves the highlight on %s from the disabled option it holds and opens on to its neighbour',
      async (key, name) => {
        const user = userEvent.setup();
        renderSelect({ value: 'green', options: { enumOptions, enumDisabled: ['green'] } });

        await user.tab();
        await user.keyboard('{Enter}');
        expect(highlightedOption()).toHaveTextContent('Green');
        await user.keyboard(key);

        expect(highlightedOption()).toHaveTextContent(name);
        expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts).toContain(highlightedOption());
      },
    );

    test.each([
      ['{Meta>}{ArrowDown}{/Meta}', 'Purple'],
      ['{Meta>}{ArrowUp}{/Meta}', 'Red'],
    ])('leaves %s from the disabled option it holds to cmdk, which jumps to the end of the list', async (key, name) => {
      const user = userEvent.setup();
      renderSelect({
        value: 'blue',
        options: {
          enumOptions: [...enumOptions, { label: 'Yellow', value: 'yellow' }, { label: 'Purple', value: 'purple' }],
          enumDisabled: ['blue'],
        },
      });

      await user.tab();
      await user.keyboard('{Enter}');
      expect(highlightedOption()).toHaveTextContent('Blue');
      await user.keyboard(key);

      expect(highlightedOption()).toHaveTextContent(name);
    });

    test.each([
      ['red', '{ArrowDown}', 'Orange'],
      ['orange', '{ArrowDown}', 'Green'],
      ['green', '{ArrowUp}', 'Orange'],
      ['red', '{Alt>}{ArrowDown}{/Alt}', 'Green'],
      ['blue', '{Alt>}{ArrowUp}{/Alt}', 'Red'],
      ['blue', '{Alt>}{ArrowDown}{/Alt}', 'Purple'],
    ])('moves the highlight from the disabled %s it holds on %s across its groups to %s', async (value, key, name) => {
      const user = userEvent.setup();
      renderSelect({
        value,
        options: {
          enumOptions: [
            { label: 'Red', value: 'red' },
            { label: 'Orange', value: 'orange' },
            { label: 'Green', value: 'green' },
            { label: 'Blue', value: 'blue' },
            { label: 'Purple', value: 'purple' },
          ],
          enumDisabled: [value],
          optgroups: { Warm: ['red', 'orange'], Cool: ['green', 'blue', 'purple'] },
        },
      });

      await user.tab();
      await user.keyboard('{Enter}');
      expect(highlightedOption()).toHaveTextContent(new RegExp(`^${value}$`, 'i'));
      await user.keyboard(key);

      expect(highlightedOption()).toHaveTextContent(name);
    });

    // Space chooses the item the select matches to cmdk's highlight, while Enter is left to cmdk, which chooses
    // through the option's `onSelect`, once the select finds the option cmdk renders for that highlight, so each key
    // takes its own path
    test.each([
      ['Space', ' '],
      ['Enter', '{Enter}'],
    ])('highlights and chooses an option whose value has leading whitespace on %s', async (_, key) => {
      const user = userEvent.setup();
      const { combobox, onChange } = renderSelect({
        value: undefined,
        options: {
          enumOptions: [
            { label: 'Small', value: ' s' },
            { label: 'Large', value: 'l' },
          ],
          optionValueFormat: 'realValue',
        },
      });

      await user.tab();
      await user.keyboard('{Enter}');
      expect(combobox).toHaveAttribute('aria-activedescendant', highlightedOption()!.id);
      await user.keyboard(key);

      expect(onChange).toHaveBeenCalledExactlyOnceWith(' s');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    test('moves the highlight past options whose values differ only in whitespace, one at a time', async () => {
      const user = userEvent.setup();
      const { onChange } = renderSelect({
        value: undefined,
        options: {
          enumOptions: [
            { label: 'Spaced', value: ' a' },
            { label: 'Plain', value: 'a' },
            { label: 'Next', value: 'b' },
          ],
          optionValueFormat: 'realValue',
        },
      });
      const highlighted = () =>
        screen
          .getAllByRole('option')
          .filter((option) => option.getAttribute('aria-selected') === 'true')
          .map((option) => option.textContent);

      await user.tab();
      await user.keyboard('{Enter}');
      expect(highlighted()).toEqual(['Spaced']);
      await user.keyboard('{ArrowDown}');
      expect(highlighted()).toEqual(['Plain']);
      await user.keyboard('{ArrowDown}');
      expect(highlighted()).toEqual(['Next']);
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
    });

    test('closes when it turns readonly while open', async () => {
      const user = userEvent.setup();
      const { combobox, rerender } = renderSelect();

      await user.click(combobox);
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
      rerender(
        <SelectWidget
          {...makeWidgetMockProps({
            id: 'root_color',
            label: 'Color',
            disabled: false,
            readonly: true,
            autofocus: false,
            options: { enumOptions },
          })}
        />,
      );

      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    test('closes on Escape without choosing', async () => {
      const user = userEvent.setup();
      const { combobox, onChange } = renderSelect();

      await user.click(combobox);
      await user.keyboard('{Escape}');

      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(combobox).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
    });

    test('closes only its list, not the Radix dialog it is in, on an Escape while open', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <Dialog.Root open onOpenChange={onOpenChange}>
          <Dialog.Portal>
            <Dialog.Content aria-describedby={undefined}>
              <Dialog.Title>Edit</Dialog.Title>
              <SelectWidget
                {...makeWidgetMockProps({
                  id: 'root_color',
                  label: 'Color',
                  disabled: false,
                  readonly: false,
                  autofocus: false,
                  options: { enumOptions },
                })}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      const combobox = screen.getByRole('combobox');

      await user.click(combobox);
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
      await user.keyboard('{Escape}');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(combobox).toHaveFocus();
      expect(onOpenChange).not.toHaveBeenCalled();

      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    });

    test('chooses the highlighted option on Space while open', async () => {
      const user = userEvent.setup();
      const { combobox, onChange } = renderSelect();

      await user.click(combobox);
      await user.keyboard('{ArrowDown}');
      await user.keyboard(' ');

      expect(onChange).toHaveBeenCalledExactlyOnceWith('green');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    test('skips an option ui:enumDisabled disables, which it marks disabled', async () => {
      const user = userEvent.setup();
      const { combobox } = renderSelect({ options: { enumOptions, enumDisabled: ['green'] } });

      await user.click(combobox);
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('option', { name: 'Green' })).toHaveAttribute('aria-disabled', 'true');
      expect(highlightedOption()).toHaveTextContent('Blue');
      expect(combobox).toHaveAttribute('aria-activedescendant', highlightedOption()!.id);
    });
  });

  test('points at the highlighted option again when the options remount while it is open', async () => {
    const user = userEvent.setup();
    const props = makeWidgetMockProps({
      id: 'root_color',
      label: 'Color',
      disabled: false,
      readonly: false,
      autofocus: false,
      options: { enumOptions },
    });
    const { rerender } = render(<SelectWidget {...props} />);
    const combobox = screen.getByRole('combobox');

    Element.prototype.scrollIntoView = vi.fn();
    try {
      await user.click(combobox);
      await user.keyboard('{ArrowDown}');
      // Grouping the options puts them in new groups, so cmdk mounts them under new ids, keeping its highlight
      rerender(<SelectWidget {...props} options={{ enumOptions, optgroups: { Warm: ['red'] } }} />);

      const highlighted = screen
        .getAllByRole('option')
        .find((option) => option.getAttribute('aria-selected') === 'true');
      expect(highlighted).toHaveTextContent('Green');
      expect(combobox).toHaveAttribute('aria-activedescendant', highlighted!.id);
    } finally {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });
});

describe("the multiple select's combobox input", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  const color: RJSFSchema = {
    type: 'array',
    title: 'Color',
    items: { type: 'string', enum: ['red', 'blue'] },
    uniqueItems: true,
    minItems: 1,
  };
  const renderColorForm = (uiSchema = {}, required = ['color']) =>
    render(
      <Form
        schema={{ type: 'object', required, properties: { color } }}
        uiSchema={uiSchema}
        validator={validator}
        focusOnFirstError
      />,
    );

  test('takes the field id, so clicking the field label focuses it', async () => {
    const user = userEvent.setup();
    renderColorForm();
    const input = screen.getByRole('combobox');

    expect(input).toHaveAttribute('id', 'root_color');
    await user.click(screen.getByText('Color'));
    expect(input).toHaveFocus();
  });

  test('is focused by focusOnFirstError on submit', async () => {
    const user = userEvent.setup();
    renderColorForm();

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  test('says it is collapsed and controls the element its list opens in while its list is closed', () => {
    renderColorForm();
    const input = screen.getByRole('combobox');

    expect(input).toHaveAttribute('aria-expanded', 'false');
    const controlled = input.getAttribute('aria-controls');
    expect(controlled && document.getElementById(controlled)).toBeTruthy();
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  test('stays closed when focusOnFirstError focuses it on submit', async () => {
    const user = userEvent.setup();
    renderColorForm();

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    const input = screen.getByRole('combobox');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('takes focus and opens on a click beside its input, so typing searches and Escape closes', async () => {
    const user = userEvent.setup();
    render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        initialFormData={{ color: ['red'] }}
        validator={validator}
      />,
    );
    const input = screen.getByRole('combobox');

    await user.click(screen.getByText('red'));
    expect(input).toHaveFocus();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('bl');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('bl');

    await user.keyboard('{Backspace}{Backspace}{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('never points at the listbox or option of an earlier opening as it opens again', async () => {
    const user = userEvent.setup();
    renderColorForm();
    const input = screen.getByRole('combobox');

    await user.click(input);
    const earlier = [screen.getByRole('listbox').id, screen.getByRole('option', { name: 'red' }).id];
    await user.keyboard('{Escape}');

    const held: (string | null)[] = [];
    const observer = new MutationObserver((records) => {
      held.push(...records.map((record) => record.oldValue));
    });
    observer.observe(input, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['aria-controls', 'aria-activedescendant'],
    });
    await user.click(input);
    observer.disconnect();

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(held.filter((value) => value !== null && earlier.includes(value))).toEqual([]);
  });

  test('points at the listbox and at the option it highlights while its list is open', async () => {
    const user = userEvent.setup();
    renderColorForm();
    const input = screen.getByRole('combobox');

    await user.click(input);
    await user.keyboard('{ArrowDown}');

    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'blue' }).id);
  });

  test('points at the option it highlights as its list opens and as a search changes the options', async () => {
    const user = userEvent.setup();
    renderColorForm();
    const input = screen.getByRole('combobox');

    await user.click(input);
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'red' }).id);

    await user.type(input, 'bl');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'blue' }).id);
  });

  test('is named by the field label pointing at it', () => {
    renderColorForm({}, []);

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Color');
  });

  test('opens on Up Arrow as on Down Arrow, as a closed combobox does', async () => {
    const user = userEvent.setup();
    renderColorForm({ color: { 'ui:autofocus': true } });

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await user.keyboard('{ArrowUp}');
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  test('turns off the browser autofill, autocorrect and spellcheck that would cover its list', () => {
    renderColorForm();
    const input = screen.getByRole('combobox');

    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
  });

  test("ranks a search's matches by how well they match, so Enter adds the best", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Form
        schema={{
          type: 'array',
          uniqueItems: true,
          items: { type: 'string', enum: ['Pineapple', 'Grape', 'Apple', 'Applet'] },
        }}
        validator={validator}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole('combobox'), 'appl');

    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Apple', 'Applet', 'Pineapple']);
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: ['Apple'] }), 'root');
  });

  test('opens again on Down Arrow with a search left in it, as focus coming back leaves it closed', async () => {
    const user = userEvent.setup();
    renderColorForm();
    const input = screen.getByRole('combobox');

    await user.type(input, 'bl');
    await user.tab();
    await user.tab({ shift: true });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['blue']);
  });

  test('stays closed on an arrow on a remove button, whose Enter removes only its own item', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'object', properties: { color: { ...color, minItems: undefined } } }}
        initialFormData={{ color: ['red'] }}
        validator={validator}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.tab({ shift: true });
    const remove = screen.getByRole('button', { name: '' });
    expect(remove).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(remove).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { color: [] } }), 'root_color');
  });

  test('removes the item whose remove button Backspace or Delete is pressed on only by its Enter, never the last item', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            color: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['red', 'blue', 'green'] } },
          },
        }}
        initialFormData={{ color: ['red', 'blue', 'green'] }}
        validator={validator}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    await user.keyboard('{Backspace}{Delete}{Enter}');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { color: ['blue', 'green'] } }),
      'root_color',
    );
  });

  test('closes its list on Escape and keeps focus, with a search in its input or none', async () => {
    const user = userEvent.setup();
    renderColorForm();
    const input = screen.getByRole('combobox');

    await user.type(input, 'bl');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveValue('bl');
    expect(input).toHaveFocus();

    await user.clear(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveFocus();
  });

  test('neither takes focus nor opens on a right-click on a selected item', async () => {
    const user = userEvent.setup();
    render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        initialFormData={{ color: ['red'] }}
        validator={validator}
      />,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('red') });

    expect(screen.getByRole('combobox')).not.toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('keeps focus on its input and its list open on a right-click on a selected item', async () => {
    const user = userEvent.setup();
    render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        initialFormData={{ color: ['red'] }}
        validator={validator}
      />,
    );
    const input = screen.getByRole('combobox');

    await user.click(input);
    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('red') });

    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  test('keeps an Escape that closes its list from the page, and lets one through while the list is closed', async () => {
    const user = userEvent.setup();
    // As a Radix dialog listens: on the document, in the capture phase, before any React handler, dismissing unless the
    // Escape is already marked handled
    const onPageEscape = vi.fn();
    const listen = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        onPageEscape();
      }
    };
    document.addEventListener('keydown', listen, { capture: true });
    try {
      renderColorForm();
      const input = screen.getByRole('combobox');

      await user.type(input, 'bl');
      await user.keyboard('{Escape}');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(onPageEscape).not.toHaveBeenCalled();

      await user.keyboard('{Escape}');
      expect(onPageEscape).toHaveBeenCalledOnce();
    } finally {
      document.removeEventListener('keydown', listen, { capture: true });
    }
  });

  test('closes only its list, not the Radix dialog the form is in, on an Escape while its list is shown', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog.Root open onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Content aria-describedby={undefined}>
            <Dialog.Title>Edit</Dialog.Title>
            <Form schema={{ type: 'object', properties: { color } }} validator={validator} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    const input = screen.getByRole('combobox');

    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveFocus();
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  test('keeps an Escape that closes its list from the page while it renders in a shadow root', async () => {
    const user = userEvent.setup();
    const onPageEscape = vi.fn();
    const listen = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        onPageEscape();
      }
    };
    const host = document.body.appendChild(document.createElement('div'));
    const container = host.attachShadow({ mode: 'open' }).appendChild(document.createElement('div'));
    document.addEventListener('keydown', listen, { capture: true });
    try {
      render(<Form schema={{ type: 'object', properties: { color } }} validator={validator} />, { container });
      const input = within(container).getByRole('combobox');

      await user.click(input);
      expect(input).toHaveAttribute('aria-expanded', 'true');
      await user.keyboard('{Escape}');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(onPageEscape).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', listen, { capture: true });
      host.remove();
    }
  });

  test('leaves an Escape that ends an IME composition to the IME, keeping its list open', async () => {
    const user = userEvent.setup();
    const onPageEscape = vi.fn();
    const listen = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        onPageEscape();
      }
    };
    document.addEventListener('keydown', listen, { capture: true });
    try {
      renderColorForm();
      const input = screen.getByRole('combobox');

      await user.click(input);
      // user-event can't mark a key press as part of an IME composition, so the keydown is dispatched with
      // `isComposing` set
      fireEvent.keyDown(input, { key: 'Escape', isComposing: true });
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(onPageEscape).toHaveBeenCalledOnce();
    } finally {
      document.removeEventListener('keydown', listen, { capture: true });
    }
  });

  test('neither takes focus nor opens on a Ctrl+click on a selected item, which opens the context menu on a Mac', async () => {
    const user = userEvent.setup();
    render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        initialFormData={{ color: ['red'] }}
        validator={validator}
      />,
    );

    await user.keyboard('{Control>}');
    await user.click(screen.getByText('red'));
    await user.keyboard('{/Control}');

    expect(screen.getByRole('combobox')).not.toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('scrolls the option it highlights into view as Up Arrow opens its list and as a search moves the highlight', async () => {
    const user = userEvent.setup();
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            color: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['red', 'blue', 'green'] } },
          },
        }}
        validator={validator}
      />,
    );
    const input = screen.getByRole('combobox');
    const highlighted = () => document.getElementById(input.getAttribute('aria-activedescendant') ?? '');
    const scrolledTo = () => vi.mocked(Element.prototype.scrollIntoView).mock.contexts.at(-1);

    await user.click(input);
    await user.keyboard('{Escape}{ArrowUp}');
    expect(highlighted()).toHaveTextContent('green');
    expect(scrolledTo()).toBe(highlighted());

    await user.keyboard('{ArrowUp}');
    expect(highlighted()).toHaveTextContent('blue');
    await user.type(input, 'red');
    expect(highlighted()).toHaveTextContent('red');
    expect(scrolledTo()).toBe(highlighted());
  });

  test('leaves its list where it is as the pointer moves the highlight', async () => {
    const user = userEvent.setup();
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            color: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['red', 'blue', 'green'] } },
          },
        }}
        validator={validator}
      />,
    );
    const input = screen.getByRole('combobox');
    const highlighted = () => document.getElementById(input.getAttribute('aria-activedescendant') ?? '');

    await user.click(input);
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    await user.hover(screen.getByRole('option', { name: 'green' }));

    expect(highlighted()).toHaveTextContent('green');
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  test('scrolls the group heading into view with the option it highlights first in that group', async () => {
    const user = userEvent.setup();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          readonly: false,
          multiple: true,
          value: [],
          options: {
            enumOptions: ['red', 'blue'].map((value) => ({ label: value, value })),
            optgroups: { Warm: ['red'], Cool: ['blue'] },
          },
        })}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}{ArrowUp}');

    const scrolled = vi.mocked(Element.prototype.scrollIntoView).mock.contexts;
    expect(scrolled).toContain(screen.getByText('Cool'));
    expect(scrolled.at(-1)).toBe(screen.getByRole('option', { name: 'blue' }));
  });

  test('stays closed as it is enabled again after turning readonly while open', async () => {
    const user = userEvent.setup();
    const props = makeWidgetMockProps({
      autofocus: false,
      readonly: false,
      multiple: true,
      value: [],
      options: { enumOptions: ['red', 'blue'].map((value) => ({ label: value, value })) },
    });
    const { rerender } = render(<SelectWidget {...props} />);
    const input = screen.getByRole('combobox');

    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    rerender(<SelectWidget {...props} readonly />);
    rerender(<SelectWidget {...props} />);

    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('reports no change on Backspace or Delete in its empty input with nothing selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Form schema={{ type: 'object', properties: { color } }} validator={validator} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Backspace}{Delete}');
    expect(onChange).not.toHaveBeenCalled();

    // The same keys reach the input and report a change once an item is selected
    await user.click(screen.getByRole('option', { name: 'red' }));
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { color: [] } }), 'root_color');
  });

  test('opens its closed list on Enter at the first match and on Up Arrow at the last', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            color: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['red', 'blue', 'green'] } },
          },
        }}
        validator={validator}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole('combobox');
    const highlighted = () => document.getElementById(input.getAttribute('aria-activedescendant') ?? '');

    await user.click(input);
    await user.keyboard('{Escape}');
    await user.keyboard('{Enter}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(highlighted()).toHaveTextContent('red');
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard('{Escape}{ArrowUp}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(highlighted()).toHaveTextContent('green');

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { color: ['green'] } }),
      'root_color',
    );
  });

  test('keeps focus on its input and its list open on a click on a group heading', async () => {
    const user = userEvent.setup();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          readonly: false,
          multiple: true,
          value: [],
          options: {
            enumOptions: ['red', 'blue'].map((value) => ({ label: value, value })),
            optgroups: { Warm: ['red'], Cool: ['blue'] },
          },
        })}
      />,
    );
    const input = screen.getByRole('combobox');

    await user.click(input);
    await user.click(screen.getByText('Warm'));

    expect(input).toHaveFocus();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test('takes no focus, and so reports no blur, on a click on a selected item of a readonly select', async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          readonly: true,
          multiple: true,
          value: ['red'],
          options: { enumOptions: ['red', 'blue'].map((value) => ({ label: value, value })) },
          onFocus,
          onBlur,
        })}
      />,
    );

    await user.click(screen.getByText('red'));
    await user.click(document.body);

    expect(onFocus).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();
  });
});

describe("the single select's combobox with no option to show", () => {
  const props = (enumOptions: { label: string; value: string }[]) =>
    makeWidgetMockProps({
      id: 'root_color',
      label: 'Color',
      disabled: false,
      readonly: false,
      autofocus: false,
      value: undefined,
      options: { enumOptions },
    });

  test('stays collapsed on Down Arrow', async () => {
    const user = userEvent.setup();
    render(<SelectWidget {...props([])} />);
    const combobox = screen.getByRole('combobox');

    await user.click(combobox);
    await user.keyboard('{ArrowDown}');

    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).not.toHaveAttribute('aria-activedescendant');
  });

  test('collapses and points at no option once its options empty while it is open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SelectWidget {...props([{ label: 'Red', value: 'red' }])} />);
    const combobox = screen.getByRole('combobox');

    Element.prototype.scrollIntoView = vi.fn();
    try {
      await user.click(combobox);
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
      rerender(<SelectWidget {...props([])} />);

      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(combobox).not.toHaveAttribute('aria-activedescendant');
      const controlled = combobox.getAttribute('aria-controls');
      expect(controlled && document.getElementById(controlled)).toBeTruthy();
    } finally {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });
});

describe("the multiple select's search among optgroups", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  const renderFruit = (optgroups: Record<string, string[]>) =>
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          autofocus: false,
          disabled: false,
          readonly: false,
          multiple: true,
          value: [],
          options: {
            enumOptions: ['Pineapple', 'Grape', 'Apple', 'Applet'].map((fruit) => ({ label: fruit, value: fruit })),
            optgroups,
          },
        })}
      />,
    );

  test('ranks the matches in a group by how well they match, highlighting the best', async () => {
    const user = userEvent.setup();
    renderFruit({ Fruit: ['Pineapple', 'Grape', 'Apple', 'Applet'] });

    await user.type(screen.getByRole('combobox'), 'appl');

    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Apple', 'Applet', 'Pineapple']);
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
  });

  test('ranks the groups by their best match, highlighting the best match of all', async () => {
    const user = userEvent.setup();
    renderFruit({ Tropical: ['Pineapple'], Orchard: ['Grape', 'Apple', 'Applet'] });

    await user.type(screen.getByRole('combobox'), 'appl');

    const [first, second] = screen.getAllByRole('group');
    expect(first).toHaveAccessibleName('Orchard');
    expect(second).toHaveAccessibleName('Tropical');
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Apple', 'Applet', 'Pineapple']);
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
  });
});
