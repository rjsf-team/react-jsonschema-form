import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFMarkedSchema, RJSFSchema } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, additionalKeyId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

/** Checks that the theme's `WrapIfAdditionalTemplate` reads `ADDITIONAL_PROPERTY_FLAG` by its truth, so a schema spread
 * with the flag unset renders as a plain field
 *
 * @param Form - The theme's `Form`
 */
export function wrapIfAdditionalFlagTests(Form: ComponentType<FormProps>) {
  describe("the WrapIfAdditionalTemplate's flag", () => {
    function renderKeyInput(flag: boolean | undefined) {
      const extra: RJSFMarkedSchema = { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: flag };
      const schema: RJSFSchema = { type: 'object', properties: { extra } };
      const { container } = render(<Form schema={schema} validator={validator} />);

      return container.querySelector(`[id="${additionalKeyId('root_extra')}"]`);
    }

    test('draws the key input of a field whose flag is set', () => {
      expect(renderKeyInput(true)).toBeInTheDocument();
    });

    test.each([undefined, false])('draws none for a field whose flag is %s', (flag) => {
      expect(renderKeyInput(flag)).not.toBeInTheDocument();
    });
  });
}
