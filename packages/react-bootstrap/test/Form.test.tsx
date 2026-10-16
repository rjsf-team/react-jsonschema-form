import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { FormValidation, RJSFSchema, UiSchema } from '@rjsf/utils';
import { bracketNameGenerator, fieldLabelId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form, { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';

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
        formData={{ volume: 3 }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveValue('3');
    expect(screen.queryByRole('button', { name: 'clear input' })).not.toBeInTheDocument();
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
      expect(container.querySelector(`#${fieldLabelId('root_color')}`)).not.toHaveAttribute('for');
      for (const option of screen.getAllByRole(item)) {
        expect(option.getAttribute('aria-invalid')).toBe(optionInvalid);
        expect(option).toHaveClass('is-invalid');
        expect(option).toHaveAccessibleDescription('pick one');
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
});
