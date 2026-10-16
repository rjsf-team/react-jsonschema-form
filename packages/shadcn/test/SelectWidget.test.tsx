import { useState } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { englishStringTranslator, TranslatableString } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import SelectWidget from '../src/SelectWidget/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const translateToFrench = (stringToTranslate: TranslatableString) =>
  stringToTranslate === TranslatableString.SelectPlaceholder ? 'Choisir ...' : stringToTranslate;

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
            // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
            // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
          // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
          // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
          // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
          // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
          // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
          // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
          // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
          rawErrors: [],
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

    // Moving the highlight scrolls the item into view with an API jsdom lacks
    Element.prototype.scrollIntoView = vi.fn();
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
      delete (Element.prototype as Partial<Element>).scrollIntoView;
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
          // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
          rawErrors: [],
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
            // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
            // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
            // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
    render(<Form schema={schema} validator={validator} formData='none' />);
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
});
