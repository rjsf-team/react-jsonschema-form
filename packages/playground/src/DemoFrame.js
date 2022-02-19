import React from "react";
import { create } from "jss";
import { jssPreset, StylesProvider } from "@material-ui/core/styles";
import Frame from "react-frame-component";

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
      container: instanceRef.current.contentDocument.body,
      window: () => instanceRef.current.contentWindow,
    });
  };
  if (theme === "fluent-ui") {
    // TODO: find a better way to render fluent-ui in an iframe, if we need to do so.
    const { head } = props;
    return (
      <>
        <style
          dangerouslySetInnerHTML={{ __html: "label { font-weight: normal; }" }}
        />
        {head}
        {children}
      </>
    );
  }
  return (
    <Frame ref={handleRef} contentDidMount={onContentDidMount} {...other}>
      <div id="demo-frame-jss" />
      {/* We need to wrap the material-ui form in a custom StylesProvider
            so that styles are injected into the iframe, not the parent window. */}
      {theme === "material-ui" ? (
        state.ready ? (
          <StylesProvider jss={state.jss} sheetsManager={state.sheetsManager}>
            {React.cloneElement(children, {
              container: state.container,
              window: state.window,
            })}
          </StylesProvider>
        ) : null
      ) : (
        children
      )}
    </Frame>
  );
}

export default DemoFrame;
