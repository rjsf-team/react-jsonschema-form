import type { ReactNode } from 'react';
import { Activity, useState } from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { getTestRegistry } from '@rjsf/core/testing';
import { checkboxLabelTests, formTests, themeTests } from '@rjsf/snapshot-tests';
import type { ArrayFieldItemTemplateProps, FormValidation, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { bracketNameGenerator, errorId, fieldLabelId, helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import CheckboxWidget from '../src/CheckboxWidget/index.ts';
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

  test.each(['Now', 'Clear'])('a readonly alt-date disables and ignores its %s button', async (button) => {
    const onChange = vi.fn();
    render(
      <WrappedForm
        schema={{ type: 'string', format: 'date' }}
        uiSchema={{ 'ui:widget': 'alt-date', 'ui:readonly': true }}
        initialFormData='2020-01-02'
        validator={validator}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: button })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: button }));
    expect(onChange).not.toHaveBeenCalled();
  });

  // The stock `FieldTemplate` renders a disabled field inside a disabled `<fieldset>`, which blocks the click before it
  // reaches the hook, so only a template without one shows the widget honoring `disabled` itself
  test.each(['Now', 'Clear'])(
    'a disabled alt-date under a custom FieldTemplate disables and ignores its %s button',
    async (button) => {
      const onChange = vi.fn();
      render(
        <WrappedForm
          schema={{ type: 'string', format: 'date' }}
          uiSchema={{ 'ui:widget': 'alt-date', 'ui:disabled': true }}
          initialFormData='2020-01-02'
          templates={{ FieldTemplate: BareFieldTemplate }}
          validator={validator}
          onChange={onChange}
        />,
      );

      expect(screen.getByRole('button', { name: button })).toBeDisabled();
      await user.click(screen.getByRole('button', { name: button }));
      expect(onChange).not.toHaveBeenCalled();
    },
  );
});

describe('chakra-ui SelectWidget', () => {
  test('focuses the trigger on a click on its label, as a select label does, without opening the listbox', async () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { s: { type: 'string', title: 'S', enum: ['a', 'b'] } } }}
        validator={validator}
      />,
    );

    const label = screen.getByText('S');
    expect(label).not.toHaveAttribute('for');
    await user.click(label);

    const trigger = screen.getByRole('combobox', { name: 'S' });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

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

  test("points Ark's hidden native select of a select that draws no label at no label", () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'string', title: 'X', enum: ['a', 'b'] } } }}
        uiSchema={{ x: { 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('select')).toHaveAttribute('aria-labelledby', '');
  });

  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['hides its label', { type: 'string', title: 'X', enum: ['a', 'b'] }, { 'ui:label': false }, 'X'],
    ['has no title', { type: 'string', enum: ['a', 'b'] }, {}, 'Select ...'],
  ])('names the listbox of a select that %s as it names the trigger', (_, schema, uiSchema, name) => {
    render(<WrappedForm schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(screen.getByRole('combobox')).toHaveAccessibleName(name);
    // The closed listbox is hidden, which leaves it no computed name, and opening it in jsdom trips zag's positioning,
    // so its `aria-label` is checked beside the empty `aria-labelledby` that leaves the name to it
    const listbox = screen.getByRole('listbox', { hidden: true });
    expect(listbox).toHaveAttribute('aria-labelledby', '');
    expect(listbox).toHaveAttribute('aria-label', name);
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

  test("names an anyOf option selector's trigger by its field's label", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { pick: { title: 'Pick', anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'number' }] } },
        }}
        validator={validator}
      />,
    );

    const trigger = container.querySelector('#root_pick__anyof_select');
    // The option's own enum is a second combobox, named "Pick" by a label of its own
    expect(screen.getAllByRole('combobox', { name: 'Pick' })).toContain(trigger);
    expect(trigger).toHaveAttribute('aria-labelledby', fieldLabelId('root_pick'));
    expectReferencesResolve(container);
  });

  test("names a radio anyOf option selector's group by its field's label", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { pick: { title: 'Pick', anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'number' }] } },
        }}
        uiSchema={{ pick: { 'ui:widget': 'radio' } }}
        validator={validator}
      />,
    );

    const radioGroup = container.querySelector('#root_pick__anyof_select-0')!.closest('[role="radiogroup"]');
    expect(radioGroup).toHaveAccessibleName('Pick');
    expect(radioGroup).toHaveAttribute('aria-labelledby', fieldLabelId('root_pick'));
    expectReferencesResolve(container);
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
        initialFormData={{ pet: { name: 'Rex' } }}
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

  test('a checkbox with errors is styled invalid, as the other controls are', () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { b: { type: 'boolean', title: 'B' } } }}
        extraErrors={{ b: { __errors: ['bad'] } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.chakra-checkbox__control')).toHaveAttribute('data-invalid');
  });

  // A template with no `<fieldset>` of Ark's, so the group's state comes from the widget alone
  test('a radio group with errors is styled invalid under a FieldTemplate that draws no fieldset', () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { c: { type: 'string', title: 'C', enum: ['a', 'b'] } } }}
        uiSchema={{ c: { 'ui:widget': 'radio' } }}
        templates={{ FieldTemplate: BareFieldTemplate }}
        extraErrors={{ c: { __errors: ['bad'] } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('[data-scope="radio-group"][data-part="root"]')).toHaveAttribute('data-invalid');
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

  test('leaves focus where it is when an Activity around the form is shown again, rather than refocusing the thumb', async () => {
    function Toggled() {
      const [shown, setShown] = useState(true);
      return (
        <>
          <button type='button' onClick={() => setShown(!shown)}>
            Toggle
          </button>
          <Activity mode={shown ? 'visible' : 'hidden'}>
            <WrappedForm
              schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
              uiSchema={{ x: { 'ui:widget': 'range', 'ui:autofocus': true } }}
              validator={validator}
            />
          </Activity>
        </>
      );
    }
    render(<Toggled />);
    expect(screen.getByRole('slider')).toHaveFocus();

    const toggle = screen.getByRole('button', { name: 'Toggle' });
    await user.click(toggle);
    await user.click(toggle);
    expect(toggle).toHaveFocus();
  });

  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['select', { type: 'string', title: 'X', enum: ['a', 'b'] }, {}, 'combobox'],
    ['number input', { type: 'number', title: 'X' }, { 'ui:widget': 'updown' }, 'spinbutton'],
    ['checkbox', { type: 'boolean', title: 'X' }, {}, 'checkbox'],
    ['first date part', { type: 'string', format: 'date', title: 'X' }, { 'ui:widget': 'alt-date' }, 'combobox'],
  ])('focuses its %s under ui:autofocus, as core does', (_, x, uiSchema, role) => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x } }}
        uiSchema={{ x: { ...uiSchema, 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole(role)[0]).toHaveFocus();
  });

  test.each<[string, RJSFSchema, UiSchema, () => HTMLElement]>([
    [
      'the thumb of a slider',
      { type: 'number', title: 'X' },
      { 'ui:widget': 'range' },
      () => screen.getByRole('slider'),
    ],
    [
      "a radio group's checked radio",
      { type: 'string', title: 'X', enum: ['a', 'b'], default: 'b' },
      { 'ui:widget': 'radio' },
      () => screen.getAllByRole('radio')[1],
    ],
  ])('focuses %s when its label, which has no for, is clicked', async (_, x, uiSchema, focused) => {
    const { container } = render(
      <WrappedForm schema={{ type: 'object', properties: { x } }} uiSchema={{ x: uiSchema }} validator={validator} />,
    );

    await user.click(container.querySelector('#root_x__label')!);
    // Ark's slider refocuses its thumb on the next frame; letting it run while the form is mounted keeps it from
    // looking the thumb up in a detached tree, which Vitest reports as an unhandled error
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(focused()).toHaveFocus();
  });

  test('marks a required radio group required, on the group and on each radio', () => {
    render(
      <WrappedForm
        schema={{
          type: 'object',
          required: ['c'],
          properties: { c: { type: 'string', title: 'C', enum: ['a', 'b'] } },
        }}
        uiSchema={{ c: { 'ui:widget': 'radio' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeRequired();
    }
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

  test.each(widgets)('names a deprecated %s by its label with the Deprecated marker', (_, x, ui, role) => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { ...x, title: 'X', deprecated: true } } }}
        uiSchema={{ x: ui }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role, { name: 'X (deprecated)' })).toHaveAttribute('id', 'root_x');
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
        initialFormData={{ foo: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'foo Key' })).toHaveAttribute('id', 'root_foo-key');
  });
});

describe("chakra-ui marks a deprecated field's label, as core does", () => {
  // The widgets table has no array widget, so nothing else in this file renders a deprecated one
  test.each<[string, UiSchema, string]>([
    ['checkboxes group', { 'ui:widget': 'checkboxes' }, 'group'],
    ['multi-select', {}, 'combobox'],
  ])('names a deprecated %s by its label with the Deprecated marker', (_, ui, role) => {
    render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: {
            x: {
              type: 'array',
              title: 'X',
              deprecated: true,
              items: { type: 'string', enum: ['a', 'b'] },
              uniqueItems: true,
            },
          },
        }}
        uiSchema={{ x: ui }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role, { name: 'X (deprecated)' })).toHaveAttribute('id', 'root_x');
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

  test('names its group once, by the label it draws, and leaves the fieldset around it unnamed', () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'array', title: 'Colors', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true }}
        uiSchema={{ 'ui:widget': 'checkboxes' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('group', { name: 'Colors' })).toHaveAttribute('id', 'root');
    expect(container.querySelector('legend')).toBeNull();
    for (const fieldset of container.querySelectorAll('fieldset')) {
      expect(fieldset).toHaveAccessibleName('');
    }
  });

  test('marks the label it draws for a required group with a *, which its name leaves out', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          required: ['c'],
          properties: {
            c: { type: 'array', title: 'C', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
          },
        }}
        uiSchema={{ c: { 'ui:widget': 'checkboxes' } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_c__label')).toHaveTextContent(/^C\*$/);
    expect(container.querySelector('#root_c')).toHaveAccessibleName('C');
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

  test("points no field's fieldset at the label the template draws, which names the control inside it", () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { foo: { type: 'string', title: 'Foo' } } }}
        presentation={{ widgets: { TextWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    const fieldsets = [...container.querySelectorAll('fieldset')];
    expect(fieldsets.map((fieldset) => fieldset.getAttribute('aria-labelledby'))).toEqual(['', '']);
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Foo');
    expect(screen.queryByRole('group', { name: 'Foo' })).toBeNull();
  });

  test("names a rating's radiogroup by the template's label once, with no fieldset of the same name around it", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { score: { type: 'integer', title: 'Score', maximum: 3 } } }}
        uiSchema={{ score: { 'ui:widget': 'RatingWidget' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Score');
    expect(screen.queryByRole('group', { name: 'Score' })).toBeNull();
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

  test.each(['alt-date', 'alt-datetime'])(
    'labels a %s field from the template, naming the group of its parts',
    (widget) => {
      const { container } = render(
        <WrappedForm
          schema={{ type: 'object', properties: { when: { type: 'string', title: 'When' } } }}
          uiSchema={{ when: { 'ui:widget': widget } }}
          validator={validator}
        />,
      );

      const label = document.getElementById('root_when__label');
      expect(label).toHaveTextContent('When');
      expect(label).not.toHaveAttribute('for');
      expect(screen.getByRole('button', { name: 'Now' }).closest('fieldset')).toHaveAccessibleName('When');
      container.querySelectorAll('label[for]').forEach((labelFor) => {
        expect(container.querySelector(`[id="${labelFor.getAttribute('for')}"]`)).toBeInTheDocument();
      });
    },
  );
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
        initialFormData={{ tags: ['a'] }}
        validator={validator}
      />,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('#root_tags__optionalRemove')).toBeInTheDocument();
  });
});

describe('chakra-ui ArrayFieldItemTemplate', () => {
  // This theme's own item template doesn't lay its buttons out by `displayLabel`, so a custom one records it
  test.each<{ named: string; items: RJSFSchema; uiSchema?: UiSchema; value: unknown; displayLabel: boolean }>([
    {
      named: 'a text input, whose label sits above it',
      items: { type: 'string', title: 'Tag' },
      value: 'a',
      displayLabel: true,
    },
    {
      named: 'a checkbox, whose label sits beside it',
      items: { type: 'boolean', title: 'Flag' },
      value: true,
      displayLabel: false,
    },
    {
      named: "a type list under the fallback UI, whose type selector's label sits above it",
      items: { type: ['string', 'number'], title: 'Value' },
      value: 'a',
      displayLabel: true,
    },
    {
      named: "an untitled type list under the fallback UI, whose type selector's label sits above it",
      items: { type: ['string', 'number'] },
      value: 'a',
      displayLabel: true,
    },
    {
      named: 'a type list with a hidden value under the fallback UI, whose type selector is hidden with it',
      items: { type: ['string', 'number'], title: 'Value' },
      uiSchema: { items: { 'ui:widget': 'hidden' } },
      value: 'a',
      displayLabel: false,
    },
    {
      named:
        'a deprecated type list hidden by ui:deprecatedHandling under the fallback UI, whose type selector is hidden with it',
      items: { type: ['string', 'number'], title: 'Value', deprecated: true },
      uiSchema: { items: { 'ui:deprecatedHandling': 'hide' } },
      value: 'a',
      displayLabel: false,
    },
    {
      named: 'a type list hidden by a global widget under the fallback UI, whose type selector is hidden with it',
      items: { type: ['string', 'number'], title: 'Value' },
      uiSchema: { 'ui:globalOptions': { widget: 'hidden' } },
      value: 'a',
      displayLabel: false,
    },
    {
      named: 'a hidden text input, with no control on screen to draw a label above',
      items: { type: 'string', title: 'Tag' },
      uiSchema: { items: { 'ui:widget': 'hidden' } },
      value: 'a',
      displayLabel: false,
    },
  ])('hands a custom template whether a label sits above $named', ({ items, uiSchema, value, displayLabel }) => {
    const displayLabels: (boolean | undefined)[] = [];
    function ArrayFieldItemTemplate(props: ArrayFieldItemTemplateProps) {
      displayLabels.push(props.displayLabel);
      return <div>{props.children}</div>;
    }
    render(
      <WrappedForm
        schema={{ type: 'array', items }}
        uiSchema={uiSchema}
        initialFormData={[value]}
        templates={{ ArrayFieldItemTemplate }}
        validator={validator}
        useFallbackUiForUnsupportedType
      />,
    );

    expect(displayLabels.at(-1)).toBe(displayLabel);
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
        initialFormData={{ pet: { a: 'x' } }}
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
    ['checkbox', 'checkbox', { type: 'boolean' }, {}],
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

describe('chakra-ui names and focuses its controls as core does', () => {
  test.each([
    ['range', { 'ui:widget': 'range' }],
    ['updown', { 'ui:widget': 'updown' }],
  ])('names a %s form value by htmlName', (_, uiSchema) => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } }}
        uiSchema={{ volume: uiSchema }}
        nameGenerator={bracketNameGenerator}
        validator={validator}
      />,
    );

    expect(container.querySelector('input[name="root[volume]"]')).toBeInTheDocument();
  });

  test('names a native select form value by htmlName', () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'NativeSelectWidget' } }}
        nameGenerator={bracketNameGenerator}
        validator={validator}
      />,
    );

    expect(container.querySelector('select[name="root[color]"]')).toBeInTheDocument();
  });

  test.each<[string, RJSFSchema, string]>([
    ['radio', { type: 'string', enum: ['red', 'green'] }, 'radio'],
    ['checkboxes', { type: 'array', items: { type: 'string', enum: ['red', 'green'] }, uniqueItems: true }, 'checkbox'],
  ])('focuses the first %s a user can choose under ui:autofocus', (widget, color, role) => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { color } }}
        uiSchema={{ color: { 'ui:widget': widget, 'ui:autofocus': true, 'ui:enumDisabled': ['red'] } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole(role)[1]).toHaveFocus();
  });

  test("focuses a radio group's checked radio under ui:autofocus, where Tab into the group lands", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { color: { type: 'string', enum: ['red', 'green', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio', 'ui:autofocus': true } }}
        initialFormData={{ color: 'blue' }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('radio')[2]).toHaveFocus();
  });
});

describe("chakra-ui draws a widget's own label under the id its plan gives it", () => {
  // The radio selector draws the field's label under its plan's id, so an option drawing its own takes a numbered one
  test.each<[string, RJSFSchema, UiSchema, unknown, string]>([
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, 'a', 'combobox'],
    ['range', { type: 'number' }, { 'ui:widget': 'range' }, 3, 'slider'],
  ])(
    "draws an option's %s label beneath a radio selector under its own id, rather than the selector's",
    (_, option, optionUiSchema, value, role) => {
      const { container } = render(
        <WrappedForm
          schema={{ type: 'object', properties: { pet: { title: 'Pet', anyOf: [{ title: 'Kind', ...option }] } } }}
          uiSchema={{ pet: { 'ui:widget': 'radio', anyOf: [optionUiSchema] } }}
          initialFormData={{ pet: value }}
          validator={validator}
        />,
      );

      expect(container.querySelectorAll('[id="root_pet__label"]')).toHaveLength(1);
      expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Pet');
      expect(container.querySelector('#root_pet__optionLabel')).toBeInTheDocument();
      expect(screen.getByRole(role)).toHaveAccessibleName(
        container.querySelector('#root_pet__optionLabel')?.textContent,
      );
      expectReferencesResolve(container);
    },
  );
});

describe('chakra-ui WrapIfAdditionalTemplate', () => {
  test("names a propertyNames key select by the key's label where ui:label false hides it", () => {
    render(
      <WrappedForm
        schema={{
          type: 'object',
          propertyNames: { enum: ['foo', 'bar'] },
          additionalProperties: { type: 'string' },
        }}
        uiSchema={{ additionalProperties: { 'ui:label': false } }}
        initialFormData={{ foo: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAccessibleName('foo Key');
    expect(screen.queryByText('foo Key')).toBeNull();
  });

  test("names a free-text key input by the key's label where ui:label false hides it", () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'object', additionalProperties: { type: 'string' } }}
        uiSchema={{ additionalProperties: { 'ui:label': false } }}
        initialFormData={{ foo: 'bar' }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_foo-key')).toHaveAccessibleName('foo Key');
    expect(screen.queryByText('foo Key')).toBeNull();
  });
});

// HTML5 constraint validation fails an unchecked required box and blocks the submit before RJSF sees it, so neither
// onSubmit nor onError runs and the browser asks the user to check a box the schema lets them leave unchecked. Only a
// required boolean the schema demands be true carries the attribute (#5388)
describe('chakra-ui CheckboxWidget required attribute', () => {
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
      <WrappedForm schema={formSchema(agree)} validator={validator} onSubmit={onSubmit} onError={onError} />,
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
    const { container } = render(<WrappedForm schema={formSchema({ ...agree, const: true })} validator={validator} />);

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
      <ChakraProvider value={defaultSystem}>
        <CheckboxWidget
          id='root'
          name='root'
          schema={schema}
          uiSchema={{}}
          value={value}
          required={required}
          disabled={false}
          readonly={false}
          autofocus={false}
          label='Agree'
          options={{}}
          onChange={vi.fn()}
          onBlur={vi.fn()}
          onFocus={vi.fn()}
          registry={getTestRegistry(schema)}
        />
      </ChakraProvider>,
    );

    expect(container.querySelector('input[type=checkbox]')).not.toHaveAttribute('required');
  });
});

checkboxLabelTests(WrappedForm, { generateTemplates, generateWidgets });
