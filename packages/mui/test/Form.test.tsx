import { withTheme } from '@rjsf/core';
import { formTests } from '@rjsf/snapshot-tests';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form, { Theme } from '../src/index.ts';

formTests(Form);

describe('typed form data', () => {
  interface Data {
    name?: string;
  }
  const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

  it('the default Form infers the form data type from formData', () => {
    const seen: Data[] = [];
    const { container } = render(
      <Form
        schema={schema}
        validator={validator}
        formData={{ name: 'a' }}
        onChange={({ formData }) => seen.push(formData ?? {})}
      />,
    );
    expect(container.querySelector<HTMLInputElement>('#root_name')?.value).toBe('a');
  });

  it('the default Theme serves a typed withTheme() form', () => {
    const TypedForm = withTheme<Data>(Theme);
    const { container } = render(<TypedForm schema={schema} validator={validator} formData={{ name: 'b' }} />);
    expect(container.querySelector<HTMLInputElement>('#root_name')?.value).toBe('b');
  });
});
