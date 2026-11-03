import type { GridProps } from '@mui/material/Grid';
import Grid from '@mui/material/Grid';
import type { GridTemplateProps } from '@rjsf/utils';
import { logGridSpanWarning } from '@rjsf/utils';

const ROW_SIZE_STYLES = ['flex', 'flexBasis', 'flexGrow', 'width'] as const;

/** Renders a `GridTemplate` for mui, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`. A column's `span` is its `size`
 * unless the caller gives a `size` of its own. A row without a `size`, a flex or a width of its own grows to fill its
 * line, so a row nested in a row takes a line of its own rather than shrinking to its content.
 *
 * @param props - The GridTemplateProps, including the extra props containing the mui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps & Pick<GridProps, 'size' | 'sx'>) {
  const { children, column, fieldId, span, sx, ...rest } = props;
  if (column) {
    logGridSpanWarning(fieldId, span, { ownWidth: rest.size === undefined ? undefined : 'a `size`' });
  }
  // `flex` rather than `width: 100%`, which would overflow a row's own margins, or `size={12}`, which counts the parent
  // row's `columns`; left off a row with a flex or width of its own, which the fill would override or mix with, or with
  // an `sx` function, which can't be read for one
  const sxList = Array.isArray(sx) ? sx : [sx];
  const fills =
    !column &&
    rest.size === undefined &&
    [rest.style, ...sxList].every(
      (entry) => typeof entry !== 'function' && ROW_SIZE_STYLES.every((key) => entry?.[key] === undefined),
    );
  const fillSx = fills ? [{ flex: '1 1 100%' }, ...sxList] : sx;
  return (
    <Grid container={!column} size={column ? span : undefined} sx={fillSx} {...rest}>
      {children}
    </Grid>
  );
}
