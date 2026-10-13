import type { MarkdownTemplateProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import type { MockInstance } from 'vitest';

import Form from './WrappedForm.tsx';

function PlainMarkdown({ children }: MarkdownTemplateProps) {
  return <span>{children}</span>;
}

describe('the options rjsf reads are not passed on to Mantine components', () => {
  let consoleError: MockInstance<typeof console.error>;
  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error');
  });
  afterEach(() => {
    consoleError.mockRestore();
  });

  it('leaves an optional field optional under a global required option, which rjsf ignores', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { agree: { type: 'boolean', title: 'Agree' } } }}
        uiSchema={{ 'ui:globalOptions': { required: true }, agree: { 'ui:widget': 'select' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Agree' })).not.toBeRequired();
  });

  it('applies ui:initialValue without passing it on', () => {
    const { container } = render(
      <Form schema={{ type: 'string' }} uiSchema={{ 'ui:initialValue': 'first' }} validator={validator} />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('first');
    expect(container.querySelector('[initialvalue]')).toBeNull();
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('initialValue');
  });

  it('does not pass on a per-field template override that ui:options does not declare', () => {
    const { container } = render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:options': { MarkdownTemplate: PlainMarkdown } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('[markdowntemplate]')).toBeNull();
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('MarkdownTemplate');
  });

  it('does not pass ui:definitions on from the root field', () => {
    const schema: RJSFSchema = { type: 'string' };
    const { container } = render(<Form schema={schema} uiSchema={{ 'ui:definitions': {} }} validator={validator} />);

    expect(container.querySelector('[definitions]')).toBeNull();
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('definitions');
  });

  it('still sets the rows of a textarea', () => {
    render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:widget': 'textarea', 'ui:options': { rows: 4 } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
  });
});
