import { Grid, GridItem } from '@chakra-ui/react';
import { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for chakra-ui, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`/`GridItem`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the chakra-ui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, ...rest } = props;
  if (column) {
    return <GridItem {...rest}>{children}</GridItem>;
  }
  return <Grid {...rest}>{children}</Grid>;
}
