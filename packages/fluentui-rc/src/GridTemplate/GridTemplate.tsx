import type { CSSProperties } from 'react';
import { makeStyles, mergeClasses } from '@fluentui/react-components';
import { GridShim } from '@fluentui/react-migration-v0-v9';
import type { GridTemplateProps } from '@rjsf/utils';
import { logGridSpanWarning } from '@rjsf/utils';

const TEMPLATE_STYLES = ['gridTemplateColumns', 'gridTemplateAreas', 'gridTemplate', 'grid'] as const;

const useStyles = makeStyles({
  // A child's own `style`, which is how this theme places one, and a column's `span` both win over this class
  fullWidthChildren: { '> *': { gridColumn: '1 / -1' } },
});

/** The CSS template fluentui's `grid.rows()`/`grid.columns()` build: `repeat(n, 1fr)` for a positive number of tracks,
 * else the template as given. Built here because those functions are typed as Griffel styles, whose fallback arrays an
 * inline style can't hold
 *
 * @param template - The number of equal tracks, or a CSS template
 * @returns - The CSS template
 */
function gridTemplate(template: string | number): string {
  const tracks = Number(template);
  return tracks > 0 ? `repeat(${tracks}, 1fr)` : String(template);
}

/** Renders a `GridTemplate` for fluentui-rc, which is expecting the column sizing information coming in via the
 * `style` by the caller, which are spread directly on the `GridShim` if `columns` or `rows` are provided. Otherwise,
 * the `style` is added to a simple grid. This was done because `fluentui-rc` uses the CSS Grid which defines all of
 * the column/row/grid information via style. A row without `columns` of its own lays out on 12 tracks, where each
 * child is full width unless it spans fewer, and a column's `span` is set as its `gridColumn`. A row given a template
 * through its `style` is a grid on that template.
 *
 * @param props - The GridTemplateProps, including the extra props containing the fluentui-rc grid positioning details
 */
export default function GridTemplate(
  props: GridTemplateProps & {
    /** The number of equal columns, or a CSS column template */
    columns?: string | number;
    /** The number of equal rows, or a CSS row template */
    rows?: string | number;
  },
) {
  const { children, column, columns: ownColumns, fieldId, rows, span, className, style, ...rest } = props;
  const classes = useStyles();
  const twelveTracks =
    !column && ownColumns === undefined && TEMPLATE_STYLES.every((key) => style?.[key] === undefined);
  const columns = twelveTracks ? 'repeat(12, minmax(0, 1fr))' : ownColumns;
  const spanned = column && span !== undefined;
  const spanStyle = spanned ? { gridColumn: `span ${span} / span ${span}`, ...style } : style;
  if (column) {
    logGridSpanWarning(fieldId, span, {
      ownWidth: style?.gridColumn === undefined ? undefined : 'a `gridColumn` style',
      wholeSpansOnly: true,
    });
  }
  if (columns || rows) {
    const styles: CSSProperties = {
      ...spanStyle,
      ...(rows ? { gridTemplateRows: gridTemplate(rows) } : undefined),
      ...(columns ? { gridTemplateColumns: gridTemplate(columns) } : undefined),
    };
    return (
      <GridShim className={mergeClasses(twelveTracks && classes.fullWidthChildren, className)} style={styles} {...rest}>
        {children}
      </GridShim>
    );
  }
  // A row reaching here has its template in `style`, which needs a grid to apply to
  return (
    <div className={className} style={column ? spanStyle : { display: 'grid', ...style }} {...rest}>
      {children}
    </div>
  );
}
