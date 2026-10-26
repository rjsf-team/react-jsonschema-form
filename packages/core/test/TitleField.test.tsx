import type { TitleFieldProps } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';

import TitleField from '../src/components/templates/TitleField.tsx';
import { getTestRegistry } from '../src/testing.ts';
import { createFormComponent } from './testUtils.tsx';

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

  it('should put the expected id on the title text alone', () => {
    expect(node.querySelector('#sample_id')).toHaveTextContent(/^Field title$/);
  });

  it('should include only title, when field is not required', () => {
    expect(node).toHaveTextContent(props.title);
  });

  it('should add an asterisk to the title, when field is required', () => {
    expect(node).toHaveTextContent(`${props.title}*`);

    expect(node.querySelector('span.rjsf-required')).toHaveTextContent('*');
  });
});

describe('TitleField outside a fieldset', () => {
  it('renders a div rather than a legend, with the same contents', () => {
    const { container } = render(
      <TitleField id='sample_id' title='Field title' required outsideFieldset schema={{}} registry={registry} />,
    );
    const node = container.firstElementChild!;

    expect(node.tagName).toEqual('DIV');
    expect(node).toHaveClass('rjsf-title');
    expect(node.querySelector('#sample_id')).toHaveTextContent(/^Field title$/);
    expect(node.querySelector('span.rjsf-required')).toHaveTextContent('*');
  });

  it("is not set for a NullField's own title, a legend heading the fieldset core draws around it", () => {
    createFormComponent({ schema: { type: 'null', title: 'Nothing' } });

    const legend = screen.getByText('Nothing').closest('legend');
    expect(legend?.parentElement?.firstElementChild).toBe(legend);
    expect(legend?.parentElement).toHaveClass('rjsf-own-title-group');
  });
});
