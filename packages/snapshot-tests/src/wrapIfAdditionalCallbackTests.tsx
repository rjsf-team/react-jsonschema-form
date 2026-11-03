import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, additionalKeyId, buttonId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

/** Checks that the theme's `WrapIfAdditionalTemplate` disables the key input and the remove button of a property it is
 * handed no rename or remove callback for, such as the root, which `ObjectField` doesn't render
 *
 * @param Form - The theme's `Form`
 */
export function wrapIfAdditionalCallbackTests(Form: ComponentType<FormProps>) {
  test('WrapIfAdditionalTemplate disables the key input and remove button without their callbacks', () => {
    const schema: RJSFSchema = { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true };
    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelector(`#${additionalKeyId('root')}`)).toBeDisabled();
    expect(container.querySelector(`#${buttonId('root', 'remove')}`)).toBeDisabled();
  });
}
