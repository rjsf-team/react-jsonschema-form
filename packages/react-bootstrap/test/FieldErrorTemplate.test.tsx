import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import FieldErrorTemplate from '../src/FieldErrorTemplate/index.ts';

describe('FieldErrorTemplate', () => {
  // A control is described by the id only while the errors show, so the element must exist then and only then
  it.each([
    ['no errors', [], 0],
    ['errors', ['too short', 'not a number'], 1],
  ])('renders the error id on one element only while there are errors, given %s', (_, errors, count) => {
    const { container } = render(
      <FieldErrorTemplate errors={errors} id='root' schema={{}} registry={getTestRegistry({})} />,
    );

    expect(container.querySelectorAll('#root__error')).toHaveLength(count);
    expect(container.querySelectorAll('[id]')).toHaveLength(count);
  });
});
