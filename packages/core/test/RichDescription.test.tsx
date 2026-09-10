import type { MarkdownTemplateProps } from '@rjsf/utils';
import { render, within } from '@testing-library/react';

import type { RichDescriptionProps } from '../src/index.ts';
import { RichDescription } from '../src/index.ts';
import MarkdownTemplate from '../src/markdown.tsx';
import { getTestRegistry } from '../src/testing.ts';

const TEST_ID = 'test-id';
const markdownRegistry = getTestRegistry({}, undefined, { MarkdownTemplate });

describe('RichDescription', () => {
  function getProps(overrides: Partial<RichDescriptionProps> = {}) {
    const {
      description = '',
      uiSchema = { 'ui:enableMarkdownInDescription': true },
      registry = getTestRegistry({}),
    } = overrides;
    return { description, uiSchema, registry };
  }

  test('simple text description', () => {
    const text = 'text description';
    const props = getProps({ description: text });
    const { container } = render(<RichDescription {...props} />);
    expect(container).toHaveTextContent(text);
  });
  test('react element description', () => {
    const text = 'Text In P';
    const props = getProps({ description: <p data-testid={TEST_ID}>{text}</p> });
    const { container } = render(<RichDescription {...props} />);
    expect(container).toBeInTheDocument();
    const paragraph = within(container).getByTestId(TEST_ID);
    expect(paragraph).toHaveTextContent(text);
  });
  test('rich text description renders as plain text with the default MarkdownTemplate', () => {
    const text = '**Rich** Text';
    const props = getProps({ description: text });
    const { container } = render(<RichDescription {...props} />);
    expect(container).toHaveTextContent(text);
    const markdown = within(container).queryByTestId(MarkdownTemplate.TEST_IDS.markdown);
    expect(markdown).not.toBeInTheDocument();
  });
  test('react element description is rendered as-is with a markdown MarkdownTemplate', () => {
    const text = '**Text** In P';
    const props = getProps({ description: <p data-testid={TEST_ID}>{text}</p>, registry: markdownRegistry });
    const { container } = render(<RichDescription {...props} />);
    expect(container).toBeInTheDocument();
    const paragraph = within(container).getByTestId(TEST_ID);
    expect(paragraph).toHaveTextContent(text);
    const markdown = within(container).queryByTestId(MarkdownTemplate.TEST_IDS.markdown);
    expect(markdown).not.toBeInTheDocument();
  });
  test('rich text description renders markdown with the markdown MarkdownTemplate', () => {
    const expectedBold = 'Rich';
    const text = `**${expectedBold}** Text`;
    const expected = `${expectedBold} Text`;
    const props = getProps({ description: text, registry: markdownRegistry });
    const { container } = render(<RichDescription {...props} />);
    expect(container).toHaveTextContent(expected);
    const markdown = within(container).getByTestId(MarkdownTemplate.TEST_IDS.markdown);
    expect(markdown).toBeInTheDocument();
    const bold = markdown.querySelector('strong');
    expect(bold).toHaveTextContent(expectedBold);
  });
  test('a MarkdownTemplate named in the uiSchema takes precedence over the registry', () => {
    const text = '**Rich** Text';
    const props = getProps({
      description: text,
      registry: markdownRegistry,
      uiSchema: {
        'ui:enableMarkdownInDescription': true,
        'ui:MarkdownTemplate': ({ children }: MarkdownTemplateProps) => <i data-testid={TEST_ID}>{children}</i>,
      },
    });
    const { container } = render(<RichDescription {...props} />);
    expect(within(container).getByTestId(TEST_ID)).toHaveTextContent(text);
  });
});
