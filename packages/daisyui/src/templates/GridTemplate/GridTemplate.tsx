import type { GridTemplateProps } from '@rjsf/utils';
import { logOnce } from '@rjsf/utils';

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
    if (span !== undefined && ownsWidth) {
      logOnce(`A layout grid column's \`span\` in "${fieldId}" is ignored, since the column has a width of its own`);
    }
    // The row's `gap-4` is 1rem, so a full row of spans fills it exactly
    const spanStyle =
      span === undefined || ownsWidth ? style : { flex: `0 0 calc((100% + 1rem) * ${span} / 12 - 1rem)`, ...style };
    // For columns, use DaisyUI's flex classes
    return (
      <div className={className ?? 'flex-grow'} style={spanStyle} {...rest}>
        {children}
      </div>
    );
  }

  // For rows, use DaisyUI's flex container with wrap
  return (
    <div className={className ?? 'flex flex-wrap gap-4'} style={style} {...rest}>
      {children}
    </div>
  );
}
