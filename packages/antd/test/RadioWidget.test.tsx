import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ConfigProvider } from 'antd';

import Form from '../src/index.ts';

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'string', enum: ['foo', 'bar'] };

describe('RadioWidget', () => {
  it.each(['ui:disabled', 'ui:readonly'] as const)('disables every option of a %s field', (uiOption) => {
    render(<Form schema={schema} uiSchema={{ 'ui:widget': 'radio', [uiOption]: true }} validator={validator} />);

    expect(screen.getByRole('radio', { name: 'foo' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'bar' })).toBeDisabled();
  });

  it('leaves the options of a ui:readonly field enabled, and its data alone, when readonlyAsDisabled is off', async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={schema}
        uiSchema={{ 'ui:widget': 'radio', 'ui:readonly': true }}
        formContext={{ readonlyAsDisabled: false }}
        validator={validator}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('radio', { name: 'foo' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'bar' })).toBeEnabled();

    await user.click(screen.getByRole('radio', { name: 'foo' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables every option under a ConfigProvider with componentDisabled', async () => {
    const onChange = vi.fn();
    render(
      <ConfigProvider componentDisabled>
        <Form schema={schema} uiSchema={{ 'ui:widget': 'radio' }} validator={validator} onChange={onChange} />
      </ConfigProvider>,
    );

    expect(screen.getByRole('radio', { name: 'foo' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'bar' })).toBeDisabled();

    // antd takes pointer events off a disabled input, so the click a user can still make is on its label
    await user.click(screen.getByText('foo'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
