import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen, waitFor } from '@testing-library/react';

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string', title: 'Name' } } };

/** Pins that the theme's `SubmitButton` is `aria-disabled` while a promise `onSubmit` returned is pending, and stays
 * enabled so a keyboard user keeps focus on it, and that a `disabled` the uiSchema asks for still applies when nothing is
 * pending
 *
 * @param Form - The theme's `Form` component
 */
export function submitPendingTests(Form: ComponentType<FormProps>) {
  function expectPending(button: HTMLElement) {
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeEnabled();
  }
  function expectIdle(button: HTMLElement) {
    expect(button).not.toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeEnabled();
  }

  describe('the submit button while a promise onSubmit returned is pending', () => {
    // Clicked through the DOM rather than user-event, which isn't among this package's peer dependencies
    test('is aria-disabled until the promise settles', async () => {
      const save = Promise.withResolvers<undefined>();
      render(<Form schema={schema} validator={validator} onSubmit={async () => save.promise} />);
      const button = screen.getByRole('button', { name: 'Submit' });
      expectIdle(button);

      act(() => button.click());

      expectPending(button);
      save.resolve(undefined);
      await waitFor(() => expectIdle(button));
    });

    test('is aria-disabled while the promise is pending though the uiSchema enables it', async () => {
      const save = Promise.withResolvers<undefined>();
      render(
        <Form
          schema={schema}
          uiSchema={{ 'ui:submitButtonOptions': { props: { disabled: false } } }}
          validator={validator}
          onSubmit={async () => save.promise}
        />,
      );
      const button = screen.getByRole('button', { name: 'Submit' });

      act(() => button.click());

      expectPending(button);
      save.resolve(undefined);
      await waitFor(() => expectIdle(button));
    });

    test('stays disabled when the uiSchema disables it and nothing is pending', () => {
      render(
        <Form
          schema={schema}
          uiSchema={{ 'ui:submitButtonOptions': { props: { disabled: true } } }}
          validator={validator}
          onSubmit={async () => {}}
        />,
      );

      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });
  });
}
