import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleProvider as AntdStyleProvider } from '@ant-design/cssinjs';
import type { EmotionCache } from '@emotion/cache';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { MantineProvider } from '@mantine/core';
import type { PaletteMode } from '@mui/material';
import { CssBaseline, ThemeProvider, createTheme, useTheme } from '@mui/material';
import { Widgets } from '@rjsf/antd';
import { __createChakraFrameProvider } from '@rjsf/chakra-ui';
import { __createDaisyUIFrameProvider } from '@rjsf/daisyui';
import { __createFluentUIRCFrameProvider } from '@rjsf/fluentui-rc';
import type { ThemeConfig } from 'antd';
import { ConfigProvider, theme as antdTheme } from 'antd';
import type { FrameComponentProps } from 'react-frame-component';
import Frame, { FrameContextConsumer } from 'react-frame-component';

const DEMO_FRAME_JSS = 'demo-frame-jss';
// The MUI preview reads its theme from React context, which crosses into the iframe, so it gets a theme of its own:
// MUI's default look in the playground's light or dark mode, not the playground's own theme
const muiPreviewThemes = { light: createTheme(), dark: createTheme({ palette: { mode: 'dark' } }) };
const antdPreviewThemes: Record<PaletteMode, ThemeConfig> = {
  light: { algorithm: antdTheme.defaultAlgorithm },
  dark: { algorithm: antdTheme.darkAlgorithm },
};

/** How a theme's preview takes the playground's light or dark appearance from the frame's root, beyond the root's
 * `color-scheme`, which native controls and the page canvas read
 */
interface PreviewAppearance {
  /** The marker the theme's stylesheet reads: a `light`/`dark` class, or Bootstrap's `data-bs-theme` */
  rootMarker?: 'class' | 'data-bs-theme';
  /** The page background of a theme that paints none of its own, alike in both modes or one for each */
  pageBackground?: string | Record<PaletteMode, string>;
}

/** The themes whose preview follows the playground's appearance through the frame's root or their provider below.
 * daisy-ui follows it too until a subtheme is picked, and bootstrap3 has a single look
 */
const PREVIEW_APPEARANCES: Record<string, PreviewAppearance> = {
  core: { pageBackground: 'Canvas' },
  mui: {},
  mantine: {},
  antd: {
    pageBackground: {
      light: antdTheme.getDesignToken(antdPreviewThemes.light).colorBgContainer,
      dark: antdTheme.getDesignToken(antdPreviewThemes.dark).colorBgContainer,
    },
  },
  'chakra-ui': { rootMarker: 'class' },
  'fluentui-rc': {},
  'react-bootstrap': { rootMarker: 'data-bs-theme' },
  shadcn: { rootMarker: 'class', pageBackground: 'var(--background)' },
};

/** daisy-ui's appearance while it shows daisyUI's own `light` or `dark` theme, which paints its page, so its root needs
 * only the matching `color-scheme`
 */
const DAISY_UI_APPEARANCE: PreviewAppearance = {};

/** Marks `root` with `mode` the way `appearance` reads it, and returns what undoes that */
function markRoot(root: HTMLElement, { rootMarker, pageBackground }: PreviewAppearance, mode: PaletteMode) {
  const styles = {
    'color-scheme': mode,
    background: typeof pageBackground === 'object' ? pageBackground[mode] : pageBackground,
  };
  const undos: (() => void)[] = Object.entries(styles).flatMap(([property, value]) => {
    if (!value) {
      return [];
    }
    root.style.setProperty(property, value);
    return [() => root.style.removeProperty(property)];
  });
  if (rootMarker === 'class') {
    root.classList.add(mode);
    undos.push(() => root.classList.remove(mode));
  } else if (rootMarker) {
    root.setAttribute(rootMarker, mode);
    undos.push(() => root.removeAttribute(rootMarker));
  }
  return () => undos.forEach((undo) => undo());
}

const { SelectWidget, DateWidget } = Widgets;

// Override the static functions on the antd widgets so that we can "disable" the getPopupContainer callback
// function because, when it is active, the `SelectPatcher` code below along with the `ConfigProvider` for the antd
// theme conditional branch won't take effect as the antd component `getPopupContainer()` supercedes it, so we make it
// return undefined to disable it.
SelectWidget.getPopupContainerCallback = () => undefined;
// DateWidget also covers DateTimeWidget since it delegates to DateWidget internally
DateWidget.getPopupContainerCallback = () => undefined;

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

/** This is a hack to fix antd popups (Select dropdown, DatePicker panel) so they work properly within the iframe of
 * the playground. The root issue is that antd's positioning code runs two passes: first it places the popup at
 * `-1000vh` to measure it, then calculates a final position. We need to override BOTH passes — not just the first —
 * because antd's final calculation uses `window.scrollY` from the parent window context (since react-frame-component
 * runs JS in the parent window), while `getBoundingClientRect()` returns iframe-relative coordinates. This mismatch
 * puts the popup in the wrong place when the iframe is scrolled.
 *
 * Strategy: observe every style change on popup elements and always reapply the correct position using the iframe's
 * own scroll offsets. A WeakMap tracks the inset value we last set so we can skip our own changes and avoid infinite
 * observer loops.
 *
 * @param frameDoc - The iFrame document of the playground
 */
function AntdPopupPatcher({ frameDoc }: { frameDoc?: Document }) {
  useEffect(() => {
    if (!frameDoc) {
      return () => {};
    }

    // Maps each popup element to the inset string we last wrote, so we can skip our own style changes.
    const ourInsets = new WeakMap<HTMLElement, string>();

    const correctPosition = (popup: HTMLElement, triggerSelector: string) => {
      if (
        popup.classList.contains('ant-select-dropdown-hidden') ||
        popup.classList.contains('ant-picker-dropdown-hidden')
      ) {
        return;
      }

      const trigger = frameDoc.querySelector(triggerSelector);
      if (!trigger) {
        // The popup is still visible but the trigger's open class is already gone — it's in the
        // process of closing. Restore our last known position so it doesn't flash to (0, 0)
        // during the close animation while antd resets its own inset before hiding the element.
        const lastInset = ourInsets.get(popup);
        if (lastInset !== undefined && popup.style.inset !== lastInset) {
          // since we are actually wanting to update the popup's style disable this rule
          // oxlint-disable no-param-reassign
          popup.style.position = 'absolute';
          popup.style.inset = lastInset;
          // oxlint-enable no-param-reassign
        }
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const scrollTop = frameDoc.documentElement.scrollTop || frameDoc.body.scrollTop;
      const scrollLeft = frameDoc.documentElement.scrollLeft || frameDoc.body.scrollLeft;

      const inset = `${rect.bottom + scrollTop + 4}px auto auto ${rect.left + scrollLeft}px`;
      ourInsets.set(popup, inset);
      // since we are actually wanting to update the popup's style disable this rule
      // oxlint-disable no-param-reassign
      popup.style.position = 'absolute';
      popup.style.inset = inset;
      popup.style.minWidth = `${rect.right - rect.left}px`;
      // oxlint-enable no-param-reassign
    };

    const handleElement = (el: HTMLElement) => {
      // Skip changes that we ourselves made (prevents infinite observer loop).
      if (ourInsets.has(el) && el.style.inset === ourInsets.get(el)) {
        return;
      }
      if (el.classList.contains('ant-select-dropdown')) {
        correctPosition(el, '.ant-select-focused, .ant-select-open');
      } else if (el.classList.contains('ant-picker-dropdown')) {
        correctPosition(el, '.ant-picker-focused, .ant-picker-open');
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          handleElement(mutation.target as HTMLElement);
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              handleElement(node as HTMLElement);
            }
          });
        }
      });
    });

    observer.observe(frameDoc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // Reposition visible popups on scroll so they track the trigger element.
    const handleScroll = () => {
      frameDoc
        .querySelectorAll<HTMLElement>('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
        .forEach((el) => correctPosition(el, '.ant-select-focused, .ant-select-open'));
      frameDoc
        .querySelectorAll<HTMLElement>('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)')
        .forEach((el) => correctPosition(el, '.ant-picker-focused, .ant-picker-open'));
    };
    frameDoc.addEventListener('scroll', handleScroll, true);

    return () => {
      observer.disconnect();
      frameDoc.removeEventListener('scroll', handleScroll, true);
    };
  }, [frameDoc]);

  return null;
}

interface DemoFrameProps extends FrameComponentProps {
  theme: string;
  /** The subtheme picked for the preview, if any */
  subtheme: string | null;
}

export default function DemoFrame(props: DemoFrameProps) {
  const { children, head, theme, subtheme, style, ...frameProps } = props;
  const { mode } = useTheme().palette;
  const daisyUIAppearance = theme === 'daisy-ui' && !subtheme ? DAISY_UI_APPEARANCE : undefined;
  const appearance = Object.hasOwn(PREVIEW_APPEARANCES, theme) ? PREVIEW_APPEARANCES[theme] : daisyUIAppearance;
  // The frame's document is loaded once, from this, so it starts in the scheme the playground was in then: a frame
  // whose `color-scheme` differs from its `<iframe>`'s gets an opaque canvas, which would flash before `markRoot`
  // takes over
  // oxlint-disable-next-line react/hook-use-state
  const [initialContent] = useState(
    () =>
      `<!DOCTYPE html><html${appearance ? ` style="color-scheme: ${mode}"` : ''}><head></head><body><div class="frame-root"></div></body></html>`,
  );

  const [ready, setReady] = useState(false);
  const [emotionCache, setEmotionCache] = useState<EmotionCache>(createCache({ key: 'css' }));

  const instanceRef = useRef<HTMLIFrameElement>(null);

  const onContentDidMount = useCallback(() => {
    const frameDoc = instanceRef.current?.contentDocument;
    setReady(true);
    setEmotionCache(
      createCache({
        key: 'css',
        prepend: true,
        container: frameDoc?.getElementById(DEMO_FRAME_JSS) ?? undefined,
      }),
    );
  }, []);

  // The frame's root element is outside React's tree. It runs before paint so the root switches together with the
  // providers below
  useLayoutEffect(() => {
    const root = instanceRef.current?.contentDocument?.documentElement;
    return ready && root && appearance ? markRoot(root, appearance, mode) : undefined;
  }, [ready, appearance, mode]);

  let body: ReactNode = children;
  if (theme === 'mui') {
    body = ready ? (
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={muiPreviewThemes[mode]}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    ) : null;
  } else if (theme === 'fluentui-rc') {
    body = (
      <FrameContextConsumer>{__createFluentUIRCFrameProvider({ children, colorScheme: mode })}</FrameContextConsumer>
    );
  } else if (theme === 'chakra-ui') {
    body = <FrameContextConsumer>{__createChakraFrameProvider(props)}</FrameContextConsumer>;
  } else if (theme === 'antd') {
    body = ready ? (
      <FrameContextConsumer>
        {({ document: frameDoc }) => {
          if (!frameDoc) {
            return null;
          }
          const jssContainer = frameDoc.getElementById(DEMO_FRAME_JSS) ?? undefined;
          return (
            <>
              <AntdPopupPatcher frameDoc={frameDoc} />
              <AntdStyleProvider container={jssContainer}>
                <ConfigProvider
                  getPopupContainer={() => jssContainer?.parentElement ?? frameDoc.body}
                  theme={antdPreviewThemes[mode]}
                >
                  {children}
                </ConfigProvider>
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
          // daisyUI's own `light` and `dark` themes, until another subtheme is picked. Only a picked one is stored as
          // the theme daisyUI shows where none is chosen, since the appearance is the playground's, kept under its own key
          subtheme: { dataTheme: subtheme || mode },
          storeTheme: Boolean(subtheme),
        })}
      </FrameContextConsumer>
    ) : null;
  } else if (theme === 'mantine') {
    body = ready ? (
      <FrameContextConsumer>
        {({ document }) => (
          <MantineProvider getRootElement={() => document?.body} cssVariablesSelector='body' forceColorScheme={mode}>
            {children}
          </MantineProvider>
        )}
      </FrameContextConsumer>
    ) : null;
  }

  return (
    <Frame
      ref={instanceRef}
      contentDidMount={onContentDidMount}
      initialContent={initialContent}
      head={head}
      // A light page behind the bootstrap3 preview, and a picked daisy-ui subtheme, in a dark playground. A preview that follows the
      // appearance shows the playground's page while its stylesheet loads, rather than a flash of white
      style={{ background: appearance ? undefined : 'white', ...style }}
      {...frameProps}
    >
      <div id={DEMO_FRAME_JSS} />
      {body}
    </Frame>
  );
}
