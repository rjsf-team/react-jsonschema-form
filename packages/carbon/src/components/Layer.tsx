// @ts-expect-error there's no type definition for Stack
import { Layer as CarbonLayer } from '@carbon/react';
import { ReactNode } from 'react';
import { NestDepth, useNestDepth } from '../contexts';

/** The `LayerBackground` render a background for [a carbon layer](https://carbondesignsystem.com/guidelines/color/usage#layering-tokens)
 *
 * @param ignoreFirstLayer - If true, the background of the first layer will not be rendered
 */
export function LayerBackground({
  children,
  ignoreFirstLayer = true,
}: {
  children: ReactNode;
  ignoreFirstLayer?: boolean;
}) {
  const nestDepth = useNestDepth();
  const content = <NestDepth>{children}</NestDepth>;

  if (!nestDepth) {
    if (ignoreFirstLayer) {
      return content;
    }
    if (!ignoreFirstLayer) {
      return (
        // To make the first layer be `gray`, we need to nest it in another layer
        <NestDepth>
          <Background>{content}</Background>
        </NestDepth>
      );
    }
  }

  // oneOf and anyOf need to show the first layer

  return <Background>{content}</Background>;
}

/** Draw layer background
 */
function Background({ children }: { children: ReactNode }) {
  const nestDepth = useNestDepth();
  return (
    <CarbonLayer level={1 - (nestDepth % 2)}>
      <div
        style={{
          padding: '1rem',
          backgroundColor: 'var(--cds-layer)',
        }}
      >
        <CarbonLayer level={nestDepth % 2}>{children}</CarbonLayer>
      </div>
    </CarbonLayer>
  );
}
