import { GridTemplateProps } from '@rjsf/utils';
import { Grid } from '@mantine/core';

/** Renders a `GridTemplate` for mantine, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`/`Grid.Col`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the chakra-ui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, ...rest } = props;
  if (column) {
    return <Grid.Col {...rest}>{children}</Grid.Col>;
  }
  return (
    <Grid grow {...rest}>
      {children}
    </Grid>
  );
}
