import { formTests } from '@rjsf/snapshot-tests';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

formTests(Form);

describe('semantic-ui specific tests', () => {
  test('field with special semantic options', () => {
    const schema: RJSFSchema = {
      title: 'A registration form',
      description: 'A simple test theme form example.',
      type: 'object',
      required: ['test'],
      properties: {
        test: {
          enum: [1, 2, 3],
          title: 'test',
        },
      },
    };
    const uiSchema = {
      test: {
        'ui:options': {
          semantic: {
            fluid: true,
          },
        },
      },
    };
    const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
