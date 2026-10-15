import Switch from '@mui/material/Switch';
import { withTheme } from '@rjsf/core';
import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { FieldProps, FormValidation, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form, { Theme, generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';

const user = userEvent.setup();

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

formTests(Form);
themeTests({ generateTemplates, generateTheme, generateWidgets });

describe('typed form data', () => {
  interface Data {
    name?: string;
  }
  const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

  it('the default Form infers the form data type from formData', () => {
    const data: Data = { name: 'a' };
    const { container } = render(
      <Form
        schema={schema}
        validator={validator}
        formData={data}
        onChange={({ formData }) => expectTypeOf(formData).toEqualTypeOf<Data>()}
      />,
    );
    expect(container.querySelector<HTMLInputElement>('#root_name')?.value).toBe('a');
  });

  it('the default Theme serves a typed withTheme() form', () => {
    const TypedForm = withTheme<Data>(Theme);
    const { container } = render(<TypedForm schema={schema} validator={validator} formData={{ name: 'b' }} />);
    expect(container.querySelector<HTMLInputElement>('#root_name')?.value).toBe('b');
  });
});

describe('a pure anyOf union', () => {
  it('is named by its option selector alone, with no heading beside the options', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'Pet',
      anyOf: [
        { title: 'Dog', properties: { bark: { type: 'string' } } },
        { title: 'Cat', properties: { meow: { type: 'string' } } },
      ],
    };
    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelector('#root__anyof_select-label')).toHaveTextContent('Pet');
    expect(container.querySelector('#root_XxxOf__title')).not.toBeInTheDocument();
    expect(container.querySelector('#root__title')).toHaveTextContent('Dog');
  });

  it('is named by its heading, which it repeats nowhere, where it has properties beside the options', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'Pet',
      properties: { name: { type: 'string' } },
      anyOf: [
        { title: 'Dog', properties: { bark: { type: 'string' } } },
        { title: 'Cat', properties: { meow: { type: 'string' } } },
      ],
    };
    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(screen.getAllByText('Pet')).toHaveLength(1);
    expect(container.querySelector('#root__anyof_select-label')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pet');
  });

  it('leaves the label to a custom field rendered beside the options', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          title: 'Foo',
          anyOf: [
            { title: 'Text', type: 'string' },
            { title: 'Number', type: 'number' },
          ],
        },
      },
    };
    const MyField = ({ presentation }: FieldProps) => <span>{presentation?.label.text}</span>;
    const { container } = render(
      <Form schema={schema} uiSchema={{ foo: { 'ui:field': MyField } }} validator={validator} />,
    );

    expect(screen.getAllByText('Foo')).toHaveLength(1);
    expect(container.querySelector('#root_foo__anyof_select-label')).not.toBeInTheDocument();
  });
});

describe('the fallback UI', () => {
  it('names the value control with the field title, and describes it once', () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { title: 'X', description: 'An x', type: ['string', 'number'] } } }}
        formData={{ x: 'a' }}
        validator={validator}
        useFallbackUiForUnsupportedType
      />,
    );

    expect(screen.getByLabelText('X')).toBe(container.querySelector('input#root_x'));
    expect(screen.getAllByText('An x')).toHaveLength(1);
  });
});

describe('a checkbox whose presentation gives its description to the template', () => {
  test('draws the description once, from the template', () => {
    const { container } = render(
      <Form
        schema={{ type: 'boolean', title: 'Bee', description: 'Bee description' }}
        uiSchema={{ 'ui:widget': 'checkbox' }}
        presentation={{ widgets: { CheckboxWidget: { description: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('Bee description')).toHaveLength(1);
    expect(container.querySelector('#root__description')).toHaveTextContent('Bee description');
  });
});

describe("mui widgets carry their field's plan on the element a user focuses", () => {
  test.each<[string, string, RJSFSchema, UiSchema]>([
    ['text', 'textbox', { type: 'string' }, {}],
    ['textarea', 'textbox', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['updown', 'spinbutton', { type: 'number' }, { 'ui:widget': 'updown' }],
    ['range', 'slider', { type: 'number' }, { 'ui:widget': 'range' }],
    ['select', 'combobox', { type: 'string', enum: ['a', 'b'] }, {}],
    ['checkbox', 'checkbox', { type: 'boolean' }, {}],
  ])('a %s control is invalid and described only by elements that render', (_, role, schema, uiSchema) => {
    render(
      <Form
        schema={{ type: 'object', properties: { pet: { ...schema, title: 'Pet' } } }}
        uiSchema={{ pet: uiSchema }}
        extraErrors={{ pet: { __errors: ['too short'] } }}
        validator={validator}
      />,
    );

    const control = screen.getByRole(role);
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAttribute('aria-describedby', 'root_pet__error');
    expect(control).toHaveAccessibleDescription('too short');
  });

  const colors: RJSFSchema = { type: 'string', title: 'Color', enum: ['red', 'blue'] };
  // ARIA supports `aria-invalid` on a `radiogroup` but not on a `group`, so a radio group carries it while each
  // checkbox carries its own
  test.each([
    ['radio', colors, 'radiogroup', 'radio', 'true', null],
    [
      'checkboxes',
      { type: 'array', title: 'Color', items: colors, uniqueItems: true },
      'group',
      'checkbox',
      null,
      'true',
    ],
  ] as const)(
    "marks a %s group or each option invalid, and describes each option by the field's errors",
    (widget, color, role, item, groupInvalid, optionInvalid) => {
      render(
        <Form
          schema={{ type: 'object', properties: { color } }}
          uiSchema={{ color: { 'ui:widget': widget } }}
          extraErrors={{ color: { __errors: ['pick one'] } }}
          validator={validator}
        />,
      );

      const group = screen.getByRole(role, { name: 'Color' });
      expect(group).toHaveAttribute('id', 'root_color');
      expect(group.getAttribute('aria-invalid')).toBe(groupInvalid);
      for (const option of screen.getAllByRole(item)) {
        expect(option.getAttribute('aria-invalid')).toBe(optionInvalid);
        expect(option).toHaveAttribute('aria-describedby', 'root_color__error');
        expect(option).toHaveAccessibleDescription('pick one');
      }
    },
  );
});

describe("mui widgets are named by their label and carry the field's id on the element a user focuses", () => {
  const widgets: [string, RJSFSchema, UiSchema, string, string][] = [
    ['text input', { type: 'string' }, {}, 'textbox', 'root_x'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, 'textbox', 'root_x'],
    ['checkbox', { type: 'boolean' }, {}, 'checkbox', 'root_x'],
    ['number input', { type: 'number' }, { 'ui:widget': 'updown' }, 'spinbutton', 'root_x'],
    ['slider', { type: 'number' }, { 'ui:widget': 'range' }, 'slider', 'root_x'],
    // The group's wrapper carries the field's id but isn't focusable, so focus goes to its first radio, as core's does
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, 'radiogroup', 'root_x-0'],
    [
      'checkboxes group',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      'group',
      'root_x-0',
    ],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, 'combobox', 'root_x'],
  ];

  test.each(widgets)("names a %s by its label, and gives it the field's id", (_, x, ui, role) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { ...x, title: 'X' } } }}
        uiSchema={{ x: ui }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role, { name: 'X' })).toHaveAttribute('id', 'root_x');
    expectReferencesResolve(container);
  });

  test.each(widgets)(
    'moves focus to a %s with errors when focusOnFirstError is set',
    async (_, x, ui, _role, focusedId) => {
      render(
        <Form
          schema={{ type: 'object', properties: { x: { ...x, title: 'X' } } }}
          uiSchema={{ x: ui }}
          validator={validator}
          focusOnFirstError
          customValidate={(_: unknown, errors: FormValidation<{ x?: unknown }>) => {
            errors.x?.addError('bad');
            return errors;
          }}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(document.activeElement).toHaveAttribute('id', focusedId);
    },
  );

  const letters: RJSFSchema = { type: 'string', title: 'X', enum: ['a', 'b'] };
  const groups: [string, RJSFSchema, string][] = [
    ['radio', letters, 'radiogroup'],
    ['checkboxes', { type: 'array', title: 'X', items: letters, uniqueItems: true }, 'group'],
  ];

  test.each(groups)('draws the label of a %s group with no for, which would name its wrapper', (widget, x, role) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x } }}
        uiSchema={{ x: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_x__label')).not.toHaveAttribute('for');
    expect(screen.getByRole(role, { name: 'X' })).toHaveAttribute('aria-labelledby', 'root_x__label');
  });

  test.each(groups)(
    'leaves a %s group whose label is hidden unnamed, rather than named by an id no element has',
    (widget, x) => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { x } }}
          uiSchema={{ x: { 'ui:widget': widget, 'ui:label': false } }}
          validator={validator}
        />,
      );

      expect(container.querySelector('#root_x')).toHaveAccessibleName('');
      expect(container.querySelector('#root_x')).not.toHaveAttribute('aria-labelledby');
    },
  );

  // A required field asks for one checkbox, not each, while a radio is required, as core's are
  test.each([
    ['checkboxes', { type: 'array', title: 'X', items: letters, uniqueItems: true }, 'checkbox', false],
    ['radio', letters, 'radio', true],
  ] as const)('requires each option of a required %s group only where core does', (widget, x, item, required) => {
    render(
      <Form
        schema={{ type: 'object', properties: { x }, required: ['x'] }}
        uiSchema={{ x: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    for (const option of screen.getAllByRole(item)) {
      expect((option as HTMLInputElement).required).toBe(required);
    }
    // MUI's `FormControlLabel` marks the label of an option whose control is `required`
    expect(screen.getAllByText('*')).toHaveLength(1);
  });

  test('requires the slider of a required range field, as core does', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } }, required: ['x'] }}
        uiSchema={{ x: { 'ui:widget': 'range' } }}
        validator={validator}
      />,
    );

    // jest-dom's `toBeRequired` doesn't count `required` on a range input, which a browser ignores
    expect(screen.getByRole('slider', { name: 'X' })).toHaveAttribute('required');
  });

  test("focuses the slider's input under ui:autofocus, as core does", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider', { name: 'X' })).toHaveFocus();
  });

  test("focuses a radio group's first radio under ui:autofocus, as core does", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'string', title: 'X', enum: ['a', 'b'] } } }}
        uiSchema={{ x: { 'ui:widget': 'radio', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('radio')[0]).toHaveFocus();
  });

  test("keeps the slider's label off its root, which takes no label", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range' } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.MuiSlider-root')).not.toHaveAttribute('label');
  });

  test.each([
    ['top-level', { slotProps: { input: { 'data-testid': 'thumb-input' } } }],
    ['slider target', { rjsfSlotProps: { slider: { slotProps: { input: { 'data-testid': 'thumb-input' } } } } }],
  ])("applies the slider's %s slotProps beside the field's id and plan", (_, mui) => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:options': { mui } } }}
        validator={validator}
      />,
    );

    expect(screen.getByTestId('thumb-input')).toHaveAttribute('id', 'root_x');
  });

  test("names an additional property's key input by its label", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', additionalProperties: { type: 'string' } }}
        initialFormData={{ foo: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'foo Key' })).toHaveAttribute('id', 'root_foo-key');
    expectReferencesResolve(container);
  });

  test("keeps the field's id on the slider's root for a range of several values, whose every thumb takes its input slot", () => {
    const { RangeWidget } = generateWidgets();
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { r: { type: 'array', items: { type: 'number' } } } }}
        // The `range` name is registered for numbers alone, so an array is handed the widget itself
        uiSchema={{ r: { 'ui:widget': RangeWidget } }}
        initialFormData={{ r: [10, 20] }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(container.querySelectorAll('[id="root_r"]')).toHaveLength(1);
    expect(container.querySelector('.MuiSlider-root')).toHaveAttribute('id', 'root_r');
  });

  test("names an additional property's key select by its label, and describes it by no id that is missing", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', propertyNames: { enum: ['foo', 'bar'] }, additionalProperties: { type: 'string' } }}
        initialFormData={{ foo: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'foo Key' })).not.toHaveAttribute('aria-describedby');
    expectReferencesResolve(container);
  });
});

describe('mui CheckboxWidget', () => {
  test('draws no label of its own where ui:label turns it off', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'boolean', title: 'X' } } }}
        uiSchema={{ x: { 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(screen.queryByText('X')).not.toBeInTheDocument();
  });
});

describe('mui FieldTemplate', () => {
  const TextWidget = ({ id }: WidgetProps) => <input id={id} />;

  test.each([
    ['a required', ['foo'], true],
    ['an optional', [], false],
  ])("draws the label of %s field whose widget's declaration leaves it to the template", (_, required, marked) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'string', title: 'Foo' } }, required }}
        uiSchema={{ foo: { 'ui:widget': 'TextWidget' } }}
        widgets={{ TextWidget }}
        presentation={{ widgets: { TextWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    const label = container.querySelector('label[for="root_foo"]');
    expect(label).toHaveAttribute('id', 'root_foo__label');
    expect(label).toHaveTextContent(marked ? /^Foo\s*\*$/ : /^Foo$/);
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Foo');
  });

  // MUI's `FormControl` hands its `required` to a `FormLabel` inside it that doesn't set its own
  test('marks a switch declared to hold false unchecked only where the schema demands true', () => {
    const SwitchWidget = ({ id }: WidgetProps) => <Switch id={id} />;
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'boolean', title: 'Foo' } }, required: ['foo'] }}
        uiSchema={{ foo: { 'ui:widget': 'SwitchWidget' } }}
        widgets={{ SwitchWidget }}
        presentation={{ widgets: { SwitchWidget: { label: 'template', uncheckedIsFalse: true } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('label[for="root_foo"]')).toHaveTextContent(/^Foo$/);
    expect(screen.getByRole('switch')).not.toBeRequired();
  });

  test("draws the template's label for a radio group with no for, which would name the group's wrapper", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio' } }}
        presentation={{ widgets: { RadioWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_color__label')).not.toHaveAttribute('for');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Color');
  });

  test("names a select declared to leave its label to the template by that label, through MUI's labelId", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['a', 'b'] } } }}
        presentation={{ widgets: { SelectWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Color' })).toBeInTheDocument();
    expectReferencesResolve(container);
  });

  // The plan gives a template label no part where there is no control to name, as while an optional field has no data
  test('draws no label for an optional anyOf field with no data, though it leaves its label to the template', () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            pet: {
              type: 'object',
              title: 'Pet',
              anyOf: [
                { title: 'Dog', properties: { name: { type: 'string' } } },
                { title: 'Cat', properties: { lives: { type: 'number' } } },
              ],
            },
          },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }}
        presentation={{ fields: { AnyOfField: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_pet__label')).not.toBeInTheDocument();
    expect(screen.queryByText('Pet', { selector: 'label' })).not.toBeInTheDocument();
  });

  test('draws no label for a widget that draws its own', () => {
    const { container } = render(<Form schema={{ type: 'string', title: 'Foo' }} validator={validator} />);

    // MUI's outlined input repeats its label's text in the hidden `<legend>` of its notch
    expect(screen.getAllByText('Foo', { selector: 'label' })).toHaveLength(1);
    expect(container.querySelector('#root__label')).not.toBeInTheDocument();
  });
});

describe('mui TitleField', () => {
  test("names an object's option selector by its heading's text, without the marker or optional data control", () => {
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            pet: {
              type: 'object',
              title: 'Pet',
              properties: { name: { type: 'string' } },
              anyOf: [
                { title: 'Dog', properties: { bark: { type: 'string' } } },
                { title: 'Cat', properties: { meow: { type: 'string' } } },
              ],
            },
          },
          required: ['pet'],
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }}
        initialFormData={{ pet: { name: 'Rex' } }}
        validator={validator}
      />,
    );

    const heading = screen.getByRole('heading', { name: 'Pet' });
    expect(heading).toHaveTextContent(/^Pet\s*\*$/);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pet');
  });
});

describe('mui labels the core widgets that draw no label of their own', () => {
  test("labels core's RatingWidget from the template, naming its radiogroup", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { score: { type: 'integer', title: 'Score', maximum: 3 } } }}
        uiSchema={{ score: { 'ui:widget': 'RatingWidget' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Score');
    expectReferencesResolve(container);
  });

  test.each(['alt-date', 'alt-datetime'])('labels a %s field from the template, with no `for`', (widget) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { when: { type: 'string', title: 'When' } } }}
        uiSchema={{ when: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    const label = document.getElementById('root_when__label');
    expect(label).toHaveTextContent('When');
    expect(label).not.toHaveAttribute('for');
    container.querySelectorAll('label[for]').forEach((labelFor) => {
      expect(container.querySelector(`[id="${labelFor.getAttribute('for')}"]`)).toBeInTheDocument();
    });
  });
});
