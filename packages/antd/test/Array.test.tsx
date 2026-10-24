import { arrayTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import type { UiSchema as AntdUiSchema } from '../src/index.ts';
import Form from '../src/index.ts';

arrayTests(Form);

describe('RemoveButton', () => {
  test('takes block from ui:globalOptions', () => {
    const uiSchema: AntdUiSchema = { 'ui:globalOptions': { block: true } };
    const { container } = render(
      <Form
        schema={{ type: 'array', items: { type: 'string' } }}
        initialFormData={['a']}
        uiSchema={uiSchema}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_0__remove')).toHaveClass('ant-btn-block');
  });
});
