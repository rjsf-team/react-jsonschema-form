import { render } from '@testing-library/react';

import { RichDescription, RichHelp } from '../src/index.ts';
import MarkdownRenderer from '../src/markdown.tsx';
import { getTestRegistry } from '../src/testing.ts';

describe('markdown options', () => {
  test.each([true, false])('controls help independently of descriptions (description: %s)', (descriptionEnabled) => {
    const registry = getTestRegistry({}, undefined, { MarkdownTemplate: MarkdownRenderer });
    const uiSchema = {
      'ui:enableMarkdownInDescription': descriptionEnabled,
      'ui:enableMarkdownInHelp': !descriptionEnabled,
    };
    const description = render(
      <RichDescription description='**description**' registry={registry} uiSchema={uiSchema} />,
    );
    const help = render(<RichHelp help='**help**' registry={registry} uiSchema={uiSchema} />);
    expect(description.container.querySelector('strong') !== null).toBe(descriptionEnabled);
    expect(help.container.querySelector('strong') !== null).toBe(!descriptionEnabled);
  });

  it('lets local options disable globally enabled markdown', () => {
    const registry = getTestRegistry({}, undefined, { MarkdownTemplate: MarkdownRenderer });
    registry.globalUiOptions = { enableMarkdownInDescription: true, enableMarkdownInHelp: true };
    const { container, rerender } = render(<RichHelp help='**help**' registry={registry} />);
    expect(container.querySelector('strong')).toHaveTextContent('help');
    rerender(<RichHelp help='**help**' registry={registry} uiSchema={{ 'ui:enableMarkdownInHelp': false }} />);
    expect(container).toHaveTextContent('**help**');
    expect(container.querySelector('strong')).toBeNull();
  });

  it('renders plain text when a flag is enabled without a renderer', () => {
    const registry = getTestRegistry({});
    const { container } = render(
      <RichHelp help='**help**' registry={registry} uiSchema={{ 'ui:enableMarkdownInHelp': true }} />,
    );
    expect(container).toHaveTextContent('**help**');
    expect(container.querySelector('strong')).toBeNull();
  });

  it('defaults to plain text even when a renderer is registered', () => {
    const registry = getTestRegistry({}, undefined, { MarkdownTemplate: MarkdownRenderer });
    const { container } = render(<RichDescription description='**description**' registry={registry} />);
    expect(container).toHaveTextContent('**description**');
    expect(container.querySelector('strong')).toBeNull();
  });
});
