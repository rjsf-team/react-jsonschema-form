import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { BaseInputTemplateProps, RJSFSchema } from '@rjsf/utils';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import BaseInputTemplate from '../src/templates/BaseInputTemplate.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'string' };

function makeProps(props: Partial<BaseInputTemplateProps> = {}): BaseInputTemplateProps {
  return {
    id: 'root_name',
    name: 'name',
    schema,
    registry: getTestRegistry(schema),
    options: {},
    label: 'Name',
    value: '',
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    ...props,
  } as unknown as BaseInputTemplateProps;
}

/** Renders the template inside a `MantineProvider`, which its components require */
function renderTemplate(props: Partial<BaseInputTemplateProps> = {}) {
  return render(
    <MantineProvider>
      <BaseInputTemplate {...makeProps(props)} />
    </MantineProvider>,
  );
}

describe('mantine BaseInputTemplate', () => {
  test('calls `onChange` with the new value when there is no override', async () => {
    const onChange = vi.fn();

    const { container } = renderTemplate({ onChange });
    const input = container.querySelector('input')!;
    await user.click(input);
    await user.paste('Bob');

    expect(onChange).toHaveBeenCalledWith('Bob');
  });

  test('calls `onChangeOverride` with the change event, not the value', async () => {
    const onChange = vi.fn();
    const onChangeOverride = vi.fn();

    const { container } = renderTemplate({ onChange, onChangeOverride });
    const input = container.querySelector('input')!;
    await user.click(input);
    await user.paste('Bob');

    expect(onChangeOverride).toHaveBeenCalledTimes(1);
    expect(onChangeOverride.mock.calls[0][0]).toHaveProperty('target', input);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('calls `onChangeOverride` with the change event for a numeric field too', async () => {
    const numberSchema: RJSFSchema = { type: 'number' };
    const onChange = vi.fn();
    const onChangeOverride = vi.fn();

    const { container } = renderTemplate({
      schema: numberSchema,
      registry: getTestRegistry(numberSchema),
      onChange,
      onChangeOverride,
    });
    const input = container.querySelector('input')!;
    await user.click(input);
    await user.paste('42');

    expect(onChangeOverride).toHaveBeenCalledTimes(1);
    expect(onChangeOverride.mock.calls[0][0]).toHaveProperty('target', input);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('sends the parsed value through `onChange` for a numeric field without an override', async () => {
    const numberSchema: RJSFSchema = { type: 'number' };
    const onChange = vi.fn();

    const { container } = renderTemplate({
      schema: numberSchema,
      registry: getTestRegistry(numberSchema),
      onChange,
    });
    const input = container.querySelector('input')!;
    await user.click(input);
    await user.paste('42');

    expect(onChange).toHaveBeenCalledWith(42);
  });

  test('sends `options.emptyValue` through `onChange` when the input is cleared', async () => {
    const onChange = vi.fn();

    const { container } = renderTemplate({ onChange, value: 'Bob', options: { emptyValue: 'nothing' } });
    const input = container.querySelector('input')!;
    await user.clear(input);

    expect(onChange).toHaveBeenCalledWith('nothing');
  });
});
