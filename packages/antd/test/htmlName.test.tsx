import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { bracketNameGenerator } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

describe('a field given a nameGenerator', () => {
  it.each<[string, RJSFSchema, UiSchema]>([
    ['password', { type: 'string' }, { 'ui:widget': 'password' }],
    ['date', { type: 'string', format: 'date' }, {}],
    ['date-time', { type: 'string', format: 'date-time' }, {}],
  ])('names its %s input by the generated name', (_, x, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x } }}
        uiSchema={{ x: uiSchema }}
        validator={validator}
        nameGenerator={bracketNameGenerator}
      />,
    );

    expect(container.querySelector('#root_x')).toHaveAttribute('name', 'root[x]');
  });
});
