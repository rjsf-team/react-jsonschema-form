import type { ReactNode } from 'react';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';

import DemoFrame from '../../src/components/DemoFrame.tsx';

function PreviewMode() {
  return <output>{useTheme().palette.mode}</output>;
}

/** Renders `DemoFrame` for `theme` under a playground in `mode` and returns the preview's document once it loaded */
function renderPreview(theme: string, mode: 'light' | 'dark', children: ReactNode = null) {
  render(
    <ThemeProvider theme={createTheme({ palette: { mode } })}>
      <DemoFrame title='Form preview' theme={theme} subtheme='light'>
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

describe('DemoFrame', () => {
  it('renders the mui preview in its default light theme under a dark playground', async () => {
    const frameDocument = renderPreview('mui', 'dark', <PreviewMode />);

    await vi.waitFor(() => {
      expect(frameDocument.querySelector('output')).toHaveTextContent('light');
    });
  });

  it.each(['light', 'dark'] as const)('gives the core preview the %s appearance of the playground', async (mode) => {
    const frameDocument = renderPreview('core', mode);

    await vi.waitFor(() => {
      expect(getComputedStyle(frameDocument.documentElement).colorScheme).toBe(mode);
    });
  });

  it('leaves the color scheme of other previews to their theme', async () => {
    const frameDocument = renderPreview('bootstrap3', 'dark', <PreviewMode />);

    await vi.waitFor(() => {
      expect(frameDocument.querySelector('output')).not.toBeNull();
    });
    expect(getComputedStyle(frameDocument.documentElement).colorScheme).toBe('normal');
  });
});
