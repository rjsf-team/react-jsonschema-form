import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import '@testing-library/jest-dom';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render } from '@testing-library/react';

import Form from '../src/index.ts';

describe('ui:hideError', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      marketType: { type: 'string', enum: ['secondary', 'primary'] },
    },
    dependencies: {
      marketType: {
        oneOf: [
          { properties: { marketType: { enum: ['secondary'] } } },
          {
            properties: {
              marketType: { enum: ['primary'] },
              comissioning: { type: 'string', pattern: '^[0-9]{4}$' },
            },
            required: ['comissioning'],
          },
        ],
      },
    },
  };
  const uiSchema: UiSchema = { 'ui:hideError': true };
  const formData = { marketType: 'primary' };

  it('does not put the select into the Mui error state', () => {
    const { container } = render(
      <Form schema={schema} uiSchema={uiSchema} formData={formData} validator={validator} />,
    );
    fireEvent.submit(container.querySelector('form')!);

    expect(container.querySelectorAll('.Mui-error')).toHaveLength(0);
  });

  it('does not put a multi-select array into the Mui error state', () => {
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
    fireEvent.submit(container.querySelector('form')!);

    expect(container.querySelectorAll('.Mui-error')).toHaveLength(0);
  });

  it('does not put a files array into the Mui error state', () => {
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
    fireEvent.submit(container.querySelector('form')!);

    expect(container.querySelectorAll('.Mui-error')).toHaveLength(0);
  });

  it('does not put the text input into the Mui error state', () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'string', minLength: 10 } } }}
        uiSchema={{ 'ui:hideError': true }}
        formData={{ foo: 'a' }}
        validator={validator}
      />,
    );
    fireEvent.submit(container.querySelector('form')!);

    expect(container.querySelectorAll('.Mui-error')).toHaveLength(0);
  });
});
