import { getTestRegistry } from '@rjsf/core/testing';
import type { FieldErrorProps } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';

import FieldErrorTemplate from '../src/templates/FieldErrorTemplate/index.ts';

function renderErrors(errors: FieldErrorProps['errors']) {
  const schema = { type: 'string' as const };
  render(<FieldErrorTemplate id='root_color' errors={errors} schema={schema} registry={getTestRegistry(schema)} />);
  return screen.getByRole('list');
}

describe('FieldErrorTemplate', () => {
  test('gives its list the id every widget is described by', () => {
    expect(renderErrors(['Too short'])).toHaveAttribute('id', errorId('root_color'));
  });

  test('leaves the id off a list holding only empty messages, which is no error to point at', () => {
    expect(renderErrors([''])).not.toHaveAttribute('id');
  });

  test('draws no bullet for an empty message', () => {
    renderErrors(['', 'Too short']);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
