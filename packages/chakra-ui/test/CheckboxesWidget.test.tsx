import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from './WrappedForm.tsx';

const user = userEvent.setup();

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

  // The surrounding `FieldTemplate` marks its own fieldset invalid from the same errors, so these assert on the
  // checkboxes themselves; anything broader passes whatever the widget does with its `invalid` flag
  const invalidCheckboxes = (container: HTMLElement) =>
    container.querySelectorAll('input[type="checkbox"][aria-invalid="true"]');

  it('is not invalid before validation has found anything wrong', () => {
    const { container } = renderForm(false);

    expect(invalidCheckboxes(container)).toHaveLength(0);
  });

  it('is invalid once the field has errors', async () => {
    const { container } = renderForm(false);
    await user.click(container.querySelector('[type="submit"]')!);

    expect(invalidCheckboxes(container)).toHaveLength(2);
  });

  it('is not invalid when ui:hideError hides those errors', async () => {
    const { container } = renderForm(true);
    await user.click(container.querySelector('[type="submit"]')!);

    expect(invalidCheckboxes(container)).toHaveLength(0);
  });
});
