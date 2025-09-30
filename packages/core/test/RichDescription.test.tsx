import { Registry } from '@rjsf/utils';
import { render, within } from '@testing-library/react';

import { RichDescription, RichDescriptionProps } from '../src';

const TEST_ID = 'test-id';

describe('RichDescription', () => {
  function getProps(overrides: Partial<RichDescriptionProps> = {}) {
    const { description = '', uiSchema = {}, registry = {} as Registry } = overrides;
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
  test('react rich text description, not enabled', () => {
    const text = '**Rich** Text';
    const props = getProps({ description: text });
    const { container } = render(<RichDescription {...props} />);
    expect(container).toHaveTextContent(text);
    const markdown = within(container).queryByTestId(RichDescription.TEST_IDS.markdown);
    expect(markdown).not.toBeInTheDocument();
  });
  test('react element description, enabled enableMarkdownInDescription', () => {
    const text = '**Text** In P';
    const props = getProps({
      description: <p data-testid={TEST_ID}>{text}</p>,
      uiSchema: { 'ui:enableMarkdownInDescription': true },
    });
    const { container } = render(<RichDescription {...props} />);
    expect(container).toBeInTheDocument();
    const paragraph = within(container).getByTestId(TEST_ID);
    expect(paragraph).toHaveTextContent(text);
    const markdown = within(container).queryByTestId(RichDescription.TEST_IDS.markdown);
    expect(markdown).not.toBeInTheDocument();
  });
  test('react rich text description, enabled enableMarkdownInDescription', () => {
    const expectedBold = 'Rich';
    const text = `**${expectedBold}** Text`;
    const expected = `${expectedBold} Text`;
    const props = getProps({ description: text, uiSchema: { 'ui:enableMarkdownInDescription': true } });
    const { container } = render(<RichDescription {...props} />);
    expect(container).toHaveTextContent(expected);
    const markdown = within(container).getByTestId(RichDescription.TEST_IDS.markdown);
    expect(markdown).toBeInTheDocument();
    const bold = markdown.querySelector('strong');
    expect(bold).toHaveTextContent(expectedBold);
  });
});
