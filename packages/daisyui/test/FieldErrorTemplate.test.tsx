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

  test('renders nothing where it is handed no errors', () => {
    const { container } = renderErrors([]);

    expect(container).toBeEmptyDOMElement();
  });

  test('keeps the id for messages that are all empty, since the plan counts them and describes the control by it', () => {
    const { container } = renderErrors(['']);

    expect(container.querySelector(`#${errorId('root_color')}`)).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  test('draws no bullet for an empty message', () => {
    renderErrors(['', 'Too short']);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
