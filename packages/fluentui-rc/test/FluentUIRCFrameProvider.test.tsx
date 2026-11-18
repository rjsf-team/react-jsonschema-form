import { render } from '@testing-library/react';
import { FrameContextConsumer } from 'react-frame-component';

import { __createFluentUIRCFrameProvider } from '../src/FluentUIRCFrameProvider.tsx';

describe('__createFluentUIRCFrameProvider', () => {
  it.each([
    ['light', 'rgb(255, 255, 255)'],
    ['dark', 'rgb(41, 41, 41)'],
  ] as const)("paints the frame's page in the Teams %s background", (colorScheme, background) => {
    const iframe = document.body.appendChild(document.createElement('iframe'));
    const frameDocument = iframe.contentDocument;
    if (!frameDocument?.defaultView) {
      throw new Error('The frame has no document');
    }
    const FluentUIRCFrame = __createFluentUIRCFrameProvider({ children: <p>Form</p>, colorScheme });

    render(<FluentUIRCFrame document={frameDocument} />, { container: frameDocument.body });

    expect(frameDocument.defaultView.getComputedStyle(frameDocument.body).backgroundColor).toBe(background);
  });

  it("leaves the page's own background alone outside a frame", () => {
    const FluentUIRCFrame = __createFluentUIRCFrameProvider({ children: <p>Form</p>, colorScheme: 'dark' });

    render(<FluentUIRCFrame />);

    expect(getComputedStyle(document.body).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it("leaves the host page's background alone under a FrameContextConsumer with no Frame around it", () => {
    // The consumer's default context hands over the host page's own document
    render(
      <FrameContextConsumer>
        {__createFluentUIRCFrameProvider({ children: <p>Form</p>, colorScheme: 'dark' })}
      </FrameContextConsumer>,
    );

    expect(getComputedStyle(document.body).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });
});
