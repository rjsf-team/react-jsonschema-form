import { render, screen } from '@testing-library/react';

import RangeWidget from '../src/RangeWidget/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

describe('RangeWidget', () => {
  test.each([5, '5'])('draws and shows the value %j', (value) => {
    render(<RangeWidget {...makeWidgetMockProps({ schema: { type: 'number' }, value })} />);

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '5');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('draws an object value at the minimum, showing nothing beside the slider', () => {
    const { container } = render(
      <RangeWidget {...makeWidgetMockProps({ schema: { type: 'number', minimum: 2 }, value: { a: 1 } })} />,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '2');
    expect(container).toHaveTextContent('');
  });
});
