import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

const describedValue: RJSFSchema = {
  type: 'object',
  additionalProperties: { type: 'string', description: 'About the value' },
};

describe('WrapIfAdditionalTemplate', () => {
  // The key's label shares the value's row, so a class map that restyles the value's label restyles the key's alike
  test("takes the key's label from the class map", () => {
    const { container } = render(
      <Form
        schema={describedValue}
        initialFormData={{ foo: 'x' }}
        classMap={{ fieldLabel: 'text-lg text-blue-700' }}
        validator={validator}
      />,
    );

    // The theme's muted colour comes first, so a colour the class map gives wins it, as on the value's label
    expect(container.querySelector('label[for="root_foo__key"]')).toHaveClass(
      'rjsf-field-label',
      'text-lg',
      'text-blue-700',
    );
    expect(container.querySelector('label[for="root_foo__key"]')).not.toHaveClass('text-muted-foreground');
  });

  // The rows line the key's input up with the value's, so the description is drawn in the value column alone
  test("draws the value's description once, through the form's DescriptionFieldTemplate", () => {
    const { container } = render(
      <Form
        schema={describedValue}
        initialFormData={{ foo: 'x' }}
        templates={{ DescriptionFieldTemplate: ({ id, description }) => <p id={id}>{description}</p> }}
        validator={validator}
      />,
    );

    expect(screen.getByText('About the value')).toHaveAttribute('id', 'root_foo__description');
    expect(container.querySelector('.rjsf-additional-property-value > p#root_foo__description')).toBeInTheDocument();
  });

  // As core's wrapper does, so a `data-invalid:` variant in `ui:classNames` reaches it
  test("marks a field's wrapper and an extra key's row data-invalid while they show errors, and no other", () => {
    const { container } = render(
      <Form<Record<string, string>>
        schema={{
          type: 'object',
          properties: { bad: { type: 'string', title: 'Bad' }, good: { type: 'string', title: 'Good' } },
          additionalProperties: { type: 'string' },
        }}
        initialFormData={{ extra: 'x', fine: 'y' }}
        extraErrors={{ bad: { __errors: ['wrong'] }, extra: { __errors: ['wrong'] } }}
        validator={validator}
      />,
    );
    const wrapper = (id: string) => container.querySelector(`#${id}`)?.closest('.rjsf-field');

    expect(wrapper('root_bad')).toHaveAttribute('data-invalid', 'true');
    expect(wrapper('root_extra')).toHaveAttribute('data-invalid', 'true');
    expect(wrapper('root_good')).not.toHaveAttribute('data-invalid');
    expect(wrapper('root_fine')).not.toHaveAttribute('data-invalid');
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
