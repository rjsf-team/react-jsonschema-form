import type { ReactNode } from 'react';
import { createElement, use } from 'react';
import { createTheme, InputWrapperContext, MantineProvider } from '@mantine/core';
import type { ErrorSchema, FieldProps, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, descriptionId, errorId, helpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import { errorLines, renderErrors } from '../src/utils.tsx';
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

/** The elements with the text that aren't inside a hidden element */
function shownWithText(text: string) {
  return screen.queryAllByText(text).filter((element) => !element.closest('[style*="display: none"]'));
}

function describedByValues(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[aria-describedby]'), (el) => el.getAttribute('aria-describedby'));
}

const enumSchema: RJSFSchema = { type: 'string', enum: ['a', 'b'] };
const checkboxesSchema: RJSFSchema = { type: 'array', items: enumSchema, uniqueItems: true };

function renderThemed(
  components: Record<string, { defaultProps: object }>,
  schema: RJSFSchema,
  uiSchema?: UiSchema,
  extraErrors?: ErrorSchema,
) {
  return render(
    <MantineProvider theme={createTheme({ components })}>
      <Form
        schema={{ description: 'A description', ...schema }}
        uiSchema={uiSchema}
        validator={validator}
        extraErrors={extraErrors}
      />
    </MantineProvider>,
  );
}

// The rendered description, error and help, each read once, which a second copy of the errors fails
const describedOnceByDescriptionErrorAndHelp =
  /^(?=.*A description)(?=.*Some help)(?=.*An error)(?!.*An error.*An error)(?!.*A description.*A description)/;

function expectDescribedByFieldIds(schema: RJSFSchema, uiSchema?: UiSchema, describedCount = 1) {
  const { container } = renderField(schema, uiSchema);

  const values = describedByValues(container);
  expect(values).toHaveLength(describedCount);
  for (const value of values) {
    const ids = value!.split(/\s+/);
    expect(ids).toEqual(expect.arrayContaining([descriptionId('root'), helpId('root')]));
    for (const id of ids) {
      expect(container.querySelector(`[id="${id}"]`)).toBeInTheDocument();
    }
  }
  for (const el of container.querySelectorAll('[aria-describedby]')) {
    expect(el).toHaveAccessibleDescription(describedOnceByDescriptionErrorAndHelp);
  }
}

const widgetCases: [string, RJSFSchema, UiSchema?, number?][] = [
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
  ['date-time', { type: 'string', format: 'date-time' }, {}, 2],
  ['alt-date', { type: 'string' }, { 'ui:widget': 'alt-date' }, 3],
  ['alt-datetime', { type: 'string' }, { 'ui:widget': 'alt-datetime' }, 6],
];

/** Checks that every id a `for`, an `aria-labelledby` or an `aria-describedby` in `container` names belongs to an element
 * there
 */
function expectReferencesResolve(container: HTMLElement) {
  container.querySelectorAll('label[for]').forEach((label) => {
    expect(container.querySelector(`[id="${label.getAttribute('for')}"]`)).toBeInTheDocument();
  });
  container.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach((element) => {
    [element.getAttribute('aria-labelledby'), element.getAttribute('aria-describedby')]
      .join(' ')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((referencedId) => expect(container.querySelector(`[id="${referencedId}"]`)).toBeInTheDocument());
  });
}

describe('aria-describedby', () => {
  test.each(widgetCases)(
    '%s widget describes its input by the field description, error and help',
    (_, schema, uiSchema, describedCount) => {
      expectDescribedByFieldIds(schema, uiSchema, describedCount);
    },
  );

  test.each(widgetCases)(
    '%s widget is described only by the parts of its field that render, and marked invalid by its plan',
    (_, schema, uiSchema, describedCount = 1) => {
      const { container } = render(
        <WrappedForm
          schema={schema}
          uiSchema={uiSchema}
          validator={validator}
          extraErrors={extraErrors}
          showErrorList={false}
        />,
      );

      const described = container.querySelectorAll('[aria-describedby]');
      expect(described).toHaveLength(describedCount);
      for (const control of described) {
        expect(control).toHaveAttribute('aria-describedby', errorId('root'));
        expect(control).toHaveAttribute('aria-invalid', 'true');
      }
      expectReferencesResolve(container);
    },
  );

  test('checkboxes widget with no options shows its errors in its group, named by its label', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'array',
          title: 'Colors',
          description: 'Pick some',
          items: { type: 'string', enum: [] },
          uniqueItems: true,
        }}
        uiSchema={{ 'ui:widget': 'checkboxes' }}
        validator={validator}
        extraErrors={extraErrors}
        showErrorList={false}
      />,
    );

    // The group's wrapper draws its label and description beside the errors, so they say which field the errors are for
    expect(screen.getByRole('group', { name: 'Colors' })).toBeInTheDocument();
    const wrapper = container.querySelector('#root');
    expect(wrapper).toContainElement(screen.getByText('Colors'));
    expect(wrapper).toContainElement(screen.getByText('Pick some'));
    const errors = container.querySelectorAll(`[id="${errorId('root')}"]`);
    expect(errors).toHaveLength(1);
    expect(wrapper).toContainElement(errors[0] as HTMLElement);
    expect(errors[0]).toHaveTextContent('An error');
    expectReferencesResolve(container);
  });

  test('oneOf selector is described by the error Mantine renders for it', async () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          oneOf: [
            { properties: { a: { type: 'string' } }, required: ['a'] },
            { properties: { b: { type: 'string' } }, required: ['b'] },
          ],
        }}
        formData={{}}
        validator={validator}
        showErrorList={false}
        noHtml5Validate
      />,
    );

    // `noHtml5Validate`, since the required field of the selected option would otherwise block the submit
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(container.querySelector('[id="root__oneof_select"]')).toHaveAccessibleDescription(
      /must match exactly one schema in oneOf/,
    );
  });

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

  test('a wrapperProps.inputContainer set to undefined replaces a top-level inputContainer, as in Mantine', () => {
    const inputContainer = (children: ReactNode) => <div data-testid='custom-container'>{children}</div>;
    renderField({ type: 'string' }, { 'ui:options': { inputContainer, wrapperProps: { inputContainer: undefined } } });

    expect(screen.queryByTestId('custom-container')).not.toBeInTheDocument();
  });

  describe('an inputContainer default from the Mantine theme', () => {
    const inputContainer = (children: ReactNode) => <div data-testid='theme-container'>{children}</div>;

    test.each(['TextInput', 'InputWrapper'])('set on %s still renders inside the aria-describedby override', (name) => {
      const { container } = renderThemed({ [name]: { defaultProps: { inputContainer } } }, { type: 'string' });

      expect(screen.getByTestId('theme-container')).toContainElement(screen.getByRole('textbox'));
      expect(describedByValues(container)).toEqual([descriptionId('root')]);
    });

    test('set on InputWrapper still renders when ui:options sets wrapperProps.inputContainer to undefined', () => {
      const { container } = renderThemed(
        { InputWrapper: { defaultProps: { inputContainer } } },
        { type: 'string' },
        { 'ui:options': { wrapperProps: { inputContainer: undefined } } },
      );

      expect(screen.getByTestId('theme-container')).toContainElement(screen.getByRole('textbox'));
      expect(describedByValues(container)).toEqual([descriptionId('root')]);
    });

    test('set in wrapperProps still renders inside the aria-describedby override, with the other wrapperProps', () => {
      const { container } = renderThemed(
        { TextInput: { defaultProps: { wrapperProps: { inputContainer, 'data-wrapper': 'theme' } } } },
        { type: 'string' },
      );

      expect(screen.getByTestId('theme-container')).toContainElement(screen.getByRole('textbox'));
      expect(container.querySelector('[data-wrapper="theme"]')).toBeInTheDocument();
      expect(describedByValues(container)).toEqual([descriptionId('root')]);
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
      ['the default id for an empty successProps id', { successProps: { id: '' } }, 'root-success'],
      ['the default id despite a wrapperProps id', { wrapperProps: { id: 'wrapped' } }, 'root-success'],
    ])('still describes the input, by %s', (_, uiOptions, successId) => {
      const { container } = renderThemed(
        {},
        { type: 'string' },
        { 'ui:options': { success: 'Looks good', ...uiOptions } },
      );

      expect(container.querySelector(`[id="${successId}"]`)).toHaveTextContent('Looks good');
      expect(describedByValues(container)).toEqual([`${descriptionId('root')} ${successId}`]);
    });

    // Each widget takes its describers from the field's plan, which lists only the parts that render: the description
    // every schema here is given
    test.each<[string, RJSFSchema, UiSchema]>([
      ['text', { type: 'string' }, {}],
      ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
      ['password', { type: 'string' }, { 'ui:widget': 'password' }],
      ['select', enumSchema, {}],
      ['color', { type: 'string', format: 'color' }, {}],
      ['file', { type: 'string', format: 'data-url' }, {}],
      ['time', { type: 'string', format: 'time' }, {}],
      ['date', { type: 'string', format: 'date' }, {}],
    ])('still describes the %s widget when wrapperProps has an id', (_, schema, uiSchema) => {
      const { container } = renderThemed({}, schema, {
        ...uiSchema,
        'ui:options': { success: 'Looks good', wrapperProps: { id: 'wrapped' } },
      });

      expect(container.querySelector('[id="root-success"]')).toHaveTextContent('Looks good');
      expect(describedByValues(container)).toEqual([`${descriptionId('root')} root-success`]);
    });

    test.each([
      ['the theme InputWrapper', { InputWrapper: { defaultProps: { success: 'Looks good' } } }, 'root-success'],
      ['the theme Input', { Input: { defaultProps: { success: 'Looks good' } } }, 'root-success'],
      [
        'a theme successProps id',
        { InputWrapper: { defaultProps: { success: 'Looks good', successProps: { id: 'shared' } } } },
        'shared',
      ],
      ['the theme Select, which only a part would render', { Select: { defaultProps: { success: 'Looks good' } } }, ''],
    ])(
      'renders at most one alt-date success message, for the field, given a success from %s',
      (_, components, successId) => {
        const { container } = renderThemed(components, { type: 'string' }, { 'ui:widget': 'alt-date' });

        expect(Array.from(container.querySelectorAll('.mantine-InputWrapper-success'), (el) => el.id)).toEqual(
          successId ? [successId] : [],
        );
        expect(describedByValues(container)).toEqual(
          Array(3).fill([descriptionId('root'), successId].filter(Boolean).join(' ')),
        );
      },
    );

    test.each([
      ['radio', 'radiogroup', 'radio'],
      ['checkboxes', 'group', 'checkbox'],
    ] as const)('describes each %s option by it, leaving the group undescribed', (widget, groupRole, optionRole) => {
      renderThemed({}, widget === 'radio' ? enumSchema : checkboxesSchema, {
        'ui:widget': widget,
        'ui:options': { success: 'Looks good' },
      });

      expect(screen.getByRole(groupRole)).not.toHaveAttribute('aria-describedby');
      for (const option of screen.getAllByRole(optionRole)) {
        expect(option).toHaveAttribute('aria-describedby', `${descriptionId('root')} root-success`);
      }
    });

    test('leaves the radio options described by the field ids alone while the field has errors', () => {
      renderThemed(
        {},
        enumSchema,
        { 'ui:widget': 'radio', 'ui:options': { success: 'Looks good' } },
        { __errors: ['An error'] },
      );

      for (const option of screen.getAllByRole('radio')) {
        expect(option).toHaveAttribute('aria-describedby', `${errorId('root')} ${descriptionId('root')}`);
      }
    });
  });

  test('range widget describes its focusable slider thumb, not the slider root', () => {
    renderField({ type: 'integer' }, { 'ui:widget': 'range' });

    expect(screen.getByRole('slider')).toHaveAttribute('aria-describedby', ariaDescribedByIds('root'));
  });

  test('range widget renders a ui:options description only as its description', () => {
    const { container } = renderField(
      { type: 'integer' },
      { 'ui:widget': 'range', 'ui:options': { description: 'Pick a level' } },
    );

    expect(container.querySelector(`[id="${descriptionId('root')}"]`)).toHaveTextContent('Pick a level');
    expect(container.querySelector('[description]')).not.toBeInTheDocument();
  });

  test('range widget keeps an aria-describedby from ui:options.thumbProps, after the field ids', () => {
    renderField(
      { type: 'integer' },
      { 'ui:widget': 'range', 'ui:options': { thumbProps: { 'aria-describedby': 'my-hint' } } },
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-describedby', `${ariaDescribedByIds('root')} my-hint`);
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

  test('checkbox widget renders its error with the field error id, which it is described by', () => {
    const { container } = renderField({ type: 'boolean' });

    expect(container.querySelector(`[id="${errorId('root')}"]`)).toHaveTextContent('An error');
    expect(container.querySelector('[id="root-error"]')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-describedby', ariaDescribedByIds('root'));
  });

  describe('invalid and required options', () => {
    const optionWidgets: [string, RJSFSchema, UiSchema, string][] = [
      ['radio', enumSchema, { 'ui:widget': 'radio' }, 'radio'],
      ['checkboxes', checkboxesSchema, { 'ui:widget': 'checkboxes' }, 'checkbox'],
      ['checkbox', { type: 'boolean' }, {}, 'checkbox'],
    ];

    test.each(optionWidgets)(
      '%s widget marks each option invalid while the field has errors',
      (_, schema, uiSchema, role) => {
        renderField(schema, uiSchema);

        for (const option of screen.getAllByRole(role)) {
          expect(option).toHaveAttribute('aria-invalid', 'true');
        }
      },
    );

    test.each(optionWidgets)('%s widget leaves each option unmarked without errors', (_, schema, uiSchema, role) => {
      renderThemed({}, schema, uiSchema);

      for (const option of screen.getAllByRole(role)) {
        expect(option).not.toHaveAttribute('aria-invalid');
      }
    });

    test.each([
      ['a required radio', 'radio', enumSchema, 'radio', ['field'], true],
      ['an optional radio', 'radio', enumSchema, 'radio', [], false],
      ['a required checkboxes', 'checkboxes', checkboxesSchema, 'checkbox', ['field'], false],
    ] as const)(
      'marks each option of %s field required only for a required radio',
      (_, widget, schema, role, required, expected) => {
        render(
          <WrappedForm
            schema={{ type: 'object', required: [...required], properties: { field: schema } }}
            uiSchema={{ field: { 'ui:widget': widget } }}
            validator={validator}
          />,
        );

        for (const option of screen.getAllByRole(role)) {
          expect((option as HTMLInputElement).required).toBe(expected);
        }
      },
    );
  });

  test('renders the errors of objects and item-by-item arrays, which no widget renders, once each', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: {
            list: { type: 'array', items: { type: 'string' } },
            obj: { type: 'object', properties: { x: { type: 'string' } } },
            tags: checkboxesSchema,
            files: { type: 'array', items: { type: 'string', format: 'data-url' } },
            custom: { type: 'array', items: { type: 'string' } },
            text: { type: 'string' },
          },
        }}
        uiSchema={{
          custom: {
            'ui:widget': ({ id }: WidgetProps) => <input id={id} aria-describedby={ariaDescribedByIds(id)} />,
          },
        }}
        validator={validator}
        extraErrors={
          {
            list: { __errors: ['List error'] },
            obj: { __errors: ['Obj error'] },
            tags: { __errors: ['Tags error'] },
            files: { __errors: ['Files error'] },
            custom: { __errors: ['Custom error'] },
            text: { __errors: ['Text error'] },
          } as ErrorSchema
        }
        showErrorList={false}
      />,
    );

    for (const [field, message] of [
      ['list', 'List error'],
      ['obj', 'Obj error'],
      ['tags', 'Tags error'],
      ['files', 'Files error'],
      ['text', 'Text error'],
    ]) {
      const errors = container.querySelectorAll(`[id="${errorId(`root_${field}`)}"]`);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveTextContent(message);
    }
    // A custom widget leaves its errors to the template, whose `FieldErrorTemplate` shows them
    expect(container.querySelectorAll(`[id="${errorId('root_custom')}"]`)).toHaveLength(1);
    expect(container.querySelector('#root_custom')).toHaveAccessibleDescription(/Custom error/);
    expect(screen.getByText('Custom error')).toBeVisible();
  });

  test.each([
    ['oneOf', { oneOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'string' } } }] }],
    ['anyOf', { anyOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'string' } } }] }],
    [
      'oneOf of arrays',
      {
        oneOf: [
          { type: 'array', items: { type: 'string' } },
          { type: 'array', items: { type: 'number' } },
        ],
      },
    ],
  ] as [string, RJSFSchema][])(
    'renders the errors of a field with a %s once, below its options, describing its option selector',
    (_, schema) => {
      render(
        <WrappedForm
          schema={{ type: 'object', ...schema }}
          validator={validator}
          extraErrors={{ __errors: ['Own error'] } as ErrorSchema}
          showErrorList={false}
        />,
      );

      expect(shownWithText('Own error')).toHaveLength(1);
      expect(screen.getByRole('combobox')).toHaveAccessibleDescription(/Own error/);
    },
  );

  test.each([
    ['string', { type: 'string' }, 'textbox'],
    ['boolean', { type: 'boolean' }, 'checkbox'],
  ] as [string, RJSFSchema, string][])(
    'renders the errors of a field with a oneOf of a %s once, below its option, marking selector and option invalid',
    (_, option, role) => {
      render(
        <WrappedForm
          schema={{ type: 'object', properties: { foo: { oneOf: [option, { type: 'number' }] } } }}
          validator={validator}
          extraErrors={{ foo: { __errors: ['Own error'] } } as ErrorSchema}
          showErrorList={false}
        />,
      );

      expect(shownWithText('Own error')).toHaveLength(1);
      for (const control of [screen.getByRole('combobox'), screen.getByRole(role)]) {
        expect(control).toHaveAccessibleDescription(/Own error/);
        expect(control).toHaveAttribute('aria-invalid', 'true');
      }
    },
  );

  test("renders the errors of an optional object's oneOf through its option while no selector renders", () => {
    render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { foo: { type: 'object', oneOf: [{ properties: { a: { type: 'string' } } }] } },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }}
        validator={validator}
        extraErrors={{ foo: { __errors: ['Own error'] } } as ErrorSchema}
        showErrorList={false}
      />,
    );

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(shownWithText('Own error')).toHaveLength(1);
  });

  test.each([
    ['a custom ui:field', { type: 'string' }, { 'ui:field': ({ id }: FieldProps) => <input id={id} /> }],
    ['a field of an unsupported type', { type: 'bogus' }, {}],
  ] as [string, RJSFSchema, UiSchema][])(
    'shows the errors of %s once, through FieldErrorTemplate',
    (_, schema, uiSchema) => {
      const { container } = render(
        <WrappedForm
          schema={{ type: 'object', properties: { x: schema } }}
          uiSchema={{ x: uiSchema }}
          validator={validator}
          extraErrors={{ x: { __errors: ['X error'] } } as ErrorSchema}
          showErrorList={false}
        />,
      );

      const errors = container.querySelectorAll(`[id="${errorId('root_x')}"]`);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveTextContent('X error');
      expect(errors[0]).toBeVisible();
    },
  );

  test("shows the errors of a widget that leaves 'error' out of inputWrapperOrder through FieldErrorTemplate", () => {
    render(
      <WrappedForm
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:options': { inputWrapperOrder: ['label', 'input'] } }}
        validator={validator}
        extraErrors={{ __errors: ['An error'] } as ErrorSchema}
        showErrorList={false}
      />,
    );

    expect(shownWithText('An error')).toHaveLength(1);
    expect(screen.getByText('An error')).toBeVisible();
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('An error');
  });

  // Each widget hands on the errors its wrapper leaves out its own way: an input through `useInputAriaProps()`, a group
  // through `useGroupAriaProps()`, and a range or alt-date beside its wrapper through `useFieldWrapperProps()`
  test.each<[string, RJSFSchema, UiSchema, number]>([
    ['a text input', { type: 'string' }, {}, 1],
    ['a radio group', enumSchema, { 'ui:widget': 'radio' }, 2],
    ['a checkboxes group', checkboxesSchema, { 'ui:widget': 'checkboxes' }, 2],
    ['a range', { type: 'number' }, { 'ui:widget': 'range' }, 1],
    ['an alt-date', { type: 'string', format: 'date' }, { 'ui:widget': 'alt-date' }, 3],
  ])(
    "shows the errors of %s once where inputWrapperOrder leaves out 'error'",
    (_, schema, uiSchema, describedCount) => {
      const { container } = render(
        <WrappedForm
          schema={schema}
          uiSchema={{ ...uiSchema, 'ui:options': { inputWrapperOrder: ['label', 'description', 'input'] } }}
          validator={validator}
          extraErrors={extraErrors}
          showErrorList={false}
        />,
      );

      const errors = container.querySelectorAll(`[id="${errorId('root')}"]`);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveTextContent('An error');
      expect(errors[0]).toBeVisible();
      const described = container.querySelectorAll('[aria-describedby]');
      expect(described).toHaveLength(describedCount);
      for (const control of described) {
        expect(control).toHaveAttribute('aria-describedby', errorId('root'));
      }
      expectReferencesResolve(container);
    },
  );

  test('renders the errors of fields inside the option a selector picked', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          oneOf: [{ properties: { list: { type: 'array', items: { type: 'string' } } } }],
        }}
        validator={validator}
        extraErrors={{ list: { __errors: ['List error'] } } as ErrorSchema}
        showErrorList={false}
      />,
    );

    expect(container.querySelector(`[id="${errorId('root_list')}"]`)).toHaveTextContent('List error');
  });

  test('leaves the errors of an object with a custom ui:field to that field where its declaration says it draws them', () => {
    const OwnErrorsField = ({ presentation }: FieldProps) => <div>{presentation?.errors.messages.join()}</div>;
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'string' } } }}
        uiSchema={{ 'ui:field': 'OwnErrorsField' }}
        fields={{ OwnErrorsField }}
        presentation={{ fields: { OwnErrorsField: { errors: 'self' } } }}
        validator={validator}
        extraErrors={{ __errors: ['Own error'] } as ErrorSchema}
        showErrorList={false}
      />,
    );

    expect(shownWithText('Own error')).toHaveLength(1);
  });

  test('renders errors given as elements, each on its own line, without a missing key warning', () => {
    const consoleError = vi.spyOn(console, 'error');
    const { container } = render(
      <div>{errorLines([createElement('b', null, 'First error'), createElement('b', null, 'Second error')])}</div>,
    );

    expect(container).toHaveTextContent('First error Second error');
    expect(container.querySelectorAll('br')).toHaveLength(1);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('renders errors given as block elements inside its error element, without invalid nesting', () => {
    const consoleError = vi.spyOn(console, 'error');
    const { container } = render(
      <MantineProvider>
        {renderErrors('root', [createElement('div', { key: 'block' }, 'Block error')])}
      </MantineProvider>,
    );

    const error = container.querySelector(`[id="${errorId('root')}"]`);
    expect(error?.tagName).toBe('DIV');
    expect(error).toContainElement(screen.getByText('Block error'));
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('renders the errors of an object reached through a layout grid inside the option a selector picked', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          oneOf: [{ properties: { inner: { type: 'object', properties: { a: { type: 'string' } } } } }],
        }}
        uiSchema={{
          oneOf: [{ 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['inner'] }] } }],
        }}
        validator={validator}
        extraErrors={{ inner: { __errors: ['Inner error'] } } as ErrorSchema}
        showErrorList={false}
      />,
    );

    expect(container.querySelector(`[id="${errorId('root_inner')}"]`)).toHaveTextContent('Inner error');
  });

  test('renders the errors of an object whose ui:field replaces its oneOf, which renders no selector', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { a: { type: 'string' } },
          oneOf: [{ required: ['a'] }, { required: ['b'] }],
        }}
        uiSchema={{ 'ui:field': 'ObjectField', 'ui:fieldReplacesAnyOrOneOf': true }}
        validator={validator}
        extraErrors={{ __errors: ['Own error'] } as ErrorSchema}
        showErrorList={false}
      />,
    );

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(container.querySelector(`[id="${errorId('root')}"]`)).toHaveTextContent('Own error');
  });

  test('describes a selected option once, under the id its control is described by', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { region: { oneOf: [{ title: 'None', type: 'null' }, { $ref: '#/$defs/europe' }] } },
          $defs: {
            europe: {
              title: 'Europe',
              description: 'A country in Europe',
              oneOf: [
                { const: 'FR', title: 'France' },
                { const: 'DE', title: 'Germany' },
              ],
            },
          },
        }}
        formData={{ region: 'DE' }}
        validator={validator}
      />,
    );

    expect(shownWithText('A country in Europe')).toHaveLength(1);
    expect(container.querySelector(`#${descriptionId('root_region')}`)).toHaveTextContent('A country in Europe');
  });

  test('gives the field description and a selected option description an id each', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: {
            region: {
              oneOf: [
                { title: 'None', type: 'null' },
                { title: 'Text', type: 'string', description: 'Opt desc' },
              ],
            },
          },
        }}
        uiSchema={{ region: { 'ui:description': 'Where you live' } }}
        formData={{ region: 'a' }}
        validator={validator}
      />,
    );

    expect(shownWithText('Where you live')).toHaveLength(1);
    expect(shownWithText('Opt desc')).toHaveLength(1);
    const ids = Array.from(container.querySelectorAll('[id$="__description"]'), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each([
    ['without', {}],
    ['with', { 'ui:description': 'Where you live' }],
  ])('renders a nested oneOf option description once, %s a field description', (_, fieldUiSchema) => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: {
            region: {
              oneOf: [
                { title: 'None', type: 'null' },
                {
                  title: 'Inner',
                  oneOf: [
                    { title: 'Text', type: 'string' },
                    { title: 'Number', type: 'number' },
                  ],
                },
              ],
            },
          },
        }}
        uiSchema={{ region: { ...fieldUiSchema, oneOf: [{}, { 'ui:description': 'Inner desc' }] } }}
        formData={{ region: 'a' }}
        validator={validator}
      />,
    );

    expect(shownWithText('Inner desc')).toHaveLength(1);
    const ids = Array.from(container.querySelectorAll('[id$="__description"]'), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('gives the field description and a checkbox option description an id each', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: {
            x: {
              oneOf: [
                { type: 'boolean', description: 'Opt desc' },
                { type: 'string', title: 'Text' },
              ],
            },
          },
        }}
        uiSchema={{ x: { 'ui:description': 'Field desc' } }}
        formData={{ x: true }}
        validator={validator}
      />,
    );

    expect(shownWithText('Field desc')).toHaveLength(1);
    expect(shownWithText('Opt desc')).toHaveLength(1);
    const ids = Array.from(container.querySelectorAll('[id$="__description"]'), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('describes a selector by the field description it renders, and by no other', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        region: {
          oneOf: [
            { title: 'None', type: 'null' },
            { title: 'Text', type: 'string' },
          ],
        },
      },
    };
    const selectorDescribedBy = (uiSchema: UiSchema) => {
      const { container, unmount } = render(
        <WrappedForm schema={schema} uiSchema={uiSchema} formData={{ region: 'a' }} validator={validator} />,
      );
      const describedBy = container.querySelector('#root_region__oneof_select')!.getAttribute('aria-describedby');
      unmount();
      // A selector nothing describes carries no `aria-describedby` at all
      return describedBy?.split(' ') ?? [];
    };

    expect(selectorDescribedBy({ region: { 'ui:description': 'Where you live' } })).toContain(
      descriptionId('root_region'),
    );
    expect(selectorDescribedBy({})).not.toContain(descriptionId('root_region'));
    expect(
      selectorDescribedBy({ region: { 'ui:description': 'Where you live', 'ui:options': { label: false } } }),
    ).not.toContain(descriptionId('root_region'));
  });

  test('describes a range selector by the field description it renders', () => {
    render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: {
            region: {
              oneOf: [
                { title: 'Text', type: 'string' },
                { title: 'Flag', type: 'boolean' },
              ],
            },
          },
        }}
        uiSchema={{ region: { 'ui:widget': 'range', 'ui:description': 'Where you live', oneOf: [{}, {}] } }}
        formData={{ region: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider').getAttribute('aria-describedby')?.split(' ')).toContain(
      descriptionId('root_region'),
    );
  });

  test("names an object's option selector by the object's heading", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          title: 'Pet',
          properties: { name: { type: 'string' } },
          anyOf: [
            { title: 'Dog', properties: { bark: { type: 'string' } } },
            { title: 'Cat', properties: { meow: { type: 'string' } } },
          ],
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('input#root__anyof_select')).toHaveAccessibleName('Pet');
  });

  const pick: RJSFSchema = {
    type: 'object',
    properties: { pick: { title: 'Pick', anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'number' }] } },
  };

  test("names an anyOf option selector by its field's label", () => {
    const { container } = render(<WrappedForm schema={pick} validator={validator} />);

    expect(container.querySelector('input#root_pick__anyof_select')).toHaveAccessibleName('Pick');
    expectReferencesResolve(container);
  });

  test("names a radio anyOf option selector's group by its field's label", () => {
    const { container } = render(
      <WrappedForm schema={pick} uiSchema={{ pick: { 'ui:widget': 'radio' } }} validator={validator} />,
    );

    const firstOption = container.querySelector('#root_pick__anyof_select-0')!;
    expect(firstOption.closest('[role="radiogroup"]')).toHaveAccessibleName('Pick');
    expectReferencesResolve(container);
  });
});
