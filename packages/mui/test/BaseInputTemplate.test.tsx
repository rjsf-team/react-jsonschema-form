import { getTestRegistry } from '@rjsf/core/testing';
import { callerInputPropsTests } from '@rjsf/snapshot-tests';
import { render, screen } from '@testing-library/react';

import BaseInputTemplate from '../src/BaseInputTemplate/index.ts';
import Form from '../src/index.ts';

describe('BaseInputTemplate', () => {
  test('puts a pattern and an accept passed as props on the input, not the root', () => {
    const { container } = render(
      <BaseInputTemplate
        id='root'
        name='root'
        pattern='[0-9]+'
        accept='.png'
        value=''
        readonly={false}
        disabled={false}
        required={false}
        label='Label'
        schema={{ type: 'string' }}
        options={{}}
        onChange={() => {}}
        onBlur={() => {}}
        onFocus={() => {}}
        registry={getTestRegistry({})}
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '[0-9]+');
    expect(input).toHaveAttribute('accept', '.png');
    expect(container.querySelector('.MuiTextField-root')).not.toHaveAttribute('pattern');
  });

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

callerInputPropsTests(Form);
