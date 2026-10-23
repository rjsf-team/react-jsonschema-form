import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import RadioWidget from '../src/widgets/RadioWidget/RadioWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

const objectOptions = [
  { label: 'One', value: { a: 1 } },
  { label: 'Two', value: { a: 2 } },
];

const stringOptions = [
  { label: 'One', value: 'one' },
  { label: 'Two', value: 'two' },
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

    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('id', 'test-id__0');
    expect(screen.getByRole('radio', { name: 'Two' })).toHaveAttribute('id', 'test-id__1');
  });

  test('selecting an object option fires onChange with its value', async () => {
    const onChange = vi.fn();
    render(
      <RadioWidget {...makeWidgetMockProps({ value: undefined, onChange, options: { enumOptions: objectOptions } })} />,
    );

    await user.click(screen.getByRole('radio', { name: 'Two' }));

    expect(onChange).toHaveBeenLastCalledWith({ a: 2 });
  });

  test('disables only the options ui:enumDisabled lists', () => {
    render(
      <RadioWidget
        {...makeWidgetMockProps({
          value: undefined,
          options: { enumOptions: stringOptions, enumDisabled: ['two'] },
        })}
      />,
    );

    expect(screen.getByRole('radio', { name: 'One' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'Two' })).toBeDisabled();
  });

  test('marks the label of a disabled option as not clickable', () => {
    render(
      <RadioWidget
        {...makeWidgetMockProps({
          value: undefined,
          options: { enumOptions: stringOptions, enumDisabled: ['two'] },
        })}
      />,
    );

    expect(screen.getByText('One').closest('label')).toHaveClass('cursor-pointer');
    expect(screen.getByText('Two').closest('label')).toHaveClass('cursor-not-allowed');
    expect(screen.getByText('Two').closest('label')).not.toHaveClass('cursor-pointer');
    expect(screen.getByText('Two')).toHaveClass('opacity-50');
  });
});
