import type { MarkdownTemplateProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import { setupConsoleErrorSuppression } from '../../../testing/consoleSuppression.ts';
import Form from './WrappedForm.tsx';

function PlainMarkdown({ children }: MarkdownTemplateProps) {
  return <span>{children}</span>;
}

describe('the options rjsf reads are not passed on to Mantine components', () => {
  const consoleErrors = setupConsoleErrorSuppression();

  /** The props React warned it doesn't recognize on a DOM element, by the name they were passed under */
  function unrecognizedProps() {
    const calls: unknown[][] = consoleErrors.consoleSpy.mock.calls;
    return calls
      .filter(([message]) => typeof message === 'string' && message.includes('React does not recognize the `%s` prop'))
      .map(([, prop]) => prop);
  }

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
    expect(unrecognizedProps()).not.toContain('initialValue');
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
    expect(unrecognizedProps()).not.toContain('MarkdownTemplate');
  });

  it('does not pass ui:definitions on from the root field', () => {
    const { container } = render(
      <Form schema={{ type: 'string' }} uiSchema={{ 'ui:definitions': {} }} validator={validator} />,
    );

    expect(container.querySelector('[definitions]')).toBeNull();
  });

  it("does not pass the alt-date widgets' options on to Mantine's date input", () => {
    const { container } = render(
      <Form
        schema={{ type: 'string', format: 'date' }}
        uiSchema={{
          'ui:options': { yearsRange: [2000, 2030], format: 'MDY', hideNowButton: true, hideClearButton: true },
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('[yearsrange], [format], [hidenowbutton], [hideclearbutton]')).toBeNull();
    expect(unrecognizedProps()).toEqual(expect.not.arrayContaining(['yearsRange', 'hideNowButton', 'hideClearButton']));
  });
});
