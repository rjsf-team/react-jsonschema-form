/** @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { AdditionalPropertyKeySelectProps, Registry, RJSFSchema, WidgetProps } from '../src/index.ts';
import { AdditionalPropertyKeySelect, widgetAriaProps } from '../src/index.ts';

function SelectWidget(props: WidgetProps) {
  const { id, options, value, disabled, readonly, required, onChange } = props;
  const { enumDisabled = [] } = options;
  return (
    <select
      id={id}
      {...widgetAriaProps(props)}
      value={value}
      disabled={disabled || readonly}
      required={required}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.enumOptions?.map((option) => (
        <option
          key={String(option.value)}
          value={String(option.value)}
          disabled={enumDisabled.includes(option.value as never)}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

const user = userEvent.setup();

const registry = { widgets: { SelectWidget } } as unknown as Registry;

const baseProps: AdditionalPropertyKeySelectProps = {
  id: 'root_a-key',
  label: 'a Key',
  value: 'a',
  propertyNamesEnum: ['a', 'b'],
  onKeyRename: vi.fn(),
  registry,
};

describe('AdditionalPropertyKeySelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the theme's SelectWidget with the allowed names as its options", () => {
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} />);
    const select = container.querySelector<HTMLSelectElement>('#root_a-key')!;

    expect([...select.options].map((option) => option.textContent)).toEqual(['a', 'b']);
    expect(select).toHaveValue('a');
  });

  it('describes the select by none of the ids a widget rendered without a plan falls back to, which no element has', () => {
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} />);

    expect(container.querySelector('#root_a-key')).not.toHaveAttribute('aria-describedby');
  });

  it("names the select by the key's label where neither it nor its template draws that label", () => {
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} hideLabel />);

    expect(container.querySelector('#root_a-key')).toHaveAttribute('aria-label', 'a Key');
  });

  it("leaves the select named by the key's label its template draws beside it, with no aria-label over it", () => {
    const { container } = render(
      <>
        <label htmlFor='root_a-key'>a Key</label>
        <AdditionalPropertyKeySelect {...baseProps} hideLabel labelledByTemplate />
      </>,
    );
    const select = container.querySelector('#root_a-key');

    expect(select).not.toHaveAttribute('aria-label');
    expect(select).toHaveAccessibleName('a Key');
  });

  it("plans the select to draw the key's label itself where it doesn't leave it off, so names it by nothing else", () => {
    const Spy = vi.fn(SelectWidget);
    const { container } = render(
      <AdditionalPropertyKeySelect
        {...baseProps}
        required
        registry={{ widgets: { SelectWidget: Spy } } as unknown as Registry}
      />,
    );

    expect(container.querySelector('#root_a-key')).not.toHaveAttribute('aria-label');
    expect(Spy.mock.lastCall![0].presentation).toMatchObject({
      label: { by: 'self', text: 'a Key', requiredMarker: true },
      control: { id: 'root_a-key', attributes: { required: true } },
    });
  });

  it('renames the key to the selected name', async () => {
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} />);

    await user.selectOptions(container.querySelector('#root_a-key')!, 'b');

    expect(baseProps.onKeyRename).toHaveBeenCalledWith('b');
  });

  it.each([
    ['the empty value of a cleared selection', ''],
    ['an undefined value', undefined],
    ['a value outside the allowed names', 'zzz'],
  ])('keeps the current key for %s', (_, reported) => {
    function ReportingSelectWidget({ onChange }: WidgetProps) {
      return (
        <button type='button' onClick={() => onChange(reported)}>
          report
        </button>
      );
    }
    const reportingRegistry = { widgets: { SelectWidget: ReportingSelectWidget } } as unknown as Registry;
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} registry={reportingRegistry} />);

    container.querySelector('button')!.click();

    expect(baseProps.onKeyRename).not.toHaveBeenCalled();
  });

  it.each([
    ['disabled', { disabled: true }],
    ['readonly', { readonly: true }],
  ])('keeps the current key when %s, even if the widget still reports a change', (_, flags) => {
    function ReportingSelectWidget({ onChange }: WidgetProps) {
      return (
        <button type='button' onClick={() => onChange('b')}>
          report
        </button>
      );
    }
    const reportingRegistry = { widgets: { SelectWidget: ReportingSelectWidget } } as unknown as Registry;
    const { container } = render(
      <AdditionalPropertyKeySelect {...baseProps} {...flags} registry={reportingRegistry} />,
    );

    container.querySelector('button')!.click();

    expect(baseProps.onKeyRename).not.toHaveBeenCalled();
  });

  it('shows a value outside the allowed names as a disabled option so the key stays readable', () => {
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} value='zzz' />);
    const select = container.querySelector<HTMLSelectElement>('#root_a-key')!;

    expect([...select.options].map((option) => option.textContent)).toEqual(['zzz', 'a', 'b']);
    expect(select).toHaveValue('zzz');
    expect(select.options[0]).toBeDisabled();
    expect(select.options[1]).not.toBeDisabled();
  });

  it('names the current key as the schema default, so no widget renders a blank option beside it', () => {
    let received: RJSFSchema | undefined;
    function CapturingSelectWidget({ schema }: WidgetProps) {
      received = schema;
      return null;
    }
    const capturingRegistry = { widgets: { SelectWidget: CapturingSelectWidget } } as unknown as Registry;
    render(<AdditionalPropertyKeySelect {...baseProps} registry={capturingRegistry} />);

    expect(received?.default).toBe('a');
    expect(received?.enum).toContain('a');
  });

  it('forwards the disabled, readonly and required flags to the widget', () => {
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} disabled readonly required />);
    const select = container.querySelector<HTMLSelectElement>('#root_a-key')!;

    expect(select).toBeDisabled();
    expect(select).toBeRequired();
  });
});
