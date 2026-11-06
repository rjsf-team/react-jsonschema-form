import { MantineProvider, Switch } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import {
  checkboxLabelTests,
  fallbackDescriptionTests,
  formTests,
  submitPendingTests,
  themeTests,
  wrapIfAdditionalCallbackTests,
  wrapIfAdditionalErrorStateTests,
  wrapIfAdditionalFlagTests,
} from '@rjsf/snapshot-tests';
import type { ArrayFieldItemTemplateProps, FieldProps, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { elementOf } from '../../../testing/elementOf.ts';
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
  test.each<[string, RJSFSchema[], 'array' | 'object']>([
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
  ])('draws the description of an optional anyOf of %s once while it has no data', (_, anyOf, type) => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { tags: { title: 'Tags', description: 'Pick a pet', anyOf } } }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: [type] } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('Pick a pet')).toHaveLength(1);
  });
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

  test.each<[string, string, string, RJSFSchema]>([
    ['radio', 'RadioWidget', 'radiogroup', { type: 'string', title: 'Color', enum: ['red', 'blue'] }],
    [
      'checkboxes',
      'CheckboxesWidget',
      'group',
      { type: 'array', title: 'Color', items: { type: 'string', enum: ['red', 'blue'] }, uniqueItems: true },
    ],
  ])(
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

  test('writes a string from a range on a string field, which keeps it valid', async () => {
    const onChange = vi.fn();
    render(
      <WrappedForm
        schema={{ type: 'string', minimum: 0, maximum: 10 }}
        uiSchema={{ 'ui:widget': 'RangeWidget' }}
        initialFormData='7'
        liveValidate='onChange'
        onChange={onChange}
        validator={validator}
      />,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: '8', errors: [] }), 'root');
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

  test("leaves out a range's thumbProps that isn't an object and thumbLabel that isn't a string", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:options': { thumbProps: 'nope', thumbLabel: 5 } } }}
        presentation={{ widgets: { RangeWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).not.toHaveAttribute('0');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-labelledby', 'root_x__label');
    expect(screen.getByRole('slider')).toHaveAccessibleName('X');
  });

  test("leaves out a thumbLabel in a range's thumbProps that isn't a string", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:options': { thumbProps: { thumbLabel: 5 } } } }}
        presentation={{ widgets: { RangeWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-label', '5');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-labelledby', 'root_x__label');
    expect(screen.getByRole('slider')).toHaveAccessibleName('X');
  });

  test("leaves out an inputContainer that isn't a function", () => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:options': { inputContainer: 'nope' } } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  test.each([
    ['range', 'a string', 'label'],
    ['range', 'a number', 5],
    ['alt-date', 'a string', 'label'],
    ['alt-date', 'a number', 5],
  ])("leaves out the %s widget's inputWrapperOrder that is %s rather than an array", (widget, _, inputWrapperOrder) => {
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: widget === 'range' ? 'number' : 'string', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': widget, 'ui:options': { inputWrapperOrder } } }}
        validator={validator}
      />,
    );

    expect(screen.getByText('X')).toBeInTheDocument();
  });

  test.each([
    ['text', { type: 'string' }],
    ['textarea', { type: 'string' }],
    ['password', { type: 'string' }],
    ['color', { type: 'string' }],
    ['date', { type: 'string' }],
    ['select', { type: 'string', enum: ['a', 'b'] }],
    ['radio', { type: 'string', enum: ['a', 'b'] }],
    ['checkboxes', { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true }],
  ] satisfies [string, RJSFSchema][])(
    "leaves out the %s widget's inputWrapperOrder that isn't an array and inputContainer that isn't a function",
    (widget, fieldSchema) => {
      render(
        <WrappedForm
          schema={{ type: 'object', properties: { x: { ...fieldSchema, title: 'X' } } }}
          uiSchema={{
            x: { 'ui:widget': widget, 'ui:options': { inputWrapperOrder: 'label', inputContainer: 'nope' } },
          }}
          validator={validator}
        />,
      );

      expect(screen.getAllByText('X').length).toBeGreaterThan(0);
    },
  );

  test.each([
    ['text', { type: 'string' }],
    ['textarea', { type: 'string' }],
    ['select', { type: 'string', enum: ['a', 'b'] }],
    ['radio', { type: 'string', enum: ['a', 'b'] }],
    ['checkboxes', { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true }],
    ['range', { type: 'number' }],
    ['alt-date', { type: 'string' }],
  ] satisfies [string, RJSFSchema][])(
    "leaves out the %s widget's wrapperProps.inputWrapperOrder that isn't an array",
    (widget, fieldSchema) => {
      render(
        <WrappedForm
          schema={{ type: 'object', properties: { x: { ...fieldSchema, title: 'X' } } }}
          uiSchema={{ x: { 'ui:widget': widget, 'ui:options': { wrapperProps: { inputWrapperOrder: 5 } } } }}
          validator={validator}
        />,
      );

      expect(screen.getAllByText('X').length).toBeGreaterThan(0);
    },
  );

  test.each([
    ['text', { type: 'string' }, 'textbox'],
    ['range', { type: 'number' }, 'slider'],
  ] satisfies [string, RJSFSchema, string][])(
    "keeps the %s widget's inputWrapperOrder where its wrapperProps.inputWrapperOrder isn't an array",
    (widget, fieldSchema, role) => {
      render(
        <WrappedForm
          schema={{ type: 'object', properties: { x: { ...fieldSchema, title: 'X' } } }}
          uiSchema={{
            x: {
              'ui:widget': widget,
              'ui:options': { inputWrapperOrder: ['input', 'label'], wrapperProps: { inputWrapperOrder: 5 } },
            },
          }}
          validator={validator}
        />,
      );

      expect(screen.getByRole(role).compareDocumentPosition(screen.getByText('X'))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    },
  );

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
    expect(document.getElementById('root_x__year')).toHaveAccessibleName('X, year');
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

describe('mantine widget under a custom field', () => {
  test('draws once the errors a custom field declares drawing itself and spreads its plan into a widget (#5591)', () => {
    function MyField(props: FieldProps) {
      const { TextWidget } = props.registry.widgets;
      const { id, name, schema, uiSchema, registry, presentation, formData } = props;
      return (
        <div>
          <h5>{schema.title}</h5>
          <TextWidget
            {...{ id, name, schema, uiSchema, registry, presentation }}
            value={formData}
            label={schema.title ?? ''}
            options={{}}
            onChange={(value) => props.onChange(value, props.fieldPath)}
            onBlur={props.onBlur}
            onFocus={props.onFocus}
          />
          <div id={presentation?.errors.id}>{presentation?.errors.messages}</div>
        </div>
      );
    }
    render(
      <WrappedForm
        schema={{ type: 'object', properties: { x: { type: 'string', title: 'X' } } }}
        uiSchema={{ x: { 'ui:field': 'MyField' } }}
        fields={{ MyField }}
        presentation={{ fields: { MyField: { errors: 'self' } } }}
        extraErrors={{ x: { __errors: ['is wrong'] } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('is wrong')).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'X' })).toHaveAccessibleDescription('is wrong');
    expect(screen.getByRole('textbox', { name: 'X' })).toHaveAttribute('aria-invalid', 'true');
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

    expect(screen.getByRole('textbox', { name: 'first Key' })).toHaveAttribute('id', 'root_first__key');
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
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-labelledby', 'root_pet__XxxOf__title');
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

describe('mantine keeps a field on its form data', () => {
  test('RangeWidget ignores ui:options.value', () => {
    render(
      <WrappedForm
        schema={{ type: 'integer' }}
        uiSchema={{ 'ui:widget': 'range', 'ui:options': { value: 7 } }}
        initialFormData={3}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '3');
  });

  test('RangeWidget ignores ui:options.defaultValue on an empty field', () => {
    render(
      <WrappedForm
        schema={{ type: 'integer' }}
        uiSchema={{ 'ui:widget': 'range', 'ui:options': { defaultValue: 7 } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0');
  });

  test('BaseInputTemplate ignores ui:options.readOnly', async () => {
    const onChange = vi.fn();
    render(
      <WrappedForm
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:options': { readOnly: true } }}
        onChange={onChange}
        validator={validator}
      />,
    );
    const input = screen.getByRole('textbox');

    expect(input).not.toHaveAttribute('readonly');
    await user.type(input, 'a');

    expect(onChange.mock.lastCall?.[0].formData).toBe('a');
  });

  test('BaseInputTemplate keeps ui:autofocus when ui:options gives autoFocus: false', () => {
    render(
      <WrappedForm
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:autofocus': true, 'ui:options': { autoFocus: false } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  test('BaseInputTemplate ignores ui:options.autoFocus without ui:autofocus', () => {
    render(
      <WrappedForm
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:options': { autoFocus: true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox')).not.toHaveFocus();
  });

  test("SelectWidget keeps the schema's options when ui:options gives data", () => {
    const onChange = vi.fn();
    render(
      <WrappedForm
        schema={{ type: 'string', enum: ['a', 'b'] }}
        uiSchema={{ 'ui:options': { data: ['x', 'y'] } }}
        onChange={onChange}
        validator={validator}
      />,
    );

    // fireEvent, as Mantine's dropdown hides its options once an `await` lets floating-ui measure jsdom's zero-size layout
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['a', 'b']);
    fireEvent.click(screen.getByRole('option', { name: 'b' }));

    expect(onChange.mock.lastCall?.[0].formData).toBe('b');
  });

  test('FileWidget ignores ui:options.multiple on a single file', () => {
    const { container } = render(
      <WrappedForm
        schema={{ type: 'string', format: 'data-url' }}
        uiSchema={{ 'ui:options': { multiple: true } }}
        validator={validator}
      />,
    );

    expect(elementOf(container, 'input[type="file"]')).not.toHaveAttribute('multiple');
  });

  test('BaseInputTemplate keeps a field invalid when ui:options gives error: false', () => {
    render(
      <WrappedForm
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:options': { error: false } }}
        extraErrors={{ __errors: ['bad'] }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  test('BaseInputTemplate keeps a field valid when ui:options gives an error', () => {
    render(
      <WrappedForm
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:options': { error: 'not from the form' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('not from the form')).not.toBeInTheDocument();
  });

  test('RadioWidget ignores ui:options.defaultValue on an empty field', () => {
    render(
      <WrappedForm
        schema={{ type: 'string', enum: ['a', 'b'] }}
        uiSchema={{ 'ui:widget': 'radio', 'ui:options': { defaultValue: '1' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radio', { name: 'b' })).not.toBeChecked();
  });

  const ownedOptions = () => ({
    id: 'other',
    name: 'other',
    onChange: vi.fn(),
    onBlur: vi.fn(),
    onFocus: vi.fn(),
  });

  test.each<[string, RJSFSchema, UiSchema]>([
    ['BaseInputTemplate', { type: 'string' }, {}],
    ['BaseInputTemplate, numeric', { type: 'number' }, {}],
    ['TextareaWidget', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['PasswordWidget', { type: 'string' }, { 'ui:widget': 'password' }],
    ['ColorWidget', { type: 'string' }, { 'ui:widget': 'color' }],
    ['FileWidget', { type: 'string', format: 'data-url' }, {}],
    ['TimeWidget', { type: 'string', format: 'time' }, {}],
    ['DateWidget', { type: 'string', format: 'date' }, {}],
    ['RangeWidget', { type: 'integer' }, { 'ui:widget': 'range' }],
    ['SelectWidget', { type: 'string', enum: ['a', 'b'] }, {}],
    ['RadioWidget', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }],
    [
      'CheckboxesWidget',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
    ],
  ])("%s keeps the field's id and name when ui:options gives them", (_, schema, uiSchema) => {
    const { container } = render(
      <WrappedForm schema={schema} uiSchema={{ ...uiSchema, 'ui:options': ownedOptions() }} validator={validator} />,
    );

    expect(container.querySelector('#other')).not.toBeInTheDocument();
    expect(container.querySelector('#root')).toBeInTheDocument();
    expect(container.querySelector('[name="other"]')).not.toBeInTheDocument();
    expect(container.querySelector('[name="root"]')).toBeInTheDocument();
  });

  test.each<[string, RJSFSchema, UiSchema, unknown]>([
    ['BaseInputTemplate', { type: 'string' }, {}, 'abc'],
    ['BaseInputTemplate, numeric', { type: 'number' }, {}, 12],
    ['TextareaWidget', { type: 'string' }, { 'ui:widget': 'textarea' }, 'abc'],
    ['ColorWidget', { type: 'string' }, { 'ui:widget': 'color' }, '#abc'],
  ])("%s keeps the form's handlers when ui:options gives its own", async (_, schema, uiSchema, expected) => {
    const options = ownedOptions();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    render(
      <WrappedForm
        schema={schema}
        uiSchema={{ ...uiSchema, 'ui:options': options }}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        validator={validator}
      />,
    );

    await user.click(screen.getByRole('textbox'));
    await user.keyboard(String(expected));
    await user.tab();

    expect(onChange.mock.lastCall?.[0].formData).toEqual(expected);
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(options.onChange).not.toHaveBeenCalled();
    expect(options.onFocus).not.toHaveBeenCalled();
    expect(options.onBlur).not.toHaveBeenCalled();
  });

  test("PasswordWidget keeps the form's handlers when ui:options gives its own", async () => {
    const options = ownedOptions();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const { container } = render(
      <WrappedForm
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:widget': 'password', 'ui:options': options }}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        validator={validator}
      />,
    );

    await user.click(elementOf(container, 'input[type="password"]'));
    await user.keyboard('abc');
    await user.tab();

    expect(onChange.mock.lastCall?.[0].formData).toBe('abc');
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(options.onChange).not.toHaveBeenCalled();
  });

  test("RangeWidget keeps the form's handlers when ui:options gives its own", async () => {
    const options = ownedOptions();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    render(
      <WrappedForm
        schema={{ type: 'integer' }}
        uiSchema={{ 'ui:widget': 'range', 'ui:options': options }}
        initialFormData={3}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        validator={validator}
      />,
    );

    await user.tab();
    await user.keyboard('{ArrowRight}');
    await user.tab();

    expect(onChange.mock.lastCall?.[0].formData).toBe(4);
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(options.onChange).not.toHaveBeenCalled();
  });

  test.each<[string, RJSFSchema, UiSchema, string, unknown]>([
    ['RadioWidget', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, 'radio', 'b'],
    [
      'CheckboxesWidget',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      'checkbox',
      ['b'],
    ],
  ])("%s keeps the form's onChange when ui:options gives its own", async (_, schema, uiSchema, role, expected) => {
    const options = ownedOptions();
    const onChange = vi.fn();
    render(
      <WrappedForm
        schema={schema}
        uiSchema={{ ...uiSchema, 'ui:options': options }}
        onChange={onChange}
        validator={validator}
      />,
    );

    await user.click(screen.getAllByRole(role)[1]);
    await user.tab();

    expect(onChange.mock.lastCall?.[0].formData).toEqual(expected);
    expect(options.onChange).not.toHaveBeenCalled();
    expect(options.onFocus).not.toHaveBeenCalled();
    expect(options.onBlur).not.toHaveBeenCalled();
  });

  test("FileWidget keeps the form's onChange when ui:options gives its own", async () => {
    const options = ownedOptions();
    const onChange = vi.fn();
    const { container } = render(
      <WrappedForm
        schema={{ type: 'string', format: 'data-url' }}
        uiSchema={{ 'ui:options': options }}
        onChange={onChange}
        validator={validator}
      />,
    );

    await user.upload(
      elementOf(container, 'input[type="file"]', HTMLInputElement),
      new File(['x'], 'a.txt', { type: 'text/plain' }),
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(options.onChange).not.toHaveBeenCalled();
  });

  test("TimeWidget keeps the form's onChange when ui:options gives its own", async () => {
    const options = ownedOptions();
    const onChange = vi.fn();
    const { container } = render(
      <WrappedForm
        schema={{ type: 'string', format: 'time' }}
        uiSchema={{ 'ui:options': options }}
        onChange={onChange}
        validator={validator}
      />,
    );

    await user.click(elementOf(container, 'input[type="time"]'));
    await user.paste('10:30');

    expect(onChange).toHaveBeenCalled();
    expect(options.onChange).not.toHaveBeenCalled();
  });

  test("DateWidget keeps the form's onChange when ui:options gives its own", async () => {
    const options = ownedOptions();
    const onChange = vi.fn();
    render(
      <WrappedForm
        schema={{ type: 'string', format: 'date' }}
        uiSchema={{ 'ui:options': options }}
        onChange={onChange}
        validator={validator}
      />,
    );

    await user.click(screen.getByRole('textbox'));
    await user.paste('2024-01-02');

    expect(onChange.mock.lastCall?.[0].formData).toBe('2024-01-02');
    expect(options.onChange).not.toHaveBeenCalled();
  });

  test("SelectWidget keeps the form's onChange when ui:options gives its own", () => {
    const options = ownedOptions();
    const onChange = vi.fn();
    render(
      <WrappedForm
        schema={{ type: 'string', enum: ['a', 'b'] }}
        uiSchema={{ 'ui:options': options }}
        onChange={onChange}
        validator={validator}
      />,
    );

    // fireEvent, as Mantine's dropdown hides its options once an `await` lets floating-ui measure jsdom's zero-size layout
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'b' }));

    expect(onChange.mock.lastCall?.[0].formData).toBe('b');
    expect(options.onChange).not.toHaveBeenCalled();
  });

  test.each<[string, RJSFSchema]>([
    ['DateWidget', { type: 'string', format: 'date' }],
    ['SelectWidget', { type: 'string', enum: ['a', 'b'] }],
    ['TimeWidget', { type: 'string', format: 'time' }],
    ['FileWidget', { type: 'string', format: 'data-url' }],
  ])("%s keeps the form's onFocus and onBlur when ui:options gives its own", async (_, schema) => {
    const options = ownedOptions();
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    render(
      <WrappedForm
        schema={schema}
        uiSchema={{ 'ui:options': options }}
        onBlur={onBlur}
        onFocus={onFocus}
        validator={validator}
      />,
    );

    await user.tab();
    await user.tab();

    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(options.onFocus).not.toHaveBeenCalled();
    expect(options.onBlur).not.toHaveBeenCalled();
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

checkboxLabelTests(WrappedForm, { generateTemplates, generateWidgets, descriptionBy: 'self' });
fallbackDescriptionTests(WrappedForm, true);

wrapIfAdditionalErrorStateTests(WrappedForm);
wrapIfAdditionalFlagTests(WrappedForm);

wrapIfAdditionalCallbackTests(WrappedForm);

submitPendingTests(WrappedForm);
