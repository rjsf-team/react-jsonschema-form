import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

describe('ArrayFieldItemTemplate', () => {
  it.each<{ named: string; items: RJSFSchema; formData: unknown[]; marginTop: string; fallbackUi?: boolean }>([
    {
      named: 'a text input, whose label sits above it',
      items: { type: 'string', title: 'Tag' },
      formData: ['a', 'b'],
      marginTop: '26px',
    },
    {
      named: 'a select, whose label sits above it',
      items: { type: 'string', title: 'Size', enum: ['s', 'm'] },
      formData: ['s', 'm'],
      marginTop: '26px',
    },
    {
      named: 'a checkbox, whose label sits beside it',
      items: { type: 'boolean', title: 'Flag' },
      formData: [true, false],
      marginTop: '0px',
    },
    {
      named: "a type list under the fallback UI, whose type selector's label sits above it",
      items: { type: ['string', 'number'], title: 'Value' },
      formData: ['a', 'b'],
      marginTop: '26px',
      fallbackUi: true,
    },
  ])('lines the buttons of $named up with the control', ({ items, formData, marginTop, fallbackUi }) => {
    const { container } = render(
      <Form
        schema={{ type: 'array', items }}
        formData={formData}
        validator={validator}
        useFallbackUiForUnsupportedType={fallbackUi}
      />,
    );

    expect(container.querySelector('#root_0__moveDown')?.parentElement).toHaveStyle({ marginTop });
  });
});
