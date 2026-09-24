import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { WidgetProps, RJSFSchema } from '@rjsf/utils';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Templates from '../src/templates/index.ts';
import DateTimeWidget from '../src/widgets/DateTime/DateTimeWidget.tsx';

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
    hideLabel: false,
    rawErrors: [],
    options: {},
    schema,
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    registry: getTestRegistry(schema, {}, Templates, {}),
    ...props,
  } as unknown as WidgetProps;
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
      hideLabel: true,
      options: {
        description: 'Test description',
      },
    });
    expect(queryByText('Test description')).not.toBeInTheDocument();
  });
});
