/**
 * __createDaisyUIFrameProvider is used to ensure that DaisyUI styles
 * can be rendered within an iframe without affecting the parent page.
 * Required for using DaisyUI in the playground.
 *
 * NOTE: This is an internal component only used by @rjsf/playground
 */

import React from 'react';

interface DaisyUIFrameProviderProps {
  children: React.ReactNode;
  subtheme?: { dataTheme?: string } | null;
}

export const __createDaisyUIFrameProvider = (props: DaisyUIFrameProviderProps) => {
  return function DaisyUIFrame({ document }: { document?: Document }) {
    // Get theme from localStorage or use default
    const theme = (() => {
      try {
        if (props.subtheme?.dataTheme) {
          localStorage.setItem('daisyui-theme', props.subtheme.dataTheme);
          return props.subtheme.dataTheme;
        }
        return localStorage.getItem('daisyui-theme') || 'cupcake';
      } catch {
        return 'cupcake';
      }
    })();

    if (document) {
      // Add Tailwind first
      const tailwindScript = document.createElement('script');
      tailwindScript.src = 'https://unpkg.com/@tailwindcss/browser@4.0.6';
      document.head.appendChild(tailwindScript);

      // Add DaisyUI CSS
      const daisyLink = document.createElement('link');
      daisyLink.rel = 'stylesheet';
      daisyLink.href = 'https://cdn.jsdelivr.net/npm/daisyui@5.0.0-beta.7/daisyui.css';
      document.head.appendChild(daisyLink);

      // Add all themes
      const daisyLinkAllThemes = document.createElement('link');
      daisyLinkAllThemes.rel = 'stylesheet';
      daisyLinkAllThemes.href = 'https://cdn.jsdelivr.net/npm/daisyui@5.0.0-beta.7/themes.css';
      document.head.appendChild(daisyLinkAllThemes);

      // Configure Tailwind
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
    }

    return (
      <div data-theme={theme} className='daisy-ui-theme'>
        {props.children}
      </div>
    );
  };
};
