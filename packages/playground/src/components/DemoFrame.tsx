import { cloneElement, useCallback, useEffect, useRef, useState, ReactElement, ReactNode } from 'react';
import { CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache, { EmotionCache } from '@emotion/cache';
import Frame, { FrameComponentProps, FrameContextConsumer } from 'react-frame-component';
import { Widgets } from '@rjsf/antd';
import { __createChakraFrameProvider } from '@rjsf/chakra-ui';
import { StyleProvider as AntdStyleProvider } from '@ant-design/cssinjs';
import { __createFluentUIRCFrameProvider } from '@rjsf/fluentui-rc';
import { __createDaisyUIFrameProvider } from '@rjsf/daisyui';
import { MantineProvider } from '@mantine/core';
import { ConfigProvider } from 'antd';
import { PrimeReactProvider } from 'primereact/api';

const DEMO_FRAME_JSS = 'demo-frame-jss';

const { SelectWidget } = Widgets;

// Override the static function on the antd `SelectWidget` so that we can "disable" the getPopupContainer callback
// function because, when it is active, the `SelectPatcher` code below along with the `ConfigProvider` for the antd
// theme conditional branch won't take effect as the antd `Select` `getPopupContainer()` supercedes it, so we make it
// return undefined to disable it.
// @ts-expect-error TS2339 because the Widget interface doesn't have the static function on it
SelectWidget.getPopupContainerCallback = () => undefined;

/*
Adapted from https://github.com/mui-org/material-ui/blob/master/docs/src/modules/components/DemoSandboxed.js

The MIT License (MIT)

Copyright (c) 2014 Call-Em-All

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/** This is a hack to fix the antd `SelectWidget` so that the popup works properly within the iframe of the playground.
 * It basically observes when the `antd-select-dropdown` is created and attaches a dropdown positioning callback that is
 * tracking the scrolling of the iFrome document and fixing up the dropdown's `inset` style attribute so that it is
 * positioned properly.
 *
 * @param frameDoc - The iFrame document of the playground
 */
function AntdSelectPatcher({ frameDoc }: { frameDoc: Document }) {
  useEffect(() => {
    if (!frameDoc) {
      return;
    }

    const handleDropdownPositioning = (dropdown: HTMLElement) => {
      const style = dropdown.style;

      // Check if dropdown needs repositioning
      const isHidden = style.inset && style.inset.includes('-1000vh');
      if (isHidden) {
        const trigger = frameDoc.querySelector('.ant-select-focused, .ant-select-open');

        if (trigger) {
          const rect = trigger.getBoundingClientRect();
          // Get scroll offsets
          const scrollTop = frameDoc.documentElement.scrollTop || frameDoc.body.scrollTop;
          const scrollLeft = frameDoc.documentElement.scrollLeft || frameDoc.body.scrollLeft;

          // Calculate absolute position accounting for scroll
          const top = rect.bottom + scrollTop + 4;
          const left = rect.left + scrollLeft;

          // Position the dropdown BELOW the select
          dropdown.style.inset = `${top}px auto auto ${left}px`;
          dropdown.style.position = 'absolute';
        }
      }
    };

    const createObserver = () => {
      return new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const dropdown = mutation.target as HTMLElement;

            if (dropdown.classList.contains('ant-select-dropdown')) {
              handleDropdownPositioning(dropdown);
            }
          }

          // Also check for newly added dropdowns
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                const element = node as HTMLElement;
                if (element.classList.contains('ant-select-dropdown')) {
                  handleDropdownPositioning(element);
                }
              }
            });
          }
        });
      });
    };

    // Observe iframe document
    const iframeObserver = createObserver();
    iframeObserver.observe(frameDoc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // Also reposition on scroll
    const handleScroll = () => {
      const dropdowns = frameDoc.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
      dropdowns.forEach((dropdown) => {
        handleDropdownPositioning(dropdown as HTMLElement);
      });
    };
    frameDoc.addEventListener('scroll', handleScroll, true);
    return () => {
      iframeObserver.disconnect();
      frameDoc.removeEventListener('scroll', handleScroll, true);
    };
  }, [frameDoc]);

  return null;
}

interface DemoFrameProps extends FrameComponentProps {
  theme: string;
  /** override children to be ReactElement to avoid Typescript issue. In this case we don't need to worry about
   * children being of the other valid ReactNode types, undefined and string as it always contains an RJSF `Form`
   */
  children: ReactElement;
  subtheme: string;
}

export default function DemoFrame(props: DemoFrameProps) {
  const { children, head, theme, subtheme, ...frameProps } = props;

  const [ready, setReady] = useState(false);
  const [emotionCache, setEmotionCache] = useState<EmotionCache>(createCache({ key: 'css' }));
  const [container, setContainer] = useState();
  const [window, setWindow] = useState();

  const instanceRef = useRef<any>();

  const onContentDidMount = useCallback(() => {
    setReady(true);
    setEmotionCache(
      createCache({
        key: 'css',
        prepend: true,
        container: instanceRef.current.contentWindow[DEMO_FRAME_JSS],
      }),
    );
    setContainer(instanceRef.current.contentDocument.body);
    setWindow(() => instanceRef.current.contentWindow);
  }, [instanceRef]);

  let body: ReactNode = children;
  if (theme === 'mui') {
    body = ready ? (
      <CacheProvider value={emotionCache}>
        <CssBaseline />
        {cloneElement(children, {
          container: container,
          window: window,
        })}
      </CacheProvider>
    ) : null;
  } else if (theme === 'fluentui-rc') {
    body = <FrameContextConsumer>{__createFluentUIRCFrameProvider(props)}</FrameContextConsumer>;
  } else if (theme === 'chakra-ui') {
    body = <FrameContextConsumer>{__createChakraFrameProvider(props)}</FrameContextConsumer>;
  } else if (theme === 'antd') {
    body = ready ? (
      <FrameContextConsumer>
        {({ document: frameDoc }) => {
          const jssContainer =
            frameDoc?.getElementById(DEMO_FRAME_JSS) || instanceRef.current.contentWindow[DEMO_FRAME_JSS];
          return (
            <>
              <AntdSelectPatcher frameDoc={frameDoc || instanceRef.current.contentDocument} />
              <AntdStyleProvider container={jssContainer}>
                <ConfigProvider getPopupContainer={() => jssContainer.parentElement}>{children}</ConfigProvider>
              </AntdStyleProvider>
            </>
          );
        }}
      </FrameContextConsumer>
    ) : null;
  } else if (theme === 'daisy-ui') {
    body = ready ? (
      <FrameContextConsumer>
        {__createDaisyUIFrameProvider({
          ...props,
          subtheme: { dataTheme: subtheme },
        })}
      </FrameContextConsumer>
    ) : null;
  } else if (theme === 'primereact') {
    body = ready ? (
      <>
        <style>{`html { font-weight: 400; font-size: 14px; color: var(--text-color); }`}</style>
        <link href='//cdn.jsdelivr.net/npm/primeicons@7.0.0/primeicons.min.css' rel='stylesheet' />
        <PrimeReactProvider value={{ styleContainer: container, appendTo: 'self' }}>{children}</PrimeReactProvider>
      </>
    ) : null;
  } else if (theme === 'mantine') {
    body = ready ? (
      <FrameContextConsumer>
        {({ document }) => (
          <MantineProvider getRootElement={() => document?.body} cssVariablesSelector='body'>
            {children}
          </MantineProvider>
        )}
      </FrameContextConsumer>
    ) : null;
  }

  return (
    <Frame ref={instanceRef} contentDidMount={onContentDidMount} head={head} {...frameProps}>
      <div id={DEMO_FRAME_JSS} />
      {body}
    </Frame>
  );
}
