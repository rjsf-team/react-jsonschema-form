import { Switch } from '@mantine/core';
import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { WidgetProps } from '@rjsf/utils';
import { helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useMove: vi.fn,
}));

formTests(WrappedForm);
themeTests({ generateTemplates, generateTheme, generateWidgets });

describe('mantine FieldTemplate', () => {
  const TextWidget = ({ id, presentation }: WidgetProps) => (
    <input id={id} aria-describedby={presentation?.control?.attributes['aria-describedby']} />
  );

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
    expect(label).toHaveTextContent(marked ? /^Foo \*$/ : /^Foo$/);
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Foo');
  });

  test("draws the description of a field whose widget's declaration leaves it to the template", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { foo: { type: 'string', title: 'Foo', description: 'About foo' } } }}
        uiSchema={{ foo: { 'ui:widget': 'TextWidget' } }}
        widgets={{ TextWidget }}
        presentation={{ widgets: { TextWidget: { label: 'template', description: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('About foo');
  });

  test('leaves the label of a widget declared to hold false unchecked unmarked where the schema demands no true', () => {
    const SwitchWidget = ({ id }: WidgetProps) => <Switch id={id} />;
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

  test.each([
    ['radio', 'RadioWidget', 'radiogroup', { type: 'string', title: 'Color', enum: ['red', 'blue'] }],
    [
      'checkboxes',
      'CheckboxesWidget',
      'group',
      { type: 'array', title: 'Color', items: { type: 'string', enum: ['red', 'blue'] }, uniqueItems: true },
    ],
  ] as const)(
    "names a %s group by the template's label, drawn with no for, which would name the group's wrapper",
    (widget, key, role, color) => {
      const { container } = render(
        <WrappedForm
          schema={{ type: 'object', properties: { color } }}
          uiSchema={{ color: { 'ui:widget': widget } }}
          presentation={{ widgets: { [key]: { label: 'template' } } }}
          validator={validator}
        />,
      );

      expect(container.querySelector('#root_color__label')).not.toHaveAttribute('for');
      expect(screen.getByRole(role, { name: 'Color' })).toHaveAttribute('aria-labelledby', 'root_color__label');
      expect(screen.getAllByText('Color')).toHaveLength(1);
    },
  );

  test.each([
    ['text input', 'TextWidget', { type: 'string', title: 'Foo' }, 'textbox'],
    ['textarea', 'TextareaWidget', { type: 'string', title: 'Foo' }, 'textbox'],
    ['checkbox', 'CheckboxWidget', { type: 'boolean', title: 'Foo' }, 'checkbox'],
  ] as const)(
    "names a %s by the template's label through aria-labelledby where its declaration says so",
    (_, key, foo, role) => {
      render(
        <WrappedForm
          schema={{ type: 'object', properties: { foo } }}
          uiSchema={{ foo: key === 'TextareaWidget' ? { 'ui:widget': 'textarea' } : {} }}
          presentation={{ widgets: { [key]: { label: 'template', labelledBy: 'aria-labelledby' } } }}
          validator={validator}
        />,
      );

      expect(document.getElementById('root_foo__label')).not.toHaveAttribute('for');
      expect(screen.getByRole(role)).toHaveAttribute('aria-labelledby', 'root_foo__label');
      expect(screen.getByRole(role)).toHaveAccessibleName('Foo');
    },
  );

  test("names a range's thumb by the template's label", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range' } }}
        presentation={{ widgets: { RangeWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(document.getElementById('root_x__label')).not.toHaveAttribute('for');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-labelledby', 'root_x__label');
    expect(screen.getByRole('slider')).toHaveAccessibleName('X');
    expect(screen.getAllByText('X')).toHaveLength(1);
  });

  test("keeps a range's thumb named by its thumbLabel beneath the template's label", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:options': { thumbLabel: 'Volume' } } }}
        presentation={{ widgets: { RangeWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('slider')).toHaveAccessibleName('Volume');
  });

  test.each([
    ['alt-date', 'AltDateWidget'],
    ['alt-datetime', 'AltDateTimeWidget'],
  ])("draws the template's label of an %s with no for, since no element carries the field's id", (widget, key) => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'string', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': widget } }}
        presentation={{ widgets: { [key]: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(document.getElementById('root_x__label')).toHaveTextContent(/^X$/);
    expect(document.getElementById('root_x__label')).not.toHaveAttribute('for');
    expect(document.getElementById('root_x_year')).toHaveAccessibleName('X, year');
  });
});

describe('mantine title templates', () => {
  test("mark a required object's heading outside its title id, so its option selector is named by the title alone", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: {
            pet: {
              type: 'object',
              title: 'Pet',
              properties: { name: { type: 'string' } },
              oneOf: [{ title: 'Dog' }, { title: 'Cat' }],
            },
          },
          required: ['pet'],
        }}
        validator={validator}
      />,
    );

    // The heading of an object rendered beside its options takes the `XxxOf` ids, as its selector's name does
    expect(container.querySelector('h3')).toHaveTextContent(/^Pet \*$/);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-labelledby', 'root_pet_XxxOf__title');
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pet');
  });

  test("marks a required array's heading outside its title id", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { list: { type: 'array', title: 'List', items: { type: 'string' } } },
          required: ['list'],
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('h4')).toHaveTextContent(/^List \*$/);
    expect(container.querySelector('#root_list__title')).toHaveTextContent(/^List$/);
  });
});

describe('mantine ArrayFieldTemplate', () => {
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

describe('mantine ObjectFieldTemplate', () => {
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

describe('mantine FieldHelpTemplate', () => {
  test("renders help in a block element, and an option's own help under its own id, beside the field's", () => {
    const { container } = render(
      <WrappedForm
        schema={{
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
        }}
        uiSchema={{ pet: { 'ui:help': 'Pick a pet', anyOf: [{ 'ui:help': 'Dogs bark' }, {}] } }}
        validator={validator}
      />,
    );

    const help = container.querySelectorAll(`[id="${helpId('root_pet')}"]`);
    expect(help).toHaveLength(1);
    expect(help[0].tagName).toBe('DIV');
    expect(help[0]).toHaveTextContent('Pick a pet');
    expect(container.querySelector(`[id="${optionHelpId('root_pet')}"]`)).toHaveTextContent('Dogs bark');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Pick a pet Dogs bark');
  });
});
