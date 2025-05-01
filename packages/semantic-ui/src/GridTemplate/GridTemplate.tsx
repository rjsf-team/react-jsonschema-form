import { Grid } from 'semantic-ui-react';
import { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for semantic-ui, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Flex`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the semantic-ui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, ...rest } = props;
  if (column) {
    return <Grid.Column {...rest}>{children}</Grid.Column>;
  }
  return <Grid {...rest}>{children}</Grid>;
}
