import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import MultiSchemaFieldTemplate from '../src/templates/MultiSchemaFieldTemplate/index.tsx';

const registry = getTestRegistry({});

describe('MultiSchemaFieldTemplate', () => {
  test('lays out a row for the selector it is given', () => {
    const { container } = render(
      <MultiSchemaFieldTemplate
        selector={<select aria-label='Option' />}
        optionSchemaField={<span>option</span>}
        schema={{}}
        registry={registry}
      />,
    );

    expect(container.firstElementChild?.children).toHaveLength(2);
  });

  // `MultiSchemaField` gives it none while an optional field has no data yet (#5401)
  test('lays out no row for a selector it is not given', () => {
    const { container } = render(
      <MultiSchemaFieldTemplate
        selector={undefined}
        optionSchemaField={<span>option</span>}
        schema={{}}
        registry={registry}
      />,
    );

    expect(container.firstElementChild?.children).toHaveLength(1);
    expect(container.firstElementChild?.firstElementChild).toHaveTextContent('option');
  });
});
