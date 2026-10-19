import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import MultiSchemaFieldTemplate from '../src/templates/MultiSchemaFieldTemplate/index.tsx';

const registry = getTestRegistry({});

describe('MultiSchemaFieldTemplate', () => {
  // `MultiSchemaField` gives it no selector while an optional field has no data yet (#5401)
  test.each([
    ['a row for the selector it is given', <select key='selector' aria-label='Option' />, 2],
    ['no row for a selector it is not given', undefined, 1],
  ])('lays out %s', (_, selector, rows) => {
    const { container } = render(
      <MultiSchemaFieldTemplate
        selector={selector}
        optionSchemaField={<span>option</span>}
        schema={{}}
        registry={registry}
      />,
    );

    expect(container.firstElementChild?.children).toHaveLength(rows);
    expect(container.firstElementChild?.lastElementChild).toHaveTextContent('option');
  });
});
