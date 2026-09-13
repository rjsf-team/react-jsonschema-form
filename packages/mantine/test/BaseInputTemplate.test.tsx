import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core';
import type { BaseInputTemplateProps, RJSFSchema } from '@rjsf/utils';
import { fireEvent, render } from '@testing-library/react';

import BaseInputTemplate from '../src/templates/BaseInputTemplate.tsx';

const schema: RJSFSchema = { type: 'string' };

/** Renders the template inside a `MantineProvider`, which its components require */
function renderTemplate(props: Record<string, unknown>) {
  return render(
    <MantineProvider>
      <BaseInputTemplate {...(props as unknown as BaseInputTemplateProps)} />
    </MantineProvider>,
  );
}

/** Builds the props `BaseInputTemplate` needs, with `onChange`/`onChangeOverride` supplied by the caller */
function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    id: 'root_name',
    name: 'name',
    schema,
    registry: getTestRegistry(schema),
    options: {},
    label: 'Name',
    value: '',
    onChange: vi.fn(),
    onBlur: vi.fn(),
    onFocus: vi.fn(),
    ...overrides,
  };
}

describe('mantine BaseInputTemplate', () => {
  test('calls `onChange` with the new value when there is no override', () => {
    const onChange = vi.fn();
    const props = makeProps({ onChange });

    const { container } = renderTemplate(props);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'Bob' } });

    expect(onChange).toHaveBeenCalledWith('Bob');
  });

  test('calls `onChangeOverride` with the change event, not the value', () => {
    // This template used to route both callbacks through one variable and hand the *value* to each, so an
    // `onChangeOverride` — which `@rjsf/core` and the declared type both define as taking the event — got a string.
    const onChange = vi.fn();
    const onChangeOverride = vi.fn();
    const props = makeProps({ onChange, onChangeOverride });

    const { container } = renderTemplate(props);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'Bob' } });

    expect(onChangeOverride).toHaveBeenCalledTimes(1);
    const [arg] = onChangeOverride.mock.calls[0];
    // the override used to receive the string 'Bob'; it must receive the event whose target is the input
    expect(typeof arg).toBe('object');
    expect(arg).toHaveProperty('target', input);
    // the override replaces the default handling
    expect(onChange).not.toHaveBeenCalled();
  });

  test('sends `options.emptyValue` through `onChange` when the input is cleared', () => {
    const onChange = vi.fn();
    const props = makeProps({ onChange, value: 'Bob', options: { emptyValue: 'nothing' } });

    const { container } = renderTemplate(props);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith('nothing');
  });
});
