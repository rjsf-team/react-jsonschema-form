import { callerInputPropsTests } from '@rjsf/snapshot-tests';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

describe('BaseInputTemplate', () => {
  test('shows a numeric string in the number input', () => {
    render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:inputType': 'number' }}
        validator={validator}
        initialFormData='5'
      />,
    );

    expect(screen.getByRole('spinbutton')).toHaveValue('5');
  });
  test('shows every digit of a numeric string past the precision of a number', () => {
    render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:inputType': 'number' }}
        validator={validator}
        initialFormData='12345678901234567890'
      />,
    );

    expect(screen.getByRole('spinbutton')).toHaveValue('12345678901234567890');
  });
  test('writes every digit of an edited numeric string past the precision of a number', async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:inputType': 'number' }}
        validator={validator}
        initialFormData='1234567890123456789'
        onChange={onChange}
      />,
    );
    await user.type(screen.getByRole('spinbutton'), '1');

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: '12345678901234567891' }), 'root');
  });
  test('calls `onChangeOverride` with the change event for a numeric field', async () => {
    const schema: RJSFSchema = { type: 'number' };
    const onChange = vi.fn();
    const onChangeOverride = vi.fn();
    const CustomWidget = (props: WidgetProps) => {
      const { BaseInputTemplate } = props.registry.templates;
      return <BaseInputTemplate {...props} onChangeOverride={onChangeOverride} />;
    };

    const { container } = render(
      <Form schema={schema} validator={validator} onChange={onChange} widgets={{ TextWidget: CustomWidget }} />,
    );
    const input = container.querySelector('input')!;
    await user.click(input);
    await user.paste('42');

    expect(onChangeOverride).toHaveBeenCalledTimes(1);
    expect(onChangeOverride.mock.calls[0][0].target.value).toBe('42');
    expect(onChange).not.toHaveBeenCalled();
  });
});

callerInputPropsTests(Form);
