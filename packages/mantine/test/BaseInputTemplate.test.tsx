import { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import { callerInputPropsTests } from '@rjsf/snapshot-tests';
import type { BaseInputTemplateProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import BaseInputTemplate from '../src/templates/BaseInputTemplate.tsx';
import WrappedForm from './WrappedForm.tsx';

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
  };
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
  // Without a plan, `hideLabel` says a label drawn elsewhere, such as by a custom field, names the input
  test.each([
    [false, 'Name'],
    [true, null],
  ])(
    'rendered without a plan, hideLabel %s, gives the aria-label %s where inputWrapperOrder leaves out the label',
    (hideLabel, ariaLabel) => {
      // oxlint-disable-next-line typescript/no-deprecated -- a widget rendered without a plan reads the deprecated prop
      const { container } = renderTemplate({ hideLabel, options: { inputWrapperOrder: ['input', 'error'] } });

      expect(container.querySelector('input')!.getAttribute('aria-label')).toBe(ariaLabel);
    },
  );

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

  test.each(['5.', '-'])(
    "offers the clear button for the partial number %s, which a number field's input shows",
    async (text) => {
      render(
        <WrappedForm
          schema={{ type: 'number', title: 'Amount' }}
          uiSchema={{ 'ui:allowClearTextInputs': true }}
          validator={validator}
        />,
      );
      await user.type(screen.getByRole('textbox'), text);

      expect(screen.getByRole('textbox')).toHaveValue(text);
      expect(screen.getByRole('button', { name: /clear input/i })).toBeInTheDocument();
    },
  );

  test('sends `options.emptyValue` through `onChange` when the input is cleared', async () => {
    const onChange = vi.fn();

    const { container } = renderTemplate({ onChange, value: 'Bob', options: { emptyValue: 'nothing' } });
    const input = container.querySelector('input')!;
    await user.clear(input);

    expect(onChange).toHaveBeenCalledWith('nothing');
  });

  test('names the numeric pattern of the text input a passed `inputMode` gets a `number` field', () => {
    const numberSchema: RJSFSchema = { type: 'number' };

    const { container } = renderTemplate({
      schema: numberSchema,
      registry: getTestRegistry(numberSchema),
      inputMode: 'decimal',
    });

    expect(container.querySelector('input')).toHaveAttribute('title', 'Enter a number');
  });
});

callerInputPropsTests(WrappedForm);
