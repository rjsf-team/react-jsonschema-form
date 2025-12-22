import { render } from '@testing-library/react';
import { TitleFieldProps } from '@rjsf/utils';

import TitleField from '../src/components/templates/TitleField';
import { getTestRegistry } from '../src';

const registry = getTestRegistry({});

describe('TitleField', () => {
  let node: Element;
  let props: TitleFieldProps;
  beforeAll(() => {
    props = {
      id: 'sample_id',
      title: 'Field title',
      required: true,
      schema: {},
      registry,
    };
    const { container } = render(<TitleField {...props} />);
    node = container.firstElementChild!;
  });
  it('should return a legend', () => {
    expect(node.tagName).toEqual('LEGEND');
  });

  it('should have the expected id', () => {
    expect(node).toHaveAttribute('id', 'sample_id');
  });

  it('should include only title, when field is not required', () => {
    expect(node).toHaveTextContent(props.title);
  });

  it('should add an asterisk to the title, when field is required', () => {
    expect(node).toHaveTextContent(props.title + '*');

    expect(node.querySelector('span.required')).toHaveTextContent('*');
  });
});
