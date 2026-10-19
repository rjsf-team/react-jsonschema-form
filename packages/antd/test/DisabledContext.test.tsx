import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';

import Form from '../src/index.ts';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    text: { type: 'string', title: 'Text' },
    number: { type: 'number', title: 'Number' },
    password: { type: 'string', title: 'Password' },
    textarea: { type: 'string', title: 'Textarea' },
    select: { type: 'string', title: 'Select', enum: ['a', 'b'] },
    checkbox: { type: 'boolean', title: 'Checkbox' },
    range: { type: 'number', title: 'Range', minimum: 0, maximum: 10 },
  },
};

const uiSchema: UiSchema = {
  password: { 'ui:widget': 'password' },
  textarea: { 'ui:widget': 'textarea' },
  range: { 'ui:widget': 'range' },
};

function renderForm(componentDisabled: boolean) {
  const { container } = render(
    <ConfigProvider componentDisabled={componentDisabled}>
      <Form schema={schema} uiSchema={uiSchema} validator={validator} />
    </ConfigProvider>,
  );
  return container;
}

describe('antd DisabledContext', () => {
  it('disables every widget of an enabled field under a ConfigProvider with componentDisabled (#5506)', () => {
    const container = renderForm(true);

    expect(screen.getByRole('textbox', { name: 'Text' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'Number' })).toBeDisabled();
    expect(container.querySelector('#root_password')).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Textarea' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Select' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Checkbox' })).toBeDisabled();
    expect(container.querySelector('#root_range .ant-slider-disabled, #root_range.ant-slider-disabled')).not.toBeNull();
  });

  it('leaves the same fields enabled without the context', () => {
    renderForm(false);

    expect(screen.getByRole('textbox', { name: 'Text' })).toBeEnabled();
    expect(screen.getByRole('spinbutton', { name: 'Number' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Checkbox' })).toBeEnabled();
  });
});
