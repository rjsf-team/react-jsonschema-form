import { createElement } from 'react';
import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import FieldErrorTemplate from '../src/templates/FieldErrorTemplate/index.tsx';

describe('FieldErrorTemplate', () => {
  it('gives string and element errors keys that never collide', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    // The unkeyed element sits at index 1, where an index fallback would spell the same key as the string `'1'`
    const errors = ['1', createElement('span', null, 'y'), <span key='required'>x</span>, 'required', 'required'];
    const { container } = render(
      <FieldErrorTemplate errors={errors} id='root' schema={{}} registry={getTestRegistry({})} />,
    );

    expect(container.querySelectorAll('#root__error > div')).toHaveLength(errors.length);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
