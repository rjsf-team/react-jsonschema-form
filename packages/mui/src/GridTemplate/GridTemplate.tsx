import Grid from '@mui/material/Grid';
import { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for mui, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the mui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, ...rest } = props;
  return (
    <Grid container={!column} {...rest}>
      {children}
    </Grid>
  );
}
