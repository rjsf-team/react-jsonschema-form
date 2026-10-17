import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

const schema: RJSFSchema = {
  type: 'object',
  required: ['color'],
  properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } },
};

describe('the group slots a form author gives', () => {
  it("names a radio group by the author's radioGroup aria-labelledby over the plan's", () => {
    const uiSchema: UiSchema = {
      color: {
        'ui:widget': 'radio',
        'ui:options': { mui: { rjsfSlotProps: { radioGroup: { 'aria-labelledby': 'my-heading' } } } },
      },
    };
    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'my-heading');
  });

  it("gives a checkboxes group the author's formGroup role over the plan's", () => {
    const arraySchema: RJSFSchema = {
      type: 'object',
      properties: { colors: { type: 'array', title: 'Colors', uniqueItems: true, items: { enum: ['red', 'blue'] } } },
    };
    const uiSchema: UiSchema = {
      colors: { 'ui:widget': 'checkboxes', 'ui:options': { mui: { rjsfSlotProps: { formGroup: { role: 'list' } } } } },
    };
    render(<Form schema={arraySchema} uiSchema={uiSchema} validator={validator} />);

    expect(screen.getByRole('list')).toHaveAttribute('id', 'root_colors');
  });

  it("puts an author's radio required on each radio's input without marking each option's label", () => {
    const uiSchema: UiSchema = {
      color: { 'ui:widget': 'radio', 'ui:options': { mui: { rjsfSlotProps: { radio: { required: true } } } } },
    };
    const { container } = render(
      <Form schema={{ ...schema, required: [] }} uiSchema={uiSchema} validator={validator} />,
    );

    screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeRequired());
    expect(container.querySelectorAll('.MuiFormControlLabel-asterisk')).toHaveLength(0);
  });
});
