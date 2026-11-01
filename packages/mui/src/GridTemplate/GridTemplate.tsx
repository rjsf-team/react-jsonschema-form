import Grid from '@mui/material/Grid';
import type { GridTemplateProps } from '@rjsf/utils';
import { logOnce } from '@rjsf/utils';

/** Renders a `GridTemplate` for mui, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`. A column's `span` is its `size`
 * unless the caller gives a `size` of its own.
 *
 * @param props - The GridTemplateProps, including the extra props containing the mui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, fieldId, span, ...rest } = props;
  if (column && span !== undefined && rest.size !== undefined) {
    logOnce(`A layout grid column's \`span\` in "${fieldId}" is ignored, since the column has a \`size\` of its own`);
  }
  return (
    <Grid container={!column} size={column ? span : undefined} {...rest}>
      {children}
    </Grid>
  );
}
