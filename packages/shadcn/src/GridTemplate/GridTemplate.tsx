import type { GridTemplateProps } from '@rjsf/utils';
import { logGridSpanWarning } from '@rjsf/utils';

import { cn } from '../lib/utils.ts';

const TEMPLATE_STYLES = ['gridTemplateColumns', 'gridTemplateAreas', 'gridTemplate', 'grid'] as const;

/** Renders a `GridTemplate` for shadcn, which is expecting the column sizing information coming in via the
 * `className` provided by the caller, merged onto the `div`'s own grid classes. A column's `span` is set as its
 * `grid-column` unless the column has a `col-span-*` class of its own, and a row without a `grid-cols-*` class or a
 * `gridTemplateColumns`, `gridTemplateAreas`, `gridTemplate` or `grid` style of its own lays out on 12 tracks, where
 * each child is full width unless it spans fewer.
 *
 * @param props - The GridTemplateProps, including the extra props containing the shadcn grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, className, fieldId, span, style, ...rest } = props;
  // shortcut: a row's template set through a class other than `grid-cols-*`, such as a named-lookup class, isn't seen,
  // so the row still gets the 12-track default and its children stack; detect it if that comes up
  const twelveTracks =
    !column && !/\bgrid-cols-/.test(className ?? '') && TEMPLATE_STYLES.every((key) => style?.[key] === undefined);
  // shortcut: detects a column's own width by its `col-span-` class only, so one set through `style` or a custom class
  // isn't warned about (a `gridColumn` style still wins); check `style` too if that comes up
  const ownsWidth = /\bcol-span-/.test(className ?? '');
  const spanned = column && span !== undefined;
  if (column) {
    logGridSpanWarning(fieldId, span, {
      ownWidth: ownsWidth ? 'a `col-span-*` class' : undefined,
      wholeSpansOnly: true,
    });
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
