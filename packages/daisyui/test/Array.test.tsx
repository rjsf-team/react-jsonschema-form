import { arrayTests } from '@rjsf/snapshot-tests';
import { englishStringTranslator, TranslatableString } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

arrayTests(Form);

describe('daisyui ArrayFieldTemplate', () => {
  test('reads its empty-array message through translateString', () => {
    render(
      <Form
        schema={{ type: 'array', items: { type: 'string' } }}
        validator={validator}
        translateString={(key, params) =>
          key === TranslatableString.EmptyArray ? 'Aucun élément' : englishStringTranslator(key, params)
        }
      />,
    );

    expect(screen.getByText('Aucun élément')).toBeInTheDocument();
  });
});
