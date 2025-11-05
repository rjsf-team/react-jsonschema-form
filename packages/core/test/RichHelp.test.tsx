import { render, within } from '@testing-library/react';
import { Registry } from '@rjsf/utils';

import RichHelp, { RichHelpProps } from '../src/components/RichHelp';

const TEST_ID = 'test-id';

describe('RichHelp', () => {
  function getProps(overrides: Partial<RichHelpProps> = {}) {
    const { help = '', uiSchema = {}, registry = {} as Registry } = overrides;
    return { help, uiSchema, registry };
  }

  test('simple text help', () => {
    const text = 'text help';
    const props = getProps({ help: text });
    const { container } = render(<RichHelp {...props} />);
    expect(container).toHaveTextContent(text);
  });
  test('react element help', () => {
    const text = 'Text In P';
    const props = getProps({ help: <p data-testid={TEST_ID}>{text}</p> });
    const { container } = render(<RichHelp {...props} />);
    expect(container).toBeInTheDocument();
    const paragraph = within(container).getByTestId(TEST_ID);
    expect(paragraph).toHaveTextContent(text);
  });
  test('react rich text help, not enabled', () => {
    const text = '**Rich** Text';
    const props = getProps({ help: text });
    const { container } = render(<RichHelp {...props} />);
    expect(container).toHaveTextContent(text);
    const markdown = within(container).queryByTestId(RichHelp.TEST_IDS.markdown);
    expect(markdown).not.toBeInTheDocument();
  });
  test('react element help, enabled enableMarkdownInHelp', () => {
    const text = '**Text** In P';
    const props = getProps({
      help: <p data-testid={TEST_ID}>{text}</p>,
      uiSchema: { 'ui:enableMarkdownInHelp': true },
    });
    const { container } = render(<RichHelp {...props} />);
    expect(container).toBeInTheDocument();
    const paragraph = within(container).getByTestId(TEST_ID);
    expect(paragraph).toHaveTextContent(text);
    const markdown = within(container).queryByTestId(RichHelp.TEST_IDS.markdown);
    expect(markdown).not.toBeInTheDocument();
  });
  test('react rich text help, enabled enableMarkdownInHelp', () => {
    const expectedBold = 'Rich';
    const text = `**${expectedBold}** Text`;
    const expected = `${expectedBold} Text`;
    const props = getProps({ help: text, uiSchema: { 'ui:enableMarkdownInHelp': true } });
    const { container } = render(<RichHelp {...props} />);
    expect(container).toHaveTextContent(expected);
    const markdown = within(container).getByTestId(RichHelp.TEST_IDS.markdown);
    expect(markdown).toBeInTheDocument();
    const bold = markdown.querySelector('strong');
    expect(bold).toHaveTextContent(expectedBold);
  });
});
