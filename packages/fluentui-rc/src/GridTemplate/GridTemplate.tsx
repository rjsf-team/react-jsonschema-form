import { makeStyles, mergeClasses } from '@fluentui/react-components';
import { GridShim, grid } from '@fluentui/react-migration-v0-v9';
import type { GridTemplateProps } from '@rjsf/utils';
import { logOnce } from '@rjsf/utils';

const useStyles = makeStyles({
  // A child's own `style`, which is how this theme places one, and a column's `span` both win over this class
  fullWidthChildren: { '> *': { gridColumn: '1 / -1' } },
});

/** Renders a `GridTemplate` for fluentui-rc, which is expecting the column sizing information coming in via the
 * `style` by the caller, which are spread directly on the `GridShim` if `columns` or `rows` are provided. Otherwise,
 * the `style` is added to a simple grid. This was done because `fluentui-rc` uses the CSS Grid which defines all of
 * the column/row/grid information via style. A row without `columns` of its own lays out on 12 tracks, where each
 * child is full width unless it spans fewer, and a column's `span` is set as its `gridColumn`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the fluentui-rc grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, columns: ownColumns, fieldId, rows, span, className, style, ...rest } = props;
  const classes = useStyles();
  const twelveTracks =
    !column &&
    ownColumns === undefined &&
    style?.gridTemplateColumns === undefined &&
    style?.gridTemplateAreas === undefined;
  const columns = twelveTracks ? 'repeat(12, minmax(0, 1fr))' : ownColumns;
  const spanned = column && span !== undefined;
  const spanStyle = spanned ? { gridColumn: `span ${span} / span ${span}`, ...style } : style;
  if (spanned && style?.gridColumn !== undefined) {
    logOnce(
      `A layout grid column's \`span\` in "${fieldId}" is ignored, since the column has a \`gridColumn\` style of its own`,
    );
  } else if (spanned && !Number.isInteger(span)) {
    logOnce(
      `A layout grid column's \`span\` of ${span} in "${fieldId}" is not a whole number, which this theme's grid needs`,
    );
  }
  if (columns || rows) {
    // Use the `grid` rows/columns functions to generate the additional grid styling
    const styles = {
      ...spanStyle,
      ...(rows ? grid.rows(rows) : undefined),
      ...(columns ? grid.columns(columns) : undefined),
    };
    return (
      <GridShim className={mergeClasses(twelveTracks && classes.fullWidthChildren, className)} style={styles} {...rest}>
        {children}
      </GridShim>
    );
  }
  return (
    <div className={className} style={spanStyle} {...rest}>
      {children}
    </div>
  );
}
