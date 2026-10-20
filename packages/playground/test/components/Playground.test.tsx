import type { ReactNode } from 'react';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Playground from '../../src/components/Playground.tsx';

const user = userEvent.setup();

// jsdom mounts nothing inside the demo frame's iframe, so the form renders in the page
vi.mock('../../src/components/DemoFrame.tsx', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

/** Renders the playground on the `Simple` sample, whose `firstName` is `Chuck`, under two themes alike */
function renderPlayground() {
  const { container } = render(
    <Playground
      themes={{ default: { stylesheet: '', theme: {} }, other: { stylesheet: '', theme: {} } }}
      validators={{ AJV8: validator }}
    />,
  );
  const firstName = () => {
    const input = container.querySelector<HTMLInputElement>('#root_firstName');
    if (!input) {
      throw new Error('The first name field is not rendered');
    }
    return input;
  };
  const reset = () => user.click(screen.getByTitle('Click me to reset the form programmatically.'));
  return { container, firstName, reset };
}

describe('Playground', () => {
  it('resets the form to the sample it loaded, not to the latest edit', async () => {
    const { firstName, reset } = renderPlayground();
    await user.type(firstName(), 'X');

    await reset();

    expect(firstName()).toHaveValue('Chuck');
  });

  it('keeps an edit across a theme switch, which remounts the form', async () => {
    const { container, firstName } = renderPlayground();
    await user.type(firstName(), 'X');
    const themeSelect = container.querySelector('#rjsf_themeSelector');
    if (!themeSelect) {
      throw new Error('The theme selector is not rendered');
    }

    await user.selectOptions(themeSelect, 'other');

    expect(firstName()).toHaveValue('ChuckX');
  });
});
