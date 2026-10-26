import type { GridTemplateProps } from '@rjsf/utils';
import { joinClassNames } from '@rjsf/utils';

/** Renders a row or a column of `rjsf.css`'s 12-track grid. A column's `span` is set as `--rjsf-span`, which the
 * stylesheet reads; a column without one is full width. Every other prop is spread onto the `<div>`.
 *
 * @param props - The `GridTemplateProps`, with `column` for a column, its `span`, and anything to spread on the `<div>`
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, className, span, style, ...rest } = props;
  // A row's `span` would reach its columns that have none, through the inherited custom property
  const gridStyle = column && span !== undefined ? { ...style, '--rjsf-span': span } : style;
  return (
    <div
      className={joinClassNames(column ? 'rjsf-grid-column' : 'rjsf-grid-row', className)}
      style={gridStyle}
      {...rest}
    >
      {children}
    </div>
  );
}
