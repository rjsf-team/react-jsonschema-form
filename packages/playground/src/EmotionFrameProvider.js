import * as React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import weakMemoize from "@emotion/weak-memoize";
import { FrameContextConsumer } from "react-frame-component";

/**
 * EmotionFrameProvider is used to ensure that <Global> emotion components
 * can be rendered within an iframe without changing the styles of the parent page.
 * Required for using Chakra UI in the playground.
 * From: https://codesandbox.io/s/p98y9o7jz0?file=/src/frame-provider.js:0-650
 * Also see: https://github.com/emotion-js/emotion/issues/760#issuecomment-404353706
 */

let memoizedCreateCacheWithContainer = weakMemoize(container => {
  let newCache = createCache({ container, key: "rjsf-chakra-ui" });
  return newCache;
});

export const EmotionFrameProvider = props => (
  <FrameContextConsumer>
    {({ document }) => {
      return (
        <CacheProvider value={memoizedCreateCacheWithContainer(document.head)}>
          {props.children}
        </CacheProvider>
      );
    }}
  </FrameContextConsumer>
);
