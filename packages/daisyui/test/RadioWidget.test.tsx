import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import RadioWidget from '../src/widgets/RadioWidget/RadioWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

const objectOptions = [
  { label: 'One', value: { a: 1 } },
  { label: 'Two', value: { a: 2 } },
];

describe('RadioWidget', () => {
  test.each(['indexed', 'realValue'] as const)(
    'checks only the selected object option in the %s format',
    (optionValueFormat) => {
      render(
        <RadioWidget
          {...makeWidgetMockProps({ value: { a: 2 }, options: { enumOptions: objectOptions, optionValueFormat } })}
        />,
      );

      expect(screen.getByRole('radio', { name: 'Two' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'One' })).not.toBeChecked();
    },
  );

  test('gives each object option its own id', () => {
    render(<RadioWidget {...makeWidgetMockProps({ value: undefined, options: { enumOptions: objectOptions } })} />);

    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('id', 'test-id-0');
    expect(screen.getByRole('radio', { name: 'Two' })).toHaveAttribute('id', 'test-id-1');
  });

  test('selecting an object option fires onChange with its value', async () => {
    const onChange = vi.fn();
    render(
      <RadioWidget {...makeWidgetMockProps({ value: undefined, onChange, options: { enumOptions: objectOptions } })} />,
    );

    await user.click(screen.getByRole('radio', { name: 'Two' }));

    expect(onChange).toHaveBeenLastCalledWith({ a: 2 });
  });
});
