import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import { setupConsoleErrorSuppression } from '../../../testing/consoleSuppression.ts';
import Form from '../src/index.ts';

// `FieldTemplate` and `WrapIfAdditionalTemplate` spread the props they don't list onto their `<div>`, so a member of
// their props they don't destructure lands on the DOM element and React warns about it. React warns about a prop once
// per module, so this file of its own keeps any earlier render in a shared file from using up that one warning
describe('the props FieldTemplate and WrapIfAdditionalTemplate spread onto their elements', () => {
  const consoleErrors = setupConsoleErrorSuppression();

  it.each([
    ['a field', { type: 'string', title: 'Name' }, undefined],
    ['an extra key', { type: 'object', additionalProperties: { type: 'string' } }, { extra: 'value' }],
  ] satisfies [string, RJSFSchema, unknown][])(
    'leaves the props React does not recognize off %s',
    (_, fieldSchema, data) => {
      render(
        <Form
          schema={{ type: 'object', properties: { agree: fieldSchema } }}
          initialFormData={data && { agree: data }}
          extraErrors={{ agree: { __errors: ['wrong'] } }}
          validator={validator}
        />,
      );

      const calls: unknown[][] = consoleErrors.consoleSpy.mock.calls;
      const unrecognized = calls
        .filter(
          ([message]) => typeof message === 'string' && message.includes('React does not recognize the `%s` prop'),
        )
        .map(([, prop]) => prop);
      expect(unrecognized).toEqual([]);
    },
  );
});
