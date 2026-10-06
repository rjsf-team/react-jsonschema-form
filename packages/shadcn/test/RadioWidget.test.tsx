import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import RadioWidget from '../src/RadioWidget/RadioWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const enumOptions = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
];

describe('RadioWidget', () => {
  test.each(['indexed', 'realValue'] as const)(
    'follows controlled value changes with %s option values',
    (optionValueFormat) => {
      const props = makeWidgetMockProps({
        readonly: false,
        value: 'alpha',
        options: { enumOptions, optionValueFormat },
      });
      const { rerender } = render(<RadioWidget {...props} />);
      expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Beta' })).not.toBeChecked();
      rerender(<RadioWidget {...props} value='beta' />);
      expect(screen.getByRole('radio', { name: 'Alpha' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked();
      rerender(<RadioWidget {...props} value={undefined} />);
      expect(screen.getAllByRole('radio').every((radio) => radio.getAttribute('aria-checked') === 'false')).toBe(true);
    },
  );

  test('a disabled enum option cannot be selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioWidget
        {...makeWidgetMockProps({
          readonly: false,
          value: 'alpha',
          onChange,
          options: { enumOptions, enumDisabled: ['beta'] },
        })}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Beta' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
  });
});
