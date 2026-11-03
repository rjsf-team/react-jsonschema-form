import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { englishStringTranslator, TranslatableString } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import SelectWidget from '../src/widgets/SelectWidget/SelectWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

/** Records whether each key's `keydown` had its default prevented by the time it reached the document */
function recordPrevented() {
  const prevented: Record<string, boolean> = {};
  const record = (event: KeyboardEvent) => {
    prevented[event.key] = event.defaultPrevented;
  };
  document.addEventListener('keydown', record);
  onTestFinished(() => document.removeEventListener('keydown', record));
  return prevented;
}

describe('SelectWidget', () => {
  const enumOptions = [
    { label: 'Foo', value: 'foo' },
    { label: 'Bar', value: 'bar' },
    { label: 'Baz', value: 'baz' },
    { label: 'Qux', value: 'qux' },
  ];

  test('translates the empty-selection fallback through translateString', () => {
    const baseProps = makeWidgetMockProps({
      value: undefined,
      label: '',
      placeholder: undefined,
      options: { enumOptions },
    });
    const props: WidgetProps = {
      ...baseProps,
      registry: {
        ...baseProps.registry,
        translateString: (stringToTranslate: TranslatableString) =>
          stringToTranslate === TranslatableString.SelectPlaceholder ? 'Elegir...' : stringToTranslate,
      },
    };
    render(<SelectWidget {...props} />);

    expect(screen.getByText('Elegir...')).toBeInTheDocument();
  });

  test.each([
    ['nested BigInt', { count: 10n }, '{"count":"10"}'],
    [
      'circular object',
      (() => {
        const value: Record<string, unknown> = {};
        value.self = value;
        return value;
      })(),
      '[object Object]',
    ],
  ])('renders an example containing a %s without throwing', (_, example, label) => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          // Non-JSON examples are supplied by JavaScript consumers, bypassing the schema type.
          schema: { examples: [example] } as unknown as RJSFSchema,
          value: undefined,
          options: {},
        })}
      />,
    );
    expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
  });

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

  test('multi-select: keeps the selected values in the order of the options', async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget {...makeWidgetMockProps({ value: ['baz'], multiple: true, onChange, options: { enumOptions } })} />,
    );

    await user.click(screen.getByRole('option', { name: 'Foo' }));

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

      expect(screen.getByRole('combobox')).toHaveTextContent('Two');
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

  test('is a combobox expanded while focus is inside its dropdown, which it controls', async () => {
    render(
      <>
        <SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false })} />
        <button type='button'>After select</button>
      </>,
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await user.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'After select' }));
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  test.each<[string, string | undefined, string]>([
    ['{ArrowDown}', 'baz', 'Baz'],
    ['{ArrowDown}', undefined, 'Foo'],
    ['{Alt>}{ArrowDown}{/Alt}', undefined, 'Foo'],
    ['{ArrowUp}', undefined, 'Qux'],
  ])(
    'opens on %s and moves into the selected option, else the first or last (value: %s)',
    async (keys, value, name) => {
      render(<SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, value })} />);

      await user.click(screen.getByRole('combobox'));
      await user.keyboard(keys);

      expect(screen.getByRole('option', { name })).toHaveFocus();
    },
  );

  test('moves between the options a user can reach with the arrow keys, Home and End', async () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          options: { enumOptions, enumDisabled: ['bar'] },
          autofocus: false,
          value: undefined,
        })}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Baz' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: 'Foo' })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('option', { name: 'Qux' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('option', { name: 'Foo' })).toHaveFocus();
  });

  test('closes on Escape, returning focus to its trigger, and opens again on Down Arrow', async () => {
    render(<SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, value: undefined })} />);
    const combobox = screen.getByRole('combobox');

    await user.click(combobox);
    await user.keyboard('{ArrowDown}{Escape}');
    expect(combobox).toHaveFocus();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{ArrowDown}');
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Foo' })).toHaveFocus();
  });

  test.each([
    ['an arrow', '{ArrowDown}'],
    ['a typed letter', 'f'],
  ])('focuses the option %s reopens it onto only once its dropdown is no longer closed by Escape', async (_, key) => {
    render(<SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, value: undefined })} />);
    const combobox = screen.getByRole('combobox');
    const dropdown = combobox.closest('.dropdown')!;
    const foo = screen.getByRole('option', { name: 'Foo' });
    // daisyUI hides the content of a `dropdown-close` dropdown, which a browser won't focus, though jsdom does
    const closedWhenFocused: boolean[] = [];
    foo.addEventListener('focus', () => closedWhenFocused.push(dropdown.classList.contains('dropdown-close')));

    await user.click(combobox);
    await user.keyboard(`{Escape}${key}`);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(foo).toHaveFocus();
    expect(closedWhenFocused).toEqual([false]);
  });

  test.each([
    ['{Home}', 'Foo'],
    ['{End}', 'Qux'],
  ])('opens onto its first or last option on %s from the trigger', async (key, name) => {
    render(<SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, value: 'baz' })} />);
    const combobox = screen.getByRole('combobox');

    await user.click(combobox);
    await user.keyboard(`{Escape}${key}`);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name })).toHaveFocus();
  });

  test.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('chooses an option of a single select on %s, closing it and returning focus to the combobox', async (_, key) => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, value: undefined, onChange })}
      />,
    );
    const combobox = screen.getByRole('combobox');
    let prevented: boolean | undefined;
    const record = (event: KeyboardEvent) => {
      prevented = event.defaultPrevented;
    };
    document.addEventListener('keydown', record);

    await user.click(combobox);
    await user.keyboard(`{ArrowDown}${key}`);
    document.removeEventListener('keydown', record);
    expect(onChange).toHaveBeenLastCalledWith('foo');
    // Left to the browser, Space would scroll the listbox as well
    expect(prevented).toBe(true);
    expect(combobox).toHaveFocus();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  test("multi-select: keeps an option's checkbox out of the tab order and moves on from it with the arrows", async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          options: { enumOptions },
          autofocus: false,
          value: ['foo'],
          multiple: true,
          onChange,
        })}
      />,
    );
    const bar = screen.getByRole('option', { name: 'Bar' });
    const checkbox = bar.querySelector('input')!;
    expect(checkbox).toHaveAttribute('tabindex', '-1');
    expect(checkbox).toHaveAttribute('aria-hidden', 'true');

    // A browser lets no click through to the checkbox, but jsdom does, which puts focus on it as a key's target
    await user.click(checkbox);
    expect(onChange).toHaveBeenLastCalledWith(['foo', 'bar']);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Baz' })).toHaveFocus();
  });

  test('moves on with the arrows from an option ui:enumDisabled disables, which a click still focuses', async () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({ options: { enumOptions, enumDisabled: ['bar'] }, autofocus: false, value: 'qux' })}
      />,
    );
    const bar = screen.getByRole('option', { name: 'Bar' });

    await user.click(bar);
    expect(bar).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Baz' })).toHaveFocus();

    await user.click(bar);
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: 'Foo' })).toHaveFocus();
  });

  test('is one tab stop, as a native select is, so Tab leaves it rather than walking its options', async () => {
    render(
      <>
        <SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, value: undefined })} />
        <button type='button'>Next</button>
      </>,
    );
    for (const option of screen.getAllByRole('option')) {
      expect(option).toHaveAttribute('tabindex', '-1');
    }

    await user.tab();
    expect(screen.getByRole('combobox')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  describe('type-ahead', () => {
    const cities = [
      { label: 'Boston', value: 'bos' },
      { label: 'New Orleans', value: 'nol' },
      { label: 'Newark', value: 'ewr' },
      { label: 'New York', value: 'nyc' },
      { label: 'Nashville', value: 'bna' },
    ];
    const renderCities = (props: Partial<WidgetProps> = {}) =>
      render(
        <SelectWidget
          {...makeWidgetMockProps({
            options: { enumOptions: cities },
            autofocus: false,
            value: undefined,
            ...props,
          })}
        />,
      );

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('moves to the first option whose label starts with what is typed, whatever its case', async () => {
      renderCities();

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('ne');
      expect(screen.getByRole('option', { name: 'New Orleans' })).toHaveFocus();

      await user.keyboard('WA');
      expect(screen.getByRole('option', { name: 'Newark' })).toHaveFocus();
    });

    test('starts over once the interval has passed', async () => {
      renderCities();

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('n');
      vi.setSystemTime(Date.now() + 499);
      await user.keyboard('a');
      expect(screen.getByRole('option', { name: 'Nashville' })).toHaveFocus();

      vi.setSystemTime(Date.now() + 500);
      await user.keyboard('b');
      expect(screen.getByRole('option', { name: 'Boston' })).toHaveFocus();
    });

    test('steps through the labels starting with one letter typed over and over, wrapping around', async () => {
      renderCities();

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('n');
      expect(screen.getByRole('option', { name: 'New Orleans' })).toHaveFocus();
      await user.keyboard('nnn');
      expect(screen.getByRole('option', { name: 'Nashville' })).toHaveFocus();
      await user.keyboard('n');
      expect(screen.getByRole('option', { name: 'New Orleans' })).toHaveFocus();
    });

    test('prefers a label starting with a repeated letter to stepping through the labels', async () => {
      const days = Array.from({ length: 12 }, (_, index) => ({ label: String(index + 1), value: index + 1 }));
      renderCities({ options: { enumOptions: days } });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('11');
      expect(screen.getByRole('option', { name: '11' })).toHaveFocus();

      await user.keyboard('1');
      expect(screen.getByRole('option', { name: '12' })).toHaveFocus();
    });

    test('takes a character typed with AltGr, which some browsers report as Ctrl+Alt', async () => {
      renderCities({ options: { enumOptions: [...cities, { label: 'Łódź', value: 'lcj' }] } });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{Control>}{Alt>}{AltGraph>}ł{/AltGraph}{/Alt}{/Control}');

      expect(screen.getByRole('option', { name: 'Łódź' })).toHaveFocus();
    });

    test('starts a new search once an option is chosen', async () => {
      renderCities({ multiple: true, value: [] });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('b{Enter}n');

      expect(screen.getByRole('option', { name: 'New Orleans' })).toHaveFocus();
    });

    test('goes on from the selected option from the trigger', async () => {
      renderCities({ value: 'nol' });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('n');

      expect(screen.getByRole('option', { name: 'Newark' })).toHaveFocus();
    });

    test('skips an option ui:enumDisabled disables', async () => {
      renderCities({ options: { enumOptions: cities, enumDisabled: ['nol'] } });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('n');

      expect(screen.getByRole('option', { name: 'Newark' })).toHaveFocus();
    });

    test('looks past the whitespace a label starts with, which a browser does not draw', async () => {
      renderCities({ options: { enumOptions: [...cities, { label: '  Chicago', value: 'chi' }] } });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('c');

      expect(screen.getByRole('option', { name: 'Chicago' })).toHaveFocus();
    });

    test('reads a run of whitespace in a label as the one space a browser draws', async () => {
      renderCities({
        options: {
          enumOptions: [
            { label: 'San Antonio', value: 'sat' },
            { label: 'San  Diego', value: 'san' },
          ],
        },
      });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('san d');

      expect(screen.getByRole('option', { name: 'San Diego' })).toHaveFocus();
    });

    test.each([
      ['End', 'n{End}b'],
      ['Escape', 'n{Escape}b'],
    ])('starts a new search after %s', async (_, keys) => {
      renderCities();

      await user.click(screen.getByRole('combobox'));
      await user.keyboard(keys);

      expect(screen.getByRole('option', { name: 'Boston' })).toHaveFocus();
    });

    test('chooses with Space after an arrow, though the label typed before it goes on with a space', async () => {
      const onChange = vi.fn();
      renderCities({ onChange });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('new{ArrowDown} ');

      expect(onChange).toHaveBeenLastCalledWith('ewr');
    });

    test.each([
      ['no label starts with what is typed', 'z'],
      ['a key is pressed with Ctrl, Meta or Alt', '{Control>}n{/Control}{Meta>}n{/Meta}{Alt>}n{/Alt}'],
    ])('stays where it is where %s', async (_, keys) => {
      renderCities();
      const combobox = screen.getByRole('combobox');

      await user.click(combobox);
      await user.keyboard(keys);

      expect(combobox).toHaveFocus();
    });

    test.each([
      ['one key at a time', 'new y'],
      ['with the key before it still held', 'ne{w>}[Space>]{/w}[/Space]y'],
      ['and still held as the next key goes down', 'new[Space>]y[/Space]'],
      ['and held until it repeats', 'new[Space>2/]y'],
    ])('takes Space that goes on with a label as part of it, typed %s', async (_, keys) => {
      const onChange = vi.fn();
      renderCities({ onChange });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard(keys);

      expect(screen.getByRole('option', { name: 'New York' })).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
    });

    test.each([
      ['a typed letter', '[Space>]n[/Space]', 'New Orleans'],
      ['an arrow', '[Space>]{ArrowDown}[/Space]', 'Boston'],
    ])(
      'chooses nothing with Space pressed on the trigger and released on the option %s moves to',
      async (_, keys, name) => {
        const onChange = vi.fn();
        renderCities({ onChange });

        await user.click(screen.getByRole('combobox'));
        await user.keyboard(keys);

        expect(screen.getByRole('option', { name })).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
      },
    );

    test('chooses with Space that goes on with no label', async () => {
      const onChange = vi.fn();
      renderCities({ onChange });

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('b ');

      expect(onChange).toHaveBeenLastCalledWith('bos');
    });

    test.each([
      ['with nothing being typed', ' '],
      ['that goes on with no label', 'z '],
    ])('presses the trigger with Space %s, which opens the list Escape closed', async (_, keys) => {
      renderCities();
      const combobox = screen.getByRole('combobox');

      await user.click(combobox);
      await user.keyboard(`{Escape}${keys}`);

      expect(combobox).toHaveFocus();
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test.each([
    ['an empty list', [], undefined],
    ['a list ui:enumDisabled disables throughout', enumOptions, enumOptions.map(({ value }) => value)],
  ])('keeps the arrows, Home and End from scrolling the page with %s', async (_, options, enumDisabled) => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          options: { enumOptions: options, enumDisabled },
          autofocus: false,
          value: undefined,
        })}
      />,
    );
    const prevented = recordPrevented();

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}{ArrowUp}{Home}{End}');

    expect(prevented).toEqual({ ArrowDown: true, ArrowUp: true, Home: true, End: true });
  });

  test('leaves a browser shortcut on a move key to the browser where no option can be reached', async () => {
    render(
      <SelectWidget {...makeWidgetMockProps({ options: { enumOptions: [] }, autofocus: false, value: undefined })} />,
    );
    const prevented = recordPrevented();

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Meta>}{ArrowUp}{/Meta}{Alt>}{Home}{/Alt}{Control>}{End}{/Control}');

    expect(prevented).toMatchObject({ ArrowUp: false, Home: false, End: false });
  });

  test('closes on Shift+Tab from an option, returning focus to the combobox, and leaves on a second press', async () => {
    render(
      <>
        <button type='button'>Previous</button>
        <SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, value: undefined })} />
      </>,
    );
    const combobox = screen.getByRole('combobox');

    await user.click(combobox);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Bar' })).toHaveFocus();
    const prevented = recordPrevented();
    await user.tab({ shift: true });
    expect(prevented.Tab).toBe(true);
    expect(combobox).toHaveFocus();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Previous' })).toHaveFocus();
  });

  test('closes a single select on a click on an option, returning focus to the combobox, as Enter does', async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, value: undefined, onChange })}
      />,
    );
    const combobox = screen.getByRole('combobox');

    await user.click(combobox);
    await user.click(screen.getByRole('option', { name: 'Baz' }));
    expect(onChange).toHaveBeenLastCalledWith('baz');
    expect(combobox).toHaveFocus();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  test('keeps a multiple select open on a click on an option, for the next choice', async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, value: [], multiple: true, onChange })}
      />,
    );
    const combobox = screen.getByRole('combobox');
    const baz = screen.getByRole('option', { name: 'Baz' });

    await user.click(combobox);
    await user.click(baz);
    expect(onChange).toHaveBeenLastCalledWith(['baz']);
    expect(baz).toHaveFocus();
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
  });

  test('holds no value while nothing is selected and no placeholder shows, though its label is on screen', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        validator={validator}
      />,
    );
    const combobox = screen.getByRole('combobox', { name: 'Color' });

    expect(within(combobox).getByText('Color')).toHaveAttribute('aria-hidden', 'true');
  });

  test('holds its placeholder as its value while nothing is selected', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:placeholder': 'Pick one' } }}
        validator={validator}
      />,
    );

    expect(within(screen.getByRole('combobox', { name: 'Color' })).getByText('Pick one')).not.toHaveAttribute(
      'aria-hidden',
    );
  });

  test.each([
    [true, 'true'],
    [false, null],
  ])('marks its listbox multiselectable only for a multiple select (multiple: %s)', (multiple, attribute) => {
    render(<SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, multiple })} />);

    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe(attribute);
  });

  // A combobox takes no name from the option it displays, so the field's label names it where no label is drawn
  test("is named by the field's label where no label is drawn for it", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(screen.queryByText('Color', { selector: 'label *' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Color');
  });

  test('falls back to its placeholder for an empty aria-label, which names nothing', () => {
    render(
      <SelectWidget
        {...makeWidgetMockProps({ options: { enumOptions }, label: '', placeholder: 'Pick one', 'aria-label': '' })}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pick one');
  });

  test.each<[string, RJSFSchema, unknown]>([
    ['a root select', { type: 'string', enum: ['a', 'b'] }, undefined],
    ['an array item select', { type: 'array', items: { type: 'string', enum: ['a', 'b'] } }, ['a']],
    [
      "an untitled root field's option selector",
      {
        oneOf: [
          { title: 'A', type: 'string' },
          { title: 'B', type: 'number' },
        ],
      },
      undefined,
    ],
  ])('names %s with no title by the translated prompt', (_, schema, formData) => {
    render(<Form schema={schema} initialFormData={formData} validator={validator} />);

    expect(screen.getAllByRole('combobox')[0]).toHaveAccessibleName(
      englishStringTranslator(TranslatableString.SelectPlaceholder),
    );
  });

  test('tells assistive technology a required select is required, as its trigger takes no required attribute', () => {
    render(<SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, autofocus: false, required: true })} />);

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
  });

  test('takes no ui:autofocus while disabled, as a disabled native select takes none', () => {
    render(<SelectWidget {...makeWidgetMockProps({ options: { enumOptions }, autofocus: true, disabled: true })} />);

    expect(screen.getByRole('combobox')).not.toHaveFocus();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  test('names a select with no title by its placeholder before the translated prompt', () => {
    render(
      <Form
        schema={{ type: 'string', enum: ['a', 'b'] }}
        uiSchema={{ 'ui:placeholder': 'Pick one' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pick one');
  });

  test('reports focus and blur for the dropdown as a whole, with the current value', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <SelectWidget
          {...makeWidgetMockProps({ value: 'bar', autofocus: false, onFocus, onBlur, options: { enumOptions } })}
        />
        <button type='button'>After select</button>
      </>,
    );

    await user.click(screen.getByRole('combobox'));
    expect(onFocus).toHaveBeenCalledWith('test-id', 'bar');

    await user.click(screen.getByRole('option', { name: 'Baz' }));
    expect(onBlur).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'After select' }));
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledExactlyOnceWith('test-id', 'bar');
  });

  test('reports the emptyValue on focus and blur when nothing is selected', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <SelectWidget
          {...makeWidgetMockProps({
            value: undefined,
            autofocus: false,
            onFocus,
            onBlur,
            options: { enumOptions, emptyValue: null },
          })}
        />
        <button type='button'>After select</button>
      </>,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('button', { name: 'After select' }));

    expect(onFocus).toHaveBeenCalledWith('test-id', null);
    expect(onBlur).toHaveBeenCalledWith('test-id', null);
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

  test('selects the clicked example when there is no enum', async () => {
    const onChange = vi.fn();
    render(
      <SelectWidget
        {...makeWidgetMockProps({
          value: undefined,
          schema: { type: 'string', examples: ['a', 'b'] },
          options: {},
          onChange,
        })}
      />,
    );

    await user.click(screen.getByRole('option', { name: 'b' }));

    expect(onChange).toHaveBeenLastCalledWith('b');
  });

  test('adds the clicked example to a multiple selection and labels it when there is no enum', async () => {
    const onChange = vi.fn();
    const props = makeWidgetMockProps({
      value: ['a'],
      multiple: true,
      schema: { type: 'string', examples: ['a', 'b'] },
      options: {},
      onChange,
    });
    render(<SelectWidget {...props} />);

    expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByRole('combobox')).getByText('a')).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'b' }));

    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
  });

  test.each(['disabled', 'readonly'] as const)(
    'a %s select opens for reading but commits no option chosen by pointer or keyboard',
    async (state) => {
      const onChange = vi.fn();
      render(
        <SelectWidget
          {...makeWidgetMockProps({
            value: 'a',
            schema: { type: 'string', enum: ['a', 'b'] },
            options: {
              enumOptions: [
                { value: 'a', label: 'a' },
                { value: 'b', label: 'b' },
              ],
            },
            [state]: true,
            autofocus: false,
            onChange,
          })}
        />,
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-disabled', 'true');
      for (const option of screen.getAllByRole('option')) {
        expect(option).toHaveAttribute('aria-disabled', 'true');
      }
      await user.tab();
      expect(combobox).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('option', { name: 'a' })).toHaveFocus();
      await user.keyboard('{Enter}');
      await user.click(screen.getByRole('option', { name: 'b' }));

      expect(onChange).not.toHaveBeenCalled();
    },
  );
});
