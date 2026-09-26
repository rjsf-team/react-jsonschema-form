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
      const { templateLabel } = renderForm({ agree: { 'ui:widget': 'checkbox' } }, {
        type: ['boolean', 'null'],
        title: 'Agree',
      } as RJSFSchema);

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

    // `BooleanField` reports `hideLabel` from `ui:options.label` while the template's `displayLabel` comes from
    // `getDisplayLabel()`, which suppresses a boolean's label unless the `ui:widget` key itself is set. The two
    // therefore disagree for this spelling, and the group would be left pointing at a label that was never rendered
    test('still has a name when the widget is set through ui:options.widget', () => {
      renderForm({ agree: { 'ui:options': { widget: 'radio' } } });

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
        { agree: { 'ui:widget': 'radio' }, 'ui:options': { deprecatedHandling: 'label' } },
        { ...agree, deprecated: true },
      );

      expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Agree (deprecated)');
    });
  });

  describe('the alt-date widget', () => {
    test('associates each of its labels with the control it names', () => {
      renderForm(
        { agree: { 'ui:widget': 'alt-date', 'ui:options': { yearsRange: [2020, 2024] } } },
        { type: 'string', format: 'date', title: 'Agree' },
      );

      // daisyui's SelectWidget opens from a real `button`, which `label htmlFor` can associate with
      for (const type of ['year', 'month', 'day']) {
        expect(screen.getByLabelText(type)).toBe(screen.getByRole('button', { name: type }));
      }
    });

    test('names the whole group with the field label', () => {
      renderForm(
        { agree: { 'ui:widget': 'alt-date', 'ui:options': { yearsRange: [2020, 2024] } } },
        { type: 'string', format: 'date', title: 'Agree' },
      );

      expect(screen.getByRole('group', { name: 'Agree' })).toBeInTheDocument();
    });
  });

  test("a date widget's trigger is named by the label and its own selected value", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { birthday: { type: 'string', format: 'date', title: 'Birthday' } } }}
        formData={{ birthday: '2020-05-03' }}
        validator={validator}
      />,
    );

    // The trigger's contents are the selected date, so naming it from the label alone would drop the value. The date
    // is spelled out rather than read back off the element, which would pass for a wrong day as much as the right one
    expect(screen.getByRole('button', { name: /Birthday/ })).toHaveAccessibleName('Birthday May 3, 2020');
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
