import { MantineProvider, Switch } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import { checkboxLabelTests, formTests, themeTests } from '@rjsf/snapshot-tests';
import type { ArrayFieldItemTemplateProps, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import CheckboxWidget from '../src/widgets/CheckboxWidget.tsx';
import WrappedForm from './WrappedForm.tsx';

const user = userEvent.setup();

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useMove: vi.fn,
}));

formTests(WrappedForm);
themeTests({ generateTemplates, generateTheme, generateWidgets });

describe('mantine AnyOfField', () => {
  // This theme declares `description: 'self'` for its option selector, which an optional field with no data doesn't
  // render, so the field's description has to be handed down to the option instead
  test.each([
    [
      'arrays',
      [
        { type: 'array', items: { type: 'string' } },
        { type: 'array', items: { type: 'number' } },
      ],
      'array',
    ],
    [
      'objects',
      [
        { type: 'object', properties: { a: { type: 'string' } } },
        { type: 'object', properties: { b: { type: 'number' } } },
      ],
      'object',
    ],
  ] as [string, RJSFSchema[], string][])(
    'draws the description of an optional anyOf of %s once while it has no data',
    (_, anyOf, type) => {
      render(
        <WrappedForm
          schema={{ type: 'object', properties: { tags: { title: 'Tags', description: 'Pick a pet', anyOf } } }}
          uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: [type] } }}
          validator={validator}
        />,
      );

      expect(screen.getAllByText('Pick a pet')).toHaveLength(1);
    },
  );
});

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

  test("draws the label and description of @rjsf/core's RatingWidget, which draws neither itself", () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { r: { type: 'integer', title: 'Rate', description: 'How good', minimum: 0, maximum: 5 } },
        }}
        uiSchema={{ r: { 'ui:widget': 'RatingWidget' } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_r__label')).not.toHaveAttribute('for');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Rate');
    expect(screen.getAllByRole('radio')[0]).toHaveAccessibleDescription('How good');
  });
});

describe('mantine widgets are named by their label with the Deprecated marker', () => {
  const widgets: [string, RJSFSchema, UiSchema, string][] = [
    ['text input', { type: 'string' }, {}, 'textbox'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, 'textbox'],
    ['number input', { type: 'number' }, {}, 'textbox'],
    ['slider', { type: 'number' }, { 'ui:widget': 'range' }, 'slider'],
    ['checkbox', { type: 'boolean' }, {}, 'checkbox'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, 'combobox'],
  ];

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

  // The element that takes the group's role carries no id, so only its name is checked
  test.each<[string, RJSFSchema, string]>([
    ['radio', { type: 'string', enum: ['a', 'b'] }, 'radiogroup'],
    ['checkboxes', { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true }, 'group'],
  ])('names a deprecated %s group by its label with the Deprecated marker', (widget, x, role) => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { ...x, title: 'X', deprecated: true } } }}
        uiSchema={{ x: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role, { name: 'X (deprecated)' })).toBeInTheDocument();
  });
});

describe('mantine WrapIfAdditionalTemplate and SelectWidget', () => {
  test("names the additional property key's input by its label where ui:label: false hides it", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', additionalProperties: { type: 'string' } }}
        uiSchema={{ additionalProperties: { 'ui:label': false } }}
        initialFormData={{ first: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'first Key' })).toHaveAttribute('id', 'root_first-key');
  });

  test('marks a required multiple select aria-required on the input a user focuses', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          required: ['pets'],
          properties: { pets: { type: 'array', items: { type: 'string', enum: ['cat', 'dog'] }, uniqueItems: true } },
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_pets')).toHaveAttribute('aria-required', 'true');
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
        initialFormData={{ tags: ['a'] }}
        validator={validator}
      />,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('#root_tags__optionalRemove')).toBeInTheDocument();
  });

  test("keeps an option's heading and data control where ui:globalOptions turns labels off and its field's ui:label turns them on", () => {
    const { container } = render(
      <WrappedForm
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
});

describe('mantine ArrayFieldItemTemplate', () => {
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

describe('mantine ObjectFieldTemplate', () => {
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

describe('mantine focuses its groups as core does', () => {
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

// HTML5 constraint validation fails an unchecked required box and blocks the submit before RJSF sees it, so neither
// onSubmit nor onError runs and the browser asks the user to check a box the schema lets them leave unchecked. Only a
// required boolean the schema demands be true carries the attribute (#5388)
describe('mantine CheckboxWidget required attribute', () => {
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
      <MantineProvider>
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
      </MantineProvider>,
    );

    expect(container.querySelector('input[type=checkbox]')).not.toHaveAttribute('required');
  });
});

// mantine leaves the fallback UI's label to its value field, but its template still draws the field's description
// above the type selector, which a `ui:field` naming FallbackField or nothing must not move down to the value field
describe("mantine fallback UI's description, however its ui:field is spelled (#5389)", () => {
  setupConsoleWarnSuppression();

  test.each<[string, UiSchema]>([
    ['no ui:field', {}],
    ['a ui:field naming FallbackField', { 'ui:field': 'FallbackField' }],
    ['a ui:field naming nothing', { 'ui:field': 'Nope' }],
  ])('is drawn once, above the type selector, under %s', (_, valUiSchema) => {
    render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { val: { type: ['string', 'number'], title: 'Val', description: 'Desc' } },
        }}
        uiSchema={{ val: valUiSchema }}
        validator={validator}
        useFallbackUiForUnsupportedType
      />,
    );

    const descriptions = screen.getAllByText('Desc');
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]).toHaveAttribute('id', 'root_val__description');
    const typeSelector = document.getElementById('root_val___internal_type_selector')!;
    expect(descriptions[0].compareDocumentPosition(typeSelector)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});

checkboxLabelTests(WrappedForm, { generateTemplates, generateWidgets });
