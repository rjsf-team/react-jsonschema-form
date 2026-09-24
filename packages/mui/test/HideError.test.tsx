import type { FormValidation, RJSFSchema, UiSchema } from '@rjsf/utils';
import '@testing-library/jest-dom';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

async function submit(container: HTMLElement) {
  await user.click(container.querySelector('button[type="submit"]')!);
}

describe('ui:hideError', () => {
  const oneOfSchema: RJSFSchema = {
    type: 'object',
    properties: { userId: { oneOf: [{ type: 'number' }, { type: 'string' }] } },
  };
  function addUserIdError(_: any, errors: FormValidation) {
    errors.userId?.addError('test');
    return errors;
  }

  async function renderOneOf(uiSchema: UiSchema) {
    const { container } = render(
      <Form
        schema={oneOfSchema}
        uiSchema={uiSchema}
        formData={{ userId: 1 }}
        customValidate={addUserIdError}
        validator={validator}
      />,
    );
    await submit(container);
    return container;
  }

  it('puts the oneOf selector into the Mui error state when its errors are shown', async () => {
    const container = await renderOneOf({});

    expect(container.querySelector('input[name="root_userId__oneof_select"]')?.closest('.Mui-error')).not.toBeNull();
  });

  it('does not put the oneOf selector or the option it renders into the Mui error state', async () => {
    const container = await renderOneOf({ 'ui:hideError': true });

    expect(container.querySelectorAll('.Mui-error')).toHaveLength(0);
  });

  it('does not put a multi-select array into the Mui error state', async () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            picks: { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true, minItems: 3 },
          },
        }}
        uiSchema={{ 'ui:hideError': true }}
        formData={{ picks: ['a'] }}
        validator={validator}
      />,
    );
    await submit(container);

    expect(container.querySelectorAll('.Mui-error')).toHaveLength(0);
  });

  it('does not put a files array into the Mui error state', async () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            uploads: { type: 'array', items: { type: 'string', format: 'data-url' }, minItems: 2 },
          },
        }}
        uiSchema={{ 'ui:hideError': true }}
        formData={{ uploads: [] }}
        validator={validator}
      />,
    );
    await submit(container);

    expect(container.querySelectorAll('.Mui-error')).toHaveLength(0);
  });

  it('puts the text input into the Mui error state when its errors are shown', async () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'string', minLength: 10 } } }}
        formData={{ foo: 'a' }}
        validator={validator}
      />,
    );
    await submit(container);

    expect(container.querySelector('input#root_foo')?.closest('.Mui-error')).not.toBeNull();
  });

  it('does not put the text input into the Mui error state', async () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'string', minLength: 10 } } }}
        uiSchema={{ 'ui:hideError': true }}
        formData={{ foo: 'a' }}
        validator={validator}
      />,
    );
    await submit(container);

    expect(container.querySelectorAll('.Mui-error')).toHaveLength(0);
  });
});
