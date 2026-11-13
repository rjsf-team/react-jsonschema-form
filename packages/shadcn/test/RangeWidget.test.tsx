import type { RJSFSchema } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import RangeWidget from '../src/RangeWidget/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe('RangeWidget', () => {
  test.each([5, '5'])('draws and shows the value %j', (value) => {
    render(<RangeWidget {...makeWidgetMockProps({ schema: { type: 'number' }, value })} />);

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '5');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test.each(['', ' ', false, true, []])('draws %j, which holds no number, at the minimum', (value) => {
    render(<RangeWidget {...makeWidgetMockProps({ schema: { type: 'number', minimum: 10, maximum: 20 }, value })} />);

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '10');
  });

  test('draws an object value at the minimum, showing nothing beside the slider', () => {
    const { container } = render(
      <RangeWidget {...makeWidgetMockProps({ schema: { type: 'number', minimum: 2 }, value: { a: 1 } })} />,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '2');
    expect(container).toHaveTextContent('');
  });

  test.each<[RJSFSchema, unknown]>([
    [{ type: 'string' }, '8'],
    [{ type: 'number' }, 8],
  ])('writes a %j field the type it stores', async (schema, expected) => {
    const onChange = vi.fn();
    render(
      <RangeWidget {...makeWidgetMockProps({ schema, value: '7', readonly: false, autofocus: false, onChange })} />,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenLastCalledWith(expected);
  });
});
