import { useState, useRef, useCallback, cloneElement, ReactElement } from 'react';
import { CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache, { EmotionCache } from '@emotion/cache';
import { create, Jss } from 'jss';
import { jssPreset, StylesProvider } from '@material-ui/core/styles';
import Frame, { FrameComponentProps, FrameContextConsumer } from 'react-frame-component';
import { __createChakraFrameProvider } from '@rjsf/chakra-ui';
import { StyleProvider as AntdStyleProvider } from '@ant-design/cssinjs';
import { __createFluentUIRCFrameProvider } from '@rjsf/fluentui-rc';
import { __createDaisyUIFrameProvider } from '../../../daisy-ui/src/DaisyUIFrameProvider';

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

interface DemoFrameProps extends FrameComponentProps {
  theme: string;
  /** override children to be ReactElement to avoid Typescript issue. In this case we don't need to worry about
   * children being of the other valid ReactNode types, undefined and string as it always contains an RJSF `Form`
   */
  children: ReactElement;
  subtheme?: { dataTheme?: string } | null;
}

interface FrameWindow extends Window {
  [key: string]: any;
}

interface FrameRefs {
  contentDocument: Document | null;
  contentWindow: FrameWindow | null;
}

function useFrameContext() {
  const [jss, setJss] = useState<Jss>();
  const [ready, setReady] = useState(false);
  const [sheetsManager, setSheetsManager] = useState(new Map());
  const [emotionCache, setEmotionCache] = useState<EmotionCache>(createCache({ key: 'css' }));
  const [container, setContainer] = useState<any>();
  const [window, setWindow] = useState<FrameWindow | null>(null);

  return {
    jss,
    ready,
    sheetsManager,
    emotionCache,
    container,
    window,
    setJss,
    setReady,
    setSheetsManager,
    setEmotionCache,
    setContainer,
    setWindow,
  };
}

function useFrameMount(instanceRef: React.MutableRefObject<FrameRefs>) {
  const { setJss, setReady, setSheetsManager, setEmotionCache, setContainer, setWindow } = useFrameContext();

  return useCallback(() => {
    setReady(true);
    const contentWindow = instanceRef.current.contentWindow;
    const contentDocument = instanceRef.current.contentDocument;

    if (contentWindow && contentDocument) {
      const newJss = create({
        plugins: jssPreset().plugins,
        insertionPoint: contentWindow['demo-frame-jss'],
      });
      const newSheetsManager = new Map();
      const newEmotionCache = createCache({
        key: 'css',
        prepend: true,
        container: contentWindow['demo-frame-jss'],
      });

      setJss(newJss);
      setSheetsManager(newSheetsManager);
      setEmotionCache(newEmotionCache);
      setContainer(contentDocument.body);
      setWindow(contentWindow);
    }
  }, []);
}

function getThemedBody(props: DemoFrameProps, context: ReturnType<typeof useFrameContext>) {
  const { children, theme } = props;
  const { ready, jss, sheetsManager, emotionCache, container, window } = context;

  if (theme === 'material-ui-4' && ready) {
    return (
      <StylesProvider jss={jss} sheetsManager={sheetsManager}>
        {cloneElement(children, { container, window })}
      </StylesProvider>
    );
  }

  if (theme === 'mui' && ready) {
    return (
      <CacheProvider value={emotionCache}>
        <CssBaseline />
        {cloneElement(children, { container, window })}
      </CacheProvider>
    );
  }

  if (theme === 'fluent-ui') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: 'label { font-weight: normal; }' }} />
        {props.head}
        {children}
      </>
    );
  }

  if (theme === 'fluentui-rc') {
    return <FrameContextConsumer>{__createFluentUIRCFrameProvider(props)}</FrameContextConsumer>;
  }

  if (theme === 'chakra-ui') {
    return <FrameContextConsumer>{__createChakraFrameProvider(props)}</FrameContextConsumer>;
  }

  if (theme === 'daisy-ui') {
    const { subtheme } = props;
    return (
      <FrameContextConsumer>
        {(frameContext) => __createDaisyUIFrameProvider({ ...props, subtheme })(frameContext)}
      </FrameContextConsumer>
    );
  }

  if (theme === 'antd' && ready && window) {
    return <AntdStyleProvider container={window['demo-frame-jss']}>{children}</AntdStyleProvider>;
  }

  return children;
}

export default function DemoFrame(props: DemoFrameProps) {
  const { head, ...frameProps } = props;
  const instanceRef = useRef<FrameRefs>({ contentDocument: null, contentWindow: null });
  const context = useFrameContext();
  const onContentDidMount = useFrameMount(instanceRef);

  const handleRef = useCallback((ref: any) => {
    instanceRef.current = {
      contentDocument: ref ? ref.node.contentDocument : null,
      contentWindow: ref ? ref.node.contentWindow : null,
    };
  }, []);

  const body = getThemedBody(props, context);

  return (
    <Frame ref={handleRef} contentDidMount={onContentDidMount} head={head} {...frameProps}>
      <div id='demo-frame-jss' />
      {body}
    </Frame>
  );
}
