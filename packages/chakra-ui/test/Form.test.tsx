import type { ReactNode } from 'react';
import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

const user = userEvent.setup();

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
    render(
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
      render(
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
    },
  );
});
