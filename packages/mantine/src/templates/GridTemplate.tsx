import type { MantineSpacing, StyleProp } from '@mantine/core';
import { Container, Grid } from '@mantine/core';
import type { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for mantine, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`/`Grid.Col`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the Mantine grid positioning details
 */
export default function GridTemplate(
  props: GridTemplateProps & {
    /** Whether a row is wrapped in a fluid `Container`, which it is by default */
    fluid?: boolean;
    /** The gap between a row's columns, the older name for `gap` */
    gutter?: StyleProp<MantineSpacing>;
    /** The gap between a row's columns */
    gap?: StyleProp<MantineSpacing>;
  },
) {
  const { children, column, fluid = true, gutter, gap = gutter, ...rest } = props;

  if (column) {
    return <Grid.Col {...rest}>{children}</Grid.Col>;
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
  // Grid without container
  return (
    <Grid grow gap={gap} {...rest}>
      {children}
    </Grid>
  );
}
