import { Layer as CarbonLayer } from '@carbon/react';
import { ReactNode } from 'react';
import { NestDepth, useNestDepth } from '../contexts';
// @ts-expect-error miss types for `@carbon/layout`
import { spacing } from '@carbon/layout';

/** The `LayerBackground` render a background for [a carbon layer](https://carbondesignsystem.com/guidelines/color/usage#layering-tokens)
 *
 * @param ignoreFirstLayer - If true, the background of the first layer will not be rendered
 */
export function LayerBackground({
  children,
  ignoreFirstLayer = true,
  padding,
}: {
  children: ReactNode;
  ignoreFirstLayer?: boolean;
  padding?: number;
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
          <Background padding={padding}>{content}</Background>
        </NestDepth>
      );
    }
  }

  // oneOf and anyOf need to show the first layer

  return <Background padding={padding}>{content}</Background>;
}

/** Draw layer background
 */
function Background({ children, padding = 3 }: { children: ReactNode; padding?: number }) {
  const nestDepth = useNestDepth();
  return (
    <CarbonLayer level={(1 - (nestDepth % 2)) as 0 | 1}>
      <div
        style={{
          padding: spacing[padding - 1],
          backgroundColor: 'var(--cds-layer)',
        }}
      >
        <CarbonLayer level={(nestDepth % 2) as 0 | 1}>{children}</CarbonLayer>
      </div>
    </CarbonLayer>
  );
}
