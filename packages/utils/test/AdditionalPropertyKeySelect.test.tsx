/** @vitest-environment jsdom */
import { fireEvent, render } from '@testing-library/react';

import type { AdditionalPropertyKeySelectProps, Registry, WidgetProps } from '../src/index.ts';
import { AdditionalPropertyKeySelect } from '../src/index.ts';

function SelectWidget({ id, label, options, value, disabled, readonly, required, onChange }: WidgetProps) {
  const { enumDisabled = [] } = options;
  return (
    <select
      id={id}
      aria-label={label}
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

    expect(select.getAttribute('aria-label')).toBe('a Key');
    expect([...select.options].map((option) => option.textContent)).toEqual(['a', 'b']);
    expect(select).toHaveValue('a');
  });

  it('renames the key to the selected name', () => {
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} />);

    fireEvent.change(container.querySelector('#root_a-key')!, { target: { value: 'b' } });

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

  it('shows a value outside the allowed names as a disabled option so the key stays readable', () => {
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} value='zzz' />);
    const select = container.querySelector<HTMLSelectElement>('#root_a-key')!;

    expect([...select.options].map((option) => option.textContent)).toEqual(['zzz', 'a', 'b']);
    expect(select).toHaveValue('zzz');
    expect(select.options[0]).toBeDisabled();
    expect(select.options[1]).not.toBeDisabled();
  });

  it('forwards the disabled, readonly and required flags to the widget', () => {
    const { container } = render(<AdditionalPropertyKeySelect {...baseProps} disabled readonly required />);
    const select = container.querySelector<HTMLSelectElement>('#root_a-key')!;

    expect(select).toBeDisabled();
    expect(select).toBeRequired();
  });
});
