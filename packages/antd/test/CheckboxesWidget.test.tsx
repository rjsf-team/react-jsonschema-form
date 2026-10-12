import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ConfigProvider } from 'antd';

import Form from '../src/index.ts';

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'array', uniqueItems: true, items: { enum: ['foo', 'bar'] } };

describe('CheckboxesWidget', () => {
  it.each(['ui:disabled', 'ui:readonly'] as const)('disables every option of a %s field', async (uiOption) => {
    const onChange = vi.fn();
    render(
      <Form
        schema={schema}
        uiSchema={{ 'ui:widget': 'checkboxes', [uiOption]: true }}
        validator={validator}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'foo' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'bar' })).toBeDisabled();

    // antd takes pointer events off a disabled input, so the click a user can still make is on its label
    await user.click(screen.getByText('foo'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves the options of a ui:readonly field enabled, and its data alone, when readonlyAsDisabled is off', async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={schema}
        uiSchema={{ 'ui:widget': 'checkboxes', 'ui:readonly': true }}
        formContext={{ readonlyAsDisabled: false }}
        validator={validator}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'foo' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'bar' })).toBeEnabled();

    await user.click(screen.getByRole('checkbox', { name: 'foo' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables every option under a ConfigProvider with componentDisabled', async () => {
    const onChange = vi.fn();
    render(
      <ConfigProvider componentDisabled>
        <Form schema={schema} uiSchema={{ 'ui:widget': 'checkboxes' }} validator={validator} onChange={onChange} />
      </ConfigProvider>,
    );

    expect(screen.getByRole('checkbox', { name: 'foo' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'bar' })).toBeDisabled();

    // antd takes pointer events off a disabled input, so the click a user can still make is on its label
    await user.click(screen.getByText('foo'));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('CheckboxesWidget focus and blur', () => {
  it.each(['indexed', 'realValue'] as const)(
    'reports the focused option value in the %s format, apart from an option sharing its String() (#5315)',
    async (optionValueFormat) => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(
        <Form
          schema={{ type: 'array', uniqueItems: true, items: { enum: [1, '1'] } }}
          uiSchema={{ 'ui:widget': 'checkboxes', 'ui:options': { optionValueFormat } }}
          validator={validator}
          onFocus={onFocus}
          onBlur={onBlur}
        />,
      );

      await user.tab();
      await user.tab();
      await user.tab();

      expect(onFocus.mock.calls).toEqual([
        ['root', 1],
        ['root', '1'],
      ]);
      expect(onBlur.mock.calls).toEqual([
        ['root', 1],
        ['root', '1'],
      ]);
    },
  );
});
