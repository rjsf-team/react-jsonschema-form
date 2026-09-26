import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { titleId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import WrappedForm from './WrappedForm.tsx';

const enumSchema: RJSFSchema = { type: 'string', enum: ['a', 'b'] };
const checkboxesSchema: RJSFSchema = { type: 'array', items: enumSchema, uniqueItems: true };

const widgets: [string, RJSFSchema, UiSchema?][] = [
  ['text', { type: 'string' }],
  ['number', { type: 'number' }],
  ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
  ['password', { type: 'string' }, { 'ui:widget': 'password' }],
  ['select', enumSchema],
  ['multi-select', checkboxesSchema],
  ['checkboxes', checkboxesSchema, { 'ui:widget': 'checkboxes' }],
  ['radio', enumSchema, { 'ui:widget': 'radio' }],
  ['checkbox', { type: 'boolean' }],
  ['range', { type: 'integer' }, { 'ui:widget': 'range' }],
  ['color', { type: 'string', format: 'color' }],
  ['file', { type: 'string', format: 'data-url' }],
  ['time', { type: 'string', format: 'time' }],
  ['date', { type: 'string', format: 'date' }],
  ['date-time', { type: 'string', format: 'date-time' }],
  ['alt-date', { type: 'string' }, { 'ui:widget': 'alt-date' }],
  ['alt-datetime', { type: 'string' }, { 'ui:widget': 'alt-datetime' }],
];

const labelCases: [string, RJSFSchema, UiSchema][] = [
  ['a shown label', { title: 'A title' }, {}],
  ['a hidden label', { title: 'A title' }, { 'ui:label': false }],
  ['no title', {}, {}],
];

function renderField(schema: RJSFSchema, uiSchema: UiSchema = {}) {
  return render(<WrappedForm schema={schema} uiSchema={uiSchema} validator={validator} />);
}

describe('aria-labelledby', () => {
  describe.each(labelCases)('with %s', (_, labelSchema, labelUiSchema) => {
    test.each(widgets)('%s widget only references elements that exist', (_, schema, uiSchema) => {
      const { container } = renderField({ ...schema, ...labelSchema }, { ...uiSchema, ...labelUiSchema });

      for (const el of container.querySelectorAll('[aria-labelledby]')) {
        for (const id of el.getAttribute('aria-labelledby')!.split(/\s+/)) {
          expect(container.querySelector(`[id="${id}"]`)).toBeInTheDocument();
        }
      }
    });
  });

  test.each([
    ['checkboxes', 'group', checkboxesSchema, { 'ui:widget': 'checkboxes' }],
    ['radio', 'radiogroup', enumSchema, { 'ui:widget': 'radio' }],
  ] as [string, string, RJSFSchema, UiSchema][])(
    '%s widget names its group by the field title, whether the label is shown or hidden',
    (_, role, schema, uiSchema) => {
      const { rerender } = renderField({ ...schema, title: 'A title' }, uiSchema);

      expect(screen.getByRole(role)).toHaveAttribute('aria-labelledby', titleId('root'));
      expect(screen.getByRole(role)).toHaveAccessibleName('A title');
      expect(screen.getByText('A title')).toBeVisible();

      rerender(
        <WrappedForm
          schema={{ ...schema, title: 'A title' }}
          uiSchema={{ ...uiSchema, 'ui:label': false }}
          validator={validator}
        />,
      );

      expect(screen.getByRole(role)).toHaveAttribute('aria-labelledby', titleId('root'));
      expect(screen.getByRole(role)).toHaveAccessibleName('A title');
      expect(screen.getByText('A title')).not.toBeVisible();
    },
  );

  test.each([
    ['checkboxes', 'group', checkboxesSchema, { 'ui:widget': 'checkboxes' }],
    ['radio', 'radiogroup', enumSchema, { 'ui:widget': 'radio' }],
  ] as [string, string, RJSFSchema, UiSchema][])(
    '%s widget leaves its group unlabelled when the field has no label',
    (_, role, schema, uiSchema) => {
      renderField(schema, uiSchema);

      expect(screen.getByRole(role)).not.toHaveAttribute('aria-labelledby');
    },
  );
});
