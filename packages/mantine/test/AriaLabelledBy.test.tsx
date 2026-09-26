import { createTheme, MantineProvider } from '@mantine/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { titleId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

const orderWithoutLabel = ['description', 'input', 'error'];

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
  [
    'a label left out of inputWrapperOrder',
    { title: 'A title' },
    { 'ui:options': { inputWrapperOrder: orderWithoutLabel } },
  ],
  ['no title', {}, {}],
];

function renderField(schema: RJSFSchema, uiSchema: UiSchema = {}) {
  return render(<WrappedForm schema={schema} uiSchema={uiSchema} validator={validator} />);
}

describe('aria-labelledby', () => {
  // Mantine's `Select` and `MultiSelect` point their listbox's `aria-labelledby` at their own label id whenever a label
  // is passed, rendered or not (https://github.com/mantinedev/mantine/issues/9219), so they are left out of the case
  // where `inputWrapperOrder` drops the label, and covered by the pinned and `test.fails` cases below instead. Once a
  // Mantine release fixes that, drop this filter along with the pinned test.
  const labelCaseWidgets = (labelCase: string) =>
    labelCase.includes('inputWrapperOrder')
      ? widgets.filter(([name]) => name !== 'select' && name !== 'multi-select')
      : widgets;

  describe.each(labelCases)('with %s', (labelCase, labelSchema, labelUiSchema) => {
    test.each(labelCaseWidgets(labelCase))('%s widget only references elements that exist', (_, schema, uiSchema) => {
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

  test.each([
    ['checkboxes', 'ui:options', 'group', checkboxesSchema, 'checkboxes'],
    ['checkboxes', 'theme', 'group', checkboxesSchema, 'checkboxes'],
    ['radio', 'ui:options', 'radiogroup', enumSchema, 'radio'],
    ['radio', 'theme', 'radiogroup', enumSchema, 'radio'],
  ] as [string, string, string, RJSFSchema, string][])(
    '%s widget names its group by the field title when an inputWrapperOrder from the %s leaves the label out',
    (_, source, role, schema, widget) => {
      const component = role === 'group' ? 'CheckboxGroup' : 'RadioGroup';
      const components =
        source === 'theme' ? { [component]: { defaultProps: { inputWrapperOrder: orderWithoutLabel } } } : {};
      render(
        <MantineProvider theme={createTheme({ components })}>
          <Form
            schema={{ ...schema, title: 'A title' }}
            uiSchema={{
              'ui:widget': widget,
              ...(source === 'ui:options' && { 'ui:options': { inputWrapperOrder: orderWithoutLabel } }),
            }}
            validator={validator}
          />
        </MantineProvider>,
      );

      expect(screen.getByRole(role)).toHaveAccessibleName('A title');
      expect(screen.getByText('A title')).not.toBeVisible();
    },
  );

  test('range widget names its slider thumb by the shown field title', () => {
    renderField({ type: 'integer', title: 'A title' }, { 'ui:widget': 'range' });

    expect(screen.getByRole('slider')).toHaveAttribute('aria-labelledby', titleId('root'));
    expect(screen.getByRole('slider')).toHaveAccessibleName('A title');
  });

  const selectWidgets: [string, RJSFSchema][] = [
    ['select', enumSchema],
    ['multi-select', checkboxesSchema],
  ];

  // Pins what Mantine's `Select` and `MultiSelect` render today, so the `test.fails` case below can only be failing for
  // the known reason (https://github.com/mantinedev/mantine/issues/9219); remove this test once that case is fixed.
  test.each(selectWidgets)(
    '%s widget labels its listbox by a label id Mantine does not render when inputWrapperOrder leaves the label out',
    (_, schema) => {
      const { container } = renderField(
        { ...schema, title: 'A title' },
        { 'ui:options': { inputWrapperOrder: orderWithoutLabel } },
      );

      expect(screen.getByRole('listbox', { hidden: true })).toHaveAttribute('aria-labelledby', 'root-label');
      expect(container.querySelector('[id="root-label"]')).not.toBeInTheDocument();
    },
  );

  // Mantine's `Select` and `MultiSelect` build their listbox's label id from the `label` prop alone
  // (https://github.com/mantinedev/mantine/issues/9219); once a Mantine release fixes that, this test starts failing and
  // should be removed, along with the pinned test above and the filter in `labelCaseWidgets`.
  test.fails.each(selectWidgets)(
    '%s widget only references elements that exist when inputWrapperOrder leaves the label out',
    (_, schema) => {
      const { container } = renderField(
        { ...schema, title: 'A title' },
        { 'ui:options': { inputWrapperOrder: orderWithoutLabel } },
      );

      for (const el of container.querySelectorAll('[aria-labelledby]')) {
        for (const id of el.getAttribute('aria-labelledby')!.split(/\s+/)) {
          expect(container.querySelector(`[id="${id}"]`)).toBeInTheDocument();
        }
      }
    },
  );
});
