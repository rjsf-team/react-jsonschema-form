import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen, waitFor } from '@testing-library/react';

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string', title: 'Name' } } };

/** Pins that the theme's `SubmitButton` is `aria-disabled` while a promise `onSubmit` returned is pending, and stays
 * enabled so a keyboard user keeps focus on it, that it takes no click meanwhile though an `onClickCapture` and an
 * `onClick` the uiSchema sets still run, and that a `disabled` the uiSchema asks for still applies when nothing is pending
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

    test('cancels a click while the promise is pending, so the browser runs no constraint validation', async () => {
      const save = Promise.withResolvers<undefined>();
      render(<Form schema={schema} validator={validator} onSubmit={async () => save.promise} />);
      const button = screen.getByRole('button', { name: 'Submit' });
      act(() => button.click());

      const click = new MouseEvent('click', { bubbles: true, cancelable: true });
      act(() => {
        button.dispatchEvent(click);
      });

      expect(click.defaultPrevented).toBe(true);
      save.resolve(undefined);
      await waitFor(() => expectIdle(button));
    });

    test('calls an onClick the uiSchema sets while the promise is pending, and still cancels the click', async () => {
      const save = Promise.withResolvers<undefined>();
      const onClick = vi.fn();
      const onSubmit = vi.fn(async () => save.promise);
      render(
        <Form
          schema={schema}
          uiSchema={{ 'ui:submitButtonOptions': { props: { onClick } } }}
          validator={validator}
          onSubmit={onSubmit}
        />,
      );
      const button = screen.getByRole('button', { name: 'Submit' });
      act(() => button.click());

      const click = new MouseEvent('click', { bubbles: true, cancelable: true });
      act(() => {
        button.dispatchEvent(click);
      });

      expect(onClick).toHaveBeenCalledTimes(2);
      expect(onClick).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'click', target: button }));
      expect(click.defaultPrevented).toBe(true);
      expect(onSubmit).toHaveBeenCalledTimes(1);
      save.resolve(undefined);
      await waitFor(() => expectIdle(button));
    });

    test('calls an onClickCapture the uiSchema sets while the promise is pending, before its onClick', async () => {
      const save = Promise.withResolvers<undefined>();
      const calls: string[] = [];
      const onClickCapture = vi.fn(() => calls.push('capture'));
      const onClick = vi.fn(() => calls.push('click'));
      render(
        <Form
          schema={schema}
          uiSchema={{ 'ui:submitButtonOptions': { props: { onClick, onClickCapture } } }}
          validator={validator}
          onSubmit={async () => save.promise}
        />,
      );
      const button = screen.getByRole('button', { name: 'Submit' });
      act(() => button.click());
      calls.length = 0;

      act(() => button.click());

      expectPending(button);
      expect(calls).toEqual(['capture', 'click']);
      expect(onClickCapture).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'click', target: button }));
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
