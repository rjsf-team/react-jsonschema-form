import { GridShim, grid } from '@fluentui/react-migration-v0-v9';
import { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for fluentui-rc, which is expecting the column sizing information coming in via the
 * `style` by the caller, which are spread directly on the `GridShim` if `columns` or `rows` are provided. Otherwise,
 * the `style` is added to a simple grid. This was done because `fluentui-rc` uses the CSS Grid which defines all of
 * the column/row/grid information via style.
 *
 * @param props - The GridTemplateProps, including the extra props containing the fluentui-rc grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, columns, rows, style, ...rest } = props;
  if (columns || rows) {
    // Use the `grid` rows/columns functions to generate the additional grid styling
    const styles = {
      ...style,
      ...(rows ? grid.rows(rows) : undefined),
      ...(columns ? grid.columns(columns) : undefined),
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
