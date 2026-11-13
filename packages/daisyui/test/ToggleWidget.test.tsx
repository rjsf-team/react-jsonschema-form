import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import ToggleWidget from '../src/widgets/ToggleWidget/ToggleWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe('ToggleWidget', () => {
  test('uses the default size for a `size` option that is not a string', () => {
    const jsonOptions: Record<string, unknown> = { size: 5 };
    const { getByRole } = render(<ToggleWidget {...makeWidgetMockProps({ options: jsonOptions })} />);

    expect(getByRole('checkbox').className).not.toContain('toggle-');
  });

  test.each(['', ' '])('adds no size class for a `size` option of %j', (size) => {
    const jsonOptions: Record<string, unknown> = { size };
    const { getByRole } = render(<ToggleWidget {...makeWidgetMockProps({ options: jsonOptions })} />);

    expect(getByRole('checkbox').className).not.toContain('toggle-');
  });

  test('trims the space around a `size` option', () => {
    const { getByRole } = render(<ToggleWidget {...makeWidgetMockProps({ options: { size: ' lg' } })} />);

    expect(getByRole('checkbox')).toHaveClass('toggle-lg');
  });

  test('renders correctly', () => {
    const { asFragment } = render(<ToggleWidget {...makeWidgetMockProps()} />);
    expect(asFragment()).toMatchSnapshot();
  });

  test('renders with custom label', () => {
    const { asFragment } = render(
      <ToggleWidget
        {...makeWidgetMockProps({
          label: 'Custom Toggle Label',
        })}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  test('renders disabled state correctly', () => {
    const { asFragment } = render(
      <ToggleWidget
        {...makeWidgetMockProps({
          disabled: true,
        })}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  test('calls onChange when toggled', async () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <ToggleWidget
        {...makeWidgetMockProps({
          onChange,
          value: false,
        })}
      />,
    );

    const toggle = getByRole('checkbox');
    await user.click(toggle);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  // React reads either of these as "no `checked` prop" and mounts the input uncontrolled: it then keeps whatever the
  // user clicked even though the value it was given never changed. `null` is what a `type: ['boolean', 'null']` field
  // holds, and `undefined` what any boolean the form has no data for holds
  test.each([
    ['no value at all', undefined],
    ['a null value', null],
  ])('stays in step with %s', async (_, value) => {
    const onChange = vi.fn();
    const { getByRole } = render(<ToggleWidget {...makeWidgetMockProps({ value, onChange })} />);

    const toggle = getByRole('checkbox');
    await user.click(toggle);

    expect(onChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveProperty('checked', false);
  });

  test('renders with correct checked state', () => {
    const { getByRole } = render(
      <ToggleWidget
        {...makeWidgetMockProps({
          value: true,
        })}
      />,
    );

    const toggle = getByRole('checkbox');
    expect(toggle).toHaveProperty('checked', true);
  });

  test('writes the const of a string when switched on, and clears the field when switched off (#3882)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { agree: { type: 'string', const: 'yes', title: 'Agree' } },
    };
    const onChange = vi.fn();
    render(
      <Form
        schema={schema}
        uiSchema={{ agree: { 'ui:widget': 'toggle' } }}
        validator={validator}
        onChange={onChange}
        defaultFormStateBehavior={{ constAsDefaults: 'never' }}
      />,
    );
    const toggle = screen.getByRole('checkbox', { name: 'Agree' });

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { agree: 'yes' } }), 'root_agree');

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { agree: undefined } }),
      'root_agree',
    );
  });
});
