import type { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';
import DaisyCheckboxWidget from '../src/widgets/CheckboxWidget/CheckboxWidget.tsx';

/** The label `FieldTemplate` renders above the control. It is the only one pointing at the field's own id: a widget's
 * own label (`CheckboxWidget`, `ToggleWidget`) has no `htmlFor`, and `AltDateWidget`'s point at their sub-controls
 */
function templateLabelFor(container: HTMLElement, id: string) {
  return container.querySelector(`label[for="${id}"]`);
}

const agree: RJSFSchema = { type: 'boolean', title: 'Agree' };

function CustomWidget({ id, value }: WidgetProps) {
  return <input type='text' id={id} readOnly value={String(value ?? '')} />;
}

function renderForm(uiSchema: UiSchema = {}, fieldSchema: RJSFSchema = agree, widgets = {}) {
  const schema: RJSFSchema = { type: 'object', properties: { agree: fieldSchema } };
  const { container } = render(
    <Form schema={schema} uiSchema={uiSchema} validator={validator} widgets={{ custom: CustomWidget, ...widgets }} />,
  );
  return {
    container,
    templateLabel: () => templateLabelFor(container, 'root_agree'),
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
      expect(screen.getByLabelText('Agree')).toBe(screen.getByRole('button', { name: /Agree/ }));
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

    test('claims no name of its own when the label is hidden', () => {
      renderForm({ agree: { 'ui:widget': 'radio', 'ui:options': { label: false } } });

      const group = screen.getByRole('radiogroup');
      expect(group).not.toHaveAttribute('aria-labelledby');
      expect(group).toHaveAccessibleName('');
    });
  });

  // A group is named by pointing at the label element, so its accessible name is whatever the label displays. The
  // `label` a widget is handed is computed separately and differs from the template's in both cases below
  describe('naming a group from the label the user can see', () => {
    test('uses the key, not the schema title, for an additionalProperties entry', () => {
      const { container } = render(
        <Form
          schema={{ type: 'object', additionalProperties: { type: 'string', title: 'Extra', enum: ['a', 'b'] } }}
          uiSchema={{ additionalProperties: { 'ui:widget': 'radio' } }}
          formData={{ foo: 'a' }}
          validator={validator}
        />,
      );

      expect(templateLabelFor(container, 'root_foo')).toHaveTextContent('foo');
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

      // daisyui's SelectWidget opens from a real `button`, which `label htmlFor` can associate with
      for (const type of ['year', 'month', 'day']) {
        expect(screen.getByLabelText(type)).toBe(screen.getByRole('button', { name: type }));
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
      ],
      ['a root field', dateSchema, '2020-05-03', altDate],
    ])('for %s', (_, schema, formData, uiSchema) => {
      test('names each of its selects with its own label, and describes it with the value it shows', () => {
        render(<Form schema={schema} uiSchema={uiSchema} formData={formData} validator={validator} />);

        // Each label reaches its own select through `htmlFor`, replacing the contents that display the value, so the
        // value is exposed as the description instead. Both are spelled out rather than read back off the elements,
        // which would pass for the wrong value as readily as the right one
        for (const [part, shown] of [
          ['year', '2020'],
          ['month', '05'],
          ['day', '03'],
        ]) {
          expect(screen.getByRole('button', { name: part })).toHaveAccessibleDescription(shown);
        }
      });
    });
  });

  // The dropdown button carries the selected option as its contents, which the label naming it from outside replaces,
  // so the option is exposed as its description instead — the same split the picker triggers make
  describe("a select widget's dropdown button", () => {
    const colorSchema = {
      type: 'object' as const,
      properties: { color: { type: 'string' as const, title: 'Color', enum: ['red', 'green'] } },
    };

    test('is named by the label, and describes itself with the option it displays', () => {
      render(<Form schema={colorSchema} formData={{ color: 'green' }} validator={validator} />);

      const dropdown = screen.getByRole('button', { name: 'Color' });
      expect(dropdown).toBe(screen.getByLabelText('Color'));
      expect(dropdown).toHaveAccessibleDescription('green');
    });

    test('describes itself with nothing while it displays no option', () => {
      render(<Form schema={colorSchema} validator={validator} />);

      // The contents it falls back to are the label itself, so referencing them would announce the label twice
      expect(screen.getByRole('button', { name: 'Color' })).toHaveAccessibleDescription('');
    });

    // The template labels the field's own control, not this selector, so nothing outside the button names it and its
    // contents are its whole name — the value it displays is announced twice, which is the cost of a predicate that
    // can only answer from the label the widget was handed
    test('is named by its own contents where no label points at it', () => {
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
          formData={{ region: 'DE' }}
          validator={validator}
        />,
      );

      const selector = document.getElementById('root_region__oneof_select')!;
      expect(screen.queryByLabelText('Region')).not.toBe(selector);
      // The dropdown arrow is decoration, and hidden, so the name it falls back to is the option alone
      expect(selector).toHaveAccessibleName('Europe');
      expect(selector).toHaveAccessibleDescription('Europe');
    });

    // Naming the button by reference instead would point at an id only this theme's `FieldTemplate` renders, leaving
    // it named by the option it displays and the field's own label dropped under any other one
    test('is named by the label of a replacement FieldTemplate', () => {
      render(
        <Form
          schema={colorSchema}
          formData={{ color: 'green' }}
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

      expect(screen.getByRole('button', { name: 'Color' })).toHaveAccessibleDescription('green');
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
          formData={{ alpha: 'a' }}
          validator={validator}
        />,
      );

      const keySelect = document.getElementById('root_alpha-key')!;
      expect(keySelect).toHaveAccessibleName('alpha Key');
      expect(keySelect).toHaveAccessibleDescription('');
    });
  });

  test("a date widget's trigger is named by the label, and describes its own selected value", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { birthday: { type: 'string', format: 'date', title: 'Birthday' } } }}
        formData={{ birthday: '2020-05-03' }}
        validator={validator}
      />,
    );

    // The label reaches the trigger through `htmlFor`, which replaces the trigger's own contents as its name, so the
    // date is exposed as its description instead. It is spelled out rather than read back off the element, which would
    // pass for a wrong day as much as the right one
    const trigger = screen.getByRole('button', { name: 'Birthday' });
    expect(trigger).toBe(screen.getByLabelText('Birthday'));
    expect(trigger).toHaveAccessibleDescription('May 3, 2020');
  });

  // A named property falls back to its name for the label, so only a root field and an array item can end up with none
  describe('a field with no title', () => {
    test('renders no label element at all', () => {
      const { container } = render(
        <Form schema={{ type: 'boolean' }} uiSchema={{ 'ui:widget': 'radio' }} validator={validator} />,
      );

      expect(templateLabelFor(container, 'root')).toBeNull();
      expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-labelledby');
    });

    test('renders no label, and so no required asterisk, for an untitled required array item', () => {
      const { container } = render(
        <Form schema={{ type: 'array', items: { type: 'string' } }} formData={['first']} validator={validator} />,
      );

      expect(templateLabelFor(container, 'root_0')).toBeNull();
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  // `SchemaField` falls back to the property name for the label it hands the template, so the template renders one,
  // while the `label` a widget is handed keeps the empty `title` it was given
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

    test("describes a date widget's trigger with the date it displays", () => {
      render(
        <Form
          schema={{ type: 'object', properties: { when: { type: 'string', format: 'date', title: '' } } }}
          formData={{ when: '2020-05-03' }}
          validator={validator}
        />,
      );

      expect(screen.getByRole('button', { name: 'when' })).toHaveAccessibleDescription('May 3, 2020');
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
