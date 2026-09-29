import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Templates from '../src/templates/index.ts';
import AltDateWidget from '../src/widgets/DateTime/AltDateWidget.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'string', format: 'date-time' };

function makeProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    schema,
    registry: getTestRegistry(schema, {}, Templates, {}),
    options: {},
    label: 'Alt Date',
    value: undefined,
    required: false,
    disabled: false,
    readonly: false,
    multiple: false,
    rawErrors: [],
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    ...props,
  };
}

function renderWidget(props: Partial<WidgetProps> = {}) {
  return render(
    <MantineProvider>
      <AltDateWidget {...makeProps(props)} />
    </MantineProvider>,
  );
}

describe('AltDateWidget', () => {
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
      hideLabel: true,
      options: {
        description: 'Test description',
      },
    });
    expect(queryByText('Test description')).not.toBeInTheDocument();
  });

  test('renders no description element without a description', () => {
    const { container } = renderWidget();
    expect(container.querySelector('.mantine-InputWrapper-description')).toBeNull();
  });

  test('shows a zero hour, minute and second', () => {
    const { getAllByRole } = renderWidget({ time: true, value: '2020-01-02T00:00:00.000Z' });

    expect(getAllByRole('combobox').map((part) => (part as HTMLInputElement).value)).toEqual([
      '2020',
      '1',
      '2',
      '0',
      '0',
      '0',
    ]);
  });

  test.each(['disabled', 'readonly'])('disables the Now and Clear buttons when %s', (state) => {
    const { getByRole } = renderWidget({ [state]: true });

    expect(getByRole('button', { name: 'Now' })).toBeDisabled();
    expect(getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  test('marks each part invalid, without repeating the errors, when the field has errors', () => {
    const { getAllByRole, getAllByText } = renderWidget({ rawErrors: ['An error'] });

    for (const part of getAllByRole('combobox')) {
      expect(part).toHaveAttribute('aria-invalid', 'true');
    }
    expect(getAllByText('An error')).toHaveLength(1);
  });

  test('leaves the parts unmarked when the field has no errors', () => {
    const { getAllByRole } = renderWidget();

    for (const part of getAllByRole('combobox')) {
      expect(part).not.toHaveAttribute('aria-invalid');
    }
  });

  test.each([
    ['styles each part as successful while the success message is shown', [], true],
    ['leaves the parts unstyled while the field has errors', ['An error'], false],
  ])('%s', (_, rawErrors, styled) => {
    const { getAllByRole } = renderWidget({ options: { success: 'Looks good' }, rawErrors });

    for (const part of getAllByRole('combobox')) {
      expect(part.hasAttribute('data-success')).toBe(styled);
    }
  });

  test('focuses the first part when autofocus is set', () => {
    const { getAllByRole } = renderWidget({ autofocus: true });

    expect(getAllByRole('combobox')[0]).toHaveFocus();
  });

  test('calls onFocus and onBlur with the part id and value', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const { getAllByRole } = renderWidget({ value: '2020-01-02', onFocus, onBlur });

    // Tabbing, since a click opens the part's dropdown, which calls `scrollIntoView`, which jsdom lacks
    await user.tab();
    await user.tab();
    expect(getAllByRole('combobox')[1]).toHaveFocus();
    await user.tab();

    expect(onFocus).toHaveBeenCalledWith('root_month', 1);
    expect(onBlur).toHaveBeenCalledWith('root_month', 1);
  });

  test('renders a success option once, for the field, and describes each part by it', () => {
    const { container, getAllByRole } = renderWidget({ options: { success: 'Looks good' } });

    expect(container.querySelectorAll('[id="root-success"]')).toHaveLength(1);
    for (const part of getAllByRole('combobox')) {
      expect(part).toHaveAccessibleDescription(/Looks good/);
    }
  });
});
