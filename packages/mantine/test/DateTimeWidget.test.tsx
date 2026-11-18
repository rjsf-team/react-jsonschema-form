import { useState } from 'react';
import { createTheme, MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { WidgetProps, RJSFSchema } from '@rjsf/utils';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import pinTimeZone from '../../../testing/pinTimeZone.ts';
import Templates from '../src/templates/index.ts';
import DateTimeWidget from '../src/widgets/DateTime/DateTimeWidget.tsx';
import DateWidget from '../src/widgets/DateTime/DateWidget.tsx';

const user = userEvent.setup();
const schema: RJSFSchema = { type: 'string', format: 'date-time' };

function makeProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    value: '',
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    label: 'DateTime',
    // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
    hideLabel: false,
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
    rawErrors: [],
    options: {},
    schema,
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    registry: getTestRegistry(schema, {}, Templates, {}),
    ...props,
  };
}

function renderWidget(props: Partial<WidgetProps> = {}) {
  return render(
    <MantineProvider env='test'>
      <DateTimeWidget {...makeProps(props)} />
    </MantineProvider>,
  );
}

/** The text a `DateTimePicker`'s button shows, or the value a `DateInput` holds */
function shownValue(container: HTMLElement) {
  const control = container.querySelector('#root');
  return control instanceof HTMLInputElement ? control.value : control?.textContent;
}

/** Opens the picker and clicks a day in the month the stored value is in */
async function pickDay(container: HTMLElement, day: string) {
  await user.click(container.querySelector('button#root')!);
  await user.click(screen.getByRole('button', { name: day }));
}

const isoDateTime: RJSFSchema = { type: 'string', format: 'iso-date-time' };

describe('DateTimeWidget', () => {
  describe('with schema.format = date-time', () => {
    pinTimeZone('America/Los_Angeles');

    test('commits a picked day, keeping the time, as a UTC value with a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = renderWidget({ onChange, value: '2024-01-10T16:00:00.000Z' });

      expect(shownValue(container)).toBe('2024-01-10 08:00:00');
      await pickDay(container, '15 January 2024');

      expect(onChange).toHaveBeenLastCalledWith('2024-01-15T16:00:00.000Z');
    });
  });

  describe('with schema.format = iso-date-time', () => {
    test('commits a naive value with a "T" separator, matching the other themes, without a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = renderWidget({ onChange, schema: isoDateTime, value: '2024-01-10T08:00:00' });

      await pickDay(container, '15 January 2024');

      expect(onChange).toHaveBeenLastCalledWith('2024-01-15T08:00:00');
    });

    test('commits a time picked in the segment named by the field label', async () => {
      const onChange = vi.fn();
      const { container } = renderWidget({ onChange, schema: isoDateTime, value: '2024-01-10T08:00:00' });

      await user.click(container.querySelector('button#root')!);
      await user.click(screen.getByRole('spinbutton', { name: 'DateTime, hour' }));
      await user.keyboard('11');

      expect(onChange).toHaveBeenLastCalledWith('2024-01-10T11:00:00');
    });

    test.each([
      { valueFormat: undefined, withSeconds: true },
      { valueFormat: 'YYYY-MM-DDTHH:mm[ (ss)]', withSeconds: false },
    ])('shows the seconds segment for valueFormat $valueFormat: $withSeconds', async ({ valueFormat, withSeconds }) => {
      const { container } = renderWidget({
        schema: isoDateTime,
        value: '2024-01-10T08:00:00',
        options: { valueFormat },
      });

      await user.click(container.querySelector('button#root')!);

      expect(screen.getByRole('spinbutton', { name: 'DateTime, minute' })).toBeInTheDocument();
      expect(!!screen.queryByRole('spinbutton', { name: 'DateTime, second' })).toBe(withSeconds);
    });

    test('exposes its value, required and invalid state as a combobox named by its label', () => {
      renderWidget({
        required: true,
        // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
        rawErrors: ['bad'],
        schema: isoDateTime,
        value: '2024-01-10T08:00:00',
      });

      const control = screen.getByRole('combobox', { name: 'DateTime' });
      expect(control).toHaveTextContent('2024-01-10T08:00:00');
      expect(control).toBeRequired();
      expect(control).toBeInvalid();
    });

    test('reports no blur or second focus when opening the picker moves focus into it, or when Escape returns focus to it', async () => {
      const onBlur = vi.fn();
      const onFocus = vi.fn();
      const { container } = renderWidget({ onBlur, onFocus, schema: isoDateTime, value: '2024-01-10T08:00:00' });

      await user.click(container.querySelector('button#root')!);

      expect(container.querySelector('[data-dates-dropdown]')).toContainElement(document.activeElement as HTMLElement);
      expect(onBlur).not.toHaveBeenCalled();

      await user.keyboard('{Escape}');

      expect(document.activeElement).toBe(container.querySelector('button#root'));
      expect(onBlur).not.toHaveBeenCalled();
      expect(onFocus).toHaveBeenCalledOnce();

      await user.tab();

      expect(screen.getByRole('button', { name: 'Clear' })).toHaveFocus();
      expect(onBlur).not.toHaveBeenCalled();

      await user.tab();

      expect(onBlur).toHaveBeenCalledExactlyOnceWith('root', '2024-01-10T08:00:00');
      expect(onFocus).toHaveBeenCalledOnce();
    });

    test('calls an onKeyDown option and still opens the picker with Down Arrow', async () => {
      const onKeyDown = vi.fn();
      renderWidget({ options: { onKeyDown }, schema: isoDateTime, value: '2024-01-10T08:00:00' });

      await user.tab();
      await user.keyboard('{ArrowDown}');

      expect(onKeyDown).toHaveBeenCalledOnce();
      expect(screen.getByRole('combobox', { name: 'DateTime' })).toHaveAttribute('aria-expanded', 'true');
    });

    test("calls a theme's onKeyDown", async () => {
      const onKeyDown = vi.fn();
      const theme = createTheme({ components: { DateTimePicker: { defaultProps: { onKeyDown } } } });
      render(
        <MantineProvider env='test' theme={theme}>
          <DateTimeWidget {...makeProps({ schema: isoDateTime, value: '2024-01-10T08:00:00' })} />
        </MantineProvider>,
      );

      await user.tab();
      await user.keyboard('x');

      expect(onKeyDown).toHaveBeenCalledOnce();
    });

    test.each(['{ArrowDown}', '{Alt>}{ArrowDown}{/Alt}'])(
      'opens the picker on its selected day with %s',
      async (keys) => {
        const { container } = renderWidget({ schema: isoDateTime, value: '2024-01-10T08:00:00' });

        await user.tab();
        expect(document.activeElement).toBe(container.querySelector('button#root'));
        await user.keyboard(keys);

        expect(screen.getByRole('combobox', { name: 'DateTime' })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('button', { name: '10 January 2024' })).toHaveFocus();
      },
    );

    test('reports no blur when Enter submits the picker and returns focus to it', async () => {
      const onBlur = vi.fn();
      const { container } = renderWidget({ onBlur, schema: isoDateTime, value: '2024-01-10T08:00:00' });

      await user.click(container.querySelector('button#root')!);
      await user.click(screen.getByRole('spinbutton', { name: 'DateTime, hour' }));
      await user.keyboard('{Enter}');

      expect(container.querySelector('[data-dates-dropdown]')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(container.querySelector('button#root'));
      expect(onBlur).not.toHaveBeenCalled();
    });

    test('calls the onDropdownClose option and reports one blur when a click outside closes the picker', async () => {
      const onBlur = vi.fn();
      const onDropdownClose = vi.fn();
      const { container } = renderWidget({
        onBlur,
        schema: isoDateTime,
        value: '2024-01-10T08:00:00',
        options: { onDropdownClose },
      });

      await user.click(container.querySelector('button#root')!);
      await user.click(document.body);

      expect(container.querySelector('[data-dates-dropdown]')).not.toBeInTheDocument();
      expect(onDropdownClose).toHaveBeenCalledOnce();
      expect(onBlur).toHaveBeenCalledExactlyOnceWith('root', '2024-01-10T08:00:00');
    });

    test('merges the timePickerProps option into the segment labels it gives', async () => {
      const { container } = renderWidget({
        schema: isoDateTime,
        value: '2024-01-10T08:00:00',
        options: { timePickerProps: { hoursInputLabel: 'Hours' } },
      });

      await user.click(container.querySelector('button#root')!);

      expect(screen.getByRole('spinbutton', { name: 'Hours' })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: 'DateTime, minute' })).toBeInTheDocument();
    });

    test("merges a theme's timePickerProps under its own", async () => {
      const theme = createTheme({
        components: { DateTimePicker: { defaultProps: { timePickerProps: { format: '12h' } } } },
      });
      const { container } = render(
        <MantineProvider env='test' theme={theme}>
          <DateTimeWidget {...makeProps({ schema: isoDateTime, value: '2024-01-10T08:00:00' })} />
        </MantineProvider>,
      );

      await user.click(container.querySelector('button#root')!);

      expect(container.querySelector('[data-dates-dropdown]')!.textContent).toMatch(/AM|PM/);
      expect(screen.getByRole('spinbutton', { name: 'DateTime, hour' })).toBeInTheDocument();
    });
  });

  test.each([
    { Widget: DateWidget, component: 'DateInput', schema: { type: 'string', format: 'date' }, value: '2024-01-10' },
    { Widget: DateTimeWidget, component: 'DateTimePicker', schema: isoDateTime, value: '2024-01-10T08:00:00' },
  ])("shows no Clear button on $component under a theme's clearable: false", ({ Widget, component, ...props }) => {
    const theme = createTheme({ components: { [component]: { defaultProps: { clearable: false } } } });
    render(
      <MantineProvider env='test' theme={theme}>
        <Widget {...makeProps(props as Partial<WidgetProps>)} />
      </MantineProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  describe('with a bare day stored for iso-date-time', () => {
    // West of UTC, a day read as UTC midnight shows as the day before
    pinTimeZone('America/Los_Angeles');

    describe.each([
      { Widget: DateTimeWidget, expected: '2020-05-03T00:00:00' },
      { Widget: DateWidget, expected: '2020-05-03' },
    ])('$Widget.name', ({ Widget, expected }) => {
      test.each(['2020-05-03', '2020-05-03+02:00'])(`displays %s as ${expected}`, (value) => {
        const { container } = render(
          <MantineProvider>
            <Widget {...makeProps({ value, schema: { type: 'string', format: 'iso-date-time' } })} />
          </MantineProvider>,
        );

        expect(shownValue(container)).toBe(expected);
      });
    });
  });

  describe.each([
    { Widget: DateTimeWidget, schema: isoDateTime, value: '2024-01-10T08:00:00' },
    { Widget: DateTimeWidget, schema, value: '2024-01-10T08:00:00.000Z' },
    { Widget: DateWidget, schema: { type: 'string', format: 'date' } as RJSFSchema, value: '2024-01-10' },
  ])('clearing $Widget.name with format $schema.format', ({ Widget, schema: fieldSchema, value }) => {
    function renderClearable(props: Partial<WidgetProps> = {}) {
      return render(
        <MantineProvider env='test'>
          <Widget {...makeProps({ schema: fieldSchema, value, ...props })} />
        </MantineProvider>,
      );
    }

    test.each([undefined, null])('commits the emptyValue option %s from the Clear button', async (emptyValue) => {
      const onChange = vi.fn();
      renderClearable({ onChange, options: { emptyValue } });

      await user.click(screen.getByRole('button', { name: 'Clear' }));

      expect(onChange).toHaveBeenCalledExactlyOnceWith(emptyValue);
    });

    test.each([
      { props: { options: { clearable: false } }, reason: 'the clearable option is false' },
      { props: { readonly: true }, reason: 'the field is read-only' },
      { props: { value: '' }, reason: 'there is no value' },
    ])('shows no Clear button when $reason', ({ props }) => {
      renderClearable(props);

      expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    });
  });

  test('DateWidget commits the emptyValue option when its text is deleted', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MantineProvider env='test'>
        <DateWidget {...makeProps({ onChange, schema: { type: 'string', format: 'date' }, value: '2024-01-10' })} />
      </MantineProvider>,
    );

    await user.clear(container.querySelector('input#root')!);

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test('DateWidget commits a pasted date', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MantineProvider env='test'>
        <DateWidget {...makeProps({ onChange, schema: { type: 'string', format: 'date' }, value: '2024-01-10' })} />
      </MantineProvider>,
    );

    await user.clear(container.querySelector('input#root')!);
    await user.paste('2024-01-15');

    expect(onChange).toHaveBeenLastCalledWith('2024-01-15');
  });

  test('DateWidget parses typed text with the dateParser option', async () => {
    const onChange = vi.fn();
    const dateParser = (text: string) => (text === 'mid-jan' ? '2024-01-15' : null);
    const { container } = render(
      <MantineProvider env='test'>
        <DateWidget
          {...makeProps({
            onChange,
            options: { dateParser },
            schema: { type: 'string', format: 'date' },
            value: '2024-01-10',
          })}
        />
      </MantineProvider>,
    );

    await user.clear(container.querySelector('input#root')!);
    await user.paste('mid-jan');

    expect(onChange).toHaveBeenLastCalledWith('2024-01-15');
  });

  describe('DateWidget on a date-time field', () => {
    pinTimeZone('America/Los_Angeles');

    test('commits a pasted date as local midnight in UTC, with a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <MantineProvider env='test'>
          <DateWidget {...makeProps({ onChange, value: '2024-01-10T20:00:00.000Z' })} />
        </MantineProvider>,
      );

      await user.clear(container.querySelector('input#root')!);
      await user.paste('2024-01-15');

      expect(onChange).toHaveBeenLastCalledWith('2024-01-15T08:00:00.000Z');
    });

    test('commits a picked day as local midnight in UTC, with a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <MantineProvider env='test'>
          <DateWidget {...makeProps({ onChange, value: '2024-01-10T20:00:00.000Z' })} />
        </MantineProvider>,
      );

      await user.click(container.querySelector('input#root')!);
      await user.click(screen.getByRole('button', { name: '15 January 2024' }));

      expect(onChange).toHaveBeenLastCalledWith('2024-01-15T08:00:00.000Z');
    });
  });

  test('DateWidget keeps its value when the selected day is clicked again', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MantineProvider env='test'>
        <DateWidget {...makeProps({ onChange, schema: { type: 'string', format: 'date' }, value: '2024-01-10' })} />
      </MantineProvider>,
    );

    await user.click(container.querySelector('input#root')!);
    await user.click(screen.getByRole('button', { name: '10 January 2024' }));

    expect(onChange).toHaveBeenLastCalledWith('2024-01-10');
  });

  test('DateWidget reports a blur when focus moves from its input into a preset', async () => {
    const onBlur = vi.fn();
    const { container } = render(
      <MantineProvider env='test'>
        <DateWidget
          {...makeProps({
            onBlur,
            schema: { type: 'string', format: 'date' },
            options: { presets: [{ value: '2024-01-01', label: 'New year' }] },
          })}
        />
      </MantineProvider>,
    );

    await user.click(container.querySelector('input#root')!);
    expect(screen.getByRole('button', { name: 'New year' })).toBeInTheDocument();
    await user.tab();

    expect(onBlur).toHaveBeenCalledExactlyOnceWith('root', '');
  });

  test('DateTimeWidget reports no blur when opening its modal moves focus into it', async () => {
    const onBlur = vi.fn();
    const { container } = renderWidget({
      onBlur,
      schema: isoDateTime,
      value: '2024-01-10T08:00:00',
      options: { dropdownType: 'modal' },
    });

    await user.click(container.querySelector('button#root')!);

    expect(document.querySelector('[data-dates-modal]')).toContainElement(document.activeElement as HTMLElement);
    expect(onBlur).not.toHaveBeenCalled();
  });

  test.each(['popover', 'modal'])(
    'DateTimeWidget names its open %s as the element it controls',
    async (dropdownType) => {
      const { container } = renderWidget({
        schema: isoDateTime,
        value: '2024-01-10T08:00:00',
        options: { dropdownType },
      });
      const button = container.querySelector('button#root')!;

      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
      const controlled = document.getElementById(button.getAttribute('aria-controls')!);
      expect(controlled).toContainElement(screen.getByRole('button', { name: '10 January 2024' }));

      await user.keyboard('{Escape}');

      await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'false'));
      expect(button).not.toHaveAttribute('aria-controls');
    },
  );

  test.each([
    ['Escape closes', async () => user.keyboard('{Escape}')],
    [
      'Enter submits',
      async () => {
        await user.click(screen.getByRole('spinbutton', { name: 'DateTime, hour' }));
        await user.keyboard('{Enter}');
      },
    ],
  ])('DateTimeWidget reports no blur or second focus when %s its modal and returns focus to it', async (_, close) => {
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const { container } = renderWidget({
      onBlur,
      onFocus,
      schema: isoDateTime,
      value: '2024-01-10T08:00:00',
      options: { dropdownType: 'modal' },
    });
    const button = container.querySelector('button#root')!;

    await user.click(button);
    await close();

    await waitFor(() => expect(document.activeElement).toBe(button));
    expect(onBlur).not.toHaveBeenCalled();
    expect(onFocus).toHaveBeenCalledOnce();

    await user.click(document.body);

    expect(onBlur).toHaveBeenCalledExactlyOnceWith('root', '2024-01-10T08:00:00');
  });

  test('DateTimeWidget reports a blur when its modal closes with returnFocus: false, and a focus when clicked again', async () => {
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const { container } = renderWidget({
      onBlur,
      onFocus,
      schema: isoDateTime,
      value: '2024-01-10T08:00:00',
      options: { dropdownType: 'modal', modalProps: { returnFocus: false } },
    });
    const button = container.querySelector('button#root')!;

    await user.click(button);
    await user.keyboard('{Escape}');

    await waitFor(() => expect(onBlur).toHaveBeenCalledExactlyOnceWith('root', '2024-01-10T08:00:00'));
    expect(document.activeElement).toBe(document.body);

    await user.click(button);

    expect(onFocus).toHaveBeenCalledTimes(2);
  });

  test('DateTimeWidget reports a blur when its modal closes with trapFocus: false after a click inside it', async () => {
    const onBlur = vi.fn();
    const { container } = renderWidget({
      onBlur,
      schema: isoDateTime,
      value: '2024-01-10T08:00:00',
      options: {
        dropdownType: 'modal',
        modalProps: { trapFocus: false },
        submitButtonProps: { 'aria-label': 'Submit' },
      },
    });

    await pickDay(container, '10 January 2024');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(onBlur).toHaveBeenCalledExactlyOnceWith('root', '2024-01-10T08:00:00'));
    expect(document.activeElement).toBe(document.body);
  });

  test('DateTimeWidget reports no blur when its picker opens inside an iframe, and one when focus leaves it', async () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const frameDocument = iframe.contentDocument!;
    const frameUser = userEvent.setup({ document: frameDocument });
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    render(
      <MantineProvider env='test'>
        <DateTimeWidget {...makeProps({ onBlur, onFocus, schema: isoDateTime, value: '2024-01-10T08:00:00' })} />
      </MantineProvider>,
      { container: frameDocument.body },
    );
    const button = frameDocument.querySelector('button#root')!;

    await frameUser.click(button);

    expect(frameDocument.querySelector('[data-dates-dropdown]')).toContainElement(
      frameDocument.activeElement as HTMLElement,
    );
    expect(onBlur).not.toHaveBeenCalled();
    expect(onFocus).toHaveBeenCalledOnce();

    await frameUser.click(frameDocument.body);

    expect(onBlur).toHaveBeenCalledExactlyOnceWith('root', '2024-01-10T08:00:00');
    expect(onFocus).toHaveBeenCalledOnce();
    iframe.remove();
  });

  test('DateTimeWidget reports one blur when a click on its submit button closes the picker', async () => {
    const onBlur = vi.fn();
    const { container } = renderWidget({
      onBlur,
      schema: isoDateTime,
      value: '2024-01-10T08:00:00',
      options: { submitButtonProps: { 'aria-label': 'Submit' } },
    });

    await user.click(container.querySelector('button#root')!);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(container.querySelector('[data-dates-dropdown]')).not.toBeInTheDocument();
    expect(onBlur).toHaveBeenCalledExactlyOnceWith('root', '2024-01-10T08:00:00');
  });

  test('DateTimeWidget reports its blur before the focus of the field focus moves to', async () => {
    const events: string[] = [];
    const { container } = render(
      <MantineProvider env='test'>
        <DateTimeWidget
          {...makeProps({
            schema: isoDateTime,
            value: '2024-01-10T08:00:00',
            onBlur: (id) => events.push(`blur ${id}`),
            onFocus: (id) => events.push(`focus ${id}`),
          })}
        />
        <input aria-label='Next' onFocus={() => events.push('focus next')} />
      </MantineProvider>,
    );

    await user.click(container.querySelector('button#root')!);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('textbox', { name: 'Next' }));

    expect(events).toEqual(['focus root', 'blur root', 'focus next']);
  });

  test('DateTimeWidget reports a blur when its focused Clear button is removed, and a focus when focus returns', async () => {
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    function StatefulWidget() {
      const [value, setValue] = useState<unknown>('2024-01-10T08:00:00');
      return <DateTimeWidget {...makeProps({ onBlur, onFocus, schema: isoDateTime, value, onChange: setValue })} />;
    }
    const { container } = render(
      <MantineProvider env='test'>
        <StatefulWidget />
      </MantineProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    await waitFor(() => expect(onBlur).toHaveBeenCalledOnce());

    await user.click(container.querySelector('button#root')!);

    expect(onFocus).toHaveBeenCalledTimes(2);
  });

  test('DateTimeWidget ignores global options of the names it reads that the field does not set', async () => {
    const onKeyDown = vi.fn();
    const onDropdownClose = vi.fn();
    // Core hands a widget the global options as its own, so the widget can tell them apart only by the uiSchema
    const globalUiOptions = {
      onKeyDown,
      onDropdownClose,
      clearButtonProps: { 'aria-label': 'Global clear' },
      timePickerProps: { hoursInputLabel: 'Global hour' },
    };
    const registry = getTestRegistry(isoDateTime, {}, Templates, {});
    const { container } = renderWidget({
      registry: { ...registry, globalUiOptions },
      options: globalUiOptions,
      schema: isoDateTime,
      value: '2024-01-10T08:00:00',
    });

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    await user.tab();
    await user.keyboard('x');
    await user.click(container.querySelector('button#root')!);
    expect(screen.getByRole('spinbutton', { name: 'DateTime, hour' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(onKeyDown).not.toHaveBeenCalled();
    expect(onDropdownClose).not.toHaveBeenCalled();
  });

  test("DateTimeWidget merges the theme's and the field's popoverProps", async () => {
    const theme = createTheme({
      components: {
        DateTimePicker: { defaultProps: { popoverProps: { classNames: { dropdown: 'theme-dropdown' } } } },
      },
    });
    const { container } = render(
      <MantineProvider env='test' theme={theme}>
        <DateTimeWidget
          {...makeProps({
            schema: isoDateTime,
            value: '2024-01-10T08:00:00',
            options: { popoverProps: { position: 'top' } },
          })}
        />
      </MantineProvider>,
    );

    await user.click(container.querySelector('button#root')!);

    const dropdown = container.querySelector('[data-dates-dropdown]');
    expect(dropdown).toHaveClass('theme-dropdown');
    expect(dropdown).toHaveAttribute('data-position', 'top');
  });

  test("DateTimeWidget keeps Mantine's close handling under a popoverProps onClose option", async () => {
    const onBlur = vi.fn();
    const onDropdownClose = vi.fn();
    const { container } = renderWidget({
      onBlur,
      schema: isoDateTime,
      value: '2024-01-10T08:00:00',
      options: { onDropdownClose, popoverProps: { onClose: vi.fn() } },
    });

    await user.click(container.querySelector('button#root')!);
    await user.click(document.body);

    expect(container.querySelector('[data-dates-dropdown]')).not.toBeInTheDocument();
    expect(onDropdownClose).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledExactlyOnceWith('root', '2024-01-10T08:00:00');
  });

  test("DateTimeWidget leaves DateInput's own options off its button", () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = renderWidget({
      schema: isoDateTime,
      value: '2024-01-10T08:00:00',
      options: { dateParser: () => null, fixOnBlur: false, allowDeselect: true },
    });

    expect(container.querySelector('button#root')).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('shows an epoch at UTC midnight as its day for a field with a custom valueFormat', () => {
    const { container } = renderWidget({
      value: Date.UTC(2020, 4, 3),
      schema: { type: 'string', format: 'date' },
      options: { valueFormat: 'DD.MM.YYYY', displayFormat: 'DD.MM.YYYY' },
    });

    expect(shownValue(container)).toBe('03.05.2020');
  });

  test('uses the default formats for a `valueFormat` or `displayFormat` option that is not a string', async () => {
    const onChange = vi.fn();
    const { container } = renderWidget({
      onChange,
      schema: isoDateTime,
      value: '2024-01-10T08:00:00',
      options: { valueFormat: 5, displayFormat: true },
    });

    expect(shownValue(container)).toBe('2024-01-10T08:00:00');
    await pickDay(container, '15 January 2024');

    expect(onChange).toHaveBeenLastCalledWith('2024-01-15T08:00:00');
  });

  test('renders a blank input instead of an Invalid Date when the stored value is unparsable', () => {
    expect(() => {
      const { container } = renderWidget({ value: 'not-a-date' });
      expect(shownValue(container)).toBe('');
    }).not.toThrow();
  });
  test('renders with description from options', () => {
    const { getByText } = renderWidget({
      options: {
        description: 'Test description',
      },
    });
    expect(getByText('Test description')).toBeInTheDocument();
  });

  test('renders with description from schema', () => {
    const { getByText } = renderWidget({
      schema: {
        type: 'string',
        description: 'Test description from schema',
      },
    });
    expect(getByText('Test description from schema')).toBeInTheDocument();
  });

  test('hides description when hideLabel is true', () => {
    const { queryByText } = renderWidget({
      // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
      hideLabel: true,
      options: {
        description: 'Test description',
      },
    });
    expect(queryByText('Test description')).not.toBeInTheDocument();
  });
});
