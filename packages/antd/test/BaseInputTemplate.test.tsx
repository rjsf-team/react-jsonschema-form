import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

describe('BaseInputTemplate', () => {
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
