import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render } from '@testing-library/react';

import Form from './WrappedForm.tsx';

describe('CheckboxesWidget invalid state', () => {
  const schema: RJSFSchema = {
    type: 'object',
    required: ['picks'],
    properties: {
      picks: { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true, minItems: 2 },
    },
  };

  function renderForm(hideError: boolean) {
    return render(
      <Form
        schema={schema}
        uiSchema={{ picks: { 'ui:widget': 'checkboxes', ...(hideError ? { 'ui:hideError': true } : {}) } }}
        formData={{ picks: [] }}
        validator={validator}
      />,
    );
  }

  it('is not invalid before validation has found anything wrong', () => {
    const { container } = renderForm(false);

    expect(container.querySelectorAll('[data-invalid]')).toHaveLength(0);
  });

  it('is invalid once the field has errors', () => {
    const { container } = renderForm(false);
    fireEvent.submit(container.querySelector('form')!);

    expect(container.querySelectorAll('[data-invalid]').length).toBeGreaterThan(0);
  });

  it('is not invalid when ui:hideError hides those errors', () => {
    const { container } = renderForm(true);
    fireEvent.submit(container.querySelector('form')!);

    expect(container.querySelectorAll('[data-invalid]')).toHaveLength(0);
  });
});
