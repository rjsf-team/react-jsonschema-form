// @ts-expect-error there's no type definition for Stack
import { Layer as CarbonLayer } from '@carbon/react';
import { ReactNode } from 'react';
import { NestDepth, useNestDepth } from '../contexts';

/** The `Layer` render [a carbon layer](https://carbondesignsystem.com/guidelines/color/usage#layering-tokens), in order to create a visual hierarchy
 */
export function Layer({ children }: { children: ReactNode }) {
  const nestDepth = useNestDepth();
  return (
    <CarbonLayer level={nestDepth % 2}>
      <NestDepth>{children}</NestDepth>
    </CarbonLayer>
  );
}

/** The `LayerBackground` render a background for [a carbon layer](https://carbondesignsystem.com/guidelines/color/usage#layering-tokens)
 */
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
          : {}
      }
    >
      {children}
    </div>
  );
}
