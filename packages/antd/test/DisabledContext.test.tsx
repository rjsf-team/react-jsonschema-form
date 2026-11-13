import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ConfigProvider } from 'antd';

import Form from '../src/index.ts';

const user = userEvent.setup();

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
    rating: { type: 'integer', title: 'Rating' },
    hiddenList: { type: 'array', title: 'Hidden list', items: { type: 'string' } },
    date: { type: 'string', format: 'date', title: 'Date' },
    altDate: { type: 'string', format: 'date', title: 'Alt date' },
    list: { type: 'array', title: 'List', items: { type: 'string' } },
    extra: { type: 'object', title: 'Extra', additionalProperties: { type: 'string' } },
  },
};

const uiSchema: UiSchema = {
  password: { 'ui:widget': 'password' },
  textarea: { 'ui:widget': 'textarea' },
  range: { 'ui:widget': 'range' },
  rating: { 'ui:widget': 'RatingWidget' },
  hiddenList: { items: { 'ui:widget': 'hidden' } },
  altDate: { 'ui:widget': 'alt-date' },
};

function renderForm(componentDisabled: boolean) {
  const { container } = render(
    <ConfigProvider componentDisabled={componentDisabled}>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        initialFormData={{ select: 'a', range: 4, rating: 2, hiddenList: ['h'], list: ['x'], extra: { key: 'value' } }}
        validator={validator}
      />
    </ConfigProvider>,
  );
  return container;
}

describe('antd DisabledContext', () => {
  it('disables every widget of an enabled field under a ConfigProvider with componentDisabled (#5506)', () => {
    const container = renderForm(true);

    expect(container.querySelector('#root_text')).toBeDisabled();
    expect(container.querySelector('#root_number')).toBeDisabled();
    expect(container.querySelector('#root_password')).toBeDisabled();
    expect(container.querySelector('#root_textarea')).toBeDisabled();
    expect(container.querySelector('#root_select')).toBeDisabled();
    expect(container.querySelector('#root_checkbox')).toBeDisabled();
    expect(container.querySelector('#root_range .ant-slider-disabled, #root_range.ant-slider-disabled')).not.toBeNull();
  });

  it('disables every input and button, the date pickers, the additional key input and the array and alt-date buttons included, under the context (#5506)', () => {
    const container = renderForm(true);

    const controls = container.querySelectorAll('input:not([type=hidden]), textarea, button:not([type=submit])');
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control).toBeDisabled();
    }
  });

  it('posts nothing from the hidden select, range and rating inputs or a hidden field under the context, as for a disabled native control', () => {
    const form = renderForm(true).querySelector('form');

    expect(form).not.toBeNull();
    const posted = form ? new FormData(form) : undefined;
    expect(posted?.getAll('root_select')).toEqual([]);
    expect(posted?.getAll('root_range')).toEqual([]);
    expect(posted?.getAll('root_rating')).toEqual([]);
    expect(posted?.getAll('root_hiddenList_0')).toEqual([]);
  });

  it('takes the rating out of the tab order and ignores a click on a star under the context', async () => {
    renderForm(true);

    const stars = screen.getAllByRole('radio', { name: /star/ });
    expect(stars.length).toBeGreaterThan(0);
    for (const star of stars) {
      expect(star).toHaveAttribute('tabindex', '-1');
    }
    await user.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'false');
  });

  it('leaves the same fields enabled without the context', () => {
    const container = renderForm(false);

    expect(container.querySelector('#root_text')).toBeEnabled();
    expect(container.querySelector('#root_number')).toBeEnabled();
    expect(container.querySelector('#root_checkbox')).toBeEnabled();
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('tabindex', '0');
    const form = container.querySelector('form');
    expect(form ? new FormData(form).getAll('root_hiddenList_0') : undefined).toEqual(['h']);
  });
});
