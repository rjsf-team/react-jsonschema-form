import { objectTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

objectTests(Form);

it('omits the column for a deprecated property hidden by global options', () => {
  const { container } = render(
    <Form
      schema={{ type: 'object', properties: { a: { type: 'string' }, b: { type: 'string', deprecated: true } } }}
      uiSchema={{ 'ui:globalOptions': { deprecatedHandling: 'hide' } }}
      formContext={{ colSpan: {} }}
      validator={validator}
    />,
  );

  expect(container.querySelector('#root_a')).toBeInTheDocument();
  expect(container.querySelectorAll('#root > .ant-row > .ant-col')).toHaveLength(1);
  expect(container.querySelector('.rjsf-field-hidden')).not.toBeInTheDocument();
});
