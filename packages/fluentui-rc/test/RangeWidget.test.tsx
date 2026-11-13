import validator from '@rjsf/validator-ajv8';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

describe('RangeWidget', () => {
  // Fluent's own 120px minimum would push the slider out of a narrower layout grid column
  test("lets the slider shrink below Fluent's minimum width", () => {
    const { container } = render(
      <Form
        schema={{ type: 'number', minimum: 0, maximum: 10 }}
        uiSchema={{ 'ui:widget': 'range' }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.fui-Slider')).toHaveStyle({ minWidth: '0px' });
  });

  test('writes a string on a string field, which keeps it valid', () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'string', minimum: 0, maximum: 10 }}
        uiSchema={{ 'ui:widget': 'RangeWidget' }}
        initialFormData='7'
        liveValidate='onChange'
        onChange={onChange}
        validator={validator}
      />,
    );
    // user-event can't edit a range input's value, and jsdom doesn't move one by a key
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: '8', errors: [] }), 'root');
  });

  test("reports the field's value, not its input's string, on focus and blur", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <Form
        schema={{ type: 'number', minimum: 0, maximum: 10 }}
        uiSchema={{ 'ui:widget': 'range' }}
        initialFormData={4}
        onFocus={onFocus}
        onBlur={onBlur}
        validator={validator}
      />,
    );
    await user.click(screen.getByRole('slider'));
    await user.tab();

    expect(onFocus).toHaveBeenCalledWith('root', 4);
    expect(onBlur).toHaveBeenCalledWith('root', 4);
  });
});
