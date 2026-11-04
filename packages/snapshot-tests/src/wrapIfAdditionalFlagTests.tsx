import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFMarkedSchema, RJSFSchema } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, additionalKeyId, buttonId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

/** Checks that the theme's `WrapIfAdditionalTemplate` reads `ADDITIONAL_PROPERTY_FLAG` by its truth, so a schema spread
 * with the flag unset renders as a plain field
 *
 * @param Form - The theme's `Form`
 */
export function wrapIfAdditionalFlagTests(Form: ComponentType<FormProps>) {
  describe("the WrapIfAdditionalTemplate's flag", () => {
    function renderField(flag: boolean | undefined) {
      const extra: RJSFMarkedSchema = { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: flag };
      const schema: RJSFSchema = { type: 'object', properties: { extra } };
      const { container } = render(<Form schema={schema} validator={validator} />);

      return {
        field: container.querySelector('[id="root_extra"]'),
        keyInput: container.querySelector(`[id="${additionalKeyId('root_extra')}"]`),
        removeButton: container.querySelector(`[id="${buttonId('root_extra', 'remove')}"]`),
      };
    }

    test('draws the key input and remove button of a field whose flag is set', () => {
      const { field, keyInput, removeButton } = renderField(true);

      expect(field).toBeInTheDocument();
      expect(keyInput).toBeInTheDocument();
      expect(removeButton).toBeInTheDocument();
    });

    test.each([undefined, false])('draws the field alone when its flag is %s', (flag) => {
      const { field, keyInput, removeButton } = renderField(flag);

      expect(field).toBeInTheDocument();
      expect(keyInput).not.toBeInTheDocument();
      expect(removeButton).not.toBeInTheDocument();
    });
  });
}
