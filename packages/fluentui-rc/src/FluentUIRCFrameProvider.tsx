import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { FluentProvider, RendererProvider, createDOMRenderer, teamsLightTheme } from '@fluentui/react-components';

const FluentWrapper = (props: { children: ReactNode; targetDocument?: HTMLDocument }) => {
  const { children, targetDocument } = props;
  const renderer = useMemo(() => createDOMRenderer(targetDocument), [targetDocument]);

  return (
    <RendererProvider renderer={renderer} targetDocument={targetDocument}>
      <FluentProvider targetDocument={targetDocument} theme={teamsLightTheme}>
        {children}
      </FluentProvider>
    </RendererProvider>
  );
};

export const __createFluentUIRCFrameProvider = (props: any) =>
  function FluentUIRCFrame({ document }: any) {
    return <FluentWrapper targetDocument={document}>{props.children}</FluentWrapper>;
  };
