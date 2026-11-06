import type { AntdFormContext } from '../formContext.ts';

function spansFullRow(span: unknown): boolean {
  return Number(span) === 24;
}

/** Says whether the heading of an object or an array sits at the start of its column, the side of a field's label above
 * its control. An explicit `labelAlign` decides. Without one, antd starts the label of a column 24 wide, which is every
 * field's under the default `labelCol`, and ends the label of a narrower column, so the heading follows the labels.
 *
 * @param formContext - The `formContext` of the form
 * @returns - True if the heading starts its column
 */
export default function startAlignsHeading({ labelAlign, labelCol }: AntdFormContext): boolean {
  if (labelAlign !== undefined) {
    return labelAlign === 'left' || labelAlign === 'start';
  }
  return (
    labelCol === undefined ||
    spansFullRow(labelCol.span) ||
    spansFullRow(typeof labelCol.xl === 'object' ? labelCol.xl.span : labelCol.xl)
  );
}
