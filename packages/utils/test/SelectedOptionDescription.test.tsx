/** @vitest-environment jsdom */
import { render } from '@testing-library/react';

import type { DescriptionFieldProps, Registry, SelectedOptionDescriptionProps } from '../src/index.ts';
import { resolveFieldPresentation, SelectedOptionDescription, selectedOptionDescriptionId } from '../src/index.ts';

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

const baseProps: SelectedOptionDescriptionProps = {
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

  it('does not render when hideLabel is true', () => {
    const { container } = render(<SelectedOptionDescription {...{ ...baseProps, hideLabel: true }} />);

    expect(container.innerHTML).toBe('');
  });

  it("renders under its field's plan when hideLabel only says the template draws the label, under an id of its own", () => {
    const presentation = resolveFieldPresentation({
      id: 'root',
      declaration: {
        label: 'template',
        description: 'template',
        errors: 'template',
        help: 'template',
        labelledBy: 'for',
      },
      label: 'Choice',
    });
    const { container } = render(<SelectedOptionDescription {...baseProps} hideLabel presentation={presentation} />);

    expect(container.querySelector(`#${selectedOptionDescriptionId('root')}`)?.textContent).toBe('Foo description');
    expect(container.querySelector('#root__description')).toBeNull();
  });

  it.each(['Choice', ''])(
    "renders nothing under its field's plan where its resolved `ui:label: false` applies, label %j",
    (label) => {
      const presentation = resolveFieldPresentation({
        id: 'root',
        declaration: {
          label: 'template',
          description: 'template',
          errors: 'template',
          help: 'template',
          labelledBy: 'for',
        },
        label,
        showLabel: false,
      });
      const { container } = render(<SelectedOptionDescription {...baseProps} presentation={presentation} />);

      expect(container).toBeEmptyDOMElement();
    },
  );

  it.each([
    ['ui:options label', { ...baseProps, uiSchema: { 'ui:options': { label: false } } }],
    ['ui:label', { ...baseProps, uiSchema: { 'ui:label': false } }],
    ['global ui options label', { ...baseProps, registry: { ...registry, globalUiOptions: { label: false } } }],
  ])('does not render when %s is false', (_, props) => {
    const { container } = render(<SelectedOptionDescription {...props} />);

    expect(container.innerHTML).toBe('');
  });

  it.each([
    ['no enum options', {}],
    ['no matching option', { enumOptions: [{ value: 'bar', label: 'Bar' }] }],
    ['an option without a schema', { enumOptions: [{ value: 'foo', label: 'Foo' }] }],
    [
      'an option schema without a description',
      { enumOptions: [{ value: 'foo', label: 'Foo', schema: { title: 'Foo' } }] },
    ],
  ])('does not render with %s', (_, options) => {
    const { container } = render(<SelectedOptionDescription {...baseProps} options={options} />);

    expect(container.innerHTML).toBe('');
  });
});
