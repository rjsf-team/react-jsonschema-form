import { getTestRegistry } from '@rjsf/core/testing';
import type { FieldProps, RJSFSchema, ThemePresentation, UiSchema, WidgetProps } from '@rjsf/utils';
import { fieldLabelId, toFieldPath } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import type { UiSchema as DaisyUiSchema } from '../src/index.ts';
import Form, { generateTemplates } from '../src/index.ts';
import DaisyFieldTemplate from '../src/templates/FieldTemplate/FieldTemplate.tsx';
import DaisyCheckboxWidget from '../src/widgets/CheckboxWidget/CheckboxWidget.tsx';
import DaisyToggleWidget from '../src/widgets/ToggleWidget/ToggleWidget.tsx';

/** The label `FieldTemplate` renders above the control, found by the `fieldLabelId()` it alone carries, on its text: a
 * widget's own label (`CheckboxWidget`, `ToggleWidget`) has no id, and a group's label has no `htmlFor` to find it by
 */
function fieldLabel(container: HTMLElement, id: string) {
  return container.querySelector(`#${fieldLabelId(id)}`)?.closest('label') ?? null;
}

const agree: RJSFSchema = { type: 'boolean', title: 'Agree' };

function CustomWidget({ id, value }: WidgetProps) {
  return <input type='text' id={id} readOnly value={String(value ?? '')} />;
}

function renderForm(
  uiSchema: UiSchema = {},
  fieldSchema: RJSFSchema = agree,
  widgets = {},
  presentation?: ThemePresentation,
) {
  const schema: RJSFSchema = { type: 'object', properties: { agree: fieldSchema } };
  const { container } = render(
    <Form
      schema={schema}
      uiSchema={uiSchema}
      validator={validator}
      widgets={{ custom: CustomWidget, ...widgets }}
      presentation={presentation}
    />,
  );
  return {
    container,
    templateLabel: () => fieldLabel(container, 'root_agree'),
  };
}

describe('FieldTemplate', () => {
  describe('boolean field labels', () => {
    test('renders the label above a boolean rendered as radios', () => {
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'radio' } });

      expect(templateLabel()).toHaveTextContent('Agree');
    });

    test('renders the label above a boolean rendered by a custom widget', () => {
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'custom' } });

      expect(templateLabel()).toHaveTextContent('Agree');
      expect(screen.getByLabelText('Agree')).toBe(screen.getByRole('textbox'));
    });

    test('renders the label above a boolean rendered as a select', () => {
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'select' } });

      expect(templateLabel()).toHaveTextContent('Agree');
      expect(screen.getByLabelText('Agree')).toBe(screen.getByRole('combobox', { name: /Agree/ }));
    });

    test('leaves the label to the checkbox widget, which renders it after the input', () => {
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'checkbox' } });

      expect(templateLabel()).toBeNull();
      const label = screen.getByText('Agree').closest('label')!;
      expect(label.querySelector('input[type="checkbox"]')).toBeInTheDocument();
    });

    test('leaves the label to the checkbox widget under its registry-key spelling too', () => {
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'CheckboxWidget' } });

      expect(templateLabel()).toBeNull();
      expect(screen.getAllByText('Agree')).toHaveLength(1);
    });

    test('leaves the label to the checkbox widget handed over as a component', () => {
      const { container, templateLabel } = renderForm(
        { agree: { 'ui:widget': DaisyCheckboxWidget } },
        {
          ...agree,
          description: 'Whether you agree',
        },
      );

      expect(templateLabel()).toBeNull();
      expect(screen.getAllByText('Agree')).toHaveLength(1);
      // Both this template and the widget render a description, so a second one would duplicate its DOM id and leave
      // the input's `aria-describedby` pointing at two elements
      expect(screen.getAllByText('Whether you agree')).toHaveLength(1);
      expect(container.querySelectorAll('[id="root_agree__description"]')).toHaveLength(1);
    });

    test('leaves the label to a consumer widget wrapping the checkbox under its key', () => {
      function WrappedCheckbox(props: WidgetProps) {
        return <DaisyCheckboxWidget {...props} />;
      }
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'checkbox' } }, agree, {
        CheckboxWidget: WrappedCheckbox,
      });

      // A wrapper is a component of its own, so the rule is the registry key rather than the identity of this
      // theme's widget: whatever is registered as the checkbox is what renders the label
      expect(templateLabel()).toBeNull();
      expect(screen.getAllByText('Agree')).toHaveLength(1);
    });

    test('leaves the label to a label-less widget registered under the checkbox key, which then renders none', () => {
      function PlainCheckbox({ id, value, onChange }: WidgetProps) {
        return <input type='checkbox' id={id} checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
      }
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'checkbox' } }, agree, {
        CheckboxWidget: PlainCheckbox,
      });

      // What taking that key costs: this template cannot tell a wrapper from a replacement, and the widget that
      // takes the checkbox's place takes its job of rendering the label with it
      expect(templateLabel()).toBeNull();
      expect(screen.queryByText('Agree')).not.toBeInTheDocument();
    });

    test('leaves the label to the toggle widget, which renders it after the switch', () => {
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'toggle' } });

      expect(templateLabel()).toBeNull();
      expect(screen.getAllByText('Agree')).toHaveLength(1);
      expect(screen.getByLabelText('Agree')).toBe(screen.getByRole('checkbox'));
    });

    test('leaves the label to the checkbox widget for a nullable boolean', () => {
      const { templateLabel } = renderForm(
        { agree: { 'ui:widget': 'checkbox' } },
        {
          type: ['boolean', 'null'],
          title: 'Agree',
        },
      );

      expect(templateLabel()).toBeNull();
      expect(screen.getAllByText('Agree')).toHaveLength(1);
    });

    test('leaves the label to the checkbox widget on a number-first type list, which renders the boolean field', () => {
      const { templateLabel } = renderForm(
        { agree: { 'ui:widget': 'checkbox' } },
        { type: ['number', 'boolean'], title: 'Agree' },
      );

      expect(templateLabel()).toBeNull();
      expect(screen.getAllByText('Agree')).toHaveLength(1);
    });

    test('leaves the label to the checkbox widget for a boolean with no widget', () => {
      const { templateLabel } = renderForm();

      expect(templateLabel()).toBeNull();
      const label = screen.getByText('Agree').closest('label')!;
      expect(label.querySelector('input[type="checkbox"]')).toBeInTheDocument();
    });

    test('renders no label for a hidden boolean', () => {
      renderForm({ agree: { 'ui:widget': 'hidden' } });

      expect(screen.queryByText('Agree')).not.toBeInTheDocument();
    });

    // The toggle is a registry key of this theme's own, so it reaches any schema type a consumer points it at, and it
    // renders the label wherever it lands. Only an alias like `checkbox` is resolved through the schema's type
    test('leaves the label to the toggle widget on a schema that is not a boolean', () => {
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'toggle' } }, { type: 'string', title: 'Agree' });

      expect(templateLabel()).toBeNull();
      expect(screen.getAllByText('Agree')).toHaveLength(1);
    });

    // Of the boolean aliases only `checkbox` is recognized, so a field that names another alias whose key holds a
    // widget rendering its own label gets the template's label and description as well, the description twice under
    // one id. A known limitation, pinned so it changes on purpose
    test.each(['radio', 'RadioWidget'])(
      'draws the label and description once, through the template, for a toggle under the RadioWidget key, named as %s',
      (widget) => {
        const { container, templateLabel } = renderForm(
          { agree: { 'ui:widget': widget } },
          { ...agree, description: 'Whether you agree' },
          { RadioWidget: DaisyToggleWidget },
        );

        expect(templateLabel()).toHaveTextContent('Agree');
        expect(screen.getAllByText('Agree')).toHaveLength(1);
        expect(screen.getAllByText('Whether you agree')).toHaveLength(1);
        expect(container.querySelectorAll('[id="root_agree__description"]')).toHaveLength(1);
        expect(screen.getByRole('checkbox')).toHaveClass('toggle');
      },
    );

    test('leaves the label and description to the toggle when the key holding it declares that it draws them', () => {
      const { templateLabel } = renderForm(
        { agree: { 'ui:widget': 'RadioWidget' } },
        { ...agree, description: 'Whether you agree' },
        { RadioWidget: DaisyToggleWidget },
        { widgets: { RadioWidget: { label: 'self', description: 'self' } } },
      );

      expect(templateLabel()).toBeNull();
      expect(screen.getAllByText('Agree')).toHaveLength(1);
      expect(screen.getAllByText('Whether you agree')).toHaveLength(1);
      expect(screen.getByRole('checkbox')).toHaveClass('toggle');
    });
  });

  // A custom `ui:field` reads its `ui:widget` itself, so the name can be one no widget has, such as `toString`, which
  // is inherited from `Object.prototype`. `FieldTemplate` still asks whether that widget renders its own label, and has
  // to answer without a failed widget lookup's `JSON.stringify()` of the field's schema on every render
  describe('a widget name inherited from Object.prototype', () => {
    function OwnField({ uiSchema }: FieldProps) {
      return <output data-testid='own-field'>{String(uiSchema?.['ui:widget'])}</output>;
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test.each<[string, RJSFSchema]>([
      ['a string', { type: 'string', title: 'Agree' }],
      ['a boolean', agree],
    ])('is answered without stringifying %s schema', (_, fieldSchema) => {
      const stringify = vi.spyOn(JSON, 'stringify');

      const { container } = renderForm({ agree: { 'ui:field': OwnField, 'ui:widget': 'toString' } }, fieldSchema);

      const ownField = screen.getByTestId('own-field');
      expect(ownField).toHaveTextContent('toString');
      expect(container.querySelector('.field-template')).toContainElement(ownField);
      expect(stringify).not.toHaveBeenCalledWith(expect.objectContaining(fieldSchema));
    });
  });

  // The label a widget renders for itself is the only one the field has, so the marker for a required field has to
  // travel with it
  describe('the required marker', () => {
    const required = { type: 'object' as const, required: ['agree'] };

    test('is rendered by the widget whose own label replaces the template one', () => {
      render(
        <Form
          schema={{ ...required, properties: { agree: { type: 'string', title: 'Agree' } } }}
          uiSchema={{ agree: { 'ui:widget': 'toggle' } }}
          validator={validator}
        />,
      );

      expect(screen.getByText('Agree').parentElement).toHaveTextContent('Agree*');
    });

    // `false` answers a boolean whose schema accepts it, so a required one is already answered and is marked no more
    // than a field the user has filled in; the attribute that would have the browser refuse the submit is left off for
    // the same reason
    test('is left off a boolean whose false is an answer the schema accepts', () => {
      render(<Form schema={{ ...required, properties: { agree } }} validator={validator} />);

      expect(screen.getByText('Agree').parentElement).not.toHaveTextContent('*');
      expect(screen.getByRole('checkbox')).not.toHaveAttribute('required');
    });

    test('is rendered for a boolean that has to be true', () => {
      render(<Form schema={{ ...required, properties: { agree: { ...agree, const: true } } }} validator={validator} />);

      expect(screen.getByText('Agree').parentElement).toHaveTextContent('Agree*');
    });
  });

  describe('field descriptions', () => {
    const described: RJSFSchema = { ...agree, description: 'Whether you agree' };

    test('leaves the description to the checkbox widget, which renders its own', () => {
      renderForm({ agree: { 'ui:widget': 'checkbox' } }, described);

      expect(screen.getAllByText('Whether you agree')).toHaveLength(1);
    });

    test('leaves the description to the toggle widget, which renders its own', () => {
      renderForm({ agree: { 'ui:widget': 'toggle' } }, described);

      expect(screen.getAllByText('Whether you agree')).toHaveLength(1);
    });

    test('renders the description for a boolean rendered as radios', () => {
      renderForm({ agree: { 'ui:widget': 'radio' } }, described);

      expect(screen.getAllByText('Whether you agree')).toHaveLength(1);
    });
  });

  describe('labelling a widget that renders a group of controls', () => {
    const choices: RJSFSchema = {
      type: 'array',
      title: 'Agree',
      items: { type: 'string', enum: ['yes', 'no'] },
      uniqueItems: true,
    };

    test('names the radio group of a boolean rendered as radios', () => {
      renderForm({ agree: { 'ui:widget': 'radio' } });

      expect(screen.getByRole('radiogroup', { name: 'Agree' })).toBeInTheDocument();
    });

    test('names the group of an array rendered as checkboxes', () => {
      renderForm({ agree: { 'ui:widget': 'checkboxes' } }, choices);

      expect(screen.getByRole('group', { name: 'Agree' })).toBeInTheDocument();
    });

    // The group is named by pointing at the template's label, so the two spellings of the same widget choice have to
    // agree about whether that label is rendered at all
    test('still has a name when the widget is set through ui:options.widget', () => {
      const { templateLabel } = renderForm({ agree: { 'ui:options': { widget: 'radio' } } });

      expect(templateLabel()).toHaveTextContent('Agree');
      expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Agree');
    });

    test("is named by the hidden label's text rather than by a label it doesn't draw", () => {
      renderForm({ agree: { 'ui:widget': 'radio', 'ui:options': { label: false } } });

      const group = screen.getByRole('radiogroup');
      expect(group).not.toHaveAttribute('aria-labelledby');
      expect(group).toHaveAccessibleName('Agree');
    });

    test('marks the radio group invalid rather than its radios while the field has errors', () => {
      render(
        <Form
          schema={{ type: 'object', properties: { agree } }}
          uiSchema={{ agree: { 'ui:widget': 'radio' } }}
          validator={validator}
          extraErrors={{ agree: { __errors: ['must agree'] } }}
        />,
      );

      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
      for (const radio of screen.getAllByRole('radio')) {
        expect(radio).not.toHaveAttribute('aria-invalid');
      }
    });
  });

  // A group is named by pointing at the label element, so its accessible name is whatever the label displays, including
  // where that isn't the schema title as written
  describe('naming a group from the label the user can see', () => {
    test('uses the key, not the schema title, for an additionalProperties entry', () => {
      const { container } = render(
        <Form
          schema={{ type: 'object', additionalProperties: { type: 'string', title: 'Extra', enum: ['a', 'b'] } }}
          uiSchema={{ additionalProperties: { 'ui:widget': 'radio' } }}
          initialFormData={{ foo: 'a' }}
          validator={validator}
        />,
      );

      expect(fieldLabel(container, 'root_foo')).toHaveTextContent('foo');
      expect(screen.getByRole('radiogroup')).toHaveAccessibleName('foo');
    });

    test('keeps the deprecated decoration the template adds', () => {
      renderForm(
        { agree: { 'ui:widget': 'radio', 'ui:options': { deprecatedHandling: 'label' } } },
        { ...agree, deprecated: true },
      );

      expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Agree (deprecated)');
    });
  });

  describe('the alt-date widget', () => {
    const altDate = { 'ui:widget': 'alt-date', 'ui:options': { yearsRange: [2020, 2024] } };
    const dateSchema = { type: 'string' as const, format: 'date' };

    test('associates each of its labels with the control it names', () => {
      renderForm({ agree: altDate }, { ...dateSchema, title: 'Agree' });

      // daisyui's SelectWidget opens from a real `button`, which `label htmlFor` can associate with. Its `aria-label`
      // names it, and starts with the field's title so the visible label alone doesn't leave the part out of context
      for (const type of ['year', 'month', 'day']) {
        expect(screen.getByLabelText(type)).toBe(screen.getByRole('combobox', { name: `Agree, ${type}` }));
      }
    });

    test('names the whole group with the field label', () => {
      renderForm({ agree: altDate }, { ...dateSchema, title: 'Agree' });

      expect(screen.getByRole('group', { name: 'Agree' })).toBeInTheDocument();
    });

    // A label points at each select whether or not the field has a property name of its own, so a root field — which
    // has none — has to describe the value its selects display just as a titled property does
    describe.each([
      [
        'a titled property',
        { type: 'object' as const, properties: { agree: { ...dateSchema, title: 'Agree' } } },
        { agree: '2020-05-03' },
        { agree: altDate },
        'Agree, ',
      ],
      ['a root field', dateSchema, '2020-05-03', altDate, ''],
    ])('for %s', (_, schema, formData, uiSchema, namePrefix) => {
      test('names each of its selects with its own label, and shows the value it holds', () => {
        render(<Form schema={schema} uiSchema={uiSchema} initialFormData={formData} validator={validator} />);

        // Each select is a combobox named by its `aria-label`, whose contents are its value. Both are spelled out
        // rather than read back off the elements, which would pass for the wrong value as readily as the right one
        for (const [part, shown] of [
          ['year', '2020'],
          ['month', '05'],
          ['day', '03'],
        ]) {
          const select = screen.getByRole('combobox', { name: `${namePrefix}${part}` });
          expect(select).toHaveTextContent(shown);
          expect(select).toHaveAccessibleDescription('');
        }
      });
    });
  });

  // The dropdown button is a combobox, whose contents, the selected option, are its value rather than its name, so the
  // label names it and nothing describes it with the option again
  describe("a select widget's dropdown button", () => {
    const colorSchema = {
      type: 'object' as const,
      properties: { color: { type: 'string' as const, title: 'Color', enum: ['red', 'green'] } },
    };

    test('is a combobox named by the label, holding the option it displays as its value', () => {
      render(<Form schema={colorSchema} initialFormData={{ color: 'green' }} validator={validator} />);

      const dropdown = screen.getByRole('combobox', { name: 'Color' });
      expect(dropdown).toBe(screen.getByLabelText('Color'));
      expect(dropdown).toHaveTextContent('green');
      expect(dropdown).toHaveAccessibleDescription('');
    });

    test('is marked invalid while its errors show', () => {
      render(<Form schema={colorSchema} validator={validator} extraErrors={{ color: { __errors: ['Pick one'] } }} />);

      const dropdown = screen.getByRole('combobox', { name: 'Color' });
      expect(dropdown).toHaveAttribute('aria-invalid', 'true');
      expect(dropdown).toHaveAccessibleDescription('Pick one');
    });

    // The template's label names the field's own control through its `for`, and the selector through the
    // `aria-labelledby` its plan gives it
    test("is named by its field's label, holding the option it displays as its value", () => {
      render(
        <Form
          schema={{
            type: 'object',
            properties: {
              region: {
                title: 'Region',
                oneOf: [
                  { title: 'None', type: 'null' },
                  { title: 'Europe', type: 'string', enum: ['DE', 'FR'] },
                ],
              },
            },
          }}
          initialFormData={{ region: 'DE' }}
          validator={validator}
        />,
      );

      const selector = document.getElementById('root_region__oneof_select')!;
      expect(selector).toHaveAccessibleName('Region');
      expect(selector).toHaveTextContent('Europe');
    });

    test('is named by the heading of an object with properties beside its options', () => {
      render(
        <Form
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

      expect(document.getElementById('root__anyof_select')).toHaveAccessibleName('Pet');
    });

    // Naming the combobox by reference instead would point at an id only this theme's `FieldTemplate` renders, leaving
    // it unnamed under any other one
    test('is named by the label of a replacement FieldTemplate', () => {
      render(
        <Form
          schema={colorSchema}
          initialFormData={{ color: 'green' }}
          validator={validator}
          templates={{
            FieldTemplate: ({ id, label, children }) => (
              <div>
                <label htmlFor={id}>{label}</label>
                {children}
              </div>
            ),
          }}
        />,
      );

      expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent('green');
    });

    // Its own label already spells the key out, so referencing the key it displays would announce it twice
    test('keeps the name its own label gives it for an additionalProperties entry', () => {
      render(
        <Form
          schema={{
            type: 'object',
            additionalProperties: { type: 'string' },
            propertyNames: { enum: ['alpha', 'beta'] },
          }}
          initialFormData={{ alpha: 'a' }}
          validator={validator}
        />,
      );

      const keySelect = document.getElementById('root_alpha-key')!;
      expect(keySelect).toHaveAccessibleName('alpha Key');
      expect(keySelect).toHaveAccessibleDescription('');
    });
  });

  test("a date widget's trigger is a combobox named by the label, holding its selected value", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { birthday: { type: 'string', format: 'date', title: 'Birthday' } } }}
        initialFormData={{ birthday: '2020-05-03' }}
        validator={validator}
      />,
    );

    // The label reaches the trigger through `htmlFor`, and the date it holds is its value. It is spelled out rather than
    // read back off the element, which would pass for a wrong day as much as the right one
    const trigger = screen.getByRole('combobox', { name: 'Birthday' });
    expect(trigger).toBe(screen.getByLabelText('Birthday'));
    expect(trigger).toHaveTextContent('May 3, 2020');
    expect(trigger).toHaveAccessibleDescription('');
  });

  // A named property falls back to its name for the label, so only a root field and an array item can end up with none
  describe('a field with no title', () => {
    test('renders no label element at all', () => {
      const { container } = render(
        <Form schema={{ type: 'boolean' }} uiSchema={{ 'ui:widget': 'radio' }} validator={validator} />,
      );

      expect(fieldLabel(container, 'root')).toBeNull();
      expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-labelledby');
    });

    test('renders no label, and so no required asterisk, for an untitled required array item', () => {
      const { container } = render(
        <Form
          schema={{ type: 'array', items: { type: 'string' } }}
          initialFormData={['first']}
          validator={validator}
        />,
      );

      expect(fieldLabel(container, 'root_0')).toBeNull();
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  // An empty `title` falls through to the property name, so the field still has a label for its controls to be named by
  describe("a field whose title is ''", () => {
    test('names a group of controls with the label the template renders from the property name', () => {
      render(
        <Form
          schema={{ type: 'object', properties: { agree: { type: 'boolean', title: '' } } }}
          uiSchema={{ agree: { 'ui:widget': 'radio' } }}
          validator={validator}
        />,
      );

      expect(screen.getByRole('radiogroup')).toHaveAccessibleName('agree');
    });

    test("names a date widget's trigger by the label, holding the date it displays", () => {
      render(
        <Form
          schema={{ type: 'object', properties: { when: { type: 'string', format: 'date', title: '' } } }}
          initialFormData={{ when: '2020-05-03' }}
          validator={validator}
        />,
      );

      expect(screen.getByRole('combobox', { name: 'when' })).toHaveTextContent('May 3, 2020');
    });
  });

  // `ui:classNames` and `ui:style` are applied once, to the same element, the way `@rjsf/core` applies them: this
  // template delegates both to its wrapper, so a border or padding declared in them is drawn once
  describe('ui:classNames and ui:style', () => {
    // The root object is itself a field, so its own wrapper and `.field-template` are in the container too: the
    // field under test is reached through the `ui:classNames` only it carries
    function agreeElements(container: HTMLElement) {
      const wrapper = container.querySelector('.custom-class');
      return { wrapper, innerDiv: wrapper?.querySelector('.field-template') };
    }

    test('applies both to the wrapper, and neither to the inner field div', () => {
      const { container } = renderForm({
        agree: { 'ui:classNames': 'custom-class', 'ui:style': { color: 'red' } },
      });

      const { wrapper, innerDiv } = agreeElements(container);
      // The inline attribute rather than `toHaveStyle`, which reads the computed style: `color` is inherited, so the
      // inner div reports the wrapper's red whichever element actually declares it
      expect(wrapper?.getAttribute('style')).toBe('color: red;');
      expect(innerDiv).not.toHaveAttribute('style');
      // On the wrapper and nowhere else, so a class declaring a box does not nest one inside another
      expect(container.querySelectorAll('.custom-class')).toHaveLength(1);
    });

    // `ui:options.daisy` is this theme's own per-field theming of the inner div, a separate thing from `ui:style`
    test('leaves the ui:options.daisy styling on the inner field div', () => {
      const { container } = renderForm({
        agree: { 'ui:classNames': 'custom-class', 'ui:options': { daisy: { style: { color: 'blue' } } } },
      });

      const { wrapper, innerDiv } = agreeElements(container);
      expect(innerDiv?.getAttribute('style')).toBe('color: blue;');
      expect(wrapper).not.toHaveAttribute('style');
    });

    test("takes a ui:globalOptions daisy where the field's ui:options set none", () => {
      const globalUiSchema: DaisyUiSchema = { 'ui:globalOptions': { daisy: { style: { color: 'green' } } } };
      const { container: globalContainer } = renderForm({
        ...globalUiSchema,
        agree: { 'ui:classNames': 'custom-class' },
      });
      const { container: ownContainer } = renderForm({
        ...globalUiSchema,
        agree: { 'ui:classNames': 'custom-class', 'ui:options': { daisy: { style: { color: 'blue' } } } },
      });
      // As `getUiOptions()` layers them: a `daisy` key the field sets, even to `undefined`, shadows the global one
      const { container: clearedContainer } = renderForm({
        ...globalUiSchema,
        agree: { 'ui:classNames': 'custom-class', 'ui:options': { daisy: undefined } },
      });

      expect(agreeElements(globalContainer).innerDiv?.getAttribute('style')).toBe('color: green;');
      expect(agreeElements(ownContainer).innerDiv?.getAttribute('style')).toBe('color: blue;');
      expect(agreeElements(clearedContainer).innerDiv).not.toHaveAttribute('style');
    });
  });

  test('renders only the children for a hidden field', () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { name: { type: 'string', title: 'Name' } } }}
        uiSchema={{ name: { 'ui:widget': 'hidden' } }}
        validator={validator}
      />,
    );

    expect(screen.queryByText('Name')).not.toBeInTheDocument();
    expect(container.querySelector('input[type="hidden"]')).toBeInTheDocument();
  });
});

describe('FieldTemplate rendered without a plan, as outside SchemaField', () => {
  function renderTemplate(displayLabel: boolean) {
    const registry = getTestRegistry({}, {}, generateTemplates());
    return render(
      <DaisyFieldTemplate
        id='root_foo'
        fieldPath={toFieldPath('foo')}
        label='Foo'
        keyName='foo'
        description={<span id='root_foo__description'>About foo</span>}
        rawDescription='About foo'
        // oxlint-disable-next-line typescript/no-deprecated -- a template rendered without a plan reads the deprecated prop
        displayLabel={displayLabel}
        schema={{ type: 'string' }}
        registry={registry}
        readonly={false}
        disabled={false}
        required={false}
        onChange={vi.fn()}
        onKeyRename={vi.fn()}
        onKeyRenameBlur={vi.fn()}
        onRemoveProperty={vi.fn()}
      >
        <input id='root_foo' />
      </DaisyFieldTemplate>,
    );
  }

  it('draws the description where displayLabel lets it draw the label', () => {
    const { container } = renderTemplate(true);
    expect(container.querySelector('#root_foo__description')).toHaveTextContent('About foo');
  });

  it('draws no description where displayLabel turns the label off', () => {
    const { container } = renderTemplate(false);
    expect(container.querySelector('#root_foo__description')).toBeNull();
  });
});
