import type { ReactNode } from 'react';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Playground from '../../src/components/Playground.tsx';

const user = userEvent.setup();

// jsdom mounts nothing inside the demo frame's iframe, so the form renders in the page, inside an element that shows
// the subtheme and the stylesheets the frame was given
vi.mock('../../src/components/DemoFrame.tsx', () => ({
  default: ({ children, head, subtheme }: { children: ReactNode; head: ReactNode; subtheme: string | null }) => (
    <div data-testid='demo-frame' data-subtheme={subtheme ?? 'none'}>
      {head}
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
        core: { stylesheet: 'core.css', theme: {}, subthemes: { coreSubtheme: { stylesheet: 'coreSubtheme.css' } } },
        other: {
          stylesheet: 'other.css',
          theme: {},
          subthemes: { otherSubtheme: { stylesheet: 'otherSubtheme.css' } },
        },
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
  const stylesheets = () =>
    Array.from(screen.getByTestId('demo-frame').querySelectorAll('link'), (link) => link.getAttribute('href'));
  return { firstName, reset, select, stylesheets };
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

  it('keeps the picked subtheme and its stylesheet across a sample load, which keeps the theme', async () => {
    const { select, stylesheets } = renderPlayground();
    await select('rjsf_subthemeSelector', 'coreSubtheme');

    await user.click(screen.getByRole('tab', { name: 'Nested' }));

    await vi.waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Nested', selected: true })).toBeInTheDocument();
    });
    expect(screen.getByTestId('demo-frame')).toHaveAttribute('data-subtheme', 'coreSubtheme');
    expect(stylesheets()).toEqual(['coreSubtheme.css']);
    expect(screen.getByRole('combobox', { name: 'Subtheme' })).toHaveValue('0');
  });

  it('leaves constAsDefaults unset until one is picked, so a form starts as one given no such setting does', () => {
    const { container } = render(
      <Playground themes={{ core: { stylesheet: 'core.css', theme: {} } }} validators={{ AJV8: validator }} />,
    );

    expect(container.querySelector('#rjsf_options_defaultFormStateBehavior_constAsDefaults')).toHaveValue('');
  });
});
