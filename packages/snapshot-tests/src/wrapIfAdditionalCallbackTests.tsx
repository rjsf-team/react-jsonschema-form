import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFMarkedSchema, RJSFSchema } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, additionalKeyId, buttonId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

/** Checks that the theme's `WrapIfAdditionalTemplate` disables the key input and the remove button of a property it is
 * handed no rename or remove callback for, such as the root, which `ObjectField` doesn't render, and of a property of
 * a disabled or read-only form, whose rename callback would otherwise rename the key on blur
 *
 * @param Form - The theme's `Form`
 */
export function wrapIfAdditionalCallbackTests(Form: ComponentType<FormProps>) {
  test('WrapIfAdditionalTemplate disables the key input and remove button without their callbacks', () => {
    const schema: RJSFMarkedSchema = { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true };
    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelector(`#${additionalKeyId('root')}`)).toBeDisabled();
    expect(container.querySelector(`#${buttonId('root', 'remove')}`)).toBeDisabled();
  });

  test.each(['disabled', 'readonly'] as const)(
    'WrapIfAdditionalTemplate disables the key input and remove button of a %s form',
    (state) => {
      const schema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
      const { container } = render(
        <Form
          schema={schema}
          validator={validator}
          initialFormData={{ foo: 'bar' }}
          disabled={state === 'disabled'}
          readonly={state === 'readonly'}
        />,
      );

      expect(container.querySelector(`#${additionalKeyId('root_foo')}`)).toBeDisabled();
      expect(container.querySelector(`#${buttonId('root_foo', 'remove')}`)).toBeDisabled();
    },
  );
}
