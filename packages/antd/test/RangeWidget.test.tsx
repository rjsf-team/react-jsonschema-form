import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'object',
  properties: { volume: { type: 'integer', title: 'Volume', description: 'How loud', minimum: 0, maximum: 10 } },
};
const uiSchema: UiSchema = { volume: { 'ui:widget': 'range', 'ui:help': 'Drag it' } };
const withError = (
  <Form
    schema={schema}
    uiSchema={uiSchema}
    extraErrors={{ volume: { __errors: ['Too quiet'] } }}
    validator={validator}
  />
);

describe('RangeWidget', () => {
  it("describes the slider's handle by its field's errors, description and help, and marks it invalid (#5560)", () => {
    const { rerender } = render(withError);

    const handle = screen.getByRole('slider', { name: 'Volume' });
    expect(handle).toHaveAttribute('aria-invalid', 'true');
    expect(handle).toHaveAttribute('aria-describedby', 'root_volume__error root_volume__help root_volume__description');
    expect(handle).toHaveAccessibleDescription(/Too quiet.*Drag it.*How loud/);

    rerender(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(handle).not.toHaveAttribute('aria-invalid');
    expect(handle).toHaveAttribute('aria-describedby', 'root_volume__help root_volume__description');
  });

  it('keeps describing the handle while its tooltip opens and closes (#5560)', async () => {
    render(withError);

    const handle = screen.getByRole('slider', { name: 'Volume' });
    await user.tab();
    expect(handle).toHaveFocus();
    expect(handle.getAttribute('aria-describedby')).toMatch(
      /^root_volume__error root_volume__help root_volume__description \S+$/,
    );
    expect(handle).toHaveAccessibleDescription(/Too quiet.*Drag it.*How loud/);

    await user.tab();
    expect(handle).not.toHaveFocus();
    await waitFor(() =>
      expect(handle).toHaveAttribute(
        'aria-describedby',
        'root_volume__error root_volume__help root_volume__description',
      ),
    );
  });

  it('marks the handle invalid once moving it breaks a rule live validation checks (#5560)', async () => {
    render(
      <Form
        schema={{
          ...schema,
          properties: { volume: { ...(schema.properties!.volume as object), exclusiveMaximum: 1 } },
        }}
        uiSchema={uiSchema}
        initialFormData={{ volume: 0 }}
        liveValidate='onChange'
        validator={validator}
      />,
    );

    const handle = screen.getByRole('slider', { name: 'Volume' });
    expect(handle).not.toHaveAttribute('aria-invalid');

    await user.tab();
    expect(handle).toHaveFocus();
    // rc-slider reads a key only from the legacy `keyCode`, which user-event never sets
    fireEvent.keyDown(handle, { key: 'ArrowRight', keyCode: 39 });

    expect(handle).toHaveAttribute('aria-valuenow', '1');
    expect(handle).toHaveAttribute('aria-invalid', 'true');
    expect(handle.getAttribute('aria-describedby')).toMatch(
      /^root_volume__error root_volume__help root_volume__description \S+$/,
    );
    expect(handle).toHaveAccessibleDescription(/must be < 1/);
  });
});

describe('antd RangeWidget value', () => {
  it('draws and posts a numeric string at its number', () => {
    render(
      <Form
        schema={{ type: 'number', minimum: 0, maximum: 10 }}
        uiSchema={{ 'ui:widget': 'range' }}
        validator={validator}
        initialFormData='7'
      />,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '7');
  });
});

describe('antd RangeWidget on a string field', () => {
  it('writes a string, which keeps the field valid', async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'string', minimum: 0, maximum: 10 }}
        uiSchema={{ 'ui:widget': 'RangeWidget' }}
        validator={validator}
        initialFormData='7'
        liveValidate='onChange'
        onChange={onChange}
      />,
    );
    await user.tab();
    // rc-slider reads a key only from the legacy `keyCode`, which user-event never sets
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight', keyCode: 39 });

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: '8', errors: [] }), 'root');
  });
});
