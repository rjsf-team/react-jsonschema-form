import type { ReactNode } from 'react';
import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { FormValidation, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { errorId, helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

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

function BareFieldTemplate({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

formTests(WrappedForm);
themeTests({ generateTemplates, generateTheme, generateWidgets });

describe('chakra-ui AltDateWidget', () => {
  test('alt-datetime renders the time selects and its Now button emits a date-time', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <WrappedForm
        schema={{ type: 'string', format: 'date-time' }}
        uiSchema={{ 'ui:widget': 'alt-datetime' }}
        validator={validator}
        onChange={onChange}
      />,
    );

    expect(container.querySelector('[id="select:root_hour"]')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Now' }));
    expect(onChange.mock.lastCall?.[0].formData).toMatch(/T\d{2}:\d{2}:\d{2}/);
  });

  test.each(['Now', 'Clear'])('a readonly alt-date ignores its %s button', async (button) => {
    const onChange = vi.fn();
    render(
      <WrappedForm
        schema={{ type: 'string', format: 'date' }}
        uiSchema={{ 'ui:widget': 'alt-date', 'ui:readonly': true }}
        formData='2020-01-02'
        validator={validator}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: button }));
    expect(onChange).not.toHaveBeenCalled();
  });

  // The stock `FieldTemplate` renders a disabled field inside a disabled `<fieldset>`, which blocks the click before it
  // reaches the hook, so only a template without one shows the widget honoring `disabled` itself
  test.each(['Now', 'Clear'])(
    'a disabled alt-date under a custom FieldTemplate ignores its %s button',
    async (button) => {
      const onChange = vi.fn();
      render(
        <WrappedForm
          schema={{ type: 'string', format: 'date' }}
          uiSchema={{ 'ui:widget': 'alt-date', 'ui:disabled': true }}
          formData='2020-01-02'
          templates={{ FieldTemplate: BareFieldTemplate }}
          validator={validator}
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole('button', { name: button }));
      expect(onChange).not.toHaveBeenCalled();
    },
  );
});

describe('chakra-ui SelectWidget', () => {
  // The listbox is closed, so it is queried among hidden elements; the trigger isn't, past Ark's hidden native select
  test.each([
    ['trigger', 'combobox', false],
    ['listbox', 'listbox', true],
  ])('points the %s of a select that draws no label at no label', (_, role, hidden) => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'string', title: 'X', enum: ['a', 'b'] } } }}
        uiSchema={{ x: { 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role, { hidden })).toHaveAttribute('aria-labelledby', '');
    expect(container.querySelector('#root_x__label')).not.toBeInTheDocument();
  });

  test("names an object's option selector by the object's heading", () => {
    render(
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

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pet');
  });

  test("names an object's option selector by the heading's text alone, without its optional data control", () => {
    render(
      <WrappedForm
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
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }}
        formData={{ pet: { name: 'Rex' } }}
        validator={validator}
      />,
    );

    const title = document.getElementById('root_pet_XxxOf__title');
    expect(title?.closest('h5')?.parentElement?.querySelector('button')).toBeInTheDocument();
    expect(title?.querySelector('button')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pet');
  });

  test("marks a required heading outside the title's text, so a selector named by it isn't named with the marker", () => {
    render(
      <WrappedForm
        schema={{
          type: 'object',
          required: ['pet'],
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
        }}
        validator={validator}
      />,
    );

    const title = document.getElementById('root_pet_XxxOf__title');
    expect(title).toHaveTextContent(/^Pet$/);
    expect(title?.closest('h5')).toHaveTextContent('Pet*');
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pet');
  });

  test('keeps the name its own label gives it', () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { color: { title: 'Color', type: 'string', enum: ['red', 'blue'] } } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Color');
  });
});

describe("chakra-ui widgets carry their field's plan on the element a user focuses", () => {
  test.each<[string, string, RJSFSchema, UiSchema]>([
    ['text', 'textbox', { type: 'string' }, {}],
    ['textarea', 'textbox', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['updown', 'spinbutton', { type: 'number' }, { 'ui:widget': 'updown' }],
    ['range', 'slider', { type: 'number' }, { 'ui:widget': 'range' }],
    ['select', 'combobox', { type: 'string', enum: ['a', 'b'] }, {}],
    ['native select', 'combobox', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'NativeSelectWidget' }],
    ['checkbox', 'checkbox', { type: 'boolean' }, {}],
  ])('a %s control is invalid and described only by elements that render', (_, role, schema, uiSchema) => {
    const { container } = render(
      <WrappedForm
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
    expectReferencesResolve(container);
  });

  test('focuses the slider thumb under ui:autofocus, as core focuses its range input', () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveFocus();
  });

  test('focuses the slider thumb only on mount, as autoFocus does, not when ui:autofocus turns on later', () => {
    const schema: RJSFSchema = { type: 'object', properties: { x: { type: 'number', title: 'X' } } };
    const { rerender } = render(
      <WrappedForm schema={schema} uiSchema={{ x: { 'ui:widget': 'range' } }} validator={validator} />,
    );
    rerender(
      <WrappedForm
        schema={schema}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).not.toHaveFocus();
  });

  test("focuses a radio group's first radio under ui:autofocus, as core does", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'string', title: 'X', enum: ['a', 'b'] } } }}
        uiSchema={{ x: { 'ui:widget': 'radio', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('radio')[0]).toHaveFocus();
  });

  const colors: RJSFSchema = { type: 'string', title: 'Color', enum: ['red', 'blue'] };
  // ARIA supports `aria-invalid` on a `radiogroup` but not on a `group`, so a radio group carries it while each checkbox
  // carries its own. Ark marks each radio invalid too, from the group's state, so that isn't asserted either way
  test.each([
    ['radio', colors, 'radiogroup', 'radio', true],
    ['checkboxes', { type: 'array', title: 'Color', items: colors, uniqueItems: true }, 'group', 'checkbox', false],
  ] as const)(
    "marks a %s group or each option invalid, and describes each option by the field's errors",
    (widget, color, role, item, invalidGroup) => {
      const { container } = render(
        <WrappedForm
          schema={{ type: 'object', properties: { color } }}
          uiSchema={{ color: { 'ui:widget': widget } }}
          extraErrors={{ color: { __errors: ['pick one'] } }}
          validator={validator}
        />,
      );

      // The group closest to the options, since each fieldset around them is a `group` too
      const group = screen.getAllByRole(item)[0].closest(`[role="${role}"]`);
      if (invalidGroup) {
        expect(group).toHaveAttribute('aria-invalid', 'true');
      } else {
        expect(group).not.toHaveAttribute('aria-invalid');
      }
      for (const option of screen.getAllByRole(item)) {
        if (!invalidGroup) {
          expect(option).toHaveAttribute('aria-invalid', 'true');
        }
        expect(option).toHaveAttribute('aria-describedby', 'root_color__error');
        expect(option).toHaveAccessibleDescription('pick one');
      }
      expectReferencesResolve(container);
    },
  );
});

describe("chakra-ui widgets are named by their label and carry their field's id on the element a user focuses", () => {
  const widgets: [string, RJSFSchema, UiSchema, string, string][] = [
    ['text input', { type: 'string' }, {}, 'textbox', 'root_x'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, 'textbox', 'root_x'],
    ['checkbox', { type: 'boolean' }, {}, 'checkbox', 'root_x'],
    ['number input', { type: 'number' }, { 'ui:widget': 'updown' }, 'spinbutton', 'root_x'],
    ['slider', { type: 'number' }, { 'ui:widget': 'range' }, 'slider', 'root_x'],
    // Focus goes to the first radio, which carries its option's id, as core's does
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, 'radiogroup', 'root_x-0'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, 'combobox', 'root_x'],
    [
      'native select',
      { type: 'string', enum: ['a', 'b'] },
      { 'ui:widget': 'NativeSelectWidget' },
      'combobox',
      'root_x',
    ],
  ];

  test.each(widgets)("names a %s by its label, and gives it the field's id", (_, x, ui, role) => {
    const { container } = render(
      <WrappedForm
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
        <WrappedForm
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
      // Ark's slider refocuses its thumb on the next frame; letting it run while the form is mounted keeps it from
      // looking the thumb up in a detached tree, which Vitest reports as an unhandled error
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });

      expect(document.activeElement).toHaveAttribute('id', focusedId);
    },
  );

  test("gives a checkboxes group the field's id and each checkbox's input its option's, and focuses the first", async () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: {
            x: { type: 'array', title: 'X', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
          },
        }}
        uiSchema={{ x: { 'ui:widget': 'checkboxes' } }}
        validator={validator}
        focusOnFirstError
        customValidate={(_: unknown, errors: FormValidation<{ x?: unknown }>) => {
          errors.x?.addError('bad');
          return errors;
        }}
      />,
    );

    expect(container.querySelector('#root_x')).toHaveAccessibleName('X');
    expect(screen.getByRole('checkbox', { name: 'a' })).toHaveAttribute('id', 'root_x-0');
    expect(screen.getByRole('checkbox', { name: 'b' })).toHaveAttribute('id', 'root_x-1');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByRole('checkbox', { name: 'a' })).toHaveFocus();
  });

  test("marks a slider's label invalid while its errors show, and read-only for a read-only field", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { x: { type: 'number', title: 'X' }, y: { type: 'number', title: 'Y' } },
        }}
        uiSchema={{ x: { 'ui:widget': 'range' }, y: { 'ui:widget': 'range', 'ui:readonly': true } }}
        extraErrors={{ x: { __errors: ['bad'] } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_x__label')).toHaveAttribute('data-invalid');
    expect(container.querySelector('#root_y__label')).toHaveAttribute('data-readonly');
  });

  test("marks a required slider's label and dims a disabled one's", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { x: { type: 'number', title: 'X' }, y: { type: 'number', title: 'Y' } },
          required: ['x'],
        }}
        uiSchema={{ x: { 'ui:widget': 'range' }, y: { 'ui:widget': 'range', 'ui:disabled': true } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_x__label')).toHaveTextContent(/^X\*$/);
    expect(container.querySelector('#root_y__label')).toHaveAttribute('data-disabled');
  });

  test("names an additional property's key input by its label", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', additionalProperties: { type: 'string' } }}
        formData={{ foo: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'foo Key' })).toHaveAttribute('id', 'root_foo-key');
  });
});

describe('chakra-ui CheckboxesWidget', () => {
  test("points the fieldset of a group that draws no legend at no legend, and keeps the legend's name where it draws one", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: {
            x: { type: 'array', title: 'X', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
            y: { type: 'array', title: 'Y', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
          },
        }}
        uiSchema={{ x: { 'ui:widget': 'checkboxes', 'ui:label': false }, y: { 'ui:widget': 'checkboxes' } }}
        validator={validator}
      />,
    );

    expectReferencesResolve(container);
    expect(container.querySelector('#root_y')).toHaveAccessibleName('Y');
  });
});

describe('chakra-ui RadioWidget', () => {
  test.each([
    ['whose label is hidden by its text', { title: 'Color' }, { 'ui:label': false }, 'Color'],
    ['with no label unnamed', {}, {}, ''],
  ])('names a group %s, rather than by the description or by an id no element has', (_, title, uiSchema, name) => {
    render(
      <WrappedForm
        schema={{ type: 'string', ...title, description: 'Pick a color', enum: ['red', 'blue'] }}
        uiSchema={{ 'ui:widget': 'radio', ...uiSchema }}
        validator={validator}
      />,
    );

    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAccessibleName(name);
    const labelledBy = group.getAttribute('aria-labelledby')?.split(' ').filter(Boolean) ?? [];
    expect(labelledBy.filter((labelId) => !document.getElementById(labelId))).toEqual([]);
  });

  test('names its group by the label it draws rather than by the description', () => {
    render(
      <WrappedForm
        schema={{ type: 'string', title: 'Color', description: 'Pick a color', enum: ['red', 'blue'] }}
        uiSchema={{ 'ui:widget': 'radio' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Color');
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAccessibleDescription('Pick a color');
    }
  });
});

describe('chakra-ui FieldTemplate', () => {
  const TextWidget = ({ id }: WidgetProps) => <input id={id} />;

  test.each([
    ['a required', ['foo'], true],
    ['an optional', [], false],
  ])("draws the label of %s field whose widget's declaration leaves it to the template", (_, required, marked) => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { foo: { type: 'string', title: 'Foo' } }, required }}
        uiSchema={{ foo: { 'ui:widget': 'TextWidget' } }}
        widgets={{ TextWidget }}
        presentation={{ widgets: { TextWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    const label = container.querySelector('label[for="root_foo"]');
    expect(label).toHaveAttribute('id', 'root_foo__label');
    expect(label).toHaveTextContent(marked ? /^Foo\*$/ : /^Foo$/);
    // The classes each widget's own label and required indicator carry
    expect(label).toHaveClass('chakra-field__label');
    expect(label?.querySelectorAll('.chakra-field__requiredIndicator')).toHaveLength(marked ? 1 : 0);
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Foo');
  });

  test("marks the template's label for a switch declared to hold false unchecked only where the schema demands true", () => {
    const SwitchWidget = ({ id }: WidgetProps) => <input id={id} type='checkbox' />;
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { foo: { type: 'boolean', title: 'Foo' } }, required: ['foo'] }}
        uiSchema={{ foo: { 'ui:widget': 'SwitchWidget' } }}
        widgets={{ SwitchWidget }}
        presentation={{ widgets: { SwitchWidget: { label: 'template', uncheckedIsFalse: true } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('label[for="root_foo"]')).toHaveTextContent(/^Foo$/);
  });

  test("draws the template's label for a radio group with no for, which would name the group's wrapper", () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio' } }}
        presentation={{ widgets: { RadioWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_color__label')).not.toHaveAttribute('for');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Color');
  });

  // The plan gives a template label no part where there is no control to name, as while an optional field has no data
  test('draws no label for an optional anyOf field with no data, though declared to leave its label to the template', () => {
    const { container } = render(
      <WrappedForm
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

  test("dims the template's label for a read-only field, as each widget dims its own", () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { foo: { type: 'string', title: 'Foo' } } }}
        uiSchema={{ foo: { 'ui:readonly': true } }}
        presentation={{ widgets: { TextWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_foo__label')).toHaveAttribute('data-disabled');
  });

  test("points each field's fieldset at the label the template draws, or at nothing", () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { foo: { type: 'string', title: 'Foo' } } }}
        presentation={{ widgets: { TextWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    const fieldsets = [...container.querySelectorAll('fieldset')];
    expect(fieldsets.map((fieldset) => fieldset.getAttribute('aria-labelledby'))).toEqual(['', 'root_foo__label']);
    expect(screen.getByRole('group', { name: 'Foo' })).toBe(fieldsets[1]);
  });

  test('draws no label for a widget that draws its own', () => {
    const { container } = render(<WrappedForm schema={{ type: 'string', title: 'Foo' }} validator={validator} />);

    expect(screen.getAllByText('Foo')).toHaveLength(1);
    expect(container.querySelector('#root__label')).not.toBeInTheDocument();
  });
});

describe('chakra-ui labels the core widgets that draw no label of their own', () => {
  test("labels core's RatingWidget from the template, naming its radiogroup", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { score: { type: 'integer', title: 'Score', maximum: 3 } } }}
        uiSchema={{ score: { 'ui:widget': 'RatingWidget' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Score');
  });

  test.each(['alt-date', 'alt-datetime'])('labels a %s field from the template', (widget) => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { when: { type: 'string', title: 'When' } } }}
        uiSchema={{ when: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    expect(document.getElementById('root_when__label')).toHaveTextContent('When');
  });
});

describe('chakra-ui ArrayFieldTemplate', () => {
  test("draws no heading for an array option whose ui:title repeats its field's label", () => {
    render(
      <WrappedForm
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

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Tags');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test("keeps an optional array's data control where it draws no heading", () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { tags: { type: 'array', title: 'Tags', items: { type: 'string' } } } }}
        uiSchema={{ tags: { 'ui:label': false }, 'ui:globalOptions': { enableOptionalDataFieldForType: ['array'] } }}
        formData={{ tags: ['a'] }}
        validator={validator}
      />,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('#root_tags__optionalRemove')).toBeInTheDocument();
  });
});

describe("chakra-ui's error and help elements carry the ids their field's plan describes its control by", () => {
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

  test("renders an option's own help under its own id, beside the field's", () => {
    const { container } = render(
      <WrappedForm
        schema={schema}
        uiSchema={{ pet: { 'ui:help': 'Pick a pet', anyOf: [{ 'ui:help': 'Dogs bark' }, {}] } }}
        validator={validator}
      />,
    );

    expect(container.querySelectorAll(`#${helpId('root_pet')}`)).toHaveLength(1);
    expect(container.querySelector(`#${helpId('root_pet')}`)).toHaveTextContent('Pick a pet');
    expect(container.querySelector(`#${optionHelpId('root_pet')}`)).toHaveTextContent('Dogs bark');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Pick a pet Dogs bark');
  });

  test("renders an anyOf field's errors once, under the id its control is described by", () => {
    const { container } = render(
      <WrappedForm
        schema={schema}
        extraErrors={{ pet: { __errors: ['pick one', 'or another'] } }}
        validator={validator}
      />,
    );

    expect(container.querySelectorAll(`#${errorId('root_pet')}`)).toHaveLength(1);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('pick one or another');
  });
});

describe('chakra-ui ObjectFieldTemplate', () => {
  test("keeps an optional object's data control where ui:label turns its heading off", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { pet: { type: 'object', title: 'Pet', properties: { a: { type: 'string' } } } },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] }, pet: { 'ui:label': false } }}
        formData={{ pet: { a: 'x' } }}
        validator={validator}
      />,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('#root_pet__optionalRemove')).toBeInTheDocument();
  });
});

describe('chakra-ui names a control whose label ui:label false hides', () => {
  test.each<[string, string, RJSFSchema, UiSchema]>([
    ['text input', 'textbox', { type: 'string' }, {}],
    ['radio group', 'radiogroup', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }],
    ['range', 'slider', { type: 'number' }, { 'ui:widget': 'range' }],
  ])('names a %s by the label text ui:label false hides', (_, role, schema, uiSchema) => {
    const { container } = render(
      <WrappedForm
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
