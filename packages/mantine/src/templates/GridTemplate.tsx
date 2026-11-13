import type { GridProps, MantineSpacing, MantineStyleProp, StyleProp } from '@mantine/core';
import { Container, Grid } from '@mantine/core';
import type { GridTemplateProps, OpenProps } from '@rjsf/utils';

const ROW_SIZE_STYLES = ['flex', 'flexBasis', 'flexGrow', 'width'] as const;

/** Whether a style, whose arrays nest, sets none of `ROW_SIZE_STYLES`; a style function can't be read for one
 *
 * @param style - The style of a row
 * @returns - True when the style leaves the row's size open
 */
function leavesSizeOpen(style: MantineStyleProp): boolean {
  if (Array.isArray(style)) {
    return style.every(leavesSizeOpen);
  }
  return typeof style !== 'function' && ROW_SIZE_STYLES.every((key) => style?.[key] === undefined);
}

/** Renders a `GridTemplate` for mantine, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`/`Grid.Col`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the Mantine grid positioning details
 */
export default function GridTemplate(
  // `style` widened to the arrays and functions mantine's own `style` takes, which an intersection can't do
  props: OpenProps &
    Omit<GridTemplateProps, 'style'> &
    Pick<GridProps, 'style' | 'w' | 'flex'> & {
      /** Whether a row is wrapped in a fluid `Container`, which it is by default */
      fluid?: boolean;
      /** The gap between a row's columns, the older name for `gap` */
      gutter?: StyleProp<MantineSpacing>;
      /** The gap between a row's columns */
      gap?: StyleProp<MantineSpacing>;
    },
) {
  const { children, column, fieldId: _fieldId, fluid = true, gutter, gap = gutter, span, ...rest } = props;

  if (column) {
    return (
      <Grid.Col span={span} {...rest}>
        {children}
      </Grid.Col>
    );
  }

  // Grid with fluid container
  if (fluid) {
    return (
      <Container fluid p='4' mx={0} w='100%'>
        <Grid gap={gap} {...rest}>
          {children}
        </Grid>
      </Container>
    );
  }
  // Grid without container, grown to fill its line so a row nested in a row takes a line of its own rather than
  // shrinking to its content; `flex` rather than `width: 100%`, which would overflow the row's own margins, and left off
  // a row with a flex or width of its own, which the fill would override or mix with, or with a style function, which
  // can't be read for one
  const { style, ...gridProps } = rest;
  const fills = gridProps.w === undefined && gridProps.flex === undefined && leavesSizeOpen(style);
  return (
    <Grid grow gap={gap} style={fills ? [{ flex: '1 1 100%' }, style] : style} {...gridProps}>
      {children}
    </Grid>
  );
}
