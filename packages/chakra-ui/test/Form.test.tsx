import type { ReactNode } from 'react';
import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { errorId, helpId, optionHelpId } from '@rjsf/utils';
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

describe('chakra-ui RadioWidget', () => {
  test.each([
    ['whose label is hidden', { title: 'Color' }, { 'ui:label': false }],
    ['with no label', {}, {}],
  ])(
    'leaves a group %s unnamed, rather than named by the description or by an id no element has',
    (_, title, uiSchema) => {
      render(
        <WrappedForm
          schema={{ type: 'string', ...title, description: 'Pick a color', enum: ['red', 'blue'] }}
          uiSchema={{ 'ui:widget': 'radio', ...uiSchema }}
          validator={validator}
        />,
      );

      const group = screen.getByRole('radiogroup');
      expect(group).toHaveAccessibleName('');
      const labelledBy = group.getAttribute('aria-labelledby')?.split(' ').filter(Boolean) ?? [];
      expect(labelledBy.filter((labelId) => !document.getElementById(labelId))).toEqual([]);
    },
  );

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
