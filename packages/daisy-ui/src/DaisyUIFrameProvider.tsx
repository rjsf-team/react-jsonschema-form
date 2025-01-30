/**
 * __createDaisyUIFrameProvider is used to ensure that DaisyUI styles
 * can be rendered within an iframe without affecting the parent page.
 * Required for using DaisyUI in the playground.
 *
 * NOTE: This is an internal component only used by @rjsf/playground
 */

interface DaisyUIFrameProviderProps {
  children: React.ReactNode;
  subtheme?: { dataTheme?: string } | null;
}

export const __createDaisyUIFrameProvider =
  (props: DaisyUIFrameProviderProps) =>
  ({ document }: { document?: Document }) => {
    if (document) {
      // Add Tailwind script
      const tailwindScript = document.createElement('script');
      tailwindScript.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(tailwindScript);

      // Configure Tailwind with DaisyUI
      const tailwindConfig = document.createElement('script');
      tailwindConfig.textContent = `
        tailwind.config = {
          plugins: [require("daisyui")],
          daisyui: {
            themes: true
          },
        }
      `;
      document.head.appendChild(tailwindConfig);

      // Add DaisyUI
      const daisyLink = document.createElement('link');
      daisyLink.rel = 'stylesheet';
      daisyLink.href = 'https://cdn.jsdelivr.net/npm/daisyui@latest/dist/full.css';
      document.head.appendChild(daisyLink);
    }
    console.log('Theme: ', props.subtheme?.dataTheme);
    return (
      <div data-theme={props.subtheme?.dataTheme || 'light'} className='daisy-ui-theme'>
        {props.children}
      </div>
    );
  };
