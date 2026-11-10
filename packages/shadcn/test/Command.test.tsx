import { render } from '@testing-library/react';

import { Command, CommandInput, CommandList } from '../src/components/ui/command.tsx';

describe('Command', () => {
  test("drops its hidden label's `for` while it renders no input, and restores it once it renders one", () => {
    const { container, rerender } = render(
      <Command withoutInput>
        <CommandList />
      </Command>,
    );
    const label = container.querySelector('label[cmdk-label]');
    expect(label).not.toHaveAttribute('for');

    rerender(
      <Command>
        <CommandInput />
        <CommandList />
      </Command>,
    );

    const input = container.querySelector('input[cmdk-input]');
    expect(input).toHaveAttribute('id');
    expect(label).toHaveAttribute('for', input?.id);
  });
});
