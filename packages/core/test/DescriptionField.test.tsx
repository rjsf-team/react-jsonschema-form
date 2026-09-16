import type { DescriptionFieldProps } from '@rjsf/utils';
import { render } from '@testing-library/react';

import DescriptionField from '../src/components/templates/DescriptionField.tsx';
import { getTestRegistry } from '../src/index.ts';

const registry = getTestRegistry({});

describe('DescriptionField', () => {
  let node: Element;
  let props: DescriptionFieldProps;
  beforeAll(() => {
    props = {
      id: 'sample_id',
      description: 'Field description',
      schema: {},
      registry,
    };
    const { container } = render(<DescriptionField {...props} />);
    node = container.firstElementChild!;
  });
  it('should return a div for a custom component', () => {
    expect(node.tagName).toEqual('DIV');
  });

  it('should have the expected id', () => {
    expect(node).toHaveAttribute('id', 'sample_id');
  });
});
