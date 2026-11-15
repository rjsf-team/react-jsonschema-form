import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import DemoFrame from '../../src/components/DemoFrame.tsx';

function PreviewMode() {
  return <output>{useTheme().palette.mode}</output>;
}

describe('DemoFrame', () => {
  it('renders the mui preview in its default light theme under a dark playground', async () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
        <DemoFrame title='Form preview' theme='mui' subtheme='light'>
          <PreviewMode />
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

    await waitFor(() => {
      expect(frameDocument.querySelector('output')).toHaveTextContent('light');
    });
  });
});
