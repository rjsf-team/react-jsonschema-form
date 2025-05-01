import renderer from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react';

import ToggleWidget from '../src/widgets/ToggleWidget/ToggleWidget';
import { makeWidgetMockProps } from './helpers/createMocks';

describe('ToggleWidget', () => {
  test('renders correctly', () => {
    const tree = renderer.create(<ToggleWidget {...makeWidgetMockProps()} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders with custom label', () => {
    const tree = renderer
      .create(
        <ToggleWidget
          {...makeWidgetMockProps({
            label: 'Custom Toggle Label',
          })}
        />,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders disabled state correctly', () => {
    const tree = renderer
      .create(
        <ToggleWidget
          {...makeWidgetMockProps({
            disabled: true,
          })}
        />,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
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
