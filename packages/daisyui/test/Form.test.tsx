import { checkboxLabelTests, formTests, themeTests } from '@rjsf/snapshot-tests';
import type { FormValidation, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { bracketNameGenerator, errorId, fieldLabelId, helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form, { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';

const user = userEvent.setup();

/** An object with properties beside its options, whose option selector is named by the object's heading */
const pet: RJSFSchema = {
  type: 'object',
  title: 'Pet',
  properties: { name: { type: 'string' } },
  anyOf: [
    { title: 'Dog', properties: { bark: { type: 'string' } } },
    { title: 'Cat', properties: { meow: { type: 'string' } } },
  ],
};

/** The element an option selector is named by, through its `aria-labelledby` */
function selectorLabel(selector: HTMLElement) {
  return document.getElementById(selector.getAttribute('aria-labelledby')!);
}

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

describe("daisyui widgets carry their field's plan on the element a user focuses", () => {
  test.each<[string, RJSFSchema, UiSchema]>([
    ['text input', { type: 'string' }, {}],
    ['number input', { type: 'number' }, { 'ui:widget': 'updown' }],
    ['password input', { type: 'string' }, { 'ui:widget': 'password' }],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['range input', { type: 'number' }, { 'ui:widget': 'range' }],
    ['time input', { type: 'string', format: 'time' }, {}],
    ['toggle', { type: 'boolean' }, {}],
    ['checkbox', { type: 'boolean' }, { 'ui:widget': 'checkbox' }],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}],
    ['date picker', { type: 'string', format: 'date' }, {}],
    ['date-time picker', { type: 'string', format: 'date-time' }, {}],
  ])('a %s is invalid while its errors show, and described only by elements that render', (_, schema, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { pet: { ...schema, title: 'Pet' } } }}
        uiSchema={{ pet: uiSchema }}
        extraErrors={{ pet: { __errors: ['too short'] } }}
        validator={validator}
      />,
    );

    const control = container.querySelector('#root_pet');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAttribute('aria-describedby', errorId('root_pet'));
    expect(control).toHaveAccessibleDescription('too short');
    expectReferencesResolve(container);
  });

  const colors: RJSFSchema = { type: 'string', title: 'Color', enum: ['red', 'blue'] };
  // ARIA supports `aria-invalid` on a `radiogroup` but not on a `group`, so a radio group carries it in place of its
  // radios while each checkbox carries its own
  test('names a radio group by its label, marks the group invalid, and describes each radio by its errors', () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { color: colors } }}
        uiSchema={{ color: { 'ui:widget': 'radio' } }}
        extraErrors={{ color: { __errors: ['pick one'] } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Color' })).toBe(container.querySelector('#root_color'));
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toHaveAttribute('aria-invalid');
      expect(radio).toHaveAccessibleDescription('pick one');
    }
    expectReferencesResolve(container);
  });

  test("names a radio option selector by its field's label, through an aria-labelledby that resolves", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { pick: { title: 'Pick', anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'number' }] } },
        }}
        uiSchema={{ pick: { 'ui:widget': 'radio' } }}
        validator={validator}
      />,
    );

    const selector = container.querySelector('#root_pick__anyof_select');
    expect(selector).toHaveAttribute('role', 'radiogroup');
    expect(selector).toHaveAttribute('aria-labelledby', fieldLabelId('root_pick'));
    expect(selector).toHaveAccessibleName('Pick');
    expectReferencesResolve(container);
  });

  test('names a checkboxes group by its label, and marks each checkbox invalid and described by its errors', () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { color: { type: 'array', title: 'Color', items: colors, uniqueItems: true } },
        }}
        uiSchema={{ color: { 'ui:widget': 'checkboxes' } }}
        extraErrors={{ color: { __errors: ['pick one'] } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('group', { name: 'Color' })).toBe(container.querySelector('#root_color'));
    expect(screen.getByRole('group', { name: 'Color' })).not.toHaveAttribute('aria-invalid');
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toHaveAttribute('aria-invalid', 'true');
      expect(checkbox).toHaveAccessibleDescription('pick one');
    }
    expectReferencesResolve(container);
  });

  test("describes each star of a rating by its field's errors", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { stars: { type: 'number', title: 'Stars', maximum: 3 } } }}
        uiSchema={{ stars: { 'ui:widget': 'RatingWidget' } }}
        extraErrors={{ stars: { __errors: ['rate it'] } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Stars' })).toHaveAttribute('aria-invalid', 'true');
    for (const star of screen.getAllByRole('radio')) {
      expect(star).toHaveAccessibleDescription('rate it');
    }
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

  test('focuses the range input under ui:autofocus, as core does', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider', { name: 'X' })).toHaveFocus();
  });

  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, '#root_x'],
    ['time input', { type: 'string', format: 'time' }, {}, '#root_x'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, '#root_x'],
    ['date picker', { type: 'string', format: 'date' }, {}, '#root_x'],
    ['date-time picker', { type: 'string', format: 'date-time' }, {}, '#root_x'],
    [
      "checkboxes group's first checkbox",
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      '#root_x-0',
    ],
    ["alt-date's first part", { type: 'string', format: 'date' }, { 'ui:widget': 'alt-date' }, '#root_x_year'],
  ])('focuses a %s under ui:autofocus, as core does', (_, x, ui, focused) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { ...x, title: 'X' } } }}
        uiSchema={{ x: { ...ui, 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(container.querySelector(focused)).toHaveFocus();
  });
});

describe('daisyui FieldTemplate', () => {
  test.each<[string, string, RJSFSchema]>([
    ['radio', 'radiogroup', { type: 'string', title: 'Color', enum: ['red', 'blue'] }],
    [
      'checkboxes',
      'group',
      { type: 'array', title: 'Color', items: { type: 'string', enum: ['red', 'blue'] }, uniqueItems: true },
    ],
  ])("draws a %s group's label with no for, which would name the group's wrapper", (widget, role, color) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        uiSchema={{ color: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    expect(container.querySelector(`#${fieldLabelId('root_color')}`)?.closest('label')).not.toHaveAttribute('for');
    expect(screen.getByRole(role, { name: 'Color' })).toBeInTheDocument();
  });

  test("names a required field's group by its label's text, without the required marker", () => {
    render(
      <Form
        schema={{
          type: 'object',
          required: ['color'],
          properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } },
        }}
        uiSchema={{ color: { 'ui:widget': 'radio' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Color' })).toBeInTheDocument();
  });

  test.each(['alt-date', 'alt-datetime'])("names the %s parts' group by the template's label", (widget) => {
    render(
      <Form
        schema={{ type: 'object', properties: { when: { type: 'string', title: 'When' } } }}
        uiSchema={{ when: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('group', { name: 'When' })).toHaveAttribute('id', 'root_when');
  });

  test("names the additional property key's input by its label where ui:label: false hides it", () => {
    render(
      <Form
        schema={{ type: 'object', additionalProperties: { type: 'string' } }}
        uiSchema={{ additionalProperties: { 'ui:label': false } }}
        initialFormData={{ first: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'first Key' })).toHaveAttribute('id', 'root_first-key');
  });

  test.each([
    ['declares it holds false unchecked', { uncheckedIsFalse: true }, /^Foo$/],
    ['declares nothing', {}, /^Foo\*$/],
  ])("marks the template's label for a switch that %s only where its plan says", (_, declaration, text) => {
    const SwitchWidget = ({ id }: WidgetProps) => <input id={id} type='checkbox' />;
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'boolean', title: 'Foo' } }, required: ['foo'] }}
        uiSchema={{ foo: { 'ui:widget': 'SwitchWidget' } }}
        widgets={{ SwitchWidget }}
        presentation={{ widgets: { SwitchWidget: { ...declaration, label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('label[for="root_foo"]')).toHaveTextContent(text);
  });
});

describe('daisyui TitleField', () => {
  // jsdom leaves a button inside the element a name points at out of the name, but a browser takes its label in too, so
  // the element the selector is named by is checked to hold the heading's text and nothing else
  test("names an optional object's option selector by its heading's text, not by its data control", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { pet } }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }}
        initialFormData={{ pet: { name: 'Rex' } }}
        validator={validator}
      />,
    );

    const selector = document.getElementById('root_pet__anyof_select')!;
    const heading = selectorLabel(selector);
    expect(heading).toHaveTextContent(/^Pet$/);
    expect(heading?.querySelector('button')).toBeNull();
    expect(selector).toHaveAccessibleName('Pet');
  });

  test("draws the heading its field's plan hands TitleField, decoration included, over its ui:title", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            pet: { type: 'object', title: 'Pet', deprecated: true, properties: { a: { type: 'string' } } },
            none: { type: 'null', title: 'Nothing', deprecated: true },
          },
        }}
        uiSchema={{
          pet: { 'ui:title': 'Animal', 'ui:options': { deprecatedHandling: 'label' } },
          none: { 'ui:title': 'Nada', 'ui:options': { deprecatedHandling: 'label' } },
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_pet__title')).toHaveTextContent(/^Animal \(deprecated\)$/);
    expect(container.querySelector('#root_none__title')).toHaveTextContent(/^Nada \(deprecated\)$/);
  });

  test("marks a required object's heading, outside the text its option selector is named by", () => {
    render(<Form schema={{ type: 'object', properties: { pet }, required: ['pet'] }} validator={validator} />);

    const selector = document.getElementById('root_pet__anyof_select')!;
    const title = selectorLabel(selector);
    expect(title).toHaveTextContent(/^Pet$/);
    expect(title?.closest('h2')).toHaveTextContent(/^Pet\*$/);
    expect(selector).toHaveAccessibleName('Pet');
  });

  test.each([
    ['a required', ['tags'], /^Tags\*$/],
    ['an optional', [], /^Tags$/],
  ])("marks %s array's heading only where it is required, outside its title's text", (_, required, heading) => {
    render(
      <Form
        schema={{
          type: 'object',
          properties: { tags: { type: 'array', title: 'Tags', items: { type: 'string' } } },
          required,
        }}
        validator={validator}
      />,
    );

    const title = document.getElementById('root_tags__title');
    expect(title).toHaveTextContent(/^Tags$/);
    expect(title?.closest('h3')).toHaveTextContent(heading);
  });
});

describe('daisyui headings and optional data controls', () => {
  test("keeps an optional object's data control where ui:label turns its heading off", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { pet: { type: 'object', title: 'Pet', properties: { a: { type: 'string' } } } },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] }, pet: { 'ui:label': false } }}
        initialFormData={{ pet: { a: 'x' } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_pet__title')).not.toBeInTheDocument();
    expect(container.querySelector('#root_pet__optionalRemove')).toBeInTheDocument();
  });

  test("draws no heading for an array option whose ui:title repeats its field's label", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            tags: { type: 'array', items: { type: 'string' }, anyOf: [{ maxItems: 3 }, { minItems: 1 }] },
          },
        }}
        uiSchema={{ tags: { 'ui:title': 'Tags', anyOf: [{ 'ui:title': 'Tags' }, {}] } }}
        validator={validator}
      />,
    );

    expect(container.querySelector(`#${fieldLabelId('root_tags')}`)).toHaveTextContent('Tags');
    expect(container.querySelector('#root_tags__title')).not.toBeInTheDocument();
  });

  test("keeps an optional array option's data control where a field above draws its heading", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            tags: {
              title: 'Tags',
              anyOf: [
                { type: 'array', items: { type: 'string' } },
                { type: 'array', items: { type: 'number' } },
              ],
            },
          },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['array'] } }}
        initialFormData={{ tags: ['a'] }}
        validator={validator}
      />,
    );

    expect(container.querySelector(`#${fieldLabelId('root_tags')}`)).toHaveTextContent('Tags');
    expect(container.querySelector('#root_tags__title')).not.toBeInTheDocument();
    expect(container.querySelector('#root_tags__optionalRemove')).toBeInTheDocument();
  });

  test("keeps an option's heading and data control where ui:globalOptions turns labels off and its field's ui:label turns them on", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            tags: {
              anyOf: [
                { type: 'array', title: 'Tags', items: { type: 'string' } },
                { type: 'number', title: 'Count' },
              ],
            },
          },
        }}
        uiSchema={{
          'ui:globalOptions': { label: false, enableOptionalDataFieldForType: ['array'] },
          tags: { 'ui:label': true, anyOf: [{}, {}] },
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_tags__title')).toHaveTextContent('Tags');
    expect(container.querySelector('#root_tags__optionalAdd')).toBeInTheDocument();
  });

  // #5401: the selector is off screen while an optional anyOf field has no data
  test('lays out no selector row for a selector MultiSchemaFieldTemplate is not given', () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { pet } }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_pet__anyof_select')).not.toBeInTheDocument();
    expect(container.querySelector('.border.rounded-sm > .mb-4:empty')).not.toBeInTheDocument();
  });
});

describe("daisyui's error and help elements carry the ids their field's plan describes its control by", () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      pet: {
        title: 'Pet',
        anyOf: [
          { title: 'Dog', type: 'string' },
          { title: 'Cat', type: 'number' },
        ],
      },
    },
  };

  test("renders an option's own help as a block under its own id, beside the field's", () => {
    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ pet: { 'ui:help': 'Pick a pet', anyOf: [{ 'ui:help': 'Dogs bark' }, {}] } }}
        validator={validator}
      />,
    );

    expect(container.querySelectorAll(`#${helpId('root_pet')}`)).toHaveLength(1);
    expect(container.querySelector(`div#${optionHelpId('root_pet')}`)).toHaveTextContent('Dogs bark');
    expect(container.querySelector('#root_pet')).toHaveAccessibleDescription('Pick a pet Dogs bark');
  });

  test("renders an anyOf field's errors once, under the id its control is described by", () => {
    const { container } = render(
      <Form schema={schema} extraErrors={{ pet: { __errors: ['pick one'] } }} validator={validator} />,
    );

    expect(container.querySelectorAll(`#${errorId('root_pet')}`)).toHaveLength(1);
    expect(container.querySelector('#root_pet')).toHaveAccessibleDescription('pick one');
  });
});

describe('daisyui focusOnFirstError', () => {
  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['text input', { type: 'string' }, {}, '#root_x'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, '#root_x'],
    ['toggle', { type: 'boolean' }, {}, '#root_x'],
    ['range input', { type: 'number' }, { 'ui:widget': 'range' }, '#root_x'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, '#root_x'],
    ['date picker', { type: 'string', format: 'date' }, {}, '#root_x'],
    // A group's wrapper carries the field's id but isn't focusable, so its first control is focused
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, '#root_x-0'],
    [
      'checkboxes group',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      '#root_x-0',
    ],
    ['rating', { type: 'number', maximum: 3 }, { 'ui:widget': 'RatingWidget' }, '#root_x input'],
    ['alt-date', { type: 'string', format: 'date' }, { 'ui:widget': 'alt-date' }, '#root_x_year'],
  ])('moves focus to a %s with errors', async (_, x, ui, focused) => {
    const { container } = render(
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

    expect(container.querySelector(focused)).toHaveFocus();
  });
});

describe('daisyui focuses its groups as core does', () => {
  test.each<[string, RJSFSchema, string]>([
    ['radio', { type: 'string', enum: ['red', 'green'] }, 'radio'],
    ['checkboxes', { type: 'array', items: { type: 'string', enum: ['red', 'green'] }, uniqueItems: true }, 'checkbox'],
  ])('focuses the first %s a user can choose under ui:autofocus', (widget, color, role) => {
    render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        uiSchema={{ color: { 'ui:widget': widget, 'ui:autofocus': true, 'ui:enumDisabled': ['red'] } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole(role)[1]).toHaveFocus();
  });

  test("focuses a radio group's checked radio under ui:autofocus, where Tab into the group lands", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', enum: ['red', 'green', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio', 'ui:autofocus': true } }}
        initialFormData={{ color: 'blue' }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('radio')[2]).toHaveFocus();
  });

  test.each([
    [3, '3 stars'],
    [undefined, '1 star'],
  ])("focuses a rating's checked star under ui:autofocus, else its first, where the value is %s", (stars, name) => {
    render(
      <Form
        schema={{ type: 'object', properties: { stars: { type: 'integer', minimum: 1, maximum: 5 } } }}
        uiSchema={{ stars: { 'ui:widget': 'RatingWidget', 'ui:autofocus': true } }}
        initialFormData={{ stars }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radio', { name })).toHaveFocus();
  });
});

describe('daisyui RangeWidget and TimeWidget', () => {
  test('a range shows a stored 0 rather than its default', () => {
    render(
      <Form
        schema={{
          type: 'object',
          properties: { x: { type: 'integer', title: 'X', minimum: 0, maximum: 10, default: 5 } },
        }}
        uiSchema={{ x: { 'ui:widget': 'range' } }}
        initialFormData={{ x: 0 }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider', { name: 'X' })).toHaveValue('0');
  });

  test('keeps a range with no value and no default controlled when it is moved', () => {
    const consoleError = vi.spyOn(console, 'error');
    try {
      render(
        <Form
          schema={{ type: 'object', properties: { x: { type: 'number', title: 'X', minimum: 0, maximum: 10 } } }}
          uiSchema={{ x: { 'ui:widget': 'range' } }}
          validator={validator}
        />,
      );

      // user-event edits no `type=range` input, so the move is a change event
      fireEvent.change(screen.getByRole('slider', { name: 'X' }), { target: { value: '3' } });

      expect(consoleError.mock.calls.flat().join(' ')).not.toContain('uncontrolled');
    } finally {
      consoleError.mockRestore();
    }
  });

  test.each<[string, RJSFSchema, UiSchema]>([
    ['range', { type: 'number' }, { 'ui:widget': 'range' }],
    ['time', { type: 'string', format: 'time' }, {}],
  ])('names a %s input by the name the form generates', (_, x, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x } }}
        uiSchema={{ x: uiSchema }}
        nameGenerator={bracketNameGenerator}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_x')).toHaveAttribute('name', 'root[x]');
  });
});

describe("daisyui marks a deprecated field's label, as core does", () => {
  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['text input', { type: 'string' }, {}, 'textbox'],
    ['number input', { type: 'number' }, {}, 'textbox'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, 'textbox'],
    ['range input', { type: 'number' }, { 'ui:widget': 'range' }, 'slider'],
    ['toggle', { type: 'boolean' }, {}, 'checkbox'],
    ['checkbox', { type: 'boolean' }, { 'ui:widget': 'checkbox' }, 'checkbox'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, 'combobox'],
    ['multi-select', { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true }, {}, 'combobox'],
    ['date picker', { type: 'string', format: 'date' }, {}, 'combobox'],
    ['date-time picker', { type: 'string', format: 'date-time' }, {}, 'combobox'],
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, 'radiogroup'],
    [
      'checkboxes group',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      'group',
    ],
  ])('names a deprecated %s by its label with the Deprecated marker', (_, x, ui, role) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { ...x, title: 'X', deprecated: true } } }}
        uiSchema={{ x: ui }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role, { name: 'X (deprecated)' })).toHaveAttribute('id', 'root_x');
    expect(container.innerHTML).not.toContain('(deprecated) (deprecated)');
  });
});

checkboxLabelTests(Form, { generateTemplates, generateWidgets });
