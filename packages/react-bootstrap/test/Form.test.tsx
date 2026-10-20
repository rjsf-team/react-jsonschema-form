import { checkboxLabelTests, formTests, themeTests } from '@rjsf/snapshot-tests';
import type { FormValidation, RJSFSchema, UiSchema } from '@rjsf/utils';
import { bracketNameGenerator, errorId, fieldLabelId, helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ThemeProvider } from 'react-bootstrap';

import CheckboxWidget from '../src/CheckboxWidget/index.ts';
import Form, { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

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

describe('a checkbox whose presentation gives its label and description to the template', () => {
  test('draws each once, from the template', () => {
    const { container } = render(
      <Form
        schema={{ type: 'boolean', title: 'Bee', description: 'Bee description' }}
        uiSchema={{ 'ui:widget': 'checkbox' }}
        presentation={{ widgets: { CheckboxWidget: { label: 'template', description: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('Bee')).toHaveLength(1);
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Bee');
    expect(screen.getAllByText('Bee description')).toHaveLength(1);
    expect(container.querySelector('#root__description')).toHaveTextContent('Bee description');
  });
});

describe("react-bootstrap widgets carry their field's plan on the element a user focuses", () => {
  test.each<[string, RJSFSchema, UiSchema]>([
    ['text', { type: 'string' }, {}],
    ['number', { type: 'number' }, {}],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}],
    ['range', { type: 'number' }, { 'ui:widget': 'range' }],
    // The plan goes on the checkbox's <input>, which carries its id, so the element a user focuses is the one described
    ['checkbox', { type: 'boolean' }, {}],
  ])('a %s control is invalid, styled so, and described only by elements that render', (_, schema, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { pet: { ...schema, title: 'Pet' } } }}
        uiSchema={{ pet: uiSchema }}
        extraErrors={{ pet: { __errors: ['too short'] } }}
        validator={validator}
      />,
    );

    const control = container.querySelector('#root_pet');
    expect(control).toHaveAccessibleName('Pet');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveClass('is-invalid');
    expect(control).toHaveAttribute('aria-describedby', 'root_pet__error');
    expect(control).toHaveAccessibleDescription('too short');
    expect(container.querySelectorAll('[aria-describedby]')).toHaveLength(1);
    expectReferencesResolve(container);
  });

  test("names a required range's input by htmlName and marks it required", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', required: ['volume'], properties: { volume: { type: 'integer', title: 'Volume' } } }}
        uiSchema={{ volume: { 'ui:widget': 'range' } }}
        nameGenerator={bracketNameGenerator}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('name', 'root[volume]');
    // jest-dom's toBeRequired() leaves out a range input, which the `required` constraint doesn't apply to
    expect(screen.getByRole('slider')).toHaveAttribute('required');
    expect(container.querySelector('label[for="root_volume"]')).toHaveTextContent('Volume*');
  });

  test('focuses a range input marked ui:autofocus', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } }}
        uiSchema={{ volume: { 'ui:widget': 'range', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveFocus();
  });

  // A browser ignores `readonly` on a range input, so a read-only range is disabled to keep it from being dragged
  test('disables a read-only range', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } }}
        uiSchema={{ volume: { 'ui:widget': 'range', 'ui:readonly': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toBeDisabled();
  });

  // A range input can't show an empty value, so clearing it would leave the slider at its midpoint
  test('draws a range no allowClearTextInputs clear button', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } }}
        uiSchema={{ volume: { 'ui:widget': 'range', 'ui:allowClearTextInputs': true } }}
        initialFormData={{ volume: 3 }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveValue('3');
    expect(screen.queryByRole('button', { name: 'clear input' })).not.toBeInTheDocument();
  });

  test("styles a range by a ThemeProvider's form-range prefix", () => {
    render(
      <ThemeProvider prefixes={{ 'form-range': 'my-range' }}>
        <Form
          schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } }}
          uiSchema={{ volume: { 'ui:widget': 'range' } }}
          validator={validator}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('slider')).toHaveClass('my-range');
    expect(screen.getByRole('slider')).not.toHaveClass('form-range');
  });

  test("focuses a radio group's first radio under ui:autofocus", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radio', { name: 'red' })).toHaveFocus();
  });

  const colors: RJSFSchema = { type: 'string', title: 'Color', enum: ['red', 'blue'] };
  // ARIA supports `aria-invalid` on a `radiogroup` but not on a `group`, so a radio group carries it in place of its
  // radios while each checkbox carries its own. The label names the group with no `for`, which would name its wrapper
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
    'names a %s group by its label, marks the group or each option invalid, and styles and describes each option by its errors',
    (widget, color, role, item, groupInvalid, optionInvalid) => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { color } }}
          uiSchema={{ color: { 'ui:widget': widget } }}
          extraErrors={{ color: { __errors: ['pick one'] } }}
          validator={validator}
        />,
      );

      const group = container.querySelector('#root_color');
      expect(group).toHaveRole(role);
      expect(group).toHaveAccessibleName('Color');
      expect(group?.getAttribute('aria-invalid')).toBe(groupInvalid);
      expect(container.querySelector(`#${fieldLabelId('root_color')}`)?.closest('label')).not.toHaveAttribute('for');
      for (const option of screen.getAllByRole(item)) {
        expect(option.getAttribute('aria-invalid')).toBe(optionInvalid);
        expect(option).toHaveClass('is-invalid');
        expect(option).toHaveAccessibleDescription('pick one');
      }
      expectReferencesResolve(container);
    },
  );

  test.each(['alt-date', 'alt-datetime'])(
    "marks, styles and describes each of a %s field's date parts by the field's errors",
    (widget) => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { when: { type: 'string', title: 'When' } } }}
          uiSchema={{ when: { 'ui:widget': widget } }}
          extraErrors={{ when: { __errors: ['pick a date'] } }}
          validator={validator}
        />,
      );

      const parts = screen.getAllByRole('combobox');
      expect(parts.length).toBeGreaterThan(0);
      for (const part of parts) {
        expect(part).toHaveAttribute('aria-invalid', 'true');
        expect(part).toHaveClass('is-invalid');
        expect(part).toHaveAccessibleDescription('pick a date');
      }
      expectReferencesResolve(container);
    },
  );
});

describe('react-bootstrap focusOnFirstError', () => {
  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['text input', { type: 'string' }, {}, '#root_x'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, '#root_x'],
    ['checkbox', { type: 'boolean' }, {}, '#root_x'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, '#root_x'],
    ['range', { type: 'number' }, { 'ui:widget': 'range' }, '#root_x'],
    // A group's wrapper carries the field's id but isn't focusable, so its first control is focused
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, '#root_x-0'],
    [
      'checkboxes group',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      '#root_x-0',
    ],
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

describe('react-bootstrap templates', () => {
  test.each([
    ['declares it holds false unchecked', { uncheckedIsFalse: true }, 'Foo'],
    ['declares nothing', {}, 'Foo*'],
  ])("marks the template's label for a switch that %s only where its plan says", (_, declaration, text) => {
    const SwitchWidget = () => null;
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'boolean', title: 'Foo' } }, required: ['foo'] }}
        uiSchema={{ foo: { 'ui:widget': 'SwitchWidget' } }}
        widgets={{ SwitchWidget }}
        presentation={{ widgets: { SwitchWidget: { ...declaration, label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('label[for="root_foo"]')?.textContent).toBe(text);
  });

  test("names a required object's option selector by its heading's text, without the marker beside it", () => {
    const pet: RJSFSchema = {
      type: 'object',
      title: 'Pet',
      properties: { name: { type: 'string' } },
      anyOf: [
        { title: 'Dog', properties: { bark: { type: 'string' } } },
        { title: 'Cat', properties: { meow: { type: 'string' } } },
      ],
    };
    const { container } = render(
      <Form schema={{ type: 'object', properties: { pet }, required: ['pet'] }} validator={validator} />,
    );

    expect(container.querySelector('#root_pet_XxxOf__title')).toHaveTextContent(/^Pet$/);
    expect(container.querySelector('#root_pet_XxxOf__title')?.parentElement).toHaveTextContent(/^Pet\*$/);
    expect(container.querySelector('select#root_pet__anyof_select')).toHaveAccessibleName('Pet');
  });

  const pick: RJSFSchema = {
    type: 'object',
    properties: { pick: { title: 'Pick', anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'number' }] } },
  };

  test("names an anyOf option selector by its field's label", () => {
    const { container } = render(<Form schema={pick} validator={validator} />);

    expect(container.querySelector('select#root_pick__anyof_select')).toHaveAccessibleName('Pick');
    expectReferencesResolve(container);
  });

  test("names a radio anyOf option selector's group by its field's label", () => {
    const { container } = render(
      <Form schema={pick} uiSchema={{ pick: { 'ui:widget': 'radio' } }} validator={validator} />,
    );

    const firstOption = container.querySelector('#root_pick__anyof_select-0')!;
    expect(firstOption.closest('[role="radiogroup"]')).toHaveAccessibleName('Pick');
    expectReferencesResolve(container);
  });

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
});

describe("react-bootstrap's error and help elements carry the ids their field's plan describes its control by", () => {
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
    expect(container.querySelector(`div#${helpId('root_pet')}`)).toHaveTextContent('Pick a pet');
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

describe('react-bootstrap names a control whose label ui:label false hides', () => {
  test.each<[string, string, RJSFSchema, UiSchema]>([
    ['text input', 'textbox', { type: 'string' }, {}],
    ['radio group', 'radiogroup', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }],
    [
      'checkboxes group',
      'group',
      { type: 'array', items: { enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
    ],
    ['range', 'slider', { type: 'number' }, { 'ui:widget': 'range' }],
    ['textarea', 'textbox', { type: 'string' }, { 'ui:widget': 'textarea' }],
    // The checkbox draws its own label, so it is the one hiding it and taking the plan's `aria-label` in its place
    ['checkbox', 'checkbox', { type: 'boolean' }, {}],
  ])('names a %s by the label text ui:label false hides', (_, role, schema, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { pet: { ...schema, title: 'Pet' } } }}
        uiSchema={{ pet: { ...uiSchema, 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(screen.queryByText('Pet')).toBeNull();
    expect(screen.getByRole(role)).toHaveAccessibleName('Pet');
    expectReferencesResolve(container);
  });
});

describe('react-bootstrap labels and key inputs', () => {
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
});

describe('react-bootstrap focuses its groups as core does', () => {
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
});

// HTML5 constraint validation fails an unchecked required box and blocks the submit before RJSF sees it, so neither
// onSubmit nor onError runs and the browser asks the user to check a box the schema lets them leave unchecked. Only a
// required boolean the schema demands be true carries the attribute (#5388)
describe('react-bootstrap CheckboxWidget required attribute', () => {
  const agree: RJSFSchema = { type: 'boolean', title: 'Agree' };
  const formSchema = (field: RJSFSchema): RJSFSchema => ({
    type: 'object',
    required: ['agree'],
    properties: { agree: field },
  });

  test('submits a required boolean left unchecked, whose false the schema accepts', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Form schema={formSchema(agree)} validator={validator} onSubmit={onSubmit} onError={onError} />,
    );

    expect(container.querySelector('input[type=checkbox]')).not.toHaveAttribute('required');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { agree: false } }),
      expect.anything(),
    );
  });

  test('keeps the attribute on a required boolean that has to be true', () => {
    const { container } = render(<Form schema={formSchema({ ...agree, const: true })} validator={validator} />);

    expect(container.querySelector('input[type=checkbox]')).toHaveAttribute('required');
  });

  // Rendered without a plan, as outside SchemaField, the widget gets its parent's `required` as is, so the attribute
  // has to follow both it and the schema: a required box whose `false` the schema accepts, and an optional one that
  // has to be true but is left unanswered, each hold data the schema accepts, which the browser would refuse
  test.each<[string, RJSFSchema, boolean, boolean | undefined]>([
    ['a required boolean whose false the schema accepts', agree, true, false],
    ['an optional boolean that has to be true', { ...agree, const: true }, false, undefined],
  ])('leaves the attribute off %s, rendered without a plan', (_, schema, required, value) => {
    const { container } = render(
      <CheckboxWidget {...makeWidgetMockProps({ schema, value, required, readonly: false })} />,
    );

    expect(container.querySelector('input[type=checkbox]')).not.toHaveAttribute('required');
  });
});

describe("react-bootstrap marks a deprecated field's label, as core does", () => {
  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['text input', { type: 'string' }, {}, 'textbox'],
    ['number input', { type: 'number' }, {}, 'textbox'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, 'textbox'],
    ['range', { type: 'number' }, { 'ui:widget': 'range' }, 'slider'],
    ['checkbox', { type: 'boolean' }, {}, 'checkbox'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, 'combobox'],
    ['multi-select', { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true }, {}, 'listbox'],
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
