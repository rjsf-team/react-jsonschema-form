import { render, fireEvent } from '@testing-library/react';

import ToggleWidget from '../src/widgets/ToggleWidget/ToggleWidget';
import { makeWidgetMockProps } from './helpers/createMocks';

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

  test('calls onChange when toggled', () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <ToggleWidget
        {...makeWidgetMockProps({
          onChange,
          value: false,
        })}
      />,
    );

    const toggle = getByRole('checkbox');
    fireEvent.click(toggle);

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
