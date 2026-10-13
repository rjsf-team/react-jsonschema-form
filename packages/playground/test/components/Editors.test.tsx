import type { ComponentProps } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { cleanup, render, screen } from '@testing-library/react';

import Editors from '../../src/components/Editors.tsx';

vi.mock('@monaco-editor/react', () => ({
  Editor: ({ theme }: { theme: string }) => <textarea aria-label='JSON editor' data-theme={theme} />,
}));

vi.mock('../../src/components/ThemeSelector.tsx', () => ({ default: () => null }));
vi.mock('../../src/components/SubthemeSelector.tsx', () => ({ default: () => null }));

const props: ComponentProps<typeof Editors> = {
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
  theme: 'default',
  subtheme: null,
  onThemeSelected: vi.fn(),
  setSubtheme: vi.fn(),
  setStylesheet: vi.fn(),
};

describe('Editors appearance', () => {
  afterEach(cleanup);

  it('switches all Monaco editors when the surrounding MUI theme changes', () => {
    const view = render(
      <ThemeProvider theme={createTheme({ palette: { mode: 'light' } })}>
        <Editors {...props} />
      </ThemeProvider>,
    );
    expect(screen.getAllByRole('textbox', { name: 'JSON editor' })).toHaveLength(3);
    screen.getAllByRole('textbox', { name: 'JSON editor' }).forEach((editor) => {
      expect(editor.getAttribute('data-theme')).toBe('vs-light');
    });
    view.rerender(
      <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
        <Editors {...props} />
      </ThemeProvider>,
    );
    screen.getAllByRole('textbox', { name: 'JSON editor' }).forEach((editor) => {
      expect(editor.getAttribute('data-theme')).toBe('vs-dark');
    });
  });
});
