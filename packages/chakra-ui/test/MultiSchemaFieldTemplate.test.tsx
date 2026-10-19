import type { ReactNode } from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import MultiSchemaFieldTemplate from '../src/MultiSchemaFieldTemplate/MultiSchemaFieldTemplate.tsx';

const registry = getTestRegistry({});

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
);

// The card's body, around the selector's row and the option
const cardBody = (container: HTMLElement) => container.querySelector('.chakra-card__body');

describe('MultiSchemaFieldTemplate', () => {
  test('lays out a row for the selector it is given', () => {
    const { container } = render(
      <MultiSchemaFieldTemplate
        selector={<select aria-label='Option' />}
        optionSchemaField={<span>option</span>}
        schema={{}}
        registry={registry}
      />,
      { wrapper },
    );

    expect(cardBody(container)?.children).toHaveLength(2);
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
      { wrapper },
    );

    expect(cardBody(container)?.children).toHaveLength(1);
    expect(cardBody(container)?.firstElementChild).toHaveTextContent('option');
  });
});
