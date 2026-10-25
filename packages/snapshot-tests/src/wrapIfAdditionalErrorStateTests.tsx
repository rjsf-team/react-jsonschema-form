import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

/** A `WrapIfAdditionalTemplate` that records the `hasErrors` it is handed */
function RecordingWrapper({ hasErrors, children }: WrapIfAdditionalTemplateProps) {
  return <div data-has-errors={String(hasErrors)}>{children}</div>;
}

/** Checks that the theme's `FieldTemplate` hands its `WrapIfAdditionalTemplate` the field's `hasErrors`, which a
 * template listing the props it forwards one by one can leave out
 *
 * @param Form - The theme's `Form`
 */
export function wrapIfAdditionalErrorStateTests(Form: ComponentType<FormProps>) {
  describe("the WrapIfAdditionalTemplate's error state", () => {
    test("is handed the field's hasErrors", () => {
      const { container } = render(
        <Form
          schema={{ type: 'object', additionalProperties: { type: 'string' } }}
          initialFormData={{ extra: '' }}
          extraErrors={{ extra: { __errors: ['wrong'] } }}
          templates={{ WrapIfAdditionalTemplate: RecordingWrapper }}
          validator={validator}
        />,
      );

      expect(container.querySelector('[data-has-errors="true"]')).toBeInTheDocument();
    });
  });
}
