import { ThemeProvider, createTheme, useTheme } from '@mui/material';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import DemoFrame from '../../src/components/DemoFrame.tsx';

vi.mock('@rjsf/antd', () => ({ Widgets: { SelectWidget: vi.fn(), DateWidget: vi.fn() } }));
vi.mock('@rjsf/chakra-ui', () => ({ __createChakraFrameProvider: vi.fn() }));
vi.mock('@rjsf/daisyui', () => ({ __createDaisyUIFrameProvider: vi.fn() }));
vi.mock('@rjsf/fluentui-rc', () => ({ __createFluentUIRCFrameProvider: vi.fn() }));
vi.mock('@mantine/core', () => ({ MantineProvider: vi.fn() }));
vi.mock('antd', () => ({ ConfigProvider: vi.fn() }));
vi.mock('@ant-design/cssinjs', () => ({ StyleProvider: vi.fn() }));

function PreviewTheme() {
  return <output>{useTheme().palette.mode}</output>;
}

describe('DemoFrame appearance', () => {
  afterEach(cleanup);

  it.each(['default', 'mui'])('isolates the %s preview from the dark Playground theme', async (theme) => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
        <DemoFrame title='Form preview' theme={theme} subtheme='light'>
          <PreviewTheme />
        </DemoFrame>
      </ThemeProvider>,
    );
    const iframe = screen.getByTitle<HTMLIFrameElement>('Form preview');
    // jsdom does not parse the iframe's srcdoc, so supply its normal portal mount point.
    const document = iframe.contentDocument;
    if (document) {
      const target = document.createElement('div');
      target.className = 'frame-root';
      document.body.appendChild(target);
    }
    // Loading an iframe is a browser lifecycle event, not a user interaction.
    fireEvent.load(iframe);
    await waitFor(() => {
      expect(iframe.contentDocument?.querySelector('output')?.textContent).toBe('light');
    });
  });
});
