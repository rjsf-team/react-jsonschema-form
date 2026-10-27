import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

const schema: RJSFSchema = { type: 'number', title: 'Amount' };
const uiSchema: UiSchema = { 'ui:allowClearTextInputs': true };

/** Checks a theme's `allowClearTextInputs` clear button: offered for a value there is to clear, and leaving nothing
 * beside the input for a value of `0`, which a bare `value && <ClearButton />` renders as the text `0`
 *
 * @param Form - The theme's `Form`
 * @param [clearButtonName=/clear input/i] - The accessible name of the theme's clear button
 */
export function clearButtonTests(Form: ComponentType<FormProps>, clearButtonName = /clear input/i) {
  describe('allowClearTextInputs', () => {
    test('offers the clear button for a value', () => {
      render(<Form schema={schema} uiSchema={uiSchema} validator={validator} initialFormData={5} />);
      expect(screen.getByRole('button', { name: clearButtonName })).toBeInTheDocument();
    });

    test('renders nothing beside the input for a value of 0', () => {
      const { container } = render(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} initialFormData={0} />,
      );
      expect(screen.queryByRole('button', { name: clearButtonName })).toBeNull();
      expect(container).not.toHaveTextContent(/0/);
    });
  });
}
