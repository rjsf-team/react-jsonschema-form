import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { FormValidation, RJSFSchema, UiSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';
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
