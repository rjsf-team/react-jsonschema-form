import type { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

/** The label `FieldTemplate` renders above the control, which is the only one carrying `titleId()` — a widget's own
 * label (`CheckboxWidget`) and `BaseInputTemplate`'s hidden one both also use the `label` class
 */
function templateLabelFor(container: HTMLElement, id: string) {
  return container.querySelector(`label[id="${id}__title"]`);
}

const agree: RJSFSchema = { type: 'boolean', title: 'Agree' };

function CustomWidget({ id, value }: WidgetProps) {
  return <input type='text' id={id} readOnly value={String(value ?? '')} />;
}

function renderForm(uiSchema: UiSchema = {}, fieldSchema: RJSFSchema = agree) {
  const schema: RJSFSchema = { type: 'object', properties: { agree: fieldSchema } };
  const { container } = render(
    <Form schema={schema} uiSchema={uiSchema} validator={validator} widgets={{ custom: CustomWidget }} />,
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

    test('claims no aria-labelledby when the label is hidden, so the reference cannot dangle', () => {
      renderForm({ agree: { 'ui:widget': 'radio', 'ui:options': { label: false } } });

      const group = screen.getByRole('radiogroup');
      expect(group).not.toHaveAttribute('aria-labelledby');
      expect(group).toHaveAccessibleName('');
    });
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
