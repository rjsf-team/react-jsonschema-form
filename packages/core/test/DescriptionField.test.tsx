import { DescriptionFieldProps } from '@rjsf/utils';
import { render } from '@testing-library/react';

import { getTestRegistry } from '../src';
import DescriptionField from '../src/components/templates/DescriptionField';

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
