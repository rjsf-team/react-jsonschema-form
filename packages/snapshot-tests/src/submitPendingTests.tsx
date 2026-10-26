import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen, waitFor } from '@testing-library/react';

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string', title: 'Name' } } };

/** Pins that the theme's `SubmitButton` is disabled while a promise `onSubmit` returned is pending, so it can't submit the
 * form a second time meanwhile, whatever `disabled` the uiSchema asks for, and that a `disabled` it asks for still applies when
 * nothing is pending
 *
 * @param Form - The theme's `Form` component
 */
export function submitPendingTests(Form: ComponentType<FormProps>) {
  describe('the submit button while a promise onSubmit returned is pending', () => {
    // Clicked through the DOM rather than user-event, which isn't among this package's peer dependencies
    test('is disabled until the promise settles', async () => {
      const save = Promise.withResolvers<undefined>();
      render(<Form schema={schema} validator={validator} onSubmit={async () => save.promise} />);
      const button = screen.getByRole('button', { name: 'Submit' });
      expect(button).toBeEnabled();

      act(() => button.click());

      expect(button).toBeDisabled();
      save.resolve(undefined);
      await waitFor(() => expect(button).toBeEnabled());
    });

    test('is disabled while the promise is pending though the uiSchema enables it', async () => {
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

      expect(button).toBeDisabled();
      save.resolve(undefined);
      await waitFor(() => expect(button).toBeEnabled());
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
