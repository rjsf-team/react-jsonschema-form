import logOnce from './logOnce.ts';

/** Logs, once, why a layout grid column's `span` won't lay out as given: it is ignored when the column has a width of
 * its own, which a theme's `GridTemplate` lets win over it, or else it isn't a whole number in a grid that needs one.
 *
 * @param fieldId - The column's `fieldId`, which the warning names
 * @param span - The column's `span`; nothing is logged without one
 * @param [options] - What the theme's grid makes of the `span`
 * @param [options.ownWidth] - What the column has of its own that wins over `span`, such as "a `size`", when it has one
 * @param [options.wholeSpansOnly=false] - Whether the theme's grid needs a whole number of twelfths
 */
export default function logGridSpanWarning(
  fieldId: string | undefined,
  span: number | undefined,
  { ownWidth, wholeSpansOnly = false }: { ownWidth?: string; wholeSpansOnly?: boolean } = {},
) {
  if (span === undefined) {
    return;
  }
  if (ownWidth) {
    logOnce(`A layout grid column's \`span\` in "${fieldId}" is ignored, since the column has ${ownWidth} of its own`);
  } else if (wholeSpansOnly && !Number.isInteger(span)) {
    logOnce(
      `A layout grid column's \`span\` of ${span} in "${fieldId}" is not a whole number, which this theme's grid needs`,
    );
  }
}
