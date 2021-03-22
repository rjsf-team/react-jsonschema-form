import CSSReset from "@chakra-ui/css-reset";
import { PortalManager } from "@chakra-ui/portal";
import {
  ColorModeProvider,
  GlobalStyle,
  ThemeProvider,
} from "@chakra-ui/system";
import defaultTheme from "@chakra-ui/theme";
import * as React from "react";
import { EmotionFrameProvider } from "./EmotionFrameProvider";

/**
 * Forked version of the ChakraProvider that is able to be rendered within a frame
 * (without injecting the css to the parent page), using EmotionFrameProvider.
 * https://github.com/chakra-ui/chakra-ui/blob/785fe4f9edd276897a840ced128189a65132ca80/packages/react/src/chakra-provider.tsx
 */

/**
 * The global provider that must be added to make all Chakra components
 * work correctly
 */
export const ChakraProvider = (props) => {
  const {
    children,
    colorModeManager,
    portalZIndex,
    resetCSS = true,
    theme = defaultTheme,
  } = props;

  return (
    <ThemeProvider theme={theme}>
      <EmotionFrameProvider>
        <ColorModeProvider
          colorModeManager={colorModeManager}
          options={theme.config}
        >
          {resetCSS && <CSSReset />}
          <GlobalStyle />
          {portalZIndex ? (
            <PortalManager zIndex={portalZIndex}>{children}</PortalManager>
          ) : (
            children
          )}
        </ColorModeProvider>
      </EmotionFrameProvider>
    </ThemeProvider>
  );
};