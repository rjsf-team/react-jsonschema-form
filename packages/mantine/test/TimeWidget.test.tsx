import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { WidgetProps, RJSFSchema } from '@rjsf/utils';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Templates from '../src/templates/index.ts';
import TimeWidget from '../src/widgets/DateTime/TimeWidget.tsx';

const schema: RJSFSchema = { type: 'string' };

function makeProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    value: '',
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    label: 'Time',
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

function renderTimeWidget(props: Partial<WidgetProps> = {}) {
  return render(
    <MantineProvider>
      <TimeWidget {...makeProps(props)} />
    </MantineProvider>,
  );
}

const user = userEvent.setup();

describe('TimeWidget', () => {
  test('strips a timezone offset from the value for display', () => {
    const { container } = renderTimeWidget({ value: '13:10:30+02:00' });
    expect(container.querySelector<HTMLInputElement>('input#root')).toHaveValue('13:10:30');
  });

  test('appends the local timezone offset and pads seconds when the value is changed', async () => {
    const onChange = vi.fn();
    const { container } = renderTimeWidget({ onChange });

    await user.click(container.querySelector<HTMLInputElement>('input#root')!);
    await user.paste('11:10');

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^11:10:00(?:Z|[+-]\d{2}:\d{2})$/));
  });

  test('calls onChange without a timezone offset when cleared', async () => {
    const onChange = vi.fn();
    const { container } = renderTimeWidget({ value: '11:10:00Z', onChange });

    await user.clear(container.querySelector<HTMLInputElement>('input#root')!);

    expect(onChange).toHaveBeenCalledWith('');
  });

  describe('with schema.format = iso-time', () => {
    const schema = { type: 'string' as const, format: 'iso-time' };

    test('pads seconds but does not add a timezone offset when the value is changed', async () => {
      const onChange = vi.fn();
      const { container } = renderTimeWidget({ onChange, schema });

      await user.click(container.querySelector<HTMLInputElement>('input#root')!);
      await user.paste('11:10');

      expect(onChange).toHaveBeenCalledWith('11:10:00');
    });

    test('displays a stored value as-is', () => {
      const { container } = renderTimeWidget({ value: '13:10:30', schema });
      expect(container.querySelector<HTMLInputElement>('input#root')).toHaveValue('13:10:30');
    });

    test('still strips a timezone offset from a stored value for display', () => {
      const { container } = renderTimeWidget({ value: '13:10:30+02:00', schema });
      expect(container.querySelector<HTMLInputElement>('input#root')).toHaveValue('13:10:30');
    });
  });

  test('renders with description from options', () => {
    const { getByText } = renderTimeWidget({
      options: {
        description: 'Test description',
      },
    });
    expect(getByText('Test description')).toBeInTheDocument();
  });

  test('renders with description from schema', () => {
    const { getByText } = renderTimeWidget({
      schema: {
        type: 'string',
        description: 'Test description from schema',
      },
    });
    expect(getByText('Test description from schema')).toBeInTheDocument();
  });

  test('hides description when hideLabel is true', () => {
    const { queryByText } = renderTimeWidget({
      hideLabel: true,
      options: {
        description: 'Test description',
      },
    });
    expect(queryByText('Test description')).not.toBeInTheDocument();
  });
});
