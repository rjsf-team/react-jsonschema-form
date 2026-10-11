import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

describe('RadioWidget', () => {
  it.each(['ui:disabled', 'ui:readonly'] as const)('disables every option of a %s field', (uiOption) => {
    render(
      <Form
        schema={{ type: 'string', enum: ['foo', 'bar'] }}
        uiSchema={{ 'ui:widget': 'radio', [uiOption]: true }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radio', { name: 'foo' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'bar' })).toBeDisabled();
  });
});
