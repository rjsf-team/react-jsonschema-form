import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

const describedValue: RJSFSchema = {
  type: 'object',
  additionalProperties: { type: 'string', description: 'About the value' },
};

describe('WrapIfAdditionalTemplate', () => {
  // The key column copies the value column's heights, so a class map that restyles the value's label or description
  // restyles the key's label and the hidden copy alike
  test("takes the key's label and the description's hidden copy from the class map", () => {
    const { container } = render(
      <Form
        schema={describedValue}
        initialFormData={{ foo: 'x' }}
        classMap={{ fieldLabel: 'text-lg', fieldDescription: 'text-base' }}
        validator={validator}
      />,
    );

    expect(container.querySelector('label[for="root_foo__key"]')).toHaveClass(
      'rjsf-field-label',
      'text-lg',
      'text-muted-foreground',
    );
    const copy = container.querySelector('[aria-hidden="true"].invisible');
    expect(copy).toHaveClass('rjsf-field-description', 'text-base');
    expect(copy).toHaveTextContent('About the value');
  });

  test("marks a forbidden key's label data-invalid with its input", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', patternProperties: { '^abc': { type: 'string' } }, additionalProperties: false }}
        initialFormData={{ a: 'forbidden' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'a Key' })).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('label[for="root_a__key"]')).toHaveAttribute('data-invalid', 'true');
  });

  // The object's `required` names the key, so renaming it would leave a required property missing
  test("marks a required key's label as core marks the value's", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', required: ['foo'], additionalProperties: { type: 'string' } }}
        initialFormData={{ foo: 'x', bar: 'y' }}
        validator={validator}
      />,
    );

    expect(container.querySelector('label[for="root_foo__key"]')).toHaveTextContent('foo Key*');
    expect(container.querySelector('label[for="root_foo__key"] .rjsf-required')).toBeInTheDocument();
    expect(container.querySelector('label[for="root_bar__key"] .rjsf-required')).not.toBeInTheDocument();
  });
});
