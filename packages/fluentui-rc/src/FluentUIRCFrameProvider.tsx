import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  FluentProvider,
  RendererProvider,
  createDOMRenderer,
  teamsDarkTheme,
  teamsLightTheme,
} from '@fluentui/react-components';

interface FluentUIRCFrameProviderProps {
  children: ReactNode;
  /** Shows the Teams dark theme for `'dark'`, and the Teams light theme otherwise */
  colorScheme?: 'light' | 'dark';
}

const FluentWrapper = (props: FluentUIRCFrameProviderProps & { targetDocument?: HTMLDocument }) => {
  const { children, colorScheme, targetDocument } = props;
  const renderer = useMemo(() => createDOMRenderer(targetDocument), [targetDocument]);
  const theme = colorScheme === 'dark' ? teamsDarkTheme : teamsLightTheme;

  return (
    <RendererProvider renderer={renderer} targetDocument={targetDocument}>
      {/* `FluentProvider` paints only its own box, so the frame's page takes the same background around it */}
      <style>{`body { background: ${theme.colorNeutralBackground1}; }`}</style>
      <FluentProvider targetDocument={targetDocument} theme={theme}>
        {children}
      </FluentProvider>
    </RendererProvider>
  );
};

export const __createFluentUIRCFrameProvider = (props: FluentUIRCFrameProviderProps) =>
  function FluentUIRCFrame({ document }: { document?: Document }) {
    return <FluentWrapper targetDocument={document} {...props} />;
  };
