import type { ReactNode } from 'react';
import { ChakraProvider, defaultSystem, Fieldset } from '@chakra-ui/react';
import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import FieldErrorTemplate from '../src/FieldErrorTemplate/FieldErrorTemplate.tsx';

// `FieldTemplate` renders the errors inside its fieldset, which Chakra shows error text in only while it is invalid
const wrapper = ({ children }: { children: ReactNode }) => (
  <ChakraProvider value={defaultSystem}>
    <Fieldset.Root invalid>{children}</Fieldset.Root>
  </ChakraProvider>
);

describe('FieldErrorTemplate', () => {
  // A control is described by the id only while the errors show, so the element must exist then and only then
  it.each([
    ['no errors', [], 0],
    ['errors', ['too short', 'not a number'], 1],
  ])('renders the error id on one element only while there are errors, given %s', (_, errors, count) => {
    const { container } = render(
      <FieldErrorTemplate errors={errors} id='root' schema={{}} registry={getTestRegistry({})} />,
      { wrapper },
    );

    expect(container.querySelectorAll('#root__error')).toHaveLength(count);
    expect(container.querySelector('fieldset')?.childElementCount).toBe(count);
  });

  it('renders each message within that element', () => {
    const { container } = render(
      <FieldErrorTemplate
        errors={['too short', 'not a number']}
        id='root'
        schema={{}}
        registry={getTestRegistry({})}
      />,
      { wrapper },
    );

    expect(container.querySelectorAll('#root__error > span')).toHaveLength(2);
    expect(container.querySelector('#root__error')).toHaveTextContent('too shortnot a number');
  });
});
