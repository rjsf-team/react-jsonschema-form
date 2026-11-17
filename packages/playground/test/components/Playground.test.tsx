import type { ReactNode } from 'react';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Playground from '../../src/components/Playground.tsx';

const user = userEvent.setup();

// jsdom mounts nothing inside the demo frame's iframe, so the form renders in the page, inside an element that shows
// the subtheme the frame was given
vi.mock('../../src/components/DemoFrame.tsx', () => ({
  default: ({ children, subtheme }: { children: ReactNode; subtheme: string | null }) => (
    <div data-testid='demo-frame' data-subtheme={subtheme ?? 'none'}>
      {children}
    </div>
  ),
}));

/** Renders the playground on the `Simple` sample, whose `firstName` is `Chuck`, under two themes alike, each with a
 * subtheme of its own
 */
function renderPlayground() {
  const { container } = render(
    <Playground
      themes={{
        core: { stylesheet: '', theme: {}, subthemes: { coreSubtheme: { stylesheet: '' } } },
        other: { stylesheet: '', theme: {}, subthemes: { otherSubtheme: { stylesheet: '' } } },
      }}
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
  const select = (id: string, option: string) => {
    const selector = container.querySelector(`#${id}`);
    if (!selector) {
      throw new Error(`#${id} is not rendered`);
    }
    return user.selectOptions(selector, option);
  };
  return { firstName, reset, select };
}

describe('Playground', () => {
  it('resets the form to the sample it loaded, not to the latest edit', async () => {
    const { firstName, reset } = renderPlayground();
    await user.type(firstName(), 'X');

    await reset();

    expect(firstName()).toHaveValue('Chuck');
  });

  it('keeps an edit across a theme switch, which remounts the form', async () => {
    const { firstName, select } = renderPlayground();
    await user.type(firstName(), 'X');

    await select('rjsf_themeSelector', 'other');

    expect(firstName()).toHaveValue('ChuckX');
  });

  it("drops the picked subtheme on a theme switch, since it isn't one of the new theme's", async () => {
    const { select } = renderPlayground();
    await select('rjsf_subthemeSelector', 'coreSubtheme');
    expect(screen.getByTestId('demo-frame')).toHaveAttribute('data-subtheme', 'coreSubtheme');

    await select('rjsf_themeSelector', 'other');

    expect(screen.getByTestId('demo-frame')).toHaveAttribute('data-subtheme', 'none');
  });

  it("drops the picked subtheme when a sample loads the theme's own stylesheet", async () => {
    const { select } = renderPlayground();
    await select('rjsf_subthemeSelector', 'coreSubtheme');

    await user.click(screen.getByRole('tab', { name: 'Nested' }));

    await vi.waitFor(() => {
      expect(screen.getByTestId('demo-frame')).toHaveAttribute('data-subtheme', 'none');
    });
  });
});
