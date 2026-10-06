import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import AppearanceControl from '../../src/components/AppearanceControl.tsx';
import { AppearanceContext } from '../../src/layout/AppearanceContext.ts';

const user = userEvent.setup();
const setAppearance = vi.fn();
const systemAppearance = { appearance: 'system' as const, setAppearance };
const lightAppearance = { appearance: 'light' as const, setAppearance };

describe('AppearanceControl', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('offers all three appearances and updates the context preference', async () => {
    render(
      <AppearanceContext.Provider value={systemAppearance}>
        <AppearanceControl />
      </AppearanceContext.Provider>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Appearance' }));
    expect(screen.getByRole('option', { name: 'System' })).not.toBeNull();
    expect(screen.getByRole('option', { name: 'Light' })).not.toBeNull();
    await user.click(screen.getByRole('option', { name: 'Dark' }));

    expect(setAppearance).toHaveBeenCalledWith('dark');
  });

  it('keeps page scrolling enabled while the Appearance menu is open', async () => {
    render(
      <AppearanceContext.Provider value={lightAppearance}>
        <AppearanceControl />
      </AppearanceContext.Provider>,
    );
    const { overflow } = document.body.style;
    await user.click(screen.getByRole('combobox', { name: 'Appearance' }));
    expect(document.body.style.overflow).toBe(overflow);
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
