import { GridTemplateProps } from '@rjsf/utils';
import { Grid, Container } from '@mantine/core';

/** Renders a `GridTemplate` for mantine, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`/`Grid.Col`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the chakra-ui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, fluid = true, ...rest } = props;
  if (column) {
    return <Grid.Col {...rest}>{children}</Grid.Col>;
  }

  // Grid with fluid container
  if (fluid) {
    return (
      <Container fluid={fluid} p='4' mx={0}>
        <Grid {...rest}>{children}</Grid>
      </Container>
    );
  }
  // Grid without container
  return (
    <Grid grow {...rest}>
      {children}
    </Grid>
  );
}
