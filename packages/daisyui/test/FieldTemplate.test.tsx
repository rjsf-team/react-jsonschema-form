import type { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

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
    /** The label the `FieldTemplate` itself renders above the input, as opposed to one a widget renders */
    templateLabel: () => container.querySelector('label[for="root_agree"]'),
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
