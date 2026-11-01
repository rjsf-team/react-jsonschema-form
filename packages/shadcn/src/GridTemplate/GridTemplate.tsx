import type { GridTemplateProps } from '@rjsf/utils';
import { logOnce } from '@rjsf/utils';

import { cn } from '../lib/utils.ts';

/** Renders a `GridTemplate` for shadcn, which is expecting the column sizing information coming in via the
 * `className` provided by the caller, merged onto the `div`'s own grid classes. A column's `span` is set as its
 * `grid-column` unless the column has a `col-span-*` class of its own, and a row without a `grid-cols-*` class of its
 * own lays out on 12 tracks, where each child is full width unless it spans fewer.
 *
 * @param props - The GridTemplateProps, including the extra props containing the shadcn grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, className, fieldId, span, style, ...rest } = props;
  // shortcut: detects a row's own template and a column's own width by their `grid-cols-` and `col-span-` classes only,
  // so one set through `style` or a custom class isn't seen; check `style` too if that comes up
  const twelveTracks = !column && !/\bgrid-cols-/.test(className ?? '');
  const ownsWidth = /\bcol-span-/.test(className ?? '');
  const spanned = column && span !== undefined;
  if (spanned && ownsWidth) {
    logOnce(
      `A layout grid column's \`span\` in "${fieldId}" is ignored, since the column has a \`col-span-*\` class of its own`,
    );
  } else if (spanned && !Number.isInteger(span)) {
    logOnce(
      `A layout grid column's \`span\` of ${span} in "${fieldId}" is not a whole number, which this theme's grid needs`,
    );
  }
  const spanStyle = spanned && !ownsWidth ? { gridColumn: `span ${span} / span ${span}`, ...style } : style;
  return (
    <div
      // `:where()` drops the default's specificity to zero, so any `col-span-*` a child has of its own wins
      className={cn('grid gap-2', twelveTracks && 'grid-cols-12 [:where(&)>*]:col-span-full', className)}
      style={spanStyle}
      {...rest}
    >
      {children}
    </div>
  );
}
