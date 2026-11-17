import type { ReactNode } from 'react';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { theme as antdTheme } from 'antd';

import DemoFrame from '../../src/components/DemoFrame.tsx';

function MuiMode() {
  return <output>{useTheme().palette.mode}</output>;
}

function AntdContainerColor() {
  return <output>{antdTheme.useToken().token.colorBgContainer}</output>;
}

/** Renders `DemoFrame` for `theme` under a playground in `mode` and returns the preview's document once it loaded */
function renderPreview(
  theme: string,
  mode: 'light' | 'dark',
  children: ReactNode = <output />,
  subtheme: string | null = null,
) {
  render(
    <ThemeProvider theme={createTheme({ palette: { mode } })}>
      <DemoFrame title='Form preview' theme={theme} subtheme={subtheme}>
        {children}
      </DemoFrame>
    </ThemeProvider>,
  );
  const iframe = screen.getByTitle<HTMLIFrameElement>('Form preview');
  const frameDocument = iframe.contentDocument;
  if (!frameDocument) {
    throw new Error('The preview frame has no document');
  }
  // jsdom doesn't parse the iframe's `srcdoc`, so add the mount point react-frame-component renders into
  const mountTarget = frameDocument.createElement('div');
  mountTarget.className = 'frame-root';
  frameDocument.body.appendChild(mountTarget);
  // An iframe finishing loading is a browser lifecycle event, not something a user does
  fireEvent.load(iframe);
  return frameDocument;
}

async function renderedOutput(frameDocument: Document) {
  return vi.waitFor(() => {
    const output = frameDocument.querySelector('output');
    if (!output) {
      throw new Error('The preview has not rendered');
    }
    return output;
  });
}

describe('DemoFrame', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['light', 'dark'] as const)('renders the mui preview in the %s mode of the playground', async (mode) => {
    const frameDocument = renderPreview('mui', mode, <MuiMode />);

    expect(await renderedOutput(frameDocument)).toHaveTextContent(mode);
  });

  it.each([
    ['light', '#ffffff'],
    ['dark', '#141414'],
  ] as const)('renders the antd preview with the %s algorithm', async (mode, containerColor) => {
    const frameDocument = renderPreview('antd', mode, <AntdContainerColor />);

    expect(await renderedOutput(frameDocument)).toHaveTextContent(containerColor);
  });

  it.each(['light', 'dark'] as const)('renders the mantine preview in the %s color scheme', async (mode) => {
    // Mantine reads the system scheme even when one is forced, and jsdom has no `matchMedia`
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    const frameDocument = renderPreview('mantine', mode);

    await renderedOutput(frameDocument);
    expect(frameDocument.body).toHaveAttribute('data-mantine-color-scheme', mode);
  });

  it.each(['light', 'dark'] as const)(
    'paints the fluentui-rc preview page in the Teams %s background',
    async (mode) => {
      const frameDocument = renderPreview('fluentui-rc', mode);

      await renderedOutput(frameDocument);
      expect(getComputedStyle(frameDocument.body).backgroundColor).toBe(
        mode === 'dark' ? 'rgb(41, 41, 41)' : 'rgb(255, 255, 255)',
      );
    },
  );

  it.each([
    ['core', false, false],
    ['mui', false, false],
    ['mantine', false, false],
    ['antd', false, false],
    ['chakra-ui', true, false],
    ['fluentui-rc', false, false],
    ['react-bootstrap', false, true],
    ['shadcn', true, false],
  ])(
    'marks the %s preview root with the playground mode only where its stylesheet reads it',
    async (theme, darkClass, bootstrapTheme) => {
      // Mantine reads the system scheme even when one is forced, and jsdom has no `matchMedia`
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
      );
      const frameDocument = renderPreview(theme, 'dark');
      const root = frameDocument.documentElement;

      await vi.waitFor(() => {
        expect(getComputedStyle(root).colorScheme).toBe('dark');
      });
      expect(root.classList.contains('dark')).toBe(darkClass);
      expect(root.hasAttribute('data-bs-theme')).toBe(bootstrapTheme);
      if (bootstrapTheme) {
        expect(root).toHaveAttribute('data-bs-theme', 'dark');
      }
    },
  );

  it.each([
    ['core', ''],
    ['react-bootstrap', ''],
    ['bootstrap3', 'white'],
    ['daisy-ui', 'white'],
  ])(
    'gives the %s preview frame a background of %o, so only a preview that keeps its own look shows white before its stylesheet loads',
    (theme, background) => {
      renderPreview(theme, 'dark');

      expect(screen.getByTitle('Form preview').style.background).toBe(background);
    },
  );

  it.each([
    ['core', 'canvas'],
    ['shadcn', 'var(--background)'],
  ])('gives the %s preview, which paints no page of its own, a page background', async (theme, background) => {
    const frameDocument = renderPreview(theme, 'dark');

    await vi.waitFor(() => {
      expect(frameDocument.documentElement.style.background).toBe(background);
    });
  });

  it.each(['light', 'dark'] as const)("shows daisyUI's own %s theme until a subtheme is picked", async (mode) => {
    const frameDocument = renderPreview('daisy-ui', mode);

    await renderedOutput(frameDocument);
    expect(frameDocument.querySelector('.daisy-ui-theme')).toHaveAttribute('data-theme', mode);
  });

  it('shows a picked daisy-ui subtheme whatever the playground mode', async () => {
    const frameDocument = renderPreview('daisy-ui', 'dark', <output />, 'cupcake');

    await renderedOutput(frameDocument);
    expect(frameDocument.querySelector('.daisy-ui-theme')).toHaveAttribute('data-theme', 'cupcake');
  });

  it.each(['bootstrap3', 'daisy-ui'])('leaves the %s preview root to its own theme', async (theme) => {
    const frameDocument = renderPreview(theme, 'dark');
    const root = frameDocument.documentElement;

    await renderedOutput(frameDocument);
    expect(getComputedStyle(root).colorScheme).toBe('normal');
    expect(root).not.toHaveClass('dark');
    expect(root).not.toHaveAttribute('data-bs-theme');
  });
});
