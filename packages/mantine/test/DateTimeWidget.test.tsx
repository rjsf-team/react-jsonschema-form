import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { WidgetProps, RJSFSchema } from '@rjsf/utils';
import { ariaDescribedByIds } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import dayjs from 'dayjs';

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
    <MantineProvider>
      <DateTimeWidget {...makeProps(props)} />
    </MantineProvider>,
  );
}

describe('DateTimeWidget', () => {
  test('commits a value with a timezone offset for format=date-time', async () => {
    const onChange = vi.fn();
    const { container } = renderWidget({ onChange });

    const input = container.querySelector<HTMLInputElement>('input#root')!;
    await user.click(input);
    await user.paste('2024-01-01 10:30:00');

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^2024-01-01T\d{2}:\d{2}:00(?:\.\d{3})?Z$/));
  });

  describe('with schema.format = iso-date-time', () => {
    test('commits a naive value with a "T" separator, matching the other themes, without a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = renderWidget({ onChange, schema: { type: 'string', format: 'iso-date-time' } });

      const input = container.querySelector<HTMLInputElement>('input#root')!;
      await user.click(input);
      await user.paste('2024-01-01T10:30:00');

      expect(onChange).toHaveBeenCalledWith('2024-01-01T10:30:00');
    });
  });

  test('shows an epoch at UTC midnight as its day for a field with a custom valueFormat', () => {
    const { container } = renderWidget({
      value: Date.UTC(2020, 4, 3),
      schema: { type: 'string', format: 'date' },
      options: { valueFormat: 'DD.MM.YYYY', displayFormat: 'DD.MM.YYYY' },
    });

    expect(container.querySelector<HTMLInputElement>('input#root')).toHaveValue('03.05.2020');
  });

  test('renders a blank input instead of an Invalid Date when the stored value is unparsable', () => {
    expect(() => {
      const { container } = renderWidget({ value: 'not-a-date' });
      expect(container.querySelector<HTMLInputElement>('input#root')).toHaveValue('');
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

  describe('time picker', () => {
    test.each(['date-time', 'datetime', 'iso-date-time'])('renders a labelled time group for format=%s', (format) => {
      renderWidget({ schema: { type: 'string', format } });

      const group = screen.getByRole('group', { name: 'DateTime time' });
      expect(group).toBeInTheDocument();
      for (const name of ['Hours', 'Minutes', 'Seconds']) {
        expect(screen.getByRole('spinbutton', { name })).toBeInTheDocument();
      }
    });

    test('is not rendered by the DateWidget', () => {
      render(
        <MantineProvider>
          <DateWidget {...makeProps({ schema: { type: 'string', format: 'date' } })} />
        </MantineProvider>,
      );

      expect(screen.queryByRole('group', { name: 'DateTime time' })).not.toBeInTheDocument();
      expect(screen.queryByRole('spinbutton', { name: 'Hours' })).not.toBeInTheDocument();
    });

    test('shows the time of the stored value', () => {
      renderWidget({ value: '2024-01-01T10:30:15', schema: { type: 'string', format: 'iso-date-time' } });

      expect(screen.getByRole('spinbutton', { name: 'Hours' })).toHaveValue('10');
      expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveValue('30');
      expect(screen.getByRole('spinbutton', { name: 'Seconds' })).toHaveValue('15');
    });

    test('commits the stored date with the picked time for format=iso-date-time', async () => {
      const onChange = vi.fn();
      renderWidget({ onChange, value: '2024-01-01T10:30:00', schema: { type: 'string', format: 'iso-date-time' } });

      await user.click(screen.getByRole('spinbutton', { name: 'Hours' }));
      await user.keyboard('11');

      expect(onChange).toHaveBeenLastCalledWith('2024-01-01T11:30:00');
    });

    test('commits the stored date with the picked time, with a timezone offset, for format=date-time', async () => {
      const onChange = vi.fn();
      renderWidget({ onChange, value: dayjs('2024-01-01 10:30:00').toISOString() });

      await user.click(screen.getByRole('spinbutton', { name: 'Hours' }));
      await user.keyboard('11');

      expect(onChange).toHaveBeenLastCalledWith(dayjs('2024-01-01 11:30:00').toISOString());
    });

    test('holds a time picked before there is a date without committing it', async () => {
      const onChange = vi.fn();
      renderWidget({ onChange, schema: { type: 'string', format: 'iso-date-time' } });

      await user.click(screen.getByRole('spinbutton', { name: 'Hours' }));
      await user.keyboard('083015');

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('spinbutton', { name: 'Hours' })).toHaveValue('08');
      expect(screen.getByRole('spinbutton', { name: 'Seconds' })).toHaveValue('15');
    });

    test('describes the hours input by the field ids and marks it invalid when there are errors', () => {
      renderWidget({
        options: { description: 'Test description' },
        rawErrors: ['An error'],
      });

      const hours = screen.getByRole('spinbutton', { name: 'Hours' });
      expect(hours).toHaveAttribute('aria-describedby', ariaDescribedByIds('root'));
      expect(hours).toHaveAttribute('aria-invalid', 'true');
      expect(hours).toHaveAccessibleDescription(/Test description/);
    });

    test('names the time group without a label', () => {
      renderWidget({ label: '' });

      expect(screen.getByRole('group', { name: 'Date time' })).toBeInTheDocument();
    });

    test.each([
      ['disabled', { disabled: true }],
      ['readonly', { readonly: true }],
    ])('can not be changed when %s', async (_, props) => {
      const onChange = vi.fn();
      renderWidget({
        onChange,
        value: '2024-01-01T10:30:00',
        schema: { type: 'string', format: 'iso-date-time' },
        ...props,
      });

      const hours = screen.getByRole('spinbutton', { name: 'Hours' });
      await user.click(hours);
      await user.keyboard('11');

      expect(hours).toHaveValue('10');
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
