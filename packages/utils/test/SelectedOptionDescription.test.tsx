import { render } from '@testing-library/react';

import type { DescriptionFieldProps, Registry, RJSFSchema, WidgetProps } from '../src';
import { SelectedOptionDescription } from '../src';

function DescriptionFieldTemplate({ id, description, schema }: DescriptionFieldProps) {
  return (
    <div id={id} data-schema-title={schema.title}>
      {description}
    </div>
  );
}

const registry = {
  templates: { DescriptionFieldTemplate },
} as unknown as Registry;

const baseProps: Pick<WidgetProps, 'id' | 'multiple' | 'options' | 'registry' | 'uiSchema' | 'value'> = {
  id: 'root',
  multiple: false,
  options: {
    enumOptions: [
      { value: 'foo', label: 'Foo', schema: { title: 'Foo', description: 'Foo description' } },
      { value: 'bar', label: 'Bar', schema: { title: 'Bar', description: 'Bar description' } },
    ],
  },
  registry,
  uiSchema: {},
  value: 'foo',
};

describe('SelectedOptionDescription', () => {
  it('renders the selected option description with its schema', () => {
    const { container } = render(<SelectedOptionDescription {...baseProps} />);
    const description = container.querySelector('#root__description');

    expect(description?.textContent).toBe('Foo description');
    expect(description?.getAttribute('data-schema-title')).toBe('Foo');
  });

  it('does not render for multiple selects', () => {
    const { container } = render(<SelectedOptionDescription {...baseProps} multiple />);

    expect(container.innerHTML).toBe('');
  });

  it.each([
    ['no enum options', {}],
    ['no matching option', { enumOptions: [{ value: 'bar', label: 'Bar' }] }],
    ['an option without a schema', { enumOptions: [{ value: 'foo', label: 'Foo' }] }],
    [
      'an option schema without a description',
      { enumOptions: [{ value: 'foo', label: 'Foo', schema: { title: 'Foo' } as RJSFSchema }] },
    ],
  ])('does not render with %s', (_, options) => {
    const { container } = render(<SelectedOptionDescription {...baseProps} options={options} />);

    expect(container.innerHTML).toBe('');
  });
});
