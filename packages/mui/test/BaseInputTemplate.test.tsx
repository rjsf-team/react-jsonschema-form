import { getTestRegistry } from '@rjsf/core/testing';
import { render, screen } from '@testing-library/react';

import BaseInputTemplate from '../src/BaseInputTemplate/index.ts';

describe('BaseInputTemplate', () => {
  test('shows nothing for an object value', () => {
    render(
      <BaseInputTemplate
        id='root'
        name='root'
        label='Name'
        schema={{ type: 'string' }}
        uiSchema={{}}
        options={{}}
        value={{ a: 1 }}
        required={false}
        disabled={false}
        readonly={false}
        autofocus={false}
        onChange={() => undefined}
        onBlur={() => undefined}
        onFocus={() => undefined}
        registry={getTestRegistry({ type: 'string' })}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
