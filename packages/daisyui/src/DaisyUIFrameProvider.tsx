/**
 * __createDaisyUIFrameProvider is used to ensure that DaisyUI styles
 * can be rendered within an iframe without affecting the parent page.
 * Required for using DaisyUI in the playground.
 *
 * We have to define DaisyUIFrameProvider in this library, as opposed to the playground,
 * to ensure consistent styling and proper theme management across frames.
 *
 * This provider:
 * - Injects Tailwind CSS and DaisyUI stylesheets into the iframe
 * - Configures Tailwind with DaisyUI themes
 * - Manages theme persistence through localStorage
 * - Wraps content in a themed container
 *
 * NOTE: This is an internal component only used by @rjsf/playground (no
 * backwards compatibility guarantees!)
 */

import type { ReactNode } from 'react';
import { useEffect, useSyncExternalStore } from 'react';

import { readStoredTheme, storeTheme, subscribeToStoredTheme } from './theme/storedTheme.ts';

interface DaisyUIFrameProviderProps {
  children: ReactNode;
  subtheme?: { dataTheme?: string } | null;
}

/** This component has a useEffect with a cleanup function to remove the tailwind stylesheets loads upon unmount so
 * that the styles are removed when the theme in the playground is switched to something else
 *
 * @param props - The component props
 */
function DaisyUIFrameComponent(props: DaisyUIFrameProviderProps & { document?: Document }) {
  const { children, subtheme = {}, document } = props;
  const chosenTheme = subtheme?.dataTheme;
  // The stored theme lives outside React, so it is read as an external store, which renders the provider again when
  // another provider or another tab stores a theme. A chosen theme is shown without reading the storage at all
  const theme = useSyncExternalStore(subscribeToStoredTheme, () => chosenTheme || readStoredTheme());

  // Storing the chosen theme is a side effect, so it waits for the commit rather than happening while rendering
  useEffect(() => {
    if (!chosenTheme) {
      return;
    }
    try {
      storeTheme(chosenTheme);
    } catch {
      // Storage can be unavailable, as in a sandboxed frame; the chosen theme still applies for this session
    }
  }, [chosenTheme]);

  useEffect(() => {
    if (document) {
      // Configure Tailwind first to ensure config is available before script loads
      const configScript = document.createElement('script');
      configScript.textContent = `
        window.tailwind = window.tailwind || {};
        window.tailwind.config = {
          daisyui: {
            themes: true,
          },
          future: {
            disableProductionWarning: true
          }
        }
      `;
      document.head.appendChild(configScript);

      // Add Tailwind
      const tailwindScript = document.createElement('script');
      tailwindScript.src = 'https://unpkg.com/@tailwindcss/browser@4.1.3';
      document.head.appendChild(tailwindScript);

      // Add DaisyUI CSS
      const daisyLink = document.createElement('link');
      daisyLink.rel = 'stylesheet';
      daisyLink.href = 'https://cdn.jsdelivr.net/npm/daisyui@5.0.20';
      document.head.appendChild(daisyLink);

      // Add all themes
      const daisyLinkAllThemes = document.createElement('link');
      daisyLinkAllThemes.rel = 'stylesheet';
      daisyLinkAllThemes.href = 'https://cdn.jsdelivr.net/npm/daisyui@5.0.20/themes.css';
      document.head.appendChild(daisyLinkAllThemes);
      return () => {
        configScript.remove();
        tailwindScript.remove();
        daisyLink.remove();
        daisyLinkAllThemes.remove();
      };
    }
    return undefined;
  }, [document]);

  return (
    <div data-theme={theme} className='daisy-ui-theme'>
      {children}
    </div>
  );
}

/**
 * Creates a DaisyUI frame provider component that can be used within an iframe
 * to properly render DaisyUI styles without affecting the parent document.
 *
 * @param props - The component props
 * @returns A component that sets up DaisyUI within an iframe context
 */
export const __createDaisyUIFrameProvider = (props: DaisyUIFrameProviderProps) =>
  function DaisyUIFrame({ document }: { document?: Document }) {
    // Get theme from localStorage or use default
    return <DaisyUIFrameComponent document={document} {...props} />;
  };
