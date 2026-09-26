import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import CheckboxesWidget from '../src/widgets/CheckboxesWidget/CheckboxesWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

const objectOptions = [
  { label: 'One', value: { a: 1 } },
  { label: 'Two', value: { a: 2 } },
];

describe('CheckboxesWidget', () => {
  test('checks only the selected object options', () => {
    render(
      <CheckboxesWidget {...makeWidgetMockProps({ value: [{ a: 2 }], options: { enumOptions: objectOptions } })} />,
    );

    expect(screen.getByRole('checkbox', { name: 'Two' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'One' })).not.toBeChecked();
  });

  test('deselects an object option that is equal to, but not the same instance as, its constant', async () => {
    const onChange = vi.fn();
    render(
      <CheckboxesWidget
        {...makeWidgetMockProps({ value: [{ a: 1 }, { a: 2 }], onChange, options: { enumOptions: objectOptions } })}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'One' }));

    expect(onChange).toHaveBeenLastCalledWith([{ a: 2 }]);
  });

  test('selecting an object option appends its value', async () => {
    const onChange = vi.fn();
    render(
      <CheckboxesWidget
        {...makeWidgetMockProps({ value: [{ a: 2 }], onChange, options: { enumOptions: objectOptions } })}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'One' }));

    expect(onChange).toHaveBeenLastCalledWith([{ a: 2 }, { a: 1 }]);
  });
});
