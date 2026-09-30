import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AppearanceControl from '../../src/components/AppearanceControl.tsx';
import { APPEARANCE_STORAGE_KEY } from '../../src/layout/AppearanceContext.ts';
import { Layout } from '../../src/layout/Layout.tsx';

describe('AppearanceControl', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('persists the dark appearance across mounts', () => {
    const view = render(
      <Layout>
        <AppearanceControl />
      </Layout>,
    );
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Appearance' }));
    expect(document.body.style.overflow).not.toBe('hidden');
    fireEvent.click(screen.getByRole('option', { name: 'Dark' }));

    expect(view.container.querySelector('.playground-shell--dark')).not.toBeNull();
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark');

    view.unmount();
    const restored = render(
      <Layout>
        <AppearanceControl />
      </Layout>,
    );
    expect(restored.container.querySelector('.playground-shell--dark')).not.toBeNull();
  });

  it('restores a previously saved appearance', () => {
    localStorage.setItem('rjsf-playground-color-preference', 'dark');
    const view = render(
      <Layout>
        <AppearanceControl />
      </Layout>,
    );
    expect(view.container.querySelector('.playground-shell--dark')).not.toBeNull();
  });
});
