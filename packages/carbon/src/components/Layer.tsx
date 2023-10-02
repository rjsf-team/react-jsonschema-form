// @ts-expect-error there's no type definition for Stack
import { Layer as CarbonLayer } from '@carbon/react';
import { ReactNode } from 'react';
import { NestDepth, useNestDepth } from '../contexts';

export function Layer({ children }: { children: ReactNode }) {
  const nestDepth = useNestDepth();
  return (
    <CarbonLayer level={nestDepth % 2}>
      <NestDepth>{children}</NestDepth>
    </CarbonLayer>
  );
}

export function LayerBackground({ children }: { children: ReactNode }) {
  const nestDepth = useNestDepth();
  return (
    <div
      style={
        nestDepth
          ? {
              padding: '1rem',
              backgroundColor: 'var(--cds-layer)',
            }
          : {
              margin: '2.5rem 0',
            }
      }
    >
      {children}
    </div>
  );
}
