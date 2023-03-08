import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import weakMemoize from '@emotion/weak-memoize';
import { ChakraProvider } from '@chakra-ui/react';
import CSSReset from './CssReset';

/**
 * __createChakraFrameProvider is used to ensure that <Global> emotion components
 * can be rendered within an iframe without changing the styles of the parent page.
 * Required for using Chakra UI in the playground.
 *
 * We have to define ChakraFrameProvider in this library, as opposed to the playground,
 * in order to avoid conflicting versions of emotion, which breaks the styling.
 *
 * NOTE: This is an internal component only used by @rjsf/playground (no
 * backwards compatibility guarantees!)
 *
 * From: https://codesandbox.io/s/p98y9o7jz0?file=/src/frame-provider.js:0-650
 * Also see: https://github.com/emotion-js/emotion/issues/760#issuecomment-404353706
 */

const memoizedCreateCacheWithContainer = weakMemoize((container: HTMLElement) => {
  const newCache = createCache({ container, key: 'rjsf' });
  return newCache;
});

export const __createChakraFrameProvider =
  (props: any) =>
  ({ document }: any) => {
    return (
      <div style={{ margin: 2 }}>
        <CacheProvider value={memoizedCreateCacheWithContainer(document.head)}>
          <ChakraProvider resetCSS={false}>
            <CSSReset />
            {props.children}
          </ChakraProvider>
        </CacheProvider>
      </div>
    );
  };
