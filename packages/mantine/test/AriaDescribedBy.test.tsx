import type { ReactNode } from 'react';
import { use } from 'react';
import { createTheme, InputWrapperContext, MantineProvider } from '@mantine/core';
import type { ErrorSchema, RJSFSchema, UiSchema } from '@rjsf/utils';
import { ariaDescribedByIds, descriptionId, errorId, helpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

const user = userEvent.setup();

const extraErrors = { __errors: ['An error'] } as ErrorSchema;

function renderField(schema: RJSFSchema, uiSchema: UiSchema = {}) {
  return render(
    <WrappedForm
      schema={{ description: 'A description', ...schema }}
      uiSchema={{ 'ui:help': 'Some help', ...uiSchema }}
      validator={validator}
      extraErrors={extraErrors}
      showErrorList={false}
    />,
  );
}

function describedByValues(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[aria-describedby]'), (el) => el.getAttribute('aria-describedby'));
}

const enumSchema: RJSFSchema = { type: 'string', enum: ['a', 'b'] };

function renderThemed(components: Record<string, { defaultProps: object }>, schema: RJSFSchema, uiSchema?: UiSchema) {
  return render(
    <MantineProvider theme={createTheme({ components })}>
      <Form schema={{ description: 'A description', ...schema }} uiSchema={uiSchema} validator={validator} />
    </MantineProvider>,
  );
}

function expectDescribedByFieldIds(schema: RJSFSchema, uiSchema?: UiSchema, describedCount = 1) {
  const { container } = renderField(schema, uiSchema);
  const rjsfIds = ariaDescribedByIds('root').split(' ');

  const values = describedByValues(container);
  expect(values).toHaveLength(describedCount);
  for (const value of values) {
    expect(value?.split(/\s+/)).toEqual(expect.arrayContaining(rjsfIds));
  }
  for (const id of [descriptionId('root'), errorId('root'), helpId('root')]) {
    expect(container.querySelector(`[id="${id}"]`)).toBeInTheDocument();
  }
}

describe('aria-describedby', () => {
  test.each<[string, RJSFSchema, UiSchema?, number?]>([
    ['text', { type: 'string' }],
    ['number', { type: 'number' }],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['password', { type: 'string' }, { 'ui:widget': 'password' }],
    ['select', enumSchema],
    ['multi-select', { type: 'array', items: enumSchema, uniqueItems: true }],
    ['checkboxes', { type: 'array', items: enumSchema, uniqueItems: true }, { 'ui:widget': 'checkboxes' }, 2],
    ['radio', enumSchema, { 'ui:widget': 'radio' }, 2],
    ['range', { type: 'integer' }, { 'ui:widget': 'range' }],
    ['checkbox', { type: 'boolean' }],
    ['color', { type: 'string', format: 'color' }],
    ['file', { type: 'string', format: 'data-url' }],
    ['time', { type: 'string', format: 'time' }],
    ['date', { type: 'string', format: 'date' }],
    ['date-time', { type: 'string', format: 'date-time' }],
    ['alt-date', { type: 'string' }, { 'ui:widget': 'alt-date' }, 3],
    ['alt-datetime', { type: 'string' }, { 'ui:widget': 'alt-datetime' }, 6],
  ])(
    '%s widget describes its input by the field description, error and help',
    (_, schema, uiSchema, describedCount) => {
      expectDescribedByFieldIds(schema, uiSchema, describedCount);
    },
  );

  test('text widget with examples also describes its input by the examples list', () => {
    const { container } = renderField({ type: 'string', examples: ['x'] });

    expect(describedByValues(container)).toEqual([ariaDescribedByIds('root', true)]);
  });

  test.each([
    ['checkboxes', 'group', { type: 'array', items: enumSchema, uniqueItems: true }, { 'ui:widget': 'checkboxes' }],
    ['radio', 'radiogroup', enumSchema, { 'ui:widget': 'radio' }],
  ] as [string, string, RJSFSchema, UiSchema][])(
    '%s widget leaves its group undescribed, since each option input is described',
    (_, role, schema, uiSchema) => {
      renderField(schema, uiSchema);

      expect(screen.getByRole(role)).not.toHaveAttribute('aria-describedby');
    },
  );

  test.each(['inputContainer', 'wrapperProps.inputContainer'])(
    'a %s from ui:options still renders inside the aria-describedby override',
    (option) => {
      const inputContainer = (children: ReactNode) => <div data-testid='custom-container'>{children}</div>;
      const uiOptions = option === 'inputContainer' ? { inputContainer } : { wrapperProps: { inputContainer } };
      const { container } = renderField({ type: 'string' }, { 'ui:options': uiOptions });

      expect(screen.getByTestId('custom-container')).toContainElement(screen.getByRole('textbox'));
      expect(describedByValues(container)).toEqual([ariaDescribedByIds('root')]);
    },
  );

  describe('an inputContainer default from the Mantine theme', () => {
    const inputContainer = (children: ReactNode) => <div data-testid='theme-container'>{children}</div>;

    test.each(['TextInput', 'InputWrapper'])('set on %s still renders inside the aria-describedby override', (name) => {
      const { container } = renderThemed({ [name]: { defaultProps: { inputContainer } } }, { type: 'string' });

      expect(screen.getByTestId('theme-container')).toContainElement(screen.getByRole('textbox'));
      expect(describedByValues(container)).toEqual([ariaDescribedByIds('root')]);
    });

    test('set in wrapperProps still renders inside the aria-describedby override, with the other wrapperProps', () => {
      const { container } = renderThemed(
        { TextInput: { defaultProps: { wrapperProps: { inputContainer, 'data-wrapper': 'theme' } } } },
        { type: 'string' },
      );

      expect(screen.getByTestId('theme-container')).toContainElement(screen.getByRole('textbox'));
      expect(container.querySelector('[data-wrapper="theme"]')).toBeInTheDocument();
      expect(describedByValues(container)).toEqual([ariaDescribedByIds('root')]);
    });

    test('set on CheckboxGroup still renders inside the group aria override', () => {
      renderThemed(
        { CheckboxGroup: { defaultProps: { inputContainer } } },
        { type: 'array', items: enumSchema, uniqueItems: true },
        { 'ui:widget': 'checkboxes' },
      );

      expect(screen.getByTestId('theme-container')).toContainElement(screen.getByRole('group'));
      expect(screen.getByRole('group')).not.toHaveAttribute('aria-describedby');
    });
  });

  test.each([
    ['text', 'wrapperProps.inputContainer', 'textbox', { type: 'string' }, {}],
    [
      'checkboxes',
      'inputContainer',
      'group',
      { type: 'array', items: enumSchema, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
    ],
    ['radio', 'inputContainer', 'radiogroup', enumSchema, { 'ui:widget': 'radio' }],
  ] as [string, string, string, RJSFSchema, UiSchema][])(
    '%s widget renders the %s from ui:options when both are set, as Mantine does',
    (_, winner, role, schema, uiSchema) => {
      const container = (testId: string) => (children: ReactNode) => <div data-testid={testId}>{children}</div>;
      renderField(schema, {
        ...uiSchema,
        'ui:options': {
          inputContainer: container('inputContainer'),
          wrapperProps: { inputContainer: container('wrapperProps.inputContainer') },
        },
      });

      expect(screen.getByTestId(winner)).toContainElement(screen.getByRole(role));
      expect(screen.queryAllByTestId(/inputContainer/)).toHaveLength(1);
    },
  );

  test('an input leaves the label id Mantine puts in the InputWrapper context unchanged', () => {
    function LabelIdProbe({ children }: { children: ReactNode }) {
      return <div data-label-id={use(InputWrapperContext)?.labelId}>{children}</div>;
    }
    const { container } = renderField(
      { type: 'string', title: 'A title' },
      { 'ui:options': { inputContainer: (children: ReactNode) => <LabelIdProbe>{children}</LabelIdProbe> } },
    );

    expect(container.querySelector('[data-label-id]')).toHaveAttribute('data-label-id', 'root-label');
  });

  test.each([
    [
      'checkboxes',
      'CheckboxGroup',
      { type: 'array', items: enumSchema, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
    ],
    ['radio', 'RadioGroup', enumSchema, { 'ui:widget': 'radio' }],
  ] as [string, string, RJSFSchema, UiSchema][])(
    '%s widget keeps the labelProps default from the Mantine theme, with the field title id',
    (_, name, schema, uiSchema) => {
      renderThemed(
        { [name]: { defaultProps: { labelProps: { 'data-theme-label': 'yes' } } } },
        { ...schema, title: 'A title' },
        uiSchema,
      );

      expect(screen.getByText('A title')).toHaveAttribute('data-theme-label', 'yes');
      expect(screen.getByText('A title')).toHaveAttribute('id', 'root__title');
    },
  );

  test.each([
    [
      'checkboxes',
      'ui:options',
      'CheckboxGroup',
      { type: 'array', items: enumSchema, uniqueItems: true },
      'checkboxes',
    ],
    ['checkboxes', 'theme', 'CheckboxGroup', { type: 'array', items: enumSchema, uniqueItems: true }, 'checkboxes'],
    ['radio', 'ui:options', 'RadioGroup', enumSchema, 'radio'],
    ['radio', 'theme', 'RadioGroup', enumSchema, 'radio'],
  ] as [string, string, string, RJSFSchema, string][])(
    '%s widget keeps the wrapperProps.labelProps from the %s, with the field title id',
    (_, source, name, schema, widget) => {
      const wrapperProps = { labelProps: { 'data-wrapper-label': 'yes' } };
      renderThemed(
        source === 'theme' ? { [name]: { defaultProps: { wrapperProps } } } : {},
        { ...schema, title: 'A title' },
        { 'ui:widget': widget, ...(source === 'ui:options' && { 'ui:options': { wrapperProps } }) },
      );

      expect(screen.getByText('A title')).toHaveAttribute('data-wrapper-label', 'yes');
      expect(screen.getByText('A title')).toHaveAttribute('id', 'root__title');
    },
  );

  describe('a success message Mantine renders', () => {
    test.each([
      ['its default id', {}, 'root-success'],
      ['a successProps id', { successProps: { id: 'custom-success' } }, 'custom-success'],
      [
        'a wrapperProps.successProps id',
        { wrapperProps: { successProps: { id: 'wrapped-success' } } },
        'wrapped-success',
      ],
    ])('still describes the input, by %s', (_, uiOptions, successId) => {
      const { container } = renderThemed(
        {},
        { type: 'string' },
        { 'ui:options': { success: 'Looks good', ...uiOptions } },
      );

      expect(container.querySelector(`[id="${successId}"]`)).toHaveTextContent('Looks good');
      expect(describedByValues(container)).toEqual([`${ariaDescribedByIds('root')} ${successId}`]);
    });

    test('describes a radio group, which is otherwise left undescribed', () => {
      renderThemed({}, enumSchema, { 'ui:widget': 'radio', 'ui:options': { success: 'Looks good' } });

      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-describedby', 'root-success');
    });
  });

  test('range widget describes its focusable slider thumb, not the slider root', () => {
    renderField({ type: 'integer' }, { 'ui:widget': 'range' });

    expect(screen.getByRole('slider')).toHaveAttribute('aria-describedby', ariaDescribedByIds('root'));
  });

  test('range widget keeps the thumbProps default from the Mantine theme', async () => {
    const onFocus = vi.fn();
    renderThemed(
      { Slider: { defaultProps: { thumbProps: { onFocus } } } },
      { type: 'integer' },
      { 'ui:widget': 'range' },
    );

    await user.tab();

    expect(screen.getByRole('slider')).toHaveFocus();
    expect(onFocus).toHaveBeenCalled();
  });
});
