import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

const schema = {
  type: 'object' as const,
  properties: { flag: { type: 'boolean' as const, title: 'Flag', description: 'About' } },
};

describe('CheckboxWidget', () => {
  // The field's own state, as core's `CheckboxWidget` marks the label and description it draws
  test('marks its label and description data-invalid while the field shows errors, and not otherwise', () => {
    const { container, rerender } = render(
      <Form schema={schema} extraErrors={{ flag: { __errors: ['wrong'] } }} validator={validator} />,
    );
    expect(container.querySelector('#root_flag__description')).toHaveAttribute('data-invalid', 'true');
    expect(container.querySelector('label[for="root_flag"]')).toHaveAttribute('data-invalid', 'true');

    rerender(<Form schema={schema} validator={validator} />);
    expect(container.querySelector('#root_flag__description')).not.toHaveAttribute('data-invalid');
    expect(container.querySelector('label[for="root_flag"]')).not.toHaveAttribute('data-invalid');
  });
});
