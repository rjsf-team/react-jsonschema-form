import { getTestRegistry } from '@rjsf/core/testing';
import type { FieldErrorProps } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';

import FieldErrorTemplate from '../src/templates/FieldErrorTemplate/index.ts';

function renderErrors(errors: FieldErrorProps['errors']) {
  const schema = { type: 'string' as const };
  return render(
    <FieldErrorTemplate id='root_color' errors={errors} schema={schema} registry={getTestRegistry(schema)} />,
  );
}

describe('FieldErrorTemplate', () => {
  test('puts the id every widget is described by on the one element holding its messages', () => {
    const { container } = renderErrors(['Too short', 'Too dull']);

    expect(container.querySelectorAll(`#${errorId('root_color')}`)).toHaveLength(1);
    expect(container.querySelector(`#${errorId('root_color')}`)).toContainElement(screen.getByRole('list'));
  });

  test('renders nothing for messages that are all empty, which is no error to point at', () => {
    const { container } = renderErrors(['']);

    expect(container).toBeEmptyDOMElement();
  });

  test('draws no bullet for an empty message', () => {
    renderErrors(['', 'Too short']);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
