import type { CSSProperties } from 'react';
import { GridShim } from '@fluentui/react-migration-v0-v9';
import type { GridTemplateProps } from '@rjsf/utils';

/** The CSS template fluentui's `grid.rows()`/`grid.columns()` build: `repeat(n, 1fr)` for a positive number of tracks,
 * else the template as given. Built here because those functions are typed as Griffel styles, whose fallback arrays an
 * inline style can't hold
 *
 * @param template - The number of equal tracks, or a CSS template
 * @returns - The CSS template
 */
function gridTemplate(template: string | number): string {
  const tracks = Number(template);
  return !Number.isNaN(tracks) && tracks > 0 ? `repeat(${template}, 1fr)` : String(template);
}

/** Renders a `GridTemplate` for fluentui-rc, which is expecting the column sizing information coming in via the
 * `style` by the caller, which are spread directly on the `GridShim` if `columns` or `rows` are provided. Otherwise,
 * the `style` is added to a simple grid. This was done because `fluentui-rc` uses the CSS Grid which defines all of
 * the column/row/grid information via style.
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
  const { children, column, columns, rows, style, ...rest } = props;
  if (columns || rows) {
    const styles: CSSProperties = {
      ...style,
      ...(rows ? { gridTemplateRows: gridTemplate(rows) } : undefined),
      ...(columns ? { gridTemplateColumns: gridTemplate(columns) } : undefined),
    };
    return (
      <GridShim style={styles} {...rest}>
        {children}
      </GridShim>
    );
  }
  return (
    <div style={style} {...rest}>
      {children}
    </div>
  );
}
