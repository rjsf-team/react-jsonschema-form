import React from "react";
import { CssBaseline } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { create } from "jss";
import { jssPreset, StylesProvider } from "@material-ui/core/styles";
import Frame, { FrameContextConsumer } from "react-frame-component";
import { __createChakraFrameProvider } from "@rjsf/chakra-ui";

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

function DemoFrame(props) {
  const { children, classes, theme, ...other } = props;
  const [state, setState] = React.useState({
    ready: false,
  });
  const instanceRef = React.useRef();

  const handleRef = React.useCallback(ref => {
    instanceRef.current = {
      contentDocument: ref ? ref.node.contentDocument : null,
      contentWindow: ref ? ref.node.contentWindow : null,
    };
  }, []);

  const onContentDidMount = () => {
    setState({
      ready: true,
      jss: create({
        plugins: jssPreset().plugins,
        insertionPoint: instanceRef.current.contentWindow["demo-frame-jss"],
      }),
      sheetsManager: new Map(),
      emotionCache: createCache({
        key: "css",
        prepend: true,
        container: instanceRef.current.contentWindow["demo-frame-jss"],
      }),
      container: instanceRef.current.contentDocument.body,
      window: () => instanceRef.current.contentWindow,
    });
  };
  let body = children;
  if (theme === "material-ui-4") {
    body = state.ready ? (
      <StylesProvider jss={state.jss} sheetsManager={state.sheetsManager}>
        {React.cloneElement(children, {
          container: state.container,
          window: state.window,
        })}
      </StylesProvider>
    ) : null;
  } else if (theme === "material-ui-5") {
    body = state.ready ? (
      <CacheProvider value={state.emotionCache}>
        <CssBaseline />
        {React.cloneElement(children, {
          container: state.container,
          window: state.window,
        })}
      </CacheProvider>
    ) : null;
  } else if (theme === "fluent-ui") {
    // TODO: find a better way to render fluent-ui in an iframe, if we need to do so.
    const { head } = props;
    body = (
      <>
        <style
          dangerouslySetInnerHTML={{ __html: "label { font-weight: normal; }" }}
        />
        {head}
        {children}
      </>
    );
  } else if (theme === "chakra-ui") {
    body = (
      <FrameContextConsumer>
        {__createChakraFrameProvider(props)}
      </FrameContextConsumer>
    );
  } else if (theme === "primereact") {
    body = (
      <>
        <style
          // See https://www.primefaces.org/primereact/theming/
          // The theme CSS itself doesn't apply any global styling.
          dangerouslySetInnerHTML={{
            __html: `
              html {
                font-size: 16px;
              }
              body {
                margin: 0px;
                font-family: var(--font-family);
                color: var(--text-color);
              }
              * {
                border-color: #ced4da;
              }`,
          }}
        />
        {children}
      </>
    );
  }
  return (
    <Frame ref={handleRef} contentDidMount={onContentDidMount} {...other}>
      <div id="demo-frame-jss" />
      {body}
    </Frame>
  );
}

export default DemoFrame;
