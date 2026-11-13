import type { CSSProperties } from 'react';
import type { GridTemplateProps } from '@rjsf/utils';
import { logGridSpanWarning } from '@rjsf/utils';

/** Renders a `GridTemplate` for DaisyUI, which follows the same pattern as other RJSF themes.
 * This uses DaisyUI's grid system with flexbox for responsive layouts.
 *
 * @param props - The GridTemplateProps, including children and column flag
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, className, column, fieldId, span, style, ...rest } = props;

  if (column) {
    // shortcut: detects a width class by its `basis-` or `w-` prefix only, so a custom class setting one isn't seen; the
    // `[\s:]` keeps `max-w-*` and `min-w-*` out while letting a responsive `md:w-1/2` in
    const ownsWidth =
      style?.flex !== undefined ||
      style?.flexBasis !== undefined ||
      style?.width !== undefined ||
      /(?:^|[\s:])(?:basis|w)-/.test(className ?? '');
    logGridSpanWarning(fieldId, span, { ownWidth: ownsWidth ? 'a width' : undefined });
    // `minWidth` stops content wider than the span, such as an input or a long unbroken description, from widening the
    // column and wrapping the rest of the row, and `overflowWrap` stops that text painting over the next column instead;
    // `minWidth` is left off beside a `min-w-*` class, which an inline value would override
    // shortcut: a custom class setting min-width isn't seen and loses to the inline 0; widen the check if that comes up
    const minWidth = /(?:^|[\s:])min-w-/.test(className ?? '') ? undefined : 0;
    // The row's `gap-4` is 1rem, so a full row of spans fills it exactly
    const spanStyle: CSSProperties | undefined =
      span === undefined || ownsWidth
        ? style
        : { flex: `0 0 calc((100% + 1rem) * ${span} / 12 - 1rem)`, minWidth, overflowWrap: 'break-word', ...style };
    // For columns, use DaisyUI's flex classes
    return (
      <div className={className ?? 'flex-grow'} style={spanStyle} {...rest}>
        {children}
      </div>
    );
  }

  // For rows, use DaisyUI's flex container with wrap; `w-full` keeps a row nested in a row from shrinking to its content
  return (
    <div className={className ?? 'flex flex-wrap gap-4 w-full'} style={style} {...rest}>
      {children}
    </div>
  );
}
