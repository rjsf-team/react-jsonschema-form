import { useState, useRef, useCallback, cloneElement, ReactElement, ReactNode } from 'react';
import { CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache, { EmotionCache } from '@emotion/cache';
import Frame, { FrameComponentProps, FrameContextConsumer } from 'react-frame-component';
import { __createChakraFrameProvider } from '@rjsf/chakra-ui';
import { StyleProvider as AntdStyleProvider } from '@ant-design/cssinjs';
import { __createFluentUIRCFrameProvider } from '@rjsf/fluentui-rc';
import { __createDaisyUIFrameProvider } from '@rjsf/daisyui';
import { PrimeReactProvider } from 'primereact/api';

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
        container: instanceRef.current.contentWindow['demo-frame-jss'],
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
      <AntdStyleProvider container={instanceRef.current.contentWindow['demo-frame-jss']}>{children}</AntdStyleProvider>
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
  }

  return (
    <Frame ref={instanceRef} contentDidMount={onContentDidMount} head={head} {...frameProps}>
      <div id='demo-frame-jss' />
      {body}
    </Frame>
  );
}
