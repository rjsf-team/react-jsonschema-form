import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import ToggleWidget from '../src/widgets/ToggleWidget/ToggleWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe('ToggleWidget', () => {
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
});
