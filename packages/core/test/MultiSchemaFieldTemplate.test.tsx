import { render } from '@testing-library/react';

import MultiSchemaFieldTemplate from '../src/components/templates/MultiSchemaFieldTemplate.tsx';
import { getTestRegistry } from '../src/testing.ts';

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

    expect(container.querySelectorAll('.form-group')).toHaveLength(1);
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

    expect(container.querySelector('.form-group')).not.toBeInTheDocument();
    expect(container.firstElementChild?.children).toHaveLength(1);
  });
});
