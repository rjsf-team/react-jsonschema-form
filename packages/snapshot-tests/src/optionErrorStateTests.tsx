import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

/** Checks that an `anyOf` option's error state follows the option's own errors and `ui:hideError`, as its wrapper's
 * `rjsf-field-error` class does, whatever the field above does with its `ui:hideError` (#5590). The form is a root
 * `anyOf` whose first option, titled `Text`, draws its own label for the `root` input, and has help of its own
 *
 * @param Form - The theme's `Form`
 * @param isMarked - Whether the theme marks that option as in error, read from the rendered container
 */
export function optionErrorStateTests(
  Form: ComponentType<FormProps>,
  isMarked: (container: HTMLElement) => boolean | undefined,
) {
  describe("an anyOf option's error state", () => {
    test.each([
      ['shows', false],
      ['hides', true],
    ])('follows whether the option %s the errors, whatever the field above does', (_, optionHides) => {
      const { container } = render(
        <Form
          schema={{ anyOf: [{ type: 'string', title: 'Text' }, { type: 'number' }] }}
          uiSchema={{ 'ui:hideError': !optionHides, anyOf: [{ 'ui:hideError': optionHides, 'ui:help': 'Help' }, {}] }}
          extraErrors={{ __errors: ['wrong'] }}
          showErrorList={false}
          validator={validator}
        />,
      );

      expect(!!isMarked(container)).toBe(!optionHides);
      // Drawn once by whichever shows them, so an option marked in error has a message with it
      expect(screen.getAllByText('wrong')).toHaveLength(1);
    });
  });
}
