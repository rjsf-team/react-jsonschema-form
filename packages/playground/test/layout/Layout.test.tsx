import type { ComponentProps } from 'react';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Editors from '../../src/components/Editors.tsx';
import { APPEARANCE_STORAGE_KEY, Layout } from '../../src/layout/Layout.tsx';

const user = userEvent.setup();

vi.mock('@monaco-editor/react', () => ({
  Editor: ({ theme }: { theme: string }) => <textarea aria-label='JSON editor' data-theme={theme} />,
}));

const editorsProps: ComponentProps<typeof Editors> = {
  loadKey: 0,
  schema: {},
  uiSchema: {},
  formData: {},
  extraErrors: undefined,
  setSchema: vi.fn(),
  setUiSchema: vi.fn(),
  setFormData: vi.fn(),
  setExtraErrors: vi.fn(),
  setShareURL: vi.fn(),
  hasUiSchemaGenerator: false,
  themes: {},
  theme: 'core',
  subtheme: null,
  onThemeSelected: vi.fn(),
  setSubtheme: vi.fn(),
  setStylesheet: vi.fn(),
};

/** A `prefers-color-scheme: dark` query whose answer a test can change, in the shape MUI listens to */
function stubSystemDark(matches: boolean) {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  const query = {
    matches,
    addListener: (listener: (event: { matches: boolean }) => void) => listeners.add(listener),
    removeListener: (listener: (event: { matches: boolean }) => void) => listeners.delete(listener),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  );
  return (nextMatches: boolean) => {
    query.matches = nextMatches;
    listeners.forEach((listener) => listener({ matches: nextMatches }));
  };
}

function renderPlaygroundShell() {
  render(
    <Layout>
      <Editors {...editorsProps} />
    </Layout>,
  );
  const editorThemes = () =>
    screen.getAllByRole('textbox', { name: 'JSON editor' }).map((editor) => editor.getAttribute('data-theme'));
  const appearance = (name: string) => screen.getByRole('button', { name });
  return { editorThemes, appearance };
}

describe('Layout appearance', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows the system appearance, live, until one is picked', () => {
    const setSystemDark = stubSystemDark(true);
    const { editorThemes, appearance } = renderPlaygroundShell();

    expect(appearance('System')).toHaveAttribute('aria-pressed', 'true');
    expect(editorThemes()).toEqual(['vs-dark', 'vs-dark', 'vs-dark']);

    act(() => setSystemDark(false));

    expect(editorThemes()).toEqual(['vs-light', 'vs-light', 'vs-light']);
  });

  it('switches the editors and keeps the choice for the next visit', async () => {
    stubSystemDark(false);
    const { editorThemes, appearance } = renderPlaygroundShell();

    await user.click(appearance('Dark'));

    expect(appearance('Dark')).toHaveAttribute('aria-pressed', 'true');
    expect(editorThemes()).toEqual(['vs-dark', 'vs-dark', 'vs-dark']);
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark');
  });

  it('restores a stored choice over the system appearance', () => {
    stubSystemDark(true);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, 'light');
    const { editorThemes, appearance } = renderPlaygroundShell();

    expect(appearance('Light')).toHaveAttribute('aria-pressed', 'true');
    expect(editorThemes()).toEqual(['vs-light', 'vs-light', 'vs-light']);
  });

  it('does not store anything until a choice is made', () => {
    stubSystemDark(false);
    renderPlaygroundShell();

    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull();
  });
});
