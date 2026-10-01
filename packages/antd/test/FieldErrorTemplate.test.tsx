import type { ReactElement } from 'react';
import { createElement } from 'react';
import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import FieldErrorTemplate from '../src/templates/FieldErrorTemplate/index.tsx';

describe('FieldErrorTemplate', () => {
  it('gives string and element errors keys that never collide', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    // The unkeyed element sits at index 1, the same position the string `'1'` and the element keyed `'1'` spell
    const errors = [
      '1',
      createElement('span', null, 'y'),
      <span key='1'>z</span>,
      <span key='required'>x</span>,
      'required',
      'required',
    ];
    const { container } = render(
      <FieldErrorTemplate errors={errors} id='root' schema={{}} registry={getTestRegistry({})} />,
    );

    expect(container.querySelectorAll('#root__error > div')).toHaveLength(errors.length);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('renders errors that are neither a string nor an element, as untyped error data can hold', () => {
    // `extraErrors` parsed from a server response isn't checked against the `string | ReactElement` type
    const errors: (string | ReactElement)[] = JSON.parse('["a", null, 3]');
    const { container } = render(
      <FieldErrorTemplate errors={errors} id='root' schema={{}} registry={getTestRegistry({})} />,
    );

    expect(container.querySelectorAll('#root__error > div')).toHaveLength(errors.length);
  });
});
