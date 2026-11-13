import { altDateTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

altDateTests(Form);

describe('AltDateWidget', () => {
  test("lays core's parts out in a row, with the theme's outline buttons", () => {
    const { container } = render(
      <Form
        schema={{ type: 'string', format: 'date' }}
        uiSchema={{ 'ui:widget': 'alt-date', 'ui:options': { yearsRange: [2020, 2021] } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.rjsf-alt-date-list')).toHaveClass('flex', 'flex-wrap');
    expect(screen.getByRole('button', { name: 'Now' })).toHaveClass('border', 'h-8');
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveClass('border', 'h-8');
  });
});
