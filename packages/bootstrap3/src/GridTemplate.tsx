import { GridTemplate as CoreGridTemplate } from '@rjsf/core';
import type { GridTemplateProps } from '@rjsf/utils';
import { joinClassNames, logGridSpanWarning } from '@rjsf/utils';

/** Renders `@rjsf/core`'s `GridTemplate` with a column's `span` as Bootstrap 3's `col-xs-*` class, since this theme
 * doesn't load the `rjsf.css` that reads core's `--rjsf-span`. A column with a `col-xs-*` class of its own keeps it in
 * place of its `span`, as the other themes' own width props win over it.
 *
 * @param props - The `GridTemplateProps`, with `column` for a column and its `span`
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { column, className, fieldId, span, ...rest } = props;
  // shortcut: detects a column's own width by a `col-xs-` class only, so one set through `style` isn't seen; check
  // `style` too if that comes up
  // The digit leaves out `col-xs-offset-*`, `col-xs-push-*` and `col-xs-pull-*`, which move a column without sizing it
  const ownsWidth = /\bcol-xs-\d/.test(className ?? '');
  const spanned = column && span !== undefined;
  if (column) {
    logGridSpanWarning(fieldId, span, { ownWidth: ownsWidth ? 'a `col-xs-*` class' : undefined, wholeSpansOnly: true });
  }
  const spanClassName = spanned && !ownsWidth ? `col-xs-${span}` : undefined;
  return <CoreGridTemplate column={column} className={joinClassNames(spanClassName, className)} {...rest} />;
}
