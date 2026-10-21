import { createRef } from 'react';
import type { FormRef } from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from './WrappedForm.tsx';

const user = userEvent.setup();

describe('UpDownWidget focus handlers', () => {
  const schema: RJSFSchema = { type: 'integer' };

  function renderForm() {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <Form
        schema={schema}
        uiSchema={{ 'ui:widget': 'updown' }}
        initialFormData={5}
        validator={validator}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    return { onFocus, onBlur };
  }

  it("reports the input's value on focus and blur", async () => {
    const { onFocus, onBlur } = renderForm();

    await user.click(screen.getByRole('spinbutton'));
    await user.tab();

    expect(onFocus).toHaveBeenCalledWith('root', '5');
    expect(onBlur).toHaveBeenCalledWith('root', '5');
  });

  it('reports no value for a focus that lands on an increment or decrement trigger', () => {
    const { onFocus } = renderForm();
    const trigger = screen.getByRole('button', { name: 'increment value' });

    // Programmatic, because a click on a trigger keeps focus in the input, and the trigger's tabindex of -1 keeps it
    // out of the tab order; a script or assistive technology can still focus it
    trigger.focus();

    expect(onFocus).toHaveBeenCalledWith('root', undefined);
  });
});

describe('UpDownWidget value', () => {
  it('shows a value set from outside the widget, through the form', async () => {
    const ref = createRef<FormRef>();
    render(
      <Form
        ref={ref}
        schema={{ type: 'integer' }}
        uiSchema={{ 'ui:widget': 'updown' }}
        initialFormData={5}
        validator={validator}
      />,
    );

    act(() => ref.current?.setFieldValue('', 9));

    await waitFor(() => expect(screen.getByRole('spinbutton')).toHaveValue('9'));
  });

  it.each<[string, (form: FormRef) => void]>([
    ['clears the value from outside the widget', (form) => form.setFieldValue('', undefined)],
    ['resets to a seed without the value', (form) => form.reset()],
  ])('shows nothing once the form %s', async (_, clear) => {
    const ref = createRef<FormRef>();
    render(
      <Form
        ref={ref}
        schema={{ type: 'object', properties: { n: { type: 'integer' } } }}
        uiSchema={{ n: { 'ui:widget': 'updown' } }}
        initialFormData={{}}
        validator={validator}
      />,
    );
    const input = screen.getByRole('spinbutton');
    await user.type(input, '5');
    await waitFor(() => expect(input).toHaveValue('5'));

    act(() => {
      if (ref.current) {
        clear(ref.current);
      }
    });

    await waitFor(() => expect(input).toHaveValue(''));
    // The number input's own state is cleared with its text, so a step starts from an empty input rather than from the
    // number it held
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(ref.current?.getFormData()).toEqual({ n: 1 });
  });

  it('shows a stored 0', () => {
    render(
      <Form
        schema={{ type: 'integer' }}
        uiSchema={{ 'ui:widget': 'updown' }}
        initialFormData={0}
        validator={validator}
      />,
    );

    expect(screen.getByRole('spinbutton')).toHaveValue('0');
  });

  it.each([
    ['loses the focus', '{Tab}'],
    ['takes Enter', '{Enter}'],
  ])('reports no change for a stored number when the input %s', async (_, key) => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'integer' }}
        uiSchema={{ 'ui:widget': 'updown' }}
        initialFormData={5}
        validator={validator}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('spinbutton'));
    await user.keyboard(key);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('spinbutton')).toHaveValue('5');
  });

  it.each([
    ['loses the focus', '{Tab}'],
    ['takes Enter', '{Enter}'],
  ])('reports no change for a stored number past the safe integers when the input %s', async (_, key) => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'number' }}
        uiSchema={{ 'ui:widget': 'updown' }}
        initialFormData={1e20}
        validator={validator}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('spinbutton'));
    await user.keyboard(key);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('spinbutton')).toHaveValue('100000000000000000000');
  });

  it('shows what the user types', async () => {
    render(
      <Form
        schema={{ type: 'integer' }}
        uiSchema={{ 'ui:widget': 'updown' }}
        initialFormData={5}
        validator={validator}
      />,
    );
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '42');

    expect(input).toHaveValue('42');
  });
});
