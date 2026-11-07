import classNames from 'classnames';

import { DEFAULT_LABEL_COL } from '../formContext.ts';
import type { AntdFormContext } from '../formContext.ts';

function spansFullRow(span: unknown): boolean {
  return Number(span) === 24;
}

/** Gets the class name of the column that holds the heading of an object or an array. The heading starts its column,
 * the side of a field's label above its control, when `labelAlign` says so. Without a `labelAlign`, antd starts the
 * label of a column 24 wide and ends the label of a narrower one, so the heading follows the labels.
 *
 * @param prefixCls - The prefix class name of antd's form
 * @param formContext - The `formContext` of the form
 * @returns - The class name of the heading's column
 */
export default function headingLabelColClassName(
  prefixCls: string,
  { labelAlign, labelCol = DEFAULT_LABEL_COL }: AntdFormContext,
): string {
  const labelClsBasic = `${prefixCls}-item-label`;
  const startAligns =
    labelAlign === undefined
      ? spansFullRow(labelCol.span) || spansFullRow(typeof labelCol.xl === 'object' ? labelCol.xl.span : labelCol.xl)
      : labelAlign === 'left' || labelAlign === 'start';
  return classNames(labelClsBasic, startAligns && `${labelClsBasic}-start ${labelClsBasic}-left`);
}
